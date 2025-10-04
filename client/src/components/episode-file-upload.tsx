import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Music } from "lucide-react";
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
import type { Hackathon, Team } from "@shared/schema";

export function TeamFileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedHackathon, setSelectedHackathon] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("none");

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
        description: "Please select a project for the episode file",
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

    try {
      let endpoint = `/api/projects/${selectedHackathon}/upload`;
      if (selectedTeam && selectedTeam !== "none") {
        endpoint = `/api/episodes/${selectedTeam}/upload`;
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
            Upload Team Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            You don't have permission to upload files. Only Admin and Editor users can upload files.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Upload className="h-5 w-5" />
          Upload Team Files
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="project-select" className="text-gray-900 dark:text-gray-100">Hackathon *</Label>
            <Select value={selectedHackathon} onValueChange={(value) => {
              setSelectedHackathon(value);
              setSelectedTeam("none");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="episode-select" className="text-gray-900 dark:text-gray-100">Specific Team (Optional)</Label>
            <Select 
              value={selectedTeam} 
              onValueChange={setSelectedTeam}
              disabled={!selectedHackathon}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select episode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General project files</SelectItem>
                {episodes.map((episode) => (
                  <SelectItem key={episode.id} value={episode.id}>
                    Team {episode.episodeNumber}: {episode.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="file-upload" className="text-gray-900 dark:text-gray-100">Select episode file</Label>
          <Input
            id="file-upload"
            type="file"
            accept="audio/*,video/*,.mp3,.mp4,.wav,.m4a"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Supported formats: Audio and video files (MP3, MP4, WAV, M4A, etc.)
          </p>
        </div>

        {file && (
          <div className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700">
            <Music className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
        )}

        <Button 
          onClick={handleUpload} 
          disabled={!file || !selectedHackathon || isUploading}
          className="w-full"
        >
          {isUploading ? "Uploading..." : "Upload Team File"}
        </Button>
      </CardContent>
    </Card>
  );
}