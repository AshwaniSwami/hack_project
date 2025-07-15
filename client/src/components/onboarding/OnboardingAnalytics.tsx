import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapPin, Users, TrendingUp, Filter, Globe, BarChart3, PieChart as PieChartIcon } from "lucide-react";
// Remove mock data import - use API calls instead

const COLORS = ['#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16'];

export default function OnboardingAnalytics() {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedQuestion, setSelectedQuestion] = useState<string>("all");

  // Real API call for analytics data
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ["/api/onboarding/analytics"],
    enabled: true,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: false, // Don't retry on failure
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    console.error("Analytics error:", error);
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-2">Failed to load analytics data</p>
        <p className="text-gray-500 text-sm">Error: {error.message || 'Unknown error'}</p>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  const { 
    totalUsers = 0, 
    completedUsers = 0, 
    completionRate = 0, 
    locationStats = { countries: {}, cities: {} }, 
    responseStats = {}, 
    users = [], 
    formConfig = { questions: [] } 
  } = analyticsData || {};

  // Prepare chart data with safe access
  const countryData = locationStats?.countries ? Object.entries(locationStats.countries)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8) : [];

  const cityData = locationStats?.cities ? Object.entries(locationStats.cities)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8) : [];

  // World map placeholder with hotspots
  const getHotspotSize = (count: number) => {
    const maxCount = locationStats?.countries ? Math.max(...Object.values(locationStats.countries)) : 1;
    return Math.max(10, (count / maxCount) * 30);
  };

  const worldHotspots = [
    { country: "USA", x: 25, y: 35, count: locationStats?.countries?.["USA"] || 0 },
    { country: "India", x: 70, y: 45, count: locationStats?.countries?.["India"] || 0 },
    { country: "Brazil", x: 35, y: 65, count: locationStats?.countries?.["Brazil"] || 0 },
    { country: "Kenya", x: 60, y: 55, count: locationStats?.countries?.["Kenya"] || 0 },
    { country: "Canada", x: 25, y: 25, count: locationStats?.countries?.["Canada"] || 0 },
    { country: "Australia", x: 80, y: 75, count: locationStats?.countries?.["Australia"] || 0 },
    { country: "Egypt", x: 58, y: 40, count: locationStats?.countries?.["Egypt"] || 0 },
    { country: "Singapore", x: 78, y: 52, count: locationStats?.countries?.["Singapore"] || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-500 to-rose-500 bg-clip-text text-transparent">
          Onboarding Analytics
        </h2>
        <div className="flex gap-2">
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by response" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="research">Research Purpose</SelectItem>
              <SelectItem value="learning">Learning Purpose</SelectItem>
              <SelectItem value="teaching">Teaching Purpose</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-sky-500 to-sky-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sky-100 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold">{totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-sky-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Completed Onboarding</p>
                <p className="text-3xl font-bold">{completedUsers}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Completion Rate</p>
                <p className="text-3xl font-bold">{completionRate}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="geography" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="geography">Geographic Data</TabsTrigger>
          <TabsTrigger value="responses">Form Responses</TabsTrigger>
          <TabsTrigger value="insights">User Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="geography" className="space-y-6">
          {/* World Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Global User Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-96 bg-gradient-to-b from-sky-100 to-green-100 dark:from-gray-800 dark:to-gray-700 rounded-lg overflow-hidden">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Simple world map outline */}
                  <rect x="0" y="0" width="100" height="100" fill="url(#worldGradient)" />
                  <defs>
                    <linearGradient id="worldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#e0f2fe', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#dcfce7', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  
                  {/* Continents as simple shapes */}
                  <path d="M 20 30 Q 30 25 40 35 Q 45 30 50 40 Q 35 45 25 40 Q 15 35 20 30" fill="#10b981" opacity="0.3" />
                  <path d="M 55 35 Q 75 30 85 45 Q 80 55 70 50 Q 60 45 55 35" fill="#10b981" opacity="0.3" />
                  <path d="M 30 55 Q 45 50 55 65 Q 40 70 30 65 Q 25 60 30 55" fill="#10b981" opacity="0.3" />
                  <path d="M 75 70 Q 85 65 90 75 Q 85 80 80 75 Q 70 75 75 70" fill="#10b981" opacity="0.3" />
                  
                  {/* User hotspots */}
                  {worldHotspots.map((hotspot, index) => (
                    hotspot.count > 0 && (
                      <g key={index}>
                        <circle
                          cx={hotspot.x}
                          cy={hotspot.y}
                          r={getHotspotSize(hotspot.count)}
                          fill="#f43f5e"
                          opacity="0.7"
                          className="animate-pulse"
                        />
                        <text
                          x={hotspot.x}
                          y={hotspot.y - getHotspotSize(hotspot.count) - 2}
                          textAnchor="middle"
                          className="text-xs fill-gray-700 dark:fill-gray-300"
                        >
                          {hotspot.count}
                        </text>
                      </g>
                    )
                  ))}
                </svg>
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Countries</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={countryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="country" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0ea5e9" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Cities</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={cityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="city" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f43f5e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="responses" className="space-y-6">
          {/* Form Response Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {formConfig?.questions?.map((question, index) => {
              const questionStats = responseStats?.[question.id];
              if (!questionStats) return null;

              const chartData = Object.entries(questionStats)
                .map(([key, value]) => ({ name: key, value }))
                .filter(item => item.value > 0);

              return (
                <Card key={question.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-sm">{question.label}</span>
                      {question.compulsory && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      {question.type === 'radio' ? (
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      ) : (
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill={COLORS[index % COLORS.length]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Completion Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.location?.city || 'Unknown'}, {user.location?.country || 'Unknown'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.firstLoginCompleted ? "default" : "secondary"}>
                          {user.firstLoginCompleted ? "Completed" : "Pending"}
                        </Badge>
                        <MapPin className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {responseStats && Object.entries(responseStats).map(([questionId, stats]) => {
                    const question = formConfig?.questions?.find(q => q.id === questionId);
                    if (!question) return null;

                    const totalResponses = Object.values(stats || {}).reduce((sum, count) => sum + count, 0);
                    const topResponse = Object.entries(stats || {}).reduce((max, [key, value]) => 
                      value > max.value ? { key, value } : max
                    , { key: '', value: 0 });

                    return (
                      <div key={questionId} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{question.label}</h4>
                          <Badge variant="outline">{totalResponses} responses</Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Most popular: <span className="font-medium">{topResponse.key}</span> ({topResponse.value} users)
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}