import { Express, Request, Response } from "express";
import { Pool } from 'pg';
import { fileCache } from "./simple-cache";

// Direct database connection for downloads
function createDirectConnection() {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

function getCachedFile(fileId: string): Buffer | null {
  return fileCache.get(fileId);
}

function setCachedFile(fileId: string, buffer: Buffer): void {
  // Only cache files under 10MB to prevent memory issues
  if (buffer.length < 10 * 1024 * 1024) {
    fileCache.set(fileId, buffer);
  }
}

import { isAuthenticated } from "./auth";

export function registerDownloadRoutes(app: Express) {
  app.get("/api/files/:fileId/download", isAuthenticated, async (req: any, res: Response) => {
    const startTime = Date.now();
    const { fileId } = req.params;
    
    try {
      // User is already authenticated via middleware
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      console.log(`[DOWNLOAD] ${fileId} requested by ${user.email} (${user.id})`);

      // Check cache first for file buffer
      let fileBuffer = getCachedFile(fileId);
      let fileRecord;

      const pool = createDirectConnection();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }

      try {
        if (!fileBuffer) {
          // Get file record from database using direct SQL
          const fileResults = await pool.query(
            'SELECT id, filename, original_name, mime_type, file_size, entity_type, entity_id, file_data FROM files WHERE id = $1 LIMIT 1',
            [fileId]
          );

          if (!fileResults.rows || fileResults.rows.length === 0) {
            return res.status(404).json({ error: "File not found" });
          }

          fileRecord = fileResults.rows[0];

          if (!fileRecord.file_data) {
            return res.status(500).json({ error: "File data missing" });
          }

          // Decode file data efficiently
          try {
            console.log(`[DOWNLOAD] Decoding file data for ${fileId}`);
            fileBuffer = Buffer.from(fileRecord.file_data, 'base64');
            setCachedFile(fileId, fileBuffer);
            console.log(`[DOWNLOAD] File ${fileId} cached (${fileBuffer.length} bytes)`);
          } catch (decodeError) {
            console.error("File decode error:", decodeError);
            return res.status(500).json({ error: "File data corrupted" });
          }
        } else {
          console.log(`[DOWNLOAD] Cache hit for ${fileId} (${fileBuffer.length} bytes)`);
          // Still need file record for metadata
          const fileResults = await pool.query(
            'SELECT id, filename, original_name, mime_type, file_size, entity_type, entity_id FROM files WHERE id = $1 LIMIT 1',
            [fileId]
          );
          
          if (fileResults.rows.length > 0) {
            fileRecord = fileResults.rows[0];
          }
        }

        if (!fileRecord) {
          return res.status(404).json({ error: "File record not found" });
        }

        const downloadDuration = Date.now() - startTime;

        // Log download asynchronously (don't wait)
        setImmediate(async () => {
          try {
            const logPool = createDirectConnection();
            if (logPool) {
              const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
              const userAgent = req.get('User-Agent') || 'unknown';
              const refererPage = req.get('Referer') || 'direct';

              await logPool.query(`
                INSERT INTO download_logs (
                  file_id, user_id, user_email, user_name, user_role,
                  ip_address, user_agent, download_size, download_duration,
                  download_status, entity_type, entity_id, referer_page, downloaded_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
              `, [
                fileRecord.id,
                user.id,
                user.email || 'unknown@example.com',
                `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User',
                user.role || 'member',
                clientIp,
                userAgent,
                fileRecord.file_size || fileBuffer.length,
                downloadDuration,
                'completed',
                fileRecord.entity_type,
                fileRecord.entity_id,
                refererPage
              ]);

              // Update file stats
              await logPool.query(`
                UPDATE files 
                SET download_count = COALESCE(download_count, 0) + 1,
                    last_download_at = NOW()
                WHERE id = $1
              `, [fileId]);

              await logPool.end();
            }
          } catch (logError) {
            console.error("Download logging failed:", logError);
          }
        });

        // Set optimal headers for file download
        const filename = fileRecord.original_name || fileRecord.filename;
        res.setHeader('Content-Type', fileRecord.mime_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader('Content-Length', fileBuffer.length.toString());
        res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
        res.setHeader('X-Download-Time', `${downloadDuration}ms`);

        // Send file
        res.end(fileBuffer);
        console.log(`[DOWNLOAD] ${fileId} completed (${fileBuffer.length} bytes) in ${downloadDuration}ms`);

      } finally {
        await pool.end();
      }

    } catch (error) {
      const errorDuration = Date.now() - startTime;
      console.error(`[DOWNLOAD] Error after ${errorDuration}ms:`, error);
      
      if (!res.headersSent) {
        res.status(500).json({ error: "Download failed" });
      }
    }
  });

  // Download cache status
  app.get("/api/downloads/cache/status", async (req: Request, res: Response) => {
    res.json({
      cacheSize: fileCache.size(),
      message: "File cache status"
    });
  });
}