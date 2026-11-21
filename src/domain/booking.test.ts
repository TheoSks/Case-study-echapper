import { describe, expect, it } from "vitest";
import { catalog } from "../data/catalog";
import {
  confirmBooking,
  initialState,
  isActivityFull,
  parseParticipants,
  validateBooking,
} from "./booking";
import type { BookingRequest, BookingState } from "./types";

// Données de la démo : a01-s1 = 6 places, a01-s2 = 2 places, a02-s1 = 7 places,
// a02-s2 = complet, a03 (escape game) = complet sur ses deux créneaux.
const ctx = (reference = "ECH-TEST01") => ({ now: new Date("2027-04-01T10:00:00Z"), reference });
const request = (overrides: Partial<BookingRequest> = {}): BookingRequest => ({
  draftId: "draft-1",
  activityId: "a02",
  slotId: "a02-s1",
  participants: 2,
  ...overrides,
});

describe("Règle : un nombre entier de participants supérieur à zéro", () => {
  it.each([
    [1, 1],
    [3, 3],
    ["4", 4],
    [" 5 ", 5],
    ["03", 3],
  ])("accepte %j", (raw, expected) => {
    expect(parseParticipants(raw)).toEqual({ ok: true, value: expected });
  });

  it.each([0, "0", -1, "-1"])("refuse %j (au moins 1 participant)", (raw) => {
    expect(parseParticipants(raw)).toEqual({ ok: false, error: { code: "participants_too_low" } });
  });

  it.each([2.5, "2.5", "2,5", "abc", "", "  ", "1e2", null, undefined, Number.NaN, Number.POSITIVE_INFINITY])(
    "refuse %j (pas un entier)",
    (raw) => {
      expect(parseParticipants(raw)).toEqual({ ok: false, error: { code: "participants_not_integer" } });
    },
  );
});

describe("Règle : ne pas dépasser les places restantes", () => {
  const state = initialState(catalog);

  it("accepte exactement le nombre de places restantes", () => {
    const result = validateBooking(catalog, state, request({ activityId: "a01", slotId: "a01-s2", participants: 2 }));
    expect(result.ok).toBe(true);
  });

  it("refuse une place de plus que le restant, en indiquant le restant", () => {
    const result = validateBooking(catalog, state, request({ activityId: "a01", slotId: "a01-s2", participants: 3 }));
    expect(result).toEqual({ ok: false, errors: [{ code: "participants_exceed_remaining", remaining: 2 }] });
  });
});

describe("Règle : un créneau complet ne peut pas être réservé", () => {
  it("refuse un créneau complet", () => {
    const result = validateBooking(catalog, initialState(catalog), request({ slotId: "a02-s2", participants: 1 }));
    expect(result).toEqual({ ok: false, errors: [{ code: "slot_full" }] });
  });

  it("revérifie au moment de confirmer : un créneau devenu complet est refusé", () => {
    const state = initialState(catalog);
    // Validation au moment du récapitulatif : OK.
    expect(validateBooking(catalog, state, request()).ok).toBe(true);
    // Entre-temps, le créneau se remplit (autre client, autre canal).
    const filled: BookingState = { ...state, availability: { ...state.availability, "a02-s1": 0 } };
    const result = confirmBooking(catalog, filled, request(), ctx());
    expect(result.ok).toBe(false);
    expect(result.state).toBe(filled);
  });

  it("revérifie au moment de confirmer : moins de places qu'au récapitulatif", () => {
    const state = initialState(catalog);
    const reduced: BookingState = { ...state, availability: { ...state.availability, "a02-s1": 1 } };
    const result = confirmBooking(catalog, reduced, request({ participants: 2 }), ctx());
    expect(result).toMatchObject({ ok: false, errors: [{ code: "participants_exceed_remaining", remaining: 1 }] });
  });
});

describe("Règle : une réservation porte sur un seul créneau, cohérent avec l'activité", () => {
  const state = initialState(catalog);

  it("refuse un créneau d'une autre activité", () => {
    expect(validateBooking(catalog, state, request({ activityId: "a01", slotId: "a02-s1" }))).toEqual({
      ok: false,
      errors: [{ code: "slot_mismatch" }],
    });
  });

  it("refuse une activité ou un créneau inconnus", () => {
    expect(validateBooking(catalog, state, request({ activityId: "zzz" })).ok).toBe(false);
    expect(validateBooking(catalog, state, request({ slotId: "zzz" })).ok).toBe(false);
  });
});

describe("Règle : le total TTC est connu avant confirmation", () => {
  it("calcule le total = prix unitaire TTC × participants", () => {
    const result = validateBooking(catalog, initialState(catalog), request({ participants: 3 }));
    expect(result.ok && result.value.totalCents).toBe(3 * 3900);
    expect(result.ok && result.value.unitPriceCents).toBe(3900);
  });
});

describe("Règle : après confirmation, déduire les places du seul créneau choisi", () => {
  it("déduit les places du créneau choisi et ne touche à aucun autre", () => {
    const before = initialState(catalog);
    const result = confirmBooking(catalog, before, request({ participants: 3 }), ctx());
    expect(result.ok).toBe(true);
    for (const slot of catalog.slots) {
      const expected = slot.id === "a02-s1" ? 7 - 3 : before.availability[slot.id];
      expect(result.state.availability[slot.id]).toBe(expected);
    }
  });

  it("enregistre une réservation avec le récapitulatif complet", () => {
    const result = confirmBooking(catalog, initialState(catalog), request({ participants: 2 }), ctx("ECH-ABC123"));
    expect(result.ok && result.booking).toMatchObject({
      reference: "ECH-ABC123",
      activityId: "a02",
      slotId: "a02-s1",
      participants: 2,
      unitPriceCents: 3900,
      totalCents: 7800,
    });
  });

  it("deux réservations distinctes se cumulent", () => {
    const first = confirmBooking(catalog, initialState(catalog), request({ draftId: "d1", participants: 3 }), ctx("R1"));
    const second = confirmBooking(catalog, first.state, request({ draftId: "d2", participants: 4 }), ctx("R2"));
    expect(second.state.availability["a02-s1"]).toBe(0);
    const third = confirmBooking(catalog, second.state, request({ draftId: "d3", participants: 1 }), ctx("R3"));
    expect(third).toMatchObject({ ok: false, errors: [{ code: "slot_full" }] });
  });
});

describe("Règle : une même confirmation ne décompte les places qu'une fois", () => {
  it("un double clic (même draftId) ne déduit qu'une fois et renvoie la même réservation", () => {
    const first = confirmBooking(catalog, initialState(catalog), request({ participants: 2 }), ctx("R1"));
    const second = confirmBooking(catalog, first.state, request({ participants: 2 }), ctx("R2"));
    expect(second.ok && second.alreadyConfirmed).toBe(true);
    expect(second.state).toBe(first.state);
    expect(second.state.availability["a02-s1"]).toBe(5);
    expect(second.ok && second.booking.reference).toBe("R1");
    expect(Object.keys(second.state.bookings)).toHaveLength(1);
  });
});

describe("Paiement partagé : chacun règle sa part", () => {
  it("bloque toutes les places du groupe en une fois, au même total TTC", () => {
    const result = confirmBooking(catalog, initialState(catalog), request({ participants: 3, paymentMode: "split" }), ctx());
    expect(result.ok && result.booking.paymentMode).toBe("split");
    expect(result.ok && result.booking.totalCents).toBe(3 * 3900);
    expect(result.state.availability["a02-s1"]).toBe(4);
  });

  it("seul, il n'y a rien à partager : l'organisateur règle", () => {
    const result = confirmBooking(catalog, initialState(catalog), request({ participants: 1, paymentMode: "split" }), ctx());
    expect(result.ok && result.booking.paymentMode).toBe("organizer");
  });

  it("par défaut, l'organisateur règle pour tout le groupe", () => {
    const result = confirmBooking(catalog, initialState(catalog), request(), ctx());
    expect(result.ok && result.booking.paymentMode).toBe("organizer");
  });
});

describe("Règle : une saisie invalide n'enregistre rien et ne modifie pas les disponibilités", () => {
  it.each([0, -3, 2.5, "abc", "", 99])("participants = %j : état strictement inchangé", (participants) => {
    const before = initialState(catalog);
    const snapshot = structuredClone(before);
    const result = confirmBooking(catalog, before, request({ participants }), ctx());
    expect(result.ok).toBe(false);
    expect(result.state).toBe(before);
    expect(before).toEqual(snapshot);
    expect(Object.keys(result.state.bookings)).toHaveLength(0);
  });
});

describe("Règle : une activité complète reste consultable", () => {
  it("l'escape game est complet, les autres activités non", () => {
    const state = initialState(catalog);
    expect(isActivityFull(catalog, state.availability, "a03")).toBe(true);
    expect(isActivityFull(catalog, state.availability, "a01")).toBe(false);
    expect(isActivityFull(catalog, state.availability, "a02")).toBe(false);
  });
});

describe("Données de démo", () => {
  it("3 activités ; les 6 créneaux de démonstration gardent leurs places", () => {
    expect(catalog.activities).toHaveLength(3);
    const demo = Object.fromEntries(
      ["a01-s1", "a01-s2", "a02-s1", "a02-s2", "a03-s1", "a03-s2"].map((id) => [id, catalog.slots.find((s) => s.id === id)?.initialRemaining]),
    );
    expect(demo).toEqual({ "a01-s1": 6, "a01-s2": 2, "a02-s1": 7, "a02-s2": 0, "a03-s1": 0, "a03-s2": 0 });
  });

  it("planning cohérent : capacité ≤ 10, places entre 0 et la capacité, identifiants uniques", () => {
    expect(new Set(catalog.slots.map((s) => s.id)).size).toBe(catalog.slots.length);
    for (const slot of catalog.slots) {
      expect(slot.capacity).toBeLessThanOrEqual(10);
      expect(slot.initialRemaining).toBeGreaterThanOrEqual(0);
      expect(slot.initialRemaining).toBeLessThanOrEqual(slot.capacity);
      expect(catalog.activities.some((a) => a.id === slot.activityId)).toBe(true);
    }
  });

  it("saisonnalité : la céramique toute l'année, le kayak d'avril à octobre", () => {
    const months = (activityId: string) =>
      new Set(catalog.slots.filter((s) => s.activityId === activityId).map((s) => s.startsAt.slice(0, 7)));
    expect(months("a01").size).toBeGreaterThanOrEqual(11);
    expect([...months("a02")].every((m) => m >= "2027-04" && m <= "2027-10")).toBe(true);
  });
});
