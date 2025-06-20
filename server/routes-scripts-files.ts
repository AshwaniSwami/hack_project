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

export function registerScriptFileRoutes(app: Express) {
  // Upload files for specific scripts
  app.post("/api/scripts/:scriptId/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const scriptId = req.params.scriptId;
      
      // Verify script exists
      const script = await storage.getScript(scriptId);
      if (!script) {
        return res.status(404).json({ message: "Script not found" });
      }

      // Determine entity type based on file type - audio/video should go to episodes
      const mimeType = req.file.mimetype.toLowerCase();
      const filename = req.file.originalname.toLowerCase();
      
      let entityType = 'scripts'; // Default to scripts
      let filePrefix = 'script';
      
      // Check if it's an audio/video file (should go to episodes)
      if (mimeType.includes('audio') || mimeType.includes('video') || 
          filename.includes('.mp3') || filename.includes('.mp4') || 
          filename.includes('.wav') || filename.includes('.m4a')) {
        entityType = 'episodes';
        filePrefix = 'episode';
      }

      const fileData = {
        filename: `${filePrefix}_${scriptId}_${Date.now()}_${req.file.originalname}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        fileData: req.file.buffer.toString('base64'),
        entityType: entityType,
        entityId: scriptId,
        uploadedBy: null,
      };

      const storedFile = await storage.createFile(fileData);

      res.status(201).json({ 
        message: "File uploaded successfully",
        file: storedFile
      });
    } catch (error) {
      console.error("Error uploading script file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Get files for specific script
  app.get("/api/scripts/:scriptId/files", async (req, res) => {
    try {
      const scriptId = req.params.scriptId;
      const files = await storage.getFilesByEntity('scripts', scriptId);
      
      const filesWithoutData = files.map(file => ({
        ...file,
        fileData: undefined
      }));
      
      res.json(filesWithoutData);
    } catch (error) {
      console.error("Error fetching script files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });
}