// Modèle métier de la réservation. Aucune dépendance à React ni au navigateur.

export type ActivityCategory = "atelier" | "plein-air" | "jeu";

export interface Activity {
  id: string;
  slug: string;
  title: string;
  category: ActivityCategory;
  categoryLabel: string;
  icon: "pottery" | "kayak" | "explore";
  tagline: string;
  description: string;
  experience: string[];
  location: string;
  meetingPoint: string;
  durationMinutes: number;
  /** Prix TTC par participant, en centimes (évite les erreurs d'arrondi). */
  pricePerPersonCents: number;
  minAge: number;
  weatherDependent: boolean;
  included: string[];
  toBring: string[];
  image: { name: string; alt: string };
}

export interface Slot {
  id: string;
  activityId: string;
  /** Date ISO 8601 avec fuseau horaire. */
  startsAt: string;
  capacity: number;
  /** Places restantes au chargement de la démo. */
  initialRemaining: number;
}

export interface Catalog {
  activities: Activity[];
  slots: Slot[];
}

/** Places restantes par identifiant de créneau. */
export type Availability = Readonly<Record<string, number>>;

/** Ce que l'utilisateur demande à réserver. `participants` vient d'une saisie : on ne lui fait pas confiance. */
export interface BookingRequest {
  /** Identifiant unique du parcours de réservation : garantit qu'une confirmation ne décompte qu'une fois. */
  draftId: string;
  activityId: string;
  slotId: string;
  participants: unknown;
  /** Qui règle : l'organisateur pour tout le groupe (par défaut) ou chacun sa part. */
  paymentMode?: PaymentMode;
}

/**
 * Mode de règlement. « split » : l'organisateur bloque les places du groupe et règle sa part ;
 * chaque participant règle la sienne via un lien. Les places sont décomptées une seule fois, à la confirmation.
 */
export type PaymentMode = "organizer" | "split";

export interface Booking {
  reference: string;
  draftId: string;
  activityId: string;
  slotId: string;
  participants: number;
  unitPriceCents: number;
  totalCents: number;
  /** Absent sur les réservations enregistrées avant l'option : équivaut à « organizer ». */
  paymentMode?: PaymentMode;
  confirmedAt: string;
}

export interface BookingState {
  availability: Availability;
  /** Réservations confirmées, indexées par draftId. */
  bookings: Readonly<Record<string, Booking>>;
}

export type BookingError =
  | { code: "unknown_activity" }
  | { code: "unknown_slot" }
  | { code: "slot_mismatch" }
  | { code: "slot_full" }
  | { code: "participants_not_integer" }
  | { code: "participants_too_low" }
  | { code: "participants_exceed_remaining"; remaining: number };
