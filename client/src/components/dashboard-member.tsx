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
      color: "from-blue-500 to-purple-500",
      action: () => setLocation("/projects")
    }
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Header with Enhanced NGO Theme */}
        <div className="gradient-primary rounded-2xl p-8 text-white relative overflow-hidden shadow-lg ngo-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent"></div>
          <div className="relative">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Welcome back, {user?.firstName}! 🎧
                </h1>
                <p className="text-xl text-white/90 mb-6">Ready to make a difference through radio content?</p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 text-sm backdrop-blur-sm">
                    Level {memberStats.memberLevel} Member
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-100 border-blue-300/30 px-4 py-2 text-sm backdrop-blur-sm">
                    NGO Community
                  </Badge>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 shadow-lg">
                <Heart className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Quote */}
        <div className="flex justify-center">
          <Card className="gradient-card border-blue-200 shadow-lg max-w-3xl w-full ngo-shadow">
            <CardContent className="p-8 text-center">
              <Quote className="h-8 w-8 mx-auto mb-6 text-blue-600" />
              <p className="text-xl italic text-gray-800 dark:text-gray-200 mb-4 leading-relaxed font-medium">"{dailyQuote.text}"</p>
              <p className="text-base text-gray-600 dark:text-gray-400 font-semibold">— {dailyQuote.author}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats with Radio Icons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
          <Card className="gradient-card text-center hover:shadow-lg transition-all duration-300 hover:scale-105 border-0 shadow-lg w-full max-w-sm ngo-shadow">
            <CardContent className="p-8">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full p-4 w-fit mx-auto mb-6 shadow-md">
                <Podcast className="h-10 w-10 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{memberStats.totalContent}</p>
              <p className="text-base text-gray-600 dark:text-gray-300 font-medium">Content Available</p>
            </CardContent>
          </Card>

          <Card className="gradient-card text-center hover:shadow-lg transition-all duration-300 hover:scale-105 border-0 shadow-lg w-full max-w-sm ngo-shadow">
            <CardContent className="p-8">
              <div className="bg-gradient-to-br from-purple-100 to-pink-200 rounded-full p-4 w-fit mx-auto mb-6 shadow-md">
                <Radio className="h-10 w-10 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{memberStats.totalProjects}</p>
              <p className="text-base text-gray-600 dark:text-gray-300 font-medium">Radio Projects</p>
            </CardContent>
          </Card>

          <Card className="gradient-card text-center hover:shadow-lg transition-all duration-300 hover:scale-105 border-0 shadow-lg w-full max-w-sm ngo-shadow">
            <CardContent className="p-8">
              <div className="bg-gradient-to-br from-indigo-100 to-blue-200 rounded-full p-4 w-fit mx-auto mb-6 shadow-md">
                <Music className="h-10 w-10 text-indigo-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{memberStats.thisWeekContent}</p>
              <p className="text-base text-gray-600 dark:text-gray-300 font-medium">New This Week</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center">
          <div className="w-full max-w-3xl">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">Ready to Make an Impact?</h3>
            {quickActions.map((action, index) => (
              <Card key={index} className="gradient-card hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border-0 shadow-lg ngo-shadow" onClick={action.action}>
                <CardContent className="p-10">
                  <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8 text-center md:text-left">
                    <div className={`bg-gradient-to-r ${action.color} rounded-full p-6 shadow-lg flex-shrink-0`}>
                      <action.icon className="h-12 w-12 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">{action.title}</h4>
                      <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{action.description}</p>
                      <Button size="lg" className="gradient-primary hover:shadow-lg transition-all duration-300 px-8 py-3 shadow-md text-lg">
                        <Heart className="h-5 w-5 mr-3" />
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