// Store de la démo : détient l'état des places et des réservations pendant la session.
// Persistance : sessionStorage. Les places survivent au rechargement de la page,
// et repartent de zéro à la fermeture de l'onglet (ou via « Réinitialiser la démo »).
// En production, cet état vivrait dans le moteur de réservation, côté serveur.
import { useSyncExternalStore } from "react";
import { confirmBooking, initialState, type ConfirmResult } from "../domain/booking";
import type { BookingRequest, BookingState, Catalog } from "../domain/types";
import { catalog } from "../data/catalog";
import { randomReference } from "../lib/ids";

const STORAGE_KEY = "echappee:demo:v1";

export interface BookingStore {
  getState(): BookingState;
  subscribe(listener: () => void): () => void;
  /** Confirme une réservation (revérification + idempotence portées par le domaine). */
  confirm(request: BookingRequest): ConfirmResult;
  /** Outil de démo : simule un autre client qui prend les dernières places d'un créneau. */
  fillSlot(slotId: string): void;
  /** Outil de démo : remet les places à leur valeur initiale et efface les réservations. */
  reset(): void;
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function isValidState(value: unknown, data: Catalog): value is BookingState {
  if (!value || typeof value !== "object") return false;
  const { availability, bookings } = value as Partial<BookingState>;
  if (!availability || typeof availability !== "object" || !bookings || typeof bookings !== "object") return false;
  return data.slots.every((slot) => {
    const remaining = (availability as Record<string, unknown>)[slot.id];
    return typeof remaining === "number" && Number.isInteger(remaining) && remaining >= 0 && remaining <= slot.capacity;
  });
}

export function createBookingStore(
  data: Catalog,
  storage: StorageLike | null,
  makeReference: () => string = randomReference,
): BookingStore {
  const load = (): BookingState => {
    try {
      const raw = storage?.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isValidState(parsed, data)) return parsed;
      }
    } catch {
      // Stockage indisponible ou corrompu : on repart des données initiales.
    }
    return initialState(data);
  };

  let state = load();
  const listeners = new Set<() => void>();

  const setState = (next: BookingState) => {
    if (next === state) return;
    state = next;
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Navigation privée ou quota dépassé : l'état reste cohérent en mémoire.
    }
    listeners.forEach((l) => l());
  };

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    confirm(request) {
      // Lecture de l'état le plus récent au moment exact de la confirmation (synchrone) :
      // deux clics successifs voient le second état et ne décomptent qu'une fois.
      const result = confirmBooking(data, state, request, { now: new Date(), reference: makeReference() });
      if (result.ok) setState(result.state);
      return result;
    },
    fillSlot(slotId) {
      if (!(slotId in state.availability)) return;
      setState({ ...state, availability: { ...state.availability, [slotId]: 0 } });
    },
    reset() {
      try {
        storage?.removeItem(STORAGE_KEY);
      } catch {
        // ignoré
      }
      setState(initialState(data));
    },
  };
}

function safeSessionStorage(): StorageLike | null {
  try {
    const probe = `${STORAGE_KEY}:probe`;
    window.sessionStorage.setItem(probe, "1");
    window.sessionStorage.removeItem(probe);
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export const bookingStore = createBookingStore(catalog, safeSessionStorage());

export function useBookingState(): BookingState {
  return useSyncExternalStore(bookingStore.subscribe, bookingStore.getState);
}

