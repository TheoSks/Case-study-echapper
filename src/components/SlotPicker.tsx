import { remainingFor } from "../domain/booking";
import type { Availability, Slot } from "../domain/types";
import { capitalize, formatDate, formatTime, plural } from "../lib/format";

/**
 * Liste des créneaux : un seul choix possible (radio).
 * - Complet : visible, désactivé, mot « Complet » (impossible à réserver quel que soit le groupe).
 * - Pas assez de places pour le groupe saisi : grisé et expliqué, mais sélectionnable,
 *   car le nombre de participants reste modifiable.
 */
export function SlotPicker({
  slots,
  availability,
  selectedId,
  onSelect,
  error,
  groupSize = null,
  legend = "Choisis un créneau",
  timeOnly = false,
}: {
  legend?: string;
  /** Afficher seulement l'heure (la date est déjà choisie dans le calendrier). */
  timeOnly?: boolean;
  /** Nombre de participants saisi, s'il est valide. */
  groupSize?: number | null;
  slots: Slot[];
  availability: Availability;
  selectedId: string | null;
  onSelect: (slotId: string) => void;
  error?: string;
}) {
  return (
    <fieldset aria-describedby={error ? "slot-error" : undefined}>
      <legend>{legend}</legend>
      <div className={`slot-list${timeOnly ? " slot-list--times" : ""}`}>
        {slots.map((slot) => {
          const remaining = remainingFor(availability, slot.id);
          const full = remaining <= 0;
          const short = !full && groupSize !== null && remaining < groupSize;
          return (
            <label key={slot.id} className={`slot${full ? " slot--full" : short ? " slot--short" : ""}`}>
              <input
                type="radio"
                name="slot"
                value={slot.id}
                checked={selectedId === slot.id}
                disabled={full}
                onChange={() => onSelect(slot.id)}
              />
              <span className="slot-date">
                {timeOnly ? formatTime(slot.startsAt) : `${capitalize(formatDate(slot.startsAt))} · ${formatTime(slot.startsAt)}`}
              </span>
              <span className="slot-meta">
                {full ? (
                  <strong>Complet</strong>
                ) : (
                  <span className="muted">
                    {plural(remaining, "place restante", "places restantes")}
                    {short && ` · pas assez pour ${groupSize}`}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p className="error" id="slot-error" role="alert" style={{ marginTop: "0.75rem" }}>
          {error}
        </p>
      )}
    </fieldset>
  );
}
