import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, refetch } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache the data
  });

  const refreshAuth = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    refetch();
  };

  const logout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Clear all cached data and invalidate queries
        queryClient.clear();
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        // Also remove any stored data
        queryClient.setQueryData(["/api/auth/user"], null);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, clear local state
      queryClient.clear();
      queryClient.setQueryData(["/api/auth/user"], null);
      throw error;
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    refreshAuth,
    logout,
  };
}