import type {
  Activity,
  Availability,
  Booking,
  BookingError,
  BookingRequest,
  BookingState,
  Catalog,
  Slot,
} from "./types";

export type ParticipantsResult =
  | { ok: true; value: number }
  | { ok: false; error: Extract<BookingError, { code: "participants_not_integer" | "participants_too_low" }> };

/**
 * Règle : un nombre entier de participants strictement supérieur à zéro.
 * Accepte un nombre ou une saisie texte ("3", " 3 "). Refuse 0, négatifs, décimaux, texte, vide.
 */
export function parseParticipants(raw: unknown): ParticipantsResult {
  let value: number;
  if (typeof raw === "number") {
    value = raw;
  } else if (typeof raw === "string" && /^\s*-?\d+\s*$/.test(raw)) {
    value = Number(raw.trim());
  } else {
    return { ok: false, error: { code: "participants_not_integer" } };
  }
  if (!Number.isSafeInteger(value)) return { ok: false, error: { code: "participants_not_integer" } };
  if (value < 1) return { ok: false, error: { code: "participants_too_low" } };
  return { ok: true, value };
}

export function remainingFor(availability: Availability, slotId: string): number {
  return availability[slotId] ?? 0;
}

export function slotsOf(catalog: Catalog, activityId: string): Slot[] {
  return catalog.slots
    .filter((s) => s.activityId === activityId)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/** Une activité est complète quand aucun de ses créneaux n'a de place. Elle reste consultable. */
export function isActivityFull(catalog: Catalog, availability: Availability, activityId: string): boolean {
  return slotsOf(catalog, activityId).every((s) => remainingFor(availability, s.id) <= 0);
}

export function nextAvailableSlot(
  catalog: Catalog,
  availability: Availability,
  activityId: string,
  participants = 1,
): Slot | undefined {
  return slotsOf(catalog, activityId).find((s) => remainingFor(availability, s.id) >= participants);
}

export function totalCents(unitPriceCents: number, participants: number): number {
  return unitPriceCents * participants;
}

/** Paiement partagé : délai laissé aux participants (hypothèse, question Q13 au client). */
export const SHARE_DEADLINE_HOURS = 48;
/** Toutes les parts doivent être réglées au plus tard ce délai avant le début de l'activité. */
export const SHARE_CUTOFF_HOURS = 24;
const HOUR = 3_600_000;

/**
 * Échéance des parts : 48 h après la réservation, mais jamais après « 24 h avant l'activité ».
 * Sans cette borne, une réservation la veille donnerait une échéance postérieure à la sortie.
 */
export function shareDeadline(confirmedAt: string, startsAt: string): string {
  const afterBooking = new Date(confirmedAt).getTime() + SHARE_DEADLINE_HOURS * HOUR;
  const beforeActivity = new Date(startsAt).getTime() - SHARE_CUTOFF_HOURS * HOUR;
  return new Date(Math.min(afterBooking, beforeActivity)).toISOString();
}

/** Le paiement partagé n'est proposé que s'il reste du temps pour régler avant l'échéance. */
export function canSplitPayment(now: Date, startsAt: string): boolean {
  return new Date(startsAt).getTime() - SHARE_CUTOFF_HOURS * HOUR > now.getTime();
}

export interface ValidBooking {
  activity: Activity;
  slot: Slot;
  participants: number;
  remaining: number;
  unitPriceCents: number;
  totalCents: number;
}

export type ValidationResult = { ok: true; value: ValidBooking } | { ok: false; errors: BookingError[] };

/** Vérifie toutes les règles métier d'une demande, contre l'état des places au moment de l'appel. */
export function validateBooking(catalog: Catalog, state: BookingState, request: BookingRequest): ValidationResult {
  const activity = catalog.activities.find((a) => a.id === request.activityId);
  if (!activity) return { ok: false, errors: [{ code: "unknown_activity" }] };

  const slot = catalog.slots.find((s) => s.id === request.slotId);
  if (!slot) return { ok: false, errors: [{ code: "unknown_slot" }] };
  if (slot.activityId !== activity.id) return { ok: false, errors: [{ code: "slot_mismatch" }] };

  const remaining = remainingFor(state.availability, slot.id);
  if (remaining <= 0) return { ok: false, errors: [{ code: "slot_full" }] };

  const parsed = parseParticipants(request.participants);
  if (!parsed.ok) return { ok: false, errors: [parsed.error] };
  if (parsed.value > remaining) {
    return { ok: false, errors: [{ code: "participants_exceed_remaining", remaining }] };
  }

  return {
    ok: true,
    value: {
      activity,
      slot,
      participants: parsed.value,
      remaining,
      unitPriceCents: activity.pricePerPersonCents,
      totalCents: totalCents(activity.pricePerPersonCents, parsed.value),
    },
  };
}

export type ConfirmResult =
  | { ok: true; state: BookingState; booking: Booking; alreadyConfirmed: boolean }
  | { ok: false; state: BookingState; errors: BookingError[] };

/**
 * Confirme une réservation.
 * - Revérifie toutes les règles au moment de confirmer.
 * - Ne déduit les places que du créneau choisi.
 * - Idempotente : une même demande (même draftId) ne décompte qu'une fois.
 * - En cas d'erreur, renvoie l'état d'origine, inchangé.
 */
export function confirmBooking(
  catalog: Catalog,
  state: BookingState,
  request: BookingRequest,
  context: { now: Date; reference: string },
): ConfirmResult {
  const existing = state.bookings[request.draftId];
  if (existing) return { ok: true, state, booking: existing, alreadyConfirmed: true };

  const validation = validateBooking(catalog, state, request);
  if (!validation.ok) return { ok: false, state, errors: validation.errors };

  const { slot, participants, remaining, unitPriceCents, totalCents: total } = validation.value;
  const booking: Booking = {
    reference: context.reference,
    draftId: request.draftId,
    activityId: request.activityId,
    slotId: slot.id,
    participants,
    unitPriceCents,
    totalCents: total,
    // Le partage n'a de sens qu'à plusieurs ; il ne change ni le total ni le décompte des places.
    // Trop près de l'activité pour laisser à chacun le temps de régler : l'organisateur règle tout.
    paymentMode:
      request.paymentMode === "split" && participants > 1 && canSplitPayment(context.now, slot.startsAt)
        ? "split"
        : "organizer",
    confirmedAt: context.now.toISOString(),
  };

  return {
    ok: true,
    alreadyConfirmed: false,
    booking,
    state: {
      availability: { ...state.availability, [slot.id]: remaining - participants },
      bookings: { ...state.bookings, [request.draftId]: booking },
    },
  };
}

export function initialState(catalog: Catalog): BookingState {
  return {
    availability: Object.fromEntries(catalog.slots.map((s) => [s.id, s.initialRemaining])),
    bookings: {},
  };
}

export function findBookingByReference(state: BookingState, reference: string): Booking | undefined {
  return Object.values(state.bookings).find((b) => b.reference === reference);
}

/** Message lisible pour chaque erreur métier (tutoiement, selon le guide de marque). */
export function errorMessage(error: BookingError): string {
  switch (error.code) {
    case "unknown_activity":
      return "Cette activité n'existe pas.";
    case "unknown_slot":
      return "Ce créneau n'existe pas.";
    case "slot_mismatch":
      return "Ce créneau ne correspond pas à cette activité.";
    case "slot_full":
      return "Ce créneau est complet. Choisis un autre créneau.";
    case "participants_not_integer":
      return "Indique un nombre entier de participants.";
    case "participants_too_low":
      return "Il faut au moins 1 participant.";
    case "participants_exceed_remaining":
      return `Il reste ${error.remaining} ${error.remaining > 1 ? "places" : "place"} sur ce créneau.`;
  }
}
