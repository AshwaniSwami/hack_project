import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FolderOpen, 
  Eye,
  Edit, 
  Trash2, 
  Clock,
  Mic,
  FileText
} from "lucide-react";
import type { Project } from "@shared/schema";
import { useProjectStats } from "@/hooks/useProjectStats";

interface ProjectCardProps {
  project: Project;
  theme?: {
    id: string;
    name: string;
    colorHex: string;
  };
  user?: {
    role: string;
  };
  onView: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

export function ProjectCard({ project, theme, user, onView, onEdit, onDelete }: ProjectCardProps) {
  const { episodeCount, scriptCount } = useProjectStats(project.id);

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-lg hover:scale-[1.02] hover:shadow-blue-500/10">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg blur opacity-50"></div>
              <div className="relative p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                <FolderOpen className="h-5 w-5 text-white" />
              </div>
            </div>
            {theme && (
              <Badge 
                className="text-xs px-2 py-1"
                style={{ 
                  backgroundColor: theme.colorHex + '20',
                  color: theme.colorHex,
                  borderColor: theme.colorHex + '40'
                }}
              >
                {theme.name}
              </Badge>
            )}
          </div>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onView(project)}
              className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-emerald-50 hover:scale-110 h-7 w-7 p-0"
            >
              <Eye className="h-4 w-4 text-emerald-600" />
            </Button>
            {(user?.role === 'admin' || user?.role === 'editor') && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onEdit(project)}
                  className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-blue-50 hover:scale-110 h-7 w-7 p-0"
                >
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onDelete(project.id)}
                  className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-50 hover:scale-110 h-7 w-7 p-0"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-800 line-clamp-2 group-hover:text-blue-700 transition-colors duration-300">
            {project.name}
          </h3>
          
          {project.description && (
            <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-600 mb-1">Description</p>
              <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                {project.description}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="text-center p-2 bg-blue-50/80 rounded-lg border border-blue-100">
              <Mic className="h-4 w-4 mx-auto text-blue-600 mb-1" />
              <div className="text-base font-bold text-blue-700">{episodeCount}</div>
              <div className="text-xs text-blue-600">Episodes</div>
            </div>
            <div className="text-center p-2 bg-emerald-50/80 rounded-lg border border-emerald-100">
              <FileText className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
              <div className="text-base font-bold text-emerald-700">{scriptCount}</div>
              <div className="text-xs text-emerald-600">Scripts</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">
                {new Date(project.createdAt!).toLocaleDateString()}
              </span>
            </div>
            <Button 
              onClick={() => onView(project)}
              size="sm"
              variant="outline"
              className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50 hover:border-blue-300 text-xs h-7 px-2"
            >
              Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}