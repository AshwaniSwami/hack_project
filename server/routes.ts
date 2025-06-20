import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { registerProjectFileRoutes } from "./routes-projects-files";
import { registerEpisodeFileRoutes } from "./routes-episodes-files";
import { registerScriptFileRoutes } from "./routes-scripts-files";
import {
  insertUserSchema,
  insertProjectSchema,
  insertEpisodeSchema,
  insertScriptSchema,
  insertTopicSchema,
  insertRadioStationSchema,
  insertFreeProjectAccessSchema,
  insertFileSchema,
} from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for various file types
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types
    cb(null, true);
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Register file upload routes for organized content management
  registerProjectFileRoutes(app);
  registerEpisodeFileRoutes(app);
  registerScriptFileRoutes(app);
  // Users API
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ message: "Failed to create user" });
    }
  });

  // File upload endpoint for users
  app.post("/api/users/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Store the file in the database
      const fileData = {
        filename: `users_${Date.now()}_${req.file.originalname}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        fileData: req.file.buffer.toString('base64'),
        entityType: 'users',
        entityId: null,
        uploadedBy: null,
      };

      const storedFile = await storage.createFile(fileData);

      // Try to parse and import data if it's a JSON file
      let importedCount = 0;
      if (req.file.mimetype === 'application/json' || req.file.originalname.endsWith('.json')) {
        try {
          const fileContent = req.file.buffer.toString("utf-8");
          const users = JSON.parse(fileContent);
          
          if (Array.isArray(users)) {
            for (const userData of users) {
              try {
                const validatedData = insertUserSchema.parse(userData);
                await storage.createUser(validatedData);
                importedCount++;
              } catch (error) {
                console.error("Error creating user from file:", error);
              }
            }
          }
        } catch (parseError) {
          console.log("File is not JSON or couldn't be parsed for import");
        }
      }

      res.status(201).json({ 
        message: `File uploaded successfully${importedCount > 0 ? ` and imported ${importedCount} users` : ''}`,
        file: storedFile,
        importedCount
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, userData);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(400).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Projects API
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: "Failed to create project" });
    }
  });

  // File upload endpoint for projects
  app.post("/api/projects/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { projectId } = req.body; // Get projectId from form data
      console.log("Upload request - projectId:", projectId, "file:", req.file.originalname);

      // Store the file in the database
      const fileData = {
        filename: `project_${projectId || 'general'}_${Date.now()}_${req.file.originalname}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        fileData: req.file.buffer.toString('base64'),
        entityType: 'projects',
        entityId: projectId || null,
        uploadedBy: null,
      };

      const storedFile = await storage.createFile(fileData);

      // Try to parse and import data if it's a JSON file
      let importedCount = 0;
      if (req.file.mimetype === 'application/json' || req.file.originalname.endsWith('.json')) {
        try {
          const fileContent = req.file.buffer.toString("utf-8");
          const projects = JSON.parse(fileContent);
          
          if (Array.isArray(projects)) {
            for (const projectData of projects) {
              try {
                const validatedData = insertProjectSchema.parse(projectData);
                await storage.createProject(validatedData);
                importedCount++;
              } catch (error) {
                console.error("Error creating project from file:", error);
              }
            }
          }
        } catch (parseError) {
          console.log("File is not JSON or couldn't be parsed for import");
        }
      }

      res.status(201).json({ 
        message: `File uploaded successfully${importedCount > 0 ? ` and imported ${importedCount} projects` : ''}`,
        file: storedFile,
        importedCount
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const projectData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, projectData);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(400).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Episodes API
  app.get("/api/episodes", async (req, res) => {
    try {
      const episodes = await storage.getAllEpisodes();
      res.json(episodes);
    } catch (error) {
      console.error("Error fetching episodes:", error);
      res.status(500).json({ message: "Failed to fetch episodes" });
    }
  });

  app.get("/api/episodes/:id", async (req, res) => {
    try {
      const episode = await storage.getEpisode(req.params.id);
      if (!episode) {
        return res.status(404).json({ message: "Episode not found" });
      }
      res.json(episode);
    } catch (error) {
      console.error("Error fetching episode:", error);
      res.status(500).json({ message: "Failed to fetch episode" });
    }
  });

  app.post("/api/episodes", async (req, res) => {
    try {
      const episodeData = insertEpisodeSchema.parse(req.body);
      const episode = await storage.createEpisode(episodeData);
      res.status(201).json(episode);
    } catch (error) {
      console.error("Error creating episode:", error);
      res.status(400).json({ message: "Failed to create episode" });
    }
  });

  // File upload endpoint for episodes
  app.post("/api/episodes/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Store the file in the database
      const fileData = {
        filename: `episodes_${Date.now()}_${req.file.originalname}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        fileData: req.file.buffer.toString('base64'),
        entityType: 'episodes',
        entityId: null,
        uploadedBy: null,
      };

      const storedFile = await storage.createFile(fileData);

      // Try to parse and import data if it's a JSON file
      let importedCount = 0;
      if (req.file.mimetype === 'application/json' || req.file.originalname.endsWith('.json')) {
        try {
          const fileContent = req.file.buffer.toString("utf-8");
          const episodes = JSON.parse(fileContent);
          
          if (Array.isArray(episodes)) {
            for (const episodeData of episodes) {
              try {
                const validatedData = insertEpisodeSchema.parse(episodeData);
                await storage.createEpisode(validatedData);
                importedCount++;
              } catch (error) {
                console.error("Error creating episode from file:", error);
              }
            }
          }
        } catch (parseError) {
          console.log("File is not JSON or couldn't be parsed for import");
        }
      }

      res.status(201).json({ 
        message: `File uploaded successfully${importedCount > 0 ? ` and imported ${importedCount} episodes` : ''}`,
        file: storedFile,
        importedCount
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.put("/api/episodes/:id", async (req, res) => {
    try {
      const episodeData = insertEpisodeSchema.partial().parse(req.body);
      const episode = await storage.updateEpisode(req.params.id, episodeData);
      res.json(episode);
    } catch (error) {
      console.error("Error updating episode:", error);
      res.status(400).json({ message: "Failed to update episode" });
    }
  });

  app.delete("/api/episodes/:id", async (req, res) => {
    try {
      await storage.deleteEpisode(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting episode:", error);
      res.status(500).json({ message: "Failed to delete episode" });
    }
  });

  // Scripts API
  app.get("/api/scripts", async (req, res) => {
    try {
      const scripts = await storage.getAllScripts();
      res.json(scripts);
    } catch (error) {
      console.error("Error fetching scripts:", error);
      res.status(500).json({ message: "Failed to fetch scripts" });
    }
  });

  app.get("/api/scripts/:id", async (req, res) => {
    try {
      const script = await storage.getScript(req.params.id);
      if (!script) {
        return res.status(404).json({ message: "Script not found" });
      }
      res.json(script);
    } catch (error) {
      console.error("Error fetching script:", error);
      res.status(500).json({ message: "Failed to fetch script" });
    }
  });

  app.post("/api/scripts", async (req, res) => {
    try {
      const scriptData = insertScriptSchema.parse(req.body);
      // Set a default author if not provided (for now, use first user or create a system user)
      const users = await storage.getAllUsers();
      const authorId = users.length > 0 ? users[0].id : 'system-user';
      
      const script = await storage.createScript({
        ...scriptData,
        authorId
      });
      res.status(201).json(script);
    } catch (error) {
      console.error("Error creating script:", error);
      res.status(400).json({ message: "Failed to create script" });
    }
  });

  // File upload endpoint for scripts
  app.post("/api/scripts/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Store the file in the database
      const fileData = {
        filename: `scripts_${Date.now()}_${req.file.originalname}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        fileData: req.file.buffer.toString('base64'),
        entityType: 'scripts',
        entityId: null,
        uploadedBy: null,
      };

      const storedFile = await storage.createFile(fileData);

      // Try to parse and import data if it's a JSON file
      let importedCount = 0;
      if (req.file.mimetype === 'application/json' || req.file.originalname.endsWith('.json')) {
        try {
          const fileContent = req.file.buffer.toString("utf-8");
          const scripts = JSON.parse(fileContent);
          
          if (Array.isArray(scripts)) {
            for (const scriptData of scripts) {
              try {
                const validatedData = insertScriptSchema.parse(scriptData);
                await storage.createScript(validatedData);
                importedCount++;
              } catch (error) {
                console.error("Error creating script from file:", error);
              }
            }
          }
        } catch (parseError) {
          console.log("File is not JSON or couldn't be parsed for import");
        }
      }

      res.status(201).json({ 
        message: `File uploaded successfully${importedCount > 0 ? ` and imported ${importedCount} scripts` : ''}`,
        file: storedFile,
        importedCount
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.put("/api/scripts/:id", async (req, res) => {
    try {
      const scriptData = insertScriptSchema.partial().parse(req.body);
      const script = await storage.updateScript(req.params.id, scriptData);
      res.json(script);
    } catch (error) {
      console.error("Error updating script:", error);
      res.status(400).json({ message: "Failed to update script" });
    }
  });

  app.delete("/api/scripts/:id", async (req, res) => {
    try {
      await storage.deleteScript(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting script:", error);
      res.status(500).json({ message: "Failed to delete script" });
    }
  });

  // Topics API
  app.get("/api/topics", async (req, res) => {
    try {
      const topics = await storage.getAllTopics();
      res.json(topics);
    } catch (error) {
      console.error("Error fetching topics:", error);
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  app.post("/api/topics", async (req, res) => {
    try {
      const topicData = insertTopicSchema.parse(req.body);
      const topic = await storage.createTopic(topicData);
      res.status(201).json(topic);
    } catch (error) {
      console.error("Error creating topic:", error);
      res.status(400).json({ message: "Failed to create topic" });
    }
  });

  // Radio Stations API
  app.get("/api/radio-stations", async (req, res) => {
    try {
      const stations = await storage.getAllRadioStations();
      res.json(stations);
    } catch (error) {
      console.error("Error fetching radio stations:", error);
      res.status(500).json({ message: "Failed to fetch radio stations" });
    }
  });

  app.get("/api/radio-stations/:id", async (req, res) => {
    try {
      const station = await storage.getRadioStation(req.params.id);
      if (!station) {
        return res.status(404).json({ message: "Radio station not found" });
      }
      res.json(station);
    } catch (error) {
      console.error("Error fetching radio station:", error);
      res.status(500).json({ message: "Failed to fetch radio station" });
    }
  });

  app.post("/api/radio-stations", async (req, res) => {
    try {
      const stationData = insertRadioStationSchema.parse(req.body);
      const station = await storage.createRadioStation(stationData);
      res.status(201).json(station);
    } catch (error) {
      console.error("Error creating radio station:", error);
      res.status(400).json({ message: "Failed to create radio station" });
    }
  });

  // File upload endpoint for radio stations
  app.post("/api/radio-stations/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Store the file in the database
      const fileData = {
        filename: `radio-stations_${Date.now()}_${req.file.originalname}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        fileData: req.file.buffer.toString('base64'),
        entityType: 'radio-stations',
        entityId: null,
        uploadedBy: null,
      };

      const storedFile = await storage.createFile(fileData);

      // Try to parse and import data if it's a JSON file
      let importedCount = 0;
      if (req.file.mimetype === 'application/json' || req.file.originalname.endsWith('.json')) {
        try {
          const fileContent = req.file.buffer.toString("utf-8");
          const stations = JSON.parse(fileContent);
          
          if (Array.isArray(stations)) {
            for (const stationData of stations) {
              try {
                const validatedData = insertRadioStationSchema.parse(stationData);
                await storage.createRadioStation(validatedData);
                importedCount++;
              } catch (error) {
                console.error("Error creating radio station from file:", error);
              }
            }
          }
        } catch (parseError) {
          console.log("File is not JSON or couldn't be parsed for import");
        }
      }

      res.status(201).json({ 
        message: `File uploaded successfully${importedCount > 0 ? ` and imported ${importedCount} radio stations` : ''}`,
        file: storedFile,
        importedCount
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.put("/api/radio-stations/:id", async (req, res) => {
    try {
      const stationData = insertRadioStationSchema.partial().parse(req.body);
      const station = await storage.updateRadioStation(req.params.id, stationData);
      res.json(station);
    } catch (error) {
      console.error("Error updating radio station:", error);
      res.status(400).json({ message: "Failed to update radio station" });
    }
  });

  app.delete("/api/radio-stations/:id", async (req, res) => {
    try {
      await storage.deleteRadioStation(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting radio station:", error);
      res.status(500).json({ message: "Failed to delete radio station" });
    }
  });

  // Free Project Access API
  app.get("/api/free-project-access", async (req, res) => {
    try {
      const access = await storage.getAllFreeProjectAccess();
      res.json(access);
    } catch (error) {
      console.error("Error fetching free project access:", error);
      res.status(500).json({ message: "Failed to fetch free project access" });
    }
  });

  app.post("/api/free-project-access", async (req, res) => {
    try {
      const accessData = insertFreeProjectAccessSchema.parse(req.body);
      const access = await storage.createFreeProjectAccess(accessData);
      res.status(201).json(access);
    } catch (error) {
      console.error("Error creating free project access:", error);
      res.status(400).json({ message: "Failed to create free project access" });
    }
  });

  // Files API
  app.get("/api/files", async (req, res) => {
    try {
      const { entityType, entityId } = req.query;
      let files;
      
      if (entityType) {
        files = await storage.getFilesByEntity(entityType as string, entityId as string);
      } else {
        files = await storage.getAllFiles();
      }
      
      // Don't send file data in list view for performance
      const filesWithoutData = files.map(file => ({
        ...file,
        fileData: undefined
      }));
      
      res.json(filesWithoutData);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.get("/api/files/:id", async (req, res) => {
    try {
      const file = await storage.getFile(req.params.id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json(file);
    } catch (error) {
      console.error("Error fetching file:", error);
      res.status(500).json({ message: "Failed to fetch file" });
    }
  });

  app.get("/api/files/:id/download", async (req, res) => {
    try {
      const file = await storage.getFile(req.params.id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      const buffer = Buffer.from(file.fileData, 'base64');
      
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Length', buffer.length);
      
      res.send(buffer);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  app.get("/api/files/:id/view", async (req, res) => {
    try {
      const file = await storage.getFile(req.params.id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      const buffer = Buffer.from(file.fileData, 'base64');
      
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Length', buffer.length);
      
      res.send(buffer);
    } catch (error) {
      console.error("Error viewing file:", error);
      res.status(500).json({ message: "Failed to view file" });
    }
  });

  app.delete("/api/files/:id", async (req, res) => {
    try {
      await storage.deleteFile(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
