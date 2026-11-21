import { useEffect, useRef, useState } from "react";
import { track } from "../analytics/track";
import { ActivityImage } from "../components/ActivityImage";
import { Icon } from "../components/Icon";
import { ParticipantsInput } from "../components/ParticipantsInput";
import { SlotPicker } from "../components/SlotPicker";
import { catalog } from "../data/catalog";
import {
  errorMessage,
  isActivityFull,
  nextAvailableSlot,
  parseParticipants,
  remainingFor,
  slotsOf,
  totalCents,
  validateBooking,
} from "../domain/booking";
import type { Activity, BookingError } from "../domain/types";
import { formatDuration, formatPrice } from "../lib/format";
import { randomId } from "../lib/ids";
import { href, navigate, withQuery, type Route } from "../router";
import { useBookingState } from "../state/store";

export function ActivityPage({ activity, route }: { activity: Activity; route: Route }) {
  const state = useBookingState();
  const slots = slotsOf(catalog, activity.id);
  const full = isActivityFull(catalog, state.availability, activity.id);

  const initialSlot = route.query.get("creneau");
  const [slotId, setSlotId] = useState<string | null>(
    initialSlot && slots.some((s) => s.id === initialSlot && remainingFor(state.availability, s.id) > 0)
      ? initialSlot
      : null,
  );
  const [participants, setParticipants] = useState(route.query.get("participants") ?? "2");
  const [submitted, setSubmitted] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    track("view_item", { activity_id: activity.id, activity_name: activity.title, full });
  }, [activity.id]);

  // Validation en direct, avec les mêmes règles que la confirmation.
  const validation = slotId
    ? validateBooking(catalog, state, { draftId: "", activityId: activity.id, slotId, participants })
    : null;
  const parsedParticipants = parseParticipants(participants);
  const participantsError = !parsedParticipants.ok
    ? errorMessage(parsedParticipants.error)
    : validation && !validation.ok
      ? participantError(validation.errors)
      : undefined;
  const slotBecameFull = validation && !validation.ok && validation.errors.some((e) => e.code === "slot_full");
  const slotError = slotBecameFull
    ? "Ce créneau vient d'être complet. Choisis un autre créneau."
    : submitted && !slotId && !full
      ? "Choisis un créneau pour continuer."
      : undefined;
  // Le total est visible dès que le nombre de participants est valide, même avant le choix du créneau.
  const total = validation
    ? validation.ok
      ? validation.value.totalCents
      : null
    : parsedParticipants.ok
      ? totalCents(activity.pricePerPersonCents, parsedParticipants.value)
      : null;
  const max = slotId ? remainingFor(state.availability, slotId) : 10;

  const selectSlot = (id: string) => {
    setSlotId(id);
    track("select_slot", { activity_id: activity.id, slot_id: id });
  };

  // Démarrage de la réservation = validation du créneau ET du nombre de participants.
  const startBooking = () => {
    setSubmitted(true);
    if (!slotId || !validation?.ok) {
      track("booking_error", {
        step: "activity",
        activity_id: activity.id,
        error_code: !slotId ? "slot_missing" : validation && !validation.ok ? validation.errors[0].code : "unknown",
      });
      panelRef.current?.scrollIntoView({ block: "start" });
      return;
    }
    const draftId = randomId();
    track("begin_checkout", {
      activity_id: activity.id,
      slot_id: slotId,
      participants: validation.value.participants,
      value: validation.value.totalCents / 100,
      currency: "EUR",
    });
    navigate(
      withQuery(`/reservation/${draftId}`, {
        activite: activity.id,
        creneau: slotId,
        participants: validation.value.participants,
      }),
    );
  };

  const alternatives = catalog.activities.filter(
    (a) => a.id !== activity.id && !isActivityFull(catalog, state.availability, a.id),
  );

  return (
    <div className="container">
      <a className="link-back" href={href(withQuery("/", { participants }))}>
        <Icon name="arrow" /> Toutes les activités
      </a>

      <div className="activity-hero">
        <ActivityImage activity={activity} sizes="(min-width: 72rem) 72rem, 100vw" eager />
      </div>

      <header className="activity-head">
        <span className="category">
          <Icon name={activity.icon} /> {activity.categoryLabel}
        </span>
        <h1 tabIndex={-1}>{activity.title}</h1>
        <p className="lead">{activity.tagline}</p>
      </header>

      <div className={`activity-layout${full ? "" : " has-sticky-bar"}`}>
        <aside className="booking-panel" ref={panelRef} aria-labelledby="booking-title" id="reserver">
          <h2 id="booking-title">Réserver</h2>

          {full && (
            <div className="notice notice--full" role="status">
              <strong>Cette activité est complète sur toutes les dates proposées.</strong>
              <p>Les créneaux ci-dessous n'ont plus de place. Tu peux découvrir une autre sortie :</p>
              {alternatives.length > 0 && (
                <ul>
                  {alternatives.map((a) => {
                    const next = nextAvailableSlot(catalog, state.availability, a.id);
                    return (
                      <li key={a.id}>
                        <a href={href(withQuery(`/activites/${a.slug}`, { participants }))}>{a.title}</a>
                        {next ? ` · ${a.location}` : ""}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          <SlotPicker
            slots={slots}
            availability={state.availability}
            selectedId={slotId}
            onSelect={selectSlot}
            error={slotError}
          />

          {!full && (
            <>
              <ParticipantsInput value={participants} onChange={setParticipants} max={max} error={participantsError} />
              <div className="total" aria-live="polite">
                <span>
                  Total TTC
                  <br />
                  <span className="muted" style={{ fontSize: "0.875rem" }}>
                    {formatPrice(activity.pricePerPersonCents)} × {total !== null ? participants.trim() : "…"}
                  </span>
                </span>
                <span className="total-amount">{total !== null ? formatPrice(total) : "—"}</span>
              </div>
              <button type="button" className="btn btn-primary btn-block" onClick={startBooking}>
                Réserver <Icon name="arrow" />
              </button>
            </>
          )}
        </aside>

        <div>
          <dl className="key-facts">
            <div>
              <dt>
                <Icon name="pin" /> Lieu
              </dt>
              <dd>{activity.meetingPoint}</dd>
            </div>
            <div>
              <dt>
                <Icon name="clock" /> Durée
              </dt>
              <dd>{formatDuration(activity.durationMinutes)}</dd>
            </div>
            <div>
              <dt>
                <Icon name="people" /> Âge minimum
              </dt>
              <dd>{activity.minAge} ans</dd>
            </div>
            <div>
              <dt>Prix</dt>
              <dd>{formatPrice(activity.pricePerPersonCents)} par personne, TTC</dd>
            </div>
          </dl>

          {activity.weatherDependent && (
            <div className="notice" style={{ marginTop: "1rem" }}>
              <strong>Activité en extérieur</strong>
              <p>Elle dépend de la météo. Les conditions de report seront précisées dans la version en ligne.</p>
            </div>
          )}

          <section className="content-block" aria-labelledby="vivre">
            <h2 id="vivre">Ce que tu vas vivre</h2>
            <p>{activity.description}</p>
            <ul>
              {activity.experience.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="content-block" aria-labelledby="inclus">
            <h2 id="inclus">Inclus</h2>
            <ul>
              {activity.included.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="content-block" aria-labelledby="prevoir">
            <h2 id="prevoir">À prévoir</h2>
            <ul>
              {activity.toBring.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {!full && (
        <div className="sticky-bar">
          <div>
            <span className="muted" style={{ fontSize: "0.875rem" }}>
              Total TTC
            </span>
            <div className="total-amount">{total !== null ? formatPrice(total) : "—"}</div>
          </div>
          <button type="button" className="btn btn-primary" onClick={startBooking}>
            Réserver
          </button>
        </div>
      )}
    </div>
  );
}

function participantError(errors: BookingError[]): string | undefined {
  const error = errors.find((e) => e.code.startsWith("participants"));
  return error ? errorMessage(error) : undefined;
}
