import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  FolderOpen, 
  FileText, 
  ChevronDown, 
  Eye, 
  Download, 
  Search,
  Languages,
  Globe
} from "lucide-react";
import { LanguageBadge } from "@/components/language-selector";
import { getLanguageName, getLanguageFlag } from "@shared/languages";
import type { Project, Script } from "@shared/schema";

interface ProjectScriptOrganizerProps {
  onViewScript: (script: Script) => void;
}

const downloadScript = (script: Script) => {
  const content = `# ${script.title}

**Language:** ${script.language}
**Status:** ${script.status}
**Created:** ${new Date(script.createdAt).toLocaleDateString()}

${script.description ? `**Description:** ${script.description}\n\n` : ''}${script.content || ''}`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${script.title}_${script.language}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export function ProjectScriptOrganizer({ onViewScript }: ProjectScriptOrganizerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("all");

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: scripts = [] } = useQuery<Script[]>({
    queryKey: ["/api/scripts"],
  });

  // Group scripts by project and then by language groups
  const organizedScripts = projects.map(project => {
    const projectScripts = scripts.filter(script => script.projectId === project.id);
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const filteredScripts = projectScripts.filter(script => 
        script.title.toLowerCase().includes(searchLower) ||
        script.description?.toLowerCase().includes(searchLower) ||
        script.language?.toLowerCase().includes(searchLower)
      );
      
      if (filteredScripts.length === 0) return null;
    }

    // Group scripts by language groups or individual scripts
    const scriptGroups = new Map<string, Script[]>();
    
    projectScripts.forEach(script => {
      const groupKey = script.languageGroup || script.id;
      if (!scriptGroups.has(groupKey)) {
        scriptGroups.set(groupKey, []);
      }
      scriptGroups.get(groupKey)!.push(script);
    });

    return {
      project,
      scriptGroups: Array.from(scriptGroups.entries()).map(([groupKey, groupScripts]) => ({
        groupKey,
        scripts: groupScripts.sort((a, b) => a.title.localeCompare(b.title)),
        primaryScript: groupScripts.find(s => !s.originalScriptId) || groupScripts[0]
      }))
    };
  }).filter(Boolean);

  const filteredOrganizedScripts = organizedScripts.filter(item => {
    if (selectedProject === "all") return true;
    return item?.project.id === selectedProject;
  });

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search scripts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Globe className="h-4 w-4" />
          <span>Scripts organized by project & language</span>
        </div>
      </div>

      {/* Project Groups */}
      <div className="space-y-6">
        {filteredOrganizedScripts.map(item => {
          if (!item) return null;
          
          const { project, scriptGroups } = item;
          
          return (
            <Card key={project.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                        {project.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {scriptGroups.length} script{scriptGroups.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                    {scriptGroups.reduce((acc, group) => acc + group.scripts.length, 0)} total versions
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {scriptGroups.map(group => {
                  const { primaryScript, scripts } = group;
                  const hasMultipleLanguages = scripts.length > 1;
                  
                  return (
                    <div key={group.groupKey} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200/50 dark:border-gray-600/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {primaryScript.title}
                            </h4>
                            {primaryScript.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {primaryScript.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {hasMultipleLanguages ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                  <Languages className="h-4 w-4" />
                                  <span>{scripts.length} language{scripts.length !== 1 ? 's' : ''}</span>
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                {scripts.map(script => (
                                  <DropdownMenuItem 
                                    key={script.id} 
                                    onClick={() => onViewScript(script)}
                                    className="flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span>{getLanguageFlag(script.language || 'en')}</span>
                                      <span>{getLanguageName(script.language || 'en')}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6 w-6 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          downloadScript(script);
                                        }}
                                      >
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <div className="flex items-center gap-2">
                              <LanguageBadge language={primaryScript.language || 'en'} />
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => onViewScript(primaryScript)}
                                  className="gap-1"
                                >
                                  <Eye className="h-4 w-4" />
                                  View
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => downloadScript(primaryScript)}
                                  className="gap-1"
                                >
                                  <Download className="h-4 w-4" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
        
        {filteredOrganizedScripts.length === 0 && (
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No scripts found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'Try adjusting your search criteria' : 'Start by creating your first script'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}