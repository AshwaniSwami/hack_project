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
  Radio,
  Grid3X3,
  List,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Star,
  ArrowUpDown,
  Copy,
  Archive,
  RefreshCw
} from "lucide-react";
import { TeamFileUpload } from "@/components/episode-file-upload";
import { FileList } from "@/components/file-list";
import { colors, getCardStyle, getGradientStyle } from "@/lib/colors";
import type { Team, Hackathon } from "@shared/schema";

const episodeFormSchema = z.object({
  projectId: z.string().min(1, "Hackathon is required"),
  title: z.string().min(1, "Title is required"),
  episodeNumber: z.coerce.number().min(1, "Team number must be at least 1"),
  description: z.string().optional(),
  broadcastDate: z.string().optional(),
  isPremium: z.boolean().default(false),
});

type TeamFormData = z.infer<typeof episodeFormSchema>;

export default function Teams() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setHackathonFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'title' | 'date' | 'episode'>('episode');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: episodes = [], isLoading } = useQuery<Team[]>({
    queryKey: ["/api/episodes"],
  });

  const { data: projects = [] } = useQuery<Hackathon[]>({
    queryKey: ["/api/projects"],
  });

  const form = useForm<TeamFormData>({
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
    mutationFn: async (data: TeamFormData) => {
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
        description: "Team created successfully",
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
    mutationFn: async (data: TeamFormData & { id: string }) => {
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
        description: "Team updated successfully",
      });
      setEditingTeam(null);
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
        description: "Team deleted successfully",
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

  const onSubmit = (data: TeamFormData) => {
    createMutation.mutate(data);
  };

  const onUpdateSubmit = (data: TeamFormData) => {
    if (editingTeam) {
      updateMutation.mutate({ ...data, id: editingTeam.id });
    }
  };

  const handleEdit = (episode: Team) => {
    setEditingTeam(episode);
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

  const handleBulkDelete = () => {
    if (selectedTeams.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedTeams.length} episodes?`)) {
      selectedTeams.forEach(id => deleteMutation.mutate(id));
      setSelectedTeams([]);
    }
  };

  const toggleTeamSelection = (id: string) => {
    setSelectedTeams(prev => 
      prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
    );
  };



  const filteredAndSortedTeams = episodes
    .filter((episode) => {
      const project = projects.find(p => p.id === episode.projectId);
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = episode.title.toLowerCase().includes(searchLower) ||
        (episode.description && episode.description.toLowerCase().includes(searchLower)) ||
        (project?.name.toLowerCase().includes(searchLower)) ||
        episode.episodeNumber.toString().includes(searchLower);
      const matchesHackathon = projectFilter === 'all' || episode.projectId === projectFilter;
      return matchesSearch && matchesHackathon;
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
        case 'episode':
          compareValue = a.episodeNumber - b.episodeNumber;
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
                    <Radio className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                  </div>
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${colors.text.primary} mb-1 ${colors.gradients.text}`}>
                    Teams
                  </h1>
                  <p className="text-slate-600 dark:text-gray-400 text-sm">Manage your radio episodes and audio content</p>
                </div>
              </div>
              
              {(user?.role === 'organizer' || user?.role === 'analyzer') && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className={colors.button.primary}>
                      <Plus className="h-5 w-5 mr-3" />
                      New Team
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      Create New Team
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="projectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hackathon</FormLabel>
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
                            <FormLabel>Team Number</FormLabel>
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
                          {createMutation.isPending ? "Creating..." : "Create Team"}
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
          <TabsList className="grid w-full grid-cols-3 lg:w-[450px] bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-1">
            <TabsTrigger value="episodes" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-rose-500 data-[state=active]:text-white transition-all duration-300 text-gray-700 dark:text-gray-300">
              <Play className="h-4 w-4" />
              Teams
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

          <TabsContent value="episodes" className="space-y-6">
            {/* Enhanced Controls Panel */}
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                      <Input
                        placeholder="Search episodes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-sky-500 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <Select value={projectFilter} onValueChange={setHackathonFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Hackathons" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Hackathons</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Sort Options */}
                    <div className="flex items-center gap-2">
                      <Select value={sortBy} onValueChange={(value: 'title' | 'date' | 'episode') => setSortBy(value)}>
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="episode">Team #</SelectItem>
                          <SelectItem value="title">Title</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
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
                    {selectedTeams.length > 0 && (user?.role === 'organizer' || user?.role === 'analyzer') && (
                      <div className="flex items-center gap-2 mr-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{selectedTeams.length} selected</span>
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
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/episodes"] })}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1 border rounded-md">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className={`rounded-r-none ${viewMode === 'grid' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className={`rounded-l-none ${viewMode === 'list' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
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
                      Showing {filteredAndSortedTeams.length} of {episodes.length} episodes
                    </div>
                  </div>
                  {(searchQuery || projectFilter !== 'all') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setHackathonFilter('all');
                      }}
                      className="text-xs"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

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
            ) : filteredAndSortedTeams.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-md border-0 shadow-xl">
                <CardContent className="text-center py-16">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full blur-lg opacity-25 w-24 h-24 mx-auto"></div>
                    <div className="relative p-4 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-full w-24 h-24 mx-auto flex items-center justify-center border border-blue-100">
                      <Mic className="h-12 w-12 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    {searchQuery || projectFilter !== 'all' ? 'No episodes found' : 'No episodes yet'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                    {searchQuery || projectFilter !== 'all' ? 'Try adjusting your search filters' : 'Start creating engaging radio content for your audience'}
                  </p>
                  {(!searchQuery && projectFilter === 'all') && (user?.role === 'organizer' || user?.role === 'analyzer') && (
                    <Button 
                      onClick={() => setIsCreateDialogOpen(true)}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Create Your First Team
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredAndSortedTeams.map((episode) => {
                  const project = projects.find(p => p.id === episode.projectId);
                  return (
                    <Card key={episode.id} className="group hover:shadow-lg transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 hover:scale-[1.02] hover:border-blue-300 dark:hover:border-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {(user?.role === 'organizer' || user?.role === 'analyzer') && (
                              <input
                                type="checkbox"
                                checked={selectedTeams.includes(episode.id)}
                                onChange={() => toggleTeamSelection(episode.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            )}
                            <Badge variant="secondary" className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 px-2 py-1">
                              #{episode.episodeNumber}
                            </Badge>
                          </div>
                          <div className="flex space-x-1">
                            {(user?.role === 'organizer' || user?.role === 'analyzer') && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(episode)}
                                  className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-7 w-7 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                >
                                  <Edit className="h-3 w-3 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(episode.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-7 w-7 p-0 hover:bg-red-50 dark:hover:bg-red-900/30"
                                >
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100 line-clamp-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors duration-300 leading-tight">
                            {episode.title}
                          </h3>
                          
                          {project && (
                            <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                              <FolderOpen className="h-3 w-3 text-blue-500" />
                              <span className="truncate">{project.name}</span>
                            </div>
                          )}

                          {episode.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                              {episode.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(episode.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {episode.isPremium && (
                              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 px-2 py-0 text-xs">
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
            ) : (
              <div className="space-y-3">
                {filteredAndSortedTeams.map((episode) => {
                  const project = projects.find(p => p.id === episode.projectId);
                  return (
                    <Card key={episode.id} className="group hover:shadow-md transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 hover:border-blue-300 dark:hover:border-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="flex items-center gap-2">
                              {(user?.role === 'organizer' || user?.role === 'analyzer') && (
                                <input
                                  type="checkbox"
                                  checked={selectedTeams.includes(episode.id)}
                                  onChange={() => toggleTeamSelection(episode.id)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              )}
                              <Badge variant="secondary" className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 px-2 py-1 shrink-0">
                                #{episode.episodeNumber}
                              </Badge>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors duration-300">
                                {episode.title}
                              </h3>
                              <div className="flex items-center space-x-4 mt-1">
                                {project && (
                                  <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
                                    <FolderOpen className="h-3 w-3 text-blue-500" />
                                    <span>{project.name}</span>
                                  </div>
                                )}
                                <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                                  <Clock className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                  <span>{new Date(episode.createdAt).toLocaleDateString()}</span>
                                </div>
                                {episode.isPremium && (
                                  <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 px-2 py-0 text-xs">
                                    Premium
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-1 shrink-0">
                            {(user?.role === 'organizer' || user?.role === 'analyzer') && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(episode)}
                                  className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                >
                                  <Edit className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(episode.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/30"
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
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-600/50 shadow-2xl">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl text-gray-900 dark:text-gray-100">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                    <FileAudio className="h-6 w-6 text-white" />
                  </div>
                  Upload Team Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TeamFileUpload />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-600/50 shadow-2xl">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl text-gray-900 dark:text-gray-100">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                    <FolderOpen className="h-6 w-6 text-white" />
                  </div>
                  Team Files by Hackathon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {projects.map((project) => {
                    const projectTeams = episodes.filter(ep => ep.projectId === project.id);
                    return (
                      <Card key={project.id} className="bg-gradient-to-br from-gray-50 to-blue-50/50 dark:from-gray-800 dark:to-blue-900/20 border border-gray-200 dark:border-gray-600 shadow-lg">
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
                            <h5 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300 flex items-center gap-3 p-2 bg-blue-50/80 dark:bg-blue-900/20 rounded-lg">
                              <FileAudio className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              Hackathon Team Files
                            </h5>
                            <FileList 
                              entityType="episodes" 
                              entityId={project.id}
                              title=""
                            />
                          </div>
                          
                          {projectTeams.map((episode) => (
                            <div key={episode.id} className="pl-6 border-l-2 border-emerald-200 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/20 rounded-r-lg">
                              <h5 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300 flex items-center gap-3 p-2">
                                <Hash className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                Team {episode.episodeNumber}: {episode.title}
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
      <Dialog open={!!editingTeam} onOpenChange={() => setEditingTeam(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                <Edit className="h-5 w-5 text-white" />
              </div>
              Edit Team
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onUpdateSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hackathon</FormLabel>
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
                    <FormLabel>Team Number</FormLabel>
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
                  onClick={() => setEditingTeam(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-lg"
                >
                  {updateMutation.isPending ? "Updating..." : "Update Team"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}