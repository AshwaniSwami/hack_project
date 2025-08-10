import { Express, Request, Response } from "express";
import { eq, desc, and, gte, sql, count, sum } from "drizzle-orm";
import { requireDatabase } from "./db";
import { downloadLogs, files, users, projects, episodes, scripts } from "@shared/schema";
import { isAuthenticated, type AuthenticatedRequest } from "./auth";

export function registerCompleteAnalyticsRoutes(app: Express) {
  // Get projects analytics
  app.get("/api/analytics/projects", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const db = requireDatabase();
      
      // Get projects with their file and download statistics
      const projectAnalytics = await db
        .select({
          id: projects.id,
          title: projects.title,
          description: projects.description,
          themeId: projects.themeId,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
          fileCount: sql<number>`COUNT(DISTINCT ${files.id})`.as('fileCount'),
          downloadCount: sql<number>`COUNT(DISTINCT ${downloadLogs.id})`.as('downloadCount'),
          totalSize: sql<number>`COALESCE(SUM(${downloadLogs.downloadSize}), 0)`.as('totalSize'),
          uniqueDownloaders: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`.as('uniqueDownloaders'),
          lastDownload: sql<string>`MAX(${downloadLogs.downloadedAt})`.as('lastDownload')
        })
        .from(projects)
        .leftJoin(files, and(
          eq(files.entityType, 'project'),
          eq(files.entityId, projects.id)
        ))
        .leftJoin(downloadLogs, eq(downloadLogs.fileId, files.id))
        .groupBy(projects.id)
        .orderBy(desc(sql<number>`COUNT(DISTINCT ${downloadLogs.id})`));

      res.json(projectAnalytics || []);

    } catch (error) {
      console.error("[ANALYTICS] Projects error:", error);
      res.status(500).json({ error: "Failed to fetch project analytics" });
    }
  });

  // Get episodes analytics
  app.get("/api/analytics/episodes", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const db = requireDatabase();
      
      const episodeAnalytics = await db
        .select({
          id: episodes.id,
          title: episodes.title,
          description: episodes.description,
          projectId: episodes.projectId,
          duration: episodes.duration,
          createdAt: episodes.createdAt,
          updatedAt: episodes.updatedAt,
          fileCount: sql<number>`COUNT(DISTINCT ${files.id})`.as('fileCount'),
          downloadCount: sql<number>`COUNT(DISTINCT ${downloadLogs.id})`.as('downloadCount'),
          totalSize: sql<number>`COALESCE(SUM(${downloadLogs.downloadSize}), 0)`.as('totalSize'),
          uniqueDownloaders: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`.as('uniqueDownloaders'),
          lastDownload: sql<string>`MAX(${downloadLogs.downloadedAt})`.as('lastDownload')
        })
        .from(episodes)
        .leftJoin(files, and(
          eq(files.entityType, 'episode'),
          eq(files.entityId, episodes.id)
        ))
        .leftJoin(downloadLogs, eq(downloadLogs.fileId, files.id))
        .groupBy(episodes.id)
        .orderBy(desc(sql<number>`COUNT(DISTINCT ${downloadLogs.id})`));

      res.json(episodeAnalytics || []);

    } catch (error) {
      console.error("[ANALYTICS] Episodes error:", error);
      res.status(500).json({ error: "Failed to fetch episode analytics" });
    }
  });

  // Get scripts analytics
  app.get("/api/analytics/scripts", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const db = requireDatabase();
      
      const scriptAnalytics = await db
        .select({
          id: scripts.id,
          title: scripts.title,
          description: scripts.description,
          projectId: scripts.projectId,
          episodeId: scripts.episodeId,
          content: scripts.content,
          createdAt: scripts.createdAt,
          updatedAt: scripts.updatedAt,
          fileCount: sql<number>`COUNT(DISTINCT ${files.id})`.as('fileCount'),
          downloadCount: sql<number>`COUNT(DISTINCT ${downloadLogs.id})`.as('downloadCount'),
          totalSize: sql<number>`COALESCE(SUM(${downloadLogs.downloadSize}), 0)`.as('totalSize'),
          uniqueDownloaders: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`.as('uniqueDownloaders'),
          lastDownload: sql<string>`MAX(${downloadLogs.downloadedAt})`.as('lastDownload')
        })
        .from(scripts)
        .leftJoin(files, and(
          eq(files.entityType, 'script'),
          eq(files.entityId, scripts.id)
        ))
        .leftJoin(downloadLogs, eq(downloadLogs.fileId, files.id))
        .groupBy(scripts.id)
        .orderBy(desc(sql<number>`COUNT(DISTINCT ${downloadLogs.id})`));

      res.json(scriptAnalytics || []);

    } catch (error) {
      console.error("[ANALYTICS] Scripts error:", error);
      res.status(500).json({ error: "Failed to fetch script analytics" });
    }
  });

  // Get users analytics
  app.get("/api/analytics/users", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const db = requireDatabase();
      
      const userAnalytics = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          isApproved: users.isApproved,
          createdAt: users.createdAt,
          downloadCount: sql<number>`COUNT(DISTINCT ${downloadLogs.id})`.as('downloadCount'),
          totalDataDownloaded: sql<number>`COALESCE(SUM(${downloadLogs.downloadSize}), 0)`.as('totalDataDownloaded'),
          lastDownload: sql<string>`MAX(${downloadLogs.downloadedAt})`.as('lastDownload'),
          lastActivity: sql<string>`MAX(COALESCE(${downloadLogs.downloadedAt}, ${users.createdAt}))`.as('lastActivity')
        })
        .from(users)
        .leftJoin(downloadLogs, eq(downloadLogs.userId, users.id))
        .groupBy(users.id)
        .orderBy(desc(sql<number>`COUNT(DISTINCT ${downloadLogs.id})`));

      res.json(userAnalytics || []);

    } catch (error) {
      console.error("[ANALYTICS] Users error:", error);
      res.status(500).json({ error: "Failed to fetch user analytics" });
    }
  });

  // Get files analytics  
  app.get("/api/analytics/files", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const db = requireDatabase();
      
      const fileAnalytics = await db
        .select({
          id: files.id,
          filename: files.filename,
          originalName: files.originalName,
          mimeType: files.mimeType,
          fileSize: files.fileSize,
          entityType: files.entityType,
          entityId: files.entityId,
          createdAt: files.createdAt,
          downloadCount: sql<number>`COUNT(DISTINCT ${downloadLogs.id})`.as('downloadCount'),
          totalDataDownloaded: sql<number>`COALESCE(SUM(${downloadLogs.downloadSize}), 0)`.as('totalDataDownloaded'),
          uniqueDownloaders: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`.as('uniqueDownloaders'),
          lastDownload: sql<string>`MAX(${downloadLogs.downloadedAt})`.as('lastDownload')
        })
        .from(files)
        .leftJoin(downloadLogs, eq(downloadLogs.fileId, files.id))
        .groupBy(files.id)
        .orderBy(desc(sql<number>`COUNT(DISTINCT ${downloadLogs.id})`));

      res.json(fileAnalytics || []);

    } catch (error) {
      console.error("[ANALYTICS] Files error:", error);
      res.status(500).json({ error: "Failed to fetch file analytics" });
    }
  });
}