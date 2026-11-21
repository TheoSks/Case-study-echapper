// Convertit les visuels sources du kit de marque (PNG ~3 Mo) en WebP pour le web.
// Usage : node scripts/optimize-images.mjs <dossier-source>
import sharp from "sharp";
import { readdirSync } from "node:fs";
import { join, parse } from "node:path";

const src = process.argv[2];
if (!src) throw new Error("Indique le dossier des PNG sources");
for (const file of readdirSync(src).filter((f) => f.endsWith(".png"))) {
  const { name } = parse(file);
  for (const width of [640, 1280]) {
    await sharp(join(src, file))
      .resize({ width })
      .webp({ quality: 78 })
      .toFile(join("public/images", `${name}-${width}.webp`));
  }
  console.log("ok", name);
}
