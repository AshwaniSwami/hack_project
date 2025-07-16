import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { FileList } from "@/components/file-list";
import { EnhancedFileManager } from "@/components/enhanced-file-manager";
import { LanguageBadge } from "@/components/language-selector";
import { 
  Plus, 
  FileText, 
  Users, 
  Calendar,
  FolderOpen,
  Languages,
  ChevronDown,
  Eye,
  Download,
  Globe
} from "lucide-react";
import { getLanguageName, getLanguageFlag } from "@shared/languages";
import type { Project, Episode, Script } from "@shared/schema";

interface ProjectDetailViewProps {
  project: Project;
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

export function ProjectDetailView({ project }: ProjectDetailViewProps) {
  const queryClient = useQueryClient();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");

  const { data: episodes = [] } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
    select: (data) => data.filter(episode => episode.projectId === project.id)
  });

  const { data: scripts = [] } = useQuery<Script[]>({
    queryKey: ["/api/scripts"],
    select: (data) => data.filter(script => script.projectId === project.id)
  });

  // Group scripts by language groups
  const scriptGroups = scripts.reduce((groups, script) => {
    const groupKey = script.languageGroup || script.id;
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(script);
    return groups;
  }, {} as Record<string, Script[]>);

  // Get available languages for filtering
  const availableLanguages = Array.from(new Set(scripts.map(script => script.language).filter(Boolean)));

  // Filter script groups by selected language
  const filteredScriptGroups = Object.entries(scriptGroups).filter(([_, groupScripts]) => {
    if (selectedLanguage === "all") return true;
    return groupScripts.some(script => script.language === selectedLanguage);
  });

  // Get project-level files to count episodes and scripts
  const { data: projectEpisodeFilesResponse = { files: [] } } = useQuery({
    queryKey: ['/api/files', 'episodes', project.id],
    queryFn: async () => {
      const response = await fetch(`/api/files?entityType=episodes&entityId=${project.id}`);
      if (!response.ok) return { files: [] };
      const data = await response.json();
      return data.files ? data : { files: data };
    }
  });

  const { data: projectScriptFilesResponse = { files: [] } } = useQuery({
    queryKey: ['/api/files', 'scripts', project.id],
    queryFn: async () => {
      const response = await fetch(`/api/files?entityType=scripts&entityId=${project.id}`);
      if (!response.ok) return { files: [] };
      const data = await response.json();
      return data.files ? data : { files: data };
    }
  });

  const projectEpisodeFiles = projectEpisodeFilesResponse?.files || [];
  const projectScriptFiles = projectScriptFilesResponse?.files || [];

  return (
    <div className="space-y-6">
      {/* Modern Project Header */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FolderOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
              <div className="flex items-center gap-4 mt-1">
                <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/80">
                  {episodes.length + projectEpisodeFiles.length} episodes
                </Badge>
                <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/80">
                  {scripts.length + projectScriptFiles.length} scripts
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        {project.description && (
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">About this project</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">{project.description}</p>
          </div>
        )}
      </div>

      <Tabs defaultValue="episodes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="episodes">Episodes</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
        </TabsList>



        <TabsContent value="episodes" className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Episodes</h3>
          </div>
          
          <div className="grid gap-6">
            {episodes.map((episode) => (
              <div key={episode.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{episode.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          Episode #{episode.episodeNumber}
                        </Badge>
                        {episode.isPremium && (
                          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            Premium
                          </Badge>
                        )}
                      </div>
                      
                      {episode.description && (
                        <div className="mb-3 p-3 bg-blue-50/80 rounded-md border border-blue-200">
                          <p className="text-xs font-medium text-blue-600 mb-1">Episode Description</p>
                          <p className="text-sm text-blue-700 leading-relaxed">{episode.description}</p>
                        </div>
                      )}
                      
                      {episode.broadcastDate && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          Broadcast: {new Date(episode.broadcastDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FileList 
                        entityType="episodes" 
                        entityId={episode.id}
                        title={`Episode ${episode.episodeNumber} Files`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Show project-level episode files only if there are any */}
            {projectEpisodeFiles.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Project Episode Files</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Audio/video files uploaded to this project</p>
                  </div>
                </div>
                <FileList 
                  entityType="episodes" 
                  entityId={project.id}
                  title=""
                />
              </div>
            )}
            
            {episodes.length === 0 && projectEpisodeFiles.length === 0 && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full w-fit mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No episodes yet</h3>
                <p className="text-gray-600 dark:text-gray-400">Episodes can be created from the Episodes page</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="scripts" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Scripts</h3>
            </div>
            
            {/* Language Filter */}
            {availableLanguages.length > 1 && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    {availableLanguages.map(language => (
                      <SelectItem key={language} value={language}>
                        <div className="flex items-center gap-2">
                          <span>{getLanguageFlag(language)}</span>
                          <span>{getLanguageName(language)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="grid gap-6">
            {filteredScriptGroups.map(([groupKey, groupScripts]) => {
              const primaryScript = groupScripts.find(s => !s.originalScriptId) || groupScripts[0];
              const hasMultipleLanguages = groupScripts.length > 1;
              
              // Get status color
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'Draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
                  case 'Under Review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
                  case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
                  case 'Published': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
                  default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
                }
              };

              return (
                <div key={groupKey} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{primaryScript.title}</h4>
                          <Badge variant="outline" className={`text-xs ${getStatusColor(primaryScript.status)}`}>
                            {primaryScript.status}
                          </Badge>
                          {hasMultipleLanguages && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              {groupScripts.length} languages
                            </Badge>
                          )}
                        </div>
                        
                        {primaryScript.description && (
                          <div className="mb-3 p-3 bg-emerald-50/80 rounded-md border border-emerald-200">
                            <p className="text-xs font-medium text-emerald-600 mb-1">Description</p>
                            <p className="text-sm text-emerald-700 leading-relaxed">{primaryScript.description}</p>
                          </div>
                        )}
                        
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          Updated: {primaryScript.updatedAt ? new Date(primaryScript.updatedAt).toLocaleDateString() : 'No date'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {hasMultipleLanguages ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-2">
                                <Languages className="h-4 w-4" />
                                <span>View Languages</span>
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64">
                              {groupScripts.map(script => (
                                <DropdownMenuItem key={script.id} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span>{getLanguageFlag(script.language || 'en')}</span>
                                    <span>{getLanguageName(script.language || 'en')}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Handle view script
                                      }}
                                    >
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
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Show project-level script files only if there are any */}
            {projectScriptFiles.length > 0 && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl p-6 border border-emerald-200/50 dark:border-emerald-800/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <FolderOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Project Script Files</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Document files uploaded to this project</p>
                  </div>
                </div>
                <FileList 
                  entityType="scripts" 
                  entityId={project.id}
                  title=""
                />
              </div>
            )}
            
            {filteredScriptGroups.length === 0 && projectScriptFiles.length === 0 && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full w-fit mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {selectedLanguage === "all" ? "No scripts yet" : `No scripts in ${getLanguageName(selectedLanguage)}`}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedLanguage === "all" ? "Scripts can be created from the Scripts page" : "Try selecting a different language or create a new script"}
                </p>
              </div>
            )}
          </div>
        </TabsContent>


      </Tabs>
    </div>
  );
}