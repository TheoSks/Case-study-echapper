import { useEffect, useState } from "react";
import { track } from "../analytics/track";
import { ActivityImage } from "../components/ActivityImage";
import { Icon } from "../components/Icon";
import { catalog } from "../data/catalog";
import { errorMessage, validateBooking } from "../domain/booking";
import type { BookingError, BookingRequest } from "../domain/types";
import { capitalize, formatDate, formatPrice, formatTime, plural } from "../lib/format";
import { href, navigate, withQuery, type Route } from "../router";
import { bookingStore, useBookingState } from "../state/store";

export function SummaryPage({ draftId, route }: { draftId: string; route: Route }) {
  const state = useBookingState();
  const request: BookingRequest = {
    draftId,
    activityId: route.query.get("activite") ?? "",
    slotId: route.query.get("creneau") ?? "",
    participants: route.query.get("participants") ?? "",
  };

  // Ce que l'utilisateur a choisi, vérifié à l'arrivée sur le récapitulatif.
  // La confirmation, elle, revérifie contre l'état des places au moment du clic.
  const [initial] = useState(() => validateBooking(catalog, bookingStore.getState(), request));
  const [errors, setErrors] = useState<BookingError[]>(initial.ok ? [] : initial.errors);
  const [submitting, setSubmitting] = useState(false);
  const [simulated, setSimulated] = useState(false);
  const alreadyConfirmed = state.bookings[draftId];

  useEffect(() => {
    if (initial.ok && !alreadyConfirmed) {
      track("view_summary", {
        activity_id: request.activityId,
        slot_id: request.slotId,
        participants: initial.value.participants,
        value: initial.value.totalCents / 100,
        currency: "EUR",
      });
    } else if (!initial.ok) {
      track("booking_error", { step: "summary", error_code: initial.errors[0].code });
    }
  }, []);

  const backToActivity = (() => {
    const activity = catalog.activities.find((a) => a.id === request.activityId);
    return activity
      ? withQuery(`/activites/${activity.slug}`, {
          creneau: request.slotId,
          participants: String(request.participants),
        })
      : "/";
  })();

  if (alreadyConfirmed) {
    return (
      <div className="narrow">
        <h1 tabIndex={-1}>Cette réservation est déjà confirmée.</h1>
        <p>Elle n'a été comptée qu'une fois. Tu peux retrouver son récapitulatif.</p>
        <div className="actions">
          <a className="btn btn-primary" href={href(`/confirmation/${alreadyConfirmed.reference}`)}>
            Voir le récapitulatif
          </a>
          <a className="btn btn-secondary" href={href("/")}>
            Toutes les activités
          </a>
        </div>
      </div>
    );
  }

  if (!initial.ok) {
    return (
      <div className="narrow">
        <h1 tabIndex={-1}>Cette réservation ne peut pas être poursuivie.</h1>
        <ErrorList errors={errors} />
        <p>Rien n'a été enregistré et les disponibilités n'ont pas changé.</p>
        <div className="actions">
          <a className="btn btn-primary" href={href(backToActivity)}>
            Modifier ma sélection
          </a>
        </div>
      </div>
    );
  }

  const { activity, slot, participants, unitPriceCents, totalCents } = initial.value;

  const confirm = () => {
    if (submitting) return;
    setSubmitting(true);
    const result = bookingStore.confirm(request);
    if (result.ok) {
      if (!result.alreadyConfirmed) {
        track("booking_confirmed", {
          booking_reference: result.booking.reference,
          activity_id: result.booking.activityId,
          slot_id: result.booking.slotId,
          participants: result.booking.participants,
          value: result.booking.totalCents / 100,
          currency: "EUR",
        });
      }
      navigate(`/confirmation/${result.booking.reference}`, { replace: true });
      return;
    }
    setErrors(result.errors);
    track("booking_error", { step: "confirm", error_code: result.errors[0].code, slot_id: request.slotId });
    setSubmitting(false);
  };

  return (
    <div className="narrow">
      <p className="steps">Étape 2 sur 2 · Récapitulatif</p>
      <h1 tabIndex={-1}>Vérifie ta réservation</h1>

      <section className="summary" aria-label="Récapitulatif de la réservation">
        <div className="summary-head">
          <ActivityImage activity={activity} sizes="80px" />
          <div>
            <h2 style={{ fontSize: "1.5rem" }}>{activity.title}</h2>
            <p className="muted">{activity.meetingPoint}</p>
          </div>
        </div>
        <dl>
          <div>
            <dt>Créneau</dt>
            <dd>
              {capitalize(formatDate(slot.startsAt))} · {formatTime(slot.startsAt)}
            </dd>
          </div>
          <div>
            <dt>Participants</dt>
            <dd>{plural(participants, "participant")}</dd>
          </div>
          <div>
            <dt>Prix par personne</dt>
            <dd>{formatPrice(unitPriceCents)} TTC</dd>
          </div>
          <div className="summary-total">
            <dt>Total TTC</dt>
            <dd>{formatPrice(totalCents)}</dd>
          </div>
        </dl>
      </section>

      {errors.length > 0 && (
        <div className="notice notice--full" role="alert">
          <strong>La réservation n'a pas pu être confirmée.</strong>
          <ErrorList errors={errors} />
          <p>Rien n'a été enregistré et les disponibilités n'ont pas changé.</p>
          <a href={href(backToActivity)}>Modifier ma sélection</a>
        </div>
      )}

      <div className="notice">
        <strong>Réservation simulée</strong>
        <p>
          En confirmant, aucun paiement n'est effectué, aucun email n'est envoyé et aucune donnée personnelle
          n'est collectée. Seules les places de la démo sont mises à jour.
        </p>
        <p className="muted">
          Dans la version en ligne, cette étape demanderait ton prénom et ton email, puis le paiement.
        </p>
      </div>

      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={confirm} disabled={submitting} aria-busy={submitting}>
          Confirmer la réservation
        </button>
        <a className="btn btn-secondary" href={href(backToActivity)}>
          Modifier
        </a>
      </div>

      <details className="demo-tools">
        <summary>Outils de démo · revérification à la confirmation</summary>
        <p>
          Simule un autre client qui réserve les dernières places de ce créneau pendant que tu es sur cette page.
          Clique ensuite sur « Confirmer » : la réservation est refusée, rien n'est enregistré.
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            bookingStore.fillSlot(slot.id);
            setSimulated(true);
          }}
          disabled={simulated}
        >
          Simuler : le créneau devient complet
        </button>
        {simulated && (
          <p role="status" style={{ marginTop: "0.5rem" }}>
            Le créneau est maintenant complet. Clique sur « Confirmer la réservation ».
          </p>
        )}
      </details>
    </div>
  );
}

function ErrorList({ errors }: { errors: BookingError[] }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
      {errors.map((e) => (
        <li key={e.code} className="error">
          <Icon name="alert" /> {errorMessage(e)}
        </li>
      ))}
    </ul>
  );
}
