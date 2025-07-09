import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Download, 
  Eye, 
  Radio, 
  Podcast,
  BookOpen,
  CheckCircle,
  ArrowUp
} from "lucide-react";

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
  currentProgress: number;
  totalContent: number;
}

export function ProgressModal({ isOpen, onClose, currentLevel, currentProgress, totalContent }: ProgressModalProps) {
  const nextLevelRequirement = 5 - (totalContent % 5);
  const progressPercentage = (totalContent % 5) * 20;
  
  const levelBenefits = [
    { level: 2, benefit: "Access to premium content previews" },
    { level: 3, benefit: "Early access to new radio shows" },
    { level: 5, benefit: "Exclusive member-only content" },
    { level: 7, benefit: "Priority support and feedback" },
    { level: 10, benefit: "VIP member status and special privileges" }
  ];

  const nextBenefit = levelBenefits.find(b => b.level > currentLevel);

  const actions = [
    {
      icon: Radio,
      title: "Explore Projects",
      description: "Browse and engage with radio projects",
      points: "+1 per project explored",
      color: "text-blue-600"
    },
    {
      icon: Podcast,
      title: "Listen to Episodes", 
      description: "Listen to podcast episodes and shows",
      points: "+1 per episode completed",
      color: "text-green-600"
    },
    {
      icon: BookOpen,
      title: "Read Scripts",
      description: "Read approved scripts and content",
      points: "+1 per script viewed",
      color: "text-purple-600"
    },
    {
      icon: Download,
      title: "Download Content",
      description: "Download audio files and resources",
      points: "+1 per download",
      color: "text-orange-600"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-indigo-600" />
            <span>Your Progress Journey</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Level Status */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Badge className="bg-indigo-600 text-white">
                  Level {currentLevel}
                </Badge>
                <span className="text-sm text-gray-600">Member</span>
              </div>
              {nextBenefit && (
                <div className="flex items-center text-sm text-gray-500">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  Level {nextBenefit.level}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-3" />
              <p className="text-sm text-gray-600 text-center">
                {nextLevelRequirement} more content pieces to reach level {currentLevel + 1}
              </p>
            </div>
          </div>

          {/* Next Level Benefit */}
          {nextBenefit && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Next Unlock</span>
              </div>
              <p className="text-sm text-yellow-700">{nextBenefit.benefit}</p>
            </div>
          )}

          {/* How to Level Up */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">How to Level Up</h4>
            <div className="space-y-3">
              {actions.map((action, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <action.icon className={`h-5 w-5 mt-0.5 ${action.color}`} />
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 text-sm">{action.title}</h5>
                    <p className="text-xs text-gray-600 mb-1">{action.description}</p>
                    <Badge variant="outline" className="text-xs">
                      {action.points}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Close Button */}
          <Button onClick={onClose} className="w-full">
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}