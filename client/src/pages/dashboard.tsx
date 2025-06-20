import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCards } from "@/components/stats-cards";
import { ScriptEditor } from "@/components/script-editor";
import { 
  Plus, 
  FolderPlus, 
  Mic, 
  FileText, 
  Radio,
  Edit,
  Trash2,
  FolderOpen
} from "lucide-react";
import type { Script, Project, Episode, RadioStation } from "@shared/schema";

export default function Dashboard() {
  const [isScriptEditorOpen, setIsScriptEditorOpen] = useState(false);
  const [selectedScript, setSelectedScript] = useState<Script | undefined>(undefined);
  
  const { data: scripts = [], isLoading: scriptsLoading } = useQuery<Script[]>({
    queryKey: ["/api/scripts"],
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

  // Calculate stats
  const stats = {
    activeProjects: projects.length,
    episodesThisMonth: episodes.filter(episode => {
      const episodeDate = new Date(episode.createdAt!);
      const now = new Date();
      return episodeDate.getMonth() === now.getMonth() && 
             episodeDate.getFullYear() === now.getFullYear();
    }).length,
    scriptsPending: scripts.filter(script => 
      script.status === "Under Review" || script.status === "Submitted"
    ).length,
    radioStations: radioStations.length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Under Review":
        return "bg-yellow-100 text-yellow-800";
      case "Draft":
        return "bg-blue-100 text-blue-800";
      case "Needs Revision":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  const recentScripts = scripts.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
              <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your radio content.</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>
          <StatsCards stats={stats} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Scripts */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl text-gray-800">Recent Scripts</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Your latest script submissions and drafts</p>
                  </div>
                  <Button 
                    onClick={() => setIsScriptEditorOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Script
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {scriptsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : recentScripts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium text-gray-700 mb-2">No scripts created yet</p>
                    <p className="text-sm text-gray-500 mb-4">Get started by creating your first script</p>
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
                      onClick={() => setIsScriptEditorOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create your first script
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentScripts.map((script) => (
                      <div key={script.id} className="border-b border-gray-200 pb-4 last:border-b-0 hover:bg-gray-50 p-3 rounded-lg transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{script.title}</h3>
                            <p className="text-sm text-gray-500 mb-2">
                              Updated {new Date(script.updatedAt!).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400 line-clamp-2">
                              {script.content.substring(0, 100)}...
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Badge className={getStatusColor(script.status)}>
                              {script.status}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="hover:bg-blue-100"
                              onClick={() => handleEditScript(script)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="hover:bg-red-100">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Upcoming */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
                <CardTitle className="text-xl text-gray-800">Quick Actions</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Create new content quickly</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Link href="/projects">
                    <Button variant="outline" className="w-full justify-start hover:bg-blue-50 border-blue-200">
                      <FolderPlus className="h-4 w-4 mr-3 text-blue-600" />
                      Create New Project
                    </Button>
                  </Link>
                  <Link href="/episodes">
                    <Button variant="outline" className="w-full justify-start hover:bg-green-50 border-green-200">
                      <Mic className="h-4 w-4 mr-3 text-green-600" />
                      Add Episode
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start hover:bg-orange-50 border-orange-200"
                    onClick={() => setIsScriptEditorOpen(true)}
                  >
                    <FileText className="h-4 w-4 mr-3 text-orange-600" />
                    Write Script
                  </Button>
                  <Link href="/radio-stations">
                    <Button variant="outline" className="w-full justify-start hover:bg-purple-50 border-purple-200">
                      <Radio className="h-4 w-4 mr-3 text-purple-600" />
                      Add Radio Station
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Project Summary */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="text-xl text-gray-800">Active Projects</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Current ongoing projects</p>
              </CardHeader>
              <CardContent className="p-6">
                {projects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium text-gray-700 mb-2">No projects created yet</p>
                    <p className="text-sm text-gray-500">Start by creating your first project</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.slice(0, 3).map((project) => (
                      <div key={project.id} className="border-l-4 border-blue-500 pl-4 hover:bg-gray-50 p-3 rounded-r-lg transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{project.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {project.description?.substring(0, 60) || "No description"}
                              {project.description && project.description.length > 60 ? "..." : ""}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              Created {new Date(project.createdAt!).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-800 ml-2">Active</Badge>
                        </div>
                      </div>
                    ))}
                    {projects.length > 3 && (
                      <div className="text-center pt-4 border-t">
                        <p className="text-sm text-gray-500">
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
      </div>
    </div>
  );
}
