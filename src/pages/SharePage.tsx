import { useState } from "react";
import { track } from "../analytics/track";
import { ActivityImage } from "../components/ActivityImage";
import { Icon } from "../components/Icon";
import { catalog, findActivityById } from "../data/catalog";
import { capitalize, formatDate, formatDuration, formatPrice, formatTime } from "../lib/format";
import { href, type Route } from "../router";

/**
 * Paiement partagé, côté participant : on arrive par le lien envoyé par l'organisateur.
 * La place est déjà bloquée (décomptée à la confirmation de l'organisateur) : cette page ne touche pas aux places.
 * Le montant est recalculé à partir du catalogue, jamais lu dans l'URL.
 */
export function SharePage({ route }: { route: Route }) {
  const activity = findActivityById(route.query.get("activite") ?? "");
  const slot = catalog.slots.find((s) => s.id === route.query.get("creneau") && s.activityId === activity?.id);
  const reference = route.query.get("ref") ?? "";
  const [paid, setPaid] = useState(false);

  if (!activity || !slot || !reference) {
    return (
      <div className="narrow">
        <h1 tabIndex={-1}>Ce lien de paiement n'est pas valide.</h1>
        <p>Demande à l'organisateur de ta sortie de te renvoyer le lien.</p>
        <a className="btn btn-primary" href={href("/")}>
          Voir les activités
        </a>
      </div>
    );
  }

  const pay = () => {
    setPaid(true);
    track("pay_share", { booking_reference: reference, activity_id: activity.id, value: activity.pricePerPersonCents / 100, currency: "EUR" });
  };

  return (
    <div className="container narrow share-page">
      <p className="eyebrow">Ton groupe t'a gardé une place</p>
      <h1 tabIndex={-1}>{activity.title}</h1>

      <section className="summary" aria-label="Ta part de la sortie">
        <div className="summary-head">
          <ActivityImage activity={activity} sizes="80px" />
          <div>
            <h2 style={{ fontSize: "1.5rem" }}>
              {capitalize(formatDate(slot.startsAt))} à {formatTime(slot.startsAt)}
            </h2>
            <p className="muted">
              {activity.meetingPoint} · {formatDuration(activity.durationMinutes)}
            </p>
          </div>
        </div>
        <dl>
          <div>
            <dt>Réservation</dt>
            <dd>{reference}</dd>
          </div>
          <div>
            <dt>À prévoir</dt>
            <dd>{capitalize(activity.toBring.join(", ").toLowerCase())}</dd>
          </div>
          <div className="summary-total">
            <dt>Ta part TTC</dt>
            <dd>{formatPrice(activity.pricePerPersonCents)}</dd>
          </div>
        </dl>
      </section>

      {paid ? (
        <div className="notice share-paid" role="status">
          <strong>
            <Icon name="check" /> Ta part est réglée.
          </strong>
          <p>L'organisateur voit que c'est fait. Réservation simulée : rien n'a été payé.</p>
        </div>
      ) : (
        <button type="button" className="btn btn-primary checkout-confirm" onClick={pay}>
          Régler ma part · {formatPrice(activity.pricePerPersonCents)}
        </button>
      )}

      <p className="muted">
        <span className="tag">Version en ligne</span> Paiement sécurisé de ta seule part, sans créer de compte. Ta place
        est déjà bloquée : elle ne dépend pas de la vitesse des autres.
      </p>
    </div>
  );
}
