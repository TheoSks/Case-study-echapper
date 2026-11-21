// Disponibilités par jour, pour le calendrier et la recherche. S'appuie sur le domaine (places restantes).
import type { DayStatus } from "../components/DatePicker";
import { catalog } from "../data/catalog";
import { remainingFor } from "../domain/booking";
import type { Availability, Slot } from "../domain/types";
import { dayKey, monthKey } from "./dates";

const slotsByDay = new Map<string, Slot[]>();
for (const slot of catalog.slots) {
  const day = dayKey(slot.startsAt);
  slotsByDay.set(day, [...(slotsByDay.get(day) ?? []), slot]);
}
const days = [...slotsByDay.keys()].sort();

/** Fenêtre de réservation couverte par le planning. */
export const MIN_MONTH = monthKey(days[0]);
export const MAX_MONTH = monthKey(days[days.length - 1]);

export function slotsOn(day: string, activityIds: string[]): Slot[] {
  return (slotsByDay.get(day) ?? []).filter((s) => activityIds.includes(s.activityId));
}

/** Seuil « peu de places » : le meilleur horaire du jour en a 3 ou moins. */
export const FEW_PLACES = 3;

/**
 * Disponible si au moins un horaire a assez de places pour le groupe (« few » s'il en reste 3 ou moins) ;
 * complet si tous sont à 0 ; « short » s'il reste des places, mais pas assez pour le groupe.
 */
export function dayStatus(availability: Availability, activityIds: string[], day: string, size: number): DayStatus {
  const slots = slotsOn(day, activityIds);
  if (slots.length === 0) return undefined;
  const best = Math.max(...slots.map((s) => remainingFor(availability, s.id)));
  if (best >= size) return best <= FEW_PLACES ? "few" : "available";
  if (slots.every((s) => remainingFor(availability, s.id) <= 0)) return "full";
  return "short";
}

/** Premier jour (à partir d'une date) avec un horaire qui convient au groupe. */
export function nextAvailableDay(
  availability: Availability,
  activityIds: string[],
  size: number,
  from = days[0],
): string | undefined {
  return days.find((day) => {
    if (day < from) return false;
    const status = dayStatus(availability, activityIds, day, size);
    return status === "available" || status === "few";
  });
}

/** Premier horaire qui convient, un jour donné. */
export function firstFittingSlot(availability: Availability, activityId: string, day: string, size: number): Slot | undefined {
  return slotsOn(day, [activityId]).find((s) => remainingFor(availability, s.id) >= size);
}
