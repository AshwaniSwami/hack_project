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
import type { Project, Episode } from "@shared/schema";

export function EpisodeFileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedEpisode, setSelectedEpisode] = useState<string>("none");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: episodes = [] } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
    select: (data) => selectedProject 
      ? data.filter(episode => episode.projectId === selectedProject)
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

    if (!selectedProject) {
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
    formData.append("projectId", selectedProject);
    if (selectedEpisode && selectedEpisode !== "none") {
      formData.append("episodeId", selectedEpisode);
    }

    try {
      let endpoint = "/api/projects/upload";
      if (selectedEpisode && selectedEpisode !== "none") {
        endpoint = `/api/episodes/${selectedEpisode}/upload`;
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
      setSelectedProject("");
      setSelectedEpisode("none");
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Episode Files
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="project-select">Project *</Label>
            <Select value={selectedProject} onValueChange={(value) => {
              setSelectedProject(value);
              setSelectedEpisode("none"); // Reset episode when project changes
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
            <Label htmlFor="episode-select">Specific Episode (Optional)</Label>
            <Select 
              value={selectedEpisode} 
              onValueChange={setSelectedEpisode}
              disabled={!selectedProject}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select episode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General project files</SelectItem>
                {episodes.map((episode) => (
                  <SelectItem key={episode.id} value={episode.id}>
                    Episode {episode.episodeNumber}: {episode.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="file-upload">Select episode file</Label>
          <Input
            id="file-upload"
            type="file"
            accept="audio/*,video/*,.mp3,.mp4,.wav,.m4a"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          <p className="text-sm text-muted-foreground">
            Supported formats: Audio and video files (MP3, MP4, WAV, M4A, etc.)
          </p>
        </div>

        {file && (
          <div className="flex items-center gap-2 p-2 border rounded bg-muted">
            <Music className="h-4 w-4" />
            <span className="text-sm font-medium">{file.name}</span>
            <span className="text-xs text-muted-foreground">
              ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
        )}

        <Button 
          onClick={handleUpload} 
          disabled={!file || !selectedProject || isUploading}
          className="w-full"
        >
          {isUploading ? "Uploading..." : "Upload Episode File"}
        </Button>
      </CardContent>
    </Card>
  );
}