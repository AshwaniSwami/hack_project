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

export function registerTeamFileRoutes(app: Express) {
  // Upload files for specific teams
  app.post("/api/teams/:teamId/upload", upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const teamId = req.params.teamId;
      
      // Verify team exists
      const team = await storage.getEpisode(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Check upload-once restriction for participants
      const userId = req.session?.userId || req.user?.id;
      const user = userId ? await storage.getUser(userId) : undefined;
      
      // Get existing files for this team
      const existingFiles = await storage.getFilesByEntity('teams', teamId);
      
      // Check if user can upload (upload-once protection)
      const uploadCheck = await checkUploadOnceViolation(user, 'teams', teamId, existingFiles);
      if (!uploadCheck.allowed) {
        return res.status(403).json({ message: uploadCheck.message });
      }

      // Properly handle UTF-8 encoding for filenames
      const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
      
      const fileData = {
        filename: `team_${teamId}_${Date.now()}_${originalName}`,
        originalName: originalName,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        fileData: req.file.buffer.toString('base64'),
        entityType: 'teams',
        entityId: teamId,
        uploadedBy: userId,
      };

      const storedFile = await storage.createFile(fileData);

      res.status(201).json({ 
        message: "File uploaded successfully",
        file: storedFile
      });
    } catch (error) {
      console.error("Error uploading team file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Get files for specific team
  app.get("/api/teams/:teamId/files", async (req, res) => {
    try {
      const teamId = req.params.teamId;
      const files = await storage.getFilesByEntity('teams', teamId);
      
      const filesWithoutData = files.map(file => ({
        ...file,
        fileData: undefined
      }));
      
      res.json(filesWithoutData);
    } catch (error) {
      console.error("Error fetching team files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });
}
