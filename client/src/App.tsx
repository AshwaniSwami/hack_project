import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import Episodes from "@/pages/episodes";
import Scripts from "@/pages/scripts";
import RadioStations from "@/pages/radio-stations";
import Users from "@/pages/users";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {isAuthenticated && <Navbar />}
      <main>
        <Switch>
          {isLoading || !isAuthenticated ? (
            <Route path="/" component={Landing} />
          ) : (
            <>
              <Route path="/" component={Dashboard} />
              <Route path="/projects" component={Projects} />
              <Route path="/episodes" component={Episodes} />
              <Route path="/scripts" component={Scripts} />
              <Route path="/radio-stations" component={RadioStations} />
              {isAdmin && <Route path="/users" component={Users} />}
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
