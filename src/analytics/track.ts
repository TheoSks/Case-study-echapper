// Instrumentation simulée du tunnel de réservation.
// Aucun outil n'est connecté : les événements sont poussés dans window.dataLayer
// (format attendu par un gestionnaire de balises) et affichés dans la console.
// Le plan de taggage complet est décrit dans docs/06-mesure.md.
import { randomId } from "../lib/ids";

export type FunnelEvent =
  | "view_item_list" // accueil : liste des activités
  | "view_item" // étape 1 : consultation d'une activité
  | "select_slot" // étape 2 : sélection d'un créneau
  | "begin_checkout" // étape 3 : démarrage = validation du créneau + nombre de participants
  | "view_summary" // étape 4 : récapitulatif
  | "booking_confirmed" // étape 5 : confirmation
  | "booking_error" // friction : règle métier non respectée
  | "share_booking"; // partage des infos avec le groupe

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const SESSION_KEY = "echappee:analytics:session";

function sessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = randomId();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

export function track(event: FunnelEvent, params: Params = {}): void {
  const payload = { event, session_id: sessionId(), timestamp: new Date().toISOString(), ...params };
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);
  if (import.meta.env.MODE !== "test") console.info("[analytics]", event, payload);
}
