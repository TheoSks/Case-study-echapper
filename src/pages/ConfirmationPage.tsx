import { useState } from "react";
import { track } from "../analytics/track";
import { ActivityImage } from "../components/ActivityImage";
import { Icon } from "../components/Icon";
import { catalog, findActivityById } from "../data/catalog";
import { findBookingByReference, isActivityFull, remainingFor } from "../domain/booking";
import type { Activity, Booking, Slot } from "../domain/types";
import { capitalize, formatDate, formatDuration, formatPrice, formatTime, plural } from "../lib/format";
import { href } from "../router";
import { useBookingState } from "../state/store";

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
    <div className="narrow">
      <Icon name="check" className="success-mark" />
      <h1 tabIndex={-1}>C'est réservé.</h1>
      <p>
        Réservation simulée : rien n'a été payé et aucun email n'a été envoyé. Garde ta référence{" "}
        <strong>{booking.reference}</strong>.
      </p>

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

      <p className="muted" role="status">
        {remaining > 0
          ? `Il reste désormais ${plural(remaining, "place", "places")} sur ce créneau.`
          : "Ce créneau est désormais complet."}
      </p>

      <ShareWithGroup booking={booking} activity={activity} slot={slot} />

      <section className="content-block" aria-labelledby="ensuite">
        <h2 id="ensuite">Et ensuite ?</h2>
        <p className="muted">
          Ce que ferait la version en ligne. Ce prototype n'envoie aucun message.
        </p>
        <ol className="timeline">
          <li>
            <span className="timeline-when">2 jours avant</span>
            <span>Un message pour te préparer : quoi apporter, comment venir{activity.weatherDependent ? ", la météo prévue" : ""}.</span>
          </li>
          <li>
            <span className="timeline-when">Le lendemain</span>
            <span>Un merci, quelques photos de ta sortie et une demande d'avis.</span>
          </li>
          <li>
            <span className="timeline-when">À la saison suivante</span>
            <span>
              Une idée de sortie qui change de ce que tu as fait
              {activity.weatherDependent ? " : un atelier au chaud quand l'été sera fini." : " : une sortie en plein air aux beaux jours."}
            </span>
          </li>
        </ol>
      </section>

      {suggestion && (
        <section className="content-block" aria-labelledby="prolonger">
          <h2 id="prolonger">Prolonger l'échappée</h2>
          <a className="suggestion" href={href(`/activites/${suggestion.slug}`)}>
            <ActivityImage activity={suggestion} sizes="96px" />
            <div>
              <span className="category">
                <Icon name={suggestion.icon} /> {suggestion.categoryLabel}
              </span>
              <h3>{suggestion.title}</h3>
              <p className="muted">{suggestion.tagline}</p>
            </div>
          </a>
        </section>
      )}

      <a className="link-back" href={href("/")}>
        <Icon name="arrow" /> Toutes les activités
      </a>
    </div>
  );
}

/** Le partage avec le groupe : l'organisateur transmet lieu, heure et « à prévoir » à ses participants. */
function ShareWithGroup({ booking, activity, slot }: { booking: Booking; activity: Activity; slot: Slot }) {
  const [feedback, setFeedback] = useState<"copied" | "manual" | null>(null);
  const text = [
    `${activity.title} avec Échappée`,
    `${capitalize(formatDate(slot.startsAt))} à ${formatTime(slot.startsAt)} (${formatDuration(activity.durationMinutes)})`,
    `Rendez-vous : ${activity.meetingPoint}`,
    `À prévoir : ${activity.toBring.join(", ").toLowerCase()}`,
    `Nous serons ${booking.participants}. Réf. ${booking.reference}`,
  ].join("\n");

  const share = async () => {
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: `${activity.title} · Échappée`, text });
        track("share_booking", { method: "native", booking_reference: booking.reference });
        return;
      }
      await navigator.clipboard.writeText(text);
      setFeedback("copied");
      track("share_booking", { method: "clipboard", booking_reference: booking.reference });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return; // partage annulé
      setFeedback("manual");
    }
  };

  return (
    <section className="booking-panel" aria-labelledby="partager">
      <h2 id="partager" style={{ fontSize: "1.5rem" }}>
        Préviens ton groupe
      </h2>
      <p>Envoie l'essentiel à tes participants : lieu, heure et ce qu'il faut prévoir.</p>
      <button type="button" className="btn btn-primary" onClick={share}>
        <Icon name="people" /> Partager les infos
      </button>
      {feedback === "copied" && <p role="status">Infos copiées : colle-les dans ta conversation de groupe.</p>}
      {feedback === "manual" && (
        <label className="field">
          <span className="field-label">Copie ce texte :</span>
          <textarea readOnly rows={5} value={text} style={{ font: "inherit", padding: "0.5rem" }} />
        </label>
      )}
    </section>
  );
}

/** Relance saisonnière, en miniature : on propose une activité d'un autre type, qui a encore des places. */
function pickSuggestion(booked: Activity, availability: Record<string, number>): Activity | undefined {
  const others = catalog.activities.filter((a) => a.id !== booked.id && !isActivityFull(catalog, availability, a.id));
  return others.find((a) => a.weatherDependent !== booked.weatherDependent) ?? others[0];
}
