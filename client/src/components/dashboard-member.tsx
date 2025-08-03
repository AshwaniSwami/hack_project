import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Podcast, 
  Radio, 
  Headphones, 
  Mic, 
  Music,
  Volume2,
  Quote,
  Users,
  Calendar,
  PlayCircle,
  Heart,
  Bookmark,
  Search,
  Bell,
  Gift,
  Trophy,
  Target,
  Coffee,
  TrendingUp,
  Clock,
  Star,
  ChevronRight,
  Play,
  Plus,
  Activity,
  Zap,
  Eye,
  Download,
  Share2
} from "lucide-react";
import type { Script, Project, Episode } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export function MemberDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: scripts = [] } = useQuery<Script[]>({
    queryKey: ["/api/scripts"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: episodes = [] } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
  });

  // Enhanced member engagement stats
  const memberStats = {
    totalContent: scripts.filter(s => s.status === 'Approved').length + episodes.length,
    totalProjects: projects.length,
    thisWeekContent: scripts.filter(script => {
      if (!script.updatedAt || script.status !== 'Approved') return false;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(script.updatedAt) >= weekAgo;
    }).length,
    memberLevel: Math.min(Math.floor((scripts.filter(s => s.status === 'Approved').length + episodes.length) / 5) + 1, 10),
    completionRate: Math.min(((scripts.filter(s => s.status === 'Approved').length + episodes.length) / Math.max(projects.length * 3, 1)) * 100, 100),
    streakDays: 7, // Mock streak for engagement
    points: (scripts.filter(s => s.status === 'Approved').length * 10) + (episodes.length * 15)
  };

  // Curated inspirational content
  const dailyInspiration = {
    text: "Every voice has the power to inspire, educate, and transform communities.",
    author: "Radio Innovators",
    tip: "Start with one story that matters to you, and let it reach others through the airwaves."
  };

  // Enhanced navigation actions
  const quickActions = [
    {
      title: "Discover Projects",
      description: "Explore meaningful radio content that makes a difference",
      icon: Search,
      gradient: "from-blue-500 via-purple-500 to-pink-500",
      route: "/projects",
      badge: "Popular"
    },
    {
      title: "Browse Episodes",
      description: "Listen to inspiring stories and engaging content",
      icon: Play,
      gradient: "from-green-500 via-teal-500 to-blue-500",
      route: "/episodes",
      badge: "New"
    },
    {
      title: "View Scripts",
      description: "Read compelling scripts from talented creators",
      icon: Mic,
      gradient: "from-orange-500 via-red-500 to-pink-500",
      route: "/scripts",
      badge: "Trending"
    }
  ];

  // Recent activity highlights
  const recentHighlights = [
    {
      type: "content",
      title: "New Educational Series Available",
      description: "Community Health Awareness - 5 new episodes",
      time: "2 hours ago",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      type: "achievement",
      title: "Member Milestone Reached",
      description: "Congratulations on exploring 10+ projects!",
      time: "1 day ago",
      icon: Trophy,
      color: "text-yellow-600"
    },
    {
      type: "community",
      title: "Weekly Community Update",
      description: "See what fellow members are creating",
      time: "3 days ago",
      icon: Users,
      color: "text-blue-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Clean Welcome Section */}
        <div className="relative rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  Welcome back, {user?.firstName || 'Member'}!
                </h1>
                <p className="text-blue-100 text-sm sm:text-base">
                  Ready to explore radio content?
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Badge className="bg-white/20 text-white border-white/30 px-3 py-1 backdrop-blur-sm text-xs">
                <Star className="w-3 h-3 mr-1" />
                Level {memberStats.memberLevel}
              </Badge>
              <Badge className="bg-yellow-400/20 text-yellow-100 border-yellow-300/30 px-3 py-1 backdrop-blur-sm text-xs">
                {memberStats.points} Points
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Podcast className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {memberStats.totalContent}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Content</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Radio className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {memberStats.totalProjects}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Projects</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {memberStats.thisWeekContent}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">This Week</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {memberStats.completionRate.toFixed(0)}%
                  </h3>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Progress</p>
                <Progress value={memberStats.completionRate} className="h-1.5" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Actions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Explore Content</h2>
              <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hidden sm:flex">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="grid gap-4">
              {quickActions.map((action, index) => (
                <Card 
                  key={index}
                  className="p-4 border-0 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                  onClick={() => setLocation(action.route)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 bg-gradient-to-br ${action.gradient} rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {action.title}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {action.badge}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {action.description}
                      </p>
                      <Button variant="ghost" size="sm" className="p-0 h-auto font-medium text-blue-600 dark:text-blue-400 hover:bg-transparent">
                        Get Started <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Daily Inspiration */}
            <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-white/80 to-blue-50/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Quote className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Daily Inspiration</h3>
              </div>
              <blockquote className="text-gray-700 dark:text-gray-300 mb-3 italic">
                "{dailyInspiration.text}"
              </blockquote>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                — {dailyInspiration.author}
              </p>
              <Separator className="my-4" />
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  💡 {dailyInspiration.tip}
                </p>
              </div>
            </Card>

            {/* Activity Summary */}
            <Card className="p-6 border-0 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Activity</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Content Viewed</span>
                  <span className="font-medium text-gray-900 dark:text-white">{memberStats.totalContent}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Projects Explored</span>
                  <span className="font-medium text-gray-900 dark:text-white">{memberStats.totalProjects}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">This Week</span>
                  <span className="font-medium text-green-600 dark:text-green-400">+{memberStats.thisWeekContent}</span>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="text-center">
                <Button variant="outline" size="sm" className="w-full">
                  <Trophy className="w-4 h-4 mr-2" />
                  View Achievements
                </Button>
              </div>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}