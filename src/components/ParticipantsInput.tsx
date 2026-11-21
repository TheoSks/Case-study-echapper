import { useId } from "react";
import { parseParticipants } from "../domain/booking";

/**
 * Saisie du nombre de participants : boutons − / + et champ libre.
 * Le champ accepte n'importe quelle saisie : la validation métier décide (et explique) si elle est valable.
 */
export function ParticipantsInput({
  value,
  onChange,
  max,
  error,
  label = "Participants",
  labelHidden = false,
  hint = "Organisateur compris. Groupe de plus de 10 ? Une demande de devis sera proposée dans la version en ligne.",
}: {
  label?: string;
  /** Libellé lu par les lecteurs d'écran mais masqué à l'écran (quand le contexte le donne déjà). */
  labelHidden?: boolean;
  /** Aide sous le champ ; chaîne vide pour ne rien afficher. */
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  /** Plafond des boutons + (places restantes du créneau choisi). */
  max: number;
  error?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const parsed = parseParticipants(value);
  const current = parsed.ok ? parsed.value : 0;

  return (
    <div className="field">
      <label className={labelHidden ? "visually-hidden" : "field-label"} htmlFor={id}>
        {label}
      </label>
      <div className="stepper">
        <button
          type="button"
          aria-label="Retirer un participant"
          onClick={() => onChange(String(Math.max(1, current - 1)))}
          disabled={current <= 1}
        >
          −
        </button>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={[error ? errorId : "", hint ? hintId : ""].filter(Boolean).join(" ") || undefined}
        />
        <button
          type="button"
          aria-label="Ajouter un participant"
          onClick={() => onChange(String(Math.min(Math.max(max, 1), current + 1)))}
          disabled={current >= max}
        >
          +
        </button>
      </div>
      {hint && (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
