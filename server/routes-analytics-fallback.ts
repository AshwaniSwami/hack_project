import { Express, Request, Response } from "express";
import { getStorage } from "./storage";

export function registerFallbackAnalyticsRoutes(app: Express) {
  // Projects analytics with fallback data
  app.get("/api/analytics/projects", async (req: Request, res: Response) => {
    try {
      const storage = getStorage();
      const projects = await storage.getAllProjects();
      
      const projectStats = projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        episodeCount: Math.floor(Math.random() * 5) + 1,
        scriptCount: Math.floor(Math.random() * 3) + 1,
        downloadCount: Math.floor(Math.random() * 20) + 5,
        lastActivity: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
        createdAt: project.createdAt,
        themeColor: project.themeId === "demo-theme-1" ? "#0EA5E9" : "#10B981"
      }));

      res.json({
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.isActive).length,
        projectStats,
        message: "Demo data - database not connected"
      });
    } catch (error) {
      console.error("Project analytics error:", error);
      res.status(500).json({ 
        error: "Failed to fetch project analytics",
        totalProjects: 0,
        activeProjects: 0,
        projectStats: []
      });
    }
  });

  // Episodes analytics with fallback data  
  app.get("/api/analytics/episodes", async (req: Request, res: Response) => {
    try {
      const storage = getStorage();
      const episodes = await storage.getAllEpisodes();
      
      const episodeStats = episodes.map(episode => ({
        id: episode.id,
        title: episode.title,
        projectId: episode.projectId,
        scriptCount: Math.floor(Math.random() * 3) + 1,
        downloadCount: Math.floor(Math.random() * 15) + 2,
        viewCount: Math.floor(Math.random() * 50) + 10,
        duration: Math.floor(Math.random() * 1800) + 600, // 10-40 minutes
        createdAt: episode.createdAt,
        lastDownload: new Date(Date.now() - Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000))
      }));

      res.json({
        totalEpisodes: episodes.length,
        totalDownloads: episodeStats.reduce((sum, ep) => sum + ep.downloadCount, 0),
        averageDuration: Math.floor(episodeStats.reduce((sum, ep) => sum + ep.duration, 0) / episodes.length),
        episodeStats,
        message: "Demo data - database not connected"
      });
    } catch (error) {
      console.error("Episode analytics error:", error);
      res.status(500).json({ 
        error: "Failed to fetch episode analytics",
        totalEpisodes: 0,
        totalDownloads: 0,
        averageDuration: 0,
        episodeStats: []
      });
    }
  });

  // Scripts analytics with fallback data
  app.get("/api/analytics/scripts", async (req: Request, res: Response) => {
    try {
      const storage = getStorage();
      const scripts = await storage.getAllScripts();
      
      const scriptStats = scripts.map(script => ({
        id: script.id,
        title: script.title,
        projectId: script.projectId,
        authorId: script.authorId,
        status: script.status,
        language: script.language,
        downloadCount: Math.floor(Math.random() * 25) + 3,
        wordCount: Math.floor(Math.random() * 2000) + 500,
        readingTime: Math.floor((Math.floor(Math.random() * 2000) + 500) / 200), // ~200 words per minute
        createdAt: script.createdAt,
        updatedAt: script.updatedAt,
        lastDownload: new Date(Date.now() - Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000))
      }));

      const statusCounts = scripts.reduce((acc, script) => {
        acc[script.status] = (acc[script.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const languageCounts = scripts.reduce((acc, script) => {
        acc[script.language] = (acc[script.language] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      res.json({
        totalScripts: scripts.length,
        totalDownloads: scriptStats.reduce((sum, script) => sum + script.downloadCount, 0),
        averageWordCount: Math.floor(scriptStats.reduce((sum, script) => sum + script.wordCount, 0) / scripts.length),
        statusBreakdown: statusCounts,
        languageBreakdown: languageCounts,
        scriptStats,
        message: "Demo data - database not connected"
      });
    } catch (error) {
      console.error("Script analytics error:", error);
      res.status(500).json({ 
        error: "Failed to fetch script analytics",
        totalScripts: 0,
        totalDownloads: 0,
        averageWordCount: 0,
        statusBreakdown: {},
        languageBreakdown: {},
        scriptStats: []
      });
    }
  });

  // User downloads analytics with fallback data
  app.get("/api/analytics/downloads/users", async (req: Request, res: Response) => {
    try {
      const storage = getStorage();
      const users = await storage.getAllUsers();
      
      const userStats = users.map(user => ({
        userId: user.id,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`.trim(),
        userRole: user.role,
        downloadCount: Math.floor(Math.random() * 30) + 5,
        totalSize: Math.floor(Math.random() * 10000000) + 1000000, // 1-11MB
        lastDownload: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000))
      }));

      res.json(userStats);
    } catch (error) {
      console.error("User downloads analytics error:", error);
      res.status(500).json({ error: "Failed to fetch user download analytics" });
    }
  });

  // Download logs with fallback data
  app.get("/api/analytics/downloads/logs", async (req: Request, res: Response) => {
    try {
      const mockLogs = [
        {
          id: "log-1",
          fileId: "demo-file-1",
          filename: "health-script.pdf",
          originalName: "Health Awareness Script.pdf", 
          userId: "temp-admin-001",
          userEmail: "admin@example.com",
          userName: "Admin User",
          userRole: "admin",
          ipAddress: "127.0.0.1",
          downloadSize: 1024000,
          downloadDuration: 1500,
          downloadStatus: "completed",
          entityType: "script",
          refererPage: "/scripts",
          downloadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
          id: "log-2",
          fileId: "demo-file-2", 
          filename: "education-episode.mp3",
          originalName: "Digital Skills Episode.mp3",
          userId: "temp-admin-001",
          userEmail: "admin@example.com",
          userName: "Admin User", 
          userRole: "admin",
          ipAddress: "127.0.0.1",
          downloadSize: 1024576,
          downloadDuration: 2300,
          downloadStatus: "completed",
          entityType: "episode",
          refererPage: "/episodes",
          downloadedAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
        }
      ];

      res.json({
        logs: mockLogs,
        total: mockLogs.length,
        page: 1,
        limit: 50,
        message: "Demo data - database not connected"
      });
    } catch (error) {
      console.error("Download logs analytics error:", error);
      res.status(500).json({ error: "Failed to fetch download logs" });
    }
  });

  // File statistics with fallback data
  app.get("/api/analytics/downloads/files", async (req: Request, res: Response) => {
    try {
      const mockFileStats = [
        {
          fileId: "demo-file-1",
          filename: "health-script.pdf",
          originalName: "Health Awareness Script.pdf",
          entityType: "script",
          entityId: "demo-script-1",
          downloadCount: 8,
          totalSize: 1024000,
          averageDownloadTime: 1500,
          lastDownload: new Date(Date.now() - 2 * 60 * 60 * 1000),
          createdAt: new Date('2024-08-01')
        },
        {
          fileId: "demo-file-2",
          filename: "education-episode.mp3",
          originalName: "Digital Skills Episode.mp3", 
          entityType: "episode",
          entityId: "demo-episode-3",
          downloadCount: 4,
          totalSize: 1024576,
          averageDownloadTime: 2300,
          lastDownload: new Date(Date.now() - 4 * 60 * 60 * 1000),
          createdAt: new Date('2024-08-05')
        }
      ];

      res.json({
        files: mockFileStats,
        totalFiles: mockFileStats.length,
        totalDownloads: mockFileStats.reduce((sum, file) => sum + file.downloadCount, 0),
        totalSize: mockFileStats.reduce((sum, file) => sum + file.totalSize, 0),
        message: "Demo data - database not connected"
      });
    } catch (error) {
      console.error("File statistics error:", error);
      res.status(500).json({ error: "Failed to fetch file statistics" });
    }
  });
}