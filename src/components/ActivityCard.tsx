import { catalog } from "../data/catalog";
import { isActivityFull } from "../domain/booking";
import type { Activity, Availability } from "../domain/types";
import { dayStatus, firstFittingSlot, nextAvailableDay } from "../lib/availability";
import { dayKey, formatDay } from "../lib/dates";
import { formatDuration, formatPrice, formatTime } from "../lib/format";
import { href, withQuery } from "../router";
import { ActivityImage } from "./ActivityImage";
import { Icon } from "./Icon";

/** Carte d'activité, identique sur l'accueil et sur la fiche (« D'autres échappées »). */
export function ActivityCard({
  activity,
  availability,
  groupSize,
  date,
}: {
  activity: Activity;
  availability: Availability;
  groupSize: number | null;
  date: string;
}) {
  const size = groupSize ?? 1;
  const people = `${size} ${size > 1 ? "personnes" : "personne"}`;
  const full = isActivityFull(catalog, availability, activity.id);
  const daySlot = date ? firstFittingSlot(availability, activity.id, date, size) : undefined;
  const nextDay = nextAvailableDay(availability, [activity.id], size, date || undefined);
  const nextSlot = nextDay ? firstFittingSlot(availability, activity.id, nextDay, size) : undefined;

  // Étiquette courte, sur une seule ligne ; l'information secondaire (prochaine date) passe en dessous.
  const short = (day: string) => formatDay(day, { weekday: "short", day: "numeric", month: "short" });
  let status: { kind: "available" | "full" | "short"; icon: "check" | "alert"; text: string; next?: string };
  let linkDate: string | undefined;
  if (full) {
    status = { kind: "full", icon: "alert", text: "Complet sur toutes les dates" };
  } else if (date && daySlot) {
    linkDate = date;
    status = { kind: "available", icon: "check", text: `Disponible · ${formatTime(daySlot.startsAt)}` };
  } else if (date) {
    const dayState = dayStatus(availability, [activity.id], date, size);
    status = {
      kind: "short",
      icon: "alert",
      text: dayState === "full" || dayState === "short" ? "Complet ce jour-là" : "Pas de créneau ce jour-là",
      next: nextSlot ? `Prochaine date : ${short(dayKey(nextSlot.startsAt))}` : undefined,
    };
  } else if (nextSlot) {
    status = { kind: "available", icon: "check", text: `Prochain : ${short(dayKey(nextSlot.startsAt))} · ${formatTime(nextSlot.startsAt)}` };
  } else {
    status = { kind: "short", icon: "alert", text: `Aucun créneau pour ${people}` };
  }

  const link = withQuery(`/activites/${activity.slug}`, { participants: groupSize ?? undefined, date: linkDate });

  return (
    <article className={`card${status.kind === "available" ? "" : " card--unavailable"}`}>
      <ActivityImage activity={activity} sizes="(min-width: 60rem) 33vw, (min-width: 40rem) 50vw, 100vw" />
      <div className="card-body">
        <span className="category">
          <Icon name={activity.icon} /> {activity.categoryLabel}
          {activity.weatherDependent && <span className="tag">D'avril à octobre</span>}
        </span>
        <h3>
          <a href={href(link)}>{activity.title}</a>
        </h3>
        <p>{activity.tagline}</p>
        <ul className="facts">
          <li>
            <Icon name="pin" /> {activity.location}
          </li>
          <li>
            <Icon name="clock" /> {formatDuration(activity.durationMinutes)}
          </li>
          <li>
            <Icon name="people" /> Dès {activity.minAge} ans
          </li>
        </ul>
        <p className="card-price">{formatPrice(activity.pricePerPersonCents)} / pers. TTC</p>
        <div className="card-status">
          <p className={`status status--${status.kind}`}>
            <Icon name={status.icon} /> <span>{status.text}</span>
          </p>
          {status.next && <p className="status-next">{status.next}</p>}
        </div>
      </div>
    </article>
  );
}
