import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Download, Users, FileText, TrendingUp, Eye, Calendar, Clock, Database } from "lucide-react";
import { format } from "date-fns";

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
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
                          <p className="text-sm text-gray-500 capitalize">{file.entityType}</p>
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
                          Last: {format(new Date(user.lastDownload), 'MMM dd, HH:mm')}
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
                          <p className="text-sm text-gray-500 capitalize">{file.entityType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{file.downloadCount || 0} downloads</p>
                        <p className="text-sm text-gray-500">{file.uniqueDownloaders || 0} unique users</p>
                        <p className="text-xs text-gray-400">
                          {file.lastDownload ? format(new Date(file.lastDownload), 'MMM dd, HH:mm') : 'Never'}
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
                          <p className="text-sm text-gray-500">{log.userName} • {log.userEmail}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{formatBytes(log.downloadSize)}</p>
                        <p className="text-sm text-gray-500">{formatDuration(log.downloadDuration)}</p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(log.downloadedAt), 'MMM dd, HH:mm:ss')}
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