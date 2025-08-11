import { Express, Request, Response } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db } from "./db";
import { files, downloadLogs } from "@shared/schema";
import { isAuthenticated, type AuthenticatedRequest } from "./auth";
import { getFilePermissions } from "./filePermissions";

export function registerDownloadTrackingRoutes(app: Express) {
  // Enhanced file download endpoint with tracking
  app.get("/api/files/:fileId/download", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { fileId } = req.params;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check download permissions
      const permissions = getFilePermissions(user);
      if (!permissions.canDownload) {
        return res.status(403).json({ error: "Download permission denied" });
      }

      // Get file information
      const file = await db
        .select()
        .from(files)
        .where(eq(files.id, fileId))
        .limit(1);

      if (!file || file.length === 0) {
        return res.status(404).json({ error: "File not found" });
      }

      const fileRecord = file[0];
      const startTime = Date.now();

      // Prepare download log data
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      const refererPage = req.get('Referer') || req.headers.referer || 'direct';

      try {
        // Decode base64 file data
        const fileBuffer = Buffer.from(fileRecord.fileData, 'base64');

        // Calculate download duration
        const downloadDuration = Date.now() - startTime;

        // Log the download (if downloadLogs table exists)
        try {
          await db.insert(downloadLogs).values({
            fileId: fileRecord.id,
            userId: user.id,
            userEmail: user.email || 'unknown',
            userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'unknown',
            userRole: user.role || 'member',
            ipAddress: clientIp,
            userAgent: userAgent,
            downloadSize: fileRecord.fileSize,
            downloadDuration: downloadDuration,
            downloadStatus: 'completed',
            entityType: fileRecord.entityType,
            entityId: fileRecord.entityId,
            refererPage: refererPage
          });
        } catch (logError) {
          // Continue with download even if logging fails
          console.error("Download logging failed:", logError);
        }

        // Update file download count and last accessed time
        try {
          await db
            .update(files)
            .set({
              downloadCount: sql`${files.downloadCount} + 1`,
              lastAccessedAt: new Date()
            })
            .where(eq(files.id, fileId));
        } catch (updateError) {
          // Continue with download even if update fails
          console.error("Download count update failed:", updateError);
        }

        // Set appropriate headers for file download
        res.setHeader('Content-Type', fileRecord.mimeType);
        res.setHeader('Content-Length', fileRecord.fileSize);
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${encodeURIComponent(fileRecord.originalName)}"`
        );
        res.setHeader('Cache-Control', 'no-cache');

        // Send the file
        res.send(fileBuffer);

      } catch (downloadError) {
        // Log failed download
        const downloadDuration = Date.now() - startTime;
        try {
          await db.insert(downloadLogs).values({
            fileId: fileRecord.id,
            userId: user.id,
            userEmail: user.email || 'unknown',
            userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'unknown',
            userRole: user.role || 'member',
            ipAddress: clientIp,
            userAgent: userAgent,
            downloadSize: fileRecord.fileSize,
            downloadDuration: downloadDuration,
            downloadStatus: 'failed',
            entityType: fileRecord.entityType,
            entityId: fileRecord.entityId,
            refererPage: refererPage
          });
        } catch (logError) {
          console.error("Failed download logging failed:", logError);
        }

        console.error("Download error:", downloadError);
        res.status(500).json({ error: "Download failed" });
      }

    } catch (error) {
      console.error("Error processing download:", error);
      res.status(500).json({ error: "Failed to process download" });
    }
  });

  // Get file download statistics for a specific file
  app.get("/api/files/:fileId/download-stats", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { fileId } = req.params;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get file basic info and overall stats
      const file = await db
        .select({
          id: files.id,
          filename: files.filename,
          originalName: files.originalName,
          downloadCount: files.downloadCount,
          lastAccessedAt: files.lastAccessedAt,
          createdAt: files.createdAt
        })
        .from(files)
        .where(eq(files.id, fileId))
        .limit(1);

      if (!file || file.length === 0) {
        return res.status(404).json({ error: "File not found" });
      }

      // For admin/editor users, provide detailed stats
      if (user.role === 'admin' || user.role === 'editor') {
        // Get recent download activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentDownloads = await db
          .select({
            date: sql<string>`DATE(${downloadLogs.downloadedAt})`,
            downloadCount: sql<number>`COUNT(*)`,
            uniqueUsers: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`
          })
          .from(downloadLogs)
          .where(and(
            eq(downloadLogs.fileId, fileId),
            sql`${downloadLogs.downloadedAt} >= ${thirtyDaysAgo}`
          ))
          .groupBy(sql`DATE(${downloadLogs.downloadedAt})`)
          .orderBy(sql`DATE(${downloadLogs.downloadedAt})`);

        // Get top downloaders
        const topDownloaders = await db
          .select({
            userId: downloadLogs.userId,
            userEmail: downloadLogs.userEmail,
            userName: downloadLogs.userName,
            userRole: downloadLogs.userRole,
            downloadCount: sql<number>`COUNT(*)`,
            lastDownload: sql<Date>`MAX(${downloadLogs.downloadedAt})`
          })
          .from(downloadLogs)
          .where(eq(downloadLogs.fileId, fileId))
          .groupBy(
            downloadLogs.userId,
            downloadLogs.userEmail,
            downloadLogs.userName,
            downloadLogs.userRole
          )
          .orderBy(sql`COUNT(*) DESC`)
          .limit(10);

        res.json({
          file: file[0],
          recentDownloads,
          topDownloaders,
          isDetailedView: true
        });
      } else {
        // For regular members, only show basic info
        res.json({
          file: file[0],
          isDetailedView: false
        });
      }

    } catch (error) {
      console.error("Error fetching download stats:", error);
      res.status(500).json({ error: "Failed to fetch download statistics" });
    }
  });

  // Get user's personal download history
  app.get("/api/downloads/my-history", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const userDownloads = await db
        .select({
          id: downloadLogs.id,
          fileId: downloadLogs.fileId,
          filename: files.filename,
          originalName: files.originalName,
          entityType: downloadLogs.entityType,
          downloadSize: downloadLogs.downloadSize,
          downloadStatus: downloadLogs.downloadStatus,
          downloadedAt: downloadLogs.downloadedAt
        })
        .from(downloadLogs)
        .innerJoin(files, eq(downloadLogs.fileId, files.id))
        .where(eq(downloadLogs.userId, user.id))
        .orderBy(sql`${downloadLogs.downloadedAt} DESC`)
        .limit(Number(limit))
        .offset(offset);

      // Get total count for pagination
      const totalCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(downloadLogs)
        .where(eq(downloadLogs.userId, user.id));

      res.json({
        downloads: userDownloads,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount[0]?.count || 0,
          hasMore: offset + userDownloads.length < (totalCount[0]?.count || 0)
        }
      });

    } catch (error) {
      console.error("Error fetching user download history:", error);
      res.status(500).json({ error: "Failed to fetch download history" });
    }
  });
}
import { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { downloadLogs, files } from "@shared/schema";
import { eq } from "drizzle-orm";
import { isAuthenticated, type AuthenticatedRequest } from "./auth";

interface DownloadRequest extends AuthenticatedRequest {
  downloadStartTime?: number;
  downloadFileId?: string;
  downloadFileName?: string;
  downloadEntityType?: string;
  downloadEntityId?: string;
}

// Middleware to track download start
export function trackDownloadStart(req: DownloadRequest, res: Response, next: NextFunction) {
  req.downloadStartTime = Date.now();
  console.log(`[DOWNLOAD_TRACKING] Starting download tracking for ${req.path}`);
  next();
}

// Middleware to track download completion
export function trackDownloadEnd(req: DownloadRequest, res: Response, next: NextFunction) {
  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end;

  // Track when response is sent
  res.send = function(data: any) {
    logDownloadEvent(req, res, data);
    return originalSend.call(this, data);
  };

  res.json = function(data: any) {
    logDownloadEvent(req, res, data);
    return originalJson.call(this, data);
  };

  res.end = function(chunk?: any, encoding?: any) {
    logDownloadEvent(req, res, chunk);
    return originalEnd.call(this, chunk, encoding);
  };

  next();
}

async function logDownloadEvent(req: DownloadRequest, res: Response, data?: any) {
  try {
    // Only log successful downloads (status 200) and file routes
    if (res.statusCode !== 200 || !req.path.includes('/files/')) {
      return;
    }

    const database = db;
    if (!database) {
      console.log("[DOWNLOAD_TRACKING] Database not available");
      return;
    }

    // Extract file ID from path or query
    let fileId = req.params.fileId || req.query.fileId as string;
    
    // If no fileId in params, try to extract from path
    if (!fileId) {
      const pathParts = req.path.split('/');
      const filesIndex = pathParts.indexOf('files');
      if (filesIndex !== -1 && pathParts[filesIndex + 1]) {
        fileId = pathParts[filesIndex + 1];
      }
    }

    if (!fileId) {
      console.log("[DOWNLOAD_TRACKING] No file ID found in request");
      return;
    }

    // Get file details
    const file = await database
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (!file || file.length === 0) {
      console.log(`[DOWNLOAD_TRACKING] File not found: ${fileId}`);
      return;
    }

    const fileData = file[0];
    const downloadDuration = req.downloadStartTime ? Date.now() - req.downloadStartTime : 0;
    const downloadSize = fileData.fileSize || 0;
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

    // Create download log entry
    const downloadLog = {
      id: `download-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileId: fileData.id,
      userId: req.userId || 'anonymous',
      userEmail: req.userEmail || 'anonymous@unknown.com',
      userName: req.userName || 'Anonymous User',
      userRole: req.userRole || 'visitor',
      ipAddress: ipAddress.replace(/::ffff:/, ''), // Clean IPv4-mapped IPv6 addresses
      downloadSize: downloadSize,
      downloadDuration: downloadDuration,
      downloadStatus: res.statusCode === 200 ? 'completed' : 'failed',
      entityType: fileData.entityType,
      entityId: fileData.entityId,
      refererPage: req.get('Referer') || req.headers.referer as string || 'direct',
      userAgent: userAgent,
      downloadedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await database.insert(downloadLogs).values(downloadLog);

    console.log(`[DOWNLOAD_TRACKING] Successfully logged download:`, {
      fileId: downloadLog.fileId,
      fileName: fileData.originalName,
      userId: downloadLog.userId,
      downloadSize: downloadLog.downloadSize,
      downloadDuration: downloadLog.downloadDuration,
      status: downloadLog.downloadStatus
    });

  } catch (error) {
    console.error("[DOWNLOAD_TRACKING] Error logging download:", error);
  }
}

// Route to manually track downloads (for client-side initiated downloads)
export function registerDownloadTrackingRoutes(app: Express) {
  app.post("/api/analytics/track-download", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { fileId, downloadSize, downloadDuration, status = 'completed' } = req.body;

      if (!fileId) {
        return res.status(400).json({ error: "File ID is required" });
      }

      const database = db;
      if (!database) {
        return res.status(500).json({ error: "Database not available" });
      }

      // Get file details
      const file = await database
        .select()
        .from(files)
        .where(eq(files.id, fileId))
        .limit(1);

      if (!file || file.length === 0) {
        return res.status(404).json({ error: "File not found" });
      }

      const fileData = file[0];
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

      // Create download log entry
      const downloadLog = {
        id: `manual-download-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileId: fileData.id,
        userId: req.userId || 'anonymous',
        userEmail: req.userEmail || 'anonymous@unknown.com', 
        userName: req.userName || 'Anonymous User',
        userRole: req.userRole || 'visitor',
        ipAddress: ipAddress.replace(/::ffff:/, ''),
        downloadSize: downloadSize || fileData.fileSize || 0,
        downloadDuration: downloadDuration || 0,
        downloadStatus: status,
        entityType: fileData.entityType,
        entityId: fileData.entityId,
        refererPage: req.get('Referer') || 'manual-track',
        userAgent: req.get('User-Agent') || '',
        downloadedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await database.insert(downloadLogs).values(downloadLog);

      console.log(`[DOWNLOAD_TRACKING] Manually tracked download:`, {
        fileId: downloadLog.fileId,
        fileName: fileData.originalName,
        userId: downloadLog.userId,
        status: downloadLog.downloadStatus
      });

      res.json({ success: true, downloadId: downloadLog.id });

    } catch (error) {
      console.error("[DOWNLOAD_TRACKING] Error in manual tracking:", error);
      res.status(500).json({ error: "Failed to track download" });
    }
  });
}
