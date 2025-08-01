// Simple theme debug script
console.log("=== THEME DEBUG ===");
console.log("HTML classList:", document.documentElement.classList.toString());
console.log("LocalStorage theme:", localStorage.getItem("smart-radio-theme"));
console.log("System prefers dark:", window.matchMedia("(prefers-color-scheme: dark)").matches);

// Force toggle
function forceToggle() {
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  console.log("Current state is dark:", isDark);
  
  root.classList.remove("light", "dark");
  const newTheme = isDark ? "light" : "dark";
  root.classList.add(newTheme);
  localStorage.setItem("smart-radio-theme", newTheme);
  
  console.log("New state:", newTheme);
  console.log("HTML classList after:", document.documentElement.classList.toString());
}

window.forceToggle = forceToggle;
console.log("Run 'forceToggle()' to test manual theme switching");