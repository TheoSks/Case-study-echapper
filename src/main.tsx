import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/global.css";

// Pas de <StrictMode> : en développement, il exécute deux fois les effets
// et dupliquerait les événements analytics du tunnel.
createRoot(document.getElementById("root")!).render(<App />);
