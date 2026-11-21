// Configuration commune des tests (Vitest + jsdom).
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom n'implémente pas le défilement.
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
Element.prototype.scrollIntoView = vi.fn();

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  window.history.replaceState(null, "", "/");
});
