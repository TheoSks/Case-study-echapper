import { useEffect, useRef, useState } from "react";
import { track } from "../analytics/track";
import { ActivityImage } from "../components/ActivityImage";
import { ActivityCard } from "../components/ActivityCard";
import { Icon } from "../components/Icon";
import { ParticipantsInput } from "../components/ParticipantsInput";
import { DatePicker } from "../components/DatePicker";
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
import { formatDate, formatDuration, formatPrice, formatTime, plural } from "../lib/format";
import { MAX_MONTH, MIN_MONTH, dayStatus, nextAvailableDay, slotsOn } from "../lib/availability";
import { dayKey, formatDay, monthKey } from "../lib/dates";
import { randomId } from "../lib/ids";
import { pageUrl, shareOrCopy } from "../lib/share";
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

  // Date : celle de la recherche si elle a des horaires, sinon le premier jour qui convient au groupe.
  const groupForDate = parseParticipants(participants);
  const [day, setDay] = useState<string | null>(() => {
    // Activité complète : aucun jour présélectionné (un jour « sélectionné et barré » serait contradictoire).
    if (isActivityFull(catalog, state.availability, activity.id)) return null;
    const fromSlot = initialSlot ? slots.find((s) => s.id === initialSlot) : undefined;
    if (fromSlot) return dayKey(fromSlot.startsAt);
    const requested = route.query.get("date");
    if (requested && slotsOn(requested, [activity.id]).length > 0) return requested;
    const size = groupForDate.ok ? groupForDate.value : 1;
    return (
      nextAvailableDay(state.availability, [activity.id], size) ??
      nextAvailableDay(state.availability, [activity.id], 1) ??
      (slots[0] ? dayKey(slots[0].startsAt) : null)
    );
  });
  const [month, setMonth] = useState(() => monthKey(day ?? (slots[0] ? dayKey(slots[0].startsAt) : `${MIN_MONTH}-01`)));
  const daySlots = day ? slotsOn(day, [activity.id]) : [];
  const selectDay = (next: string) => {
    setDay(next);
    setSlotId(null);
  };
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
    ? "Cet horaire vient d'être complet. Choisis-en un autre."
    : submitted && !slotId && !full
      ? "Choisis un horaire pour continuer."
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

  // Avant de réserver, l'organisateur cherche souvent l'accord de son groupe.
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  // Si un horaire est choisi, le lien l'emporte : chacun arrive sur le même créneau,
  // qu'on réserve ensuite pour tout le groupe ou chacun de son côté.
  const proposeToGroup = async () => {
    const chosen = slotId ? slots.find((s) => s.id === slotId) : undefined;
    const when = chosen
      ? ` ${formatDate(chosen.startsAt)} à ${formatTime(chosen.startsAt)} (il reste ${plural(remainingFor(state.availability, chosen.id), "place")})`
      : "";
    const outcome = await shareOrCopy({
      title: `${activity.title} · Échappée`,
      text: `Ça vous dit ? ${activity.title}${when}, à ${activity.location}, ${formatDuration(activity.durationMinutes)}, ${formatPrice(activity.pricePerPersonCents)} par personne.`,
      url: pageUrl(
        chosen ? withQuery(`/activites/${activity.slug}`, { creneau: chosen.id }) : `/activites/${activity.slug}`,
      ),
    });
    if (outcome === "native" || outcome === "copied")
      track("share_activity", { method: outcome, activity_id: activity.id, slot_id: chosen?.id });
    setShareFeedback(
      outcome === "copied" ? "Lien copié : colle-le dans ta conversation de groupe." : outcome === "failed" ? "Le partage n'est pas disponible sur ce navigateur." : null,
    );
  };

  const alternatives = catalog.activities.filter(
    (a) => a.id !== activity.id && !isActivityFull(catalog, state.availability, a.id),
  );

  const capacity = Math.max(...slots.map((s) => s.capacity));
  const ready = Boolean(slotId && validation?.ok);
  const showPanel = () => {
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const others = catalog.activities.filter((a) => a.id !== activity.id);

  return (
    <div className="container activity-page">
      <a className="link-back" href={href(withQuery("/", { participants }))}>
        <Icon name="arrow" /> Toutes les activités
      </a>

      <div className="activity-hero">
        <ActivityImage activity={activity} sizes="(min-width: 72rem) 72rem, 100vw" eager />
      </div>

      <header className="activity-head">
        <div className="activity-title">
          <span className="category">
            <Icon name={activity.icon} /> {activity.categoryLabel}
          </span>
          <h1 tabIndex={-1}>{activity.title}</h1>
          <p className="lead">{activity.tagline}</p>
        </div>
        <div className="activity-share">
          <button type="button" className="btn btn-secondary" onClick={proposeToGroup}>
            <Icon name="people" /> Proposer à ton groupe
          </button>
          {shareFeedback && (
            <p role="status" className="field-hint">
              {shareFeedback}
            </p>
          )}
        </div>
      </header>

      <ul className="highlights" aria-label="En bref">
        <li>
          <Icon name="pin" /> {activity.location}
        </li>
        <li>
          <Icon name="clock" /> {formatDuration(activity.durationMinutes)}
        </li>
        <li>
          <Icon name="people" /> Jusqu'à {capacity} par créneau
        </li>
        <li>
          <Icon name="heart" /> Dès {activity.minAge} ans
        </li>
        <li>
          <Icon name="explore" /> En français
        </li>
        {activity.weatherDependent && (
          <li>
            <Icon name="calendar" /> D'avril à octobre
          </li>
        )}
      </ul>

      <div className={`activity-layout${full ? "" : " has-sticky-bar"}`}>
        <div className="activity-content">
          <section className="content-block" aria-labelledby="vivre">
            <h2 id="vivre">Ce que tu vas vivre</h2>
            <p>{activity.description}</p>
            <ul className="check-list">
              {activity.experience.map((item) => (
                <li key={item}>
                  <Icon name="check" /> {item}
                </li>
              ))}
            </ul>
          </section>

          <div className="two-cols">
            <section className="content-block" aria-labelledby="inclus">
              <h2 id="inclus">Inclus</h2>
              <ul className="check-list">
                {activity.included.map((item) => (
                  <li key={item}>
                    <Icon name="check" /> {item}
                  </li>
                ))}
              </ul>
            </section>
            <section className="content-block" aria-labelledby="prevoir">
              <h2 id="prevoir">À prévoir</h2>
              <ul className="check-list">
                {activity.toBring.map((item) => (
                  <li key={item}>
                    <Icon name="arrow" /> {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="content-block" aria-labelledby="rdv">
            <h2 id="rdv">Où se retrouver</h2>
            <div className="meeting-card">
              <span className="next-step-icon">
                <Icon name="pin" />
              </span>
              <div>
                <p className="meeting-place">{activity.meetingPoint}</p>
                <p className="muted">
                  {activity.location} · Arrive 10 minutes avant le début. L'itinéraire détaillé accompagnera la
                  confirmation dans la version en ligne.
                </p>
              </div>
            </div>
          </section>

          <section className="content-block" aria-labelledby="savoir">
            <h2 id="savoir">À savoir</h2>
            <dl className="know-list">
              <div>
                <dt>
                  <Icon name="people" /> Participants
                </dt>
                <dd>
                  Dès {activity.minAge} ans, jusqu'à {capacity} par créneau. Au-delà de 10, une demande de devis sera
                  proposée.
                </dd>
              </div>
              {activity.weatherDependent && (
                <div>
                  <dt>
                    <Icon name="explore" /> Météo
                  </dt>
                  <dd>Activité en extérieur, maintenue selon la météo. Les conditions de report seront précisées dans la version en ligne.</dd>
                </div>
              )}
              <div>
                <dt>
                  <Icon name="calendar" /> Annulation
                </dt>
                <dd>Conditions d'annulation et de report précisées dans la version en ligne.</dd>
              </div>
              <div>
                <dt>
                  <Icon name="heart" /> Accessibilité
                </dt>
                <dd>Une question sur l'accès ? L'équipe répond avant la réservation (version en ligne).</dd>
              </div>
            </dl>
          </section>
        </div>

        <aside className="booking-panel" ref={panelRef} aria-labelledby="booking-title" id="reserver">
          <div>
            {!full && <p className="steps">Étape 1 sur 2 · Date, horaire et participants</p>}
            <h2 id="booking-title">Réserver</h2>
            <p className="panel-price">
              <strong>{formatPrice(activity.pricePerPersonCents)}</strong> par personne, TTC
            </p>
          </div>

          {full && (
            <div className="notice notice--full" role="status">
              <strong>Cette activité est complète sur toutes les dates proposées.</strong>
              <p>Toutes ses dates affichent complet. Tu peux découvrir une autre sortie :</p>
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

          <div className="field">
            <p className="field-label" id="date-label">
              Choisis une date
            </p>
            <DatePicker
              month={month}
              onMonthChange={setMonth}
              selected={day}
              onSelect={selectDay}
              statusOf={(d) => {
                const st = dayStatus(state.availability, [activity.id], d, 1);
                // Un jour avec des places mais pas assez pour le groupe reste sélectionnable : le nombre se modifie.
                return st === "short" ? "few" : st;
              }}
              minMonth={MIN_MONTH}
              maxMonth={MAX_MONTH}
            />
          </div>

          {day && daySlots.length > 0 && (
            <SlotPicker
              legend={`Horaires du ${formatDay(day)}`}
              timeOnly
              slots={daySlots}
              availability={state.availability}
              selectedId={slotId}
              onSelect={selectSlot}
              error={slotError}
              groupSize={parsedParticipants.ok ? parsedParticipants.value : null}
            />
          )}

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
              <p className="field-hint panel-reassure">Réservation simulée : rien n'est payé à cette étape.</p>
            </>
          )}
        </aside>
      </div>

      <section className="section" aria-labelledby="aussi">
        <div className="section-head">
          <h2 id="aussi">D'autres échappées</h2>
          <p className="muted">Une autre envie, une autre saison : prolonge la sortie.</p>
        </div>
        <ul className="cards">
          {others.map((a) => (
            <li key={a.id}>
              <ActivityCard
                activity={a}
                availability={state.availability}
                groupSize={parsedParticipants.ok ? parsedParticipants.value : null}
                date=""
              />
            </li>
          ))}
        </ul>
      </section>

      {!full && (
        <div className="sticky-bar">
          <div>
            {ready && total !== null ? (
              <>
                <span className="muted" style={{ fontSize: "0.875rem" }}>
                  Total TTC
                </span>
                <div className="total-amount">{formatPrice(total)}</div>
              </>
            ) : (
              <>
                <span className="muted" style={{ fontSize: "0.875rem" }}>
                  Dès
                </span>
                <div className="total-amount">
                  {formatPrice(activity.pricePerPersonCents)} <small>/ pers.</small>
                </div>
              </>
            )}
          </div>
          {ready ? (
            <button type="button" className="btn btn-primary" onClick={startBooking}>
              Réserver
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={showPanel}>
              Choisir une date
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function participantError(errors: BookingError[]): string | undefined {
  const error = errors.find((e) => e.code.startsWith("participants"));
  return error ? errorMessage(error) : undefined;
}
