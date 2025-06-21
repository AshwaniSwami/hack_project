import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScriptEditor } from "@/components/script-editor";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  FolderPlus, 
  Mic, 
  FileText, 
  Radio,
  Edit,
  Trash2,
  FolderOpen,
  TrendingUp,
  Calendar,
  Users,
  Activity,
  BarChart3,
  Sparkles,
  Clock,
  Zap,
  Target,
  ArrowUpRight,
  PlayCircle,
  PenTool,
  Headphones,
  Waves,
  Podcast,
  Megaphone,
  Volume2,
  Rss
} from "lucide-react";
import type { Script, Project, Episode, RadioStation } from "@shared/schema";

export default function Dashboard() {
  const [isScriptEditorOpen, setIsScriptEditorOpen] = useState(false);
  const [selectedScript, setSelectedScript] = useState<Script | undefined>(undefined);
  const [showGoals, setShowGoals] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: scripts = [], isLoading: scriptsLoading } = useQuery<Script[]>({
    queryKey: ["/api/scripts"],
  });

  const deleteScriptMutation = useMutation({
    mutationFn: async (scriptId: string) => {
      const response = await fetch(`/api/scripts/${scriptId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete script");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      toast({
        title: "Script deleted",
        description: "The script has been successfully removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete script. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: episodes = [] } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
  });

  const { data: radioStations = [] } = useQuery<RadioStation[]>({
    queryKey: ["/api/radio-stations"],
  });

  // Calculate stats with proper filtering
  const stats = {
    activeProjects: projects.length,
    episodesThisMonth: episodes.filter(episode => {
      if (!episode.createdAt) return false;
      const episodeDate = new Date(episode.createdAt);
      const now = new Date();
      return episodeDate.getMonth() === now.getMonth() && 
             episodeDate.getFullYear() === now.getFullYear();
    }).length,
    scriptsPending: scripts.filter(script => 
      script.status === "Under Review" || script.status === "Submitted" || script.status === "Draft"
    ).length,
    radioStations: radioStations.length,
  };

  // Calculate progress towards monthly goal (assuming 10 episodes per month as target)
  const monthlyEpisodeGoal = 10;
  const episodeProgress = Math.min((stats.episodesThisMonth / monthlyEpisodeGoal) * 100, 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
      case "Under Review":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
      case "Draft":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
      case "Needs Revision":
        return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300";
    }
  };

  const handleEditScript = (script: Script) => {
    setSelectedScript(script);
    setIsScriptEditorOpen(true);
  };

  const handleCloseScriptEditor = () => {
    setIsScriptEditorOpen(false);
    setSelectedScript(undefined);
  };

  const handleDeleteScript = (scriptId: string) => {
    deleteScriptMutation.mutate(scriptId);
  };

  const recentScripts = scripts.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-white/20 shadow-2xl">
                  <AvatarFallback className="bg-gradient-to-br from-white/20 to-white/5 text-white text-2xl font-bold backdrop-blur-sm">
                    AD
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1 h-6 w-6 bg-green-400 border-2 border-white rounded-full flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Welcome back, Admin! 
                </h1>
                <p className="text-white/90 text-lg mb-4">
                  Ready to create amazing radio content today?
                </p>
                <div className="flex items-center space-x-4 text-sm text-white/80">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Activity className="h-4 w-4" />
                    <span>All systems operational</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden lg:flex space-x-4">
              <Button 
                size="lg"
                className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                onClick={() => setIsScriptEditorOpen(true)}
              >
                <Zap className="h-5 w-5 mr-2" />
                Quick Start
              </Button>
              <Button 
                size="lg"
                className="bg-amber-500 text-white hover:bg-amber-600 border-2 border-amber-400 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold"
                onClick={() => setShowGoals(true)}
              >
                <Target className="h-5 w-5 mr-2" />
                View Goals
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 -mt-16 relative z-10">
          <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Active Projects</p>
                  <p className="text-4xl font-bold text-slate-800">{stats.activeProjects}</p>
                  <div className="flex items-center mt-3 text-sm">
                    <TrendingUp className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-blue-700 font-semibold">Growing</span>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl">
                  <FolderOpen className="h-10 w-10 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-50 to-orange-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Episodes This Month</p>
                  <p className="text-4xl font-bold text-slate-800">{stats.episodesThisMonth}</p>
                  <div className="flex items-center mt-3">
                    <Progress value={episodeProgress} className="w-24 h-2 mr-3" />
                    <span className="text-sm text-amber-700 font-semibold">{Math.round(episodeProgress)}% complete</span>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-amber-600 to-orange-700 rounded-3xl shadow-xl">
                  <Podcast className="h-10 w-10 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-50 to-green-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Scripts Pending</p>
                  <p className="text-4xl font-bold text-slate-800">{stats.scriptsPending}</p>
                  <div className="flex items-center mt-3 text-sm">
                    <Clock className="h-4 w-4 text-emerald-600 mr-2" />
                    <span className="text-emerald-700 font-semibold">In Review</span>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-emerald-600 to-green-700 rounded-3xl shadow-xl">
                  <FileText className="h-10 w-10 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-50 to-violet-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Radio Stations</p>
                  <p className="text-4xl font-bold text-slate-800">{stats.radioStations}</p>
                  <div className="flex items-center mt-3 text-sm">
                    <Volume2 className="h-4 w-4 text-purple-600 mr-2" />
                    <span className="text-purple-700 font-semibold">Connected</span>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-600 to-violet-700 rounded-3xl shadow-xl">
                  <Radio className="h-10 w-10 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Scripts */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-100 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-800 flex items-center">
                      <FileText className="h-7 w-7 mr-3 text-slate-600" />
                      Recent Scripts
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-2">Your latest script submissions and drafts</p>
                  </div>
                  <Button 
                    onClick={() => setIsScriptEditorOpen(true)}
                    className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Script
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {scriptsLoading ? (
                  <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-3/4 mb-3"></div>
                        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : recentScripts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
                      <FileText className="h-20 w-20 mx-auto mb-6 text-gray-300 dark:text-gray-600 relative z-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No scripts created yet</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">Get started by creating your first script. Share your ideas with the world through compelling radio content.</p>
                    <Button 
                      size="lg"
                      className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" 
                      onClick={() => setIsScriptEditorOpen(true)}
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      Create your first script
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {recentScripts.map((script, index) => (
                      <div key={script.id} className="group relative bg-gradient-to-r from-white to-gray-50 dark:from-slate-800 dark:to-slate-700 border border-gray-200/50 dark:border-slate-600/50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-slate-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg text-white text-sm font-bold">
                                {index + 1}
                              </div>
                              <h3 className="text-xl font-bold text-slate-800 group-hover:text-slate-600 transition-colors duration-200">{script.title}</h3>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>Updated {new Date(script.updatedAt!).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                              {script.content.substring(0, 150)}...
                            </p>
                          </div>
                          <div className="flex items-center space-x-3 ml-6">
                            <Badge className={cn(
                              "px-3 py-1 text-xs font-semibold rounded-full border-0 shadow-sm",
                              getStatusColor(script.status)
                            )}>
                              {script.status}
                            </Badge>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-9 w-9 p-0 hover:bg-slate-100 hover:scale-110 transition-all duration-200"
                                onClick={() => handleEditScript(script)}
                              >
                                <Edit className="h-4 w-4 text-slate-600" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-9 w-9 p-0 hover:bg-red-100 dark:hover:bg-red-900/50 hover:scale-110 transition-all duration-200"
                                onClick={() => handleDeleteScript(script.id)}
                                disabled={deleteScriptMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Projects */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <Card className="bg-white/95 backdrop-blur-xl shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-b border-gray-200/20">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                  <Zap className="h-5 w-5 mr-3 text-emerald-600" />
                  Quick Actions
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Create new content quickly</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Link href="/projects">
                    <Button variant="ghost" className="w-full justify-between h-14 text-left hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 border border-emerald-200/50 rounded-xl group transition-all duration-300 hover:scale-105 hover:shadow-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg group-hover:scale-110 transition-transform duration-200">
                          <Megaphone className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Create New Project</p>
                          <p className="text-xs text-gray-500">Start a new radio project</p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-600 transition-colors duration-200" />
                    </Button>
                  </Link>
                  
                  <Link href="/episodes">
                    <Button variant="ghost" className="w-full justify-between h-14 text-left hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 border border-teal-200/50 rounded-xl group transition-all duration-300 hover:scale-105 hover:shadow-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg group-hover:scale-110 transition-transform duration-200">
                          <Podcast className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Add Episode</p>
                          <p className="text-xs text-gray-500">Record a new episode</p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-teal-600 transition-colors duration-200" />
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between h-14 text-left hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 border border-cyan-200/50 rounded-xl group transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    onClick={() => setIsScriptEditorOpen(true)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg group-hover:scale-110 transition-transform duration-200">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Write Script</p>
                        <p className="text-xs text-gray-500">Create compelling content</p>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-cyan-600 transition-colors duration-200" />
                  </Button>
                  
                  <Link href="/radio-stations">
                    <Button variant="ghost" className="w-full justify-between h-14 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border border-blue-200/50 rounded-xl group transition-all duration-300 hover:scale-105 hover:shadow-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg group-hover:scale-110 transition-transform duration-200">
                          <Radio className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Add Radio Station</p>
                          <p className="text-xs text-gray-500">Connect with stations</p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Active Projects */}
            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-2xl border-0 hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-rose-900/20 border-b border-gray-200/20">
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <FolderOpen className="h-5 w-5 mr-3 text-purple-600" />
                  Active Projects
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Current ongoing projects</p>
              </CardHeader>
              <CardContent className="p-6">
                {projects.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
                      <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600 relative z-10" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No projects created yet</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Start by creating your first project</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.slice(0, 3).map((project, index) => (
                      <div key={project.id} className="group relative bg-gradient-to-r from-white to-gray-50 dark:from-slate-800 dark:to-slate-700 border border-gray-200/50 dark:border-slate-600/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-105">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                              <h4 className="font-bold text-gray-900 dark:text-white">{project.name}</h4>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              {project.description?.substring(0, 60) || "No description"}
                              {project.description && project.description.length > 60 ? "..." : ""}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              Created {new Date(project.createdAt!).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-sm">
                            Active
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {projects.length > 3 && (
                      <div className="text-center pt-4 border-t border-gray-200/50 dark:border-slate-600/50">
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          +{projects.length - 3} more projects
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <ScriptEditor
          isOpen={isScriptEditorOpen}
          onClose={handleCloseScriptEditor}
          script={selectedScript}
        />

        {/* Goals Dialog */}
        <Dialog open={showGoals} onOpenChange={setShowGoals}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Target className="h-6 w-6 mr-3 text-blue-600" />
                Content Goals & Targets
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-300 mt-2">
                Track your progress towards monthly content creation goals
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 mt-6">
              {/* Monthly Episode Goal */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200/50 dark:border-green-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <PlayCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Monthly Episodes</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Target: {monthlyEpisodeGoal} episodes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.episodesThisMonth}/{monthlyEpisodeGoal}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">{Math.round(episodeProgress)}% complete</p>
                  </div>
                </div>
                <Progress value={episodeProgress} className="h-3" />
              </div>

              {/* Script Completion Goal */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Script Pipeline</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Pending review & completion</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.scriptsPending}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Scripts in progress</p>
                  </div>
                </div>
              </div>

              {/* Project & Station Goals */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200/50 dark:border-purple-700/50">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <FolderOpen className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Active Projects</h4>
                      <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.activeProjects}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-4 rounded-xl border border-orange-200/50 dark:border-orange-700/50">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-orange-500 rounded-lg">
                      <Radio className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Radio Stations</h4>
                      <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{stats.radioStations}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={() => setShowGoals(false)}>
                  Close
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    setShowGoals(false);
                    setIsScriptEditorOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Content
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}