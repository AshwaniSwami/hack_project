import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFilePermissions } from "@/hooks/useFilePermissions";
import type { Hackathon, Team, Submission } from "@shared/schema";

export function SubmissionFileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedHackathon, setSelectedHackathon] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("none");
  const [selectedSubmission, setSelectedSubmission] = useState<string>("none");

  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { permissions, isLoading: permissionsLoading } = useFilePermissions();

  const { data: projects = [] } = useQuery<Hackathon[]>({
    queryKey: ["/api/projects"],
  });

  const { data: episodes = [] } = useQuery<Team[]>({
    queryKey: ["/api/episodes"],
    select: (data) => selectedHackathon 
      ? data.filter(episode => episode.projectId === selectedHackathon)
      : data
  });

  const { data: scripts = [] } = useQuery<Submission[]>({
    queryKey: ["/api/scripts"],
    select: (data) => selectedHackathon 
      ? data.filter(script => script.projectId === selectedHackathon)
      : data
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setFile(selectedFile || null);
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

    if (!selectedHackathon) {
      toast({
        title: "No project selected",
        description: "Please select a project for the script",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", selectedHackathon);
    if (selectedTeam && selectedTeam !== "none") {
      formData.append("episodeId", selectedTeam);
    }
    if (selectedSubmission && selectedSubmission !== "none") {
      formData.append("scriptId", selectedSubmission);
    }

    try {
      // Choose endpoint based on what's selected
      let endpoint = `/api/projects/${selectedHackathon}/upload`;
      if (selectedSubmission && selectedSubmission !== "none") {
        endpoint = `/api/scripts/${selectedSubmission}/upload`;
      }

      const response = await fetch(endpoint, {
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
      setSelectedHackathon("");
      setSelectedTeam("none");
      setSelectedSubmission("none");
      
      // Invalidate all related queries to update project stats
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/episodes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scripts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      
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

  // Show permission denied message for users without upload access
  if (!permissions.canUpload) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Submission Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            You don't have permission to upload files. Only Admin and Editor users can upload files.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Submission Files
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="project-select">Hackathon *</Label>
            <Select value={selectedHackathon} onValueChange={(value) => {
              setSelectedHackathon(value);
              setSelectedTeam("none");
              setSelectedSubmission("none");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <span className="font-medium">{project.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="episode-select">Team (Optional)</Label>
            <Select 
              value={selectedTeam} 
              onValueChange={setSelectedTeam}
              disabled={!selectedHackathon}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select episode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific episode</SelectItem>
                {episodes.map((episode) => (
                  <SelectItem key={episode.id} value={episode.id}>
                    Team {episode.episodeNumber}: {episode.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="script-select">Submission (Optional)</Label>
            <Select 
              value={selectedSubmission} 
              onValueChange={setSelectedSubmission}
              disabled={!selectedHackathon}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select script" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific script</SelectItem>
                {scripts.map((script) => (
                  <SelectItem key={script.id} value={script.id}>
                    {script.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="file-upload">Select script file</Label>
          <Input
            id="file-upload"
            type="file"
            accept=".pdf,.doc,.docx,.txt,.rtf"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Supported formats: PDF, DOC, DOCX, TXT, RTF
          </p>
        </div>

        {file && (
          <div className="flex items-center gap-2 p-2 border rounded bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600">
            <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
        )}

        <Button 
          onClick={handleUpload} 
          disabled={!file || !selectedHackathon || isUploading}
          className="w-full"
        >
          {isUploading ? "Uploading..." : "Upload Submission File"}
        </Button>
        
        {selectedSubmission !== "none" && (
          <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
            File will be associated with the selected script: <strong>{scripts.find(s => s.id === selectedSubmission)?.title}</strong>
          </p>
        )}
      </CardContent>
    </Card>
  );
}