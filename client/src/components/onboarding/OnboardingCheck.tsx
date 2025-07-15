import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import UserOnboardingForm from "./UserOnboardingForm";

interface OnboardingStatus {
  needsOnboarding: boolean;
}

export default function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: onboardingStatus, isLoading } = useQuery<OnboardingStatus>({
    queryKey: ["/api/onboarding/status"],
    enabled: isAuthenticated && !!user,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (onboardingStatus?.needsOnboarding) {
      setShowOnboarding(true);
    }
  }, [onboardingStatus]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-rose-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking onboarding status...</p>
        </div>
      </div>
    );
  }

  // Show onboarding form if needed
  if (showOnboarding && onboardingStatus?.needsOnboarding) {
    return <UserOnboardingForm />;
  }

  // Show regular app content
  return <>{children}</>;
}