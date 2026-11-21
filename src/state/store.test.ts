import { describe, expect, it } from "vitest";
import { catalog } from "../data/catalog";
import { createBookingStore } from "./store";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
  };
}

const request = { draftId: "d1", activityId: "a02", slotId: "a02-s1", participants: 2 };

describe("Store de session : places cohérentes pendant la session", () => {
  it("conserve les places après un « rechargement » (nouveau store, même stockage)", () => {
    const storage = memoryStorage();
    const first = createBookingStore(catalog, storage, () => "R1");
    first.confirm(request);
    const reloaded = createBookingStore(catalog, storage, () => "R2");
    expect(reloaded.getState().availability["a02-s1"]).toBe(5);
    expect(reloaded.getState().bookings.d1.reference).toBe("R1");
  });

  it("une confirmation rejouée après rechargement ne décompte pas une seconde fois", () => {
    const storage = memoryStorage();
    createBookingStore(catalog, storage, () => "R1").confirm(request);
    const reloaded = createBookingStore(catalog, storage, () => "R2");
    const result = reloaded.confirm(request);
    expect(result.ok && result.alreadyConfirmed).toBe(true);
    expect(reloaded.getState().availability["a02-s1"]).toBe(5);
  });

  it("une confirmation refusée ne modifie ni l'état ni le stockage", () => {
    const storage = memoryStorage();
    const store = createBookingStore(catalog, storage);
    const before = store.getState();
    const result = store.confirm({ ...request, participants: 0 });
    expect(result.ok).toBe(false);
    expect(store.getState()).toBe(before);
    expect(storage.data.size).toBe(0);
  });

  it("repart des données initiales si le stockage est corrompu ou incohérent", () => {
    const storage = memoryStorage();
    storage.setItem("echappee:demo:v1", "{pas du json");
    expect(createBookingStore(catalog, storage).getState().availability["a02-s1"]).toBe(7);
    storage.setItem("echappee:demo:v1", JSON.stringify({ availability: { "a02-s1": 999 }, bookings: {} }));
    expect(createBookingStore(catalog, storage).getState().availability["a02-s1"]).toBe(7);
  });

  it("fonctionne sans stockage (navigation privée bloquée)", () => {
    const store = createBookingStore(catalog, null, () => "R1");
    expect(store.confirm(request).ok).toBe(true);
    expect(store.getState().availability["a02-s1"]).toBe(5);
  });

  it("outils de démo : remplir un créneau puis réinitialiser", () => {
    const storage = memoryStorage();
    const store = createBookingStore(catalog, storage, () => "R1");
    store.confirm(request);
    store.fillSlot("a01-s1");
    expect(store.getState().availability["a01-s1"]).toBe(0);
    store.reset();
    expect(store.getState().availability["a01-s1"]).toBe(6);
    expect(store.getState().availability["a02-s1"]).toBe(7);
    expect(Object.keys(store.getState().bookings)).toHaveLength(0);
  });
});
