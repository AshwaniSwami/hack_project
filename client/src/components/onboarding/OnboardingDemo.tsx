import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import UserOnboardingForm from "./UserOnboardingForm";
import { useState } from "react";
import { Play, Eye, Settings } from "lucide-react";

export default function OnboardingDemo() {
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const handleDemoStart = () => {
    setShowForm(true);
    toast({
      title: "Demo Mode Active",
      description: "This is a demonstration of the onboarding form",
    });
  };

  if (showForm) {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(false)}
            className="bg-white/80 backdrop-blur-sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            Exit Demo
          </Button>
        </div>
        <UserOnboardingForm />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Onboarding Form Demo</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Preview how the onboarding form will appear to new users
        </p>
        <Button onClick={handleDemoStart} className="bg-gradient-to-r from-sky-500 to-rose-500">
          <Play className="h-4 w-4 mr-2" />
          Start Demo
        </Button>
      </div>
      
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Settings className="h-5 w-5" />
            Demo Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">✓</Badge>
              <span className="text-sm">Multi-step form navigation</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">✓</Badge>
              <span className="text-sm">Real-time validation</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">✓</Badge>
              <span className="text-sm">Location collection</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">✓</Badge>
              <span className="text-sm">Custom question types</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">✓</Badge>
              <span className="text-sm">Progress tracking</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}