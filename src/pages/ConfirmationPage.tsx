import { useState } from "react";
import { track } from "../analytics/track";
import { ActivityImage } from "../components/ActivityImage";
import { Icon, type IconName } from "../components/Icon";
import { catalog, findActivityById } from "../data/catalog";
import { findBookingByReference, isActivityFull, remainingFor } from "../domain/booking";
import type { Activity, Booking, Slot } from "../domain/types";
import { capitalize, formatDate, formatDuration, formatPrice, formatTime, plural } from "../lib/format";
import { pageUrl, shareOrCopy } from "../lib/share";
import { href, navigate } from "../router";
import { bookingStore, useBookingState } from "../state/store";

export function ConfirmationPage({ reference }: { reference: string }) {
  const state = useBookingState();
  const booking = findBookingByReference(state, reference);
  const activity = booking && findActivityById(booking.activityId);
  const slot = booking && catalog.slots.find((s) => s.id === booking.slotId);

  if (!booking || !activity || !slot) {
    return (
      <div className="narrow">
        <h1 tabIndex={-1}>Réservation introuvable</h1>
        <p>La démo a peut-être été réinitialisée, ou l'onglet fermé : les réservations ne vivent que le temps de la session.</p>
        <a className="btn btn-primary" href={href("/")}>
          Voir les activités
        </a>
      </div>
    );
  }

  const remaining = remainingFor(state.availability, slot.id);
  const suggestion = pickSuggestion(activity, state.availability);

  return (
    <div className="container confirmation">
      <header className="confirmation-head">
        <SuccessMark />
        <h1 tabIndex={-1} className="success-title">
          C'est réservé.
        </h1>
        <p className="lead success-title">
          {activity.title} · {formatDate(slot.startsAt)} à {formatTime(slot.startsAt)}
        </p>
        <p className="sim-note">Réservation simulée : rien n'a été payé, aucun email n'a été envoyé.</p>
      </header>

      <div className="confirmation-grid">
        <section className="summary" aria-label="Récapitulatif de la réservation confirmée">
          <div className="summary-head">
            <ActivityImage activity={activity} sizes="80px" />
            <div>
              <h2 style={{ fontSize: "1.5rem" }}>{activity.title}</h2>
              <p className="muted">{activity.meetingPoint}</p>
            </div>
          </div>
          <dl>
            <div>
              <dt>Référence</dt>
              <dd>{booking.reference}</dd>
            </div>
            <div>
              <dt>Créneau</dt>
              <dd>
                {capitalize(formatDate(slot.startsAt))} · {formatTime(slot.startsAt)}
              </dd>
            </div>
            <div>
              <dt>Durée</dt>
              <dd>{formatDuration(activity.durationMinutes)}</dd>
            </div>
            <div>
              <dt>Participants</dt>
              <dd>{plural(booking.participants, "participant")}</dd>
            </div>
            <div className="summary-total">
              <dt>Total TTC</dt>
              <dd>{formatPrice(booking.totalCents)}</dd>
            </div>
          </dl>
        </section>

        <ShareWithGroup booking={booking} activity={activity} slot={slot} />
      </div>

      <section className="section" aria-labelledby="ensuite">
        <div className="section-head">
          <h2 id="ensuite">Et ensuite ?</h2>
          <p className="muted">
            <span className="tag">Version en ligne</span> Ce prototype n'envoie aucun message.
          </p>
        </div>
        <ol className="next-steps">
          <NextStep
            icon="calendar"
            when="2 jours avant"
            title="Prépare ta sortie"
            text={`Quoi apporter, comment venir${activity.weatherDependent ? " et la météo prévue" : ""}.`}
          />
          <NextStep icon="heart" when="Le lendemain" title="Revis ta sortie" text="Quelques photos de ta sortie, un merci et une demande d'avis." />
          <NextStep
            icon="explore"
            when="À la saison suivante"
            title="Une nouvelle échappée"
            text="Une idée de sortie qui change de ce que tu as fait, au bon moment de l'année."
          />
        </ol>
      </section>

      {suggestion && <Suggestion booked={activity} suggestion={suggestion} />}

      <details className="demo-tools">
        <summary>Outils de démo · vérifier le décompte</summary>
        <p>
          Places sur ce créneau : <strong>{remaining + booking.participants} avant</strong>,{" "}
          <strong>{remaining} après</strong>. Seul ce créneau a été modifié, une seule fois.
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            bookingStore.reset();
            navigate("/");
          }}
        >
          Réinitialiser la démo
        </button>
      </details>
    </div>
  );
}

function NextStep({ icon, when, title, text }: { icon: IconName; when: string; title: string; text: string }) {
  return (
    <li className="next-step">
      <span className="next-step-icon">
        <Icon name={icon} />
      </span>
      <span className="timeline-when">{when}</span>
      <h3>{title}</h3>
      <p className="muted">{text}</p>
    </li>
  );
}

/** Relance saisonnière, en miniature : une activité d'un autre type, qui a encore des places. */
function Suggestion({ booked, suggestion }: { booked: Activity; suggestion: Activity }) {
  const pitch = booked.weatherDependent
    ? "Quand l'été se termine, on se retrouve au chaud, les mains dans la matière."
    : suggestion.weatherDependent
      ? "Aux beaux jours, on prend l'air : la prochaine sortie se passe dehors."
      : "Une autre façon de sortir du quotidien, tout près.";
  return (
    <section className="section" aria-labelledby="prolonger">
      <article className="suggestion-card">
        <ActivityImage activity={suggestion} sizes="(min-width: 52rem) 40vw, 100vw" />
        <div className="suggestion-body">
          <p className="eyebrow">Prolonger l'échappée</p>
          <h2 id="prolonger">{suggestion.title}</h2>
          <p>{pitch}</p>
          <ul className="facts">
            <li>
              <Icon name="pin" /> {suggestion.location}
            </li>
            <li>
              <Icon name="clock" /> {formatDuration(suggestion.durationMinutes)}
            </li>
            <li>
              <Icon name="people" /> Dès {suggestion.minAge} ans
            </li>
          </ul>
          <p className="card-price">{formatPrice(suggestion.pricePerPersonCents)} / pers. TTC</p>
          <a className="btn btn-primary" href={href(`/activites/${suggestion.slug}`)}>
            Découvrir l'activité <Icon name="arrow" />
          </a>
        </div>
      </article>
    </section>
  );
}

/** L'organisateur transmet lieu, heure et « à prévoir » à ses participants. */
function ShareWithGroup({ booking, activity, slot }: { booking: Booking; activity: Activity; slot: Slot }) {
  const [feedback, setFeedback] = useState<"copied" | "failed" | null>(null);
  const text = [
    `${activity.title} avec Échappée`,
    `${capitalize(formatDate(slot.startsAt))} à ${formatTime(slot.startsAt)} (${formatDuration(activity.durationMinutes)})`,
    `Rendez-vous : ${activity.meetingPoint}`,
    `À prévoir : ${activity.toBring.join(", ").toLowerCase()}`,
    `Nous serons ${booking.participants}. Réf. ${booking.reference}`,
  ].join("\n");

  const share = async () => {
    const outcome = await shareOrCopy({ title: `${activity.title} · Échappée`, text, url: pageUrl(`/activites/${activity.slug}`) });
    if (outcome === "native" || outcome === "copied") {
      track("share_booking", { method: outcome, booking_reference: booking.reference });
    }
    setFeedback(outcome === "copied" ? "copied" : outcome === "failed" ? "failed" : null);
  };

  return (
    <section className="share-card" aria-labelledby="partager">
      <span className="next-step-icon">
        <Icon name="people" />
      </span>
      <h2 id="partager">Préviens ton groupe</h2>
      <p>Envoie l'essentiel à tes participants : lieu, heure et ce qu'il faut prévoir.</p>
      <pre className="share-preview">{text}</pre>
      <button type="button" className="btn btn-primary btn-block" onClick={share}>
        Partager les infos
      </button>
      {feedback === "copied" && <p role="status">Infos copiées : colle-les dans ta conversation de groupe.</p>}
      {feedback === "failed" && <p role="status">Le partage n'est pas disponible : copie le texte ci-dessus.</p>}
    </section>
  );
}

function pickSuggestion(booked: Activity, availability: Record<string, number>): Activity | undefined {
  const others = catalog.activities.filter((a) => a.id !== booked.id && !isActivityFull(catalog, availability, a.id));
  return others.find((a) => a.weatherDependent !== booked.weatherDependent) ?? others[0];
}

/** Coche de confirmation, dessinée au trait (même style que les pictogrammes du kit). */
function SuccessMark() {
  return (
    <svg
      className="success-mark"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" pathLength={1} />
      <path d="m8 12.5 2.8 2.8L16.5 9.5" pathLength={1} />
    </svg>
  );
}
