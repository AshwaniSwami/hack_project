
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  const currentIcon = () => {
    if (theme === "system") {
      // Show system icon based on current system preference
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      return systemTheme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />;
    }
    return theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />;
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="relative p-3 text-foreground hover:text-foreground hover:bg-accent transition-all duration-300 rounded-xl group"
      title={`Current theme: ${theme}`}
    >
      <div className="group-hover:scale-105 transition-transform duration-200">
        {currentIcon()}
      </div>
    </Button>
  );
}
