import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initialTheme = savedTheme || systemTheme;
    
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
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