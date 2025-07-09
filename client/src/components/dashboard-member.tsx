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
      description: "Discover amazing radio content",
      icon: Radio,
      color: "from-blue-500 to-cyan-500",
      action: () => setLocation("/projects")
    },
    {
      title: "Browse Content",
      description: "Find your next favorite show",
      icon: Headphones,
      color: "from-purple-500 to-pink-500",
      action: () => setLocation("/projects")
    },
    {
      title: "Audio Library", 
      description: "Listen to podcast episodes",
      icon: Volume2,
      color: "from-green-500 to-emerald-500",
      action: () => setLocation("/projects")
    }
  ];

  // Member achievements/milestones
  const achievements = [
    {
      title: "Radio Explorer",
      description: "Discovered 5+ projects",
      icon: Search,
      earned: memberStats.totalProjects >= 1,
      color: "text-blue-500"
    },
    {
      title: "Content Enthusiast", 
      description: "Engaged with 10+ pieces",
      icon: Heart,
      earned: memberStats.totalContent >= 5,
      color: "text-red-500"
    },
    {
      title: "Weekly Listener",
      description: "Active this week",
      icon: Calendar,
      earned: memberStats.thisWeekContent > 0,
      color: "text-green-500"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header with Audio Theme */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.firstName}! 🎧</h1>
              <p className="text-xl text-white/90 mb-4">Ready to dive into amazing radio content?</p>
              <div className="flex items-center space-x-4">
                <Badge className="bg-white/20 text-white border-white/30">
                  Level {memberStats.memberLevel} Member
                </Badge>
                <div className="flex items-center text-white/80">
                  <Trophy className="h-4 w-4 mr-1" />
                  <span className="text-sm">{achievements.filter(a => a.earned).length}/3 Achievements</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-6">
                <Podcast className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Quote */}
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-6 text-center">
            <Quote className="h-8 w-8 mx-auto mb-4 text-orange-500" />
            <p className="text-lg italic text-gray-800 mb-3">"{dailyQuote.text}"</p>
            <p className="text-sm text-gray-600">— {dailyQuote.author}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats with Radio Icons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
        <Card className="text-center hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="bg-blue-100 rounded-full p-3 w-fit mx-auto mb-4">
              <Podcast className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{memberStats.totalContent}</p>
            <p className="text-sm text-gray-600">Content Available</p>
          </CardContent>
        </Card>

        <Card className="text-center hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="bg-green-100 rounded-full p-3 w-fit mx-auto mb-4">
              <Radio className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{memberStats.totalProjects}</p>
            <p className="text-sm text-gray-600">Radio Projects</p>
          </CardContent>
        </Card>

        <Card className="text-center hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="bg-purple-100 rounded-full p-3 w-fit mx-auto mb-4">
              <Music className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{memberStats.thisWeekContent}</p>
            <p className="text-sm text-gray-600">New This Week</p>
          </CardContent>
        </Card>

        <Card className="text-center hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="bg-indigo-100 rounded-full p-3 w-fit mx-auto mb-4">
              <Mic className="h-8 w-8 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{memberStats.memberLevel}</p>
            <p className="text-sm text-gray-600">Member Level</p>
          </CardContent>
        </Card>
      </div>

      {/* Member Progress */}
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-500" />
              Your Radio Journey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Level Progress</span>
                  <span className="text-sm text-gray-500">Level {memberStats.memberLevel}</span>
                </div>
                <Progress value={(memberStats.totalContent % 5) * 20} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  {5 - (memberStats.totalContent % 5)} more content pieces to reach level {memberStats.memberLevel + 1}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="max-w-6xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Explore Radio Content</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={action.action}>
              <CardContent className="p-6">
                <div className={`bg-gradient-to-r ${action.color} rounded-lg p-4 mb-4`}>
                  <action.icon className="h-8 w-8 text-white mx-auto" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h4>
                <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                <Button variant="outline" size="sm" className="w-full">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
              Your Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {achievements.map((achievement, index) => (
                <div key={index} className={`p-4 rounded-lg border ${achievement.earned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center mb-2">
                    <achievement.icon className={`h-5 w-5 mr-2 ${achievement.earned ? achievement.color : 'text-gray-400'}`} />
                    <h4 className={`font-semibold ${achievement.earned ? 'text-gray-900' : 'text-gray-500'}`}>
                      {achievement.title}
                    </h4>
                    {achievement.earned && <Badge className="ml-auto bg-green-500">Earned</Badge>}
                  </div>
                  <p className={`text-sm ${achievement.earned ? 'text-gray-700' : 'text-gray-500'}`}>
                    {achievement.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Motivational Footer */}
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-8 border border-blue-100">
          <Coffee className="h-12 w-12 mx-auto mb-4 text-blue-500" />
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Keep Exploring!</h3>
          <p className="text-gray-600 mb-6">Every great radio journey starts with curiosity. What will you discover today?</p>
          <div className="flex justify-center space-x-4">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={() => setLocation("/projects")}
            >
              <Radio className="h-5 w-5 mr-2" />
              Start Exploring
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setLocation("/projects")}
            >
              <Bookmark className="h-5 w-5 mr-2" />
              Browse Categories
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}