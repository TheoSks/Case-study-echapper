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
      <a className="visually-hidden" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>
        Aller au contenu
      </a>
      <SimulationBanner />
      <header className="site-header">
        <div className="container">
          <a href={href("/")} aria-label="Échappée, accueil">
            <img src="./logos/echappee-logo-color.svg" alt="Échappée" width={160} height={33} />
          </a>
          <nav aria-label="Navigation principale">
            <a href={href("/")} onClick={(e) => { e.preventDefault(); goToActivities(); }}>
              Les activités
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

export function goToActivities() {
  navigate("/");
  requestAnimationFrame(() => document.getElementById("activites")?.scrollIntoView());
}
