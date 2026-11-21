import { useEffect, type CSSProperties } from "react";
import { track } from "../analytics/track";
import { ActivityImage, ResponsiveImage } from "../components/ActivityImage";
import { Icon, type IconName } from "../components/Icon";
import { ParticipantsInput } from "../components/ParticipantsInput";
import { catalog } from "../data/catalog";
import { isActivityFull, parseParticipants, remainingFor, slotsOf } from "../domain/booking";
import type { Activity, Availability, Slot } from "../domain/types";
import { formatDate, formatDuration, formatPrice, formatTime } from "../lib/format";
import { weekendKey, weekendLabel } from "../lib/weekend";
import { href, navigate, withQuery, type Route } from "../router";
import { bookingStore, useBookingState } from "../state/store";

const MAX_GROUP = 10;
const ANY = "tous";

/** Choix rapides : les contextes de réservation de l'organisateur (voir docs/01-cadrage.md). */
const PRESETS = [
  { label: "À deux", value: 2 },
  { label: "En famille", value: 4 },
  { label: "Entre amis", value: 6 },
];

/** Les week-ends proposés, déduits des créneaux (pas de calendrier : le brief l'exclut). */
const WEEKENDS = [...new Set(catalog.slots.map((s) => weekendKey(s.startsAt)))].sort();

/** Créneaux d'une activité qui conviennent au groupe et au week-end choisis. */
function fittingSlots(activityId: string, availability: Availability, size: number, weekend: string): Slot[] {
  return slotsOf(catalog, activityId).filter(
    (s) => remainingFor(availability, s.id) >= size && (weekend === ANY || weekendKey(s.startsAt) === weekend),
  );
}

export function HomePage({ route }: { route: Route }) {
  const state = useBookingState();
  const { availability } = state;
  const raw = route.query.get("participants") ?? "2";
  const weekendParam = route.query.get("quand") ?? ANY;
  const weekend = WEEKENDS.includes(weekendParam) ? weekendParam : ANY;
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
  const update = (next: { participants?: string; quand?: string }) => {
    const query = new URLSearchParams({ participants: next.participants ?? raw, quand: next.quand ?? weekend });
    navigate(`/?${query.toString()}`, { replace: true });
  };
  const showActivities = () => document.getElementById("activites")?.scrollIntoView({ behavior: "smooth" });

  const fitting = groupSize
    ? catalog.activities.filter((a) => fittingSlots(a.id, availability, groupSize, weekend).length > 0)
    : [];
  const when = weekend === ANY ? "" : `, le week-end du ${weekendLabel(weekend)}`;
  const people = (n: number) => `${n} ${n > 1 ? "personnes" : "personne"}`;

  const bookingCount = Object.keys(state.bookings).length;
  const demoModified = bookingCount > 0 || catalog.slots.some((s) => availability[s.id] !== s.initialRemaining);

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

          <div className="finder" role="search" aria-label="Trouver une activité adaptée">
            <div className="finder-field">
              <h2 className="finder-label" id="finder-who">
                <Icon name="people" /> Vous serez combien ?
              </h2>
              <div className="finder-row">
                <div className="finder-presets" role="group" aria-labelledby="finder-who">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className="chip"
                      aria-pressed={groupSize === preset.value}
                      onClick={() => update({ participants: String(preset.value) })}
                    >
                      {preset.label}
                      <span className="chip-count">{preset.value}</span>
                    </button>
                  ))}
                </div>
                <ParticipantsInput
                  label="Nombre exact de participants"
                  labelHidden
                  hint=""
                  value={raw}
                  onChange={(value) => update({ participants: value })}
                  max={MAX_GROUP}
                  error={groupError}
                />
              </div>
            </div>

            <div className="finder-field">
              <h2 className="finder-label" id="finder-when">
                <Icon name="calendar" /> Quand ?
              </h2>
              <div className="finder-presets" role="group" aria-labelledby="finder-when">
                {[ANY, ...WEEKENDS].map((key) => (
                  <button
                    key={key}
                    type="button"
                    className="chip"
                    aria-pressed={weekend === key}
                    aria-label={key === ANY ? undefined : `Week-end du ${weekendLabel(key)}`}
                    onClick={() => update({ quand: key })}
                  >
                    {key === ANY ? "Peu importe" : weekendLabel(key)}
                  </button>
                ))}
              </div>
            </div>

            {groupSize && (
              <div className="finder-result" aria-live="polite">
                <p>
                  {fitting.length > 0 ? (
                    <>
                      <strong>
                        {fitting.length} {fitting.length > 1 ? "activités ont" : "activité a"}
                      </strong>{" "}
                      de la place pour {people(groupSize)}
                      {when}.
                    </>
                  ) : (
                    <>
                      <strong>Aucune activité</strong> n'a de place pour {people(groupSize)}
                      {when}. Essaie une autre date ou moins de participants.
                    </>
                  )}
                </p>
                <button type="button" className="btn" onClick={showActivities}>
                  Voir les activités <Icon name="arrow" />
                </button>
              </div>
            )}
            <p className="finder-hint">
              Organisateur compris. Au-delà de 10 personnes, un devis sera proposé dans la version en ligne.
            </p>
          </div>
        </div>

        <div className="hero-mosaic">
          <figure className="mosaic-main">
            <ResponsiveImage
              name="hero-provence"
              alt="Une calanque au soleil, avec des pins au-dessus de l'eau claire."
              sizes="(min-width: 52rem) 30vw, 66vw"
              eager
            />
            <figcaption>Cassis · Calanques</figcaption>
          </figure>
          <figure>
            <ResponsiveImage name="a01-ceramique" alt="Des mains modèlent un bol en argile." sizes="(min-width: 52rem) 18vw, 33vw" eager />
            <figcaption>Aubagne · Atelier</figcaption>
          </figure>
          <figure>
            <ResponsiveImage
              name="a03-escape-game"
              alt="Une table avec une carte ancienne et un coffret à énigmes."
              sizes="(min-width: 52rem) 18vw, 33vw"
              eager
            />
            <figcaption>Aix · Jeu</figcaption>
          </figure>
        </div>
      </section>

      <section className="section" id="activites" aria-labelledby="activites-title">
        <div className="section-head">
          <h2 id="activites-title">Nos activités</h2>
          <p className="muted">
            {groupSize
              ? `Disponibilités pour ${groupSize} ${groupSize > 1 ? "participants" : "participant"}${when}.`
              : "Indique le nombre de participants pour voir les disponibilités."}
          </p>
        </div>

        {demoModified && (
          <div className="notice demo-notice" role="status">
            <p>
              <strong>Mode démo :</strong> tes tests ont modifié les places
              {bookingCount > 0 ? ` (${bookingCount} réservation${bookingCount > 1 ? "s" : ""} simulée${bookingCount > 1 ? "s" : ""})` : ""}.
            </p>
            <button type="button" className="btn btn-secondary" onClick={() => bookingStore.reset()}>
              Réinitialiser la démo
            </button>
          </div>
        )}

        <ul className="cards">
          {catalog.activities.map((activity, index) => (
            <li key={activity.id} style={{ "--i": index } as CSSProperties}>
              <ActivityCard activity={activity} availability={availability} groupSize={groupSize} weekend={weekend} />
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="comment">
        <div className="section-head">
          <h2 id="comment">Comment ça marche</h2>
        </div>
        <ol className="next-steps">
          <Step icon="explore" step={1} title="Choisis ta sortie" text="Selon ton groupe et tes dates : tu vois tout de suite ce qui a de la place." />
          <Step icon="calendar" step={2} title="Réserve en deux minutes" text="Un créneau, le nombre de participants, et le total TTC affiché avant de confirmer." />
          <Step icon="people" step={3} title="Préviens ton groupe" text="Lieu, heure et ce qu'il faut prévoir, à partager en un geste." />
        </ol>
      </section>

      <section className="brand-band" aria-label="L'esprit Échappée">
        <div className="brand-band-text">
          <img className="brand-mark" src="./logos/echappee-mark-inverse.svg" alt="" width={72} height={72} />
          <p className="brand-quote">«{" "}Un peu plus dehors. Un peu plus ensemble.{" "}»</p>
          <p>
            Des sorties simples, tout près, pour prendre le temps de faire. Pas besoin d'être expert : on apprend en
            faisant, à son rythme.
          </p>
        </div>
        <div className="brand-band-media">
          <ResponsiveImage name="a02-kayak" alt="Deux personnes en kayak au pied de falaises calcaires." sizes="(min-width: 52rem) 45vw, 100vw" />
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
  weekend,
}: {
  activity: Activity;
  availability: Availability;
  groupSize: number | null;
  weekend: string;
}) {
  const full = isActivityFull(catalog, availability, activity.id);
  const size = groupSize ?? 1;
  const matches = fittingSlots(activity.id, availability, size, weekend);
  const link = withQuery(`/activites/${activity.slug}`, { participants: groupSize ?? undefined });
  const people = `${size} ${size > 1 ? "personnes" : "personne"}`;

  let status: { kind: "available" | "full" | "short"; icon: "check" | "alert"; text: string };
  if (full) {
    status = { kind: "full", icon: "alert", text: "Complet sur les dates proposées" };
  } else if (matches.length === 0) {
    const fitsOtherWeekend = weekend !== ANY && fittingSlots(activity.id, availability, size, ANY).length > 0;
    status = {
      kind: "short",
      icon: "alert",
      text: fitsOtherWeekend ? `Pas de créneau ce week-end pour ${people}` : `Aucun créneau pour ${people}`,
    };
  } else {
    const slot = matches[0];
    status = { kind: "available", icon: "check", text: `Prochain créneau : ${formatDate(slot.startsAt)}, ${formatTime(slot.startsAt)}` };
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
