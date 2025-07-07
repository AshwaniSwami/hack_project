import { Express, Request, Response } from "express";
import { eq, desc, and, gte, sql, count, sum } from "drizzle-orm";
import { db } from "./db";
import { downloadLogs, files, projects } from "@shared/schema";
import { isAuthenticated, isAdmin, type AuthenticatedRequest } from "./auth";

export function registerProjectAnalyticsRoutes(app: Express) {
  // Get project download analytics (admin only)
  app.get("/api/analytics/projects", isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { timeframe = '30d' } = req.query;
      
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

      // Get project download statistics
      const projectStats = await db
        .select({
          projectId: files.entityId,
          projectName: projects.name,
          projectDescription: projects.description,
          downloadCount: count(downloadLogs.id),
          totalDataDownloaded: sum(downloadLogs.downloadSize),
          uniqueDownloaders: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`,
          filesCount: sql<number>`COUNT(DISTINCT ${files.id})`,
          lastDownload: sql<Date>`MAX(${downloadLogs.downloadedAt})`,
          avgDownloadSize: sql<number>`AVG(${downloadLogs.downloadSize})`
        })
        .from(files)
        .leftJoin(downloadLogs, and(
          eq(files.id, downloadLogs.fileId),
          gte(downloadLogs.downloadedAt, startDate)
        ))
        .leftJoin(projects, eq(files.entityId, projects.id))
        .where(and(
          eq(files.entityType, 'projects'),
          eq(files.isActive, true)
        ))
        .groupBy(files.entityId, projects.name, projects.description)
        .orderBy(desc(count(downloadLogs.id)));

      // Get episode download statistics
      const episodeStats = await db
        .select({
          projectId: sql<string>`(SELECT project_id FROM episodes WHERE episodes.id = ${files.entityId})`,
          entityId: files.entityId,
          downloadCount: count(downloadLogs.id),
          totalDataDownloaded: sum(downloadLogs.downloadSize),
          uniqueDownloaders: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`,
          filesCount: sql<number>`COUNT(DISTINCT ${files.id})`,
          lastDownload: sql<Date>`MAX(${downloadLogs.downloadedAt})`
        })
        .from(files)
        .leftJoin(downloadLogs, and(
          eq(files.id, downloadLogs.fileId),
          gte(downloadLogs.downloadedAt, startDate)
        ))
        .where(and(
          eq(files.entityType, 'episodes'),
          eq(files.isActive, true)
        ))
        .groupBy(files.entityId);

      // Get script download statistics
      const scriptStats = await db
        .select({
          projectId: sql<string>`(SELECT project_id FROM scripts WHERE scripts.id = ${files.entityId})`,
          entityId: files.entityId,
          downloadCount: count(downloadLogs.id),
          totalDataDownloaded: sum(downloadLogs.downloadSize),
          uniqueDownloaders: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`,
          filesCount: sql<number>`COUNT(DISTINCT ${files.id})`,
          lastDownload: sql<Date>`MAX(${downloadLogs.downloadedAt})`
        })
        .from(files)
        .leftJoin(downloadLogs, and(
          eq(files.id, downloadLogs.fileId),
          gte(downloadLogs.downloadedAt, startDate)
        ))
        .where(and(
          eq(files.entityType, 'scripts'),
          eq(files.isActive, true)
        ))
        .groupBy(files.entityId);

      // Aggregate episode and script stats by project
      const projectAggregatedStats = new Map();

      // Initialize with direct project downloads
      projectStats.forEach(stat => {
        if (stat.projectId) {
          projectAggregatedStats.set(stat.projectId, {
            ...stat,
            episodeDownloads: 0,
            scriptDownloads: 0
          });
        }
      });

      // Add episode downloads to project totals
      episodeStats.forEach(stat => {
        if (stat.projectId) {
          const existing = projectAggregatedStats.get(stat.projectId) || {
            projectId: stat.projectId,
            projectName: 'Unknown Project',
            downloadCount: 0,
            totalDataDownloaded: 0,
            uniqueDownloaders: 0,
            filesCount: 0,
            episodeDownloads: 0,
            scriptDownloads: 0
          };
          
          existing.episodeDownloads += stat.downloadCount || 0;
          existing.downloadCount += stat.downloadCount || 0;
          existing.totalDataDownloaded += stat.totalDataDownloaded || 0;
          existing.filesCount += stat.filesCount || 0;
          
          projectAggregatedStats.set(stat.projectId, existing);
        }
      });

      // Add script downloads to project totals
      scriptStats.forEach(stat => {
        if (stat.projectId) {
          const existing = projectAggregatedStats.get(stat.projectId) || {
            projectId: stat.projectId,
            projectName: 'Unknown Project',
            downloadCount: 0,
            totalDataDownloaded: 0,
            uniqueDownloaders: 0,
            filesCount: 0,
            episodeDownloads: 0,
            scriptDownloads: 0
          };
          
          existing.scriptDownloads += stat.downloadCount || 0;
          existing.downloadCount += stat.downloadCount || 0;
          existing.totalDataDownloaded += stat.totalDataDownloaded || 0;
          existing.filesCount += stat.filesCount || 0;
          
          projectAggregatedStats.set(stat.projectId, existing);
        }
      });

      // Convert map to array and sort by download count
      const finalStats = Array.from(projectAggregatedStats.values())
        .sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));

      res.json({
        timeframe,
        startDate,
        endDate: now,
        projects: finalStats
      });

    } catch (error) {
      console.error("Error fetching project analytics:", error);
      res.status(500).json({ error: "Failed to fetch project analytics" });
    }
  });

  // Get detailed analytics for a specific project (admin only)
  app.get("/api/analytics/projects/:projectId", isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { projectId } = req.params;
      const { timeframe = '30d' } = req.query;
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      startDate.setDate(now.getDate() - (timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90));

      // Get project information
      const project = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project || project.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Get file downloads for this project (direct project files)
      const projectFileDownloads = await db
        .select({
          fileId: downloadLogs.fileId,
          filename: files.filename,
          originalName: files.originalName,
          entityType: downloadLogs.entityType,
          downloadCount: count(downloadLogs.id),
          totalSize: sum(downloadLogs.downloadSize),
          uniqueDownloaders: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`,
          lastDownload: sql<Date>`MAX(${downloadLogs.downloadedAt})`
        })
        .from(downloadLogs)
        .innerJoin(files, eq(downloadLogs.fileId, files.id))
        .where(and(
          eq(downloadLogs.entityId, projectId),
          gte(downloadLogs.downloadedAt, startDate)
        ))
        .groupBy(
          downloadLogs.fileId,
          files.filename,
          files.originalName,
          downloadLogs.entityType
        )
        .orderBy(desc(count(downloadLogs.id)));

      // Get downloads by day for this project
      const downloadsByDay = await db
        .select({
          date: sql<string>`DATE(${downloadLogs.downloadedAt})`,
          count: count(downloadLogs.id),
          uniqueUsers: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`
        })
        .from(downloadLogs)
        .where(and(
          eq(downloadLogs.entityId, projectId),
          gte(downloadLogs.downloadedAt, startDate)
        ))
        .groupBy(sql`DATE(${downloadLogs.downloadedAt})`)
        .orderBy(sql`DATE(${downloadLogs.downloadedAt})`);

      // Get top users for this project
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
          eq(downloadLogs.entityId, projectId),
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
        project: project[0],
        timeframe,
        startDate,
        endDate: now,
        fileDownloads: projectFileDownloads,
        downloadsByDay,
        topUsers
      });

    } catch (error) {
      console.error("Error fetching project analytics:", error);
      res.status(500).json({ error: "Failed to fetch project analytics" });
    }
  });
}