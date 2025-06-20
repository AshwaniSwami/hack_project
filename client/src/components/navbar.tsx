import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, ChevronDown, Radio, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/episodes", label: "Episodes" },
  { href: "/scripts", label: "Scripts" },
  { href: "/radio-stations", label: "Stations" },
  { href: "/users", label: "Users" },
];

export function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-blue-700 to-blue-800 dark:from-slate-800 dark:to-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer hover:opacity-90 transition-opacity">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Radio className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">SMART Radio</h1>
                  <p className="text-xs text-blue-100">Content Hub</p>
                </div>
              </div>
            </Link>
            <nav className="hidden lg:flex space-x-1 ml-8">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "text-blue-100 hover:bg-white/10 hover:text-white transition-all duration-200",
                      location === item.href && "bg-white/20 text-white font-medium shadow-sm"
                    )}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2 text-blue-100 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 text-blue-100 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <Avatar className="h-8 w-8 border-2 border-white/20">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
                      AD
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium">Admin User</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="cursor-pointer">
                  👤 Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  ⚙️ Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-red-600">
                  🚪 Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-2 text-blue-100 hover:text-white hover:bg-white/10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 py-4">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-blue-100 hover:bg-white/10 hover:text-white",
                      location === item.href && "bg-white/20 text-white font-medium"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
