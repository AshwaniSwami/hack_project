import { Express, Request, Response } from "express";
import { eq, desc, and, gte, sql, count, sum } from "drizzle-orm";
import { requireDatabase } from "./db";
import { downloadLogs, files, users, projects, episodes, scripts } from "@shared/schema";
import { isAuthenticated, type AuthenticatedRequest } from "./auth";

export function registerSimpleAnalyticsRoutes(app: Express) {
  // Get projects analytics - simplified
  app.get("/api/analytics/projects", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const db = requireDatabase();
      
      // Get basic projects data first
      const allProjects = await db.select().from(projects);
      
      // Then get download stats for each project
      const projectAnalytics = [];
      for (const project of allProjects) {
        // Get files for this project
        const projectFiles = await db
          .select()
          .from(files)
          .where(and(
            eq(files.entityType, 'project'),
            eq(files.entityId, project.id)
          ));

        // Get download logs for project files
        let downloadCount = 0;
        let totalSize = 0;
        let uniqueDownloaders = new Set();
        let lastDownload = null;

        for (const file of projectFiles) {
          const downloads = await db
            .select()
            .from(downloadLogs)
            .where(eq(downloadLogs.fileId, file.id));

          downloadCount += downloads.length;
          totalSize += downloads.reduce((sum, d) => sum + (d.downloadSize || 0), 0);
          downloads.forEach(d => uniqueDownloaders.add(d.userId));
          
          const fileLastDownload = downloads.reduce((latest, d) => {
            return (!latest || d.downloadedAt > latest) ? d.downloadedAt : latest;
          }, null);
          
          if (fileLastDownload && (!lastDownload || fileLastDownload > lastDownload)) {
            lastDownload = fileLastDownload;
          }
        }

        projectAnalytics.push({
          ...project,
          fileCount: projectFiles.length,
          downloadCount,
          totalSize,
          uniqueDownloaders: uniqueDownloaders.size,
          lastDownload
        });
      }

      res.json(projectAnalytics);

    } catch (error) {
      console.error("[ANALYTICS] Projects error:", error);
      res.status(500).json({ error: "Failed to fetch project analytics" });
    }
  });

  // Get episodes analytics - simplified
  app.get("/api/analytics/episodes", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const db = requireDatabase();
      
      const allEpisodes = await db.select().from(episodes);
      
      const episodeAnalytics = [];
      for (const episode of allEpisodes) {
        const episodeFiles = await db
          .select()
          .from(files)
          .where(and(
            eq(files.entityType, 'episode'),
            eq(files.entityId, episode.id)
          ));

        let downloadCount = 0;
        let totalSize = 0;
        let uniqueDownloaders = new Set();
        let lastDownload = null;

        for (const file of episodeFiles) {
          const downloads = await db
            .select()
            .from(downloadLogs)
            .where(eq(downloadLogs.fileId, file.id));

          downloadCount += downloads.length;
          totalSize += downloads.reduce((sum, d) => sum + (d.downloadSize || 0), 0);
          downloads.forEach(d => uniqueDownloaders.add(d.userId));
          
          const fileLastDownload = downloads.reduce((latest, d) => {
            return (!latest || d.downloadedAt > latest) ? d.downloadedAt : latest;
          }, null);
          
          if (fileLastDownload && (!lastDownload || fileLastDownload > lastDownload)) {
            lastDownload = fileLastDownload;
          }
        }

        episodeAnalytics.push({
          ...episode,
          fileCount: episodeFiles.length,
          downloadCount,
          totalSize,
          uniqueDownloaders: uniqueDownloaders.size,
          lastDownload
        });
      }

      res.json(episodeAnalytics);

    } catch (error) {
      console.error("[ANALYTICS] Episodes error:", error);
      res.status(500).json({ error: "Failed to fetch episode analytics" });
    }
  });

  // Get scripts analytics - simplified
  app.get("/api/analytics/scripts", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const db = requireDatabase();
      
      const allScripts = await db.select().from(scripts);
      
      const scriptAnalytics = [];
      for (const script of allScripts) {
        const scriptFiles = await db
          .select()
          .from(files)
          .where(and(
            eq(files.entityType, 'script'),
            eq(files.entityId, script.id)
          ));

        let downloadCount = 0;
        let totalSize = 0;
        let uniqueDownloaders = new Set();
        let lastDownload = null;

        for (const file of scriptFiles) {
          const downloads = await db
            .select()
            .from(downloadLogs)
            .where(eq(downloadLogs.fileId, file.id));

          downloadCount += downloads.length;
          totalSize += downloads.reduce((sum, d) => sum + (d.downloadSize || 0), 0);
          downloads.forEach(d => uniqueDownloaders.add(d.userId));
          
          const fileLastDownload = downloads.reduce((latest, d) => {
            return (!latest || d.downloadedAt > latest) ? d.downloadedAt : latest;
          }, null);
          
          if (fileLastDownload && (!lastDownload || fileLastDownload > lastDownload)) {
            lastDownload = fileLastDownload;
          }
        }

        scriptAnalytics.push({
          ...script,
          fileCount: scriptFiles.length,
          downloadCount,
          totalSize,
          uniqueDownloaders: uniqueDownloaders.size,
          lastDownload
        });
      }

      res.json(scriptAnalytics);

    } catch (error) {
      console.error("[ANALYTICS] Scripts error:", error);
      res.status(500).json({ error: "Failed to fetch script analytics" });
    }
  });

  // Get users analytics - simplified
  app.get("/api/analytics/users", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const db = requireDatabase();
      
      const allUsers = await db.select().from(users);
      
      const userAnalytics = [];
      for (const user of allUsers) {
        const userDownloads = await db
          .select()
          .from(downloadLogs)
          .where(eq(downloadLogs.userId, user.id));

        const downloadCount = userDownloads.length;
        const totalDataDownloaded = userDownloads.reduce((sum, d) => sum + (d.downloadSize || 0), 0);
        const lastDownload = userDownloads.reduce((latest, d) => {
          return (!latest || d.downloadedAt > latest) ? d.downloadedAt : latest;
        }, null);

        userAnalytics.push({
          ...user,
          downloadCount,
          totalDataDownloaded,
          lastDownload,
          lastActivity: lastDownload || user.createdAt
        });
      }

      res.json(userAnalytics);

    } catch (error) {
      console.error("[ANALYTICS] Users error:", error);
      res.status(500).json({ error: "Failed to fetch user analytics" });
    }
  });

  // Get files analytics - simplified
  app.get("/api/analytics/files", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const db = requireDatabase();
      
      const allFiles = await db.select().from(files);
      
      const fileAnalytics = [];
      for (const file of allFiles) {
        const fileDownloads = await db
          .select()
          .from(downloadLogs)
          .where(eq(downloadLogs.fileId, file.id));

        const downloadCount = fileDownloads.length;
        const totalDataDownloaded = fileDownloads.reduce((sum, d) => sum + (d.downloadSize || 0), 0);
        const uniqueDownloaders = new Set(fileDownloads.map(d => d.userId)).size;
        const lastDownload = fileDownloads.reduce((latest, d) => {
          return (!latest || d.downloadedAt > latest) ? d.downloadedAt : latest;
        }, null);

        fileAnalytics.push({
          ...file,
          downloadCount,
          totalDataDownloaded,
          uniqueDownloaders,
          lastDownload
        });
      }

      res.json(fileAnalytics);

    } catch (error) {
      console.error("[ANALYTICS] Files error:", error);
      res.status(500).json({ error: "Failed to fetch file analytics" });
    }
  });
}