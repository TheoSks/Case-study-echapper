import { useEffect, type CSSProperties } from "react";
import { track } from "../analytics/track";
import { ActivityImage, ResponsiveImage } from "../components/ActivityImage";
import { Icon, type IconName } from "../components/Icon";
import { ParticipantsInput } from "../components/ParticipantsInput";
import { catalog } from "../data/catalog";
import { isActivityFull, nextAvailableSlot, parseParticipants } from "../domain/booking";
import type { Activity, Availability } from "../domain/types";
import { formatDate, formatDuration, formatPrice, formatTime } from "../lib/format";
import { href, navigate, withQuery, type Route } from "../router";
import { useBookingState } from "../state/store";

const MAX_GROUP = 10;

/** Choix rapides : les contextes de réservation de l'organisateur (voir docs/01-cadrage.md). */
const PRESETS = [
  { label: "À deux", value: 2 },
  { label: "En famille", value: 4 },
  { label: "Entre amis", value: 6 },
];

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

  // On garde la saisie telle quelle (même vide) : vider le champ ne doit pas le remettre à 2.
  const setGroupSize = (value: string) =>
    navigate(`/?participants=${encodeURIComponent(value)}`, { replace: true });
  const showActivities = () => document.getElementById("activites")?.scrollIntoView({ behavior: "smooth" });

  const fitting = groupSize
    ? catalog.activities.filter((a) => nextAvailableSlot(catalog, availability, a.id, groupSize))
    : [];

  return (
    <div className="container">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-text">
          <p className="eyebrow">Ateliers, balades et jeux en Provence</p>
          <h1 id="hero-title" tabIndex={-1}>
            Sortir du quotidien. Tout près.
          </h1>
          <p className="lead">
            De la matière, de l'air et le plaisir de faire quelque chose ensemble. Choisis ta sortie et réserve en
            deux minutes.
          </p>

          <div className="finder" role="search" aria-labelledby="finder-title">
            <h2 id="finder-title" className="finder-title">
              Vous serez combien ?
            </h2>
            <div className="finder-presets" role="group" aria-label="Choix rapides">
              {PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className="chip"
                  aria-pressed={groupSize === preset.value}
                  onClick={() => setGroupSize(String(preset.value))}
                >
                  {preset.label}
                  <span className="chip-count">{preset.value}</span>
                </button>
              ))}
            </div>
            <ParticipantsInput
              label="Ou indique le nombre exact"
              hint="Organisateur compris. Au-delà de 10, un devis sera proposé dans la version en ligne."
              value={raw}
              onChange={setGroupSize}
              max={MAX_GROUP}
              error={groupError}
            />
            {groupSize && (
              <div className="finder-result" aria-live="polite">
                <p>
                  {fitting.length > 0 ? (
                    <>
                      <strong>
                        {fitting.length} {fitting.length > 1 ? "activités ont" : "activité a"}
                      </strong>{" "}
                      de la place pour {groupSize} {groupSize > 1 ? "personnes" : "personne"}.
                    </>
                  ) : (
                    <>
                      <strong>Aucun créneau</strong> n'a assez de place pour {groupSize} personnes. Essaie avec moins
                      de participants.
                    </>
                  )}
                </p>
                <button type="button" className="btn btn-primary" onClick={showActivities}>
                  Voir les activités <Icon name="arrow" />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="hero-media">
          <ResponsiveImage
            name="hero-provence"
            alt="Une calanque au soleil, avec des pins au-dessus de l'eau claire."
            sizes="(min-width: 52rem) 50vw, 100vw"
            eager
          />
        </div>
      </section>

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

      <section className="section" aria-labelledby="comment">
        <div className="section-head">
          <h2 id="comment">Comment ça marche</h2>
        </div>
        <ol className="next-steps">
          <Step icon="explore" step={1} title="Choisis ta sortie" text="Selon la taille de ton groupe : tu vois tout de suite ce qui a de la place." />
          <Step icon="calendar" step={2} title="Réserve en deux minutes" text="Un créneau, le nombre de participants, et le total TTC affiché avant de confirmer." />
          <Step icon="people" step={3} title="Préviens ton groupe" text="Lieu, heure et ce qu'il faut prévoir, à partager en un geste." />
        </ol>
      </section>

      <section className="brand-band" aria-label="L'esprit Échappée">
        <div className="brand-band-text">
          <img className="brand-mark" src="./logos/echappee-mark-inverse.svg" alt="" width={72} height={72} />
          <p className="brand-quote">« Un peu plus dehors. Un peu plus ensemble. »</p>
          <p>
            Des sorties simples, tout près, pour prendre le temps de faire. Pas besoin d'être expert : on apprend en
            faisant, à son rythme.
          </p>
        </div>
        <div className="brand-band-media">
          <ResponsiveImage
            name="a02-kayak"
            alt="Deux personnes en kayak au pied de falaises calcaires."
            sizes="(min-width: 52rem) 45vw, 100vw"
          />
        </div>
      </section>
    </div>
  );
}

function Step({ icon, step, title, text }: { icon: IconName; step: number; title: string; text: string }) {
  return (
    <li className="next-step">
      <span className="next-step-icon">
        <Icon name={icon} />
      </span>
      <span className="timeline-when">Étape {step}</span>
      <h3>{title}</h3>
      <p className="muted">{text}</p>
    </li>
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
    status = { kind: "short", icon: "alert", text: `Aucun créneau pour ${groupSize} personnes` };
  } else {
    const slot = next ?? nextAvailableSlot(catalog, availability, activity.id);
    status = {
      kind: "available",
      icon: "check",
      text: slot ? `Prochain créneau : ${formatDate(slot.startsAt)}, ${formatTime(slot.startsAt)}` : "Disponible",
    };
  }

  return (
    <article className={`card${status.kind === "available" ? "" : " card--unavailable"}`}>
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
