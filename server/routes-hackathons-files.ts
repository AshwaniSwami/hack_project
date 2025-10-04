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

export function registerHackathonFileRoutes(app: Express) {
  // Auto-route hackathon uploads based on file type
  app.post("/api/hackathons/:hackathonId/upload", upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const hackathonId = req.params.hackathonId;
      
      // Verify hackathon exists
      const hackathon = await storage.getProject(hackathonId);
      if (!hackathon) {
        return res.status(404).json({ message: "Hackathon not found" });
      }

      // Check upload-once restriction for participants
      const userId = req.session?.userId || req.user?.id;
      const user = userId ? await storage.getUser(userId) : undefined;
      
      // Get existing files for this hackathon
      const existingFiles = await storage.getFilesByEntity('hackathons', hackathonId);
      
      // Check if user can upload (upload-once protection)
      const uploadCheck = await checkUploadOnceViolation(user, 'hackathons', hackathonId, existingFiles);
      if (!uploadCheck.allowed) {
        return res.status(403).json({ message: uploadCheck.message });
      }

      // Determine entity type based on file type
      const mimeType = req.file.mimetype.toLowerCase();
      const filename = req.file.originalname.toLowerCase();
      
      let entityType = 'submissions'; // Default to submissions
      let filePrefix = 'submission';
      
      // Check if it's likely a team file (audio/video)
      if (mimeType.includes('audio') || mimeType.includes('video') || 
          filename.includes('.mp3') || filename.includes('.mp4') || 
          filename.includes('.wav') || filename.includes('.m4a')) {
        entityType = 'teams';
        filePrefix = 'team';
      }

      // Properly handle UTF-8 encoding for filenames
      const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
      
      const fileData = {
        filename: `${filePrefix}_${hackathonId}_${Date.now()}_${originalName}`,
        originalName: originalName,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        fileData: req.file.buffer.toString('base64'),
        entityType: entityType,
        entityId: hackathonId,
        uploadedBy: userId,
      };

      console.log(`Upload request - hackathonId: ${hackathonId} file: ${req.file.originalname} -> routing to ${entityType}`);

      const storedFile = await storage.createFile(fileData);

      res.status(201).json({ 
        message: `File uploaded successfully to ${entityType}`,
        file: storedFile,
        routedTo: entityType
      });
    } catch (error) {
      console.error("Error uploading hackathon file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Get files for specific hackathon
  app.get("/api/hackathons/:hackathonId/files", async (req, res) => {
    try {
      const hackathonId = req.params.hackathonId;
      const files = await storage.getFilesByEntity('hackathons', hackathonId);
      
      const filesWithoutData = files.map(file => ({
        ...file,
        fileData: undefined
      }));
      
      res.json(filesWithoutData);
    } catch (error) {
      console.error("Error fetching hackathon files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });
}
