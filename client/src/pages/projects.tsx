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
import { Plus, Edit, Trash2, Search, FolderOpen, Eye, Calendar, Users, FileText, Zap, Star, TrendingUp, Rocket, Sparkles } from "lucide-react";
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
      if (!editingProject) throw new Error("No project selected for editing");
      return apiRequest("PUT", `/api/projects/${editingProject.id}`, data);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-8 mb-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Rocket className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Project Hub</h1>
                    <p className="text-blue-100 text-lg">Manage your creative radio content projects</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-white/90">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">{projects.length} Active Projects</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">{episodes.length} Episodes Created</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">{scripts.length} Scripts Written</span>
                  </div>
                </div>
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="lg" 
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create New Project
                    <Sparkles className="h-4 w-4 ml-2" />
                  </Button>
                </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project name" {...field} />
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
                            placeholder="Enter project description" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-8">
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search your amazing projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-0 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm rounded-xl text-base shadow-lg focus:shadow-xl transition-all duration-300"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-300 bg-white/60 dark:bg-slate-700/60 px-4 py-2 rounded-xl backdrop-blur-sm">
                {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} found
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded-lg w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="mt-6 h-10 bg-gray-200 rounded-xl"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
            <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/20 max-w-md mx-auto">
              <div className="mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-xl opacity-20"></div>
                  <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-2xl w-fit mx-auto">
                    <FolderOpen className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {searchTerm ? "No projects found" : "Your creative journey starts here"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
                {searchTerm ? "Try adjusting your search terms" : "Create your first project and bring your radio content ideas to life"}
              </p>
              
              {!searchTerm && (
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Project
                  <Rocket className="h-5 w-5 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredProjects.map((project, index) => {
            const projectEpisodes = episodes.filter(ep => ep.projectId === project.id).length;
            const projectScripts = scripts.filter(script => script.projectId === project.id).length + 
                                   allFiles.filter(file => file.entityType === 'scripts' && file.entityId === project.id).length;
            
            return (
              <Card 
                key={project.id} 
                className="group bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 overflow-hidden"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                {/* Gradient Header */}
                <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"></div>
                
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                        <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-2xl">
                          <Zap className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300 truncate">
                          {project.name}
                        </CardTitle>
                        <p className="text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {project.description || "No description provided"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(project)}
                        className="h-8 w-8 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(project.id)}
                        className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter project name" {...field} />
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
                        placeholder="Enter project description" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingProject(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update"}
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
            <DialogTitle>Project Details: {viewingProject?.name}</DialogTitle>
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
  );
}
