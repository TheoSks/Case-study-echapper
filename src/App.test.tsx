// Parcours complet dans l'interface : les cas qu'un jury testerait à la main.
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { captureCampaign } from "./analytics/track";
import { bookingStore } from "./state/store";

function open(path: string) {
  window.history.replaceState(null, "", `/#${path}`);
  return render(<App />);
}

async function reachSummary(user: ReturnType<typeof userEvent.setup>, participants = "2") {
  open("/activites/kayak-calanques");
  await user.click(screen.getByRole("radio", { name: /18 avril/ }));
  const input = screen.getByLabelText("Participants");
  await user.clear(input);
  await user.type(input, participants);
  await user.click(screen.getAllByRole("button", { name: /^Réserver/ })[0]);
}

beforeEach(() => {
  act(() => bookingStore.reset());
});

describe("Parcours de réservation", () => {
  it("de la fiche à la confirmation : total TTC avant confirmation, places déduites du seul créneau", async () => {
    const user = userEvent.setup();
    await reachSummary(user, "3");

    expect(screen.getByRole("heading", { name: "Vérifie ta réservation" })).toBeTruthy();
    const summary = screen.getByRole("region", { name: "Récapitulatif de la réservation" });
    expect(within(summary).getByText("Balade en kayak")).toBeTruthy();
    expect(within(summary).getByText(/Dimanche 18 avril · 9 h 30/)).toBeTruthy();
    expect(within(summary).getByText("3 participants")).toBeTruthy();
    expect(within(summary).getByText(/117\s€/)).toBeTruthy();
    expect(screen.getByText(/aucun paiement n'est effectué/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Confirmer la réservation" }));

    expect(screen.getByRole("heading", { name: "C'est réservé." })).toBeTruthy();
    expect(screen.getByText(/Places sur ce créneau/).textContent).toContain("7 avant, 4 après");
    const { availability, bookings } = bookingStore.getState();
    expect(availability).toMatchObject({ "a02-s1": 4, "a01-s1": 6, "a01-s2": 2, "a02-s2": 0 });
    expect(Object.keys(bookings)).toHaveLength(1);
  });

  it("double clic sur « Confirmer » : une seule réservation, places décomptées une fois", async () => {
    const user = userEvent.setup();
    await reachSummary(user, "2");
    await user.dblClick(screen.getByRole("button", { name: "Confirmer la réservation" }));

    expect(bookingStore.getState().availability["a02-s1"]).toBe(5);
    expect(Object.keys(bookingStore.getState().bookings)).toHaveLength(1);
  });

  it("revenir sur le récapitulatif après confirmation ne permet pas de confirmer à nouveau", async () => {
    const user = userEvent.setup();
    await reachSummary(user, "2");
    const summaryUrl = window.location.hash;
    await user.click(screen.getByRole("button", { name: "Confirmer la réservation" }));

    act(() => {
      window.location.hash = summaryUrl;
    });
    expect(await screen.findByRole("heading", { name: "Cette réservation est déjà confirmée." })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Confirmer la réservation" })).toBeNull();
    expect(bookingStore.getState().availability["a02-s1"]).toBe(5);
  });

  it("revérifie au moment de confirmer : créneau devenu complet → refus, rien n'est enregistré", async () => {
    const user = userEvent.setup();
    await reachSummary(user, "2");
    await user.click(screen.getByText(/Outils de démo · revérification/));
    await user.click(screen.getByRole("button", { name: "Simuler : le créneau devient complet" }));
    await user.click(screen.getByRole("button", { name: "Confirmer la réservation" }));

    expect(screen.getByText("Ce créneau est complet. Choisis un autre créneau.")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "C'est réservé." })).toBeNull();
    expect(Object.keys(bookingStore.getState().bookings)).toHaveLength(0);
  });
});

describe("Saisies invalides : rien n'est enregistré, les disponibilités ne changent pas", () => {
  it.each([
    ["0", "Il faut au moins 1 participant."],
    ["-2", "Il faut au moins 1 participant."],
    ["2,5", "Indique un nombre entier de participants."],
    ["abc", "Indique un nombre entier de participants."],
    ["8", "Il reste 7 places sur ce créneau."],
  ])("participants = %s → « %s »", async (value, message) => {
    const user = userEvent.setup();
    const before = bookingStore.getState();
    await reachSummary(user, value);

    expect(screen.getByText(message)).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Vérifie ta réservation" })).toBeNull();
    expect(bookingStore.getState()).toBe(before);
  });

  it("sans créneau choisi, « Réserver » explique ce qui manque", async () => {
    const user = userEvent.setup();
    open("/activites/kayak-calanques");
    await user.click(screen.getAllByRole("button", { name: /^Réserver/ })[0]);
    expect(screen.getByText("Choisis un créneau pour continuer.")).toBeTruthy();
  });

  it("une URL modifiée à la main (99 participants) est refusée au récapitulatif", () => {
    const before = bookingStore.getState();
    open("/reservation/draft-x?activite=a02&creneau=a02-s1&participants=99");
    expect(screen.getByRole("heading", { name: "Cette réservation ne peut pas être poursuivie." })).toBeTruthy();
    expect(screen.getByText("Il reste 7 places sur ce créneau.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Confirmer la réservation" })).toBeNull();
    expect(bookingStore.getState()).toBe(before);
  });

  it("une URL vers un créneau complet est refusée au récapitulatif", () => {
    open("/reservation/draft-y?activite=a02&creneau=a02-s2&participants=1");
    expect(screen.getByText("Ce créneau est complet. Choisis un autre créneau.")).toBeTruthy();
  });
});

describe("Créneaux et activités complets", () => {
  it("un créneau complet est affiché, désactivé et indiqué « Complet »", () => {
    open("/activites/kayak-calanques");
    const full = screen.getByRole("radio", { name: /25 avril/ });
    expect((full as HTMLInputElement).disabled).toBe(true);
    expect(full.closest("label")?.textContent).toContain("Complet");
  });

  it("un créneau sans assez de places pour le groupe est signalé mais reste sélectionnable", async () => {
    const user = userEvent.setup();
    open("/activites/atelier-ceramique?participants=6");
    const short = screen.getByRole("radio", { name: /24 avril/ }) as HTMLInputElement;
    expect(short.closest("label")?.textContent).toContain("2 places restantes · pas assez pour 6");
    expect(short.disabled).toBe(false);
    await user.click(short);
    expect(screen.getByText("Il reste 2 places sur ce créneau.")).toBeTruthy();
    const ok = screen.getByRole("radio", { name: /17 avril/ });
    expect(ok.closest("label")?.textContent).not.toContain("pas assez");
  });

  it("une activité complète reste consultable, explique l'indisponibilité et propose d'autres activités", () => {
    open("/activites/escape-game-mas");
    expect(screen.getByRole("heading", { name: "Escape game au mas" })).toBeTruthy();
    expect(screen.getByText("Cette activité est complète sur toutes les dates proposées.")).toBeTruthy();
    expect(screen.getAllByRole("radio").every((r) => (r as HTMLInputElement).disabled)).toBe(true);
    expect(screen.queryByRole("button", { name: /^Réserver/ })).toBeNull();
    expect(screen.getByRole("link", { name: "Atelier céramique" })).toBeTruthy();
  });

  it("accueil : un choix rapide indique combien d'activités ont de la place pour le groupe", async () => {
    const user = userEvent.setup();
    open("/");
    await user.click(screen.getByRole("button", { name: /Entre amis/ }));
    expect(screen.getByText(/de la place pour 6 personnes/).textContent).toContain("2 activités ont");
    const input = screen.getByLabelText("Ou indique le nombre exact");
    await user.clear(input);
    await user.type(input, "8");
    expect(screen.getAllByText("Aucun créneau pour 8 personnes")).toHaveLength(2);
  });

  it("l'accueil l'indique en toutes lettres sur la carte", () => {
    open("/");
    expect(screen.getByText("Complet sur les dates proposées")).toBeTruthy();
  });
});

describe("Mesure du tunnel", () => {
  const events = () => (window.dataLayer ?? []).map((e) => e.event);

  it("« démarrage » (begin_checkout) uniquement quand créneau ET participants sont valides", async () => {
    window.dataLayer = [];
    const user = userEvent.setup();
    open("/activites/kayak-calanques");
    const reserve = () => user.click(screen.getAllByRole("button", { name: /^Réserver/ })[0]);

    await reserve(); // sans créneau
    expect(events()).not.toContain("begin_checkout");

    await user.click(screen.getByRole("radio", { name: /18 avril/ }));
    const input = screen.getByLabelText("Participants");
    await user.clear(input);
    await user.type(input, "0");
    await reserve(); // participants invalides
    expect(events()).not.toContain("begin_checkout");
    expect(events().filter((e) => e === "booking_error")).toHaveLength(2);

    await user.clear(input);
    await user.type(input, "2");
    await reserve();
    expect(events()).toEqual(["view_item", "booking_error", "select_slot", "booking_error", "begin_checkout", "view_summary"]);
  });

  it("les paramètres de campagne de l'arrivée sont joints à la confirmation", async () => {
    window.dataLayer = [];
    captureCampaign("http://localhost/?utm_source=meta&utm_medium=paid_social&utm_campaign=lancement#/");
    const user = userEvent.setup();
    await reachSummary(user, "2");
    await user.click(screen.getByRole("button", { name: "Confirmer la réservation" }));
    const confirmed = window.dataLayer.find((e) => e.event === "booking_confirmed");
    expect(confirmed).toMatchObject({ utm_source: "meta", utm_medium: "paid_social", utm_campaign: "lancement", value: 78, participants: 2 });
  });
});

describe("Mention de simulation", () => {
  it("le bandeau est présent sur toutes les pages", () => {
    open("/");
    expect(screen.getByRole("note").textContent).toMatch(
      /Réservation simulée.*Aucun paiement.*aucun email.*aucune donnée personnelle/,
    );
  });
});
