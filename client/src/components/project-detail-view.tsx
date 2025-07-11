import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileList } from "@/components/file-list";
import { EnhancedFileManager } from "@/components/enhanced-file-manager";
import { 
  Plus, 
  FileText, 
  Users, 
  Calendar,
  FolderOpen
} from "lucide-react";
import type { Project, Episode, Script } from "@shared/schema";

interface ProjectDetailViewProps {
  project: Project;
}

export function ProjectDetailView({ project }: ProjectDetailViewProps) {
  const queryClient = useQueryClient();

  const { data: episodes = [] } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
    select: (data) => data.filter(episode => episode.projectId === project.id)
  });

  const { data: scripts = [] } = useQuery<Script[]>({
    queryKey: ["/api/scripts"],
    select: (data) => data.filter(script => script.projectId === project.id)
  });

  // Get project-level files to count episodes and scripts
  const { data: projectEpisodeFilesResponse = { files: [] } } = useQuery({
    queryKey: ['/api/files', 'episodes', project.id],
    queryFn: async () => {
      const response = await fetch(`/api/files?entityType=episodes&entityId=${project.id}`);
      if (!response.ok) return { files: [] };
      const data = await response.json();
      return data.files ? data : { files: data };
    }
  });

  const { data: projectScriptFilesResponse = { files: [] } } = useQuery({
    queryKey: ['/api/files', 'scripts', project.id],
    queryFn: async () => {
      const response = await fetch(`/api/files?entityType=scripts&entityId=${project.id}`);
      if (!response.ok) return { files: [] };
      const data = await response.json();
      return data.files ? data : { files: data };
    }
  });

  const projectEpisodeFiles = projectEpisodeFilesResponse?.files || [];
  const projectScriptFiles = projectScriptFilesResponse?.files || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              {project.name}
            </div>
            <Badge variant="secondary">
              {episodes.length + projectEpisodeFiles.length} episodes • {scripts.length + projectScriptFiles.length} scripts
            </Badge>
          </CardTitle>
          {project.description && (
            <div className="mt-4 p-4 bg-blue-50/80 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Project Description</h4>
              <p className="text-blue-700 leading-relaxed">{project.description}</p>
            </div>
          )}
        </CardHeader>
      </Card>

      <Tabs defaultValue="episodes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="episodes">Episodes</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
        </TabsList>



        <TabsContent value="episodes" className="space-y-4">
          <h3 className="text-lg font-semibold">Episodes</h3>
          
          <div className="grid gap-4">
            {episodes.map((episode) => (
              <Card key={episode.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{episode.title}</h4>
                      <p className="text-sm text-muted-foreground">Episode #{episode.episodeNumber}</p>
                      {episode.description && (
                        <div className="mt-3 p-2 bg-blue-50/80 rounded-md">
                          <p className="text-xs font-medium text-blue-600 mb-1">Description</p>
                          <p className="text-sm text-blue-700">{episode.description}</p>
                        </div>
                      )}
                      {episode.broadcastDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Broadcast: {new Date(episode.broadcastDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {episode.isPremium && (
                        <Badge variant="secondary">Premium</Badge>
                      )}
                      <FileList 
                        entityType="episodes" 
                        entityId={episode.id}
                        title={`Episode ${episode.episodeNumber} Files`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Show project-level episode files only if there are any */}
            {projectEpisodeFiles.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Project Episode Files</h4>
                    <p className="text-sm text-muted-foreground">Audio/video files uploaded to this project</p>
                    <FileList 
                      entityType="episodes" 
                      entityId={project.id}
                      title=""
                    />
                  </div>
                </CardContent>
              </Card>
            )}
            
            {episodes.length === 0 && projectEpisodeFiles.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No episodes yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Episodes can be created from the Episodes page</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="scripts" className="space-y-4">
          <h3 className="text-lg font-semibold">Scripts</h3>
          
          <div className="grid gap-4">
            {scripts.map((script) => {
              // Scripts don't have episodeId field in current schema
              return (
                <Card key={script.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{script.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {script.updatedAt ? new Date(script.updatedAt).toLocaleDateString() : 'No date'}
                        </p>
                        {script.description && (
                          <div className="mt-3 p-2 bg-emerald-50/80 rounded-md">
                            <p className="text-xs font-medium text-emerald-600 mb-1">Description</p>
                            <p className="text-sm text-emerald-700">{script.description}</p>
                          </div>
                        )}
                        <Badge className="mt-2" variant="outline">
                          {script.status}
                        </Badge>
                      </div>
                      <FileList 
                        entityType="scripts" 
                        entityId={script.id}
                        title={`${script.title} Files`}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {/* Show project-level script files only if there are any */}
            {projectScriptFiles.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Project Script Files</h4>
                    <p className="text-sm text-muted-foreground">Document files uploaded to this project</p>
                    <FileList 
                      entityType="scripts" 
                      entityId={project.id}
                      title=""
                    />
                  </div>
                </CardContent>
              </Card>
            )}
            
            {scripts.length === 0 && projectScriptFiles.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No scripts yet</p>
                  <p className="text-sm text-muted-foreground">Create episodes first, then add scripts</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>


      </Tabs>
    </div>
  );
}