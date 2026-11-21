import { useEffect, useState } from "react";
import { ResponsiveImage } from "./ActivityImage";

/**
 * Vidéo d'ouverture (plan de drone) : déposer le fichier dans public/videos/ et renseigner son chemin ici.
 * Tant qu'aucune vidéo n'est fournie, l'image des calanques s'affiche.
 * Format conseillé : MP4 (H.264) 1920 px, 10–20 s, sans son, moins de 6 Mo.
 */
export const HERO_VIDEO: string | null = null; // ex. "./videos/provence-drone.mp4"

/** Pas de vidéo si l'utilisateur demande moins d'animations ou d'économiser ses données : l'image suffit. */
function prefersStill(): boolean {
  if (typeof window === "undefined") return true;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData ?? false;
  return reduced || saveData;
}

export function HeroMedia() {
  const [still, setStill] = useState(true);
  useEffect(() => setStill(prefersStill()), []);

  const image = (
    <ResponsiveImage name="hero-provence" alt="Une calanque au soleil, avec des pins au-dessus de l'eau claire." sizes="100vw" eager />
  );
  if (!HERO_VIDEO || still) return image;

  return (
    <video
      className="hero-video"
      src={HERO_VIDEO}
      poster="./images/hero-provence-1280.webp"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      onError={() => setStill(true)}
    />
  );
}
