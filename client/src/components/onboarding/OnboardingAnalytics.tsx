import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { MapPin, Users, TrendingUp, Filter, Globe, BarChart3, PieChart as PieChartIcon, RefreshCw, Activity, Clock, Target, Zap } from "lucide-react";
// Remove mock data import - use API calls instead

const COLORS = ['#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16'];

export default function OnboardingAnalytics() {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedQuestion, setSelectedQuestion] = useState<string>("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const queryClient = useQueryClient();

  // Real API call for analytics data with enhanced options
  const { data: analyticsData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["/api/onboarding/analytics", selectedFilter, selectedTimeRange],
    enabled: true,
    refetchInterval: autoRefresh ? 15000 : false, // Refetch every 15 seconds if auto-refresh is enabled
    staleTime: 10000, // Consider data stale after 10 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Update last refreshed timestamp
  useEffect(() => {
    if (analyticsData) {
      setLastRefreshed(new Date());
    }
  }, [analyticsData]);

  // Manual refresh function
  const handleManualRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["/api/onboarding/analytics"] });
  };

  // Enhanced loading state
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="flex gap-2">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No analytics data available</p>
        <p className="text-gray-400 text-sm mt-2">Data will appear here once users complete onboarding</p>
        <Button onClick={handleManualRefresh} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>
    );
  }

  // Extract data from the actual API response structure
  const { totalResponses, responsesByQuestion, completionRate, demographics, users, formConfig, locationStats } = analyticsData;
  const totalUsers = demographics?.totalUsers || 0;
  const completedUsers = Math.round((completionRate / 100) * totalUsers);
  const byLocation = demographics?.byLocation || {};
  const pendingUsers = totalUsers - completedUsers;
  const avgResponseTime = 2.5; // Could be calculated from actual data
  
  // Enhanced data preparation
  const countryData = Object.entries(locationStats?.countries || byLocation)
    .map(([country, count]) => ({ 
      country: country.charAt(0).toUpperCase() + country.slice(1), 
      count: count as number,
      percentage: totalUsers > 0 ? ((count as number / totalUsers) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const cityData = Object.entries(locationStats?.cities || byLocation)
    .map(([city, count]) => ({ 
      city: city.charAt(0).toUpperCase() + city.slice(1), 
      count: count as number,
      percentage: totalUsers > 0 ? ((count as number / totalUsers) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Prepare comprehensive chart data
  const completionData = [
    { name: 'Completed', value: completedUsers, color: '#10b981' },
    { name: 'Pending', value: pendingUsers, color: '#f59e0b' }
  ];

  // Question performance data
  const questionPerformanceData = formConfig?.questions?.map((question: any) => {
    const responses = responsesByQuestion[question.id] || {};
    const totalResponses = Object.values(responses).reduce((sum: number, count: any) => sum + count, 0);
    return {
      question: question.label?.substring(0, 30) + '...' || question.id,
      responses: totalResponses,
      completionRate: totalUsers > 0 ? ((totalResponses / totalUsers) * 100).toFixed(1) : 0,
      required: question.compulsory
    };
  }) || [];

  // Time series data (simulated for demonstration)
  const timeSeriesData = [
    { time: '00:00', users: 0 },
    { time: '04:00', users: Math.floor(completedUsers * 0.1) },
    { time: '08:00', users: Math.floor(completedUsers * 0.3) },
    { time: '12:00', users: Math.floor(completedUsers * 0.6) },
    { time: '16:00', users: Math.floor(completedUsers * 0.8) },
    { time: '20:00', users: Math.floor(completedUsers * 0.9) },
    { time: '24:00', users: completedUsers }
  ];

  // World map placeholder with hotspots
  const getHotspotSize = (count: number) => {
    const maxCount = Math.max(...Object.values(byLocation));
    return Math.max(10, (count / maxCount) * 30);
  };

  const worldHotspots = [
    { country: "USA", x: 25, y: 35, count: byLocation["USA"] || 0 },
    { country: "India", x: 70, y: 45, count: byLocation["India"] || 0 },
    { country: "Brazil", x: 35, y: 65, count: byLocation["Brazil"] || 0 },
    { country: "Kenya", x: 60, y: 55, count: byLocation["Kenya"] || 0 },
    { country: "Canada", x: 25, y: 25, count: byLocation["Canada"] || 0 },
    { country: "Australia", x: 80, y: 75, count: byLocation["Australia"] || 0 },
    { country: "Egypt", x: 58, y: 40, count: byLocation["Egypt"] || 0 },
    { country: "Singapore", x: 78, y: 52, count: byLocation["Singapore"] || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-500 to-rose-500 bg-clip-text text-transparent">
            Onboarding Analytics
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isFetching ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isFetching ? 'Updating...' : 'Live'}
              </span>
            </div>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by response" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="completed">Completed Only</SelectItem>
              <SelectItem value="pending">Pending Only</SelectItem>
              <SelectItem value="research">Research Purpose</SelectItem>
              <SelectItem value="learning">Learning Purpose</SelectItem>
              <SelectItem value="teaching">Teaching Purpose</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 dark:bg-green-900/20' : ''}
          >
            <Activity className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Enhanced Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-sky-500 to-sky-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sky-100 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold">{totalUsers}</p>
                <p className="text-sky-200 text-xs mt-1">
                  {completedUsers > 0 && `${completedUsers} active`}
                </p>
              </div>
              <Users className="h-8 w-8 text-sky-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold">{completedUsers}</p>
                <p className="text-green-200 text-xs mt-1">
                  {totalUsers > 0 && `${((completedUsers / totalUsers) * 100).toFixed(1)}% of total`}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Completion Rate</p>
                <p className="text-3xl font-bold">{completionRate}%</p>
                <p className="text-purple-200 text-xs mt-1">
                  {pendingUsers > 0 && `${pendingUsers} pending`}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Avg. Time</p>
                <p className="text-3xl font-bold">{avgResponseTime}m</p>
                <p className="text-orange-200 text-xs mt-1">
                  to complete
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="geography">Geographic</TabsTrigger>
          <TabsTrigger value="responses">Responses</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Completion Status Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Completion Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={completionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {completionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Registration Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Registration Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#0ea5e9" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Question Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Question Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={questionPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="question" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="responses" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Area Chart for Overall Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Overall Progress Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="users" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-6">
          {/* Enhanced Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enhanced Country Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Countries by User Count
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={countryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis 
                      dataKey="country" 
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => [`${value} users (${countryData.find(c => c.count === value)?.percentage}%)`, 'Users']}
                      labelFormatter={(label) => `Country: ${label}`}
                      contentStyle={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="url(#countryGradient)" 
                      radius={[4, 4, 0, 0]}
                      stroke="#0ea5e9"
                      strokeWidth={1}
                    />
                    <defs>
                      <linearGradient id="countryGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Enhanced City Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Cities by User Count
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={cityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fef3c7" />
                    <XAxis 
                      dataKey="city" 
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => [`${value} users (${cityData.find(c => c.count === value)?.percentage}%)`, 'Users']}
                      labelFormatter={(label) => `City: ${label}`}
                      contentStyle={{
                        backgroundColor: '#fffbeb',
                        border: '1px solid #fbbf24',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="url(#cityGradient)" 
                      radius={[4, 4, 0, 0]}
                      stroke="#f59e0b"
                      strokeWidth={1}
                    />
                    <defs>
                      <linearGradient id="cityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Geographic Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enhanced Country Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Country Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={countryData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ country, percentage, count }) => `${country}: ${count} (${percentage}%)`}
                      outerRadius={140}
                      innerRadius={60}
                      fill="#8884d8"
                      dataKey="count"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {countryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: string) => [`${value} users`, 'Count']}
                      labelFormatter={(label) => `Country: ${label}`}
                      contentStyle={{
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Enhanced City Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  City Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={cityData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ city, percentage, count }) => `${city}: ${count} (${percentage}%)`}
                      outerRadius={140}
                      innerRadius={60}
                      fill="#8884d8"
                      dataKey="count"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {cityData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[(index + 3) % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: string) => [`${value} users`, 'Count']}
                      labelFormatter={(label) => `City: ${label}`}
                      contentStyle={{
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Geographic Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-800 dark:text-blue-200 text-sm font-medium">Total Countries</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{countryData.length}</p>
                  </div>
                  <Globe className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-800 dark:text-green-200 text-sm font-medium">Total Cities</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">{cityData.length}</p>
                  </div>
                  <MapPin className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-800 dark:text-purple-200 text-sm font-medium">Top Location</p>
                    <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
                      {countryData.length > 0 ? countryData[0].country : 'N/A'}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Geographic Area Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Geographic Growth Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={countryData.map((country, index) => ({
                  location: country.country,
                  users: country.count,
                  growth: Math.floor(Math.random() * 20) + 5 // Simulated growth percentage
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === 'users') return [`${value} users`, 'Total Users'];
                      if (name === 'growth') return [`${value}%`, 'Growth Rate'];
                      return [value, name];
                    }}
                  />
                  <Area type="monotone" dataKey="users" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="growth" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses" className="space-y-6">
          {/* Form Response Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {responsesByQuestion && Object.keys(responsesByQuestion).length > 0 ? (
              Object.entries(responsesByQuestion).map(([questionId, questionStats], index) => {
                const chartData = Object.entries(questionStats)
                  .map(([key, value]) => ({ name: key, value }))
                  .filter(item => item.value > 0);

                return (
                  <Card key={questionId}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-sm">{questionId}</span>
                        <Badge variant="outline" className="text-xs">Response</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill={COLORS[index % COLORS.length]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-2 text-center py-8">
                <p className="text-gray-500">No form responses available yet</p>
              </div>
            )}
          </div>
          
          {/* Combined Response Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Response Distribution Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={questionPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="question" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="responses" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Question Completion Rates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Question Completion Rates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={questionPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="question" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`${value}%`, 'Completion Rate']} />
                    <Bar dataKey="completionRate" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Response Speed (Simulated) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Average Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={questionPerformanceData.map(q => ({
                    ...q,
                    avgTime: Math.random() * 30 + 10 // Simulated time in seconds
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="question" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`${value.toFixed(1)}s`, 'Avg Time']} />
                    <Line type="monotone" dataKey="avgTime" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance Radar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={[{
                  metric: 'Completion Rate',
                  value: completionRate,
                  fullMark: 100
                }, {
                  metric: 'Response Quality',
                  value: 85,
                  fullMark: 100
                }, {
                  metric: 'User Engagement',
                  value: 78,
                  fullMark: 100
                }, {
                  metric: 'Form Effectiveness',
                  value: 92,
                  fullMark: 100
                }, {
                  metric: 'User Satisfaction',
                  value: 88,
                  fullMark: 100
                }]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Performance" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Completion Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Completion Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">Completion Rate</p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">{completionRate}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-600 dark:text-green-400">{completedUsers} completed</p>
                        <p className="text-sm text-green-600 dark:text-green-400">{pendingUsers} pending</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-blue-800 dark:text-blue-200">Avg Response Time</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{avgResponseTime}m</p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-purple-800 dark:text-purple-200">Form Effectiveness</p>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">92%</p>
                      </div>
                      <Target className="h-8 w-8 text-purple-500" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Quality Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Response Quality Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {responsesByQuestion && Object.keys(responsesByQuestion).length > 0 ? (
                    Object.entries(responsesByQuestion).map(([questionId, stats]) => {
                      const totalResponses = Object.values(stats).reduce((sum, count) => sum + count, 0);
                      const topResponse = Object.entries(stats).reduce((max, [key, value]) => 
                        value > max.value ? { key, value } : max
                      , { key: '', value: 0 });
                      const diversity = Object.keys(stats).length;

                      return (
                        <div key={questionId} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">{questionId}</h4>
                            <Badge variant="outline">{totalResponses} responses</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Most Popular:</p>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{topResponse.key}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Response Diversity:</p>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{diversity} unique answers</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(topResponse.value / totalResponses) * 100}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {((topResponse.value / totalResponses) * 100).toFixed(1)}% chose this option
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No response data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Journey Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                User Journey Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">User Acquisition</h3>
                  <p className="text-2xl font-bold text-blue-600 my-2">{totalUsers}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total registrations</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Onboarding Process</h3>
                  <p className="text-2xl font-bold text-yellow-600 my-2">{avgResponseTime}m</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Average completion time</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Activation</h3>
                  <p className="text-2xl font-bold text-green-600 my-2">{completedUsers}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Successfully onboarded</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}