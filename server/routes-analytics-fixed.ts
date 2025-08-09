import { Express, Request, Response } from "express";
import { eq, desc, and, gte, sql, count, sum } from "drizzle-orm";
import { downloadLogs, files, users } from "@shared/schema";

// Get database connection dynamically
async function getDatabase() {
  try {
    const { db } = await import("./db");
    // Call the function to get the actual database instance
    const database = typeof db === 'function' ? db() : db;
    console.log("Database instance type:", typeof database);
    return database;
  } catch (error) {
    console.error("Failed to get database connection:", error);
    return null;
  }
}

export function registerAnalyticsRoutes(app: Express) {
  // Get download analytics overview - REAL DATA ONLY
  app.get("/api/analytics/downloads/overview", async (req: Request, res: Response) => {
    try {
      // Check authentication via session
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { timeframe = '7d' } = req.query;
      
      // Get database instance dynamically
      const database = await getDatabase();
      if (!database) {
        return res.json({
          timeframe,
          totalDownloads: 0,
          uniqueDownloaders: 0,
          totalDataDownloaded: 0,
          popularFiles: [],
          downloadsByDay: [],
          downloadsByType: [],
          downloadsByHour: Array.from({length: 24}, (_, i) => ({
            hour: i,
            count: 0
          })),
          message: "Database not available - showing empty state"
        });
      }
      
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

      // Get total downloads in timeframe
      const totalDownloadsResult = await database
        .select({ count: count() })
        .from(downloadLogs)
        .where(gte(downloadLogs.createdAt, startDate));

      // Get unique downloaders count
      const uniqueDownloadersResult = await database
        .selectDistinct({ userId: downloadLogs.userId })
        .from(downloadLogs)
        .where(gte(downloadLogs.createdAt, startDate));

      // Get total data downloaded
      const totalDataResult = await database
        .select({ total: sum(downloadLogs.downloadSize) })
        .from(downloadLogs)
        .where(gte(downloadLogs.createdAt, startDate));

      // Get popular files
      const popularFilesResult = await database
        .select({
          fileId: downloadLogs.fileId,
          filename: files.filename,
          originalName: files.originalName,
          entityType: downloadLogs.entityType,
          entityId: downloadLogs.entityId,
          downloadCount: count(),
          totalSize: sum(downloadLogs.downloadSize)
        })
        .from(downloadLogs)
        .leftJoin(files, eq(downloadLogs.fileId, files.id))
        .where(gte(downloadLogs.createdAt, startDate))
        .groupBy(downloadLogs.fileId, files.filename, files.originalName, downloadLogs.entityType, downloadLogs.entityId)
        .orderBy(desc(count()))
        .limit(10);

      // Get downloads by day
      const downloadsByDayResult = await database
        .select({
          date: sql`DATE(${downloadLogs.createdAt})`.as('date'),
          count: count(),
          uniqueUsers: sql`COUNT(DISTINCT ${downloadLogs.userId})`.as('uniqueUsers'),
          totalSize: sum(downloadLogs.downloadSize)
        })
        .from(downloadLogs)
        .where(gte(downloadLogs.createdAt, startDate))
        .groupBy(sql`DATE(${downloadLogs.createdAt})`)
        .orderBy(sql`DATE(${downloadLogs.createdAt})`);

      // Get downloads by entity type
      const downloadsByTypeResult = await database
        .select({
          entityType: downloadLogs.entityType,
          count: count(),
          totalSize: sum(downloadLogs.downloadSize)
        })
        .from(downloadLogs)
        .where(gte(downloadLogs.createdAt, startDate))
        .groupBy(downloadLogs.entityType)
        .orderBy(desc(count()));

      // Get downloads by hour
      const downloadsByHourResult = await database
        .select({
          hour: sql`EXTRACT(HOUR FROM ${downloadLogs.createdAt})`.as('hour'),
          count: count()
        })
        .from(downloadLogs)
        .where(gte(downloadLogs.createdAt, startDate))
        .groupBy(sql`EXTRACT(HOUR FROM ${downloadLogs.createdAt})`)
        .orderBy(sql`EXTRACT(HOUR FROM ${downloadLogs.createdAt})`);

      // Format response with REAL data
      const response = {
        timeframe,
        totalDownloads: totalDownloadsResult[0]?.count || 0,
        uniqueDownloaders: uniqueDownloadersResult?.length || 0,
        totalDataDownloaded: Number(totalDataResult[0]?.total) || 0,
        popularFiles: popularFilesResult.map(file => ({
          fileId: file.fileId,
          filename: file.filename || 'Unknown file',
          originalName: file.originalName || file.filename || 'Unknown file',
          entityType: file.entityType,
          entityId: file.entityId,
          downloadCount: file.downloadCount,
          totalSize: Number(file.totalSize) || 0
        })),
        downloadsByDay: downloadsByDayResult.map(day => ({
          date: day.date,
          count: day.count,
          uniqueUsers: Number(day.uniqueUsers),
          totalSize: Number(day.totalSize) || 0
        })),
        downloadsByType: downloadsByTypeResult.map(type => ({
          entityType: type.entityType,
          count: type.count,
          totalSize: Number(type.totalSize) || 0
        })),
        downloadsByHour: Array.from({length: 24}, (_, hour) => {
          const found = downloadsByHourResult.find(h => Number(h.hour) === hour);
          return {
            hour,
            count: found ? found.count : 0
          };
        })
      };

      console.log(`[ANALYTICS] Returning real data: ${response.totalDownloads} downloads, ${response.uniqueDownloaders} users`);
      res.json(response);

    } catch (error) {
      console.error("Analytics overview error:", error);
      res.status(500).json({ 
        error: "Failed to fetch analytics",
        timeframe: req.query.timeframe || '7d',
        totalDownloads: 0,
        uniqueDownloaders: 0,
        totalDataDownloaded: 0,
        popularFiles: [],
        downloadsByDay: [],
        downloadsByType: [],
        downloadsByHour: Array.from({length: 24}, (_, i) => ({ hour: i, count: 0 }))
      });
    }
  });

  // Get general analytics overview - REAL DATA ONLY
  app.get("/api/analytics/overview", async (req: Request, res: Response) => {
    try {
      // Check authentication via session
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const database = await getDatabase();
      if (!database) {
        console.log("[ANALYTICS] Database not available, returning empty state");
        return res.json({
          totalUsers: 0,
          totalProjects: 0,
          totalFiles: 0,
          totalDownloads: 0,
          recentActivity: [],
          message: "Database not available - showing empty state"
        });
      }

      console.log("[ANALYTICS] Database available, fetching real data...");

      // Get real counts from database
      const [userCount, projectCount, fileCount, downloadCount] = await Promise.all([
        database.select({ count: count() }).from(users),
        // Note: We'll add project counts when projects table is available
        database.select({ count: count() }).from(files),
        database.select({ count: count() }).from(downloadLogs)
      ]);

      // Get recent download activity
      const recentActivity = await database
        .select({
          id: downloadLogs.id,
          type: sql`'download'`.as('type'),
          description: sql`CONCAT('Downloaded ', COALESCE(${files.originalName}, ${files.filename}, 'unknown file'))`.as('description'),
          timestamp: downloadLogs.createdAt,
          user: downloadLogs.userName,
          entityType: downloadLogs.entityType,
          entityId: downloadLogs.entityId
        })
        .from(downloadLogs)
        .leftJoin(files, eq(downloadLogs.fileId, files.id))
        .orderBy(desc(downloadLogs.createdAt))
        .limit(10);

      const response = {
        totalUsers: userCount[0]?.count || 0,
        totalProjects: 0, // Will be populated when projects are available
        totalFiles: fileCount[0]?.count || 0,
        totalDownloads: downloadCount[0]?.count || 0,
        recentActivity: recentActivity.map(activity => ({
          id: activity.id,
          type: activity.type,
          description: activity.description,
          timestamp: activity.timestamp,
          user: activity.user,
          entityType: activity.entityType,
          entityId: activity.entityId
        }))
      };

      console.log(`[ANALYTICS] Real overview data: ${response.totalUsers} users, ${response.totalFiles} files, ${response.totalDownloads} downloads`);
      res.json(response);

    } catch (error) {
      console.error("General analytics error:", error);
      res.status(500).json({ 
        error: "Failed to fetch overview analytics",
        totalUsers: 0,
        totalProjects: 0,
        totalFiles: 0,
        totalDownloads: 0,
        recentActivity: []
      });
    }
  });

  // File download analytics - REAL DATA ONLY
  app.get("/api/analytics/files/:fileId", async (req: Request, res: Response) => {
    try {
      // Check authentication via session
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { fileId } = req.params;
      const database = await getDatabase();
      
      if (!database) {
        return res.json({
          fileId,
          totalDownloads: 0,
          uniqueDownloaders: 0,
          downloadHistory: [],
          message: "Database not available"
        });
      }

      // Get file download stats
      const [downloadStats, uniqueStats, downloadHistory] = await Promise.all([
        database
          .select({ count: count(), totalSize: sum(downloadLogs.downloadSize) })
          .from(downloadLogs)
          .where(eq(downloadLogs.fileId, fileId)),
        
        database
          .selectDistinct({ userId: downloadLogs.userId })
          .from(downloadLogs)
          .where(eq(downloadLogs.fileId, fileId)),
        
        database
          .select({
            id: downloadLogs.id,
            userId: downloadLogs.userId,
            userName: downloadLogs.userName,
            userEmail: downloadLogs.userEmail,
            downloadSize: downloadLogs.downloadSize,
            downloadDuration: downloadLogs.downloadDuration,
            ipAddress: downloadLogs.ipAddress,
            userAgent: downloadLogs.userAgent,
            createdAt: downloadLogs.createdAt
          })
          .from(downloadLogs)
          .where(eq(downloadLogs.fileId, fileId))
          .orderBy(desc(downloadLogs.createdAt))
          .limit(50)
      ]);

      const response = {
        fileId,
        totalDownloads: downloadStats[0]?.count || 0,
        uniqueDownloaders: uniqueStats?.length || 0,
        totalDataTransferred: Number(downloadStats[0]?.totalSize) || 0,
        downloadHistory: downloadHistory.map(download => ({
          id: download.id,
          userId: download.userId,
          userName: download.userName,
          userEmail: download.userEmail,
          downloadSize: download.downloadSize,
          downloadDuration: download.downloadDuration,
          ipAddress: download.ipAddress,
          userAgent: download.userAgent,
          timestamp: download.createdAt
        }))
      };

      console.log(`[ANALYTICS] File ${fileId} real data: ${response.totalDownloads} downloads`);
      res.json(response);

    } catch (error) {
      console.error(`File analytics error for ${req.params.fileId}:`, error);
      res.status(500).json({ 
        error: "Failed to fetch file analytics",
        fileId: req.params.fileId,
        totalDownloads: 0,
        uniqueDownloaders: 0,
        downloadHistory: []
      });
    }
  });
}