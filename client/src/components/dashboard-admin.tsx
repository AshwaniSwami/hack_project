import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  FileText, 
  Radio, 
  Download, 
  TrendingUp, 
  Activity, 
  AlertCircle, 
  CheckCircle,
  BarChart3,
  Calendar,
  Database,
  HardDrive,
  Clock
} from "lucide-react";
import type { Script, Project, Episode, User } from "@shared/schema";

export function AdminDashboard() {
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: episodes = [] } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
  });

  const { data: scripts = [] } = useQuery<Script[]>({
    queryKey: ["/api/scripts"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: downloadStats } = useQuery({
    queryKey: ["/api/analytics/downloads/overview"],
  });

  // Calculate platform health KPIs
  const kpis = {
    totalProjects: projects.length,
    totalEpisodes: episodes.length,
    totalScripts: scripts.length,
    totalUsers: users.length,
    totalDownloads: downloadStats?.totalDownloads || 0,
    activeUsers: users.filter(user => user.status === 'verified').length,
    pendingReviews: scripts.filter(script => script.status === 'Under Review').length,
    overdueItems: scripts.filter(script => script.status === 'Needs Revision').length
  };

  // User role breakdown
  const roleBreakdown = {
    admin: users.filter(user => user.role === 'admin').length,
    editor: users.filter(user => user.role === 'editor').length,
    member: users.filter(user => user.role === 'member').length,
    pending: users.filter(user => user.status === 'pending').length
  };

  // Recent activity feed
  const recentActivity = [
    ...scripts.slice(0, 3).map(script => ({
      type: 'script',
      title: script.title,
      action: `Script created by ${script.authorId}`,
      time: script.createdAt,
      status: script.status
    })),
    ...episodes.slice(0, 2).map(episode => ({
      type: 'episode',
      title: episode.title,
      action: 'Episode published',
      time: episode.createdAt,
      status: episode.status
    }))
  ].sort((a, b) => new Date(b.time || '').getTime() - new Date(a.time || '').getTime()).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome, Admin! Global overview.</h1>
        <p className="text-white/80">Comprehensive system oversight and platform management</p>
      </div>

      {/* Platform Health & KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Projects</p>
                <p className="text-3xl font-bold text-blue-900">{kpis.totalProjects}</p>
                <div className="flex items-center mt-2 text-sm text-blue-700">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>Active</span>
                </div>
              </div>
              <FileText className="h-12 w-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Episodes</p>
                <p className="text-3xl font-bold text-green-900">{kpis.totalEpisodes}</p>
                <div className="flex items-center mt-2 text-sm text-green-700">
                  <Radio className="h-4 w-4 mr-1" />
                  <span>Published</span>
                </div>
              </div>
              <Radio className="h-12 w-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Scripts</p>
                <p className="text-3xl font-bold text-purple-900">{kpis.totalScripts}</p>
                <div className="flex items-center mt-2 text-sm text-purple-700">
                  <FileText className="h-4 w-4 mr-1" />
                  <span>Created</span>
                </div>
              </div>
              <FileText className="h-12 w-12 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Total Users</p>
                <p className="text-3xl font-bold text-amber-900">{kpis.totalUsers}</p>
                <div className="flex items-center mt-2 text-sm text-amber-700">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{kpis.activeUsers} active</span>
                </div>
              </div>
              <Users className="h-12 w-12 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System-Wide Urgent Items & User Roles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
              System-Wide Urgent Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {kpis.pendingReviews > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium">Scripts Awaiting Review</span>
                </div>
                <Badge variant="secondary">{kpis.pendingReviews}</Badge>
              </div>
            )}
            {kpis.overdueItems > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-sm font-medium">Items Needing Revision</span>
                </div>
                <Badge variant="destructive">{kpis.overdueItems}</Badge>
              </div>
            )}
            {roleBreakdown.pending > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium">Users Pending Approval</span>
                </div>
                <Badge variant="outline">{roleBreakdown.pending}</Badge>
              </div>
            )}
            {kpis.pendingReviews === 0 && kpis.overdueItems === 0 && roleBreakdown.pending === 0 && (
              <div className="flex items-center p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">All systems running smoothly</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              User Roles Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Administrators</span>
                <div className="flex items-center space-x-2">
                  <Progress value={(roleBreakdown.admin / kpis.totalUsers) * 100} className="w-20 h-2" />
                  <span className="text-sm font-bold">{roleBreakdown.admin}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Editors</span>
                <div className="flex items-center space-x-2">
                  <Progress value={(roleBreakdown.editor / kpis.totalUsers) * 100} className="w-20 h-2" />
                  <span className="text-sm font-bold">{roleBreakdown.editor}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Members</span>
                <div className="flex items-center space-x-2">
                  <Progress value={(roleBreakdown.member / kpis.totalUsers) * 100} className="w-20 h-2" />
                  <span className="text-sm font-bold">{roleBreakdown.member}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Global Activity & Platform Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-green-500" />
              Recent Global Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {activity.type === 'script' ? (
                      <FileText className="h-4 w-4 text-purple-500 mr-3" />
                    ) : (
                      <Radio className="h-4 w-4 text-green-500 mr-3" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.action}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.status}
                  </Badge>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                Platform Health Indicators
              </div>
              <Link href="/analytics">
                <Button variant="outline" size="sm">
                  Go to Analytics Dashboard
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <Database className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm font-medium">Database Connection</span>
              </div>
              <Badge className="bg-green-100 text-green-800">OK</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <HardDrive className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium">Storage Status</span>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center">
                <Download className="h-4 w-4 text-purple-600 mr-2" />
                <span className="text-sm font-medium">Total Downloads</span>
              </div>
              <Badge className="bg-purple-100 text-purple-800">{kpis.totalDownloads}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}