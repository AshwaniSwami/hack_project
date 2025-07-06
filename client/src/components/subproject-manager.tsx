import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FolderTree,
  FolderPlus,
  Folder,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@shared/schema";

interface SubprojectManagerProps {
  parentProjectId?: string;
  onSubprojectSelect?: (project: Project) => void;
}

export function SubprojectManager({ parentProjectId, onSubprojectSelect }: SubprojectManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSubproject, setNewSubproject] = useState({
    name: "",
    description: "",
    projectType: "subproject" as const,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get subprojects
  const { data: subprojects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects/subprojects", parentProjectId],
    queryFn: async () => {
      const url = parentProjectId 
        ? `/api/projects/subprojects?parentProjectId=${parentProjectId}`
        : "/api/projects/subprojects";
      const response = await fetch(url, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch subprojects");
      return response.json();
    },
  });

  // Get project hierarchy if we have a parent
  const { data: hierarchy = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects/hierarchy", parentProjectId],
    queryFn: async () => {
      if (!parentProjectId) return [];
      const response = await fetch(`/api/projects/${parentProjectId}/hierarchy`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch hierarchy");
      return response.json();
    },
    enabled: !!parentProjectId,
  });

  // Create subproject mutation
  const createSubprojectMutation = useMutation({
    mutationFn: async (projectData: typeof newSubproject) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...projectData,
          parentProjectId,
        }),
      });
      if (!response.ok) throw new Error("Failed to create subproject");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/subprojects"] });
      setIsCreateOpen(false);
      setNewSubproject({ name: "", description: "", projectType: "subproject" });
      toast({ title: "Subproject created successfully" });
    },
    onError: () => {
      toast({ 
        title: "Failed to create subproject", 
        variant: "destructive" 
      });
    },
  });

  // Delete subproject mutation
  const deleteSubprojectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete subproject");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/subprojects"] });
      toast({ title: "Subproject deleted successfully" });
    },
    onError: () => {
      toast({ 
        title: "Failed to delete subproject", 
        variant: "destructive" 
      });
    },
  });

  const handleCreateSubproject = () => {
    if (!newSubproject.name.trim()) return;
    createSubprojectMutation.mutate(newSubproject);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            {parentProjectId ? "Subprojects" : "Project Hierarchy"}
          </CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Subproject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Subproject</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Subproject name"
                    value={newSubproject.name}
                    onChange={(e) => setNewSubproject(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Subproject description (optional)"
                    value={newSubproject.description}
                    onChange={(e) => setNewSubproject(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSubproject} disabled={!newSubproject.name.trim()}>
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Project hierarchy breadcrumb */}
        {hierarchy.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              {hierarchy.map((project, index) => (
                <div key={project.id} className="flex items-center gap-2">
                  {index > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                  <span className={index === hierarchy.length - 1 ? "font-medium" : "text-muted-foreground"}>
                    {project.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subprojects list */}
        {subprojects.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No subprojects created yet</p>
            <p className="text-sm">Create subprojects to organize your content better</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {subprojects.map((subproject) => (
              <div
                key={subproject.id}
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Folder className="h-6 w-6 text-blue-500 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{subproject.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {subproject.projectType}
                    </Badge>
                    {subproject.isTemplate && (
                      <Badge variant="outline" className="text-xs">
                        Template
                      </Badge>
                    )}
                  </div>
                  
                  {subproject.description && (
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      {subproject.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Created {formatDate(subproject.createdAt)}</span>
                    {subproject.updatedAt !== subproject.createdAt && (
                      <span>Updated {formatDate(subproject.updatedAt)}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onSubprojectSelect && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSubprojectSelect(subproject)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onSubprojectSelect?.(subproject)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteSubprojectMutation.mutate(subproject.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}