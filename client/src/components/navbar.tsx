import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Radio, 
  Menu, 
  X, 
  Home,
  FolderOpen,
  Play,
  FileText,
  RadioTower,
  Users,
  TrendingUp,
  FormInput
} from "lucide-react";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { SimpleThemeToggle } from "@/components/simple-theme-toggle";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();

  const canAccessAdvancedFeatures = user?.role === 'admin' || user?.role === 'editor' || user?.role === 'contributor';



  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/projects", label: "Projects", icon: FolderOpen },
    ...(canAccessAdvancedFeatures ? [{ href: "/episodes", label: "Episodes", icon: Play }] : []),
    ...(canAccessAdvancedFeatures ? [{ href: "/scripts", label: "Scripts", icon: FileText }] : []),
    { href: "/radio-stations", label: "Stations", icon: RadioTower },
    ...(isAdmin ? [{ href: "/users", label: "Users", icon: Users }] : []),
    ...(isAdmin ? [{ href: "/analytics", label: "Analytics", icon: TrendingUp }] : []),
    ...(isAdmin ? [{ href: "/onboarding", label: "Onboarding", icon: FormInput }] : []),
  ];

  return (
    <header className="bg-sky-100/80 dark:bg-gray-800/90 backdrop-blur-md text-slate-800 dark:text-gray-100 shadow-xl sticky top-0 z-50 border-b border-sky-200/30 dark:border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer group min-w-0">
                <div className="relative p-1.5 bg-sky-50 rounded-lg backdrop-blur-sm group-hover:bg-sky-100 transition-all duration-300 shadow-md flex-shrink-0">
                  <Radio className="h-4 w-4 text-sky-600 drop-shadow-sm" />
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-100/30 to-rose-100/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="group-hover:scale-105 transition-transform duration-200 min-w-0">
                  <h1 className="text-sm font-bold bg-gradient-to-r from-sky-600 to-rose-500 bg-clip-text text-transparent whitespace-nowrap">
                    SMART Radio
                  </h1>
                  <p className="text-xs text-sky-700 dark:text-gray-300 font-medium tracking-wide whitespace-nowrap">NGO Content Hub</p>
                </div>
              </div>
            </Link>

            <nav className="hidden lg:flex space-x-2 ml-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "relative flex items-center space-x-2 px-4 py-2 rounded-xl text-slate-700 dark:text-gray-300 hover:text-sky-800 dark:hover:text-sky-200 hover:bg-sky-50 dark:hover:bg-gray-700/50 transition-all duration-300 group",
                        isActive && "bg-gradient-to-r from-sky-100 to-rose-100 dark:from-gray-700 dark:to-gray-600 text-sky-800 dark:text-sky-200 font-semibold shadow-lg backdrop-blur-sm"
                      )}
                    >
                      <Icon className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isActive ? "scale-110" : "group-hover:scale-105"
                      )} />
                      <span className="text-sm">{item.label}</span>
                      {isActive && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gradient-to-r from-sky-600 to-rose-500 rounded-full"></div>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <SimpleThemeToggle />

            {/* Notification Bell - Only for Admins */}
            <NotificationBell userRole={user?.role || ''} />

            <ProfileDropdown />

            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-3 text-white/90 hover:text-white hover:bg-white/15 rounded-xl transition-all duration-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? 
                <X className="h-5 w-5 rotate-90 transition-transform duration-300" /> : 
                <Menu className="h-5 w-5 hover:scale-105 transition-transform duration-200" />
              }
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 py-6 backdrop-blur-md">


            <nav className="space-y-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start space-x-3 px-4 py-3 text-white/90 hover:bg-white/15 hover:text-white rounded-xl transition-all duration-300",
                        isActive && "bg-white/20 text-white font-semibold shadow-lg"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
      

    </header>
  );
}