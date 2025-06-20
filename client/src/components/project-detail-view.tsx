import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileList } from "@/components/file-list";
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
  onAddEpisode: () => void;
}

export function ProjectDetailView({ project, onAddEpisode }: ProjectDetailViewProps) {
  const queryClient = useQueryClient();

  const { data: episodes = [] } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
    select: (data) => data.filter(episode => episode.projectId === project.id)
  });

  const { data: scripts = [] } = useQuery<Script[]>({
    queryKey: ["/api/scripts"],
    select: (data) => data.filter(script => script.projectId === project.id)
  });

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
              {episodes.length} episodes • {scripts.length} scripts
            </Badge>
          </CardTitle>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
        </CardHeader>
      </Card>

      <Tabs defaultValue="episodes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="episodes">Episodes</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
        </TabsList>

        <TabsContent value="episodes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Episodes</h3>
            <Button onClick={onAddEpisode}>
              <Plus className="h-4 w-4 mr-2" />
              Add Episode
            </Button>
          </div>
          
          <div className="grid gap-4">
            {episodes.map((episode) => (
              <Card key={episode.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{episode.title}</h4>
                      <p className="text-sm text-muted-foreground">Episode #{episode.episodeNumber}</p>
                      {episode.description && (
                        <p className="text-sm mt-2">{episode.description}</p>
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
            
            {episodes.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No episodes yet</p>
                  <Button onClick={onAddEpisode} className="mt-4">
                    Create First Episode
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="scripts" className="space-y-4">
          <h3 className="text-lg font-semibold">Scripts</h3>
          
          <div className="grid gap-4">
            {scripts.map((script) => {
              const episode = episodes.find(ep => ep.id === script.episodeId);
              return (
                <Card key={script.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{script.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Episode: {episode?.title} (#{episode?.episodeNumber})
                        </p>
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
            
            {scripts.length === 0 && (
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