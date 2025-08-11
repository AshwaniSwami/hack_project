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