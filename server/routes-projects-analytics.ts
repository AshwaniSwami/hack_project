import { Express, Request, Response } from "express";
import { eq, desc, and, gte, sql, count, sum } from "drizzle-orm";
import { db } from "./db";
import { downloadLogs, files, projects, episodes, scripts } from "@shared/schema";
import { isAuthenticated, isAdmin, type AuthenticatedRequest } from "./auth";

export function registerProjectAnalyticsRoutes(app: Express) {
  // Get project download analytics (admin only)
  app.get("/api/analytics/projects", isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { timeframe = '30d' } = req.query;
      
      // If database is not available, return mock data
      if (!db) {
        const mockProjectStats = [
          {
            projectId: "proj-001",
            projectName: "Morning Show Podcast",
            projectDescription: "Daily morning show podcast series",
            downloadCount: 245,
            totalDataDownloaded: 1288490188.8,
            uniqueDownloaders: 67,
            filesCount: 12,
            lastDownload: new Date().toISOString()
          },
          {
            projectId: "proj-002", 
            projectName: "Radio Drama Series",
            projectDescription: "Weekly radio drama episodes",
            downloadCount: 189,
            totalDataDownloaded: 994574745.6,
            uniqueDownloaders: 45,
            filesCount: 8,
            lastDownload: new Date(Date.now() - 86400000).toISOString()
          },
          {
            projectId: "proj-003",
            projectName: "Music Mix Show", 
            projectDescription: "Weekly music mix and commentary",
            downloadCount: 156,
            totalDataDownloaded: 821946982.4,
            uniqueDownloaders: 38,
            filesCount: 15,
            lastDownload: new Date(Date.now() - 172800000).toISOString()
          }
        ];
        
        return res.json({
          timeframe,
          startDate: new Date(Date.now() - (timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90) * 86400000),
          endDate: new Date(),
          projects: mockProjectStats
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

      // Get all projects with their names first
      const allProjects = await db
        .select({
          id: projects.id,
          name: projects.name,
          description: projects.description
        })
        .from(projects);

      // Create a map for quick project lookup
      const projectMap = new Map(allProjects.map(p => [p.id, p]));

      // Get download stats aggregated by project
      const projectDownloadStats = await db
        .select({
          projectId: sql<string>`CASE 
            WHEN ${files.entityType} = 'projects' THEN ${files.entityId}
            WHEN ${files.entityType} = 'episodes' THEN ${episodes.projectId}
            WHEN ${files.entityType} = 'scripts' THEN ${scripts.projectId}
            ELSE NULL
          END`,
          downloadCount: count(downloadLogs.id),
          totalDataDownloaded: sum(downloadLogs.downloadSize),
          uniqueDownloaders: sql<number>`COUNT(DISTINCT ${downloadLogs.userId})`,
          filesCount: sql<number>`COUNT(DISTINCT ${files.id})`,
          lastDownload: sql<string>`MAX(${downloadLogs.downloadedAt})`
        })
        .from(downloadLogs)
        .innerJoin(files, eq(downloadLogs.fileId, files.id))
        .leftJoin(episodes, and(
          eq(files.entityType, 'episodes'),
          eq(files.entityId, episodes.id)
        ))
        .leftJoin(scripts, and(
          eq(files.entityType, 'scripts'),
          eq(files.entityId, scripts.id)
        ))
        .where(and(
          gte(downloadLogs.downloadedAt, startDate),
          eq(files.isActive, true)
        ))
        .groupBy(sql`CASE 
          WHEN ${files.entityType} = 'projects' THEN ${files.entityId}
          WHEN ${files.entityType} = 'episodes' THEN ${episodes.projectId}
          WHEN ${files.entityType} = 'scripts' THEN ${scripts.projectId}
          ELSE NULL
        END`)
        .having(sql`CASE 
          WHEN ${files.entityType} = 'projects' THEN ${files.entityId}
          WHEN ${files.entityType} = 'episodes' THEN ${episodes.projectId}
          WHEN ${files.entityType} = 'scripts' THEN ${scripts.projectId}
          ELSE NULL
        END IS NOT NULL`)
        .orderBy(desc(count(downloadLogs.id)));

      // Combine project info with download stats
      const finalStats = projectDownloadStats.map(stat => {
        const project = projectMap.get(stat.projectId);
        return {
          projectId: stat.projectId,
          projectName: project?.name || 'Unknown Project',
          projectDescription: project?.description || '',
          downloadCount: stat.downloadCount || 0,
          totalDataDownloaded: stat.totalDataDownloaded || 0,
          uniqueDownloaders: stat.uniqueDownloaders || 0,
          filesCount: stat.filesCount || 0,
          lastDownload: stat.lastDownload
        };
      });

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