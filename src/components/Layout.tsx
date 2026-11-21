import type { ReactNode } from "react";
import { href, navigate } from "../router";
import { bookingStore } from "../state/store";

export function SimulationBanner() {
  return (
    <div className="sim-banner" role="note">
      <strong>Réservation simulée</strong> · Aucun paiement, aucun email, aucune donnée personnelle collectée.
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>
        Aller au contenu
      </a>
      <SimulationBanner />
      <header className="site-header">
        <div className="container">
          <a href={href("/")} aria-label="Échappée, accueil">
            <img src="./logos/echappee-logo-color.svg" alt="Échappée" width={160} height={33} />
          </a>
          <nav className="main-nav" aria-label="Navigation principale">
            <ul>
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a href={href("/")} onClick={(e) => { e.preventDefault(); goToSection(section.id); }}>
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
            <a className="btn btn-primary nav-cta" href={href("/")} onClick={(e) => { e.preventDefault(); goToSection("recherche"); }}>
              Réserver
            </a>
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="container">
          <p>
            <strong>Échappée</strong> est une marque fictive créée pour un cas pratique. Les activités, créneaux et
            prix sont fictifs ; les visuels sont des illustrations générées.
          </p>
          <p className="muted">
            Réservation simulée : aucun paiement, aucun email, aucune donnée personnelle collectée. Les places
            sont conservées le temps de la session (onglet ouvert).
          </p>
          <details className="demo-tools">
            <summary>Outils de démo</summary>
            <p>Remet toutes les places à leur valeur initiale et efface les réservations de la session.</p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                bookingStore.reset();
                navigate("/");
              }}
            >
              Réinitialiser la démo
            </button>
          </details>
        </div>
      </footer>
    </>
  );
}

const SECTIONS = [
  { id: "activites", label: "Activités" },
  { id: "comment", label: "Comment ça marche" },
  { id: "groupes", label: "Groupes & contact" },
];

/** Aller à une section de l'accueil, depuis n'importe quelle page (le routage utilise déjà le hash). */
export function goToSection(id: string) {
  const scroll = () => {
    const target = document.getElementById(id);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (id === "recherche") target?.querySelector<HTMLElement>("button, input")?.focus({ preventScroll: true });
  };
  if (window.location.hash.replace(/^#/, "").split("?")[0] !== "/") {
    navigate("/");
    setTimeout(scroll, 50);
  } else {
    scroll();
  }
}
