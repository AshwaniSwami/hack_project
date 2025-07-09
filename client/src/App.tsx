import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/navbar";
import { FloatingActionButton } from "@/components/floating-action-button";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import Episodes from "@/pages/episodes";
import Scripts from "@/pages/scripts";
import RadioStations from "@/pages/radio-stations";
import Users from "@/pages/users";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, isAdmin, user } = useAuth();
  const canAccessAdvancedFeatures = user?.role === 'admin' || user?.role === 'editor' || user?.role === 'contributor';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {isAuthenticated && <Navbar />}
      {isAuthenticated && <FloatingActionButton />}
      <main>
        <Switch>
          {isLoading ? (
            <Route path="*">
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
              </div>
            </Route>
          ) : !isAuthenticated ? (
            <>
              <Route path="/dashboard" component={AuthPage} />
              <Route path="/projects" component={AuthPage} />
              <Route path="/episodes" component={AuthPage} />
              <Route path="/scripts" component={AuthPage} />
              <Route path="/radio-stations" component={AuthPage} />
              <Route path="/users" component={AuthPage} />
              <Route path="/analytics" component={AuthPage} />
              <Route path="/" component={AuthPage} />
            </>
          ) : (
            <>
              <Route path="/" component={Dashboard} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/projects" component={Projects} />
              <Route path="/radio-stations" component={RadioStations} />
              {canAccessAdvancedFeatures && <Route path="/episodes" component={Episodes} />}
              {canAccessAdvancedFeatures && <Route path="/scripts" component={Scripts} />}
              {isAdmin && <Route path="/users" component={Users} />}
              {isAdmin && <Route path="/analytics" component={AnalyticsPage} />}
            </>
          )}
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
