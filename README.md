# Échappée · Prototype de réservation simulée

Cas pratique Product Builder : le lancement du site B2C d'Échappée, opérateur fictif d'activités de loisirs en Provence.

Le prototype permet de **découvrir l'offre, trouver une activité adaptée et réserver** (de façon simulée), sur mobile et sur ordinateur, avec des activités et des créneaux fictifs.

> **Réservation simulée.** Aucun paiement n'est effectué, aucun email n'est envoyé et aucune donnée personnelle n'est collectée. Seules les places de la démo sont mises à jour, dans le navigateur.

## Le parcours

| Écran | Ce qu'on y fait |
|---|---|
| **Accueil** | Rechercher par activité, date (calendrier des jours disponibles) et nombre de participants ; voir ce qui a de la place |
| **Fiche activité** | Infos clés, « Ce que tu vas vivre », « À savoir » ; choisir une date, un horaire et le nombre de participants ; total TTC en direct |
| **Récapitulatif** | Activité, créneau, participants, total TTC, mention « réservation simulée » ; choisir qui règle (l'organisateur pour tous, ou chacun sa part) ; confirmer |
| **Confirmation** | Récapitulatif, partage des infos avec le groupe (ou, en paiement partagé, suivi des parts et lien de paiement), prochaines étapes, suggestion d'une autre activité |
| **Ta part** (`#/part`) | Page du participant ouverte depuis le lien de paiement : sortie, rendez-vous, part TTC, « Régler ma part » (simulé) |

## Prérequis et dépendances

- **Node.js 18 ou plus récent** (développé avec Node 24) et **npm**.
- Dépendances d'exécution : **React 18** et **React DOM**. Aucune autre bibliothèque.
- Outils de développement : **Vite 5** (serveur et build), **TypeScript 5**, **Vitest 2** + **Testing Library** + **jsdom** (tests), **sharp** (optimisation des images, script ponctuel).
- Polices **Fraunces** et **Manrope** auto-hébergées (`public/fonts`, licence SIL OFL), logos et visuels du kit de marque.

Aucun backend, compte, paiement, CMS, outil d'analytics ou service d'email n'est connecté : le brief ne les demande pas dans le prototype (voir [la recommandation technique](docs/05-technique.md)).

## Installation

```bash
git clone https://github.com/TheoSks/Case-study-echapper.git
cd Case-study-echapper
npm install
```

## Lancement

```bash
npm run dev        # serveur de développement : http://localhost:5173
npm run build      # vérification des types + build de production dans dist/
npm run preview    # sert le build : http://localhost:4173
```

## Tests

```bash
npm test           # 83 tests (Vitest)
npm run typecheck  # vérification des types TypeScript
```

| Fichier | Ce qu'il vérifie |
|---|---|
| `src/domain/booking.test.ts` | Les règles métier, sans interface : participants, places restantes, créneau complet, revérification à la confirmation, décompte unique, saisie invalide, données de démo |
| `src/state/store.test.ts` | La session : persistance au rechargement, stockage corrompu, navigation privée, outils de démo |
| `src/App.test.tsx` | Le parcours dans l'interface : réservation complète, double clic, retour arrière, URL modifiée, calendrier, activité complète, définition du démarrage du tunnel, attribution de campagne |

La correspondance règle du brief → écran → test est détaillée dans [docs/03-ecrans-regles.md](docs/03-ecrans-regles.md).

## Structure du code

```
src/
  domain/        Règles métier pures (validation, confirmation idempotente) et leurs tests
  data/          Données fictives : activités, créneaux de démonstration, planning annuel
  state/         Store de la session (places et réservations, sessionStorage)
  pages/         Les écrans : accueil, fiche activité, récapitulatif, confirmation
  components/    Composants : barre de recherche, calendrier, carte d'activité, en-tête…
  lib/           Utilitaires : dates, formats français, disponibilités, partage
  analytics/     Événements du tunnel poussés dans window.dataLayer (aucun outil connecté)
  styles/        Tokens de marque (couleurs, typographies) et styles
  router.ts      Routage par hash (#/...)
public/          Polices, logos, images (WebP), vidéo d'ouverture
rive/intro/      Source de l'animation d'ouverture, conçue avec le CLI Rive
docs/            Cadrage, parcours, écrans et règles, technique, mesure
scripts/         Optimisation des images du kit de marque (PNG → WebP)
```

## Où sont les données

| Fichier | Contenu | En production |
|---|---|---|
| `src/data/activities.json` | Les 3 activités : textes, lieu, durée, prix TTC, âge, image | CMS headless |
| `src/data/slots.json` | Les 6 créneaux de démonstration des règles métier (dates et places fixes) | Moteur de réservation |
| `src/data/schedule.ts` | Le planning sur l'année, généré de façon déterministe : céramique toute l'année, kayak d'avril à octobre, escape game complet | Moteur de réservation |

Les créneaux de démonstration servent aux cas limites : le **dimanche 18 avril 2027, 9 h 30** (kayak, 7 places), le **dimanche 25 avril** (kayak, complet), le **samedi 24 avril, 14 h 30** (céramique, 2 places) et l'**escape game**, complet sur toutes ses dates.

## Persistance : comportement choisi

- Les places et les réservations sont conservées dans le **`sessionStorage`** du navigateur : elles **survivent au rechargement** de la page et repartent de zéro à la **fermeture de l'onglet**.
- Un encart « Mode démo » apparaît sur l'accueil quand les places ont été modifiées, avec un bouton **« Réinitialiser la démo »** (aussi dans le pied de page).
- Si le stockage est indisponible (navigation privée stricte), l'état reste cohérent en mémoire pendant la visite.

## Règles métier

| Règle | Comportement |
|---|---|
| Activité complète consultable | L'escape game reste consultable ; ses dates sont barrées et un encadré explique l'indisponibilité, avec d'autres activités |
| Un seul créneau, entier > 0, ≤ places restantes | Choix unique ; 0, nombres négatifs, décimaux, texte et dépassement sont refusés avec un message clair |
| Créneau complet non réservable, vérifié à la confirmation | Créneau désactivé ; toutes les règles sont revérifiées au clic sur « Confirmer » (outil de démo pour le montrer) |
| Récapitulatif avant confirmation | Activité, créneau, participants et total TTC, affichés avant le bouton |
| Décompte unique, sur le seul créneau choisi | Confirmation idempotente : double clic, retour arrière ou rechargement ne décomptent pas deux fois |
| Saisie invalide | Rien n'est enregistré, les disponibilités ne changent pas (y compris avec une URL modifiée) |
| Réserver à plusieurs | Le lien « Proposer à ton groupe » emporte le créneau choisi ; en paiement partagé, les places du groupe sont bloquées et décomptées **une seule fois**, chacun règle ensuite sa part (simulé) |
| Réservation clairement simulée | Bandeau sur toutes les pages, mentions au récapitulatif et à la confirmation, aucun champ de donnée personnelle |

**Démarrage de la réservation** (indicateur du brief) : clic sur « Réserver » avec un horaire choisi **et** un nombre de participants valide (événement `begin_checkout`).

## Limites techniques connues

- **Pas de backend** : les places vivent dans le navigateur. Deux onglets ont chacun leur propre état ; il n'y a pas de stock partagé entre utilisateurs.
- **Routage par hash** (`/#/activites/...`) : fonctionne sur n'importe quel hébergement statique, mais n'est pas adapté au référencement (la production utiliserait de vraies URL par langue).
- **Planning fictif fixe**, de décembre 2026 à octobre 2027 ; il n'avance pas avec la date du jour.
- **Prix par personne uniquement** : pas de tarif groupe ou enfant (question ouverte pour le client).
- **Français uniquement** : le multilingue est décrit dans la recommandation technique.
- **Analytics simulée** : les événements sont visibles dans la console et dans `window.dataLayer`, sans outil connecté.
- **Animation d'ouverture** : jouée à chaque chargement (passable au clic ou au clavier). Conçue dans Rive (`rive/intro`), elle est rejouée en SVG + CSS, car l'offre Rive gratuite ajoute un écran de démarrage « Rive ».
- **Vidéo d'ouverture** sur ordinateur uniquement (5,6 Mo) ; image fixe sur mobile, ou si l'utilisateur réduit les animations.

## Documentation

| Document | Contenu |
|---|---|
| [docs/01-cadrage.md](docs/01-cadrage.md) | Besoin, cibles, hypothèses, questions pour le client |
| [docs/02-parcours.md](docs/02-parcours.md) | Parcours global, fidélisation, construit / proposé / reporté, arbitrages |
| [docs/03-ecrans-regles.md](docs/03-ecrans-regles.md) | Écrans, règles métier → écran → test, cas limites |
| [docs/05-technique.md](docs/05-technique.md) | Recommandation technique : site, CMS headless, multilingue, analytics, A/B tests |
| [docs/06-mesure.md](docs/06-mesure.md) | Plan de mesure : tunnel, plan de taggage, indicateurs, limites, réachat |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Organisation du travail |

## Déploiement

Le build est un site statique (`dist/`) avec des chemins relatifs. Sur **Vercel** : framework « Vite », commande de build `npm run build`, dossier de sortie `dist`. Aucune variable d'environnement n'est nécessaire.

## Crédits

Échappée est une marque fictive. Logos, polices (Fraunces et Manrope, SIL Open Font License) et visuels générés proviennent du kit de marque fourni avec le cas pratique ; la vidéo d'ouverture est fournie par l'auteur du projet.
