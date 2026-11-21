// Animation d'ouverture : l'arche et le chemin se dessinent au trait, le soleil apparaît, le nom arrive,
// puis l'écran s'efface. SVG + CSS, sans dépendance. Conçue dans Rive (rive/intro/scene.rml), même chronologie :
// le lecteur Rive n'est pas utilisé car l'offre gratuite ajoute un écran de démarrage « Rive » avant l'animation.
// Une fois par session ; passée au clic ou au clavier ; jamais si l'utilisateur réduit les animations.
import { useEffect, useState } from "react";

const SEEN_KEY = "echappee:intro:seen";
const DURATION_MS = 2400;
const FADE_MS = 450;

function shouldPlay(): boolean {
  if (import.meta.env.MODE === "test") return false;
  try {
    if (sessionStorage.getItem(SEEN_KEY)) return false;
  } catch {
    // stockage indisponible : on joue quand même
  }
  return !(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
}

export function IntroOverlay() {
  const [phase, setPhase] = useState<"off" | "playing" | "leaving">(() => (shouldPlay() ? "playing" : "off"));

  useEffect(() => {
    if (phase !== "playing") return;
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // ignoré
    }
    const leave = () => setPhase((p) => (p === "playing" ? "leaving" : p));
    const timer = window.setTimeout(leave, DURATION_MS);
    window.addEventListener("keydown", leave);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", leave);
    };
  }, [phase === "playing"]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== "leaving") return;
    const t = window.setTimeout(() => setPhase("off"), FADE_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === "off") return null;
  return (
    <div
      className={`intro-overlay${phase === "leaving" ? " is-leaving" : ""}`}
      onClick={() => setPhase("leaving")}
      aria-hidden="true"
    >
      {/* Même géométrie que le logo de la marque (viewBox 567,49 × 118) : symbole à gauche, nom à droite. */}
      <div className="intro-logo">
        <svg className="intro-mark" viewBox="0 0 88 88" fill="none">
          <g stroke="#173D35" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
            <path className="intro-foot" d="M16 76H29" pathLength={1} />
            <path className="intro-arch" d="M16 76V36C16 18 27 8 44 8S72 18 72 36V76H59" pathLength={1} />
            <path className="intro-path" d="M43 76C30 65 58 61 49 48" pathLength={1} />
          </g>
          <circle className="intro-sun" cx="44" cy="29" r="6.5" fill="#A9432E" />
        </svg>
        <img className="intro-word" src="./logos/echappee-wordmark-color.svg" alt="" width={457} height={118} />
      </div>
      <span className="intro-skip">Passer</span>
    </div>
  );
}
