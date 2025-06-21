import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Mic, 
  Play,
  Calendar,
  FileAudio,
  Upload,
  Clock,
  Hash,
  FolderOpen,
  Sparkles,
  Radio
} from "lucide-react";
import { EpisodeFileUpload } from "@/components/episode-file-upload";
import { FileList } from "@/components/file-list";
import type { Episode, Project } from "@shared/schema";

const episodeFormSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  title: z.string().min(1, "Title is required"),
  episodeNumber: z.coerce.number().min(1, "Episode number must be at least 1"),
  description: z.string().optional(),
  broadcastDate: z.string().optional(),
  isPremium: z.boolean().default(false),
});

type EpisodeFormData = z.infer<typeof episodeFormSchema>;

export default function Episodes() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: episodes = [], isLoading } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const form = useForm<EpisodeFormData>({
    resolver: zodResolver(episodeFormSchema),
    defaultValues: {
      projectId: "",
      title: "",
      episodeNumber: 1,
      description: "",
      broadcastDate: "",
      isPremium: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: EpisodeFormData) => {
      const payload = {
        ...data,
        broadcastDate: data.broadcastDate || null,
      };
      return apiRequest("POST", "/api/episodes", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
      toast({
        title: "Success",
        description: "Episode created successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create episode",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EpisodeFormData & { id: string }) => {
      const { id, ...payload } = data;
      return apiRequest("PUT", `/api/episodes/${id}`, {
        ...payload,
        broadcastDate: payload.broadcastDate || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
      toast({
        title: "Success",
        description: "Episode updated successfully",
      });
      setEditingEpisode(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update episode",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/episodes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
      toast({
        title: "Success",
        description: "Episode deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete episode",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EpisodeFormData) => {
    createMutation.mutate(data);
  };

  const onUpdateSubmit = (data: EpisodeFormData) => {
    if (editingEpisode) {
      updateMutation.mutate({ ...data, id: editingEpisode.id });
    }
  };

  const handleEdit = (episode: Episode) => {
    setEditingEpisode(episode);
    form.reset({
      projectId: episode.projectId,
      title: episode.title,
      episodeNumber: episode.episodeNumber,
      description: episode.description || "",
      broadcastDate: episode.broadcastDate || "",
      isPremium: episode.isPremium || false,
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this episode?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative px-6 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <Radio className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">Episodes</h1>
                  <p className="text-white/80 text-lg">Manage your radio episodes and audio content</p>
                </div>
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-white shadow-lg transition-all duration-200 hover:scale-105">
                    <Plus className="h-5 w-5 mr-2" />
                    New Episode
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      Create New Episode
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="projectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {projects.map((project) => (
                                  <SelectItem key={project.id} value={project.id}>
                                    {project.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter episode title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="episodeNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Episode Number</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="1" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter episode description" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="broadcastDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Broadcast Date (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-3 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createMutation.isPending}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                          {createMutation.isPending ? "Creating..." : "Create Episode"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="episodes" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px] bg-white/60 backdrop-blur-sm">
            <TabsTrigger value="episodes" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Episodes
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Files
            </TabsTrigger>
          </TabsList>

          <TabsContent value="episodes" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse bg-white/60 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : episodes.length === 0 ? (
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="text-center py-16">
                  <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <Mic className="h-12 w-12 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No episodes yet</h3>
                  <p className="text-gray-600 mb-6 text-lg">Start creating engaging radio content</p>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Episode
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {episodes.map((episode) => {
                  const project = projects.find(p => p.id === episode.projectId);
                  return (
                    <Card key={episode.id} className="group hover:shadow-2xl transition-all duration-300 bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:scale-105">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                              <Hash className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                                Episode {episode.episodeNumber}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(episode)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(episode.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h3 className="font-bold text-lg text-gray-900 line-clamp-2 group-hover:text-purple-700 transition-colors">
                            {episode.title}
                          </h3>
                          
                          {project && (
                            <div className="flex items-center space-x-2">
                              <FolderOpen className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600 font-medium">{project.name}</span>
                            </div>
                          )}

                          {episode.description && (
                            <p className="text-sm text-gray-600 line-clamp-3">
                              {episode.description}
                            </p>
                          )}

                          {episode.broadcastDate && (
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {new Date(episode.broadcastDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {new Date(episode.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {episode.isPremium && (
                              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0">
                                Premium
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload">
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileAudio className="h-5 w-5 text-purple-600" />
                  Upload Episode Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EpisodeFileUpload />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files">
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-purple-600" />
                  Episode Files by Project
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {projects.map((project) => {
                    const projectEpisodes = episodes.filter(ep => ep.projectId === project.id);
                    return (
                      <Card key={project.id} className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FolderOpen className="h-5 w-5 text-blue-600" />
                            {project.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h5 className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                              <FileAudio className="h-4 w-4" />
                              Project Episode Files
                            </h5>
                            <FileList 
                              entityType="episodes" 
                              entityId={project.id}
                              title=""
                            />
                          </div>
                          
                          {projectEpisodes.map((episode) => (
                            <div key={episode.id} className="pl-4 border-l-2 border-purple-200">
                              <h5 className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                                <Hash className="h-4 w-4 text-purple-600" />
                                Episode {episode.episodeNumber}: {episode.title}
                              </h5>
                              <FileList 
                                entityType="episodes" 
                                entityId={episode.id}
                                title=""
                              />
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingEpisode} onOpenChange={() => setEditingEpisode(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Edit Episode
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onUpdateSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter episode title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="episodeNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Episode Number</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"  
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter episode description" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="broadcastDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Broadcast Date (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingEpisode(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {updateMutation.isPending ? "Updating..." : "Update Episode"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}