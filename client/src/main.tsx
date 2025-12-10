// Main application entry point
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./scripts/compareCSVs";
import "./scripts/analyzeCSVs";

createRoot(document.getElementById("root")!).render(<App />);
