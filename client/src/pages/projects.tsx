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
import { colors, getCardStyle, getGradientStyle } from "@/lib/colors";
import type { Hackathon, Team, Submission } from "@shared/schema";
import { HackathonDetailView } from "@/components/project-detail-view";
import { HackathonCard } from "@/components/HackathonCard";

const projectFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  themeId: z.string().optional().transform((val) => val === "" ? undefined : val),
});

const themeFormSchema = z.object({
  name: z.string().min(1, "Theme name is required"),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
});

type HackathonFormData = z.infer<typeof projectFormSchema>;
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

export default function Hackathons() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const [editingHackathon, setEditingHackathon] = useState<Hackathon | null>(null);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [viewingHackathon, setViewingHackathon] = useState<Hackathon | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedThemeFilter, setSelectedThemeFilter] = useState<string>("all");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery<Hackathon[]>({
    queryKey: ["/api/projects"],
  });

  const { data: themes = [] } = useQuery<Theme[]>({
    queryKey: ["/api/themes"],
  });

  const { data: episodes = [] } = useQuery<Team[]>({
    queryKey: ["/api/episodes"],
  });

  const { data: scripts = [] } = useQuery<Submission[]>({
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

  const form = useForm<HackathonFormData>({
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
    mutationFn: async (data: HackathonFormData) => {
      return apiRequest("POST", "/api/projects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Hackathon created successfully",
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
    mutationFn: async (data: HackathonFormData) => {
      if (!editingHackathon) throw new Error("No project selected for editing");
      return apiRequest("PUT", `/api/projects/${editingHackathon.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Hackathon updated successfully",
      });
      setEditingHackathon(null);
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
        description: "Hackathon deleted successfully",
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

  const onSubmit = (data: HackathonFormData) => {
    if (editingHackathon) {
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

  const handleEdit = (project: Hackathon) => {
    setEditingHackathon(project);
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

  const filteredHackathons = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesTheme = selectedThemeFilter === "all" || 
      project.themeId === selectedThemeFilter ||
      (selectedThemeFilter === "unthemed" && !project.themeId);
    
    return matchesSearch && matchesTheme;
  });

  const projectFiles = allFiles?.files || [];

  return (
    <div className={`min-h-screen ${getGradientStyle('main')} relative`}>
      <div className="floating-bg"></div>
      {/* Enhanced Header */}
      <div className={`relative overflow-hidden ${getCardStyle('accent')} backdrop-blur-sm shadow-lg border-b ${colors.border.accent}`}>
        <div className={`absolute inset-0 ${getGradientStyle('header')}`}></div>
        <div className="relative px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-rose-400 rounded-xl blur opacity-20"></div>
                  <div className="relative p-3 bg-sky-50 dark:bg-gray-700 backdrop-blur-sm rounded-xl border border-sky-200/50 dark:border-gray-600/50">
                    <FolderOpen className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                  </div>
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${colors.text.primary} mb-1 ${colors.gradients.text}`}>
                    Hackathons
                  </h1>
                  <p className="text-slate-600 dark:text-gray-400 text-sm">Organize and manage your radio content projects</p>
                </div>
              </div>
              
              {((user as any)?.role === 'organizer' || (user as any)?.role === 'analyzer') && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className={colors.button.primary}>
                      <Plus className="h-5 w-5 mr-3" />
                      New Hackathon
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      Create New Hackathon
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
                                className="w-full h-10 px-3 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500/20"
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
                          {createMutation.isPending ? "Creating..." : "Create Hackathon"}
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
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <Input
                    placeholder="Search projects by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 text-lg bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-sky-500 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedThemeFilter}
                    onChange={(e) => setSelectedThemeFilter(e.target.value)}
                    className="h-12 px-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-sky-500 focus:ring-sky-500/20 text-sm"
                  >
                    <option value="all">All Themes</option>
                    <option value="unthemed">Unthemed</option>
                    {themes.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                  {((user as any)?.role === 'organizer' || (user as any)?.role === 'analyzer') && (
                    <Button
                      variant="outline"
                      onClick={handleCreateTheme}
                      className="h-12 px-4 border-gray-200 dark:border-gray-600 hover:bg-sky-50 dark:hover:bg-gray-700 hover:border-sky-300"
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
                      ? "bg-sky-500 text-white" 
                      : "hover:bg-sky-50 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => setSelectedThemeFilter("all")}
                >
                  All Hackathons ({projects.length})
                </Badge>
                {themes.map((theme) => {
                  const themeHackathonCount = projects.filter(p => p.themeId === theme.id).length;
                  return (
                    <Badge
                      key={theme.id}
                      variant={selectedThemeFilter === theme.id ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        selectedThemeFilter === theme.id 
                          ? "text-white" 
                          : "hover:bg-sky-50 dark:hover:bg-gray-700"
                      }`}
                      style={{
                        backgroundColor: selectedThemeFilter === theme.id ? theme.colorHex : undefined,
                        borderColor: theme.colorHex,
                        color: selectedThemeFilter === theme.id ? "white" : theme.colorHex
                      }}
                      onClick={() => setSelectedThemeFilter(theme.id)}
                    >
                      {theme.name} ({themeHackathonCount})
                    </Badge>
                  );
                })}
                <Badge
                  variant={selectedThemeFilter === "unthemed" ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    selectedThemeFilter === "unthemed" 
                      ? "bg-gray-500 text-white" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => setSelectedThemeFilter("unthemed")}
                >
                  Unthemed ({projects.filter(p => !p.themeId).length})
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hackathons List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-gray-200 dark:border-gray-700">
                <CardContent className="p-8">
                  <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredHackathons.length === 0 ? (
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-0 shadow-2xl">
            <CardContent className="text-center py-20">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-rose-500 rounded-full blur-lg opacity-25 w-32 h-32 mx-auto"></div>
                <div className="relative p-6 bg-gradient-to-br from-sky-50 to-rose-50 dark:from-gray-700 dark:to-gray-600 rounded-full w-32 h-32 mx-auto flex items-center justify-center border border-sky-100 dark:border-gray-600">
                  <FolderOpen className="h-16 w-16 text-sky-600 dark:text-sky-400" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                {searchTerm ? "No projects found" : "No projects yet"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-xl max-w-md mx-auto">
                {searchTerm 
                  ? "Try adjusting your search terms to find projects" 
                  : ((user as any)?.role === 'organizer' || (user as any)?.role === 'analyzer') 
                    ? "Start organizing your radio content with your first project"
                    : "No projects available yet. Contact an admin or editor to create projects."
                }
              </p>
              {!searchTerm && ((user as any)?.role === 'organizer' || (user as any)?.role === 'analyzer') && (
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 px-8 py-3"
                >
                  <Plus className="h-6 w-6 mr-3" />
                  Create Your First Hackathon
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredHackathons.map((project) => {
              const projectTheme = themes.find(theme => theme.id === project.themeId);
              
              return (
                <HackathonCard
                  key={project.id}
                  project={project}
                  theme={projectTheme}
                  user={user}
                  onView={setViewingHackathon}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingHackathon} onOpenChange={() => setEditingHackathon(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                <Edit className="h-5 w-5 text-white" />
              </div>
              Edit Hackathon
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
                        className="w-full h-10 px-3 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500/20"
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
                  onClick={() => setEditingHackathon(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-lg"
                >
                  {updateMutation.isPending ? "Updating..." : "Update Hackathon"}
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
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
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
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Existing Themes</h3>
              <div className="max-h-96 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {themes.map((theme) => {
                    const projectCount = projects.filter(p => p.themeId === theme.id).length;
                    return (
                      <Card key={theme.id} className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
                              style={{ backgroundColor: theme.colorHex }}
                            />
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">{theme.name}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
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

      {/* Hackathon Details Dialog */}
      <Dialog open={!!viewingHackathon} onOpenChange={() => setViewingHackathon(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Hackathon Details: {viewingHackathon?.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[80vh]">
            {viewingHackathon && <HackathonDetailView project={viewingHackathon} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}