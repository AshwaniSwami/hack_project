import { Express, Request, Response } from "express";
import { eq, desc, and, gte, sql, count, sum } from "drizzle-orm";
import { db } from "./db";
import { files, projects, episodes, scripts } from "@shared/schema";
import { isAuthenticated, type AuthenticatedRequest } from "./auth";
// Import storage after it's initialized

// In-memory cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: any;
  timestamp: number;
}

function getCached(key: string): any | null {
  const entry: CacheEntry | undefined = cache.get(key);
  if (entry && (Date.now() - entry.timestamp) < CACHE_TTL) {
    return entry.data;
  }
  if (entry) {
    cache.delete(key);
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function registerOptimizedRoutes(app: Express) {
  // Optimized projects endpoint with pagination and caching
  app.get("/api/projects", async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const cacheKey = `projects:${page}:${limit}`;
      
      // Check cache first
      const cached = getCached(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const offset = (Number(page) - 1) * Number(limit);
      
      // Get projects with minimal data for listing
      const { storage } = await import("./storage");
      const projectsList = await storage.getAllProjects();
      const paginatedProjects = projectsList.slice(offset, offset + Number(limit));
      
      // Get project stats in batches for better performance
      const projectsWithStats = await Promise.all(
        paginatedProjects.map(async (project) => {
          try {
            const [episodeFiles, scriptFiles] = await Promise.all([
              storage.getFilesByEntity('episodes', project.id),
              storage.getFilesByEntity('scripts', project.id)
            ]);
            
            return {
              ...project,
              episodeCount: episodeFiles.length,
              scriptCount: scriptFiles.length,
              totalFiles: episodeFiles.length + scriptFiles.length
            };
          } catch (error) {
            // Return basic project info if stats fail
            return {
              ...project,
              episodeCount: 0,
              scriptCount: 0,
              totalFiles: 0
            };
          }
        })
      );

      const result = {
        projects: projectsWithStats,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: projectsList.length,
          hasMore: offset + projectsWithStats.length < projectsList.length
        }
      };

      setCache(cacheKey, result);
      res.json(result);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  // Optimized episodes endpoint
  app.get("/api/episodes", async (req: Request, res: Response) => {
    try {
      const { projectId, page = 1, limit = 20 } = req.query;
      const cacheKey = `episodes:${projectId}:${page}:${limit}`;
      
      const cached = getCached(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const offset = (Number(page) - 1) * Number(limit);
      let episodes;

      if (projectId) {
        episodes = await storage.getEpisodesByProject(String(projectId));
      } else {
        episodes = await storage.getAllEpisodes();
      }

      const paginatedEpisodes = episodes.slice(offset, offset + Number(limit));
      
      // Get file counts without loading file data
      const episodesWithStats = await Promise.all(
        paginatedEpisodes.map(async (episode) => {
          const files = await storage.getFilesByEntity('episodes', episode.id);
          return {
            ...episode,
            fileCount: files.length,
            totalSize: files.reduce((sum, file) => sum + (file.fileSize || 0), 0)
          };
        })
      );

      const result = {
        episodes: episodesWithStats,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: episodes.length,
          hasMore: offset + episodesWithStats.length < episodes.length
        }
      };

      setCache(cacheKey, result);
      res.json(result);
    } catch (error) {
      console.error("Error fetching episodes:", error);
      res.status(500).json({ error: "Failed to fetch episodes" });
    }
  });

  // Optimized scripts endpoint
  app.get("/api/scripts", async (req: Request, res: Response) => {
    try {
      const { projectId, page = 1, limit = 20 } = req.query;
      const cacheKey = `scripts:${projectId}:${page}:${limit}`;
      
      const cached = getCached(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const offset = (Number(page) - 1) * Number(limit);
      let scripts;

      if (projectId) {
        scripts = await storage.getScriptsByProject(String(projectId));
      } else {
        scripts = await storage.getAllScripts();
      }

      const paginatedScripts = scripts.slice(offset, offset + Number(limit));
      
      // Get file counts without loading file data
      const scriptsWithStats = await Promise.all(
        paginatedScripts.map(async (script) => {
          const files = await storage.getFilesByEntity('scripts', script.id);
          return {
            ...script,
            fileCount: files.length,
            totalSize: files.reduce((sum, file) => sum + (file.fileSize || 0), 0)
          };
        })
      );

      const result = {
        scripts: scriptsWithStats,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: scripts.length,
          hasMore: offset + scriptsWithStats.length < scripts.length
        }
      };

      setCache(cacheKey, result);
      res.json(result);
    } catch (error) {
      console.error("Error fetching scripts:", error);
      res.status(500).json({ error: "Failed to fetch scripts" });
    }
  });

  // Optimized file listing endpoint (without file data)
  app.get("/api/files", async (req: Request, res: Response) => {
    try {
      const { entityType, entityId, page = 1, limit = 50 } = req.query;
      const cacheKey = `files:${entityType}:${entityId}:${page}:${limit}`;
      
      const cached = getCached(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const offset = (Number(page) - 1) * Number(limit);
      let files;

      if (entityType && entityId) {
        files = await storage.getFilesByEntity(String(entityType), String(entityId));
      } else {
        files = await storage.getAllFiles(Number(limit), offset);
      }

      // Remove file data to reduce payload size
      const filesWithoutData = files.map(file => ({
        ...file,
        fileData: undefined,  // Remove large Base64 data
        hasData: !!file.fileData // Just indicate if data exists
      }));

      const result = {
        files: filesWithoutData,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: files.length,
          hasMore: offset + filesWithoutData.length < files.length
        }
      };

      setCache(cacheKey, result);
      res.json(result);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ error: "Failed to fetch files" });
    }
  });

  // Clear cache endpoint (for debugging)
  app.post("/api/cache/clear", isAuthenticated, (req: AuthenticatedRequest, res: Response) => {
    cache.clear();
    res.json({ message: "Cache cleared successfully" });
  });
}

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, 60000); // Clean every minute