import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScriptEditor } from "@/components/script-editor";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText,
  Search,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScriptFileUpload } from "@/components/script-file-upload";
import { FileList } from "@/components/file-list";
import type { Script, User, Project } from "@shared/schema";

export default function Scripts() {
  const [isScriptEditorOpen, setIsScriptEditorOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scripts = [], isLoading: scriptsLoading } = useQuery<Script[]>({
    queryKey: ["/api/scripts"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/scripts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      toast({
        title: "Success",
        description: "Script deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete script",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (script: Script) => {
    setEditingScript(script);
    setIsScriptEditorOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this script?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseEditor = () => {
    setIsScriptEditorOpen(false);
    setEditingScript(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Under Review":
        return "bg-yellow-100 text-yellow-800";
      case "Draft":
        return "bg-blue-100 text-blue-800";
      case "Needs Revision":
        return "bg-red-100 text-red-800";
      case "Recorded":
        return "bg-purple-100 text-purple-800";
      case "Archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };

  const getAuthorName = (authorId: string) => {
    const author = users.find(u => u.id === authorId);
    return author?.username || "Unknown Author";
  };

  const filteredScripts = scripts.filter((script) => {
    const matchesSearch = script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || script.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    "Draft",
    "Submitted", 
    "Under Review",
    "Approved",
    "Needs Revision", 
    "Recorded",
    "Archived",
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Scripts</h2>
          <Button onClick={() => setIsScriptEditorOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Script
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search scripts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* File Upload Section */}
        {/* Enhanced Script File Upload */}
        <ScriptFileUpload />
        
        {/* Project-Organized File Lists */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Script Files by Project</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {projects.map((project) => (
                <div key={project.id} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">{project.name}</h4>
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium mb-2">Project Files</h5>
                      <FileList 
                        entityType="projects" 
                        entityId={project.id}
                        title=""
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scripts List */}
      {scriptsLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredScripts.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== "all" ? "No scripts found" : "No scripts yet"}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== "all" 
              ? "Try adjusting your search terms or filters" 
              : "Get started by creating your first script"
            }
          </p>
          {!searchTerm && statusFilter === "all" && (
            <Button onClick={() => setIsScriptEditorOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Script
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredScripts.map((script) => (
            <Card key={script.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {script.title}
                      </h3>
                      <Badge className={getStatusColor(script.status)}>
                        {script.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <p>Episode: {getEpisodeTitle(script.episodeId)}</p>
                      <p>Author: {getAuthorName(script.authorId)}</p>
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {script.content.substring(0, 200)}...
                    </p>
                    
                    {script.reviewComments && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">Review Comments:</p>
                        <p className="text-sm text-gray-600">{script.reviewComments}</p>
                      </div>
                    )}
                    

                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Created: {new Date(script.createdAt!).toLocaleDateString()}</span>
                      <span>Updated: {new Date(script.updatedAt!).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEdit(script)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(script.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ScriptEditor
        isOpen={isScriptEditorOpen}
        onClose={handleCloseEditor}
        script={editingScript || undefined}
      />
    </div>
  );
}
