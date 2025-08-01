import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSimpleTheme } from "./simple-theme-provider";

export function SimpleThemeToggle() {
  const { theme, toggleTheme } = useSimpleTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="relative p-3 text-foreground hover:text-foreground hover:bg-accent transition-all duration-300 rounded-xl group"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <div className="group-hover:scale-105 transition-transform duration-200">
        {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}