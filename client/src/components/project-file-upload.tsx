import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProjectFileUploadProps {
  projectId?: string;
  episodeId?: string;
  scriptId?: string;
  onUploadSuccess: () => void;
  acceptedTypes?: string;
  title: string;
}

export function ProjectFileUpload({ 
  projectId, 
  episodeId, 
  scriptId, 
  onUploadSuccess, 
  acceptedTypes = "*", 
  title 
}: ProjectFileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setFile(selectedFile || null);
  };

  const getUploadEndpoint = () => {
    if (scriptId) return `/api/scripts/${scriptId}/upload`;
    if (episodeId) return `/api/episodes/${episodeId}/upload`;
    if (projectId) return `/api/projects/${projectId}/upload`;
    return "/api/files/upload";
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!projectId && !episodeId && !scriptId) {
      toast({
        title: "Invalid upload target",
        description: "Please select a project, episode, or script to upload to",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    // Add entity IDs to form data for proper organization
    if (projectId) formData.append("projectId", projectId);
    if (episodeId) formData.append("episodeId", episodeId);
    if (scriptId) formData.append("scriptId", scriptId);

    try {
      const response = await fetch(getUploadEndpoint(), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      toast({
        title: "Upload successful",
        description: result.message,
      });

      setFile(null);
      onUploadSuccess();
      
      // Reset the file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-2">
        <Upload className="h-5 w-5" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="file-upload">Select file to upload</Label>
        <Input
          id="file-upload"
          type="file"
          accept={acceptedTypes}
          onChange={handleFileChange}
          className="cursor-pointer"
        />
        <p className="text-sm text-muted-foreground">
          All file formats supported (PDF, DOC, Audio, Images, etc.)
        </p>
      </div>

      {file && (
        <div className="flex items-center gap-2 p-2 border rounded bg-muted">
          <FileText className="h-4 w-4" />
          <span className="text-sm font-medium">{file.name}</span>
          <span className="text-xs text-muted-foreground">
            ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </span>
        </div>
      )}

      <Button 
        onClick={handleUpload} 
        disabled={!file || isUploading}
        className="w-full"
      >
        {isUploading ? "Uploading..." : "Upload File"}
      </Button>
    </div>
  );
}