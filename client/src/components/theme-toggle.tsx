
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, actualTheme, setTheme } = useTheme();

  const handleToggle = () => {
    console.log("Theme toggle clicked. Current theme:", theme, "Actual theme:", actualTheme);
    
    // Force toggle between light and dark modes
    const newTheme = actualTheme === "light" ? "dark" : "light";
    console.log("Switching to theme:", newTheme);
    
    // Call setTheme and force re-render
    setTheme(newTheme);
    
    // Also force an immediate DOM update
    setTimeout(() => {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(newTheme);
      console.log("Forced DOM update:", root.classList.toString());
    }, 0);
  };

  const getIcon = () => {
    // Show sun icon when in dark mode (to indicate switching to light)
    // Show moon icon when in light mode (to indicate switching to dark)
    return actualTheme === "dark" ? 
      <Sun className="h-5 w-5" /> : 
      <Moon className="h-5 w-5" />;
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className="relative p-3 text-foreground hover:text-foreground hover:bg-accent transition-all duration-300 rounded-xl group"
      title={`Switch to ${actualTheme === "light" ? "dark" : "light"} mode`}
    >
      <div className="group-hover:scale-105 transition-transform duration-200">
        {getIcon()}
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
