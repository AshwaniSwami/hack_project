
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="relative p-3 text-gray-700 dark:text-white/90 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/20 transition-all duration-300 rounded-xl group"
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5 group-hover:scale-105 transition-transform duration-200" />
      ) : (
        <Sun className="h-5 w-5 group-hover:scale-105 transition-transform duration-200" />
      )}
    </Button>
  );
}
