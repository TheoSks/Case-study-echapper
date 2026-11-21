import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { catalog } from "../data/catalog";
import { parseParticipants } from "../domain/booking";
import type { Availability } from "../domain/types";
import { MAX_MONTH, MIN_MONTH, dayStatus, nextAvailableDay } from "../lib/availability";
import { formatDay, monthKey } from "../lib/dates";
import { formatPrice } from "../lib/format";
import { ResponsiveImage } from "./ActivityImage";
import { DatePicker } from "./DatePicker";
import { Icon } from "./Icon";

export interface Search {
  activityId: string; // "" = toutes
  date: string; // "" = pas de date choisie
  participants: string; // saisie brute, validée par le domaine
}

export const MAX_GROUP = 10;

type Panel = "activity" | "date" | null;

/** Ferme le panneau ouvert au clic à l'extérieur ou sur Échap (et rend le focus au bouton qui l'a ouvert). */
function useDismiss(open: Panel, close: () => void, refs: Array<RefObject<HTMLElement>>, trigger: () => HTMLElement | null) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!refs.some((r) => r.current?.contains(e.target as Node))) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        trigger()?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
}

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
  const selectedActivity = catalog.activities.find((a) => a.id === value.activityId);
  const participantsError = !parsed.ok
    ? parsed.error.code === "participants_too_low"
      ? "Il faut au moins 1 participant."
      : "Indique un nombre entier."
    : parsed.value > MAX_GROUP
      ? "Au-delà de 10 : devis dans la version en ligne."
      : undefined;

  const [open, setOpen] = useState<Panel>(null);
  const [month, setMonth] = useState(() =>
    monthKey(value.date || nextAvailableDay(availability, activityIds, size) || `${MIN_MONTH}-01`),
  );
  const activityField = useRef<HTMLDivElement>(null);
  const dateField = useRef<HTMLDivElement>(null);
  const activityButton = useRef<HTMLButtonElement>(null);
  const dateButton = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(null);
  useDismiss(open, close, [activityField, dateField], () => (open === "activity" ? activityButton.current : dateButton.current));

  const toggle = (panel: Panel) => setOpen((current) => (current === panel ? null : panel));
  const setSize = (n: number) => onChange({ participants: String(Math.min(MAX_GROUP, Math.max(1, n))) });

  return (
    <form
      className="searchbar"
      role="search"
      aria-label="Trouver une activité"
      onSubmit={(e) => {
        e.preventDefault();
        close();
        onSubmit();
      }}
    >
      {/* Activité */}
      <div ref={activityField} className={`sb-field${open === "activity" ? " is-open" : ""}`}>
        <span className="sb-label" id={`${id}-activity-label`}>
          Activité
        </span>
        <button
          ref={activityButton}
          type="button"
          className="sb-value"
          aria-haspopup="dialog"
          aria-expanded={open === "activity"}
          aria-labelledby={`${id}-activity-label ${id}-activity-value`}
          onClick={() => toggle("activity")}
        >
          <Icon name={selectedActivity?.icon ?? "explore"} />
          <span id={`${id}-activity-value`}>{selectedActivity?.title ?? "Toutes les activités"}</span>
          <Icon name="chevron" className="icon sb-chevron" />
        </button>
        {open === "activity" && (
          <div className="sb-popover sb-popover--activities" role="dialog" aria-label="Choisir une activité">
            <ul className="sb-options">
              <li>
                <button
                  type="button"
                  className="sb-option"
                  aria-pressed={!value.activityId}
                  onClick={() => {
                    onChange({ activityId: "" });
                    close();
                    activityButton.current?.focus();
                  }}
                >
                  <span className="sb-option-icon">
                    <Icon name="explore" />
                  </span>
                  <span className="sb-option-text">
                    <strong>Toutes les activités</strong>
                    <span>Ateliers, balades et jeux</span>
                  </span>
                  {!value.activityId && <Icon name="check" className="icon sb-option-check" />}
                </button>
              </li>
              {catalog.activities.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    className="sb-option"
                    aria-pressed={value.activityId === a.id}
                    onClick={() => {
                      onChange({ activityId: a.id });
                      close();
                      activityButton.current?.focus();
                    }}
                  >
                    <span className="sb-option-thumb">
                      <ResponsiveImage name={a.image.name} alt="" sizes="56px" />
                    </span>
                    <span className="sb-option-text">
                      <strong>{a.title}</strong>
                      <span>
                        {a.categoryLabel} · {a.location} · {formatPrice(a.pricePerPersonCents)} / pers.
                      </span>
                    </span>
                    {value.activityId === a.id && <Icon name="check" className="icon sb-option-check" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Date */}
      <div ref={dateField} className={`sb-field${open === "date" ? " is-open" : ""}`}>
        <span className="sb-label" id={`${id}-date-label`}>
          Date
        </span>
        <button
          ref={dateButton}
          type="button"
          className="sb-value"
          aria-haspopup="dialog"
          aria-expanded={open === "date"}
          aria-labelledby={`${id}-date-label ${id}-date-value`}
          onClick={() => toggle("date")}
        >
          <Icon name="calendar" />
          <span id={`${id}-date-value`} className={value.date ? "" : "sb-placeholder"}>
            {value.date ? capitalize(formatDay(value.date, { weekday: "short", day: "numeric", month: "long" })) : "Choisir une date"}
          </span>
        </button>
        {open === "date" && (
          <div className="sb-popover" role="dialog" aria-label="Choisir une date">
            <DatePicker
              month={month}
              onMonthChange={setMonth}
              selected={value.date || null}
              onSelect={(day) => {
                onChange({ date: day });
                close();
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
                  close();
                }}
              >
                Effacer la date
              </button>
            )}
          </div>
        )}
      </div>

      {/* Participants */}
      <div className="sb-field">
        <label className="sb-label" htmlFor={`${id}-people`}>
          Participants
        </label>
        <div className="sb-stepper">
          <Icon name="people" />
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
