import { Icon } from "./Icon";
import { WEEKDAYS, addMonths, formatDay, formatMonth, monthGrid } from "../lib/dates";

/** État d'un jour : au moins un horaire convient, des horaires existent mais aucun ne convient, ou aucun horaire. */
export type DayStatus = "available" | "full" | "short" | undefined;

/**
 * Calendrier mensuel (comme sur les plateformes d'activités) : seuls les jours disponibles se sélectionnent ;
 * les jours complets restent visibles, barrés, et le disent en toutes lettres aux lecteurs d'écran.
 */
export function DatePicker({
  month,
  onMonthChange,
  selected,
  onSelect,
  statusOf,
  minMonth,
  maxMonth,
  shortLabel = "pas assez de places",
}: {
  month: string;
  onMonthChange: (month: string) => void;
  selected: string | null;
  onSelect: (day: string) => void;
  statusOf: (day: string) => DayStatus;
  minMonth: string;
  maxMonth: string;
  /** Libellé lu pour un jour où des places existent, mais pas assez pour le groupe. */
  shortLabel?: string;
}) {
  const cells = monthGrid(month);

  return (
    <div className="datepicker">
      <div className="dp-head">
        <button
          type="button"
          className="dp-nav"
          aria-label="Mois précédent"
          onClick={() => onMonthChange(addMonths(month, -1))}
          disabled={month <= minMonth}
        >
          <Icon name="arrow" className="icon dp-prev" />
        </button>
        <p className="dp-month" aria-live="polite">
          {formatMonth(month)}
        </p>
        <button
          type="button"
          className="dp-nav"
          aria-label="Mois suivant"
          onClick={() => onMonthChange(addMonths(month, 1))}
          disabled={month >= maxMonth}
        >
          <Icon name="arrow" />
        </button>
      </div>
      <div className="dp-grid">
        {WEEKDAYS.map((d) => (
          <span key={d} className="dp-weekday" aria-hidden="true">
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (!day) return <span key={`empty-${i}`} />;
          const status = statusOf(day);
          const label =
            status === "available" ? "disponible" : status === "full" ? "complet" : status === "short" ? shortLabel : "pas de créneau";
          return (
            <button
              key={day}
              type="button"
              className={`dp-day${status ? ` dp-day--${status}` : ""}`}
              aria-pressed={selected === day}
              aria-label={`${formatDay(day)}, ${label}`}
              disabled={status !== "available"}
              onClick={() => onSelect(day)}
            >
              {Number(day.slice(8))}
            </button>
          );
        })}
      </div>
      <p className="dp-legend" aria-hidden="true">
        <span className="dp-legend-item">
          <span className="dp-dot" /> Disponible
        </span>
        <span className="dp-legend-item">
          <span className="dp-strike">12</span> Complet
        </span>
      </p>
    </div>
  );
}
