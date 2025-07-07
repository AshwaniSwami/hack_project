import { Express, Request, Response } from "express";
import { eq, desc, and, gte, sql, count, sum } from "drizzle-orm";
import { db } from "./db";
import { downloadLogs, files, users } from "@shared/schema";
import { isAuthenticated, isAdmin, type AuthenticatedRequest } from "./auth";

export function registerAnalyticsRoutes(app: Express) {
  // Get download analytics overview (admin only)
  app.get("/api/analytics/downloads/overview", isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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

      // Get most popular files with project info
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
          uniqueUsers: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`
        })
        .from(downloadLogs)
        .where(gte(downloadLogs.downloadedAt, startDate))
        .groupBy(sql`DATE(${downloadLogs.downloadedAt})`)
        .orderBy(sql`DATE(${downloadLogs.downloadedAt})`);

      res.json({
        timeframe,
        startDate,
        endDate: now,
        totalDownloads: totalDownloads[0]?.count || 0,
        uniqueDownloaders: uniqueDownloaders[0]?.count || 0,
        totalDataDownloaded: totalDataDownloaded[0]?.total || 0,
        popularFiles,
        downloadsByDay
      });
    } catch (error) {
      console.error("Error fetching download analytics:", error);
      res.status(500).json({ error: "Failed to fetch download analytics" });
    }
  });

  // Get user download history (admin only)
  app.get("/api/analytics/downloads/users", isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page = 1, limit = 20, search = '', timeframe = '30d' } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      startDate.setDate(now.getDate() - (timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90));

      let whereCondition = gte(downloadLogs.downloadedAt, startDate);
      
      if (search) {
        whereCondition = and(
          whereCondition,
          sql`(${downloadLogs.userEmail} ILIKE ${`%${search}%`} OR ${downloadLogs.userName} ILIKE ${`%${search}%`})`
        );
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
      const totalCount = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})` })
        .from(downloadLogs)
        .where(whereCondition);

      res.json({
        users: userDownloads,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount[0]?.count || 0,
          hasMore: offset + userDownloads.length < (totalCount[0]?.count || 0)
        }
      });
    } catch (error) {
      console.error("Error fetching user download analytics:", error);
      res.status(500).json({ error: "Failed to fetch user download analytics" });
    }
  });

  // Get detailed download logs (admin only)
  app.get("/api/analytics/downloads/logs", isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      startDate.setDate(now.getDate() - (timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90));

      let whereConditions = [gte(downloadLogs.downloadedAt, startDate)];
      
      if (fileId) {
        whereConditions.push(eq(downloadLogs.fileId, String(fileId)));
      }
      
      if (userId) {
        whereConditions.push(eq(downloadLogs.userId, String(userId)));
      }
      
      if (entityType) {
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
    } catch (error) {
      console.error("Error fetching download logs:", error);
      res.status(500).json({ error: "Failed to fetch download logs" });
    }
  });

  // Get file download statistics (admin only)
  app.get("/api/analytics/downloads/files", isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page = 1, limit = 20, entityType, sortBy = 'downloads' } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      let whereCondition = eq(files.isActive, true);
      if (entityType) {
        whereCondition = and(whereCondition, eq(files.entityType, String(entityType)));
      }

      let orderByClause;
      switch (sortBy) {
        case 'size':
          orderByClause = desc(sum(downloadLogs.downloadSize));
          break;
        case 'recent':
          orderByClause = desc(sql`MAX(${downloadLogs.downloadedAt})`);
          break;
        default:
          orderByClause = desc(count(downloadLogs.id));
      }

      const fileStats = await db
        .select({
          fileId: files.id,
          filename: files.filename,
          originalName: files.originalName,
          entityType: files.entityType,
          entityId: files.entityId,
          fileSize: files.fileSize,
          downloadCount: count(downloadLogs.id),
          totalDownloadSize: sum(downloadLogs.downloadSize),
          uniqueDownloaders: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`,
          lastDownload: sql<Date>`MAX(${downloadLogs.downloadedAt})`,
          createdAt: files.createdAt
        })
        .from(files)
        .leftJoin(downloadLogs, eq(files.id, downloadLogs.fileId))
        .where(whereCondition)
        .groupBy(
          files.id, 
          files.filename, 
          files.originalName, 
          files.entityType, 
          files.entityId,
          files.fileSize, 
          files.createdAt
        )
        .orderBy(orderByClause)
        .limit(Number(limit))
        .offset(offset);

      // Get total count for pagination
      const totalCount = await db
        .select({ count: count() })
        .from(files)
        .where(whereCondition);

      res.json({
        files: fileStats,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount[0]?.count || 0,
          hasMore: offset + fileStats.length < (totalCount[0]?.count || 0)
        }
      });
    } catch (error) {
      console.error("Error fetching file download statistics:", error);
      res.status(500).json({ error: "Failed to fetch file download statistics" });
    }
  });
}