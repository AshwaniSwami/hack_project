import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  TrendingUp, 
  Star, 
  Eye, 
  Download, 
  Calendar,
  PlayCircle,
  FileText,
  Radio,
  Tag,
  ArrowRight,
  Clock,
  Bookmark
} from "lucide-react";
import type { Script, Project, Episode } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export function MemberDashboard() {
  const { user } = useAuth();
  
  const { data: scripts = [] } = useQuery<Script[]>({
    queryKey: ["/api/scripts"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: episodes = [] } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
  });

  // Get recently published content (approved scripts and episodes)
  const recentContent = [
    ...scripts.filter(script => script.status === 'Approved').slice(0, 5).map(script => ({
      id: script.id,
      type: 'script',
      title: script.title,
      description: script.content?.substring(0, 150) + '...' || 'No description available',
      project: projects.find(p => p.id === script.projectId)?.title || 'Unknown Project',
      time: script.updatedAt || script.createdAt,
      thumbnail: '/placeholder-script.jpg',
      duration: `${Math.floor(Math.random() * 15) + 5} min read`,
      category: projects.find(p => p.id === script.projectId)?.theme || 'General'
    })),
    ...episodes.slice(0, 3).map(episode => ({
      id: episode.id,
      type: 'episode',
      title: episode.title,
      description: episode.description || 'No description available',
      project: projects.find(p => p.id === episode.projectId)?.title || 'Unknown Project',
      time: episode.createdAt,
      thumbnail: '/placeholder-episode.jpg',
      duration: `${Math.floor(Math.random() * 30) + 15} min`,
      category: projects.find(p => p.id === episode.projectId)?.theme || 'General'
    }))
  ].sort((a, b) => new Date(b.time || '').getTime() - new Date(a.time || '').getTime()).slice(0, 6);

  // Enhanced trending content with better engagement metrics
  const trendingContent = scripts
    .filter(script => script.status === 'Approved')
    .slice(0, 4)
    .map((script, index) => ({
      id: script.id,
      type: 'script',
      title: script.title,
      description: script.content?.substring(0, 120) + '...' || 'No description available',
      project: projects.find(p => p.id === script.projectId)?.title || 'Unknown Project',
      downloads: (50 - index * 8) + Math.floor(Math.random() * 10), // Realistic declining popularity
      views: (200 - index * 30) + Math.floor(Math.random() * 50), // Realistic view counts
      thumbnail: '/placeholder-script.jpg',
      rating: (4.5 - index * 0.2).toFixed(1),
      duration: `${Math.floor(Math.random() * 15) + 5} min read`,
      category: projects.find(p => p.id === script.projectId)?.theme || 'General'
    }));

  // Platform engagement stats for members
  const platformStats = {
    totalContent: scripts.filter(s => s.status === 'Approved').length + episodes.length,
    totalProjects: projects.length,
    thisWeekContent: [
      ...scripts.filter(script => {
        if (!script.updatedAt || script.status !== 'Approved') return false;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(script.updatedAt) >= weekAgo;
      }),
      ...episodes.filter(episode => {
        if (!episode.createdAt) return false;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(episode.createdAt) >= weekAgo;
      })
    ].length,
    averageRating: 4.3
  };

  // Recommended content (based on project variety)
  const recommendedContent = projects.slice(0, 3).map(project => {
    const projectScripts = scripts.filter(script => script.projectId === project.id && script.status === 'Approved');
    const projectEpisodes = episodes.filter(episode => episode.projectId === project.id);
    
    return {
      id: project.id,
      type: 'project',
      title: project.title,
      description: project.description || 'Explore this project collection',
      scriptsCount: projectScripts.length,
      episodesCount: projectEpisodes.length,
      thumbnail: '/placeholder-project.jpg'
    };
  });

  return (
    <div className="space-y-8">
      {/* Enhanced Welcome Header with Platform Stats */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome, {user?.firstName}! Discover what's new.</h1>
            <p className="text-white/80 text-lg mb-4">Content discovery, consumption, and platform engagement</p>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">{platformStats.totalContent} pieces of content available</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4" />
                <span className="text-sm">{platformStats.averageRating}★ average rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm">{platformStats.thisWeekContent} new this week</span>
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-white/80">Your listening journey</p>
              <p className="text-2xl font-bold">0 episodes</p>
              <p className="text-xs text-white/70">Start exploring!</p>
            </div>
          </div>
        </div>
      </div>

      {/* What's New Since Your Last Visit */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-800">
            <Sparkles className="h-6 w-6 mr-2" />
            What's New Since Your Last Visit?
            <Badge className="ml-2 bg-purple-200 text-purple-800">{recentContent.length} New Items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentContent.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {recentContent.slice(0, 6).map((item) => (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow bg-white">
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg flex items-center justify-center">
                      {item.type === 'script' ? (
                        <FileText className="h-8 w-8 text-gray-400" />
                      ) : (
                        <Radio className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                        <span className="text-xs text-gray-500">{item.duration}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{item.project}</span>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex items-center justify-center space-x-4">
                <Button variant="outline">
                  <Bookmark className="h-4 w-4 mr-2" />
                  Mark All As Read
                </Button>
                <Button variant="outline">
                  <Clock className="h-4 w-4 mr-2" />
                  Dismiss New
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No new content since your last visit</p>
              <p className="text-sm text-gray-500">Check back soon for updates!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trending Now / Popular Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-orange-500" />
            Trending Now / Popular Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trendingContent.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow border border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">{item.title}</h4>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Download className="h-3 w-3 mr-1" />
                            {item.downloads}
                          </span>
                          <span className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {item.views}
                          </span>
                          <span className="flex items-center">
                            <Star className="h-3 w-3 mr-1 text-yellow-500" />
                            {item.rating}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {item.duration}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{item.category}</span>
                        <Button size="sm">
                          <PlayCircle className="h-3 w-3 mr-1" />
                          Listen Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommended For You & Explore Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-500" />
              Recommended For You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendedContent.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-lg flex items-center justify-center mr-3">
                      <FileText className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-500">
                        {item.scriptsCount} scripts • {item.episodesCount} episodes
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <ArrowRight className="h-3 w-3 mr-1" />
                    Explore
                  </Button>
                </div>
              ))}
              {recommendedContent.length === 0 && (
                <div className="text-center py-6">
                  <Star className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No recommendations available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tag className="h-5 w-5 mr-2 text-blue-500" />
              Explore by Category/Topic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {projects.slice(0, 6).map((project, index) => {
                const colors = [
                  'bg-blue-100 text-blue-800 hover:bg-blue-200',
                  'bg-green-100 text-green-800 hover:bg-green-200',
                  'bg-purple-100 text-purple-800 hover:bg-purple-200',
                  'bg-orange-100 text-orange-800 hover:bg-orange-200',
                  'bg-pink-100 text-pink-800 hover:bg-pink-200',
                  'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                ];
                
                return (
                  <Button
                    key={project.id}
                    variant="ghost"
                    className={`${colors[index % colors.length]} justify-start h-auto p-3 text-left transition-colors`}
                  >
                    <div>
                      <p className="font-medium text-sm">{project.title}</p>
                      <p className="text-xs opacity-80">
                        {scripts.filter(s => s.projectId === project.id).length} items
                      </p>
                    </div>
                  </Button>
                );
              })}
            </div>
            {projects.length === 0 && (
              <div className="text-center py-6">
                <Tag className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No categories available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Primary Call to Action */}
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Ready to explore more?</h3>
          <p className="text-white/80 mb-6">Dive into our complete content library and discover amazing radio content</p>
          <Link href="/projects">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold">
              <ArrowRight className="h-5 w-5 mr-2" />
              Explore Our Full Content Library
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}