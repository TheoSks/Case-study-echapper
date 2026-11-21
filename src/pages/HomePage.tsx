import { useEffect, type CSSProperties } from "react";
import { track } from "../analytics/track";
import { ActivityImage, ResponsiveImage } from "../components/ActivityImage";
import { HeroMedia } from "../components/HeroMedia";
import { Icon, type IconName } from "../components/Icon";
import { MAX_GROUP, SearchBar, type Search } from "../components/SearchBar";
import { catalog } from "../data/catalog";
import { isActivityFull, parseParticipants } from "../domain/booking";
import type { Activity, Availability } from "../domain/types";
import { dayStatus, firstFittingSlot, nextAvailableDay } from "../lib/availability";
import { dayKey, formatDay } from "../lib/dates";
import { formatDuration, formatPrice, formatTime } from "../lib/format";
import { href, navigate, withQuery, type Route } from "../router";
import { bookingStore, useBookingState } from "../state/store";

export function HomePage({ route }: { route: Route }) {
  const state = useBookingState();
  const { availability } = state;
  const search: Search = {
    activityId: catalog.activities.some((a) => a.id === route.query.get("activite")) ? route.query.get("activite")! : "",
    date: /^\d{4}-\d{2}-\d{2}$/.test(route.query.get("date") ?? "") ? route.query.get("date")! : "",
    participants: route.query.get("participants") ?? "2",
  };
  const parsed = parseParticipants(search.participants);
  const groupSize = parsed.ok && parsed.value <= MAX_GROUP ? parsed.value : null;

  useEffect(() => {
    track("view_item_list", { item_count: catalog.activities.length });
  }, []);

  // La recherche vit dans l'URL : partageable, et conservée au retour depuis une fiche.
  const update = (next: Partial<Search>) => {
    const merged = { ...search, ...next };
    const query = new URLSearchParams();
    if (merged.activityId) query.set("activite", merged.activityId);
    if (merged.date) query.set("date", merged.date);
    query.set("participants", merged.participants);
    navigate(`/?${query.toString()}`, { replace: true });
  };

  const submit = () => {
    track("search", {
      activity_id: search.activityId || "toutes",
      date: search.date || "aucune",
      participants: groupSize ?? search.participants,
    });
    document.getElementById("activites")?.scrollIntoView({ behavior: "smooth" });
  };

  const shown = search.activityId ? catalog.activities.filter((a) => a.id === search.activityId) : catalog.activities;
  const fitting = groupSize
    ? shown.filter((a) => (search.date ? firstFittingSlot(availability, a.id, search.date, groupSize) : nextAvailableDay(availability, [a.id], groupSize)))
    : [];
  const people = (n: number) => `${n} ${n > 1 ? "personnes" : "personne"}`;
  const when = search.date ? ` le ${formatDay(search.date)}` : "";

  const bookingCount = Object.keys(state.bookings).length;
  const demoModified = bookingCount > 0 || catalog.slots.some((s) => availability[s.id] !== s.initialRemaining);

  return (
    <>
      <section className="hero-banner" aria-labelledby="hero-title">
        <HeroMedia />
        <div className="container hero-banner-text">
          <p className="hero-eyebrow">
            <img src="./logos/echappee-mark-inverse.svg" alt="" width={20} height={20} />
            Ateliers, balades et jeux en Provence
          </p>
          <h1 id="hero-title" tabIndex={-1}>
            Sortir du quotidien.
            <span className="hero-accent"> Tout près.</span>
          </h1>
          <p className="lead">De la matière, de l'air et le plaisir de faire quelque chose ensemble, toute l'année.</p>
        </div>
      </section>

      <div className="container">
        <div className="search-wrap">
          <SearchBar value={search} onChange={update} onSubmit={submit} availability={availability} />
        </div>

        <section className="section" id="activites" aria-labelledby="activites-title">
          <div className="section-head">
            <h2 id="activites-title">{search.activityId ? "Ta recherche" : "Nos activités"}</h2>
            <p className="muted" aria-live="polite">
              {groupSize === null
                ? "Indique le nombre de participants pour voir les disponibilités."
                : fitting.length > 0
                  ? `${fitting.length} ${fitting.length > 1 ? "activités ont" : "activité a"} de la place pour ${people(groupSize)}${when}.`
                  : `Aucune activité n'a de place pour ${people(groupSize)}${when}. Essaie une autre date ou moins de participants.`}
              {search.activityId && (
                <>
                  {" "}
                  <button type="button" className="btn-link inline" onClick={() => update({ activityId: "" })}>
                    Voir toutes les activités
                  </button>
                </>
              )}
            </p>
          </div>

          {demoModified && (
            <div className="notice demo-notice" role="status">
              <p>
                <strong>Mode démo :</strong> tes tests ont modifié les places
                {bookingCount > 0 ? ` (${bookingCount} réservation${bookingCount > 1 ? "s" : ""} simulée${bookingCount > 1 ? "s" : ""})` : ""}.
              </p>
              <button type="button" className="btn btn-secondary" onClick={() => bookingStore.reset()}>
                Réinitialiser la démo
              </button>
            </div>
          )}

          <ul className="cards">
            {shown.map((activity, index) => (
              <li key={activity.id} style={{ "--i": index } as CSSProperties}>
                <ActivityCard activity={activity} availability={availability} groupSize={groupSize} date={search.date} />
              </li>
            ))}
          </ul>
        </section>

        <section className="section" aria-labelledby="comment">
          <div className="section-head">
            <h2 id="comment">Comment ça marche</h2>
          </div>
          <ol className="next-steps">
            <Step icon="search" step={1} title="Choisis ta sortie" text="Une activité, une date, ton groupe : tu vois tout de suite ce qui a de la place." />
            <Step icon="calendar" step={2} title="Réserve en deux minutes" text="Un horaire, le nombre de participants, et le total TTC affiché avant de confirmer." />
            <Step icon="people" step={3} title="Préviens ton groupe" text="Lieu, heure et ce qu'il faut prévoir, à partager en un geste." />
          </ol>
        </section>

        <section className="brand-band" aria-label="L'esprit Échappée">
          <div className="brand-band-text">
            <img className="brand-mark" src="./logos/echappee-mark-inverse.svg" alt="" width={72} height={72} />
            <p className="brand-quote">«{" "}Un peu plus dehors. Un peu plus ensemble.{" "}»</p>
            <p>
              Des sorties simples, tout près, pour prendre le temps de faire. Pas besoin d'être expert : on apprend en
              faisant, à son rythme.
            </p>
          </div>
          <div className="brand-band-media">
            <ResponsiveImage name="a02-kayak" alt="Deux personnes en kayak au pied de falaises calcaires." sizes="(min-width: 52rem) 45vw, 100vw" />
          </div>
        </section>
      </div>
    </>
  );
}

function Step({ icon, step, title, text }: { icon: IconName; step: number; title: string; text: string }) {
  return (
    <li className="next-step">
      <span className="next-step-icon">
        <Icon name={icon} />
      </span>
      <span className="timeline-when">Étape {step}</span>
      <h3>{title}</h3>
      <p className="muted">{text}</p>
    </li>
  );
}

function ActivityCard({
  activity,
  availability,
  groupSize,
  date,
}: {
  activity: Activity;
  availability: Availability;
  groupSize: number | null;
  date: string;
}) {
  const size = groupSize ?? 1;
  const people = `${size} ${size > 1 ? "personnes" : "personne"}`;
  const full = isActivityFull(catalog, availability, activity.id);
  const daySlot = date ? firstFittingSlot(availability, activity.id, date, size) : undefined;
  const nextDay = nextAvailableDay(availability, [activity.id], size, date || undefined);
  const nextSlot = nextDay ? firstFittingSlot(availability, activity.id, nextDay, size) : undefined;

  let status: { kind: "available" | "full" | "short"; icon: "check" | "alert"; text: string };
  let linkDate: string | undefined;
  if (full) {
    status = { kind: "full", icon: "alert", text: "Complet sur toutes les dates proposées" };
  } else if (date && daySlot) {
    linkDate = date;
    status = { kind: "available", icon: "check", text: `Disponible le ${formatDay(date, { weekday: "short", day: "numeric", month: "long" })} à ${formatTime(daySlot.startsAt)}` };
  } else if (date) {
    const dayState = dayStatus(availability, [activity.id], date, size);
    const why = dayState === "full" || dayState === "short" ? `Complet ce jour-là pour ${people}` : "Pas de créneau ce jour-là";
    status = {
      kind: "short",
      icon: "alert",
      text: nextSlot ? `${why} · prochain : ${formatDay(dayKey(nextSlot.startsAt), { weekday: "short", day: "numeric", month: "long" })}` : why,
    };
  } else if (nextSlot) {
    status = { kind: "available", icon: "check", text: `Prochain créneau : ${formatDay(dayKey(nextSlot.startsAt), { weekday: "short", day: "numeric", month: "long" })}, ${formatTime(nextSlot.startsAt)}` };
  } else {
    status = { kind: "short", icon: "alert", text: `Aucun créneau pour ${people}` };
  }

  const link = withQuery(`/activites/${activity.slug}`, { participants: groupSize ?? undefined, date: linkDate });

  return (
    <article className={`card${status.kind === "available" ? "" : " card--unavailable"}`}>
      <ActivityImage activity={activity} sizes="(min-width: 60rem) 33vw, (min-width: 40rem) 50vw, 100vw" />
      <div className="card-body">
        <span className="category">
          <Icon name={activity.icon} /> {activity.categoryLabel}
          {activity.weatherDependent && <span className="tag">D'avril à octobre</span>}
        </span>
        <h3>
          <a href={href(link)}>{activity.title}</a>
        </h3>
        <p>{activity.tagline}</p>
        <ul className="facts">
          <li>
            <Icon name="pin" /> {activity.location}
          </li>
          <li>
            <Icon name="clock" /> {formatDuration(activity.durationMinutes)}
          </li>
          <li>
            <Icon name="people" /> Dès {activity.minAge} ans
          </li>
        </ul>
        <p className="card-price">{formatPrice(activity.pricePerPersonCents)} / pers. TTC</p>
        <p className={`status status--${status.kind}`}>
          <Icon name={status.icon} /> {status.text}
        </p>
      </div>
    </article>
  );
}
