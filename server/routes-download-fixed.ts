import { Express, Request, Response } from "express";
import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { files, downloadLogs } from "@shared/schema";
import { isAuthenticated, type AuthenticatedRequest } from "./auth";
import { getFilePermissions } from "./filePermissions";

import { fileCache } from "./simple-cache";

function getCachedFile(fileId: string): Buffer | null {
  return fileCache.get(fileId);
}

function setCachedFile(fileId: string, buffer: Buffer): void {
  // Only cache files under 10MB to prevent memory issues
  if (buffer.length < 10 * 1024 * 1024) {
    fileCache.set(fileId, buffer);
  }
}

export function registerDownloadRoutes(app: Express) {
  app.get("/api/files/:fileId/download", async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { fileId } = req.params;
    
    try {
      // Check if user is authenticated
      const authModule = await import("./routes");
      const isAuthenticatedMiddleware = authModule.isAuthenticated;
      
      // For temporary auth, we'll check session directly
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      console.log(`[DOWNLOAD] ${fileId} requested by user ${req.session.userId}`);

      // Check cache first for file buffer
      let fileBuffer = getCachedFile(fileId);
      let fileRecord;

      if (!fileBuffer) {
        // Get file record from database
        const database = db;
        if (!database) {
          return res.status(500).json({ error: "Database not available" });
        }

        const fileResults = await database
          .select()
          .from(files)
          .where(eq(files.id, fileId))
          .limit(1);

        if (!fileResults || fileResults.length === 0) {
          return res.status(404).json({ error: "File not found" });
        }

        fileRecord = fileResults[0];

        if (!fileRecord.fileData) {
          return res.status(500).json({ error: "File data missing" });
        }

        // Decode file data efficiently
        try {
          console.log(`[DOWNLOAD] Decoding file data for ${fileId}`);
          fileBuffer = Buffer.from(fileRecord.fileData, 'base64');
          setCachedFile(fileId, fileBuffer);
          console.log(`[DOWNLOAD] File ${fileId} cached (${fileBuffer.length} bytes)`);
        } catch (decodeError) {
          console.error("File decode error:", decodeError);
          return res.status(500).json({ error: "File data corrupted" });
        }
      } else {
        console.log(`[DOWNLOAD] Cache hit for ${fileId} (${fileBuffer.length} bytes)`);
        // Still need file record for metadata
        const database = db;
        const fileResults = await database
          .select({
            id: files.id,
            filename: files.filename,
            originalName: files.originalName,
            mimeType: files.mimeType,
            fileSize: files.fileSize,
            entityType: files.entityType,
            entityId: files.entityId
          })
          .from(files)
          .where(eq(files.id, fileId))
          .limit(1);
        
        if (fileResults.length > 0) {
          fileRecord = fileResults[0];
        }
      }

      if (!fileRecord) {
        return res.status(404).json({ error: "File record not found" });
      }

      const downloadDuration = Date.now() - startTime;

      // Log download asynchronously (don't wait)
      setImmediate(async () => {
        try {
          const database = db;
          if (database) {
            const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
            const userAgent = req.get('User-Agent') || 'unknown';
            const refererPage = req.get('Referer') || 'direct';

            await database.insert(downloadLogs).values({
              fileId: fileRecord.id,
              userId: req.session?.userId || 'unknown',
              userEmail: 'temp-user@example.com', // Temporary for auth
              userName: 'Temp User',
              userRole: 'member',
              ipAddress: clientIp,
              userAgent: userAgent,
              downloadSize: fileRecord.fileSize || fileBuffer.length,
              downloadDuration: downloadDuration,
              downloadStatus: 'completed',
              entityType: fileRecord.entityType,
              entityId: fileRecord.entityId,
              refererPage: refererPage
            });

            // Update file stats
            await database
              .update(files)
              .set({
                downloadCount: sql`${files.downloadCount} + 1`,
                lastDownloadAt: new Date()
              })
              .where(eq(files.id, fileId));
          }
        } catch (logError) {
          console.error("Download logging failed:", logError);
        }
      });

      // Set optimal headers for file download
      const filename = fileRecord.originalName || fileRecord.filename;
      res.setHeader('Content-Type', fileRecord.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Content-Length', fileBuffer.length.toString());
      res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
      res.setHeader('X-Download-Time', `${downloadDuration}ms`);

      // Send file
      res.end(fileBuffer);
      console.log(`[DOWNLOAD] ${fileId} completed (${fileBuffer.length} bytes) in ${downloadDuration}ms`);

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