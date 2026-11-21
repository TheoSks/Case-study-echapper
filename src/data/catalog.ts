// Données fictives de la démo.
// - activities.json : contenu éditorial. En production, il viendrait du CMS headless (traduit par langue).
// - slots.json : inventaire des places. En production, il viendrait du moteur de réservation (stock partagé avec le B2B).
import type { Activity, Catalog, Slot } from "../domain/types";
import activities from "./activities.json";
import slots from "./slots.json";

export const catalog: Catalog = {
  activities: activities as Activity[],
  slots: slots as Slot[],
};

export function findActivityBySlug(slug: string): Activity | undefined {
  return catalog.activities.find((a) => a.slug === slug);
}

export function findActivityById(id: string): Activity | undefined {
  return catalog.activities.find((a) => a.id === id);
}
