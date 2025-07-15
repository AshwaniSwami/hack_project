import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import { storage } from "./storage";
import { registerProjectFileRoutes } from "./routes-projects-files";
import { registerEpisodeFileRoutes } from "./routes-episodes-files";
import { registerScriptFileRoutes } from "./routes-scripts-files";
import { registerNotificationRoutes } from "./routes-notifications";
import { isDatabaseAvailable } from "./db";
// Import both auth modules
import * as realAuth from "./auth";
import * as tempAuth from "./tempAuth";
import { getFilePermissions, requireFilePermission } from "./filePermissions";

// Use temp auth when database is not available, real auth when database is ready
const authModule = isDatabaseAvailable() ? realAuth : tempAuth;
const { isAuthenticated, isAdmin, login, register, logout, getCurrentUser } = authModule;
import bcrypt from "bcryptjs";
import {
  insertUserSchema,
  insertThemeSchema,
  insertProjectSchema,
  insertEpisodeSchema,
  insertScriptSchema,
  insertTopicSchema,
  insertRadioStationSchema,
  insertFreeProjectAccessSchema,
  insertFileSchema,
  insertFileFolderSchema,
} from "@shared/schema";
import session from "express-session";

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
  // Session configuration for custom auth
  app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for now to ensure cookies work on Render
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  }));

  // Register file upload routes for organized content management
  registerProjectFileRoutes(app);
  registerEpisodeFileRoutes(app);
  registerScriptFileRoutes(app);

  // Register notification routes
  registerNotificationRoutes(app);

  // Register analytics and download tracking routes
  const { registerAnalyticsRoutes } = await import("./routes-analytics");
  const { registerDownloadTrackingRoutes } = await import("./routes-download-tracking");
  const { registerProjectAnalyticsRoutes } = await import("./routes-projects-analytics");
  const { registerScriptAnalyticsRoutes } = await import("./routes-script-analytics");
  const { registerEpisodeAnalyticsRoutes } = await import("./routes-episodes-analytics");
  registerAnalyticsRoutes(app);
  registerDownloadTrackingRoutes(app);
  
  // Register onboarding routes
  const { 
    getCurrentFormConfig, 
    updateFormConfig, 
    submitOnboardingForm, 
    getOnboardingAnalytics, 
    checkOnboardingStatus 
  } = await import("./routes-onboarding");
  
  app.get("/api/onboarding/form-config", getCurrentFormConfig);
  app.put("/api/onboarding/form-config", isAuthenticated, isAdmin, updateFormConfig);
  app.post("/api/onboarding/submit", isAuthenticated, submitOnboardingForm);
  app.get("/api/onboarding/analytics", isAuthenticated, getOnboardingAnalytics);
  app.get("/api/onboarding/status", isAuthenticated, checkOnboardingStatus);
  registerProjectAnalyticsRoutes(app);
  registerScriptAnalyticsRoutes(app);
  registerEpisodeAnalyticsRoutes(app);

  // Auth routes
  app.post('/api/auth/login', login);
  app.post('/api/auth/register', register);
  app.post('/api/auth/logout', logout);
  app.get('/api/auth/user', getCurrentUser);

  // Get user permissions for role-based access control
  app.get('/api/auth/permissions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      const permissions = getFilePermissions(user);
      res.json(permissions);
    } catch (error) {
      console.error("Error getting user permissions:", error);
      res.status(500).json({ message: "Failed to get user permissions" });
    }
  });

  // Emergency admin promotion for first user
  app.post('/api/auth/promote-first-admin', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const allUsers = await storage.getAllUsers();

      // Only allow if there are no admins in the system
      const adminUsers = allUsers.filter(u => u.role === 'admin');
      if (adminUsers.length === 0) {
        await storage.updateUser(userId, { role: 'admin' });
        const updatedUser = await storage.getUser(userId);
        res.json({ message: 'Successfully promoted to admin', user: updatedUser });
      } else {
        res.status(403).json({ message: 'Admin already exists in system' });
      }
    } catch (error) {
      console.error("Error promoting user:", error);
      res.status(500).json({ message: "Failed to promote user" });
    }
  });

  // Users API - Admin only
  app.get("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      if (!isDatabaseAvailable()) {
        const { tempUsers } = await import("./tempData");
        return res.json(tempUsers);
      }
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const users = await storage.getAllUsers(limit, offset);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", isAuthenticated, isAdmin, async (req, res) => {
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

  app.post("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Hash password if provided (for custom users)
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }

      // Generate a unique ID for custom users
      if (!userData.id) {
        userData.id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      const user = await storage.createUser(userData);

      // Don't return password in response
      const { password, ...userResponse } = user;
      res.status(201).json(userResponse);
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
      // Get user info before deletion for broadcasting
      const userToDelete = await storage.getUser(req.params.id);
      
      await storage.deleteUser(req.params.id);
      
      // Broadcast real-time update to all connected admin users
      if (typeof (global as any).broadcastNotificationToAdmins === 'function') {
        (global as any).broadcastNotificationToAdmins({
          type: 'user_action',
          action: 'deleted',
          userId: req.params.id,
          userEmail: userToDelete?.email || 'Unknown',
          timestamp: new Date().toISOString()
        });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin User Management API
  app.get("/api/admin/users/pending", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const pendingUsers = await storage.getUsersPendingVerification();
      res.json(pendingUsers);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  app.patch("/api/admin/users/:id/verify", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const user = await storage.verifyUser(req.params.id);
      
      // Broadcast real-time update to all connected admin users
      if (typeof (global as any).broadcastNotificationToAdmins === 'function') {
        (global as any).broadcastNotificationToAdmins({
          type: 'user_action',
          action: 'verified',
          userId: user.id,
          userEmail: user.email,
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({ message: "User verified successfully", user });
    } catch (error) {
      console.error("Error verifying user:", error);
      res.status(500).json({ message: "Failed to verify user" });
    }
  });

  app.patch("/api/admin/users/:id/suspend", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const user = await storage.suspendUser(req.params.id);
      res.json({ message: "User suspended successfully", user });
    } catch (error) {
      console.error("Error suspending user:", error);
      res.status(500).json({ message: "Failed to suspend user" });
    }
  });

  app.patch("/api/admin/users/:id/activate", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const user = await storage.activateUser(req.params.id);
      res.json({ message: "User activated successfully", user });
    } catch (error) {
      console.error("Error activating user:", error);
      res.status(500).json({ message: "Failed to activate user" });
    }
  });

  // Themes API
  app.get("/api/themes", async (req, res) => {
    try {
      const themes = await storage.getAllThemes();
      res.json(themes);
    } catch (error) {
      console.error("Error fetching themes:", error);
      res.status(500).json({ message: "Failed to fetch themes" });
    }
  });

  app.get("/api/themes/active", async (req, res) => {
    try {
      const themes = await storage.getActiveThemes();
      res.json(themes);
    } catch (error) {
      console.error("Error fetching active themes:", error);
      res.status(500).json({ message: "Failed to fetch active themes" });
    }
  });

  app.get("/api/themes/:id", async (req, res) => {
    try {
      const theme = await storage.getTheme(req.params.id);
      if (!theme) {
        return res.status(404).json({ message: "Theme not found" });
      }
      res.json(theme);
    } catch (error) {
      console.error("Error fetching theme:", error);
      res.status(500).json({ message: "Failed to fetch theme" });
    }
  });

  // Helper middleware to check if user can edit themes (admin or editor)
  const canEditThemes = (req: any, res: any, next: any) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'editor')) {
      next();
    } else {
      res.status(403).json({ message: "Only admins and editors can manage themes" });
    }
  };

  app.post("/api/themes", isAuthenticated, canEditThemes, async (req, res) => {
    try {
      const themeData = insertThemeSchema.parse(req.body);
      const theme = await storage.createTheme(themeData);
      res.status(201).json(theme);
    } catch (error) {
      console.error("Error creating theme:", error);
      res.status(400).json({ message: "Failed to create theme" });
    }
  });

  app.put("/api/themes/:id", isAuthenticated, canEditThemes, async (req, res) => {
    try {
      const themeData = insertThemeSchema.partial().parse(req.body);
      const theme = await storage.updateTheme(req.params.id, themeData);
      res.json(theme);
    } catch (error) {
      console.error("Error updating theme:", error);
      res.status(400).json({ message: "Failed to update theme" });
    }
  });

  app.delete("/api/themes/:id", isAuthenticated, canEditThemes, async (req, res) => {
    try {
      await storage.deleteTheme(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting theme:", error);
      res.status(500).json({ message: "Failed to delete theme" });
    }
  });

  app.get("/api/themes/:id/projects", async (req, res) => {
    try {
      const projects = await storage.getProjectsByTheme(req.params.id);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects by theme:", error);
      res.status(500).json({ message: "Failed to fetch projects by theme" });
    }
  });

  // Projects API
  app.get("/api/projects", async (req, res) => {
    try {
      if (!isDatabaseAvailable()) {
        const { tempProjects } = await import("./tempData");
        return res.json(tempProjects);
      }
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
      if (!isDatabaseAvailable()) {
        const { tempEpisodes } = await import("./tempData");
        return res.json(tempEpisodes);
      }
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
      if (!isDatabaseAvailable()) {
        const { tempScripts } = await import("./tempData");
        return res.json(tempScripts);
      }
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

  app.post("/api/scripts", isAuthenticated, async (req: any, res) => {
    try {
      const scriptData = insertScriptSchema.parse(req.body);

      const script = await storage.createScript({
        ...scriptData,
        authorId: req.user.id
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
                const users = await storage.getAllUsers();
                const authorId = users.length > 0 ? users[0].id : '00000000-0000-0000-0000-000000000000';
                await storage.createScript({
                  ...validatedData,
                  authorId
                });
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

  app.put("/api/scripts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const scriptData = insertScriptSchema.partial().parse(req.body);
      const script = await storage.updateScript(req.params.id, scriptData);
      res.json(script);
    } catch (error) {
      console.error("Error updating script:", error);
      res.status(400).json({ message: "Failed to update script" });
    }
  });

  app.delete("/api/scripts/:id", isAuthenticated, async (req: any, res) => {
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
      if (!isDatabaseAvailable()) {
        const { tempRadioStations } = await import("./tempData");
        return res.json(tempRadioStations);
      }
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const stations = await storage.getAllRadioStations(limit, offset);
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
  app.get("/api/files", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!requireFilePermission('canView', user)) {
        return res.status(403).json({ message: "Insufficient permissions to view files" });
      }

      const { entityType, entityId } = req.query;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      let files;
      let totalCount;

      if (entityType) {
        files = await storage.getFilesByEntity(entityType as string, entityId as string);
        totalCount = files.length;
      } else {
        files = await storage.getAllFiles(limit, offset);
        totalCount = await storage.getFileCount();
      }

      // Don't send file data in list view for performance
      const filesWithoutData = files.map(file => ({
        ...file,
        fileData: undefined
      }));

      res.json({
        files: filesWithoutData,
        totalCount,
        hasMore: offset + limit < totalCount
      });
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.get("/api/files/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!requireFilePermission('canView', user)) {
        return res.status(403).json({ message: "Insufficient permissions to view files" });
      }

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

  app.get("/api/files/:id/download", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!requireFilePermission('canDownload', user)) {
        return res.status(403).json({ message: "Insufficient permissions to download files" });
      }

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

  app.get("/api/files/:id/view", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!requireFilePermission('canView', user)) {
        return res.status(403).json({ message: "Insufficient permissions to view files" });
      }

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

  app.delete("/api/files/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!requireFilePermission('canDelete', user)) {
        return res.status(403).json({ message: "Insufficient permissions to delete files" });
      }

      await storage.deleteFile(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // File reordering endpoint
  app.post("/api/files/reorder", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!requireFilePermission('canEdit', user)) {
        return res.status(403).json({ message: "Insufficient permissions to reorder files" });
      }

      const { entityType, entityId, fileIds } = req.body;

      if (!entityType || !Array.isArray(fileIds)) {
        return res.status(400).json({ message: "Invalid request: entityType and fileIds array required" });
      }

      await storage.reorderFiles(entityType, entityId || null, fileIds);
      res.json({ message: "Files reordered successfully" });
    } catch (error) {
      console.error("Error reordering files:", error);
      res.status(500).json({ message: "Failed to reorder files" });
    }
  });

  // File search endpoint
  app.get("/api/files/search", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!requireFilePermission('canView', user)) {
        return res.status(403).json({ message: "Insufficient permissions to search files" });
      }

      const { q: query, entityType, entityId } = req.query;

      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const files = await storage.searchFiles(
        query as string, 
        entityType as string, 
        entityId as string
      );

      // Don't send file data in search results for performance
      const filesWithoutData = files.map(file => ({
        ...file,
        fileData: undefined
      }));

      res.json(filesWithoutData);
    } catch (error) {
      console.error("Error searching files:", error);
      res.status(500).json({ message: "Failed to search files" });
    }
  });

  // File Folders API
  app.get("/api/folders", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!requireFilePermission('canView', user)) {
        return res.status(403).json({ message: "Insufficient permissions to view folders" });
      }

      const { entityType, entityId, parentFolderId } = req.query;

      let folders;
      if (entityType && entityId) {
        folders = await storage.getFoldersByEntity(entityType as string, entityId as string);
      } else if (parentFolderId !== undefined) {
        folders = await storage.getFoldersByParent(parentFolderId as string || undefined);
      } else {
        return res.status(400).json({ message: "Either entityType/entityId or parentFolderId is required" });
      }

      res.json(folders);
    } catch (error) {
      console.error("Error fetching folders:", error);
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  app.post("/api/folders", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!requireFilePermission('canCreate', user)) {
        return res.status(403).json({ message: "Insufficient permissions to create folders" });
      }

      const folderData = insertFileFolderSchema.parse(req.body);
      const folder = await storage.createFileFolder(folderData);
      res.status(201).json(folder);
    } catch (error) {
      console.error("Error creating folder:", error);
      res.status(400).json({ message: "Failed to create folder" });
    }
  });

  app.put("/api/folders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!requireFilePermission('canEdit', user)) {
        return res.status(403).json({ message: "Insufficient permissions to edit folders" });
      }

      const folderData = insertFileFolderSchema.partial().parse(req.body);
      const folder = await storage.updateFileFolder(req.params.id, folderData);
      res.json(folder);
    } catch (error) {
      console.error("Error updating folder:", error);
      res.status(400).json({ message: "Failed to update folder" });
    }
  });

  app.delete("/api/folders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!requireFilePermission('canDelete', user)) {
        return res.status(403).json({ message: "Insufficient permissions to delete folders" });
      }

      await storage.deleteFileFolder(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting folder:", error);
      res.status(500).json({ message: "Failed to delete folder" });
    }
  });

  // Authentication routes
  app.post("/api/login", login);
  app.post("/api/register", register);
  app.post("/api/logout", logout);
  app.get("/api/me", getCurrentUser);

  const httpServer = createServer(app);
  
  // Create WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store admin WebSocket connections
  const adminConnections = new Map<string, WebSocket>();
  
  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket connection established');
    
    // Handle authentication for WebSocket connections
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'authenticate') {
          const { userId, userRole } = data;
          
          // Only allow admin users to connect for notifications
          if (userRole === 'admin') {
            adminConnections.set(userId, ws);
            console.log(`Admin user ${userId} connected to WebSocket`);
            
            ws.send(JSON.stringify({
              type: 'authenticated',
              message: 'Successfully authenticated for notifications'
            }));
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Only admin users can receive notifications'
            }));
            ws.close();
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });
    
    ws.on('close', () => {
      // Remove connection from admin connections when closed
      for (const [userId, connection] of adminConnections.entries()) {
        if (connection === ws) {
          adminConnections.delete(userId);
          console.log(`Admin user ${userId} disconnected from WebSocket`);
          break;
        }
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  // Export function to broadcast notifications to all connected admins
  (global as any).broadcastNotificationToAdmins = (notification: any) => {
    const message = JSON.stringify({
      type: 'notification',
      data: notification
    });
    
    adminConnections.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        console.log(`Notification sent to admin user ${userId}`);
      }
    });
  };
  
  return httpServer;
}