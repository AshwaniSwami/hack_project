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
      {/* Enhanced Welcome Card with Fresh Modern Design */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white shadow-2xl">
        {/* Background decorative elements */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-white/10 backdrop-blur-3xl"></div>
        <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-white/5 backdrop-blur-3xl"></div>
        <div className="absolute top-8 right-8 h-16 w-16 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 opacity-20"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="mb-3 flex items-center space-x-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium uppercase tracking-wider text-blue-200">Admin Dashboard</span>
              </div>
              <h1 className="mb-3 text-4xl font-bold leading-tight">
                Welcome back to 
                <span className="block bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent">
                  SMART Radio Hub
                </span>
              </h1>
              <p className="text-xl text-blue-100 opacity-90">
                Empowering communities through innovative radio content management
              </p>
            </div>
            
            <div className="flex flex-col space-y-4 lg:flex-row lg:space-x-4 lg:space-y-0">
              <Link href="/analytics">
                <Button 
                  size="lg"
                  className="group bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20"
                >
                  <BarChart3 className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                  View Analytics
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <div className="flex items-center space-x-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm">
                <Heart className="h-4 w-4 text-pink-300" />
                <span className="text-sm font-medium">Making Impact</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Stats Cards without hover effects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg dark:bg-gray-800/70">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Projects</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalProjects}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active content</p>
              </div>
              <div className="rounded-2xl bg-blue-100 p-3 dark:bg-blue-900/30">
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg dark:bg-gray-800/70">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Episodes</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalEpisodes}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Published</p>
              </div>
              <div className="rounded-2xl bg-emerald-100 p-3 dark:bg-emerald-900/30">
                <Radio className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg dark:bg-gray-800/70">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Scripts</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalScripts}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Created</p>
              </div>
              <div className="rounded-2xl bg-purple-100 p-3 dark:bg-purple-900/30">
                <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg dark:bg-gray-800/70">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Users</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{stats.activeUsers} verified</p>
              </div>
              <div className="rounded-2xl bg-orange-100 p-3 dark:bg-orange-900/30">
                <Users className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg dark:bg-gray-800/70">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <Plus className="h-5 w-5 mr-2 text-blue-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/projects">
              <Button 
                variant="outline" 
                className="w-full h-20 flex-col space-y-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-900/20"
              >
                <FileText className="h-6 w-6 text-blue-600" />
                <span>Manage Projects</span>
              </Button>
            </Link>
            
            <Link href="/users">
              <Button 
                variant="outline" 
                className="w-full h-20 flex-col space-y-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-700 dark:hover:bg-emerald-900/20"
              >
                <Users className="h-6 w-6 text-emerald-600" />
                <span>User Management</span>
              </Button>
            </Link>
            
            <Link href="/analytics">
              <Button 
                variant="outline" 
                className="w-full h-20 flex-col space-y-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-900/20"
              >
                <BarChart3 className="h-6 w-6 text-purple-600" />
                <span>View Analytics</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg dark:bg-gray-800/70">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <Activity className="h-5 w-5 mr-2 text-green-600" />
            Platform Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Content Distribution</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Projects</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.totalProjects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Episodes</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.totalEpisodes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Scripts</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.totalScripts}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">User Engagement</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Users</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.totalUsers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Users</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.activeUsers}</span>
                </div>
                <div className="flex items-center justify-between">
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