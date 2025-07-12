import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Coffee
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

  // Member engagement stats
  const memberStats = {
    totalContent: scripts.filter(s => s.status === 'Approved').length + episodes.length,
    totalProjects: projects.length,
    thisWeekContent: scripts.filter(script => {
      if (!script.updatedAt || script.status !== 'Approved') return false;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(script.updatedAt) >= weekAgo;
    }).length,
    memberLevel: Math.min(Math.floor((scripts.filter(s => s.status === 'Approved').length + episodes.length) / 5) + 1, 10)
  };

  // Inspirational quotes for radio content creators
  const quotes = [
    {
      text: "Radio is the most intimate and socially personal medium in the world.",
      author: "Harry von Zell"
    },
    {
      text: "The magic of radio is that it's immediate and intimate.",
      author: "Garrison Keillor"
    },
    {
      text: "Words mean more than what is set down on paper. It takes the human voice to infuse them with deeper meaning.",
      author: "Maya Angelou"
    },
    {
      text: "Radio is about creating a relationship with the listener.",
      author: "Bob Edwards"
    },
    {
      text: "Good radio is about conversation, not presentation.",
      author: "Terry Wogan"
    }
  ];

  // Get a random quote
  const dailyQuote = quotes[Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % quotes.length];

  // Quick actions for members
  const quickActions = [
    {
      title: "Explore Projects",
      description: "Discover impactful radio content and start your journey",
      icon: Radio,
      color: "from-green-500 to-emerald-500",
      action: () => setLocation("/projects")
    }
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Header with NGO Theme */}
        <div className="gradient-primary rounded-2xl p-6 text-white relative overflow-hidden shadow-lg ngo-shadow">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome back, {user?.firstName}! 🎧</h1>
                <p className="text-lg text-white/90 mb-4">Ready to make a difference through radio content?</p>
                <Badge className="bg-white/20 text-white border-white/30 px-3 py-1 text-sm">
                  Level {memberStats.memberLevel} Member
                </Badge>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 shadow-lg">
                <Heart className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Quote */}
        <div className="flex justify-center">
          <Card className="gradient-card border-green-200 shadow-md max-w-2xl w-full ngo-shadow">
            <CardContent className="p-6 text-center">
              <Quote className="h-6 w-6 mx-auto mb-4 text-green-600" />
              <p className="text-lg italic text-gray-800 dark:text-gray-200 mb-3 leading-relaxed">"{dailyQuote.text}"</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">— {dailyQuote.author}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats with Radio Icons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
          <Card className="gradient-card text-center hover:shadow-lg transition-all duration-300 hover:scale-105 border-0 shadow-md w-full max-w-xs ngo-shadow">
            <CardContent className="p-6">
              <div className="bg-gradient-to-br from-green-100 to-emerald-200 rounded-full p-3 w-fit mx-auto mb-4 shadow-sm">
                <Podcast className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{memberStats.totalContent}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Content Available</p>
            </CardContent>
          </Card>

          <Card className="gradient-card text-center hover:shadow-lg transition-all duration-300 hover:scale-105 border-0 shadow-md w-full max-w-xs ngo-shadow">
            <CardContent className="p-6">
              <div className="bg-gradient-to-br from-teal-100 to-cyan-200 rounded-full p-3 w-fit mx-auto mb-4 shadow-sm">
                <Radio className="h-8 w-8 text-teal-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{memberStats.totalProjects}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Radio Projects</p>
            </CardContent>
          </Card>

          <Card className="gradient-card text-center hover:shadow-lg transition-all duration-300 hover:scale-105 border-0 shadow-md w-full max-w-xs ngo-shadow">
            <CardContent className="p-6">
              <div className="bg-gradient-to-br from-emerald-100 to-green-200 rounded-full p-3 w-fit mx-auto mb-4 shadow-sm">
                <Music className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{memberStats.thisWeekContent}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">New This Week</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Ready to Make an Impact?</h3>
            {quickActions.map((action, index) => (
              <Card key={index} className="gradient-card hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-0 shadow-md ngo-shadow" onClick={action.action}>
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 text-center md:text-left">
                    <div className={`bg-gradient-to-r ${action.color} rounded-full p-4 shadow-md flex-shrink-0`}>
                      <action.icon className="h-10 w-10 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{action.title}</h4>
                      <p className="text-base text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{action.description}</p>
                      <Button size="default" className="gradient-primary hover:shadow-lg transition-all duration-300 px-6 py-2 shadow-md">
                        <Heart className="h-4 w-4 mr-2" />
                        Start Exploring
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
}