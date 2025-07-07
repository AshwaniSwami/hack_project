import { Express, Request, Response } from "express";
import { eq, desc, and, gte, sql, count, sum } from "drizzle-orm";
import { db } from "./db";
import { downloadLogs, files, scripts, projects } from "@shared/schema";
import { isAuthenticated, isAdmin, type AuthenticatedRequest } from "./auth";

export function registerScriptAnalyticsRoutes(app: Express) {
  // Get script download analytics (admin only)
  app.get("/api/analytics/scripts", isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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
        eq(files.entityType, 'scripts'),
        eq(files.isActive, true),
        gte(downloadLogs.downloadedAt, startDate)
      ];

      if (projectId) {
        whereConditions.push(sql`EXISTS (
          SELECT 1 FROM scripts 
          WHERE scripts.id = ${files.entityId} 
          AND scripts.project_id = ${projectId}
        )`);
      }

      // Get script download statistics with project info
      const scriptStats = await db
        .select({
          scriptId: files.entityId,
          scriptTitle: scripts.title,
          scriptStatus: scripts.status,
          projectId: scripts.projectId,
          projectName: projects.name,
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
        .leftJoin(scripts, eq(files.entityId, scripts.id))
        .leftJoin(projects, eq(scripts.projectId, projects.id))
        .where(and(...whereConditions))
        .groupBy(
          files.entityId, 
          scripts.title, 
          scripts.status, 
          scripts.projectId, 
          projects.name
        )
        .orderBy(desc(count(downloadLogs.id)));

      // Get script downloads by status
      const downloadsByStatus = await db
        .select({
          status: scripts.status,
          count: count(downloadLogs.id),
          totalSize: sum(downloadLogs.downloadSize)
        })
        .from(files)
        .leftJoin(downloadLogs, and(
          eq(files.id, downloadLogs.fileId),
          gte(downloadLogs.downloadedAt, startDate)
        ))
        .leftJoin(scripts, eq(files.entityId, scripts.id))
        .where(and(
          eq(files.entityType, 'scripts'),
          eq(files.isActive, true)
        ))
        .groupBy(scripts.status)
        .orderBy(desc(count(downloadLogs.id)));

      // Get script downloads by project
      const downloadsByProject = await db
        .select({
          projectId: scripts.projectId,
          projectName: projects.name,
          scriptCount: sql<number>`COUNT(DISTINCT ${scripts.id})`,
          downloadCount: count(downloadLogs.id),
          totalSize: sum(downloadLogs.downloadSize),
          uniqueDownloaders: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`
        })
        .from(files)
        .leftJoin(downloadLogs, and(
          eq(files.id, downloadLogs.fileId),
          gte(downloadLogs.downloadedAt, startDate)
        ))
        .leftJoin(scripts, eq(files.entityId, scripts.id))
        .leftJoin(projects, eq(scripts.projectId, projects.id))
        .where(and(
          eq(files.entityType, 'scripts'),
          eq(files.isActive, true)
        ))
        .groupBy(scripts.projectId, projects.name)
        .orderBy(desc(count(downloadLogs.id)));

      // Get most downloaded script files
      const topScriptFiles = await db
        .select({
          fileId: downloadLogs.fileId,
          filename: files.filename,
          originalName: files.originalName,
          scriptId: files.entityId,
          scriptTitle: scripts.title,
          projectName: projects.name,
          downloadCount: count(downloadLogs.id),
          totalSize: sum(downloadLogs.downloadSize)
        })
        .from(downloadLogs)
        .innerJoin(files, eq(downloadLogs.fileId, files.id))
        .leftJoin(scripts, eq(files.entityId, scripts.id))
        .leftJoin(projects, eq(scripts.projectId, projects.id))
        .where(and(
          eq(files.entityType, 'scripts'),
          gte(downloadLogs.downloadedAt, startDate)
        ))
        .groupBy(
          downloadLogs.fileId,
          files.filename,
          files.originalName,
          files.entityId,
          scripts.title,
          projects.name
        )
        .orderBy(desc(count(downloadLogs.id)))
        .limit(10);

      res.json({
        timeframe,
        startDate,
        endDate: now,
        scripts: scriptStats,
        downloadsByStatus,
        downloadsByProject,
        topScriptFiles
      });

    } catch (error) {
      console.error("Error fetching script analytics:", error);
      res.status(500).json({ error: "Failed to fetch script analytics" });
    }
  });

  // Get detailed analytics for a specific script (admin only)
  app.get("/api/analytics/scripts/:scriptId", isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { scriptId } = req.params;
      const { timeframe = '30d' } = req.query;
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      startDate.setDate(now.getDate() - (timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90));

      // Get script information
      const script = await db
        .select({
          id: scripts.id,
          title: scripts.title,
          status: scripts.status,
          projectId: scripts.projectId,
          projectName: projects.name,
          createdAt: scripts.createdAt
        })
        .from(scripts)
        .leftJoin(projects, eq(scripts.projectId, projects.id))
        .where(eq(scripts.id, scriptId))
        .limit(1);

      if (!script || script.length === 0) {
        return res.status(404).json({ error: "Script not found" });
      }

      // Get file downloads for this script
      const scriptFileDownloads = await db
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
          eq(downloadLogs.entityId, scriptId),
          eq(downloadLogs.entityType, 'scripts'),
          gte(downloadLogs.downloadedAt, startDate)
        ))
        .groupBy(
          downloadLogs.fileId,
          files.filename,
          files.originalName
        )
        .orderBy(desc(count(downloadLogs.id)));

      // Get downloads by day for this script
      const downloadsByDay = await db
        .select({
          date: sql<string>`DATE(${downloadLogs.downloadedAt})`,
          count: count(downloadLogs.id),
          uniqueUsers: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`
        })
        .from(downloadLogs)
        .where(and(
          eq(downloadLogs.entityId, scriptId),
          eq(downloadLogs.entityType, 'scripts'),
          gte(downloadLogs.downloadedAt, startDate)
        ))
        .groupBy(sql`DATE(${downloadLogs.downloadedAt})`)
        .orderBy(sql`DATE(${downloadLogs.downloadedAt})`);

      // Get top users for this script
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
          eq(downloadLogs.entityId, scriptId),
          eq(downloadLogs.entityType, 'scripts'),
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
        script: script[0],
        timeframe,
        startDate,
        endDate: now,
        fileDownloads: scriptFileDownloads,
        downloadsByDay,
        topUsers
      });

    } catch (error) {
      console.error("Error fetching script analytics:", error);
      res.status(500).json({ error: "Failed to fetch script analytics" });
    }
  });
}