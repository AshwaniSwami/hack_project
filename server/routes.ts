import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertProjectSchema,
  insertEpisodeSchema,
  insertScriptSchema,
  insertTopicSchema,
  insertRadioStationSchema,
  insertFreeProjectAccessSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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
      const script = await storage.createScript(scriptData);
      res.status(201).json(script);
    } catch (error) {
      console.error("Error creating script:", error);
      res.status(400).json({ message: "Failed to create script" });
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

  const httpServer = createServer(app);
  return httpServer;
}
