// Animation d'ouverture (Rive) : l'arche se dessine, le soleil apparaît, le nom arrive, puis l'écran s'efface.
// Source : rive/intro/scene.rml, compilée en public/rive/intro.riv (voir rive/intro/README).
// Une fois par session ; passée au clic ou au clavier ; jamais si l'utilisateur réduit les animations.
import { useEffect, useRef, useState } from "react";
import { Fit, Layout, Rive } from "@rive-app/canvas";

const SRC = "./rive/intro.riv";
const SEEN_KEY = "echappee:intro:seen";
const DURATION_MS = 2500; // durée de l'animation (150 images à 60 i/s)
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (phase !== "playing" || !canvasRef.current) return;
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // ignoré
    }
    let timer = 0;
    const leave = () => setPhase((p) => (p === "playing" ? "leaving" : p));
    const rive = new Rive({
      src: SRC,
      canvas: canvasRef.current,
      stateMachines: "Ouverture",
      autoplay: true,
      layout: new Layout({ fit: Fit.Contain }),
      onLoad: () => {
        rive.resizeDrawingSurfaceToCanvas();
        timer = window.setTimeout(leave, DURATION_MS);
      },
      // Fichier absent ou illisible : on n'impose pas d'écran vide.
      onLoadError: () => setPhase("off"),
    });
    const skip = () => leave();
    window.addEventListener("keydown", skip);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", skip);
      rive.cleanup();
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
      <canvas ref={canvasRef} className="intro-canvas" />
      <span className="intro-skip">Passer</span>
    </div>
  );
}
