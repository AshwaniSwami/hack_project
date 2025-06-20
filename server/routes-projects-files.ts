import type { Express } from "express";
import multer from "multer";
import { storage } from "./storage";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

export function registerProjectFileRoutes(app: Express) {
  // Project file uploads are disabled - files should be uploaded to episodes or scripts instead
  app.post("/api/projects/:projectId/upload", upload.single("file"), async (req, res) => {
    res.status(400).json({ 
      message: "Direct project file uploads are not allowed. Please upload files to specific episodes or scripts instead." 
    });
  });

  // Get files for specific project
  app.get("/api/projects/:projectId/files", async (req, res) => {
    try {
      const projectId = req.params.projectId;
      const files = await storage.getFilesByEntity('projects', projectId);
      
      const filesWithoutData = files.map(file => ({
        ...file,
        fileData: undefined
      }));
      
      res.json(filesWithoutData);
    } catch (error) {
      console.error("Error fetching project files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });
}