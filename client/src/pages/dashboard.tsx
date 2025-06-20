import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
  Trash2
} from "lucide-react";
import type { Script, Project, Episode, RadioStation } from "@shared/schema";

export default function Dashboard() {
  const [isScriptEditorOpen, setIsScriptEditorOpen] = useState(false);
  
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

  const recentScripts = scripts.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard Overview</h2>
        <StatsCards stats={stats} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Scripts */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Scripts</CardTitle>
                <Button onClick={() => setIsScriptEditorOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Script
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
                  <p>No scripts created yet</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsScriptEditorOpen(true)}
                  >
                    Create your first script
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentScripts.map((script) => (
                    <div key={script.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{script.title}</h3>
                          <p className="text-sm text-gray-500">
                            Updated {new Date(script.updatedAt!).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(script.status)}>
                            {script.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
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
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FolderPlus className="h-4 w-4 mr-3 text-blue-600" />
                  Create New Project
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mic className="h-4 w-4 mr-3 text-green-600" />
                  Add Episode
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setIsScriptEditorOpen(true)}
                >
                  <FileText className="h-4 w-4 mr-3 text-orange-600" />
                  Write Script
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Radio className="h-4 w-4 mr-3 text-purple-600" />
                  Add Radio Station
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Project Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p>No projects created yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.slice(0, 3).map((project) => (
                    <div key={project.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{project.name}</p>
                          <p className="text-xs text-gray-500">
                            {project.description?.substring(0, 50)}...
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ScriptEditor
        isOpen={isScriptEditorOpen}
        onClose={() => setIsScriptEditorOpen(false)}
      />
    </div>
  );
}
