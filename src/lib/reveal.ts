// Apparition discrète des sections au défilement (fondu + légère montée).
// Sans IntersectionObserver (vieux navigateur, tests), rien n'est masqué : le contenu reste visible.
import { useEffect } from "react";

const SELECTOR = [
  ".section-head",
  ".cards > li",
  ".next-step",
  ".contact-card",
  ".brand-band",
  ".activity-content .content-block",
  ".highlights",
  ".suggestion-card",
].join(", ");

export function useReveal(key: string): void {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const elements = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    for (const el of elements) {
      // Déjà à l'écran à l'arrivée : rien à faire (l'entrée de page s'en charge, pas de clignotement).
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) continue;
      // Décalage léger entre éléments voisins (cartes d'une même rangée), plafonné.
      const index = el.parentElement ? Array.from(el.parentElement.children).indexOf(el) : 0;
      el.style.setProperty("--reveal-delay", `${Math.min(index, 4) * 70}ms`);
      el.classList.add("reveal");
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, [key]);
}
