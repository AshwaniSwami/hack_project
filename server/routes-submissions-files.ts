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

export function registerSubmissionFileRoutes(app: Express) {
  // Upload files for specific submissions
  app.post("/api/submissions/:submissionId/upload", upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const submissionId = req.params.submissionId;
      
      // Verify submission exists
      const submission = await storage.getScript(submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      // Check upload-once restriction for participants
      const userId = req.session?.userId || req.user?.id;
      const user = userId ? await storage.getUser(userId) : undefined;
      
      // Get existing files for this submission
      const existingFiles = await storage.getFilesByEntity('submissions', submissionId);
      
      // Check if user can upload (upload-once protection)
      const uploadCheck = await checkUploadOnceViolation(user, 'submissions', submissionId, existingFiles);
      if (!uploadCheck.allowed) {
        return res.status(403).json({ message: uploadCheck.message });
      }

      // Properly handle UTF-8 encoding for filenames
      const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
      
      const fileData = {
        filename: `submission_${submissionId}_${Date.now()}_${originalName}`,
        originalName: originalName,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        fileData: req.file.buffer.toString('base64'),
        entityType: 'submissions',
        entityId: submissionId,
        uploadedBy: userId,
      };

      const storedFile = await storage.createFile(fileData);

      res.status(201).json({ 
        message: "File uploaded successfully",
        file: storedFile
      });
    } catch (error) {
      console.error("Error uploading submission file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Get files for specific submission
  app.get("/api/submissions/:submissionId/files", async (req, res) => {
    try {
      const submissionId = req.params.submissionId;
      const files = await storage.getFilesByEntity('submissions', submissionId);
      
      const filesWithoutData = files.map(file => ({
        ...file,
        fileData: undefined
      }));
      
      res.json(filesWithoutData);
    } catch (error) {
      console.error("Error fetching submission files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });
}
