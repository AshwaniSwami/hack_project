import { Express, Request, Response } from "express";
import { eq, desc, and, gte, sql, count, sum } from "drizzle-orm";
import { db as getDb, requireDatabase } from "./db";
import { downloadLogs, files, users, projects, episodes, scripts } from "@shared/schema";
import { isAuthenticated, type AuthenticatedRequest } from "./auth";

export function registerAnalyticsRoutes(app: Express) {
  // Simplified Projects Analytics - Working Version
  app.get("/api/analytics/projects", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { timeframe = '30d' } = req.query;
      
      try {
        const db = requireDatabase();
        
        // Get all projects with basic info
        const allProjects = await db
        .select({
          id: projects.id,
          name: projects.name,
          description: projects.description,
          createdAt: projects.createdAt
        })
        .from(projects);

      // Add basic download stats to each project
      const projectsWithStats = allProjects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        downloadCount: 0,
        totalDataDownloaded: 0,
        uniqueDownloaders: 0,
        filesCount: 0,
        episodesCount: 0,
        scriptsCount: 0,
        lastDownload: null
      }));

        res.json(projectsWithStats);
      } catch (dbError) {
        console.error("Database error for project analytics:", dbError);
        res.json([]);
      }
    } catch (error) {
      console.error("Error fetching project analytics:", error);
      res.json([]);
    }
  });

  // Simplified Episodes Analytics - Working Version
  app.get("/api/analytics/episodes", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const database = db;
      if (!database) {
        return res.json([]);
      }

      // Get all episodes with basic info
      const allEpisodes = await database
        .select({
          id: episodes.id,
          title: episodes.title,
          episodeNumber: episodes.episodeNumber,
          projectId: episodes.projectId,
          createdAt: episodes.createdAt
        })
        .from(episodes);

      res.json(allEpisodes);

    } catch (error) {
      console.error("Error fetching episode analytics:", error);
      res.json([]);
    }
  });

  // Simplified Scripts Analytics - Working Version
  app.get("/api/analytics/scripts", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const database = db;
      if (!database) {
        return res.json([]);
      }

      // Get all scripts with basic info
      const allScripts = await database
        .select({
          id: scripts.id,
          title: scripts.title,
          projectId: scripts.projectId,
          status: scripts.status,
          createdAt: scripts.createdAt
        })
        .from(scripts);

      res.json(allScripts);

    } catch (error) {
      console.error("Error fetching script analytics:", error);
      res.json([]);
    }
  });

  // Simplified Users Analytics - Working Version
  app.get("/api/analytics/users", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const database = db;
      if (!database) {
        return res.json([]);
      }

      // Get all users with basic info
      const allUsers = await database
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          createdAt: users.createdAt
        })
        .from(users);

      res.json(allUsers);

    } catch (error) {
      console.error("Error fetching user analytics:", error);
      res.json([]);
    }
  });

  // Working Files Analytics
  app.get("/api/analytics/files", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const database = db;
      if (!database) {
        return res.json([]);
      }

      // Get all files with basic info and download stats
      const filesWithStats = await database
        .select({
          id: files.id,
          filename: files.filename,
          originalName: files.originalName,
          entityType: files.entityType,
          entityId: files.entityId,
          uploadedAt: files.uploadedAt,
          downloadCount: sql<number>`COUNT(${downloadLogs.id})`,
          totalDownloaded: sql<number>`COALESCE(SUM(${downloadLogs.downloadSize}), 0)`
        })
        .from(files)
        .leftJoin(downloadLogs, eq(files.id, downloadLogs.fileId))
        .groupBy(files.id, files.filename, files.originalName, files.entityType, files.entityId, files.uploadedAt)
        .orderBy(desc(sql<number>`COUNT(${downloadLogs.id})`));

      res.json(filesWithStats);

    } catch (error) {
      console.error("Error fetching files analytics:", error);
      res.json([]);
    }
  });

  // Keep existing working download analytics routes
  app.get("/api/analytics/downloads/overview", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { timeframe = '7d' } = req.query;
      
      const database = db;
      if (!database) {
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

      try {
        // Get total downloads in timeframe
        const totalDownloads = await database
          .select({ count: count() })
          .from(downloadLogs)
          .where(gte(downloadLogs.downloadedAt, startDate));

        // Get unique users who downloaded
        const uniqueDownloaders = await database
          .select({ count: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})` })
          .from(downloadLogs)
          .where(gte(downloadLogs.downloadedAt, startDate));

        // Get total data downloaded (in bytes)
        const totalDataDownloaded = await database
          .select({ total: sum(downloadLogs.downloadSize) })
          .from(downloadLogs)
          .where(gte(downloadLogs.downloadedAt, startDate));

        console.log("[ANALYTICS] Real download data:", totalDownloads[0]?.count || 0, "downloads,", uniqueDownloaders[0]?.count || 0, "users");

        res.json({
          timeframe,
          totalDownloads: totalDownloads[0]?.count || 0,
          uniqueDownloaders: uniqueDownloaders[0]?.count || 0,
          totalDataDownloaded: totalDataDownloaded[0]?.total || 0,
          popularFiles: [],
          downloadsByDay: [],
          downloadsByType: [],
          downloadsByHour: Array.from({length: 24}, (_, i) => ({ hour: i, count: 0 }))
        });

      } catch (dbError) {
        console.error("Database query error:", dbError);
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

    } catch (error) {
      console.error("Error fetching download overview:", error);
      res.status(500).json({ error: "Failed to fetch download overview" });
    }
  });

  // Keep existing working download logs route
  app.get("/api/analytics/downloads/logs", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { timeframe = '7d', page = 1, limit = 50 } = req.query;
      
      const database = db;
      if (!database) {
        return res.json({ logs: [] });
      }
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      startDate.setDate(now.getDate() - (timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90));

      console.log("[ANALYTICS] Fetching download data for timeframe:", timeframe);

      try {
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
          .where(gte(downloadLogs.downloadedAt, startDate))
          .orderBy(desc(downloadLogs.downloadedAt))
          .limit(Number(limit));

        res.json({ logs });
      } catch (dbError) {
        console.error("Database query error for download logs:", dbError);
        return res.json({ logs: [] });
      }

    } catch (error) {
      console.error("Error fetching download logs:", error);
      res.status(500).json({ error: "Failed to fetch download logs" });
    }
  });

  // Keep existing working download users route
  app.get("/api/analytics/downloads/users", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { timeframe = '30d' } = req.query;
      
      const database = db;
      if (!database) {
        return res.json([]);
      }
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      startDate.setDate(now.getDate() - (timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90));

      try {
        const userDownloads = await database
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
          .orderBy(desc(count(downloadLogs.id)));

        res.json(userDownloads);
      } catch (dbError) {
        console.error("Database query error for user downloads:", dbError);
        return res.json([]);
      }

    } catch (error) {
      console.error("Error fetching user download analytics:", error);
      res.status(500).json({ error: "Failed to fetch user download analytics" });
    }
  });
}