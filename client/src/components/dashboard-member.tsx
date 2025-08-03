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
  Share2,
  FileText,
  User
} from "lucide-react";
import type { Script, Project, Episode } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export function MemberDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // For public NGO content dashboard, use fallback user data if not authenticated
  const displayUser = user || { firstName: 'Visitor' };

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
        
        {/* Hero/Featured Content Section */}
        <div className="relative rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 p-8 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-white/30 px-3 py-1 backdrop-blur-sm text-xs">
                  Featured Campaign
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Education for Every Child
              </h1>
              <p className="text-green-100 text-base mb-6 leading-relaxed">
                Join our mission to provide quality education to underserved communities. 
                Discover how your support is creating lasting change in children's lives.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-white text-green-600 hover:bg-white/90 font-medium">
                  Learn More
                </Button>
                <Button variant="ghost" className="text-white border-white/30 hover:bg-white/10">
                  View Impact Report
                </Button>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <div className="relative">
                <div className="w-full h-64 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <div className="text-center text-white/80">
                    <Users className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-sm">Featured Campaign Image</p>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg">
                  500+ Lives Impacted
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  245
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Articles</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  32
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Projects</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Heart className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  89
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Success Stories</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  12
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Upcoming Events</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Latest Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Latest Content</h2>
              <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hidden sm:flex">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="grid gap-4">
              {/* Latest content cards */}
              <Card className="p-4 border-0 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        Report
                      </Badge>
                      <span className="text-xs text-gray-500">2 days ago</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      2024 Annual Impact Report
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      Discover how your support helped us reach over 10,000 children with quality education programs this year. Read our comprehensive impact assessment...
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-0 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        Success Story
                      </Badge>
                      <span className="text-xs text-gray-500">5 days ago</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Maria's Journey: From Student to Teacher
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      Meet Maria, a former student who graduated through our scholarship program and is now teaching in her local community, inspiring the next generation...
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-0 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        Event
                      </Badge>
                      <span className="text-xs text-gray-500">1 week ago</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Community Learning Festival 2024
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      Join us for our annual celebration of learning and community achievement. Free workshops, cultural performances, and inspiring stories await...
                    </p>
                  </div>
                </div>
              </Card>
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

            {/* Content Categories */}
            <Card className="p-6 border-0 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Explore by Topic</h3>
              </div>
              
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => setLocation('/education')}>
                  <Headphones className="w-4 h-4 mr-2" />
                  Education
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setLocation('/health')}>
                  <Heart className="w-4 h-4 mr-2" />
                  Health & Wellness
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setLocation('/environment')}>
                  <Activity className="w-4 h-4 mr-2" />
                  Environment
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setLocation('/community')}>
                  <Users className="w-4 h-4 mr-2" />
                  Community Development
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setLocation('/youth')}>
                  <Star className="w-4 h-4 mr-2" />
                  Youth Programs
                </Button>
              </div>
            </Card>

            {/* Get Involved */}
            <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200/50 dark:border-orange-800/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Heart className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Get Involved</h3>
              </div>
              
              <div className="space-y-3">
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                  <Gift className="w-4 h-4 mr-2" />
                  Donate Now
                </Button>
                <Button variant="outline" className="w-full">
                  <Users className="w-4 h-4 mr-2" />
                  Volunteer
                </Button>
                <Button variant="outline" className="w-full">
                  <Bell className="w-4 h-4 mr-2" />
                  Subscribe to Newsletter
                </Button>
              </div>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}