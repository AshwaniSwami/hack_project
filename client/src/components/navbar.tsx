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
  TrendingUp
} from "lucide-react";
import { ProfileDropdown } from "@/components/profile-dropdown";
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
  ];

  return (
    <header className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 text-white shadow-2xl sticky top-0 z-50 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-6">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative p-3 bg-white/15 rounded-2xl backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300 shadow-lg">
                  <Radio className="h-7 w-7 text-white drop-shadow-sm" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="group-hover:scale-105 transition-transform duration-200">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    SMART Radio
                  </h1>
                  <p className="text-xs text-white/80 font-medium tracking-wide">Content Hub</p>
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
                        "relative flex items-center space-x-2 px-4 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/15 transition-all duration-300 group",
                        isActive && "bg-white/20 text-white font-semibold shadow-lg backdrop-blur-sm"
                      )}
                    >
                      <Icon className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isActive ? "scale-110" : "group-hover:scale-105"
                      )} />
                      <span className="text-sm">{item.label}</span>
                      {isActive && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="relative p-3 text-white/90 hover:text-white hover:bg-white/15 transition-all duration-300 rounded-xl group"
            >
              <Bell className="h-5 w-5 group-hover:scale-105 transition-transform duration-200" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-500 hover:bg-red-500 text-xs flex items-center justify-center border-2 border-white/20">
                3
              </Badge>
            </Button>

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