import { useEffect } from "react";
import { IntroOverlay } from "./components/IntroOverlay";
import { Layout } from "./components/Layout";
import { findActivityBySlug } from "./data/catalog";
import { ActivityPage } from "./pages/ActivityPage";
import { ConfirmationPage } from "./pages/ConfirmationPage";
import { HomePage } from "./pages/HomePage";
import { SummaryPage } from "./pages/SummaryPage";
import { useReveal } from "./lib/reveal";
import { href, useRoute, type Route } from "./router";

export function App() {
  const route = useRoute();

  // À chaque changement de page : retour en haut, et focus sur le titre (lecteurs d'écran).
  useEffect(() => {
    window.scrollTo(0, 0);
    const title = document.querySelector<HTMLElement>("main h1");
    title?.focus({ preventScroll: true });
    // Un titre d'onglet par écran : historique lisible, pages distinguées dans la mesure.
    document.title =
      route.path === "/" || !title ? "Échappée · Activités en Provence" : `${title.textContent} · Échappée`;
  }, [route.path]);

  // Apparition discrète des sections au défilement (relancée à chaque écran).
  useReveal(route.path);

  return (
    <>
    <IntroOverlay />
    <Layout pageDemoTools={/^\/(reservation|confirmation)\//.test(route.path)}>
      <div key={route.path} className="page-enter">
        {renderPage(route)}
      </div>
    </Layout>
    </>
  );
}

function renderPage(route: Route) {
  const segments = route.path.split("/").filter(Boolean);

  if (segments.length === 0) return <HomePage route={route} />;

  if (segments[0] === "activites" && segments[1]) {
    const activity = findActivityBySlug(segments[1]);
    if (activity) return <ActivityPage key={activity.id} activity={activity} route={route} />;
  }

  if (segments[0] === "reservation" && segments[1]) {
    return <SummaryPage key={segments[1]} draftId={segments[1]} route={route} />;
  }

  if (segments[0] === "confirmation" && segments[1]) {
    return <ConfirmationPage reference={segments[1]} />;
  }

  return (
    <div className="narrow">
      <h1 tabIndex={-1}>Page introuvable</h1>
      <a className="btn btn-primary" href={href("/")}>
        Voir les activités
      </a>
    </div>
  );
}
