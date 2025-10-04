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
import type { Submission, Hackathon, Team, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export function AdminDashboard() {
  const { user } = useAuth();
  const { data: projects = [] } = useQuery<Hackathon[]>({
    queryKey: ["/api/projects"],
  });

  const { data: episodes = [] } = useQuery<Team[]>({
    queryKey: ["/api/episodes"],
  });

  const { data: scripts = [] } = useQuery<Submission[]>({
    queryKey: ["/api/scripts"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Calculate simple metrics
  const stats = {
    totalHackathons: projects.length,
    totalTeams: episodes.length,
    totalSubmissions: scripts.length,
    totalUsers: users.length,
    activeUsers: users.filter(user => user.isActive).length
  };

  // Optimized participant role distribution - prevents separate blocks
  const roleCount = users.reduce((acc, user) => {
    const role = user.role || 'participant';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const participantRoleData = [
    { name: 'Organizer', value: roleCount.organizer || 0, color: '#ef4444' },
    { name: 'Analyzer', value: roleCount.analyzer || 0, color: '#3b82f6' },
    { name: 'Participant', value: roleCount.participant || 0, color: '#10b981' },
  ].filter(item => item.value > 0); // Only show roles that exist

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
                <span className="text-xs font-medium uppercase tracking-wider text-blue-200">Organizer Dashboard</span>
              </div>
              <h1 className="mb-3 text-3xl font-bold leading-tight">
                Welcome back, 
                <span className="bg-gradient-to-r from-cyan-200 to-white bg-clip-text text-transparent">
                  {user?.firstName || user?.email?.split('@')[0] || 'Organizer'}
                </span>
              </h1>
              <p className="text-lg text-blue-100/90 font-medium">
                Transform communities through powerful hackathon innovation
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
                <Clock className="h-4 w-4 text-cyan-300" />
                <span className="text-sm">Last Login: Today</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
                <Users className="h-4 w-4 text-green-300" />
                <span className="text-sm">{stats.totalUsers} Team participants</span>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Hackathons</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalHackathons}</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Teams</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTeams}</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Submissions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSubmissions}</p>
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
                      <span className="font-medium text-gray-700 dark:text-gray-300 block">Hackathons</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Content containers</span>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalHackathons}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200/50 dark:border-emerald-700/50">
                  <div className="flex items-center space-x-3">
                    <Radio className="h-6 w-6 text-emerald-600" />
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300 block">Teams</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Audio content</span>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.totalTeams}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200/50 dark:border-purple-700/50">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-6 w-6 text-purple-600" />
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300 block">Submissions</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Written content</span>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalSubmissions}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Team Roles</h3>
              </div>
              
              {/* Optimized Role Distribution Chart */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Role Distribution</h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>{stats.totalUsers} Total</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center space-x-8">
                  {/* Enhanced Pie Chart */}
                  <div className="flex-shrink-0">
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie
                          data={participantRoleData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {participantRoleData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none', 
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                            fontSize: '14px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Enhanced Legend */}
                  <div className="flex flex-col space-y-4">
                    {participantRoleData.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full shadow-sm" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {item.value} participant{item.value !== 1 ? 's' : ''} ({Math.round((item.value / stats.totalUsers) * 100)}%)
                          </span>
                        </div>
                      </div>
                    ))}
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