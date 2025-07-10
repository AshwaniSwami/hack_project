import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Download, Users, FileText, TrendingUp, Eye, Calendar, Clock, Database, FolderOpen, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart } from "recharts";

interface DownloadOverview {
  timeframe: string;
  totalDownloads: number;
  uniqueDownloaders: number;
  totalDataDownloaded: number;
  popularFiles: Array<{
    fileId: string;
    filename: string;
    originalName: string;
    entityType: string;
    downloadCount: number;
    totalSize: number;
  }>;
  downloadsByDay: Array<{
    date: string;
    count: number;
    uniqueUsers: number;
    totalSize: number;
  }>;
  downloadsByType: Array<{
    entityType: string;
    count: number;
    totalSize: number;
  }>;
  downloadsByHour: Array<{
    hour: number;
    count: number;
  }>;
}

interface UserDownload {
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  downloadCount: number;
  totalSize: number;
  lastDownload: string;
}

interface DownloadLog {
  id: string;
  fileId: string;
  filename: string;
  originalName: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  ipAddress: string;
  downloadSize: number;
  downloadDuration: number;
  downloadStatus: string;
  entityType: string;
  refererPage: string;
  downloadedAt: string;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDuration(ms: number): string {
  if (!ms) return "0ms";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState("7d");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [logFilters, setLogFilters] = useState({
    entityType: "all",
    status: "all",
    page: 1
  });

  // Download Overview Query
  const { data: overview, isLoading: overviewLoading } = useQuery<DownloadOverview>({
    queryKey: ["/api/analytics/downloads/overview", timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/downloads/overview?timeframe=${timeframe}`);
      if (!response.ok) throw new Error("Failed to fetch download overview");
      return response.json();
    },
  });

  // User Downloads Query
  const { data: userDownloads, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/analytics/downloads/users", timeframe, userSearchTerm],
    queryFn: async () => {
      const response = await fetch(
        `/api/analytics/downloads/users?timeframe=${timeframe}&search=${encodeURIComponent(userSearchTerm)}&limit=50`
      );
      if (!response.ok) throw new Error("Failed to fetch user downloads");
      return response.json();
    },
  });

  // Download Logs Query
  const { data: downloadLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/analytics/downloads/logs", timeframe, logFilters],
    queryFn: async () => {
      const params = new URLSearchParams({
        timeframe,
        entityType: logFilters.entityType,
        status: logFilters.status,
        page: logFilters.page.toString(),
        limit: "50"
      });
      
      const response = await fetch(`/api/analytics/downloads/logs?${params}`);
      if (!response.ok) throw new Error("Failed to fetch download logs");
      return response.json();
    },
  });

  // File Statistics Query
  const { data: fileStats, isLoading: filesLoading } = useQuery({
    queryKey: ["/api/analytics/downloads/files"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/downloads/files?limit=20");
      if (!response.ok) throw new Error("Failed to fetch file statistics");
      return response.json();
    },
  });

  // Project Analytics Query
  const { data: projectStats, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/analytics/projects", timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/projects?timeframe=${timeframe}`);
      if (!response.ok) throw new Error("Failed to fetch project analytics");
      return response.json();
    },
  });

  // Script Analytics Query
  const { data: scriptStats, isLoading: scriptsLoading } = useQuery({
    queryKey: ["/api/analytics/scripts", timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/scripts?timeframe=${timeframe}`);
      if (!response.ok) throw new Error("Failed to fetch script analytics");
      return response.json();
    },
  });

  // Episode Analytics Query
  const { data: episodeStats, isLoading: episodesLoading } = useQuery({
    queryKey: ["/api/analytics/episodes", timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/episodes?timeframe=${timeframe}`);
      if (!response.ok) throw new Error("Failed to fetch episode analytics");
      return response.json();
    },
  });

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Download Analytics
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Track and analyze file download patterns, user activity, and system usage
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6">
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="episodes">Episodes</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Total Downloads
                </CardTitle>
                <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {overviewLoading ? "..." : (overview?.totalDownloads || 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 border-emerald-200 dark:border-emerald-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Unique Users
                </CardTitle>
                <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {overviewLoading ? "..." : (overview?.uniqueDownloaders || 0)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Data Downloaded
                </CardTitle>
                <Database className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {overviewLoading ? "..." : formatBytes(overview?.totalDataDownloaded || 0)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/30 dark:to-pink-900/30 border-pink-200 dark:border-pink-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-pink-700 dark:text-pink-300">
                  Popular Files
                </CardTitle>
                <FileText className="h-4 w-4 text-pink-600 dark:text-pink-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-pink-900 dark:text-pink-100">
                  {overviewLoading ? "..." : (overview?.popularFiles?.length || 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Popular Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Most Downloaded Files
              </CardTitle>
              <CardDescription>
                Top performing files in the selected timeframe
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : overview?.popularFiles?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No downloads in this timeframe</div>
              ) : (
                <div className="space-y-3">
                  {overview?.popularFiles?.map((file, index) => (
                    <div
                      key={file.fileId}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{file.originalName}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="capitalize">{file.entityType}</span>
                            {file.entityId && (
                              <>
                                <span>•</span>
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                  {file.entityType}: {file.entityId.slice(-8)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{file.downloadCount} downloads</p>
                        <p className="text-sm text-gray-500">{formatBytes(file.totalSize)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-6">
          {/* Downloads Over Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Downloads Over Time
              </CardTitle>
              <CardDescription>
                Daily download activity and user engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <div className="h-80 flex items-center justify-center text-gray-500">Loading chart...</div>
              ) : overview?.downloadsByDay?.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-gray-500">No data available</div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={overview?.downloadsByDay || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'count' ? `${value} downloads` : `${value} users`,
                          name === 'count' ? 'Downloads' : 'Unique Users'
                        ]}
                        labelFormatter={(date) => `Date: ${date}`}
                      />
                      <Area type="monotone" dataKey="count" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="uniqueUsers" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Downloads by Content Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Downloads by Content Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                {overviewLoading ? (
                  <div className="h-64 flex items-center justify-center text-gray-500">Loading...</div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={overview?.downloadsByType?.map((item: any) => ({
                            name: item.entityType,
                            value: item.count,
                            fill: item.entityType === 'projects' ? '#3B82F6' : 
                                 item.entityType === 'episodes' ? '#10B981' : 
                                 item.entityType === 'scripts' ? '#F59E0B' : '#EF4444'
                          })) || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {overview?.downloadsByType?.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={
                              entry.entityType === 'projects' ? '#3B82F6' : 
                              entry.entityType === 'episodes' ? '#10B981' : 
                              entry.entityType === 'scripts' ? '#F59E0B' : '#EF4444'
                            } />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} downloads`, 'Downloads']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Downloads by Hour */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Downloads by Hour
                </CardTitle>
              </CardHeader>
              <CardContent>
                {overviewLoading ? (
                  <div className="h-64 flex items-center justify-center text-gray-500">Loading...</div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overview?.downloadsByHour || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}:00`} />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [`${value} downloads`, 'Downloads']}
                          labelFormatter={(hour) => `Time: ${hour}:00`}
                        />
                        <Bar dataKey="count" fill="#8B5CF6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Project Download Analytics
              </CardTitle>
              <CardDescription>
                Track download activity by project to understand content popularity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : projectStats?.projects?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No project downloads found</div>
              ) : (
                <div className="space-y-3">
                  {projectStats?.projects?.map((project: any) => (
                    <div
                      key={project.projectId}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
                          <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium">{project.projectName || 'Unknown Project'}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{project.filesCount || 0} files</span>
                            <span>•</span>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              ID: {project.projectId?.slice(-8)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{project.downloadCount || 0} downloads</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{formatBytes(project.totalDataDownloaded || 0)}</span>
                          <span>•</span>
                          <span>{project.uniqueDownloaders || 0} users</span>
                        </div>
                        {project.lastDownload && (
                          <p className="text-xs text-gray-400">
                            Last: {format(new Date(project.lastDownload), 'MMM dd, yyyy HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Episodes Tab */}
        <TabsContent value="episodes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Episode Download Analytics
              </CardTitle>
              <CardDescription>
                Track download activity by episode to understand content popularity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {episodesLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : episodeStats?.episodes?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No episode downloads found</div>
              ) : (
                <div className="space-y-3">
                  {episodeStats?.episodes?.map((episode: any) => (
                    <div
                      key={episode.episodeId}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg">
                          <Eye className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium">{episode.episodeTitle || 'Unknown Episode'}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Project: {episode.projectName || 'Unknown'}</span>
                            <span>•</span>
                            <span>{episode.filesCount || 0} files</span>
                            <span>•</span>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              ID: {episode.episodeId?.slice(-8)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{episode.downloadCount || 0} downloads</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{formatBytes(episode.totalDataDownloaded || 0)}</span>
                          <span>•</span>
                          <span>{episode.uniqueDownloaders || 0} users</span>
                        </div>
                        {episode.lastDownload && (
                          <p className="text-xs text-gray-400">
                            Last: {format(new Date(episode.lastDownload), 'MMM dd, yyyy HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scripts Tab */}
        <TabsContent value="scripts" className="space-y-6">
          {/* Script Downloads by Project - Enhanced Visual */}
          <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <FolderOpen className="h-6 w-6 text-white" />
                </div>
                Script Downloads by Project
              </CardTitle>
              <CardDescription className="text-base">
                Visual breakdown of which projects have the most script downloads
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scriptsLoading ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="animate-pulse">Loading project analytics...</div>
                </div>
              ) : scriptStats?.scriptDownloadsByProject?.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No script downloads found for the selected timeframe</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scriptStats?.scriptDownloadsByProject?.map((project: any, index: number) => {
                    const maxDownloads = Math.max(...(scriptStats?.scriptDownloadsByProject?.map((p: any) => p.downloadCount) || [1]));
                    const percentage = ((project.downloadCount || 0) / maxDownloads) * 100;
                    const colors = [
                      'from-blue-500 to-blue-600',
                      'from-purple-500 to-purple-600', 
                      'from-indigo-500 to-indigo-600',
                      'from-teal-500 to-teal-600',
                      'from-emerald-500 to-emerald-600'
                    ];
                    const bgColors = [
                      'from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30',
                      'from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30',
                      'from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/30',
                      'from-teal-50 to-teal-100 dark:from-teal-950/30 dark:to-teal-900/30',
                      'from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30'
                    ];
                    
                    return (
                      <div
                        key={project.projectId}
                        className={`relative p-5 bg-gradient-to-r ${bgColors[index % bgColors.length]} rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200`}
                      >
                        {/* Progress bar background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-xl" 
                             style={{ width: `${Math.max(percentage, 10)}%` }}>
                        </div>
                        
                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 bg-gradient-to-br ${colors[index % colors.length]} rounded-lg shadow-md`}>
                              <FolderOpen className="h-7 w-7 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100">
                                {project.projectName || 'Unknown Project'}
                              </h3>
                              <div className="flex items-center gap-3 mt-1">
                                <Badge variant="outline" className="text-sm font-medium bg-white/50 dark:bg-black/20">
                                  📄 {project.scriptCount || 0} scripts
                                </Badge>
                                <Badge variant="outline" className="text-sm font-medium bg-white/50 dark:bg-black/20">
                                  👥 {project.uniqueDownloaders || 0} users
                                </Badge>
                                <span className="text-xs text-gray-500 dark:text-gray-400 bg-white/30 dark:bg-black/20 px-2 py-1 rounded">
                                  ID: {project.projectId?.slice(-8)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`p-1 bg-gradient-to-br ${colors[index % colors.length]} rounded`}>
                                <Download className="h-4 w-4 text-white" />
                              </div>
                              <span className="font-black text-2xl text-gray-900 dark:text-gray-100">
                                {project.downloadCount || 0}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <div>{formatBytes(project.totalDataDownloaded || 0)}</div>
                              {project.lastDownload && (
                                <div className="text-xs mt-1">
                                  Last: {format(new Date(project.lastDownload), 'MMM dd, yyyy HH:mm')}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Visual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart for Project Downloads */}
            {scriptStats?.scriptDownloadsByProject && scriptStats.scriptDownloadsByProject.length > 0 && (
              <Card className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/20 dark:to-teal-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    Downloads by Project
                  </CardTitle>
                  <CardDescription>Comparison of script downloads across projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scriptStats.scriptDownloadsByProject}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="projectName" 
                          angle={-45} 
                          textAnchor="end" 
                          height={100}
                          interval={0}
                          fontSize={12}
                        />
                        <YAxis fontSize={12} />
                        <Tooltip 
                          formatter={(value, name) => [
                            `${value} ${name === 'downloadCount' ? 'downloads' : 'scripts'}`,
                            name === 'downloadCount' ? 'Script Downloads' : 'Total Scripts'
                          ]}
                          contentStyle={{
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="downloadCount" fill="#059669" name="downloadCount" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="scriptCount" fill="#0891b2" name="scriptCount" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pie Chart for Project Distribution */}
            {scriptStats?.scriptDownloadsByProject && scriptStats.scriptDownloadsByProject.length > 0 && (
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    Project Distribution
                  </CardTitle>
                  <CardDescription>Percentage breakdown of script downloads by project</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={scriptStats.scriptDownloadsByProject.map((project: any, index: number) => ({
                            name: project.projectName,
                            value: project.downloadCount,
                            fill: [
                              '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444',
                              '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
                            ][index % 10]
                          }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          labelLine={false}
                        >
                          {scriptStats.scriptDownloadsByProject.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={[
                              '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444',
                              '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
                            ][index % 10]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [`${value} downloads`, 'Downloads']}
                          contentStyle={{
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Individual Script Downloads with Enhanced Project Visibility */}
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-600" />
                Individual Script Downloads by Project
              </CardTitle>
              <CardDescription>
                Detailed breakdown showing exactly which project each downloaded script belongs to
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scriptsLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-pulse">Loading individual scripts...</div>
                </div>
              ) : scriptStats?.scripts?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No individual script downloads found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scriptStats?.scripts?.map((script: any, index: number) => {
                    const projectColors = [
                      { bg: 'from-blue-500/10 to-blue-600/10', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
                      { bg: 'from-purple-500/10 to-purple-600/10', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
                      { bg: 'from-green-500/10 to-green-600/10', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
                      { bg: 'from-orange-500/10 to-orange-600/10', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
                      { bg: 'from-teal-500/10 to-teal-600/10', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' }
                    ];
                    const colorScheme = projectColors[index % projectColors.length];
                    
                    return (
                      <div
                        key={script.scriptId}
                        className={`relative flex items-center justify-between p-4 bg-gradient-to-r ${colorScheme.bg} rounded-lg border ${colorScheme.border} hover:shadow-md transition-all duration-200`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-sm">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                              {script.scriptTitle || 'Untitled Script'}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                              <Badge variant="outline" className={`text-sm font-medium ${colorScheme.text} bg-white/50 dark:bg-black/20`}>
                                📁 {script.projectName || 'No Project'}
                              </Badge>
                              <span className="text-xs text-gray-500 dark:text-gray-400 bg-white/30 dark:bg-black/20 px-2 py-1 rounded">
                                Script ID: {script.scriptId?.slice(-8)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 bg-white/30 dark:bg-black/20 px-2 py-1 rounded">
                                Project ID: {script.projectId?.slice(-8)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                              {script.downloadCount || 0}
                            </span>
                          </div>
                          {script.lastDownload && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Last: {format(new Date(script.lastDownload), 'MMM dd, yyyy HH:mm')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Download Activity
              </CardTitle>
              <CardDescription>
                Track download activity by user
              </CardDescription>
              <div className="pt-4">
                <Input
                  placeholder="Search users by name or email..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : userDownloads?.users?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No user downloads found</div>
              ) : (
                <div className="space-y-3">
                  {userDownloads?.users?.map((user: UserDownload) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{user.userName}</p>
                          <p className="text-sm text-gray-500">{user.userEmail}</p>
                        </div>
                        <Badge variant={user.userRole === 'admin' ? 'default' : user.userRole === 'editor' ? 'secondary' : 'outline'}>
                          {user.userRole}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{user.downloadCount} downloads</p>
                        <p className="text-sm text-gray-500">{formatBytes(user.totalSize)}</p>
                        <p className="text-xs text-gray-400">
                          Last: {format(new Date(user.lastDownload), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                File Statistics
              </CardTitle>
              <CardDescription>
                Detailed download statistics for all files
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filesLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : fileStats?.files?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No files found</div>
              ) : (
                <div className="space-y-3">
                  {fileStats?.files?.map((file: any) => (
                    <div
                      key={file.fileId}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium">{file.originalName}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="capitalize">{file.entityType}</span>
                            {file.entityId && (
                              <>
                                <span>•</span>
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                  ID: {file.entityId.slice(-8)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{file.downloadCount || 0} downloads</p>
                        <p className="text-sm text-gray-500">{file.uniqueDownloaders || 0} unique users</p>
                        <p className="text-xs text-gray-400">
                          {file.lastDownload ? format(new Date(file.lastDownload), 'MMM dd, yyyy HH:mm') : 'Never'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Download Activity Logs
              </CardTitle>
              <CardDescription>
                Detailed log of all download activities
              </CardDescription>
              <div className="flex gap-4 pt-4">
                <Select 
                  value={logFilters.entityType} 
                  onValueChange={(value) => setLogFilters(prev => ({ ...prev, entityType: value }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="projects">Projects</SelectItem>
                    <SelectItem value="episodes">Episodes</SelectItem>
                    <SelectItem value="scripts">Scripts</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  value={logFilters.status} 
                  onValueChange={(value) => setLogFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="interrupted">Interrupted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : downloadLogs?.logs?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No download logs found</div>
              ) : (
                <div className="space-y-3">
                  {downloadLogs?.logs?.map((log: DownloadLog) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={log.downloadStatus === 'completed' ? 'default' : 
                                   log.downloadStatus === 'failed' ? 'destructive' : 'secondary'}
                          className="w-20 justify-center"
                        >
                          {log.downloadStatus}
                        </Badge>
                        <div>
                          <p className="font-medium">{log.originalName}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{log.userName} • {log.userEmail}</span>
                            {log.entityId && (
                              <>
                                <span>•</span>
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded capitalize">
                                  {log.entityType}: {log.entityId.slice(-8)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{formatBytes(log.downloadSize)}</p>
                        <p className="text-sm text-gray-500">{formatDuration(log.downloadDuration)}</p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(log.downloadedAt), 'MMM dd, yyyy HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}