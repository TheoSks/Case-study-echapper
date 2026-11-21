import { useEffect, useId, useRef, useState } from "react";
import { catalog } from "../data/catalog";
import { parseParticipants } from "../domain/booking";
import type { Availability } from "../domain/types";
import { MAX_MONTH, MIN_MONTH, dayStatus, nextAvailableDay } from "../lib/availability";
import { formatDay, monthKey } from "../lib/dates";
import { DatePicker } from "./DatePicker";
import { Icon } from "./Icon";

export interface Search {
  activityId: string; // "" = toutes
  date: string; // "" = pas de date choisie
  participants: string; // saisie brute, validée par le domaine
}

export const MAX_GROUP = 10;

/**
 * Barre de recherche, sur le modèle des plateformes d'activités : Activité · Date · Participants.
 * Le calendrier ne propose que les jours où un horaire peut accueillir le groupe.
 */
export function SearchBar({
  value,
  onChange,
  onSubmit,
  availability,
}: {
  value: Search;
  onChange: (next: Partial<Search>) => void;
  onSubmit: () => void;
  availability: Availability;
}) {
  const id = useId();
  const parsed = parseParticipants(value.participants);
  const size = parsed.ok ? parsed.value : 1;
  const activityIds = value.activityId ? [value.activityId] : catalog.activities.map((a) => a.id);
  const participantsError = !parsed.ok
    ? parsed.error.code === "participants_too_low"
      ? "Il faut au moins 1 participant."
      : "Indique un nombre entier."
    : parsed.value > MAX_GROUP
      ? "Au-delà de 10 : devis dans la version en ligne."
      : undefined;

  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() =>
    monthKey(value.date || nextAvailableDay(availability, activityIds, size) || `${MIN_MONTH}-01`),
  );
  const dateButton = useRef<HTMLButtonElement>(null);
  const popover = useRef<HTMLDivElement>(null);

  // Fermer le calendrier : clic à l'extérieur ou touche Échap.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!popover.current?.contains(e.target as Node) && !dateButton.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        dateButton.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const setSize = (n: number) => onChange({ participants: String(Math.min(MAX_GROUP, Math.max(1, n))) });

  return (
    <form
      className="searchbar"
      role="search"
      aria-label="Trouver une activité"
      onSubmit={(e) => {
        e.preventDefault();
        setOpen(false);
        onSubmit();
      }}
    >
      <div className="sb-field">
        <label className="sb-label" htmlFor={`${id}-activity`}>
          <Icon name="explore" /> Activité
        </label>
        <select
          id={`${id}-activity`}
          className="sb-select"
          value={value.activityId}
          onChange={(e) => onChange({ activityId: e.target.value })}
        >
          <option value="">Toutes les activités</option>
          {catalog.activities.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
      </div>

      <div className="sb-field sb-date">
        <span className="sb-label" id={`${id}-date-label`}>
          <Icon name="calendar" /> Date
        </span>
        <button
          ref={dateButton}
          type="button"
          className="sb-value"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-labelledby={`${id}-date-label ${id}-date-value`}
          onClick={() => setOpen((o) => !o)}
        >
          <span id={`${id}-date-value`} className={value.date ? "" : "sb-placeholder"}>
            {value.date ? capitalize(formatDay(value.date, { weekday: "short", day: "numeric", month: "long" })) : "Choisir une date"}
          </span>
        </button>
        {open && (
          <div ref={popover} className="sb-popover" role="dialog" aria-label="Choisir une date">
            <DatePicker
              month={month}
              onMonthChange={setMonth}
              selected={value.date || null}
              onSelect={(day) => {
                onChange({ date: day });
                setOpen(false);
                dateButton.current?.focus();
              }}
              statusOf={(day) => dayStatus(availability, activityIds, day, size)}
              minMonth={MIN_MONTH}
              maxMonth={MAX_MONTH}
              shortLabel={`pas assez de places pour ${size}`}
            />
            {value.date && (
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  onChange({ date: "" });
                  setOpen(false);
                }}
              >
                Effacer la date
              </button>
            )}
          </div>
        )}
      </div>

      <div className="sb-field">
        <label className="sb-label" htmlFor={`${id}-people`}>
          <Icon name="people" /> Participants
        </label>
        <div className="sb-stepper">
          <button type="button" aria-label="Retirer un participant" onClick={() => setSize(size - 1)} disabled={!parsed.ok || size <= 1}>
            −
          </button>
          <input
            id={`${id}-people`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={value.participants}
            onChange={(e) => onChange({ participants: e.target.value })}
            aria-invalid={participantsError ? true : undefined}
            aria-describedby={participantsError ? `${id}-people-error` : undefined}
          />
          <button type="button" aria-label="Ajouter un participant" onClick={() => setSize(size + 1)} disabled={parsed.ok && size >= MAX_GROUP}>
            +
          </button>
        </div>
        {participantsError && (
          <p className="error sb-error" id={`${id}-people-error`} role="alert">
            {participantsError}
          </p>
        )}
      </div>

      <button type="submit" className="btn btn-primary sb-submit">
        <Icon name="search" /> Rechercher
      </button>
    </form>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
