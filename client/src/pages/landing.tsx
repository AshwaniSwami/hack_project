import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Radio, Users, FileText, Mic } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Radio className="h-16 w-16 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            SMART Radio Content Hub
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            A comprehensive content management system designed for radio broadcasting. 
            Manage projects, episodes, scripts, and radio station access from one centralized platform.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3"
          >
            Sign In to Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                <CardTitle>Content Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Organize radio projects, episodes, and scripts with powerful editing tools 
                and workflow management features.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Mic className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <CardTitle>File Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload and manage audio, video, documents, and images with 
                entity-based organization and secure storage.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                <CardTitle>Station Access</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Manage radio station access to specific projects with granular 
                permissions and contact management.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">
            Built for Radio Professionals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                Projects
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                Organize content by radio shows and series
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                Episodes
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                Track individual episodes with metadata
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                Scripts
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                Rich text editing with workflow status
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-600 dark:text-pink-400 mb-2">
                Stations
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                Manage radio station partnerships
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}