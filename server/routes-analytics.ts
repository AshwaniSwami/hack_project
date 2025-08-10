
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
      
      console.log(`[ANALYTICS] Fetching download overview for timeframe: ${timeframe}`);
      
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

      // Check if database is available
      if (!db) {
        console.log("[ANALYTICS] No database connection, returning empty data");
        return res.json({
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

      try {
        // Get total downloads in timeframe
        const totalDownloads = await db
          .select({ count: count() })
          .from(downloadLogs)
          .where(gte(downloadLogs.downloadedAt, startDate));

        // Get unique users who downloaded
        const uniqueDownloaders = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})` })
          .from(downloadLogs)
          .where(gte(downloadLogs.downloadedAt, startDate));

        // Get total data downloaded (in bytes)
        const totalDataDownloaded = await db
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
            entityId: files.entityId,
            downloadCount: count(downloadLogs.id),
            totalSize: sum(downloadLogs.downloadSize)
          })
          .from(downloadLogs)
          .innerJoin(files, eq(downloadLogs.fileId, files.id))
          .where(gte(downloadLogs.downloadedAt, startDate))
          .groupBy(downloadLogs.fileId, files.filename, files.originalName, files.entityType, files.entityId)
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

        console.log(`[ANALYTICS] Retrieved data: ${totalDownloads[0]?.count || 0} downloads, ${uniqueDownloaders[0]?.count || 0} unique users`);

        res.json({
          timeframe,
          totalDownloads: totalDownloads[0]?.count || 0,
          uniqueDownloaders: uniqueDownloaders[0]?.count || 0,
          totalDataDownloaded: totalDataDownloaded[0]?.total || 0,
          popularFiles: popularFiles || [],
          downloadsByDay: downloadsByDay || [],
          downloadsByType: downloadsByType || [],
          downloadsByHour: downloadsByHour || []
        });

      } catch (dbError) {
        console.error("Database query error:", dbError);
        // Return empty data as fallback
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
      console.error("Error fetching download overview:", error);
      res.status(500).json({ error: "Failed to fetch download overview" });
    }
  });

  // Get user download history
  app.get("/api/analytics/downloads/users", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page = 1, limit = 20, search = '', timeframe = '30d' } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      if (!db) {
        return res.json({
          users: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            hasMore: false
          }
        });
      }
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      startDate.setDate(now.getDate() - (timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90));

      try {
        let whereCondition = gte(downloadLogs.downloadedAt, startDate);
        
        if (search) {
          const searchCondition = sql`(${downloadLogs.userEmail} ILIKE ${`%${search}%`} OR ${downloadLogs.userName} ILIKE ${`%${search}%`})`;
          whereCondition = and(whereCondition, searchCondition) || whereCondition;
        }

        const userDownloads = await db
          .select({
            userId: downloadLogs.userId,
            userEmail: downloadLogs.userEmail,
            userName: downloadLogs.userName,
            userRole: downloadLogs.userRole,
            downloadCount: count(downloadLogs.id),
            totalSize: sum(downloadLogs.downloadSize),
            lastDownload: sql<Date>`MAX(${downloadLogs.downloadedAt})`
          })
          .from(downloadLogs)
          .where(whereCondition)
          .groupBy(
            downloadLogs.userId, 
            downloadLogs.userEmail, 
            downloadLogs.userName, 
            downloadLogs.userRole
          )
          .orderBy(desc(count(downloadLogs.id)))
          .limit(Number(limit))
          .offset(offset);

        // Get total count for pagination
        const totalCountResult = await db
          .select({ 
            userId: downloadLogs.userId,
            userEmail: downloadLogs.userEmail,
            userName: downloadLogs.userName,
            userRole: downloadLogs.userRole
          })
          .from(downloadLogs)
          .where(whereCondition)
          .groupBy(
            downloadLogs.userId, 
            downloadLogs.userEmail, 
            downloadLogs.userName, 
            downloadLogs.userRole
          );

        res.json({
          users: userDownloads,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: totalCountResult.length,
            hasMore: offset + userDownloads.length < totalCountResult.length
          }
        });
      } catch (dbError) {
        console.error("Database query error for user downloads:", dbError);
        return res.json({
          users: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            hasMore: false
          }
        });
      }

    } catch (error) {
      console.error("Error fetching user download statistics:", error);
      res.status(500).json({ error: "Failed to fetch user download statistics" });
    }
  });

  // Get download logs
  app.get("/api/analytics/downloads/logs", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { 
        page = 1, 
        limit = 50, 
        fileId, 
        userId, 
        entityType, 
        timeframe = '7d',
        status = 'all'
      } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      if (!db) {
        return res.json({
          logs: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            hasMore: false
          }
        });
      }
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      startDate.setDate(now.getDate() - (timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90));

      try {
        let whereConditions = [gte(downloadLogs.downloadedAt, startDate)];
        
        if (fileId) {
          whereConditions.push(eq(downloadLogs.fileId, String(fileId)));
        }
        
        if (userId) {
          whereConditions.push(eq(downloadLogs.userId, String(userId)));
        }
        
        if (entityType && entityType !== 'all') {
          whereConditions.push(eq(downloadLogs.entityType, String(entityType)));
        }
        
        if (status !== 'all') {
          whereConditions.push(eq(downloadLogs.downloadStatus, String(status)));
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
            entityId: downloadLogs.entityId,
            refererPage: downloadLogs.refererPage,
            downloadedAt: downloadLogs.downloadedAt
          })
          .from(downloadLogs)
          .innerJoin(files, eq(downloadLogs.fileId, files.id))
          .where(and(...whereConditions))
          .orderBy(desc(downloadLogs.downloadedAt))
          .limit(Number(limit))
          .offset(offset);

        // Get total count for pagination
        const totalCount = await db
          .select({ count: count() })
          .from(downloadLogs)
          .where(and(...whereConditions));

        res.json({
          logs,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: totalCount[0]?.count || 0,
            hasMore: offset + logs.length < (totalCount[0]?.count || 0)
          }
        });
      } catch (dbError) {
        console.error("Database query error for download logs:", dbError);
        return res.json({
          logs: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            hasMore: false
          }
        });
      }

    } catch (error) {
      console.error("Error fetching download logs:", error);
      res.status(500).json({ error: "Failed to fetch download logs" });
    }
  });

  // Get file download statistics
  app.get("/api/analytics/downloads/files", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page = 1, limit = 20, entityType = 'all', timeframe = '30d' } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      if (!db) {
        return res.json({
          files: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            hasMore: false
          }
        });
      }

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      startDate.setDate(now.getDate() - (timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90));

      try {
        let whereConditions = [gte(downloadLogs.downloadedAt, startDate)];
        
        if (entityType !== 'all') {
          whereConditions.push(eq(files.entityType, String(entityType)));
        }

        const fileStats = await db
          .select({
            fileId: downloadLogs.fileId,
            filename: files.filename,
            originalName: files.originalName,
            entityType: files.entityType,
            entityId: files.entityId,
            downloadCount: count(downloadLogs.id),
            totalDataDownloaded: sum(downloadLogs.downloadSize),
            uniqueDownloaders: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`,
            lastDownload: sql<Date>`MAX(${downloadLogs.downloadedAt})`
          })
          .from(downloadLogs)
          .innerJoin(files, eq(downloadLogs.fileId, files.id))
          .where(and(...whereConditions))
          .groupBy(
            downloadLogs.fileId,
            files.filename,
            files.originalName,
            files.entityType,
            files.entityId
          )
          .orderBy(desc(count(downloadLogs.id)))
          .limit(Number(limit))
          .offset(offset);

        // Get total count
        const totalCount = await db
          .selectDistinct({ fileId: downloadLogs.fileId })
          .from(downloadLogs)
          .innerJoin(files, eq(downloadLogs.fileId, files.id))
          .where(and(...whereConditions));

        res.json({
          files: fileStats,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: totalCount.length,
            hasMore: offset + fileStats.length < totalCount.length
          }
        });
      } catch (dbError) {
        console.error("Database query error for file stats:", dbError);
        return res.json({
          files: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            hasMore: false
          }
        });
      }

    } catch (error) {
      console.error("Error fetching file download statistics:", error);
      res.status(500).json({ error: "Failed to fetch file download statistics" });
    }
  });
}
