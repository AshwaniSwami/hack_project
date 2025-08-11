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

      console.log(`[ANALYTICS] Fetching overview for timeframe: ${timeframe}`);

      // Get database instance
      const database = db;
      if (!database) {
        console.log("[ANALYTICS] Database not available - returning fallback data");
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

      console.log(`[ANALYTICS] Date range: ${startDate.toISOString()} to ${now.toISOString()}`);

      try {
        // First check if download_logs table has any data
        const totalLogsCheck = await database
          .select({ count: count() })
          .from(downloadLogs);

        console.log(`[ANALYTICS] Total logs in database: ${totalLogsCheck[0]?.count || 0}`);

        // Get total downloads in timeframe
        const totalDownloadsResult = await database
          .select({ count: count() })
          .from(downloadLogs)
          .where(gte(downloadLogs.downloadedAt, startDate));

        console.log(`[ANALYTICS] Total downloads in timeframe: ${totalDownloadsResult[0]?.count || 0}`);

        // Get unique users who downloaded
        const uniqueDownloadersResult = await database
          .select({ count: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})` })
          .from(downloadLogs)
          .where(gte(downloadLogs.downloadedAt, startDate));

        // Get total data downloaded (in bytes)
        const totalDataDownloadedResult = await database
          .select({ total: sum(downloadLogs.downloadSize) })
          .from(downloadLogs)
          .where(gte(downloadLogs.downloadedAt, startDate));

        // Get most popular files with better error handling
        let popularFiles = [];
        try {
          popularFiles = await database
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
        } catch (filesError) {
          console.warn("[ANALYTICS] Error fetching popular files:", filesError);
          popularFiles = [];
        }

        // Get downloads by day for chart
        let downloadsByDay = [];
        try {
          downloadsByDay = await database
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
        } catch (dayError) {
          console.warn("[ANALYTICS] Error fetching downloads by day:", dayError);
          downloadsByDay = [];
        }

        // Get downloads by entity type
        let downloadsByType = [];
        try {
          downloadsByType = await database
            .select({
              entityType: downloadLogs.entityType,
              count: count(downloadLogs.id),
              totalSize: sum(downloadLogs.downloadSize)
            })
            .from(downloadLogs)
            .where(gte(downloadLogs.downloadedAt, startDate))
            .groupBy(downloadLogs.entityType)
            .orderBy(desc(count(downloadLogs.id)));
        } catch (typeError) {
          console.warn("[ANALYTICS] Error fetching downloads by type:", typeError);
          downloadsByType = [];
        }

        // Get downloads by hour with fallback
        let downloadsByHour = [];
        try {
          const hourlyData = await database
            .select({
              hour: sql<number>`EXTRACT(hour FROM ${downloadLogs.downloadedAt})`,
              count: count(downloadLogs.id)
            })
            .from(downloadLogs)
            .where(gte(downloadLogs.downloadedAt, startDate))
            .groupBy(sql`EXTRACT(hour FROM ${downloadLogs.downloadedAt})`)
            .orderBy(sql`EXTRACT(hour FROM ${downloadLogs.downloadedAt})`);

          // Fill in missing hours with 0 counts
          const hourlyMap = new Map(hourlyData.map(h => [h.hour, h.count]));
          downloadsByHour = Array.from({length: 24}, (_, hour) => ({
            hour,
            count: hourlyMap.get(hour) || 0
          }));
        } catch (hourError) {
          console.warn("[ANALYTICS] Error fetching downloads by hour:", hourError);
          downloadsByHour = Array.from({length: 24}, (_, hour) => ({ hour, count: 0 }));
        }

        const result = {
          timeframe,
          totalDownloads: Number(totalDownloadsResult[0]?.count || 0),
          uniqueDownloaders: Number(uniqueDownloadersResult[0]?.count || 0),
          totalDataDownloaded: Number(totalDataDownloadedResult[0]?.total || 0),
          popularFiles: popularFiles.map(file => ({
            ...file,
            downloadCount: Number(file.downloadCount || 0),
            totalSize: Number(file.totalSize || 0)
          })),
          downloadsByDay: downloadsByDay.map(day => ({
            ...day,
            count: Number(day.count || 0),
            uniqueUsers: Number(day.uniqueUsers || 0),
            totalSize: Number(day.totalSize || 0)
          })),
          downloadsByType: downloadsByType.map(type => ({
            ...type,
            count: Number(type.count || 0),
            totalSize: Number(type.totalSize || 0)
          })),
          downloadsByHour: downloadsByHour.map(hour => ({
            ...hour,
            count: Number(hour.count || 0)
          }))
        };

        console.log(`[ANALYTICS] Overview result:`, {
          totalDownloads: result.totalDownloads,
          uniqueDownloaders: result.uniqueDownloaders,
          totalDataDownloaded: result.totalDataDownloaded,
          popularFilesCount: result.popularFiles.length,
          downloadsByDayCount: result.downloadsByDay.length,
          downloadsByTypeCount: result.downloadsByType.length
        });

        res.json(result);
      } catch (dbError) {
        console.error("[ANALYTICS] Database query error:", dbError);
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
      console.error("[ANALYTICS] Error fetching download overview:", error);
      res.status(500).json({ 
        error: "Failed to fetch download overview",
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

  // Get user download history
  app.get("/api/analytics/downloads/users", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page = 1, limit = 20, search = '', timeframe = '30d' } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const database = db;
      if (!database) {
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

        const userDownloads = await database
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
        const totalCountResult = await database
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
        console.error("[ANALYTICS] Database query error for user downloads:", dbError);
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
      console.error("[ANALYTICS] Error fetching user download statistics:", error);
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

      const database = db;
      if (!database) {
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

        const logs = await database
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

        console.log(`[ANALYTICS] Download logs: ${logs.length} results`);

        // Get total count for pagination
        const totalCount = await database
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
        console.error("[ANALYTICS] Database query error for download logs:", dbError);
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
      console.error("[ANALYTICS] Error fetching download logs:", error);
      res.status(500).json({ error: "Failed to fetch download logs" });
    }
  });

  // Get file download statistics
  app.get("/api/analytics/downloads/files", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page = 1, limit = 20, entityType = 'all', timeframe = '30d' } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const database = db;
      if (!database) {
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

        const fileStats = await database
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
        const totalCount = await database
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
        console.error("[ANALYTICS] Database query error for file stats:", dbError);
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
      console.error("[ANALYTICS] Error fetching file download statistics:", error);
      res.status(500).json({ error: "Failed to fetch file download statistics" });
    }
  });

  // Project Analytics
  app.get("/api/analytics/projects", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { timeframe = '30d' } = req.query;

      const database = db;
      if (!database) {
        return res.json([]);
      }

      // Calculate date range
      const now = new Date();
      let startDate = new Date();

      switch (timeframe) {
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
          startDate.setDate(now.getDate() - 30);
      }

      try {
        // Get projects with download stats
        const projectStats = await database
          .select({
            id: projects.id,
            title: projects.title,
            description: projects.description,
            createdAt: projects.createdAt,
            fileCount: sql<number>`COALESCE(COUNT(DISTINCT ${files.id}), 0)`,
            downloadCount: sql<number>`COALESCE(COUNT(DISTINCT ${downloadLogs.id}), 0)`,
            totalSize: sql<number>`COALESCE(SUM(${downloadLogs.downloadSize}), 0)`,
            uniqueDownloaders: sql<number>`COALESCE(COUNT(DISTINCT ${downloadLogs.userId}), 0)`,
            lastDownload: sql<string>`MAX(${downloadLogs.downloadedAt})`
          })
          .from(projects)
          .leftJoin(files, eq(files.entityId, projects.id))
          .leftJoin(downloadLogs, and(
            eq(downloadLogs.fileId, files.id),
            gte(downloadLogs.downloadedAt, startDate)
          ))
          .groupBy(projects.id, projects.title, projects.description, projects.createdAt)
          .orderBy(desc(sql<number>`COALESCE(COUNT(DISTINCT ${downloadLogs.id}), 0)`));

        res.json(projectStats || []);

      } catch (dbError) {
        console.error("[ANALYTICS] Database error for project analytics:", dbError);
        res.json([]);
      }

    } catch (error) {
      console.error("[ANALYTICS] Error fetching project analytics:", error);
      res.status(500).json({ error: "Failed to fetch project analytics" });
    }
  });

  // Episode Analytics
  app.get("/api/analytics/episodes", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { timeframe = '30d', projectId } = req.query;

      const database = db;
      if (!database) {
        return res.json({
          episodes: [],
          episodeDownloadsByProject: []
        });
      }

      // Calculate date range
      const now = new Date();
      let startDate = new Date();

      switch (timeframe) {
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
          startDate.setDate(now.getDate() - 30);
      }

      try {
        let whereConditions = [
          eq(files.entityType, 'episodes'),
          gte(downloadLogs.downloadedAt, startDate)
        ];

        if (projectId) {
          whereConditions.push(eq(episodes.projectId, String(projectId)));
        }

        // Get episode downloads grouped by project
        const episodeDownloadsByProject = await database
          .select({
            projectId: episodes.projectId,
            projectName: projects.name,
            episodeCount: sql<number>`COUNT(DISTINCT ${episodes.id})`,
            downloadCount: count(downloadLogs.id),
            totalDataDownloaded: sum(downloadLogs.downloadSize),
            uniqueDownloaders: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`,
            lastDownload: sql<string>`MAX(${downloadLogs.downloadedAt})`
          })
          .from(files)
          .leftJoin(downloadLogs, eq(files.id, downloadLogs.fileId))
          .leftJoin(episodes, eq(files.entityId, episodes.id))
          .leftJoin(projects, eq(episodes.projectId, projects.id))
          .where(and(...whereConditions))
          .groupBy(episodes.projectId, projects.name)
          .orderBy(desc(count(downloadLogs.id)));

        // Get individual episode downloads
        const episodeStats = await database
          .select({
            episodeId: files.entityId,
            episodeTitle: episodes.title,
            episodeNumber: episodes.episodeNumber,
            projectId: episodes.projectId,
            projectName: projects.name,
            downloadCount: count(downloadLogs.id),
            totalDataDownloaded: sum(downloadLogs.downloadSize),
            uniqueDownloaders: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`,
            filesCount: sql<number>`COUNT(DISTINCT ${files.id})`,
            lastDownload: sql<string>`MAX(${downloadLogs.downloadedAt})`
          })
          .from(files)
          .leftJoin(downloadLogs, eq(files.id, downloadLogs.fileId))
          .leftJoin(episodes, eq(files.entityId, episodes.id))
          .leftJoin(projects, eq(episodes.projectId, projects.id))
          .where(and(...whereConditions))
          .groupBy(files.entityId, episodes.title, episodes.episodeNumber, episodes.projectId, projects.name)
          .orderBy(desc(count(downloadLogs.id)));

        res.json({
          timeframe,
          startDate,
          endDate: now,
          episodeDownloadsByProject,
          episodes: episodeStats
        });

      } catch (dbError) {
        console.error("[ANALYTICS] Database error for episode analytics:", dbError);
        res.json({
          timeframe,
          startDate,
          endDate: now,
          episodes: [],
          episodeDownloadsByProject: []
        });
      }

    } catch (error) {
      console.error("[ANALYTICS] Error fetching episode analytics:", error);
      res.status(500).json({ error: "Failed to fetch episode analytics" });
    }
  });

  // Script Analytics
  app.get("/api/analytics/scripts", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { timeframe = '30d', projectId } = req.query;

      const database = db;
      if (!database) {
        return res.json({
          scripts: [],
          scriptDownloadsByProject: []
        });
      }

      // Calculate date range
      const now = new Date();
      let startDate = new Date();

      switch (timeframe) {
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
          startDate.setDate(now.getDate() - 30);
      }

      try {
        let whereConditions = [
          eq(files.entityType, 'scripts'),
          gte(downloadLogs.downloadedAt, startDate)
        ];

        if (projectId) {
          whereConditions.push(eq(scripts.projectId, String(projectId)));
        }

        // Get script downloads grouped by project
        const scriptDownloadsByProject = await database
          .select({
            projectId: scripts.projectId,
            projectName: projects.name,
            scriptCount: sql<number>`COUNT(DISTINCT ${scripts.id})`,
            downloadCount: count(downloadLogs.id),
            totalDataDownloaded: sum(downloadLogs.downloadSize),
            uniqueDownloaders: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`,
            lastDownload: sql<string>`MAX(${downloadLogs.downloadedAt})`
          })
          .from(files)
          .leftJoin(downloadLogs, eq(files.id, downloadLogs.fileId))
          .leftJoin(scripts, eq(files.entityId, scripts.id))
          .leftJoin(projects, eq(scripts.projectId, projects.id))
          .where(and(...whereConditions))
          .groupBy(scripts.projectId, projects.name)
          .orderBy(desc(count(downloadLogs.id)));

        // Get individual script downloads
        const scriptStats = await database
          .select({
            scriptId: files.entityId,
            scriptTitle: scripts.title,
            projectId: scripts.projectId,
            projectName: projects.name,
            downloadCount: count(downloadLogs.id),
            totalDataDownloaded: sum(downloadLogs.downloadSize),
            uniqueDownloaders: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`,
            lastDownload: sql<string>`MAX(${downloadLogs.downloadedAt})`
          })
          .from(files)
          .leftJoin(downloadLogs, eq(files.id, downloadLogs.fileId))
          .leftJoin(scripts, eq(files.entityId, scripts.id))
          .leftJoin(projects, eq(scripts.projectId, projects.id))
          .where(and(...whereConditions))
          .groupBy(files.entityId, scripts.title, scripts.projectId, projects.name)
          .orderBy(desc(count(downloadLogs.id)));

        res.json({
          timeframe,
          startDate,
          endDate: now,
          scriptDownloadsByProject,
          scripts: scriptStats
        });

      } catch (dbError) {
        console.error("[ANALYTICS] Database error for script analytics:", dbError);
        res.json({
          timeframe,
          startDate,
          endDate: now,
          scripts: [],
          scriptDownloadsByProject: []
        });
      }

    } catch (error) {
      console.error("[ANALYTICS] Error fetching script analytics:", error);
      res.status(500).json({ error: "Failed to fetch script analytics" });
    }
  });

  // Users Analytics
  app.get("/api/analytics/users", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const database = db;
      if (!database) {
        return res.json([]);
      }

      try {
        const userStats = await database
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            isApproved: users.isApproved,
            createdAt: users.createdAt,
            downloadCount: sql<number>`COALESCE(COUNT(DISTINCT ${downloadLogs.id}), 0)`,
            totalDataDownloaded: sql<number>`COALESCE(SUM(${downloadLogs.downloadSize}), 0)`,
            lastDownload: sql<string>`MAX(${downloadLogs.downloadedAt})`,
            lastActivity: sql<string>`MAX(COALESCE(${downloadLogs.downloadedAt}, ${users.createdAt}))`
          })
          .from(users)
          .leftJoin(downloadLogs, eq(downloadLogs.userId, users.id))
          .groupBy(users.id, users.email, users.name, users.role, users.isApproved, users.createdAt)
          .orderBy(desc(sql<number>`COALESCE(COUNT(DISTINCT ${downloadLogs.id}), 0)`));

        res.json(userStats || []);

      } catch (dbError) {
        console.error("[ANALYTICS] Database error for user analytics:", dbError);
        res.json([]);
      }

    } catch (error) {
      console.error("[ANALYTICS] Error fetching user analytics:", error);
      res.status(500).json({ error: "Failed to fetch user analytics" });
    }
  });

  // Files Analytics
  app.get("/api/analytics/files", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const database = db;
      if (!database) {
        return res.json([]);
      }

      try {
        const fileStats = await database
          .select({
            id: files.id,
            filename: files.filename,
            originalName: files.originalName,
            mimeType: files.mimeType,
            fileSize: files.fileSize,
            entityType: files.entityType,
            entityId: files.entityId,
            createdAt: files.createdAt,
            downloadCount: sql<number>`COALESCE(COUNT(DISTINCT ${downloadLogs.id}), 0)`,
            totalDataDownloaded: sql<number>`COALESCE(SUM(${downloadLogs.downloadSize}), 0)`,
            uniqueDownloaders: sql<number>`COALESCE(COUNT(DISTINCT ${downloadLogs.userId}), 0)`,
            lastDownload: sql<string>`MAX(${downloadLogs.downloadedAt})`
          })
          .from(files)
          .leftJoin(downloadLogs, eq(downloadLogs.fileId, files.id))
          .groupBy(files.id, files.filename, files.originalName, files.mimeType, files.fileSize, files.entityType, files.entityId, files.createdAt)
          .orderBy(desc(sql<number>`COALESCE(COUNT(DISTINCT ${downloadLogs.id}), 0)`));

        console.log(`[ANALYTICS] Found ${fileStats.length} files`);
        res.json(fileStats || []);

      } catch (dbError) {
        console.error("[ANALYTICS] Database error for file analytics:", dbError);
        res.json([]);
      }

    } catch (error) {
      console.error("[ANALYTICS] Error fetching file analytics:", error);
      res.status(500).json({ error: "Failed to fetch file analytics" });
    }
  });
}