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
      description: "Discover amazing radio content and start your journey",
      icon: Radio,
      color: "from-blue-500 to-cyan-500",
      action: () => setLocation("/projects")
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Welcome Header with Audio Theme */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold mb-3">Welcome back, {user?.firstName}! 🎧</h1>
                <p className="text-xl text-white/90 mb-6">Ready to dive into amazing radio content?</p>
                <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 text-sm">
                  Level {memberStats.memberLevel} Member
                </Badge>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-8 shadow-lg">
                <Podcast className="h-20 w-20 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Quote */}
        <div className="flex justify-center">
          <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 shadow-lg max-w-3xl w-full">
            <CardContent className="p-8 text-center">
              <Quote className="h-10 w-10 mx-auto mb-6 text-orange-500" />
              <p className="text-xl italic text-gray-800 mb-4 leading-relaxed">"{dailyQuote.text}"</p>
              <p className="text-base text-gray-600 font-medium">— {dailyQuote.author}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats with Radio Icons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-full p-4 w-fit mx-auto mb-6 shadow-md">
                <Podcast className="h-10 w-10 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-2">{memberStats.totalContent}</p>
              <p className="text-sm text-gray-600 font-medium">Content Available</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-full p-4 w-fit mx-auto mb-6 shadow-md">
                <Radio className="h-10 w-10 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-2">{memberStats.totalProjects}</p>
              <p className="text-sm text-gray-600 font-medium">Radio Projects</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-full p-4 w-fit mx-auto mb-6 shadow-md">
                <Music className="h-10 w-10 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-2">{memberStats.thisWeekContent}</p>
              <p className="text-sm text-gray-600 font-medium">New This Week</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">Ready to Explore?</h3>
          <div className="flex justify-center">
            {quickActions.map((action, index) => (
              <Card key={index} className="hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 cursor-pointer border-0 shadow-xl max-w-2xl w-full" onClick={action.action}>
                <CardContent className="p-10">
                  <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
                    <div className={`bg-gradient-to-r ${action.color} rounded-full p-8 shadow-lg`}>
                      <action.icon className="h-16 w-16 text-white" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h4 className="text-3xl font-bold text-gray-900 mb-3">{action.title}</h4>
                      <p className="text-lg text-gray-600 mb-6 leading-relaxed">{action.description}</p>
                      <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-3 text-lg shadow-lg">
                        <PlayCircle className="h-6 w-6 mr-3" />
                        Start Exploring
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Member Level Progress - Repositioned */}
        <div className="flex justify-center">
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-xl max-w-2xl w-full">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Target className="h-8 w-8 mr-4 text-indigo-600" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Your Progress</h3>
                    <p className="text-base text-gray-600">Level {memberStats.memberLevel} Member</p>
                  </div>
                </div>
                <Badge className="bg-indigo-600 text-white px-4 py-2 text-sm">
                  Level {memberStats.memberLevel}
                </Badge>
              </div>
              <div className="space-y-3">
                <Progress value={(memberStats.totalContent % 5) * 20} className="h-4" />
                <p className="text-base text-gray-600 text-center font-medium">
                  {5 - (memberStats.totalContent % 5)} more content pieces to reach level {memberStats.memberLevel + 1}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}