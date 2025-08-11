import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Users, FileText, TrendingUp, FolderOpen, BarChart3, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string | Date | null;
  downloadCount: number;
  totalDataDownloaded: number;
  uniqueDownloaders: number;
  filesCount: number;
  episodesCount: number;
  scriptsCount: number;
  lastDownload?: string | null;
}

interface Episode {
  id: string;
  title: string;
  episodeNumber?: number;
  projectId: string;
  createdAt: string | Date | null;
}

interface Script {
  id: string;
  title: string;
  projectId: string;
  status: string;
  createdAt: string | Date | null;
}

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  createdAt: string | Date | null;
}

interface FileData {
  id: string;
  filename: string;
  originalName: string;
  entityType: string;
  entityId: string;
  uploadedAt: string | Date | null;
  downloadCount: number;
  totalDownloaded: number;
}

interface DownloadOverview {
  timeframe: string;
  totalDownloads: number;
  uniqueDownloaders: number;
  totalDataDownloaded: number;
  popularFiles: any[];
  downloadsByDay: any[];
  downloadsByType: any[];
  downloadsByHour: Array<{ hour: number; count: number; }>;
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
  entityId: string;
  refererPage?: string;
  downloadedAt: string | Date;
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

export default function AnalyticsPageSimple() {
  const [timeframe, setTimeframe] = useState('7d');

  // Fetch analytics data
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/analytics/projects'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    },
  });

  const { data: episodes = [], isLoading: episodesLoading } = useQuery<Episode[]>({
    queryKey: ['/api/analytics/episodes'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/episodes');
      if (!response.ok) throw new Error('Failed to fetch episodes');
      return response.json();
    },
  });

  const { data: scripts = [], isLoading: scriptsLoading } = useQuery<Script[]>({
    queryKey: ['/api/analytics/scripts'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/scripts');
      if (!response.ok) throw new Error('Failed to fetch scripts');
      return response.json();
    },
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/analytics/users'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  const { data: files = [], isLoading: filesLoading } = useQuery<FileData[]>({
    queryKey: ['/api/analytics/files'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/files');
      if (!response.ok) throw new Error('Failed to fetch files');
      return response.json();
    },
  });

  const { data: downloadOverview, isLoading: downloadOverviewLoading } = useQuery<DownloadOverview>({
    queryKey: ['/api/analytics/downloads/overview', timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/downloads/overview?timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch download overview');
      return response.json();
    },
  });

  const { data: downloadLogs = [], isLoading: downloadLogsLoading } = useQuery<{ logs: DownloadLog[] }>({
    queryKey: ['/api/analytics/downloads/logs', timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/downloads/logs?timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch download logs');
      return response.json();
    },
  });

  const { data: userDownloads = [], isLoading: userDownloadsLoading } = useQuery<UserDownload[]>({
    queryKey: ['/api/analytics/downloads/users', timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/downloads/users?timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch user downloads');
      return response.json();
    },
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Track your content performance and user engagement</p>
            </div>
          </div>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Downloads</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {downloadOverview?.totalDownloads || 0}
                  </p>
                </div>
                <Download className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {downloadOverview?.uniqueDownloaders || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Files</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {files.length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Data Downloaded</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatBytes(downloadOverview?.totalDataDownloaded || 0)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics */}
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="episodes">Episodes</TabsTrigger>
            <TabsTrigger value="scripts">Scripts</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>

          {/* Projects Analytics */}
          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Projects Analytics
                </CardTitle>
                <CardDescription>
                  Track project performance and engagement metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="text-center py-8">Loading projects...</div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No projects found</div>
                ) : (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{project.name}</h3>
                            {project.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{project.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>Created: {formatDate(project.createdAt)}</span>
                              <span>Downloads: {project.downloadCount}</span>
                              <span>Files: {project.filesCount}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary">
                              {formatBytes(project.totalDataDownloaded)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Episodes Analytics */}
          <TabsContent value="episodes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Episodes Analytics
                </CardTitle>
                <CardDescription>
                  Track episode performance and downloads
                </CardDescription>
              </CardHeader>
              <CardContent>
                {episodesLoading ? (
                  <div className="text-center py-8">Loading episodes...</div>
                ) : episodes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No episodes found</div>
                ) : (
                  <div className="space-y-4">
                    {episodes.map((episode) => (
                      <div key={episode.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{episode.title}</h3>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>Episode: {episode.episodeNumber || 'N/A'}</span>
                              <span>Created: {formatDate(episode.createdAt)}</span>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            Episode {episode.episodeNumber || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scripts Analytics */}
          <TabsContent value="scripts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Scripts Analytics
                </CardTitle>
                <CardDescription>
                  Track script creation and management
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scriptsLoading ? (
                  <div className="text-center py-8">Loading scripts...</div>
                ) : scripts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No scripts found</div>
                ) : (
                  <div className="space-y-4">
                    {scripts.map((script) => (
                      <div key={script.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{script.title}</h3>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>Created: {formatDate(script.createdAt)}</span>
                            </div>
                          </div>
                          <Badge variant={script.status === 'Published' ? 'default' : 'secondary'}>
                            {script.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Analytics */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Users Analytics
                </CardTitle>
                <CardDescription>
                  Track user registration and activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-8">Loading users...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No users found</div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {user.name || user.email}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>Joined: {formatDate(user.createdAt)}</span>
                            </div>
                          </div>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Analytics */}
          <TabsContent value="files">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Files Analytics
                </CardTitle>
                <CardDescription>
                  Track file uploads and download statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filesLoading ? (
                  <div className="text-center py-8">Loading files...</div>
                ) : files.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No files found</div>
                ) : (
                  <div className="space-y-4">
                    {files.map((file) => (
                      <div key={file.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{file.originalName}</h3>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>Type: {file.entityType}</span>
                              <span>Downloads: {file.downloadCount}</span>
                              <span>Uploaded: {formatDate(file.uploadedAt)}</span>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {formatBytes(file.totalDownloaded)}
                          </Badge>
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
    </div>
  );
}