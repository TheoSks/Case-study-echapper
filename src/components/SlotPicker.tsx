import { remainingFor } from "../domain/booking";
import type { Availability, Slot } from "../domain/types";
import { capitalize, formatDate, formatTime, plural } from "../lib/format";

/** Liste des créneaux : un seul choix possible (radio). Un créneau complet reste visible, désactivé, avec le mot « Complet ». */
export function SlotPicker({
  slots,
  availability,
  selectedId,
  onSelect,
  error,
}: {
  slots: Slot[];
  availability: Availability;
  selectedId: string | null;
  onSelect: (slotId: string) => void;
  error?: string;
}) {
  return (
    <fieldset aria-describedby={error ? "slot-error" : undefined}>
      <legend>Choisis un créneau</legend>
      <div className="slot-list">
        {slots.map((slot) => {
          const remaining = remainingFor(availability, slot.id);
          const full = remaining <= 0;
          return (
            <label key={slot.id} className={`slot${full ? " slot--full" : ""}`}>
              <input
                type="radio"
                name="slot"
                value={slot.id}
                checked={selectedId === slot.id}
                disabled={full}
                onChange={() => onSelect(slot.id)}
              />
              <span className="slot-date">
                {capitalize(formatDate(slot.startsAt))} · {formatTime(slot.startsAt)}
              </span>
              <span className="slot-meta">
                {full ? (
                  <strong>Complet</strong>
                ) : (
                  <span className="muted">{plural(remaining, "place restante", "places restantes")}</span>
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
