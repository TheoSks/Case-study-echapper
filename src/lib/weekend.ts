// Regroupe les créneaux par week-end : un choix de date simple, sans calendrier.
const TIME_ZONE = "Europe/Paris";
const DAY = 24 * 60 * 60 * 1000;

/** Clé du week-end d'un créneau : la date (AAAA-MM-JJ) du samedi. Un créneau du dimanche est rattaché à la veille. */
export function weekendKey(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const utc = Date.UTC(Number(get("year")), Number(get("month")) - 1, Number(get("day")));
  const saturday = get("weekday") === "Sun" ? utc - DAY : utc;
  return new Date(saturday).toISOString().slice(0, 10);
}

/** « 17–18 avril » */
export function weekendLabel(key: string): string {
  const saturday = new Date(`${key}T00:00:00Z`);
  const sunday = new Date(saturday.getTime() + DAY);
  const month = new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" }).format(sunday);
  return `${saturday.getUTCDate()}–${sunday.getUTCDate()} ${month}`;
}
