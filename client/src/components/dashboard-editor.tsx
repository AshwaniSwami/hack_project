import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Star,
  BarChart3,
  Edit,
  Timer,
  Calendar,
  Target,
  Activity,
  Download,
  Radio,
  Zap,
  PieChart
} from "lucide-react";
import type { Submission, Hackathon, Team } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export function analyzerDashboard() {
  const { user } = useAuth();
  const [showStats, setShowStats] = useState(true);
  
  const { data: scripts = [] } = useQuery<Submission[]>({
    queryKey: ["/api/scripts"],
  });

  const { data: projects = [] } = useQuery<Hackathon[]>({
    queryKey: ["/api/projects"],
  });

  const { data: episodes = [] } = useQuery<Team[]>({
    queryKey: ["/api/episodes"],
  });

  const { data: downloadStats } = useQuery({
    queryKey: ["/api/analytics/downloads/overview"],
    enabled: false, // Disable for now to prevent 403 errors
  });

  // Submissions awaiting review (assigned to this analyzer or general review)
  const scriptsAwaitingReview = scripts.filter(script => 
    script.status === 'Under Review' || script.status === 'Submitted'
  );

  // Hackathons with pending items
  const projectsWithPending = projects.filter(project => {
    const projectSubmissions = scripts.filter(script => script.projectId === project.id);
    return projectSubmissions.some(script => 
      script.status === 'Draft' || script.status === 'Under Review' || script.status === 'Needs Revision'
    );
  });

  // Content workflow snapshot
  const workflowStats = {
    draft: scripts.filter(script => script.status === 'Draft').length,
    inReview: scripts.filter(script => script.status === 'Under Review').length,
    approved: scripts.filter(script => script.status === 'Approved').length,
    needsRevision: scripts.filter(script => script.status === 'Needs Revision').length
  };

  // Team activity feed
  const teamActivity = scripts
    .slice(0, 10)
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .map(script => ({
      title: script.title,
      author: script.authorId,
      status: script.status,
      time: script.createdAt,
      project: projects.find(p => p.id === script.projectId)?.title || 'Unknown Hackathon'
    }))
    .slice(0, 5);

  // Top performance content
  const topPerformance = scripts
    .filter(script => script.status === 'Approved')
    .slice(0, 2);

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

  // Weekly and monthly statistics
  const weeklyStats = {
    scriptsReviewed: scripts.filter(script => {
      if (!script.updatedAt) return false;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(script.updatedAt) >= weekAgo && script.status === 'Approved';
    }).length,
    newSubmissions: scripts.filter(script => {
      if (!script.createdAt) return false;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(script.createdAt) >= weekAgo;
    }).length,
    episodesPublished: episodes.filter(episode => {
      if (!episode.createdAt) return false;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(episode.createdAt) >= weekAgo;
    }).length,
    totalDownloads: 0 // Mock data for now
  };

  // analyzer performance metrics
  const analyzerMetrics = {
    productivity: weeklyStats.scriptsReviewed,
    efficiency: scripts.length > 0 ? Math.round((workflowStats.approved / scripts.length) * 100) : 0,
    responsiveness: scriptsAwaitingReview.length === 0 ? 100 : Math.max(0, 100 - (scriptsAwaitingReview.length * 10))
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Quick Stats */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.firstName}! Time to review and manage.</h1>
            <p className="text-white/80 text-lg">Content workflow management, review, and team oversight</p>
            <div className="flex items-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm">{weeklyStats.scriptsReviewed} scripts reviewed this week</span>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex space-x-4">
            <Button 
              size="lg"
              className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
              onClick={() => setShowStats(!showStats)}
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              {showStats ? 'Hide Stats' : 'Show Stats'}
            </Button>
            <Link href="/analytics">
              <Button 
                size="lg"
                className="bg-amber-500 text-white hover:bg-amber-600"
              >
                <Target className="h-5 w-5 mr-2" />
                Full Analytics
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* analyzer Performance Stats */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Weekly Productivity</p>
                  <p className="text-3xl font-bold text-green-900">{weeklyStats.scriptsReviewed}</p>
                  <p className="text-sm text-green-700">Submissions reviewed</p>
                </div>
                <Zap className="h-12 w-12 text-green-600" />
              </div>
              <div className="mt-4">
                <Progress value={Math.min((weeklyStats.scriptsReviewed / 10) * 100, 100)} className="h-2" />
                <p className="text-xs text-green-600 mt-1">Target: 10 per week</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Team Efficiency</p>
                  <p className="text-3xl font-bold text-blue-900">{analyzerMetrics.efficiency}%</p>
                  <p className="text-sm text-blue-700">Approval rate</p>
                </div>
                <Target className="h-12 w-12 text-blue-600" />
              </div>
              <div className="mt-4">
                <Progress value={analyzerMetrics.efficiency} className="h-2" />
                <p className="text-xs text-blue-600 mt-1">Submissions approved vs total</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Platform Impact</p>
                  <p className="text-3xl font-bold text-purple-900">{weeklyStats.totalDownloads}</p>
                  <p className="text-sm text-purple-700">Total downloads</p>
                </div>
                <Download className="h-12 w-12 text-purple-600" />
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-purple-600">
                  <span>{weeklyStats.episodesPublished} episodes published</span>
                  <span>{weeklyStats.newSubmissions} new submissions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Submissions Awaiting Review - Highly Prominent */}
      <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center text-yellow-800">
            <Clock className="h-6 w-6 mr-2" />
            Submissions Awaiting My Review
            <Badge className="ml-2 bg-yellow-200 text-yellow-800">{scriptsAwaitingReview.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scriptsAwaitingReview.length > 0 ? (
            <div className="space-y-3">
              {scriptsAwaitingReview.slice(0, 5).map((script) => (
                <div key={script.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <h4 className="font-medium text-gray-900">{script.title}</h4>
                      <p className="text-sm text-gray-500">
                        Hackathon: {projects.find(p => p.id === script.projectId)?.title || 'Unknown'}
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
                        Review
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              {scriptsAwaitingReview.length > 5 && (
                <div className="text-center pt-2">
                  <Link href="/scripts">
                    <Button variant="outline">
                      View All {scriptsAwaitingReview.length} Submissions
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">No scripts awaiting review</p>
              <p className="text-sm text-gray-500">Great job staying on top of reviews!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hackathons with Pending Items & Content Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
              Hackathons with Pending Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectsWithPending.length > 0 ? (
              <div className="space-y-3">
                {projectsWithPending.slice(0, 5).map((project) => {
                  const projectSubmissions = scripts.filter(script => script.projectId === project.id);
                  const pendingCount = projectSubmissions.filter(script => 
                    script.status === 'Draft' || script.status === 'Under Review' || script.status === 'Needs Revision'
                  ).length;
                  
                  return (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{project.title}</h4>
                        <p className="text-sm text-gray-500">{pendingCount} pending items</p>
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
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">All projects up to date</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              Overall Content Workflow Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  Draft
                </span>
                <Badge variant="outline">{workflowStats.draft}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  In Review
                </span>
                <Badge variant="outline">{workflowStats.inReview}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  Approved
                </span>
                <Badge variant="outline">{workflowStats.approved}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  Needs Revision
                </span>
                <Badge variant="outline">{workflowStats.needsRevision}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Activity & Top Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-green-500" />
              Team Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-gray-500">
                        {activity.project} • Status: {activity.status}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {new Date(activity.time || '').toLocaleDateString()}
                  </Badge>
                </div>
              ))}
              {teamActivity.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No recent team activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2 text-amber-500" />
              Top Performance Overview (analyzer's Pick)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformance.map((script) => (
                <div key={script.id} className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-amber-900">{script.title}</h4>
                      <p className="text-sm text-amber-700">
                        Hackathon: {projects.find(p => p.id === script.projectId)?.title || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-amber-600 mr-1" />
                      <span className="text-sm font-medium text-amber-800">High Impact</span>
                    </div>
                  </div>
                  <Link href={`/scripts`}>
                    <Button variant="outline" size="sm" className="mt-2 border-amber-300">
                      View Submission
                    </Button>
                  </Link>
                </div>
              ))}
              {topPerformance.length === 0 && (
                <div className="text-center py-6">
                  <Star className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No approved content yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}