import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Radio, 
  PlayCircle, 
  Star, 
  Calendar,
  TrendingUp,
  Quote,
  Users,
  Headphones
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

  // Simple stats for members
  const memberStats = {
    totalContent: scripts.filter(s => s.status === 'Approved').length + episodes.length,
    totalProjects: projects.length,
    thisWeekContent: scripts.filter(script => {
      if (!script.updatedAt || script.status !== 'Approved') return false;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(script.updatedAt) >= weekAgo;
    }).length
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

  // Get recent approved content
  const recentContent = scripts
    .filter(script => script.status === 'Approved')
    .slice(0, 4)
    .map(script => ({
      id: script.id,
      title: script.title,
      project: projects.find(p => p.id === script.projectId)?.title || 'Unknown Project',
      type: 'Script'
    }));

  return (
    <div className="space-y-8">
      {/* Clean Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to SMART Radio, {user?.firstName}!</h1>
          <p className="text-xl text-white/90 mb-6">Discover amazing radio content and stay inspired</p>
          
          {/* Daily Quote */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
            <Quote className="h-8 w-8 mx-auto mb-4 text-white/80" />
            <p className="text-lg italic text-white/95 mb-3">"{dailyQuote.text}"</p>
            <p className="text-sm text-white/70">— {dailyQuote.author}</p>
          </div>
        </div>
      </div>

      {/* Simple Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Card className="text-center">
          <CardContent className="p-6">
            <FileText className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <p className="text-3xl font-bold text-gray-900 mb-2">{memberStats.totalContent}</p>
            <p className="text-sm text-gray-600">Pieces of content available</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <Radio className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <p className="text-3xl font-bold text-gray-900 mb-2">{memberStats.totalProjects}</p>
            <p className="text-sm text-gray-600">Active projects</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-purple-600" />
            <p className="text-3xl font-bold text-gray-900 mb-2">{memberStats.thisWeekContent}</p>
            <p className="text-sm text-gray-600">New this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Content */}
      {recentContent.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Headphones className="h-5 w-5 mr-2 text-indigo-500" />
                Recently Published Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentContent.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.project}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {item.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Call to Action */}
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to explore?</h3>
          <p className="text-gray-600 mb-6">Browse our collection of radio projects and discover amazing content.</p>
          <div className="flex justify-center">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setLocation("/projects")}
            >
              <Radio className="h-5 w-5 mr-2" />
              Explore Projects
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}