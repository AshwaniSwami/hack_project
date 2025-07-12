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
import { useAuth } from "@/hooks/useAuth";
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
  Zap,
  Grid3X3,
  List,
  Filter,
  SortAsc,
  SortDesc,
  Star,
  ArrowUpDown,
  Copy,
  Archive,
  RefreshCw,
  BookOpen,
  Target
} from "lucide-react";
import { ScriptEditor } from "@/components/script-editor";
import { ScriptFileUpload } from "@/components/script-file-upload";
import { FileList } from "@/components/file-list";
import { colors, getStatusColor, getCardStyle, getGradientStyle } from "@/lib/colors";
import type { Script, Project } from "@shared/schema";

const scriptFormSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(["Draft", "Under Review", "Approved", "Published"]).default("Draft"),
});

type ScriptFormData = z.infer<typeof scriptFormSchema>;



const statusIcons = {
  "Draft": Edit,
  "Under Review": AlertCircle,
  "Approved": CheckCircle,
  "Published": PlayCircle
} as const;

export default function Scripts() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [viewingScript, setViewingScript] = useState<Script | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'title' | 'date' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedScripts, setSelectedScripts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();
  const { user } = useAuth();
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

  const handleBulkDelete = () => {
    if (selectedScripts.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedScripts.length} scripts?`)) {
      selectedScripts.forEach(id => deleteMutation.mutate(id));
      setSelectedScripts([]);
    }
  };

  const toggleScriptSelection = (id: string) => {
    setSelectedScripts(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };



  const filteredAndSortedScripts = scripts
    .filter((script) => {
      const project = projects.find(p => p.id === script.projectId);
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = script.title.toLowerCase().includes(searchLower) ||
        (script.description && script.description.toLowerCase().includes(searchLower)) ||
        (project?.name.toLowerCase().includes(searchLower));
      const matchesStatus = statusFilter === "all" || script.status === statusFilter;
      const matchesProject = projectFilter === 'all' || script.projectId === projectFilter;
      return matchesSearch && matchesStatus && matchesProject;
    })
    .sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'title':
          compareValue = a.title.localeCompare(b.title);
          break;
        case 'date':
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'status':
          const statusOrder = ['Draft', 'Under Review', 'Approved', 'Published'];
          compareValue = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
          break;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

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
                    <FileText className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                  </div>
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${colors.text.primary} mb-1 ${colors.gradients.text}`}>
                    Scripts
                  </h1>
                  <p className="text-slate-600 dark:text-gray-400 text-sm">Create and manage your radio scripts and content</p>
                </div>
              </div>

              {(user?.role === 'admin' || user?.role === 'editor') && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className={colors.button.primary}>
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="scripts" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-[450px] bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-1">
            <TabsTrigger value="scripts" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-rose-500 data-[state=active]:text-white transition-all duration-300 text-gray-700 dark:text-gray-300">
              <FileText className="h-4 w-4" />
              Scripts
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-rose-500 data-[state=active]:text-white transition-all duration-300 text-gray-700 dark:text-gray-300">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-rose-500 data-[state=active]:text-white transition-all duration-300 text-gray-700 dark:text-gray-300">
              <FolderOpen className="h-4 w-4" />
              Files
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scripts" className="space-y-6">
            {/* Enhanced Controls Panel */}
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                      <Input
                        placeholder="Search scripts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-sky-500 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Under Review">Under Review</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={projectFilter} onValueChange={setProjectFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Projects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Sort Options */}
                    <div className="flex items-center gap-2">
                      <Select value={sortBy} onValueChange={(value: 'title' | 'date' | 'status') => setSortBy(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="title">Title</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="px-2"
                      >
                        {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Action Controls */}
                  <div className="flex items-center gap-2">
                    {selectedScripts.length > 0 && (user?.role === 'admin' || user?.role === 'editor') && (
                      <div className="flex items-center gap-2 mr-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{selectedScripts.length} selected</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleBulkDelete}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/scripts"] })}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1 border rounded-md">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className={`rounded-r-none ${viewMode === 'grid' ? 'bg-sky-600 hover:bg-sky-700 text-white' : ''}`}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className={`rounded-l-none ${viewMode === 'list' ? 'bg-sky-600 hover:bg-sky-700 text-white' : ''}`}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Results Count */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {filteredAndSortedScripts.length} of {scripts.length} scripts
                    </div>
                  </div>
                  {(searchTerm || statusFilter !== 'all' || projectFilter !== 'all') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setProjectFilter('all');
                      }}
                      className="text-xs"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Scripts List */}
            {isLoading ? (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" : "space-y-3"}>
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse bg-white/60 backdrop-blur-sm">
                    <CardContent className={viewMode === 'grid' ? "p-4" : "p-4"}>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredAndSortedScripts.length === 0 ? (
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-0 shadow-xl">
                <CardContent className="text-center py-16">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-rose-500 rounded-full blur-lg opacity-25 w-24 h-24 mx-auto"></div>
                    <div className="relative p-4 bg-gradient-to-br from-sky-50 to-rose-50 dark:from-gray-700 dark:to-gray-600 rounded-full w-24 h-24 mx-auto flex items-center justify-center border border-sky-100 dark:border-gray-600">
                      <FileText className="h-12 w-12 text-sky-600 dark:text-sky-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    {searchTerm || statusFilter !== "all" || projectFilter !== 'all' ? 'No scripts found' : 'No scripts yet'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                    {searchTerm || statusFilter !== "all" || projectFilter !== 'all'
                      ? "Try adjusting your search filters" 
                      : "Start creating your first radio script"}
                  </p>
                  {(!searchTerm && statusFilter === "all" && projectFilter === 'all') && (user?.role === 'admin' || user?.role === 'editor') && (
                    <Button 
                      onClick={() => setIsCreateDialogOpen(true)}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Create Your First Script
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredAndSortedScripts.map((script) => {
                  const project = projects.find(p => p.id === script.projectId);
                  const StatusIcon = statusIcons[script.status as keyof typeof statusIcons];
                  return (
                    <Card key={script.id} className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:scale-[1.02] hover:border-blue-300">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {(user?.role === 'admin' || user?.role === 'editor') && (
                              <input
                                type="checkbox"
                                checked={selectedScripts.includes(script.id)}
                                onChange={() => toggleScriptSelection(script.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            )}
                            <Badge variant="secondary" className={`text-xs px-2 py-1 ${getStatusColor(script.status)}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {script.status}
                            </Badge>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingScript(script)}
                              className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-7 w-7 p-0 hover:bg-green-50"
                            >
                              <Eye className="h-3 w-3 text-green-600" />
                            </Button>
                            {(user?.role === 'admin' || user?.role === 'editor') && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(script)}
                                  className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-7 w-7 p-0 hover:bg-blue-50"
                                >
                                  <Edit className="h-3 w-3 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(script.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-7 w-7 p-0 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200 line-clamp-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors duration-300 leading-tight">
                            {script.title}
                          </h3>
                          
                          {project && (
                            <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                              <FolderOpen className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                              <span className="truncate">{project.name}</span>
                            </div>
                          )}

                          {script.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                              {script.description}
                            </p>
                          )}

                          <div className="flex items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(script.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAndSortedScripts.map((script) => {
                  const project = projects.find(p => p.id === script.projectId);
                  const StatusIcon = statusIcons[script.status as keyof typeof statusIcons];
                  return (
                    <Card key={script.id} className="group hover:shadow-md transition-all duration-300 bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:border-blue-300">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="flex items-center gap-2">
                              {(user?.role === 'admin' || user?.role === 'editor') && (
                                <input
                                  type="checkbox"
                                  checked={selectedScripts.includes(script.id)}
                                  onChange={() => toggleScriptSelection(script.id)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              )}
                              <Badge variant="secondary" className={`text-xs px-2 py-1 shrink-0 ${getStatusColor(script.status)}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {script.status}
                              </Badge>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors duration-300">
                                {script.title}
                              </h3>
                              <div className="flex items-center space-x-4 mt-1">
                                {project && (
                                  <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
                                    <FolderOpen className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                                    <span>{project.name}</span>
                                  </div>
                                )}
                                <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                                  <Clock className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                  <span>{new Date(script.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingScript(script)}
                              className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-8 w-8 p-0 hover:bg-green-50"
                            >
                              <Eye className="h-4 w-4 text-green-600" />
                            </Button>
                            {(user?.role === 'admin' || user?.role === 'editor') && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(script)}
                                  className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-8 w-8 p-0 hover:bg-blue-50"
                                >
                                  <Edit className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(script.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-8 w-8 p-0 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
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
                      <Card key={project.id} className="bg-gradient-to-br from-gray-50 to-blue-50/50 dark:from-gray-800 dark:to-blue-900/20 border border-gray-200 dark:border-gray-700 shadow-lg">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg flex items-center gap-3 text-gray-900 dark:text-gray-100">
                            <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                              <FolderOpen className="h-5 w-5 text-white" />
                            </div>
                            {project.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h5 className="text-sm font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-3 p-2 bg-blue-50/80 dark:bg-blue-900/20 rounded-lg">
                              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              Project Script Files
                            </h5>
                            <FileList 
                              entityType="projects" 
                              entityId={project.id}
                              title=""
                            />
                          </div>

                          {projectScripts.map((script) => (
                            <div key={script.id} className="pl-6 border-l-2 border-emerald-200 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/20 rounded-r-lg">
                              <h5 className="text-sm font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-3 p-2">
                                <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
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