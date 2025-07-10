import { Express, Request, Response } from "express";
import { eq, desc, and, gte, sql, count, sum } from "drizzle-orm";
import { db } from "./db";
import { downloadLogs, files, episodes, projects } from "@shared/schema";
import { isAuthenticated, isAdmin, type AuthenticatedRequest } from "./auth";

export function registerEpisodeAnalyticsRoutes(app: Express) {
  // Get episode download analytics (admin only)
  app.get("/api/analytics/episodes", isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { timeframe = '30d', projectId } = req.query;
      
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

      let whereConditions = [
        eq(files.entityType, 'episodes'),
        eq(files.isActive, true),
        gte(downloadLogs.downloadedAt, startDate)
      ];

      if (projectId) {
        whereConditions.push(eq(episodes.projectId, projectId));
      }

      // Get episode downloads grouped by project
      const episodeDownloadsByProject = await db
        .select({
          projectId: episodes.projectId,
          projectName: projects.name,
          episodeCount: sql<number>`COUNT(DISTINCT ${episodes.id})`,
          downloadCount: count(downloadLogs.id),
          totalDataDownloaded: sum(downloadLogs.downloadSize),
          uniqueDownloaders: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`,
          lastDownload: sql<Date>`MAX(${downloadLogs.downloadedAt})`
        })
        .from(files)
        .leftJoin(downloadLogs, and(
          eq(files.id, downloadLogs.fileId),
          gte(downloadLogs.downloadedAt, startDate)
        ))
        .leftJoin(episodes, eq(files.entityId, episodes.id))
        .leftJoin(projects, eq(episodes.projectId, projects.id))
        .where(and(...whereConditions))
        .groupBy(episodes.projectId, projects.name)
        .orderBy(desc(count(downloadLogs.id)));

      // Get individual episode downloads with project info
      const episodeStats = await db
        .select({
          episodeId: files.entityId,
          episodeTitle: episodes.title,
          episodeNumber: episodes.episodeNumber,
          projectId: episodes.projectId,
          projectName: projects.name,
          downloadCount: count(downloadLogs.id),
          lastDownload: sql<Date>`MAX(${downloadLogs.downloadedAt})`
        })
        .from(files)
        .leftJoin(downloadLogs, and(
          eq(files.id, downloadLogs.fileId),
          gte(downloadLogs.downloadedAt, startDate)
        ))
        .leftJoin(episodes, eq(files.entityId, episodes.id))
        .leftJoin(projects, eq(episodes.projectId, projects.id))
        .where(and(...whereConditions))
        .groupBy(files.entityId, episodes.title, episodes.episodeNumber, episodes.projectId, projects.name)
        .orderBy(desc(count(downloadLogs.id)));

      // Get top downloaded episode files
      const topEpisodeFiles = await db
        .select({
          fileId: files.id,
          filename: files.filename,
          originalName: files.originalName,
          episodeId: episodes.id,
          episodeTitle: episodes.title,
          projectId: episodes.projectId,
          projectName: projects.name,
          downloadCount: count(downloadLogs.id),
          totalSize: sum(downloadLogs.downloadSize),
          uniqueDownloaders: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`,
          lastDownload: sql<Date>`MAX(${downloadLogs.downloadedAt})`
        })
        .from(files)
        .leftJoin(downloadLogs, and(
          eq(files.id, downloadLogs.fileId),
          gte(downloadLogs.downloadedAt, startDate)
        ))
        .leftJoin(episodes, eq(files.entityId, episodes.id))
        .leftJoin(projects, eq(episodes.projectId, projects.id))
        .where(and(...whereConditions))
        .groupBy(files.id, files.filename, files.originalName, episodes.id, episodes.title, episodes.projectId, projects.name)
        .orderBy(desc(count(downloadLogs.id)))
        .limit(10);

      res.json({
        timeframe,
        startDate,
        endDate: now,
        episodeDownloadsByProject,
        episodes: episodeStats,
        topFiles: topEpisodeFiles
      });

    } catch (error) {
      console.error("Error fetching episode analytics:", error);
      res.status(500).json({ error: "Failed to fetch episode analytics" });
    }
  });

  // Get detailed analytics for a specific episode (admin only)
  app.get("/api/analytics/episodes/:episodeId", isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { episodeId } = req.params;
      const { timeframe = '30d' } = req.query;
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      startDate.setDate(now.getDate() - (timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90));

      // Get episode information
      const episode = await db
        .select({
          id: episodes.id,
          title: episodes.title,
          episodeNumber: episodes.episodeNumber,
          projectId: episodes.projectId,
          projectName: projects.name,
          createdAt: episodes.createdAt
        })
        .from(episodes)
        .leftJoin(projects, eq(episodes.projectId, projects.id))
        .where(eq(episodes.id, episodeId))
        .limit(1);

      if (!episode || episode.length === 0) {
        return res.status(404).json({ error: "Episode not found" });
      }

      // Get file downloads for this episode
      const episodeFileDownloads = await db
        .select({
          fileId: downloadLogs.fileId,
          filename: files.filename,
          originalName: files.originalName,
          downloadCount: count(downloadLogs.id),
          totalSize: sum(downloadLogs.downloadSize),
          uniqueDownloaders: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`,
          lastDownload: sql<Date>`MAX(${downloadLogs.downloadedAt})`
        })
        .from(downloadLogs)
        .innerJoin(files, eq(downloadLogs.fileId, files.id))
        .where(and(
          eq(downloadLogs.entityId, episodeId),
          eq(downloadLogs.entityType, 'episodes'),
          gte(downloadLogs.downloadedAt, startDate)
        ))
        .groupBy(
          downloadLogs.fileId,
          files.filename,
          files.originalName
        )
        .orderBy(desc(count(downloadLogs.id)));

      // Get downloads by day for this episode
      const downloadsByDay = await db
        .select({
          date: sql<string>`DATE(${downloadLogs.downloadedAt})`,
          count: count(downloadLogs.id),
          uniqueUsers: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`
        })
        .from(downloadLogs)
        .where(and(
          eq(downloadLogs.entityId, episodeId),
          eq(downloadLogs.entityType, 'episodes'),
          gte(downloadLogs.downloadedAt, startDate)
        ))
        .groupBy(sql`DATE(${downloadLogs.downloadedAt})`)
        .orderBy(sql`DATE(${downloadLogs.downloadedAt})`);

      // Get top users for this episode
      const topUsers = await db
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
        .where(and(
          eq(downloadLogs.entityId, episodeId),
          eq(downloadLogs.entityType, 'episodes'),
          gte(downloadLogs.downloadedAt, startDate)
        ))
        .groupBy(
          downloadLogs.userId,
          downloadLogs.userEmail,
          downloadLogs.userName,
          downloadLogs.userRole
        )
        .orderBy(desc(count(downloadLogs.id)))
        .limit(10);

      res.json({
        episode: episode[0],
        timeframe,
        startDate,
        endDate: now,
        fileDownloads: episodeFileDownloads,
        downloadsByDay,
        topUsers
      });

    } catch (error) {
      console.error("Error fetching episode analytics:", error);
      res.status(500).json({ error: "Failed to fetch episode analytics" });
    }
  });
}