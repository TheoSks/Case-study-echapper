// Planning fictif sur l'année, généré de façon déterministe (mêmes créneaux à chaque chargement).
// - Atelier céramique : toute l'année, mercredi 14 h 30 et samedi 10 h.
// - Balade en kayak : d'avril à octobre (activité de plein air, saisonnière), samedi et dimanche, 9 h 30 et 14 h.
// - Escape game : uniquement les créneaux de démonstration de slots.json, tous complets (règle « activité complète »).
// Les 6 créneaux de slots.json sont conservés tels quels : ce sont les cas de démonstration des règles métier.
import type { Slot } from "../domain/types";

const START = "2026-12-01";
const END = "2027-10-31";

interface Recurrence {
  activityId: string;
  capacity: number;
  from: string;
  to: string;
  /** Jour de la semaine (0 = dimanche) → horaires « HH:MM ». */
  times: Record<number, string[]>;
}

const RECURRENCES: Recurrence[] = [
  { activityId: "a01", capacity: 8, from: START, to: END, times: { 3: ["14:30"], 6: ["10:00"] } },
  { activityId: "a02", capacity: 10, from: "2027-04-01", to: END, times: { 6: ["09:30", "14:00"], 0: ["09:30", "14:00"] } },
];

/** Générateur pseudo-aléatoire déterministe (mulberry32), pour des places restantes stables. */
function seeded(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/** Heure d'été à Paris en 2027 : du 28 mars au 31 octobre (le planning ne couvre pas d'autre changement d'heure). */
function parisOffset(day: string): string {
  return day >= "2027-03-28" && day < "2027-10-31" ? "+02:00" : "+01:00";
}

export function generateSchedule(fixed: Slot[]): Slot[] {
  const fixedDays = new Set(fixed.map((s) => `${s.activityId}|${s.startsAt.slice(0, 10)}`));
  const slots: Slot[] = [];
  for (const rule of RECURRENCES) {
    const random = seeded(rule.activityId);
    for (let t = Date.parse(`${rule.from}T00:00:00Z`); t <= Date.parse(`${rule.to}T00:00:00Z`); t += 86_400_000) {
      const date = new Date(t);
      const day = date.toISOString().slice(0, 10);
      const times = rule.times[date.getUTCDay()];
      if (!times || fixedDays.has(`${rule.activityId}|${day}`)) continue;
      for (const time of times) {
        const r = random();
        // ~15 % de créneaux complets, les autres entre 1 place et la capacité.
        const remaining = r < 0.15 ? 0 : 1 + Math.floor(random() * rule.capacity);
        slots.push({
          id: `${rule.activityId}-${day.replaceAll("-", "")}-${time.replace(":", "")}`,
          activityId: rule.activityId,
          startsAt: `${day}T${time}:00${parisOffset(day)}`,
          capacity: rule.capacity,
          initialRemaining: remaining,
        });
      }
    }
  }
  return [...fixed, ...slots].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
