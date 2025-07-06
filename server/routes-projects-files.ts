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
  // Auto-route project uploads to scripts based on file type
  app.post("/api/projects/:projectId/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const projectId = req.params.projectId;
      
      // Verify project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Determine entity type based on file type
      const mimeType = req.file.mimetype.toLowerCase();
      const filename = req.file.originalname.toLowerCase();
      
      let entityType = 'scripts'; // Default to scripts
      let filePrefix = 'script';
      
      // Check if it's likely an episode file (audio/video)
      if (mimeType.includes('audio') || mimeType.includes('video') || 
          filename.includes('.mp3') || filename.includes('.mp4') || 
          filename.includes('.wav') || filename.includes('.m4a')) {
        entityType = 'episodes';
        filePrefix = 'episode';
      }

      const fileData = {
        filename: `${filePrefix}_${projectId}_${Date.now()}_${Buffer.from(req.file.originalname, 'utf8').toString('utf8')}`,
        originalName: Buffer.from(req.file.originalname, 'utf8').toString('utf8'),
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        fileData: req.file.buffer.toString('base64'),
        entityType: entityType,
        entityId: projectId,
        uploadedBy: null,
      };

      console.log(`Upload request - projectId: ${projectId} file: ${req.file.originalname} -> routing to ${entityType}`);

      const storedFile = await storage.createFile(fileData);

      res.status(201).json({ 
        message: `File uploaded successfully to ${entityType}`,
        file: storedFile,
        routedTo: entityType
      });
    } catch (error) {
      console.error("Error uploading project file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
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