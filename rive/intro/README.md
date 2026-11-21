# Animation d'ouverture (Rive)

Source de l'animation d'ouverture du site : `scene.rml` (format texte du CLI Rive).
Le logo provient de `public/logos/echappee-logo-color.svg`, converti avec `rive svg`.

| Moment | Ce qui se passe |
|---|---|
| 0 → 0,9 s | L'arche se dessine au trait |
| 0,5 → 1,2 s | Le chemin se dessine |
| 0,8 → 1,2 s | Le soleil apparaît (léger rebond) |
| 1,0 → 1,7 s | Le mot « échappée » glisse en fondu |
| 1,7 → 2,5 s | Pause sur le logo complet, puis le site apparaît |

## Commandes

```bash
rive rive/intro                       # aperçu dans une fenêtre, reconstruit à chaque modification
rive rive/intro --verify              # vérifie la scène
rive rive/intro --screenshot=build/f.png --advance=70   # image à 70 images (≈ 1,2 s)
rive login                            # une fois, pour pouvoir exporter le .riv
rive rive/intro --publish             # écrit le .riv dans build/
cp rive/intro/build/intro.riv public/rive/intro.riv
```

## Dans le site

L'animation a été conçue ici, dans Rive. Le site la rejoue en **SVG + CSS** avec la même chronologie
(`src/components/IntroOverlay.tsx`, styles « Animation d'ouverture » dans `src/styles/global.css`) :
sur l'offre Rive gratuite, le `.riv` publié est précédé d'un écran de démarrage « Rive », ce qui n'est
pas présentable comme ouverture de site. Avec une offre Rive payante, le `.riv` publié sans cet écran
pourrait être lu directement par le lecteur `@rive-app/canvas`.
