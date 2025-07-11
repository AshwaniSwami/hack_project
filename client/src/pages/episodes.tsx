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
import { useAuth } from "@/hooks/useAuth";
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
  const { user } = useAuth();
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Compact Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-gray-900 to-zinc-900">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-emerald-600/10"></div>
        <div className="relative px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl blur opacity-75"></div>
                  <div className="relative p-3 bg-white rounded-xl">
                    <Radio className="h-6 w-6 text-slate-700" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Episodes
                  </h1>
                  <p className="text-gray-300 text-sm">Manage your radio episodes and audio content</p>
                </div>
              </div>
              
              {(user?.role === 'admin' || user?.role === 'editor') && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-blue-500/25 border-0">
                      <Plus className="h-5 w-5 mr-3" />
                      New Episode
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
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
                                    <span className="font-medium">{project.name}</span>
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
                          className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-lg"
                        >
                          {createMutation.isPending ? "Creating..." : "Create Episode"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="episodes" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-[450px] bg-white/80 backdrop-blur-md shadow-xl border border-gray-200/50 p-1">
            <TabsTrigger value="episodes" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white transition-all duration-300">
              <Play className="h-4 w-4" />
              Episodes
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white transition-all duration-300">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white transition-all duration-300">
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
              <Card className="bg-white/80 backdrop-blur-md border-0 shadow-2xl">
                <CardContent className="text-center py-20">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full blur-lg opacity-25 w-32 h-32 mx-auto"></div>
                    <div className="relative p-6 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-full w-32 h-32 mx-auto flex items-center justify-center border border-blue-100">
                      <Mic className="h-16 w-16 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-3">No episodes yet</h3>
                  <p className="text-gray-600 mb-8 text-xl max-w-md mx-auto">Start creating engaging radio content for your audience</p>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 px-8 py-3"
                  >
                    <Plus className="h-6 w-6 mr-3" />
                    Create Your First Episode
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {episodes.map((episode) => {
                  const project = projects.find(p => p.id === episode.projectId);
                  return (
                    <Card key={episode.id} className="group hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-xl hover:scale-[1.02] hover:shadow-blue-500/10">
                      <CardContent className="p-8">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl blur opacity-50"></div>
                              <div className="relative p-3 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl">
                                <Hash className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <div>
                              <Badge variant="secondary" className="text-sm bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1">
                                Episode {episode.episodeNumber}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {(user?.role === 'admin' || user?.role === 'editor') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(episode)}
                                className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-blue-50 hover:scale-110"
                              >
                                <Edit className="h-5 w-5 text-blue-600" />
                              </Button>
                            )}
                            {(user?.role === 'admin' || user?.role === 'editor') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(episode.id)}
                                className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-50 hover:scale-110"
                              >
                                <Trash2 className="h-5 w-5 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="font-bold text-xl text-gray-800 line-clamp-2 group-hover:text-blue-700 transition-colors duration-300">
                            {episode.title}
                          </h3>
                          
                          {project && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50/80 rounded-lg">
                              <FolderOpen className="h-5 w-5 text-blue-600" />
                              <span className="text-sm text-gray-700 font-semibold">{project.name}</span>
                            </div>
                          )}

                          {episode.description && (
                            <p className="text-gray-600 line-clamp-3 leading-relaxed">
                              {episode.description}
                            </p>
                          )}

                          {episode.broadcastDate && (
                            <div className="flex items-center space-x-3 p-2 bg-emerald-50/80 rounded-lg">
                              <Calendar className="h-5 w-5 text-emerald-600" />
                              <span className="text-sm text-emerald-700 font-medium">
                                {new Date(episode.broadcastDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-500">
                                {new Date(episode.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {episode.isPremium && (
                              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 px-3 py-1 shadow-lg">
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
            <Card className="bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-2xl">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                    <FileAudio className="h-6 w-6 text-white" />
                  </div>
                  Upload Episode Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EpisodeFileUpload />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files">
            <Card className="bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-2xl">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                    <FolderOpen className="h-6 w-6 text-white" />
                  </div>
                  Episode Files by Project
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {projects.map((project) => {
                    const projectEpisodes = episodes.filter(ep => ep.projectId === project.id);
                    return (
                      <Card key={project.id} className="bg-gradient-to-br from-gray-50 to-blue-50/50 border border-gray-200 shadow-lg">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                              <FolderOpen className="h-5 w-5 text-white" />
                            </div>
                            {project.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h5 className="text-sm font-semibold mb-3 text-gray-700 flex items-center gap-3 p-2 bg-blue-50/80 rounded-lg">
                              <FileAudio className="h-5 w-5 text-blue-600" />
                              Project Episode Files
                            </h5>
                            <FileList 
                              entityType="episodes" 
                              entityId={project.id}
                              title=""
                            />
                          </div>
                          
                          {projectEpisodes.map((episode) => (
                            <div key={episode.id} className="pl-6 border-l-2 border-emerald-200 bg-emerald-50/30 rounded-r-lg">
                              <h5 className="text-sm font-semibold mb-3 text-gray-700 flex items-center gap-3 p-2">
                                <Hash className="h-5 w-5 text-emerald-600" />
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
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                <Edit className="h-5 w-5 text-white" />
              </div>
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
                            <span className="font-medium">{project.name}</span>
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
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-lg"
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