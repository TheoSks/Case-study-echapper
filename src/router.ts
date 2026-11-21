// Routeur minimal basé sur le hash (#/...) : fonctionne sans serveur, y compris sur un hébergement statique.
import { useEffect, useState } from "react";

export interface Route {
  path: string;
  query: URLSearchParams;
}

const ROUTE_EVENT = "echappee:route";

function readRoute(): Route {
  const hash = window.location.hash.replace(/^#/, "") || "/";
  const [path, search = ""] = hash.split("?");
  return { path: path || "/", query: new URLSearchParams(search) };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const update = () => setRoute(readRoute());
    window.addEventListener("hashchange", update);
    window.addEventListener(ROUTE_EVENT, update);
    return () => {
      window.removeEventListener("hashchange", update);
      window.removeEventListener(ROUTE_EVENT, update);
    };
  }, []);
  return route;
}

/** `replace` remplace l'entrée d'historique : après une confirmation, « retour » ne ramène pas au bouton Confirmer. */
export function navigate(to: string, options: { replace?: boolean } = {}): void {
  const url = `#${to}`;
  if (options.replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
  window.dispatchEvent(new Event(ROUTE_EVENT));
}

export function href(to: string): string {
  return `#${to}`;
}

export function withQuery(path: string, params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") query.set(k, String(v));
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}
