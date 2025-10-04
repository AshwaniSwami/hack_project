import type { Express } from "express";
import multer from "multer";
import { storage } from "./storage";
import { checkUploadOnceViolation } from "./filePermissions";

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
  app.post("/api/episodes/:episodeId/upload", upload.single("file"), async (req: any, res) => {
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

      // Check upload-once restriction for participants
      const userId = req.session?.userId || req.user?.id;
      const user = userId ? await storage.getUser(userId) : undefined;
      
      // Get existing files for this episode
      const existingFiles = await storage.getFilesByEntity('episodes', episodeId);
      
      // Check if user can upload (upload-once protection)
      const uploadCheck = await checkUploadOnceViolation(user, 'episodes', episodeId, existingFiles);
      if (!uploadCheck.allowed) {
        return res.status(403).json({ message: uploadCheck.message });
      }

      // Properly handle UTF-8 encoding for filenames
      const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
      
      const fileData = {
        filename: `episode_${episodeId}_${Date.now()}_${originalName}`,
        originalName: originalName,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        fileData: req.file.buffer.toString('base64'),
        entityType: 'episodes',
        entityId: episodeId,
        uploadedBy: userId,
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