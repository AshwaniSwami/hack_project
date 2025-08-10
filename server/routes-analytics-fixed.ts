import { Express, Request, Response } from "express";
import { eq, desc, and, gte, sql, count, sum } from "drizzle-orm";
import { db } from "./db";
import { downloadLogs, files, users, projects, episodes, scripts } from "@shared/schema";
import { isAuthenticated, type AuthenticatedRequest } from "./auth";

export function registerAnalyticsRoutes(app: Express) {
  // Get download analytics overview
  app.get("/api/analytics/downloads/overview", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { timeframe = '7d' } = req.query;
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (timeframe) {
        case '24h':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      try {
        // Get total downloads in timeframe
        const totalDownloadsResult = await db
          .select({ count: count() })
          .from(downloadLogs)
          .where(gte(downloadLogs.downloadedAt, startDate));

        // Get unique users who downloaded
        const uniqueDownloadersResult = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})` })
          .from(downloadLogs)
          .where(gte(downloadLogs.downloadedAt, startDate));

        // Get total data downloaded (in bytes)
        const totalDataDownloadedResult = await db
          .select({ total: sum(downloadLogs.downloadSize) })
          .from(downloadLogs)
          .where(gte(downloadLogs.downloadedAt, startDate));

        // Get most popular files
        const popularFiles = await db
          .select({
            fileId: downloadLogs.fileId,
            filename: files.filename,
            originalName: files.originalName,
            entityType: files.entityType,
            downloadCount: count(downloadLogs.id),
            totalSize: sum(downloadLogs.downloadSize)
          })
          .from(downloadLogs)
          .innerJoin(files, eq(downloadLogs.fileId, files.id))
          .where(gte(downloadLogs.downloadedAt, startDate))
          .groupBy(downloadLogs.fileId, files.filename, files.originalName, files.entityType)
          .orderBy(desc(count(downloadLogs.id)))
          .limit(10);

        // Get downloads by day for chart
        const downloadsByDay = await db
          .select({
            date: sql<string>`DATE(${downloadLogs.downloadedAt})`,
            count: count(downloadLogs.id),
            uniqueUsers: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`,
            totalSize: sum(downloadLogs.downloadSize)
          })
          .from(downloadLogs)
          .where(gte(downloadLogs.downloadedAt, startDate))
          .groupBy(sql`DATE(${downloadLogs.downloadedAt})`)
          .orderBy(sql`DATE(${downloadLogs.downloadedAt})`);

        // Get downloads by entity type
        const downloadsByType = await db
          .select({
            entityType: downloadLogs.entityType,
            count: count(downloadLogs.id),
            totalSize: sum(downloadLogs.downloadSize)
          })
          .from(downloadLogs)
          .where(gte(downloadLogs.downloadedAt, startDate))
          .groupBy(downloadLogs.entityType)
          .orderBy(desc(count(downloadLogs.id)));

        // Get downloads by hour
        const downloadsByHour = await db
          .select({
            hour: sql<number>`EXTRACT(hour FROM ${downloadLogs.downloadedAt})`,
            count: count(downloadLogs.id)
          })
          .from(downloadLogs)
          .where(gte(downloadLogs.downloadedAt, startDate))
          .groupBy(sql`EXTRACT(hour FROM ${downloadLogs.downloadedAt})`)
          .orderBy(sql`EXTRACT(hour FROM ${downloadLogs.downloadedAt})`);

        console.log(`[ANALYTICS] Real download data: ${totalDownloadsResult[0]?.count || 0} downloads, ${uniqueDownloadersResult[0]?.count || 0} users`);

        res.json({
          timeframe,
          totalDownloads: totalDownloadsResult[0]?.count || 0,
          uniqueDownloaders: uniqueDownloadersResult[0]?.count || 0,
          totalDataDownloaded: totalDataDownloadedResult[0]?.total || 0,
          popularFiles: popularFiles || [],
          downloadsByDay: downloadsByDay || [],
          downloadsByType: downloadsByType || [],
          downloadsByHour: downloadsByHour || []
        });

      } catch (dbError) {
        console.error("[ANALYTICS] Database error:", dbError);
        // Return empty analytics instead of mock data
        res.json({
          timeframe,
          totalDownloads: 0,
          uniqueDownloaders: 0,
          totalDataDownloaded: 0,
          popularFiles: [],
          downloadsByDay: [],
          downloadsByType: [],
          downloadsByHour: Array.from({length: 24}, (_, i) => ({ hour: i, count: 0 }))
        });
      }

    } catch (error) {
      console.error("[ANALYTICS] Overview error:", error);
      res.status(500).json({ error: "Failed to fetch analytics overview" });
    }
  });

  // Get user download analytics
  app.get("/api/analytics/downloads/users", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { timeframe = '7d', search = '', limit = '50' } = req.query;
      
      const now = new Date();
      let startDate = new Date();
      
      switch (timeframe) {
        case '24h': startDate.setDate(now.getDate() - 1); break;
        case '7d': startDate.setDate(now.getDate() - 7); break;
        case '30d': startDate.setDate(now.getDate() - 30); break;
        case '90d': startDate.setDate(now.getDate() - 90); break;
        default: startDate.setDate(now.getDate() - 7);
      }

      try {
        let query = db
          .select({
            userId: downloadLogs.userId,
            userEmail: downloadLogs.userEmail,
            userName: downloadLogs.userName,
            userRole: downloadLogs.userRole,
            downloadCount: count(downloadLogs.id),
            totalSize: sum(downloadLogs.downloadSize),
            lastDownload: sql<string>`MAX(${downloadLogs.downloadedAt})`
          })
          .from(downloadLogs)
          .where(gte(downloadLogs.downloadedAt, startDate))
          .groupBy(downloadLogs.userId, downloadLogs.userEmail, downloadLogs.userName, downloadLogs.userRole)
          .orderBy(desc(count(downloadLogs.id)))
          .limit(parseInt(limit as string));

        const userDownloads = await query;

        res.json(userDownloads || []);

      } catch (dbError) {
        console.error("[ANALYTICS] User downloads database error:", dbError);
        res.json([]);
      }

    } catch (error) {
      console.error("[ANALYTICS] User downloads error:", error);
      res.status(500).json({ error: "Failed to fetch user downloads" });
    }
  });

  // Get download logs with pagination
  app.get("/api/analytics/downloads/logs", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { 
        timeframe = '7d', 
        entityType = 'all',
        status = 'all',
        page = '1',
        limit = '50'
      } = req.query;
      
      const now = new Date();
      let startDate = new Date();
      
      switch (timeframe) {
        case '24h': startDate.setDate(now.getDate() - 1); break;
        case '7d': startDate.setDate(now.getDate() - 7); break;
        case '30d': startDate.setDate(now.getDate() - 30); break;
        case '90d': startDate.setDate(now.getDate() - 90); break;
        default: startDate.setDate(now.getDate() - 7);
      }

      try {
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
        
        let whereConditions = [gte(downloadLogs.downloadedAt, startDate)];
        
        if (entityType !== 'all') {
          whereConditions.push(eq(downloadLogs.entityType, entityType as string));
        }
        
        if (status !== 'all') {
          whereConditions.push(eq(downloadLogs.downloadStatus, status as string));
        }

        const logs = await db
          .select({
            id: downloadLogs.id,
            fileId: downloadLogs.fileId,
            filename: files.filename,
            originalName: files.originalName,
            userId: downloadLogs.userId,
            userEmail: downloadLogs.userEmail,
            userName: downloadLogs.userName,
            userRole: downloadLogs.userRole,
            ipAddress: downloadLogs.ipAddress,
            downloadSize: downloadLogs.downloadSize,
            downloadDuration: downloadLogs.downloadDuration,
            downloadStatus: downloadLogs.downloadStatus,
            entityType: downloadLogs.entityType,
            refererPage: downloadLogs.refererPage,
            downloadedAt: downloadLogs.downloadedAt
          })
          .from(downloadLogs)
          .leftJoin(files, eq(downloadLogs.fileId, files.id))
          .where(and(...whereConditions))
          .orderBy(desc(downloadLogs.downloadedAt))
          .offset(offset)
          .limit(parseInt(limit as string));

        // Get total count for pagination
        const totalResult = await db
          .select({ count: count() })
          .from(downloadLogs)
          .where(and(...whereConditions));

        console.log(`[ANALYTICS] Fetching download data for timeframe: ${timeframe}`);

        res.json({
          logs: logs || [],
          total: totalResult[0]?.count || 0,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil((totalResult[0]?.count || 0) / parseInt(limit as string))
        });

      } catch (dbError) {
        console.error("[ANALYTICS] Download logs database error:", dbError);
        res.json({
          logs: [],
          total: 0,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: 0
        });
      }

    } catch (error) {
      console.error("[ANALYTICS] Download logs error:", error);
      res.status(500).json({ error: "Failed to fetch download logs" });
    }
  });

  // Get file analytics
  app.get("/api/analytics/downloads/files", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { timeframe = '7d', limit = '50' } = req.query;
      
      const now = new Date();
      let startDate = new Date();
      
      switch (timeframe) {
        case '24h': startDate.setDate(now.getDate() - 1); break;
        case '7d': startDate.setDate(now.getDate() - 7); break;
        case '30d': startDate.setDate(now.getDate() - 30); break;
        case '90d': startDate.setDate(now.getDate() - 90); break;
        default: startDate.setDate(now.getDate() - 7);
      }

      try {
        const fileAnalytics = await db
          .select({
            fileId: files.id,
            filename: files.filename,
            originalName: files.originalName,
            entityType: files.entityType,
            fileSize: files.fileSize,
            downloadCount: count(downloadLogs.id),
            totalSize: sum(downloadLogs.downloadSize),
            lastDownload: sql<string>`MAX(${downloadLogs.downloadedAt})`,
            uniqueDownloaders: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`
          })
          .from(files)
          .leftJoin(downloadLogs, and(
            eq(files.id, downloadLogs.fileId),
            gte(downloadLogs.downloadedAt, startDate)
          ))
          .groupBy(files.id, files.filename, files.originalName, files.entityType, files.fileSize)
          .orderBy(desc(count(downloadLogs.id)))
          .limit(parseInt(limit as string));

        res.json({
          files: fileAnalytics || []
        });

      } catch (dbError) {
        console.error("[ANALYTICS] File analytics database error:", dbError);
        res.json({ files: [] });
      }

    } catch (error) {
      console.error("[ANALYTICS] File analytics error:", error);
      res.status(500).json({ error: "Failed to fetch file analytics" });
    }
  });

  // Get entity analytics (projects, episodes, scripts)
  app.get("/api/analytics/entities", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      try {
        // Get projects with file and download counts
        const projectStats = await db
          .select({
            id: projects.id,
            title: projects.title,
            description: projects.description,
            entityType: sql<string>`'project'`,
            fileCount: count(files.id),
            downloadCount: count(downloadLogs.id),
            totalSize: sum(downloadLogs.downloadSize),
            lastActivity: sql<string>`MAX(COALESCE(${downloadLogs.downloadedAt}, ${projects.updatedAt}))`
          })
          .from(projects)
          .leftJoin(files, and(
            eq(files.entityType, 'project'),
            eq(files.entityId, projects.id)
          ))
          .leftJoin(downloadLogs, eq(downloadLogs.fileId, files.id))
          .groupBy(projects.id, projects.title, projects.description)
          .orderBy(desc(count(downloadLogs.id)));

        // Get episodes with file and download counts  
        const episodeStats = await db
          .select({
            id: episodes.id,
            title: episodes.title,
            description: episodes.description,
            entityType: sql<string>`'episode'`,
            fileCount: count(files.id),
            downloadCount: count(downloadLogs.id),
            totalSize: sum(downloadLogs.downloadSize),
            lastActivity: sql<string>`MAX(COALESCE(${downloadLogs.downloadedAt}, ${episodes.updatedAt}))`
          })
          .from(episodes)
          .leftJoin(files, and(
            eq(files.entityType, 'episode'),
            eq(files.entityId, episodes.id)
          ))
          .leftJoin(downloadLogs, eq(downloadLogs.fileId, files.id))
          .groupBy(episodes.id, episodes.title, episodes.description)
          .orderBy(desc(count(downloadLogs.id)));

        // Get scripts with file and download counts
        const scriptStats = await db
          .select({
            id: scripts.id,
            title: scripts.title,
            description: scripts.description,
            entityType: sql<string>`'script'`,
            fileCount: count(files.id),
            downloadCount: count(downloadLogs.id),
            totalSize: sum(downloadLogs.downloadSize),
            lastActivity: sql<string>`MAX(COALESCE(${downloadLogs.downloadedAt}, ${scripts.updatedAt}))`
          })
          .from(scripts)
          .leftJoin(files, and(
            eq(files.entityType, 'script'),
            eq(files.entityId, scripts.id)
          ))
          .leftJoin(downloadLogs, eq(downloadLogs.fileId, files.id))
          .groupBy(scripts.id, scripts.title, scripts.description)
          .orderBy(desc(count(downloadLogs.id)));

        res.json({
          projects: projectStats || [],
          episodes: episodeStats || [],
          scripts: scriptStats || []
        });

      } catch (dbError) {
        console.error("[ANALYTICS] Entity analytics database error:", dbError);
        res.json({
          projects: [],
          episodes: [],
          scripts: []
        });
      }

    } catch (error) {
      console.error("[ANALYTICS] Entity analytics error:", error);
      res.status(500).json({ error: "Failed to fetch entity analytics" });
    }
  });
}