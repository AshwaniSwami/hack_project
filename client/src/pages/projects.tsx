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
import { useAuth } from "@/hooks/useAuth";
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
import { ProjectCard } from "@/components/ProjectCard";

const projectFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  themeId: z.string().optional().transform((val) => val === "" ? undefined : val),
});

const themeFormSchema = z.object({
  name: z.string().min(1, "Theme name is required"),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;
type ThemeFormData = z.infer<typeof themeFormSchema>;

interface Theme {
  id: string;
  name: string;
  description?: string;
  colorHex: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Projects() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedThemeFilter, setSelectedThemeFilter] = useState<string>("all");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: themes = [] } = useQuery<Theme[]>({
    queryKey: ["/api/themes"],
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
      themeId: "",
    },
  });

  const themeForm = useForm<ThemeFormData>({
    resolver: zodResolver(themeFormSchema),
    defaultValues: {
      name: "",
      colorHex: "#3B82F6",
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

  const createThemeMutation = useMutation({
    mutationFn: async (data: ThemeFormData) => {
      return apiRequest("POST", "/api/themes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      toast({
        title: "Success",
        description: "Theme created successfully",
      });
      setIsThemeDialogOpen(false);
      themeForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create theme",
        variant: "destructive",
      });
    },
  });

  const updateThemeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ThemeFormData> }) => {
      return apiRequest("PUT", `/api/themes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      toast({
        title: "Success",
        description: "Theme updated successfully",
      });
      setIsThemeDialogOpen(false);
      setEditingTheme(null);
      themeForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update theme",
        variant: "destructive",
      });
    },
  });

  const deleteThemeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/themes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      toast({
        title: "Success",
        description: "Theme deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete theme",
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

  const onThemeSubmit = (data: ThemeFormData) => {
    if (editingTheme) {
      updateThemeMutation.mutate({ id: editingTheme.id, data });
    } else {
      createThemeMutation.mutate(data);
    }
  };

  const handleCreateTheme = () => {
    setEditingTheme(null);
    themeForm.reset({
      name: "",
      colorHex: "#3B82F6",
    });
    setIsThemeDialogOpen(true);
  };

  const handleEditTheme = (theme: Theme) => {
    setEditingTheme(theme);
    themeForm.reset({
      name: theme.name,
      colorHex: theme.colorHex,
    });
    setIsThemeDialogOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.reset({
      name: project.name,
      description: project.description || "",
      themeId: project.themeId || "",
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTheme = selectedThemeFilter === "all" || 
      project.themeId === selectedThemeFilter ||
      (selectedThemeFilter === "unthemed" && !project.themeId);
    
    return matchesSearch && matchesTheme;
  });

  const projectFiles = allFiles?.files || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 relative">
      <div className="floating-bg"></div>
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-white shadow-lg border-b border-blue-100">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-sky-500/10 to-cyan-500/10"></div>
        <div className="relative px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-sky-400 rounded-xl blur opacity-30"></div>
                  <div className="relative p-4 bg-blue-50 backdrop-blur-sm rounded-xl border border-blue-200">
                    <FolderOpen className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 mb-2 bg-gradient-to-r from-sky-500 to-red-500 bg-clip-text text-transparent">
                    Projects
                  </h1>
                  <p className="text-slate-600 text-sm">Manage your radio projects and content</p>
                </div>
              </div>
              
              {(user?.role === 'admin' || user?.role === 'editor') && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg transition-all duration-300 hover:scale-105 border-0">
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
                      
                      <FormField
                        control={form.control}
                        name="themeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Theme (Optional)</FormLabel>
                            <FormControl>
                              <select
                                {...field}
                                className="w-full h-10 px-3 border border-gray-200 rounded-md bg-white focus:border-blue-500 focus:ring-blue-500/20"
                              >
                                <option value="">No theme</option>
                                {themes.map((theme) => (
                                  <option key={theme.id} value={theme.id}>
                                    {theme.name}
                                  </option>
                                ))}
                              </select>
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter Bar */}
        <div className="mb-8">
          <Card className="bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search projects by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedThemeFilter}
                    onChange={(e) => setSelectedThemeFilter(e.target.value)}
                    className="h-12 px-4 border border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:ring-blue-500/20 text-sm"
                  >
                    <option value="all">All Themes</option>
                    <option value="unthemed">Unthemed</option>
                    {themes.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                  {(user?.role === 'admin' || user?.role === 'editor') && (
                    <Button
                      variant="outline"
                      onClick={handleCreateTheme}
                      className="h-12 px-4 border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Themes
                    </Button>
                  )}
                </div>
              </div>
              {/* Theme Pills */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge
                  variant={selectedThemeFilter === "all" ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    selectedThemeFilter === "all" 
                      ? "bg-blue-500 text-white" 
                      : "hover:bg-blue-50"
                  }`}
                  onClick={() => setSelectedThemeFilter("all")}
                >
                  All Projects ({projects.length})
                </Badge>
                {themes.map((theme) => {
                  const themeProjectCount = projects.filter(p => p.themeId === theme.id).length;
                  return (
                    <Badge
                      key={theme.id}
                      variant={selectedThemeFilter === theme.id ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        selectedThemeFilter === theme.id 
                          ? "text-white" 
                          : "hover:bg-blue-50"
                      }`}
                      style={{
                        backgroundColor: selectedThemeFilter === theme.id ? theme.colorHex : undefined,
                        borderColor: theme.colorHex,
                        color: selectedThemeFilter === theme.id ? "white" : theme.colorHex
                      }}
                      onClick={() => setSelectedThemeFilter(theme.id)}
                    >
                      {theme.name} ({themeProjectCount})
                    </Badge>
                  );
                })}
                <Badge
                  variant={selectedThemeFilter === "unthemed" ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    selectedThemeFilter === "unthemed" 
                      ? "bg-gray-500 text-white" 
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedThemeFilter("unthemed")}
                >
                  Unthemed ({projects.filter(p => !p.themeId).length})
                </Badge>
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
                  : (user?.role === 'admin' || user?.role === 'editor') 
                    ? "Start organizing your radio content with your first project"
                    : "No projects available yet. Contact an admin or editor to create projects."
                }
              </p>
              {!searchTerm && (user?.role === 'admin' || user?.role === 'editor') && (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => {
              const projectTheme = themes.find(theme => theme.id === project.themeId);
              
              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  theme={projectTheme}
                  user={user}
                  onView={setViewingProject}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
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
              
              <FormField
                control={form.control}
                name="themeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Theme (Optional)</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full h-10 px-3 border border-gray-200 rounded-md bg-white focus:border-blue-500 focus:ring-blue-500/20"
                      >
                        <option value="">No theme</option>
                        {themes.map((theme) => (
                          <option key={theme.id} value={theme.id}>
                            {theme.name}
                          </option>
                        ))}
                      </select>
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

      {/* Theme Management Dialog */}
      <Dialog open={isThemeDialogOpen} onOpenChange={setIsThemeDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              Theme Management
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Create New Theme Form */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">
                {editingTheme ? "Edit Theme" : "Create New Theme"}
              </h3>
              <Form {...themeForm}>
                <form onSubmit={themeForm.handleSubmit(onThemeSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={themeForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Theme Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Technology, Sports, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={themeForm.control}
                      name="colorHex"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input 
                                type="color" 
                                {...field} 
                                className="w-16 h-10 p-1 border rounded"
                              />
                              <Input 
                                placeholder="#3B82F6"
                                {...field}
                                className="flex-1"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  

                  
                  <div className="flex items-center gap-2">
                    <Button
                      type="submit"
                      disabled={createThemeMutation.isPending || updateThemeMutation.isPending}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {editingTheme ? "Update" : "Create"} Theme
                    </Button>
                    {editingTheme && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingTheme(null);
                          themeForm.reset({ name: "", colorHex: "#3B82F6" });
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </div>

            {/* Existing Themes */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Existing Themes</h3>
              <div className="max-h-96 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {themes.map((theme) => {
                    const projectCount = projects.filter(p => p.themeId === theme.id).length;
                    return (
                      <Card key={theme.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-6 h-6 rounded-full border-2 border-gray-300"
                              style={{ backgroundColor: theme.colorHex }}
                            />
                            <div>
                              <h4 className="font-medium">{theme.name}</h4>
                              <p className="text-sm text-gray-500">
                                {projectCount} project{projectCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditTheme(theme)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (projectCount > 0) {
                                  alert(`Cannot delete theme: ${projectCount} project(s) are using this theme.`);
                                  return;
                                }
                                if (window.confirm(`Delete theme "${theme.name}"?`)) {
                                  deleteThemeMutation.mutate(theme.id);
                                }
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
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