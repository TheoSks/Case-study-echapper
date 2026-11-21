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

// Dimanche 18 avril 2027 : un seul horaire de kayak (9 h 30, 7 places), créneau de démonstration fixe.
async function reachSummary(user: ReturnType<typeof userEvent.setup>, participants = "2") {
  open("/activites/kayak-calanques?date=2027-04-18");
  await user.click(screen.getByRole("radio", { name: /9 h 30/ }));
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
    const before = bookingStore.getState().availability;
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
    for (const [slotId, remaining] of Object.entries(before)) {
      expect(availability[slotId]).toBe(slotId === "a02-s1" ? 4 : remaining);
    }
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

  it("sans horaire choisi, « Réserver » explique ce qui manque", async () => {
    const user = userEvent.setup();
    open("/activites/kayak-calanques?date=2027-04-18");
    await user.click(screen.getAllByRole("button", { name: /^Réserver/ })[0]);
    expect(screen.getByText("Choisis un horaire pour continuer.")).toBeTruthy();
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

describe("Calendrier, horaires et activités complètes", () => {
  it("le calendrier distingue jours disponibles, complets et sans créneau", () => {
    open("/activites/kayak-calanques?date=2027-04-18");
    expect(screen.getByText("Avril 2027")).toBeTruthy();
    const full = screen.getByRole("button", { name: "dimanche 25 avril, complet" }) as HTMLButtonElement;
    expect(full.disabled).toBe(true);
    const none = screen.getByRole("button", { name: "lundi 19 avril, pas de créneau" }) as HTMLButtonElement;
    expect(none.disabled).toBe(true);
    expect(screen.getByRole("button", { name: "dimanche 18 avril, disponible" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("le kayak est saisonnier : aucun créneau en hiver", async () => {
    const user = userEvent.setup();
    open("/activites/kayak-calanques?date=2027-04-18");
    await user.click(screen.getByRole("button", { name: "Mois précédent" }));
    await user.click(screen.getByRole("button", { name: "Mois précédent" }));
    expect(screen.getByText("Février 2027")).toBeTruthy();
    expect(screen.queryAllByRole("button", { name: /disponible$/ })).toHaveLength(0);
  });

  it("un horaire complet est affiché, désactivé et indiqué « Complet »", () => {
    open("/activites/kayak-calanques?date=2027-04-25");
    const full = screen.getByRole("radio", { name: /15 h/ }) as HTMLInputElement;
    expect(full.disabled).toBe(true);
    expect(full.closest("label")?.textContent).toContain("Complet");
  });

  it("un horaire sans assez de places pour le groupe est signalé mais reste sélectionnable", async () => {
    const user = userEvent.setup();
    open("/activites/atelier-ceramique?participants=6&date=2027-04-24");
    const short = screen.getByRole("radio", { name: /14 h 30/ }) as HTMLInputElement;
    expect(short.closest("label")?.textContent).toContain("2 places · pas assez pour 6");
    expect(short.disabled).toBe(false);
    await user.click(short);
    expect(screen.getByText("Il reste 2 places sur ce créneau.")).toBeTruthy();
  });

  it("une activité complète reste consultable, explique l'indisponibilité et propose d'autres activités", () => {
    open("/activites/escape-game-mas");
    expect(screen.getByRole("heading", { name: "Escape game au mas" })).toBeTruthy();
    expect(screen.getByText("Cette activité est complète sur toutes les dates proposées.")).toBeTruthy();
    expect(screen.getAllByRole("radio").every((r) => (r as HTMLInputElement).disabled)).toBe(true);
    expect(screen.queryByRole("button", { name: /^Réserver/ })).toBeNull();
    expect(screen.getByRole("link", { name: "Atelier céramique" })).toBeTruthy();
  });
});

describe("Accueil : recherche par activité, date et participants", () => {
  it("sans date : les activités qui ont de la place pour le groupe, l'escape game complet", () => {
    open("/");
    expect(screen.getByText(/2 activités ont de la place pour 2 personnes/)).toBeTruthy();
    expect(screen.getByText("Complet sur toutes les dates")).toBeTruthy();
  });

  it("choisir une date dans le calendrier met à jour les cartes", async () => {
    const user = userEvent.setup();
    open("/");
    await user.click(screen.getByRole("button", { name: /Choisir une date/ }));
    const dialog = screen.getByRole("dialog", { name: "Choisir une date" });
    const firstAvailable = within(dialog).getAllByRole("button", { name: /disponible$/ })[0];
    await user.click(firstAvailable);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(window.location.hash).toMatch(/date=\d{4}-\d{2}-\d{2}/);
    expect(screen.getAllByText(/^Disponible · \d+ h/).length).toBeGreaterThan(0);
  });

  it("une date où le groupe ne tient pas : explication et prochaine date", () => {
    open("/?date=2027-04-24&participants=4");
    expect(screen.getByText("Complet ce jour-là")).toBeTruthy();
    expect(screen.getByText(/^Prochaine date : /)).toBeTruthy();
  });

  it("hors saison, le kayak indique qu'il n'y a pas de créneau ce jour-là", () => {
    open("/?activite=a02&date=2027-01-16&participants=2");
    expect(screen.getByRole("heading", { name: "Ta recherche" })).toBeTruthy();
    expect(screen.getByText("Pas de créneau ce jour-là")).toBeTruthy();
    expect(screen.getByText(/^Prochaine date : .* avr\./)).toBeTruthy();
    expect(within(screen.getByRole("region", { name: "Ta recherche" })).getAllByRole("article")).toHaveLength(1);
  });

  it("signale quand les tests ont modifié les places, et permet de réinitialiser", async () => {
    const user = userEvent.setup();
    act(() => bookingStore.fillSlot("a02-s1"));
    open("/");
    expect(screen.getByText(/tes tests ont modifié les places/)).toBeTruthy();
    await user.click(screen.getAllByRole("button", { name: "Réinitialiser la démo" })[0]);
    expect(screen.queryByText(/tes tests ont modifié les places/)).toBeNull();
  });
});

describe("Mesure du tunnel", () => {
  const events = () => (window.dataLayer ?? []).map((e) => e.event);

  it("« démarrage » (begin_checkout) uniquement quand créneau ET participants sont valides", async () => {
    window.dataLayer = [];
    const user = userEvent.setup();
    open("/activites/kayak-calanques?date=2027-04-18");
    const reserve = () => user.click(screen.getAllByRole("button", { name: /^Réserver/ })[0]);

    await reserve(); // sans horaire
    expect(events()).not.toContain("begin_checkout");

    await user.click(screen.getByRole("radio", { name: /9 h 30/ }));
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
