// Données fictives de la démo.
// - activities.json : contenu éditorial. En production, il viendrait du CMS headless (traduit par langue).
// - slots.json : les 6 créneaux de démonstration des règles métier (dates et places fixes).
// - schedule.ts : le reste du planning sur l'année, généré de façon déterministe.
// En production, créneaux et places viendraient du moteur de réservation (stock partagé avec le B2B).
import type { Activity, Catalog, Slot } from "../domain/types";
import activities from "./activities.json";
import slots from "./slots.json";
import { generateSchedule } from "./schedule";

export const catalog: Catalog = {
  activities: activities as Activity[],
  slots: generateSchedule(slots as Slot[]),
};

export function findActivityBySlug(slug: string): Activity | undefined {
  return catalog.activities.find((a) => a.slug === slug);
}

export function findActivityById(id: string): Activity | undefined {
  return catalog.activities.find((a) => a.id === id);
}
