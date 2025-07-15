import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import FormBuilder from "@/components/onboarding/FormBuilder";
import OnboardingAnalytics from "@/components/onboarding/OnboardingAnalytics";
import OnboardingDemo from "@/components/onboarding/OnboardingDemo";
import { Settings, BarChart3, Users, FormInput, Play } from "lucide-react";

export default function OnboardingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("builder");

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-rose-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <Settings className="h-12 w-12 text-gray-400 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Only administrators can access the onboarding management system.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-rose-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-500 to-rose-500 bg-clip-text text-transparent mb-2">
            Onboarding Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage user onboarding forms and analyze responses
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
            <TabsTrigger 
              value="builder" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-rose-500 data-[state=active]:text-white"
            >
              <FormInput className="h-4 w-4" />
              Form Builder
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-rose-500 data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="demo" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-rose-500 data-[state=active]:text-white"
            >
              <Play className="h-4 w-4" />
              Demo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-6">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50">
              <CardContent className="p-6">
                <FormBuilder />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50">
              <CardContent className="p-6">
                <OnboardingAnalytics />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="demo" className="space-y-6">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50">
              <CardContent className="p-6">
                <OnboardingDemo />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}