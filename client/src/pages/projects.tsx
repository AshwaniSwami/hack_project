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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { Plus, Edit, Trash2, Search, FolderOpen, Eye, Calendar, Star, Sparkles, TrendingUp, FileText, Activity } from "lucide-react";
import { ProjectDetailView } from "@/components/project-detail-view";
import type { Project, Episode, Script } from "@shared/schema";

const projectFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

export default function Projects() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: episodes = [] } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
  });

  const { data: scripts = [] } = useQuery<Script[]>({
    queryKey: ["/api/scripts"],
  });

  // Get all files to count script files per project
  const { data: allFiles = [] } = useQuery({
    queryKey: ["/api/files"],
    queryFn: async () => {
      const response = await fetch('/api/files');
      if (!response.ok) return [];
      return response.json();
    }
  });

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      return apiRequest("POST", "/api/projects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      return apiRequest("PUT", `/api/projects/${editingProject!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
      setEditingProject(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    if (editingProject) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.reset({
      name: project.name,
      description: project.description || "",
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Radio Content Projects
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Create, manage, and track your radio show projects with powerful tools and analytics
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-center mb-2">
                  <FolderOpen className="h-8 w-8 text-blue-200" />
                </div>
                <div className="text-3xl font-bold text-white">{projects.length}</div>
                <div className="text-blue-100">Total Projects</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-center mb-2">
                  <FileText className="h-8 w-8 text-purple-200" />
                </div>
                <div className="text-3xl font-bold text-white">{episodes.length}</div>
                <div className="text-purple-100">Episodes Created</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="h-8 w-8 text-teal-200" />
                </div>
                <div className="text-3xl font-bold text-white">{scripts.length}</div>
                <div className="text-teal-100">Scripts Written</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search projects by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
            />
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg font-semibold">
                <Plus className="h-5 w-5 mr-2" />
                Create New Project
                <Sparkles className="h-5 w-5 ml-2" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Create New Project
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">Project Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter a catchy project name" 
                            {...field} 
                            className="text-lg py-3 border-2 rounded-xl focus:border-purple-500"
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
                        <FormLabel className="text-lg font-semibold">Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your project's vision and goals..." 
                            {...field} 
                            className="text-lg py-3 border-2 rounded-xl focus:border-purple-500 min-h-[120px]"
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
                      className="px-6 py-2 rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-2 rounded-xl"
                    >
                      {createMutation.isPending ? "Creating..." : "Create Project"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse overflow-hidden border-0 shadow-xl">
                <div className="h-32 bg-gradient-to-r from-purple-200 via-blue-200 to-teal-200"></div>
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded-xl w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded-lg w-1/2 mb-6"></div>
                  <div className="space-y-3">
                    <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
                    <div className="flex gap-2">
                      <div className="h-10 bg-gray-200 rounded-lg flex-1"></div>
                      <div className="h-10 bg-gray-200 rounded-lg w-12"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
              <FolderOpen className="h-24 w-24 mx-auto text-gray-300 dark:text-gray-600 relative z-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {searchTerm ? "No projects found" : "Ready to create something amazing?"}
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              {searchTerm ? "Try adjusting your search terms or create a new project" : "Start your radio content journey by creating your first project"}
            </p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
            >
              <Plus className="h-6 w-6 mr-2" />
              Create Your First Project
              <Sparkles className="h-6 w-6 ml-2" />
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => {
              const projectEpisodes = episodes.filter(ep => ep.projectId === project.id).length;
              const projectScripts = scripts.filter(script => script.projectId === project.id).length + 
                                   allFiles.filter(file => file.entityType === 'scripts' && file.entityId === project.id).length;
              
              return (
                <Card key={project.id} className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md">
                  {/* Gradient Header */}
                  <div className="h-32 bg-gradient-to-br from-purple-500 via-blue-500 to-teal-500 relative">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(project)}
                        className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(project.id)}
                        className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{project.name}</h3>
                      <p className="text-blue-100 text-sm line-clamp-2">
                        {project.description || "No description provided"}
                      </p>
                    </div>
                  </div>
                
                  <CardContent className="pt-6 pb-6 px-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{projectEpisodes}</div>
                        <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">Episodes</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{projectScripts}</div>
                        <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">Scripts</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <div className="flex items-center justify-center">
                          <Star className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">Active</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Created Date */}
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
                      <Calendar className="h-4 w-4 mr-2" />
                      Created {new Date(project.createdAt!).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Button 
                        onClick={() => setViewingProject(project)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Project Details
                        <Sparkles className="h-4 w-4 ml-2" />
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleEdit(project)}
                          className="flex-1 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20 transition-all duration-300"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDelete(project.id)}
                          className="border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 text-red-600 transition-all duration-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Edit Project
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">Project Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter project name" 
                          {...field} 
                          className="text-lg py-3 border-2 rounded-xl focus:border-purple-500"
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
                      <FormLabel className="text-lg font-semibold">Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your project's vision and goals..." 
                          {...field} 
                          className="text-lg py-3 border-2 rounded-xl focus:border-purple-500 min-h-[120px]"
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
                    onClick={() => setEditingProject(null)}
                    className="px-6 py-2 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateMutation.isPending}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-2 rounded-xl"
                  >
                    {updateMutation.isPending ? "Updating..." : "Update Project"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Project Details Dialog */}
        <Dialog open={!!viewingProject} onOpenChange={() => setViewingProject(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Project Details: {viewingProject?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {viewingProject && (
                <ProjectDetailView 
                  project={viewingProject} 
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}