import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { SimpleThemeProvider } from "./components/simple-theme-provider";

createRoot(document.getElementById("root")!).render(
  <SimpleThemeProvider>
    <App />
  </SimpleThemeProvider>
);
