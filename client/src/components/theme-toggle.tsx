import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("light");
    } else {
      // If system theme, switch to light
      setTheme("light");
    }
  };

  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={toggleTheme}
      className="relative"
    >
      <Sun className={cn(
        "h-[1.2rem] w-[1.2rem] transition-all duration-300",
        isDark ? "rotate-90 scale-0" : "rotate-0 scale-100"
      )} />
      <Moon className={cn(
        "absolute h-[1.2rem] w-[1.2rem] transition-all duration-300",
        isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0"
      )} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}