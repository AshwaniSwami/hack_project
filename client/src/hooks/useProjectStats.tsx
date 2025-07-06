import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Project, Episode, Script } from "@shared/schema";

interface ProjectStatsHook {
  episodeCount: number;
  scriptCount: number;
  invalidateStats: () => void;
}

export function useProjectStats(projectId: string): ProjectStatsHook {
  const queryClient = useQueryClient();

  const { data: episodes = [] } = useQuery<Episode[]>({
    queryKey: ["/api/episodes"],
    select: (data) => data.filter(episode => episode.projectId === projectId),
    staleTime: 30000, // 30 seconds
  });

  const { data: scripts = [] } = useQuery<Script[]>({
    queryKey: ["/api/scripts"],
    select: (data) => data.filter(script => script.projectId === projectId),
    staleTime: 30000, // 30 seconds
  });

  const { data: projectEpisodeFiles = { files: [] } } = useQuery({
    queryKey: ['/api/files', 'episodes', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/files?entityType=episodes&entityId=${projectId}`);
      if (!response.ok) return { files: [] };
      const data = await response.json();
      return data.files ? data : { files: data };
    },
    staleTime: 30000, // 30 seconds
  });

  const { data: projectScriptFiles = { files: [] } } = useQuery({
    queryKey: ['/api/files', 'scripts', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/files?entityType=scripts&entityId=${projectId}`);
      if (!response.ok) return { files: [] };
      const data = await response.json();
      return data.files ? data : { files: data };
    },
    staleTime: 30000, // 30 seconds
  });

  const invalidateStats = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
    queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
    queryClient.invalidateQueries({ queryKey: ['/api/files', 'episodes', projectId] });
    queryClient.invalidateQueries({ queryKey: ['/api/files', 'scripts', projectId] });
    queryClient.invalidateQueries({ queryKey: ['/api/files'] });
  };

  const episodeFiles = projectEpisodeFiles?.files || [];
  const scriptFiles = projectScriptFiles?.files || [];

  return {
    episodeCount: episodes.length + episodeFiles.length,
    scriptCount: scripts.length + scriptFiles.length,
    invalidateStats,
  };
}