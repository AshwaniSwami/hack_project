import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  FolderOpen, 
  Eye,
  Sparkles,
  Clock,
  BarChart3,
  FileText,
  Mic
} from "lucide-react";
import type { Project, Episode, Script } from "@shared/schema";
import { ProjectDetailView } from "@/components/project-detail-view";

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

  const { data: allFiles = { files: [] } } = useQuery({
    queryKey: ["/api/files"],
    queryFn: async () => {
      const response = await fetch('/api/files');
      if (!response.ok) return { files: [] };
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

  const projectFiles = allFiles?.files || [];

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
                    <FolderOpen className="h-6 w-6 text-slate-700" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Projects
                  </h1>
                  <p className="text-gray-300 text-sm">Manage your radio projects and content</p>
                </div>
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-blue-500/25 border-0">
                    <Plus className="h-5 w-5 mr-3" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
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
                          {createMutation.isPending ? "Creating..." : "Create Project"}
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
        {/* Search Bar */}
        <div className="mb-8">
          <Card className="bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-xl">
            <CardContent className="p-6">
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search projects by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse bg-white/60 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-md border-0 shadow-2xl">
            <CardContent className="text-center py-20">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full blur-lg opacity-25 w-32 h-32 mx-auto"></div>
                <div className="relative p-6 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-full w-32 h-32 mx-auto flex items-center justify-center border border-blue-100">
                  <FolderOpen className="h-16 w-16 text-blue-600" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-3">
                {searchTerm ? "No projects found" : "No projects yet"}
              </h3>
              <p className="text-gray-600 mb-8 text-xl max-w-md mx-auto">
                {searchTerm 
                  ? "Try adjusting your search terms to find projects" 
                  : "Start organizing your radio content with your first project"
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 px-8 py-3"
                >
                  <Plus className="h-6 w-6 mr-3" />
                  Create Your First Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => {
              const projectEpisodes = episodes.filter(ep => ep.projectId === project.id);
              const projectScripts = scripts.filter(script => script.projectId === project.id);
              const projectScriptFiles = projectFiles.filter(file => 
                file.entityType === 'scripts' && 
                (file.entityId === project.id || projectScripts.some(script => script.id === file.entityId))
              );
              
              return (
                <Card key={project.id} className="group hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-xl hover:scale-[1.02] hover:shadow-blue-500/10">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl blur opacity-50"></div>
                          <div className="relative p-3 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl">
                            <FolderOpen className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setViewingProject(project)}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-emerald-50 hover:scale-110"
                        >
                          <Eye className="h-5 w-5 text-emerald-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(project)}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-blue-50 hover:scale-110"
                        >
                          <Edit className="h-5 w-5 text-blue-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(project.id)}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-50 hover:scale-110"
                        >
                          <Trash2 className="h-5 w-5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-gray-800 line-clamp-2 group-hover:text-blue-700 transition-colors duration-300">
                        {project.name}
                      </h3>
                      
                      {project.description && (
                        <p className="text-gray-600 line-clamp-3 leading-relaxed">
                          {project.description}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-3 gap-4 pt-4">
                        <div className="text-center p-3 bg-blue-50/80 rounded-lg border border-blue-100">
                          <Mic className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                          <div className="text-lg font-bold text-blue-700">{projectEpisodes.length}</div>
                          <div className="text-xs text-blue-600">Episodes</div>
                        </div>
                        <div className="text-center p-3 bg-emerald-50/80 rounded-lg border border-emerald-100">
                          <FileText className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
                          <div className="text-lg font-bold text-emerald-700">{projectScripts.length}</div>
                          <div className="text-xs text-emerald-600">Scripts</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50/80 rounded-lg border border-purple-100">
                          <BarChart3 className="h-5 w-5 mx-auto text-purple-600 mb-1" />
                          <div className="text-lg font-bold text-purple-700">{projectScriptFiles.length}</div>
                          <div className="text-xs text-purple-600">Files</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {new Date(project.createdAt!).toLocaleDateString()}
                          </span>
                        </div>
                        <Button 
                          onClick={() => setViewingProject(project)}
                          size="sm"
                          variant="outline"
                          className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50 hover:border-blue-300"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                <Edit className="h-5 w-5 text-white" />
              </div>
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
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingProject(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-lg"
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
            <DialogTitle>Project Details: {viewingProject?.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[80vh]">
            {viewingProject && <ProjectDetailView project={viewingProject} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}