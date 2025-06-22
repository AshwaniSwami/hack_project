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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Search,
  Eye,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  Sparkles,
  Upload,
  FolderOpen,
  Calendar,
  Zap
} from "lucide-react";
import { ScriptEditor } from "@/components/script-editor";
import { ScriptFileUpload } from "@/components/script-file-upload";
import { FileList } from "@/components/file-list";
import type { Script, Project } from "@shared/schema";

const scriptFormSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(["Draft", "Under Review", "Approved", "Published"]).default("Draft"),
});

type ScriptFormData = z.infer<typeof scriptFormSchema>;

const statusColors = {
  "Draft": "bg-gray-100 text-gray-700 border-gray-200",
  "Under Review": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Approved": "bg-green-100 text-green-700 border-green-200", 
  "Published": "bg-blue-100 text-blue-700 border-blue-200"
};

const statusIcons = {
  "Draft": Edit,
  "Under Review": AlertCircle,
  "Approved": CheckCircle,
  "Published": PlayCircle
};

export default function Scripts() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [viewingScript, setViewingScript] = useState<Script | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scripts = [], isLoading } = useQuery<Script[]>({
    queryKey: ["/api/scripts"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const form = useForm<ScriptFormData>({
    resolver: zodResolver(scriptFormSchema),
    defaultValues: {
      projectId: "",
      title: "",
      description: "",
      content: "",
      status: "Draft",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ScriptFormData) => {
      return apiRequest("POST", "/api/scripts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      toast({
        title: "Success",
        description: "Script created successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create script",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ScriptFormData) => {
      if (!editingScript) throw new Error("No script selected for editing");
      return apiRequest("PUT", `/api/scripts/${editingScript.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      toast({
        title: "Success",
        description: "Script updated successfully",
      });
      setEditingScript(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update script",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/scripts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      toast({
        title: "Success",
        description: "Script deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete script",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ScriptFormData) => {
    if (editingScript) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (script: Script) => {
    setEditingScript(script);
    form.reset({
      projectId: script.projectId,
      title: script.title,
      description: script.description || "",
      content: script.content || "",
      status: script.status as "Draft" | "Under Review" | "Approved" | "Published",
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this script?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredScripts = scripts.filter((script) => {
    const matchesSearch = script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (script.description && script.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || script.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
                    <FileText className="h-6 w-6 text-slate-700" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Scripts
                  </h1>
                  <p className="text-gray-300 text-sm">Create and manage your radio scripts and content</p>
                </div>
              </div>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-blue-500/25 border-0">
                    <Plus className="h-5 w-5 mr-3" />
                    New Script
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      Create New Script
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
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
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Draft">Draft</SelectItem>
                                  <SelectItem value="Under Review">Under Review</SelectItem>
                                  <SelectItem value="Approved">Approved</SelectItem>
                                  <SelectItem value="Published">Published</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter script title" {...field} />
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
                                placeholder="Enter script description" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter script content" 
                                rows={8}
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
                          {createMutation.isPending ? "Creating..." : "Create Script"}
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
        <Tabs defaultValue="scripts" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-[450px] bg-white/80 backdrop-blur-md shadow-xl border border-gray-200/50 p-1">
            <TabsTrigger value="scripts" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white transition-all duration-300">
              <FileText className="h-4 w-4" />
              Scripts
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

          <TabsContent value="scripts" className="space-y-6">
            {/* Search and Filter Bar */}
            <Card className="bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-xl">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="Search scripts by title or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 h-12 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48 h-12">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Under Review">Under Review</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Scripts List */}
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
            ) : filteredScripts.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-md border-0 shadow-2xl">
                <CardContent className="text-center py-20">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full blur-lg opacity-25 w-32 h-32 mx-auto"></div>
                    <div className="relative p-6 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-full w-32 h-32 mx-auto flex items-center justify-center border border-blue-100">
                      <FileText className="h-16 w-16 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-3">
                    {searchTerm || statusFilter !== "all" ? "No scripts found" : "No scripts yet"}
                  </h3>
                  <p className="text-gray-600 mb-8 text-xl max-w-md mx-auto">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your search or filter criteria" 
                      : "Start creating your radio scripts and content"
                    }
                  </p>
                  {!searchTerm && statusFilter === "all" && (
                    <Button 
                      onClick={() => setIsCreateDialogOpen(true)}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 px-8 py-3"
                    >
                      <Plus className="h-6 w-6 mr-3" />
                      Create Your First Script
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredScripts.map((script) => {
                  const project = projects.find(p => p.id === script.projectId);
                  const StatusIcon = statusIcons[script.status as keyof typeof statusIcons] || Edit;

                  return (
                    <Card key={script.id} className="group hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-xl hover:scale-[1.02] hover:shadow-blue-500/10">
                      <CardContent className="p-8">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl blur opacity-50"></div>
                              <div className="relative p-3 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl">
                                <FileText className="h-6 w-6 text-white" />
                              </div>
                            </div>
                            <div>
                              <Badge className={`text-sm px-3 py-1 ${statusColors[script.status as keyof typeof statusColors]}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {script.status.charAt(0).toUpperCase() + script.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setViewingScript(script)}
                              className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-emerald-50 hover:scale-110"
                            >
                              <Eye className="h-5 w-5 text-emerald-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(script)}
                              className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-blue-50 hover:scale-110"
                            >
                              <Edit className="h-5 w-5 text-blue-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(script.id)}
                              className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-50 hover:scale-110"
                            >
                              <Trash2 className="h-5 w-5 text-red-500" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-2xl font-bold text-gray-800 line-clamp-2 group-hover:text-blue-700 transition-colors duration-300">
                            {script.title}
                          </h3>

                          {project && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50/80 rounded-lg">
                              <FolderOpen className="h-5 w-5 text-blue-600" />
                              <span className="text-sm text-gray-700 font-semibold">{project.name}</span>
                            </div>
                          )}

                          {script.description && (
                            <p className="text-gray-600 line-clamp-3 leading-relaxed">
                              {script.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-500">
                                {new Date(script.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <Button 
                              onClick={() => setViewingScript(script)}
                              size="sm"
                              variant="outline"
                              className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50 hover:border-blue-300"
                            >
                              View Script
                            </Button>
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
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                  Upload Script Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScriptFileUpload />
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
                  Script Files by Project
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {projects.map((project) => {
                    const projectScripts = scripts.filter(script => script.projectId === project.id);
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
                              <FileText className="h-5 w-5 text-blue-600" />
                              Project Script Files
                            </h5>
                            <FileList 
                              entityType="projects" 
                              entityId={project.id}
                              title=""
                            />
                          </div>

                          {projectScripts.map((script) => (
                            <div key={script.id} className="pl-6 border-l-2 border-emerald-200 bg-emerald-50/30 rounded-r-lg">
                              <h5 className="text-sm font-semibold mb-3 text-gray-700 flex items-center gap-3 p-2">
                                <Zap className="h-5 w-5 text-emerald-600" />
                                {script.title}
                              </h5>
                              <FileList 
                                entityType="scripts" 
                                entityId={script.id}
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
      <Dialog open={!!editingScript} onOpenChange={() => setEditingScript(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                <Edit className="h-5 w-5 text-white" />
              </div>
              Edit Script
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Under Review">Under Review</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter script title" {...field} />
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
                        placeholder="Enter script description" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter script content" 
                        rows={8}
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
                  onClick={() => setEditingScript(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-lg"
                >
                  {updateMutation.isPending ? "Updating..." : "Update Script"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Script Dialog */}
      <Dialog open={!!viewingScript} onOpenChange={() => setViewingScript(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600" />
              {viewingScript?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[80vh] p-6">
            {viewingScript && (
              <ScriptEditor 
                isOpen={false}
                onClose={() => {}}
                script={viewingScript} 
                readOnly={true}
                onSave={() => setViewingScript(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}