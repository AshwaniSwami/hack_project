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
  ArrowRight,
  Clock,
  Shield,
  Database,
  Server
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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

  // Member status data - only real user data
  const memberStatusData = [
    { name: 'Active Members', value: stats.activeUsers, color: '#10b981' },
    { name: 'Pending Members', value: stats.totalUsers - stats.activeUsers, color: '#f59e0b' },
  ];

  // Member distribution by role
  const memberRoleData = users.reduce((acc, user) => {
    const role = user.role || 'member';
    const existing = acc.find(item => item.name === role);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ 
        name: role.charAt(0).toUpperCase() + role.slice(1), 
        value: 1, 
        color: role === 'admin' ? '#ef4444' : role === 'editor' ? '#3b82f6' : '#10b981' 
      });
    }
    return acc;
  }, [] as Array<{name: string; value: number; color: string}>);

  return (
    <div className="space-y-6">
      {/* Enhanced Welcome Card - Premium Design */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-700 to-purple-800 p-8 text-white shadow-2xl">
        {/* Enhanced Background decorative elements */}
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-r from-cyan-400/20 to-purple-400/20 backdrop-blur-3xl"></div>
        <div className="absolute -bottom-12 -left-12 h-24 w-24 rounded-full bg-gradient-to-r from-blue-400/10 to-indigo-400/10 backdrop-blur-3xl"></div>
        <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-gradient-to-r from-yellow-400/30 to-orange-400/30"></div>
        <div className="absolute bottom-4 left-4 h-6 w-6 rounded-full bg-gradient-to-r from-pink-400/30 to-rose-400/30"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <div className="mb-2 flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium uppercase tracking-wider text-blue-200">Admin Dashboard</span>
              </div>
              <h1 className="mb-3 text-3xl font-bold leading-tight">
                Welcome back, 
                <span className="bg-gradient-to-r from-cyan-200 to-white bg-clip-text text-transparent">
                  {user?.firstName || user?.email?.split('@')[0] || 'Admin'}
                </span>
              </h1>
              <p className="text-lg text-blue-100/90 font-medium">
                Transform communities through powerful radio content
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
                <Clock className="h-4 w-4 text-cyan-300" />
                <span className="text-sm">Last Login: Today</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
                <Users className="h-4 w-4 text-green-300" />
                <span className="text-sm">{stats.totalUsers} Team Members</span>
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

      {/* Optimized Platform Overview - Full Width */}
      <Card className="border-0 bg-gradient-to-br from-white/90 to-blue-50/50 backdrop-blur-sm shadow-lg dark:from-gray-800/90 dark:to-gray-700/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-gray-900 dark:text-white text-xl">
            <Activity className="h-6 w-6 mr-3 text-green-600" />
            Platform Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Content Library</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200/50 dark:border-blue-700/50">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-6 w-6 text-blue-600" />
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300 block">Projects</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Content containers</span>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalProjects}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200/50 dark:border-emerald-700/50">
                  <div className="flex items-center space-x-3">
                    <Radio className="h-6 w-6 text-emerald-600" />
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300 block">Episodes</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Audio content</span>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.totalEpisodes}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200/50 dark:border-purple-700/50">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-6 w-6 text-purple-600" />
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300 block">Scripts</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Written content</span>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalScripts}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Member Analytics</h3>
              </div>
              
              {/* Member Status Distribution */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200/50 dark:border-emerald-700/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Member Status</h4>
                  <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height={100}>
                      <PieChart>
                        <Pie
                          data={memberStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={45}
                          dataKey="value"
                        >
                          {memberStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {memberStatusData.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Member Roles Distribution */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Role Distribution</h4>
                  <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height={100}>
                      <PieChart>
                        <Pie
                          data={memberRoleData}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={45}
                          dataKey="value"
                        >
                          {memberRoleData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {memberRoleData.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Member Summary Stats */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-700/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Quick Stats</h4>
                  <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{stats.totalUsers}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.activeUsers}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Active Members</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}