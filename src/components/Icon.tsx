// Pictogrammes du kit de marque (icons/*.svg), en trait, couleur pilotée par currentColor.
// « check » et « alert » sont dessinés dans le même style (trait 1.75, terminaisons rondes).
import type { ReactElement } from "react";

const paths: Record<string, ReactElement> = {
  pottery: (
    <>
      <path d="M5 11H19L17.4 18.2A2.2 2.2 0 0 1 15.25 20H8.75A2.2 2.2 0 0 1 6.6 18.2L5 11Z" />
      <path d="M7.5 7.5 9.5 5.5 12 8l2.5-2.5 2 2" />
      <path d="M7 14H17" />
    </>
  ),
  kayak: (
    <>
      <path d="M3 13H21C19.5 17 16.5 19 12 19S4.5 17 3 13Z" />
      <path d="m7 4 10 13M5.5 3.5 8 3 9.5 5 8 7Z" />
      <path d="M3 21C4.5 20 6 20 7.5 21S10.5 22 12 21 15 20 16.5 21 19.5 22 21 21" />
    </>
  ),
  explore: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.8 8.2-2.4 5.2-5.2 2.4 2.4-5.2 5.2-2.4Z" />
    </>
  ),
  pin: (
    <>
      <path d="M19 10C19 15 12 21 12 21S5 15 5 10a7 7 0 0 1 14 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M16 5.3a3 3 0 0 1 0 5.4M17 13a5 5 0 0 1 3.5 4.8V20" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16M8 14h2M14 14h2M8 17h2" />
    </>
  ),
  arrow: <path d="M4 12h16M14 6l6 6-6 6" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  heart: <path d="M20.3 5.8a5 5 0 0 0-7.1 0L12 7l-1.2-1.2a5 5 0 0 0-7.1 7.1L12 21l8.3-8.1a5 5 0 0 0 0-7.1Z" />,
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.8 2.8L16.5 9.5" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5v.01" />
    </>
  ),
};

export type IconName = keyof typeof paths;

export function Icon({ name, className = "icon" }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
