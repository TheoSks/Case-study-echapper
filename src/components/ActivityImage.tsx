import type { Activity } from "../domain/types";

/** Image responsive (WebP 640 / 1280 générées depuis les PNG du kit, voir scripts/optimize-images.mjs). */
export function ResponsiveImage({
  name,
  alt,
  sizes,
  eager = false,
}: {
  name: string;
  alt: string;
  sizes: string;
  eager?: boolean;
}) {
  return (
    <img
      src={`./images/${name}-1280.webp`}
      srcSet={`./images/${name}-640.webp 640w, ./images/${name}-1280.webp 1280w`}
      sizes={sizes}
      alt={alt}
      width={1280}
      height={853}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

export function ActivityImage({ activity, sizes, eager }: { activity: Activity; sizes: string; eager?: boolean }) {
  return <ResponsiveImage name={activity.image.name} alt={activity.image.alt} sizes={sizes} eager={eager} />;
}
