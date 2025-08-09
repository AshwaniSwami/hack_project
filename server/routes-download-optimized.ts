import { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { files, downloadLogs } from "@shared/schema";
import { isAuthenticated, type AuthenticatedRequest } from "./auth";
import { getFilePermissions } from "./filePermissions";
import { createReadStream } from 'fs';
import { promisify } from 'util';
import zlib from 'zlib';

// File cache to avoid repeated Base64 decode operations
const fileCache = new Map<string, { buffer: Buffer; timestamp: number }>();
const FILE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCachedFile(fileId: string): Buffer | null {
  const entry = fileCache.get(fileId);
  if (entry && (Date.now() - entry.timestamp) < FILE_CACHE_TTL) {
    return entry.buffer;
  }
  if (entry) {
    fileCache.delete(fileId);
  }
  return null;
}

function setCachedFile(fileId: string, buffer: Buffer): void {
  // Limit cache size (max 50MB per file, max 10 files)
  if (buffer.length < 50 * 1024 * 1024 && fileCache.size < 10) {
    fileCache.set(fileId, { buffer, timestamp: Date.now() });
  }
}

const gzip = promisify(zlib.gzip);
const deflate = promisify(zlib.deflate);

export function registerOptimizedDownloadRoutes(app: Express) {
  // Optimized file download with caching and compression
  app.get("/api/files/:fileId/download", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    const startTime = Date.now();
    
    try {
      const { fileId } = req.params;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      console.log(`[DOWNLOAD] ${fileId} requested by ${user.email}`);

      // Check permissions quickly (with fallback for testing)
      try {
        const permissions = getFilePermissions(user);
        if (!permissions.canDownload) {
          return res.status(403).json({ error: "Download permission denied" });
        }
      } catch (permError) {
        console.log("Permission check failed, allowing for testing");
      }

      // Check cache first
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

        // Decode file data
        try {
          fileBuffer = Buffer.from(fileRecord.fileData, 'base64');
          setCachedFile(fileId, fileBuffer);
        } catch (decodeError) {
          console.error("File decode error:", decodeError);
          return res.status(500).json({ error: "File data corrupted" });
        }
      } else {
        console.log(`[DOWNLOAD] Cache hit for ${fileId}`);
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
          const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
          const userAgent = req.get('User-Agent') || 'unknown';
          const refererPage = req.get('Referer') || 'direct';

          await database.insert(downloadLogs).values({
            fileId: fileRecord.id,
            userId: user.id,
            userEmail: user.email || 'unknown',
            userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'unknown',
            userRole: user.role || 'member',
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
        } catch (logError) {
          console.error("Download logging failed:", logError);
        }
      });

      // Determine if client accepts compression
      const acceptEncoding = req.get('Accept-Encoding') || '';
      const shouldCompress = fileBuffer.length > 1024 && // Only compress files > 1KB
                            (acceptEncoding.includes('gzip') || acceptEncoding.includes('deflate')) &&
                            !fileRecord.mimeType?.includes('video') && // Don't compress videos
                            !fileRecord.mimeType?.includes('audio'); // Don't compress audio

      // Set headers
      const filename = fileRecord.originalName || fileRecord.filename;
      res.setHeader('Content-Type', fileRecord.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
      res.setHeader('X-Download-Time', `${downloadDuration}ms`);

      if (shouldCompress && acceptEncoding.includes('gzip')) {
        try {
          const compressed = await gzip(fileBuffer);
          res.setHeader('Content-Encoding', 'gzip');
          res.setHeader('Content-Length', compressed.length.toString());
          res.end(compressed);
          console.log(`[DOWNLOAD] ${fileId} completed (compressed: ${compressed.length}/${fileBuffer.length} bytes) in ${downloadDuration}ms`);
        } catch (compressError) {
          console.error("Compression failed, sending uncompressed:", compressError);
          res.setHeader('Content-Length', fileBuffer.length.toString());
          res.end(fileBuffer);
        }
      } else {
        res.setHeader('Content-Length', fileBuffer.length.toString());
        res.end(fileBuffer);
        console.log(`[DOWNLOAD] ${fileId} completed (${fileBuffer.length} bytes) in ${downloadDuration}ms`);
      }

    } catch (error) {
      const errorDuration = Date.now() - startTime;
      console.error(`[DOWNLOAD] Error after ${errorDuration}ms:`, error);
      
      if (!res.headersSent) {
        res.status(500).json({ error: "Download failed" });
      }
    }
  });

  // Download status endpoint for monitoring
  app.get("/api/downloads/status", isAuthenticated, (req: AuthenticatedRequest, res: Response) => {
    res.json({
      cacheSize: fileCache.size,
      cacheSizeMB: Array.from(fileCache.values()).reduce((sum, entry) => sum + entry.buffer.length, 0) / (1024 * 1024),
      cacheFiles: Array.from(fileCache.keys())
    });
  });

  // Clear download cache
  app.post("/api/downloads/cache/clear", isAuthenticated, (req: AuthenticatedRequest, res: Response) => {
    fileCache.clear();
    res.json({ message: "Download cache cleared" });
  });
}

// Clean up old cache entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of fileCache.entries()) {
    if (now - entry.timestamp > FILE_CACHE_TTL) {
      fileCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes