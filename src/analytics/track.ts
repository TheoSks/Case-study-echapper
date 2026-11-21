// Instrumentation simulée du tunnel de réservation.
// Aucun outil n'est connecté : les événements sont poussés dans window.dataLayer
// (format attendu par un gestionnaire de balises) et affichés dans la console.
// Le plan de taggage complet est décrit dans docs/06-mesure.md.
import { randomId } from "../lib/ids";

export type FunnelEvent =
  | "view_item_list" // accueil : liste des activités
  | "search" // recherche : activité, date, participants
  | "view_item" // étape 1 : consultation d'une activité
  | "select_slot" // étape 2 : sélection d'un créneau
  | "begin_checkout" // étape 3 : démarrage = validation du créneau + nombre de participants
  | "view_summary" // étape 4 : récapitulatif
  | "booking_confirmed" // étape 5 : confirmation
  | "booking_error" // friction : règle métier non respectée
  | "share_booking" // partage des infos avec le groupe, après réservation
  | "share_activity"; // proposition de la sortie au groupe, avant réservation

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

const CAMPAIGN_KEY = "echappee:analytics:campaign";
const CAMPAIGN_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "gclid", "fbclid"] as const;

/**
 * Pilotage des campagnes payantes : à l'arrivée, on mémorise les paramètres de campagne de l'URL
 * (?utm_source=…, en premier dans la session) pour les joindre à chaque événement, jusqu'à la confirmation.
 */
export function captureCampaign(url: string = window.location.href): void {
  try {
    if (sessionStorage.getItem(CAMPAIGN_KEY)) return;
    const parsed = new URL(url);
    const query = new URLSearchParams(parsed.search);
    new URLSearchParams(parsed.hash.split("?")[1] ?? "").forEach((v, k) => query.set(k, v));
    const campaign = Object.fromEntries(CAMPAIGN_PARAMS.filter((k) => query.get(k)).map((k) => [k, query.get(k)]));
    if (Object.keys(campaign).length > 0) sessionStorage.setItem(CAMPAIGN_KEY, JSON.stringify(campaign));
  } catch {
    // URL ou stockage indisponible : on mesure sans attribution.
  }
}

function campaign(): Params {
  try {
    return JSON.parse(sessionStorage.getItem(CAMPAIGN_KEY) ?? "{}") as Params;
  } catch {
    return {};
  }
}

export function track(event: FunnelEvent, params: Params = {}): void {
  const payload = { event, session_id: sessionId(), timestamp: new Date().toISOString(), ...campaign(), ...params };
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);
  if (import.meta.env.MODE !== "test") console.info("[analytics]", event, payload);
}
