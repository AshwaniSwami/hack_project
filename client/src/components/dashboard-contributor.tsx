import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Edit, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Briefcase,
  Star,
  Radio,
  Calendar
} from "lucide-react";
import type { Script, Project, Episode } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export function ContributorDashboard() {
  const { user } = useAuth();
  
  const { data: scripts = [] } = useQuery<Script[]>({
    queryKey: ["/api/scripts"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: episodes = [] } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
  });

  // Filter user's content
  const myScripts = scripts.filter(script => script.authorId === user?.id);
  
  // My active scripts & drafts
  const myActiveScripts = myScripts.filter(script => 
    script.status === 'Draft' || script.status === 'In Progress'
  );

  // Scripts awaiting my revision
  const scriptsAwaitingRevision = myScripts.filter(script => 
    script.status === 'Needs Revision'
  );

  // My submitted scripts status
  const mySubmittedScripts = myScripts.filter(script => 
    script.status === 'Submitted' || script.status === 'Under Review' || script.status === 'Approved'
  );

  // My projects overview
  const myProjects = projects.filter(project => {
    // Check if user has contributed scripts to this project
    return myScripts.some(script => script.projectId === project.id);
  });

  // Recent platform highlights
  const recentHighlights = [
    ...episodes.slice(0, 3).map(episode => ({
      type: 'episode',
      title: episode.title,
      action: 'Episode Published',
      time: episode.createdAt,
      project: projects.find(p => p.id === episode.projectId)?.title || 'Unknown Project'
    })),
    ...scripts.filter(script => script.status === 'Approved').slice(0, 2).map(script => ({
      type: 'script',
      title: script.title,
      action: 'Script Approved',
      time: script.updatedAt || script.createdAt,
      project: projects.find(p => p.id === script.projectId)?.title || 'Unknown Project'
    }))
  ].sort((a, b) => new Date(b.time || '').getTime() - new Date(a.time || '').getTime()).slice(0, 5);

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
      case "Submitted":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Contributor productivity metrics
  const contributorStats = {
    weeklyOutput: myScripts.filter(script => {
      if (!script.createdAt) return false;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(script.createdAt) >= weekAgo;
    }).length,
    approvalRate: myScripts.length > 0 ? Math.round((myScripts.filter(s => s.status === 'Approved').length / myScripts.length) * 100) : 0,
    totalWordCount: myScripts.reduce((total, script) => total + (script.content?.length || 0), 0),
    avgWordsPerScript: myScripts.length > 0 ? Math.round(myScripts.reduce((total, script) => total + (script.content?.length || 0), 0) / myScripts.length) : 0
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Personal Stats */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.firstName}! Let's create something great.</h1>
            <p className="text-white/80 text-lg mb-4">Personal content creation workflow and monitoring your submitted work</p>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">{myScripts.length} total scripts</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">{contributorStats.approvalRate}% approval rate</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4" />
                <span className="text-sm">{contributorStats.weeklyOutput} scripts this week</span>
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-white/80">Writing Progress</p>
              <p className="text-2xl font-bold">{contributorStats.totalWordCount.toLocaleString()}</p>
              <p className="text-xs text-white/70">words written</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contributor Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Active Drafts</p>
                <p className="text-3xl font-bold text-blue-900">{myActiveScripts.length}</p>
              </div>
              <Edit className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-orange-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Need Revision</p>
                <p className="text-3xl font-bold text-orange-900">{scriptsAwaitingRevision.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Approved</p>
                <p className="text-3xl font-bold text-green-900">{myScripts.filter(s => s.status === 'Approved').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Projects</p>
                <p className="text-3xl font-bold text-purple-900">{myProjects.length}</p>
              </div>
              <Briefcase className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Active Scripts & Drafts - Priority Widget */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <Edit className="h-6 w-6 mr-2" />
            My Active Scripts & Drafts
            <Badge className="ml-2 bg-blue-200 text-blue-800">{myActiveScripts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myActiveScripts.length > 0 ? (
            <div className="space-y-3">
              {myActiveScripts.slice(0, 5).map((script) => (
                <div key={script.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <h4 className="font-medium text-gray-900">{script.title}</h4>
                      <p className="text-sm text-gray-500">
                        Project: {projects.find(p => p.id === script.projectId)?.title || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(script.status || '')}>
                      {script.status}
                    </Badge>
                    <Link href={`/scripts`}>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No active scripts or drafts</p>
              <Link href="/scripts">
                <Button className="mt-3 bg-blue-600 hover:bg-blue-700">
                  <FileText className="h-4 w-4 mr-2" />
                  Create New Script
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scripts Awaiting Revision & Submitted Scripts Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
              Scripts Awaiting My Revision
              {scriptsAwaitingRevision.length > 0 && (
                <Badge className="ml-2 bg-red-200 text-red-800">{scriptsAwaitingRevision.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scriptsAwaitingRevision.length > 0 ? (
              <div className="space-y-3">
                {scriptsAwaitingRevision.map((script) => (
                  <div key={script.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-red-600 mr-3" />
                      <div>
                        <h4 className="font-medium text-gray-900">{script.title}</h4>
                        <p className="text-sm text-gray-500">Needs your attention</p>
                      </div>
                    </div>
                    <Link href={`/scripts`}>
                      <Button variant="outline" size="sm" className="border-red-300">
                        Revise
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No scripts need revision</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              My Submitted Scripts Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mySubmittedScripts.length > 0 ? (
              <div className="space-y-3">
                {mySubmittedScripts.slice(0, 5).map((script) => (
                  <div key={script.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-600 mr-3" />
                      <div>
                        <h4 className="font-medium text-gray-900">{script.title}</h4>
                        <p className="text-sm text-gray-500">
                          {projects.find(p => p.id === script.projectId)?.title || 'Unknown Project'}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(script.status || '')}>
                      {script.status}
                    </Badge>
                  </div>
                ))}
                {mySubmittedScripts.length > 5 && (
                  <div className="text-center pt-2">
                    <Link href="/scripts">
                      <Button variant="outline" size="sm">
                        View All Submitted Scripts
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No submitted scripts yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Projects Overview & Recent Platform Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-purple-500" />
              My Projects Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myProjects.length > 0 ? (
              <div className="space-y-3">
                {myProjects.map((project) => {
                  const projectScripts = myScripts.filter(script => script.projectId === project.id);
                  const approvedCount = projectScripts.filter(script => script.status === 'Approved').length;
                  
                  return (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{project.title}</h4>
                        <p className="text-sm text-gray-500">
                          {projectScripts.length} scripts • {approvedCount} approved
                        </p>
                      </div>
                      <Link href={`/projects`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <Briefcase className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No project contributions yet</p>
                <p className="text-xs text-gray-500">Start by creating scripts for existing projects</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2 text-amber-500" />
              Recent Platform Highlights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentHighlights.map((highlight, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center">
                    {highlight.type === 'episode' ? (
                      <Radio className="h-4 w-4 text-green-600 mr-3" />
                    ) : (
                      <FileText className="h-4 w-4 text-blue-600 mr-3" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{highlight.title}</p>
                      <p className="text-xs text-gray-500">{highlight.action} • {highlight.project}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {new Date(highlight.time || '').toLocaleDateString()}
                  </Badge>
                </div>
              ))}
              {recentHighlights.length === 0 && (
                <div className="text-center py-6">
                  <Star className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No recent highlights</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}