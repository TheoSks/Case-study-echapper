export type ShareOutcome = "native" | "copied" | "aborted" | "failed";

/** Partage natif du téléphone si disponible, sinon copie dans le presse-papiers. Aucune donnée n'est envoyée par le site. */
export async function shareOrCopy({ title, text, url }: { title: string; text: string; url?: string }): Promise<ShareOutcome> {
  const full = url ? `${text}\n${url}` : text;
  try {
    if (typeof navigator.share === "function") {
      await navigator.share({ title, text, url });
      return "native";
    }
    await navigator.clipboard.writeText(full);
    return "copied";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "aborted";
    return "failed";
  }
}

/** URL publique d'une page du prototype (le routage utilise le hash). */
export function pageUrl(path: string): string {
  return `${window.location.origin}${window.location.pathname}#${path}`;
}
