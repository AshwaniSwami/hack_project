import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Hook for real-time analytics with auto-refresh
export function useRealTimeAnalytics(timeframe: string, refreshInterval: number = 30000) {
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Auto-refresh function
  const refreshAnalytics = useCallback(() => {
    // Invalidate all analytics queries to force refresh
    queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
    setLastUpdate(Date.now());
  }, [queryClient]);

  // Set up automatic refresh interval
  useEffect(() => {
    const interval = setInterval(refreshAnalytics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshAnalytics, refreshInterval]);

  // Manual refresh function for UI buttons
  const manualRefresh = useCallback(() => {
    refreshAnalytics();
  }, [refreshAnalytics]);

  return {
    lastUpdate,
    refreshAnalytics: manualRefresh,
    isAutoRefreshing: true
  };
}

// Hook for optimized analytics queries with better error handling
export function useAnalyticsQuery<T>(
  endpoint: string, 
  params: Record<string, string> = {},
  options: { enabled?: boolean; refetchInterval?: number } = {}
) {
  const queryParams = new URLSearchParams(params).toString();
  const url = queryParams ? `${endpoint}?${queryParams}` : endpoint;
  
  return useQuery<T>({
    queryKey: [endpoint, params],
    queryFn: async () => {
      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Analytics request failed: ${error}`);
      }
      return response.json();
    },
    staleTime: 30000, // Consider data stale after 30 seconds
    refetchInterval: options.refetchInterval || 60000, // Auto-refetch every minute
    refetchIntervalInBackground: true,
    enabled: options.enabled !== false,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes('401') || error.message.includes('403')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Custom hooks for the different analytics sections
export const useProjectsAnalytics = () => {
  return useAnalyticsQuery<any[]>('/api/analytics/projects', {}, { refetchInterval: 30000 });
};

export const useEpisodesAnalytics = () => {
  return useAnalyticsQuery<{ episodes: any[], episodeDownloadsByProject: any[] }>('/api/analytics/episodes', {}, { refetchInterval: 30000 });
};

export const useScriptsAnalytics = () => {
  return useAnalyticsQuery<{ scripts: any[], scriptDownloadsByProject: any[] }>('/api/analytics/scripts', {}, { refetchInterval: 30000 });
};

export const useUsersAnalytics = () => {
  return useAnalyticsQuery<{ users: any[] }>('/api/analytics/users', {}, { refetchInterval: 30000 });
};

export const useFilesAnalytics = () => {
  return useAnalyticsQuery<any[]>('/api/analytics/files', {}, { refetchInterval: 30000 });
};

export const useHackathonsAnalytics = () => {
  return useAnalyticsQuery<any[]>('/api/analytics/projects', {}, { refetchInterval: 30000 });
};

export const useTeamsAnalytics = () => {
  return useAnalyticsQuery<{ episodes: any[], episodeDownloadsByProject: any[] }>('/api/analytics/episodes', {}, { refetchInterval: 30000 });
};

export const useSubmissionsAnalytics = () => {
  return useAnalyticsQuery<{ scripts: any[], scriptDownloadsByProject: any[] }>('/api/analytics/scripts', {}, { refetchInterval: 30000 });
};