import { useEffect, type CSSProperties } from "react";
import { track } from "../analytics/track";
import { ActivityImage, ResponsiveImage } from "../components/ActivityImage";
import { Icon } from "../components/Icon";
import { ParticipantsInput } from "../components/ParticipantsInput";
import { catalog } from "../data/catalog";
import { isActivityFull, nextAvailableSlot, parseParticipants } from "../domain/booking";
import type { Activity, Availability } from "../domain/types";
import { formatDate, formatDuration, formatPrice, formatTime } from "../lib/format";
import { href, navigate, withQuery, type Route } from "../router";
import { useBookingState } from "../state/store";

const MAX_GROUP = 10;

export function HomePage({ route }: { route: Route }) {
  const { availability } = useBookingState();
  const raw = route.query.get("participants") ?? "2";
  const parsed = parseParticipants(raw);
  const groupSize = parsed.ok && parsed.value <= MAX_GROUP ? parsed.value : null;
  const groupError = parsed.ok
    ? parsed.value > MAX_GROUP
      ? "En ligne, jusqu'à 10 participants. Au-delà, une demande de devis sera proposée dans la version en ligne."
      : undefined
    : parsed.error.code === "participants_too_low"
      ? "Il faut au moins 1 participant."
      : "Indique un nombre entier de participants.";

  useEffect(() => {
    track("view_item_list", { item_count: catalog.activities.length });
  }, []);

  const setGroupSize = (value: string) => navigate(withQuery("/", { participants: value }), { replace: true });

  return (
    <>
      <div className="container">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-text">
            <p className="eyebrow">Ateliers, balades et jeux en Provence</p>
            <h1 id="hero-title" tabIndex={-1}>
              Sortir du quotidien. Tout près.
            </h1>
            <p className="lead">
              De la matière, de l'air et le plaisir de faire quelque chose ensemble. À deux, en famille ou entre
              amis : choisis ta sortie et réserve en deux minutes.
            </p>
          </div>
          <ResponsiveImage
            name="hero-provence"
            alt="Une calanque au soleil, avec des pins au-dessus de l'eau claire."
            sizes="(min-width: 52rem) 55vw, 100vw"
            eager
          />
        </section>

        <div className="group-picker">
          <span className="eyebrow" style={{ width: "100%" }}>
            Pour trouver une activité adaptée
          </span>
          <ParticipantsInput label="Vous serez combien ?" value={raw} onChange={setGroupSize} max={MAX_GROUP} error={groupError} />
        </div>

        <section className="section" id="activites" aria-labelledby="activites-title">
          <div className="section-head">
            <h2 id="activites-title">Nos activités</h2>
            <p className="muted">
              {groupSize
                ? `Disponibilités affichées pour ${groupSize} ${groupSize > 1 ? "participants" : "participant"}.`
                : "Indique le nombre de participants pour voir les disponibilités."}
            </p>
          </div>
          <ul className="cards">
            {catalog.activities.map((activity, index) => (
              <li key={activity.id} style={{ "--i": index } as CSSProperties}>
                <ActivityCard activity={activity} availability={availability} groupSize={groupSize} />
              </li>
            ))}
          </ul>
        </section>

        <p className="quote">« Un peu plus dehors. Un peu plus ensemble. »</p>
      </div>
    </>
  );
}

function ActivityCard({
  activity,
  availability,
  groupSize,
}: {
  activity: Activity;
  availability: Availability;
  groupSize: number | null;
}) {
  const full = isActivityFull(catalog, availability, activity.id);
  const next = groupSize ? nextAvailableSlot(catalog, availability, activity.id, groupSize) : undefined;
  const link = withQuery(`/activites/${activity.slug}`, { participants: groupSize ?? undefined });

  let status: { kind: "available" | "full" | "short"; icon: "check" | "alert"; text: string };
  if (full) {
    status = { kind: "full", icon: "alert", text: "Complet sur les dates proposées" };
  } else if (groupSize && !next) {
    status = { kind: "short", icon: "alert", text: `Pas assez de places pour ${groupSize}` };
  } else {
    const slot = next ?? nextAvailableSlot(catalog, availability, activity.id);
    status = {
      kind: "available",
      icon: "check",
      text: slot ? `Prochain créneau : ${formatDate(slot.startsAt)}, ${formatTime(slot.startsAt)}` : "Disponible",
    };
  }

  return (
    <article className="card">
      <ActivityImage activity={activity} sizes="(min-width: 60rem) 33vw, (min-width: 40rem) 50vw, 100vw" />
      <div className="card-body">
        <span className="category">
          <Icon name={activity.icon} /> {activity.categoryLabel}
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
        <p className={`status status--${status.kind}`}>
          <Icon name={status.icon} /> {status.text}
        </p>
      </div>
    </article>
  );
}
