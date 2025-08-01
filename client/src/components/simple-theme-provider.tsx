import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function SimpleThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("smart-radio-theme");
      if (stored === "dark" || stored === "light") {
        return stored;
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    console.log("Toggling theme from", theme, "to", newTheme);
    
    setTheme(newTheme);
    localStorage.setItem("smart-radio-theme", newTheme);
    
    // Immediate DOM update
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(newTheme);
    
    console.log("Theme applied:", {
      theme: newTheme,
      classList: root.classList.toString()
    });
  };

  useEffect(() => {
    console.log("Theme effect triggered:", theme);
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    console.log("DOM updated with theme:", theme, "classList:", root.classList.toString());
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useSimpleTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useSimpleTheme must be used within SimpleThemeProvider");
  }
  return context;
};