import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  FileText, 
  Radio, 
  TrendingUp, 
  Activity,
  BarChart3,
  Calendar,
  Plus,
  Sparkles,
  Globe,
  Heart,
  ArrowRight
} from "lucide-react";
import type { Script, Project, Episode, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export function AdminDashboard() {
  const { user } = useAuth();
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

  // Calculate simple metrics
  const stats = {
    totalProjects: projects.length,
    totalEpisodes: episodes.length,
    totalScripts: scripts.length,
    totalUsers: users.length,
    activeUsers: users.filter(user => user.status === 'verified').length
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Welcome Card - Compact Design */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-xl">
        {/* Background decorative elements */}
        <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-white/10 backdrop-blur-3xl"></div>
        <div className="absolute -bottom-8 -left-8 h-20 w-20 rounded-full bg-white/5 backdrop-blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <div className="mb-2 flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium uppercase tracking-wider text-blue-200">Admin Dashboard</span>
              </div>
              <h1 className="mb-2 text-2xl font-bold leading-tight">
                Welcome back, {user?.firstName || user?.email?.split('@')[0] || 'Admin'}
              </h1>
              <p className="text-lg text-blue-100 opacity-90">
                Manage your radio content hub efficiently
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Link href="/analytics">
                <Button 
                  size="default"
                  className="group bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-all duration-300 border border-white/20"
                >
                  <BarChart3 className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                  Analytics
                  <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <div className="flex items-center space-x-2 rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
                <Globe className="h-4 w-4 text-cyan-300" />
                <span className="text-sm font-medium">Global Reach</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow dark:bg-gray-800/80">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-xl bg-blue-100 p-2 dark:bg-blue-900/30">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Projects</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow dark:bg-gray-800/80">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-xl bg-emerald-100 p-2 dark:bg-emerald-900/30">
                <Radio className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Episodes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalEpisodes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow dark:bg-gray-800/80">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-xl bg-purple-100 p-2 dark:bg-purple-900/30">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Scripts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalScripts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow dark:bg-gray-800/80">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-xl bg-orange-100 p-2 dark:bg-orange-900/30">
                <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-md dark:bg-gray-800/80">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-gray-900 dark:text-white text-lg">
            <Plus className="h-5 w-5 mr-2 text-blue-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link href="/projects">
              <Button 
                variant="outline" 
                className="w-full h-16 flex-col space-y-1 border-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-900/20"
              >
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-sm">Manage Projects</span>
              </Button>
            </Link>
            
            <Link href="/users">
              <Button 
                variant="outline" 
                className="w-full h-16 flex-col space-y-1 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-700 dark:hover:bg-emerald-900/20"
              >
                <Users className="h-5 w-5 text-emerald-600" />
                <span className="text-sm">User Management</span>
              </Button>
            </Link>
            
            <Link href="/analytics">
              <Button 
                variant="outline" 
                className="w-full h-16 flex-col space-y-1 border-purple-200 hover:border-purple-400 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-900/20"
              >
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <span className="text-sm">View Analytics</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Platform Overview */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-md dark:bg-gray-800/80">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-gray-900 dark:text-white text-lg">
            <Activity className="h-5 w-5 mr-2 text-green-600" />
            Platform Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Content Distribution</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Projects</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.totalProjects}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Episodes</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.totalEpisodes}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Scripts</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.totalScripts}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">User Engagement</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Users</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.totalUsers}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Users</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.activeUsers}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Engagement Rate</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}