import { createRoot } from "react-dom/client";
import { App } from "./App";
import { captureCampaign } from "./analytics/track";
import "./styles/global.css";

// Pas de <StrictMode> : en développement, il exécute deux fois les effets
// et dupliquerait les événements analytics du tunnel.
captureCampaign();
createRoot(document.getElementById("root")!).render(<App />);
