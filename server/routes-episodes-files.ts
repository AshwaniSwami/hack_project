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

export function registerEpisodeFileRoutes(app: Express) {
  // Upload files for specific episodes
  app.post("/api/episodes/:episodeId/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const episodeId = req.params.episodeId;
      
      // Verify episode exists
      const episode = await storage.getEpisode(episodeId);
      if (!episode) {
        return res.status(404).json({ message: "Episode not found" });
      }

      // Determine entity type based on file type - scripts go to scripts even when uploaded via episode
      const mimeType = req.file.mimetype.toLowerCase();
      const filename = req.file.originalname.toLowerCase();
      
      let entityType = 'episodes'; // Default to episodes
      let filePrefix = 'episode';
      
      // Check if it's a document file (should go to scripts)
      if (mimeType.includes('document') || mimeType.includes('pdf') || 
          filename.includes('.doc') || filename.includes('.pdf') || 
          filename.includes('.txt') || filename.includes('.rtf')) {
        entityType = 'scripts';
        filePrefix = 'script';
      }

      const fileData = {
        filename: `${filePrefix}_${episodeId}_${Date.now()}_${req.file.originalname}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        fileData: req.file.buffer.toString('base64'),
        entityType: entityType,
        entityId: episodeId,
        uploadedBy: null,
      };

      const storedFile = await storage.createFile(fileData);

      res.status(201).json({ 
        message: "File uploaded successfully",
        file: storedFile
      });
    } catch (error) {
      console.error("Error uploading episode file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Get files for specific episode
  app.get("/api/episodes/:episodeId/files", async (req, res) => {
    try {
      const episodeId = req.params.episodeId;
      const files = await storage.getFilesByEntity('episodes', episodeId);
      
      const filesWithoutData = files.map(file => ({
        ...file,
        fileData: undefined
      }));
      
      res.json(filesWithoutData);
    } catch (error) {
      console.error("Error fetching episode files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });
}