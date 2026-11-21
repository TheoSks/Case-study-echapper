# Roadmap · Cas pratique Échappée

> Document de travail. Chaque sujet est traité l'un après l'autre : on réfléchit, on tranche, on produit le livrable, on coche.
> Budget total : 3 h. Répartition cible : ~1 h 30 prototype, ~1 h cadrage + technique + mesure, ~30 min README + restitution.

## Vue d'ensemble

| # | Sujet | Livrable | Temps | Statut |
|---|---|---|---|---|
| 1 | Cadrage du besoin | `docs/01-cadrage.md` | 15 min | ✅ fini |
| 2 | Parcours global & fidélisation | `docs/02-parcours.md` | 20 min | ✅ fini |
| 3 | Écrans & règles métier | `docs/03-ecrans-regles.md` | 10 min | ✅ fini |
| 4 | Prototype de réservation | Application + tests | 1 h 30 | ✅ fini (62 tests) |
| 5 | Recommandation technique | `docs/05-technique.md` | 20 min | ✅ fini |
| 6 | Plan de mesure | `docs/06-mesure.md` | 20 min | ✅ fini |
| 7 | Livraison (README, Git, démo) | `README.md`, dépôt GitHub | 15 min | ⚪ à faire |
| 8 | Restitution | Support 45 min + script de démo | 15 min | ⚪ à faire |

Légende : ⚪ à faire · 🟠 en cours · 🟡 décidé, à rédiger · ✅ fini

---

## 1 · Cadrage du besoin

**Objectif** : montrer qu'on a compris le client avant de proposer quoi que ce soit.

**À produire**
- Le besoin en une phrase et le problème actuel (réservation téléphonique, B2B uniquement).
- Les cibles : particuliers (couples, amis, familles) et groupes (amis, familles, associations). Entreprises exclues : portail B2B hors périmètre.
- Les objectifs métier, reliés aux indicateurs du brief.
- Les hypothèses retenues (prix par personne TTC, réservation mobile majoritaire, capacité par créneau…).
- Les questions à clarifier avec le client.

**Déjà décidé**
- Cible et exclusion B2B.
- Questions : tarifs groupe, nombre de langues, gestion de la météo pour les activités extérieures.

**À approfondir**
- Seuil « groupe » (au-delà de combien de personnes passe-t-on au devis ?).
- Politique d'annulation et de report (impacte la confiance, hors prototype).
- Qui gère les créneaux aujourd'hui (outil, fichier, téléphone) ? Source de vérité des places.
- Moyens de paiement, acompte pour les groupes.
- Ressources marketing : qui alimente le CMS, à quelle fréquence.

**Fini quand** : une page lisible en 2 minutes, avec hypothèses et questions numérotées.

---

## 2 · Parcours global & fidélisation

**Objectif** : penser le parcours de la découverte à la nouvelle réservation, y compris hors site.

**À produire**
- La carte du parcours : découverte → choix → réservation → préparation → jour J → après → réachat.
- Pour chaque étape : besoin du client, point de contact (site, email, SMS, sur place), ce qu'Échappée y gagne.
- La priorisation : construit et vérifié / proposé non développé / reporté, avec les arbitrages.

**Déjà décidé**
- Avant l'activité : message de préparation (quoi apporter, comment venir).
- Juste après : remerciement, demande d'avis, photos.
- Quelques semaines plus tard : relance saisonnière adaptée à l'historique (kayak l'été → activité d'automne ou d'hiver) ; pour un groupe, revenir à la même période l'année suivante.
- Relance des abandons : reportée (nécessite l'email avant la fin du parcours + consentement).

**À approfondir**
- Le déclencheur et le contenu exact de chaque message, et l'indicateur qu'il fait bouger.
- La gestion météo : qui décide, quand le client est prévenu, quelle alternative (report, autre activité).
- La découverte : quels canaux d'acquisition amènent sur quelles pages (lien avec les campagnes payantes).

**Fini quand** : un schéma de parcours + un tableau de priorisation en trois colonnes.

---

## 3 · Écrans & règles métier

**Objectif** : figer ce qu'on construit avant de coder.

**Validé**
- E1 Accueil (sélecteur « Vous serez combien ? », 3 cartes) · E2 Fiche activité (créneaux, participants, total) · E3 Récapitulatif (total TTC, mention simulée, revérification) · E4 Confirmation (récapitulatif, places restantes, partage avec le groupe, frise « Et ensuite ? ») · Outil de démo (simuler un créneau complet, réinitialiser).
- **Aucun champ de données personnelles dans le prototype** (règle « aucune donnée personnelle réelle collectée »). La saisie du prénom et de l'email est *proposée* pour la production : un encart sur le récapitulatif l'indique. Le tunnel du prototype colle ainsi exactement aux 5 étapes du brief.
- 3 activités, 6 créneaux, **capacité ≤ 10 par créneau** : la seule limite visible reste « les places restantes », comme dans le brief. Dates fixes en avril 2027, prix par personne TTC.
- Démarrage de la réservation = validation du créneau et du nombre de participants (clic « Réserver »).

**À formaliser**
- La matrice règle métier → écran → test automatisé.
- La matrice des cas limites testés par le jury (0, négatif, décimal, texte, dépassement, complet, double clic, retour arrière, URL modifiée, rechargement).

**Fini quand** : chaque règle du brief pointe vers un écran et un test.

---

## 4 · Prototype de réservation

**Objectif** : un parcours qui marche, sur mobile et ordinateur, sans faille sur les règles métier. C'est ~50 % de l'évaluation.

**Étapes (un commit par étape)**
1. ✅ Scaffold Vite + React + TypeScript, polices, logos, images WebP.
2. Domaine métier pur : validation, confirmation idempotente, revérification à la confirmation.
3. Tests Vitest couvrant les 8 règles et les cas limites.
4. Données fictives en JSON (contenu éditorial séparé de l'inventaire des places).
5. Store de session (sessionStorage) + outils de démo + réinitialisation.
6. Écrans E1 → E5.
7. Instrumentation analytics simulée (`dataLayer` + `console`, sans écran dédié).
8. Finitions mobile et accessibilité (focus, libellés, barre fixe mobile), vérification manuelle des cas limites.

**À trancher pendant le sujet**
- Niveau de finition visuelle : crédible, pas plus. Le kit de marque suffit.
- Test d'intégration du parcours complet (Testing Library) en plus des tests unitaires.

**Fini quand** : `npm test` vert, parcours complet joué sur mobile et desktop, cas limites vérifiés à la main.

---

## 5 · Recommandation technique

**Objectif** : une architecture cible argumentée, distincte du prototype.

**À produire**
- Le site : framework (rendu serveur ou statique pour le SEO et la vitesse mobile), hébergement.
- Le CMS headless : options comparées, rôle (contenus éditoriaux, traductions), ce qui n'y va pas (places, prix : moteur de réservation).
- Le multilingue : URLs par langue, contenus traduits dans le CMS, textes d'interface, `hreflang`, formats de dates et de prix.
- L'analytics : outil, plan de taggage, consentement (CMP), suivi serveur pour les conversions des campagnes payantes.
- Les A/B tests : où se décide la variante (serveur, edge) pour éviter le clignotement, compatibilité avec le CMS et l'analytics.
- Le tableau cible de production / prototype, et les compromis.

**À approfondir** : 2 options par brique au plus, avec un choix et sa raison.

**Fini quand** : un schéma d'architecture + un tableau « brique / rôle / option retenue / compromis ».

---

## 6 · Plan de mesure

**Objectif** : rendre chaque indicateur du brief calculable.

**À produire**
- Le tunnel : `view_item` → `select_slot` → `begin_checkout` → `view_summary` → `booking_confirmed`, plus `booking_error`.
- Pour chaque événement : déclencheur, paramètres (activité, créneau, participants, valeur, source de campagne…).
- Pour chaque indicateur : formule, données nécessaires, décision qu'il permet de prendre.
- Le réachat à 6 mois : identification par email haché saisi à la réservation, cohortes avec 6 mois complets de recul.
- Les limites : consentement, changement d'appareil, cookies insuffisants, email différent, réservation de groupe (qui est « le client » ?).

**Fini quand** : un tableau indicateur → formule → événements → décision → limite.

---

## 7 · Livraison

**À produire**
- `README.md` : projet, prérequis, dépendances, installation, lancement, structure, données, tests, limites connues, comportement de persistance.
- Historique Git lisible, un commit par étape.
- Dépôt GitHub (privé possible). `gh` n'est pas installé : push via ton compte.
- Démo en ligne facultative (GitHub Pages ou Netlify).

**Fini quand** : un clone neuf + `npm install` + `npm run dev` fonctionne en suivant le README seul.

---

## 8 · Restitution

**À produire**
- Un support de 45 min suivant les 4 blocs demandés : besoin et hypothèses, parcours et arbitrages, technique, mesure.
- Un script de démo de 5 minutes qui joue les cas limites devant le jury.
- Une slide « construit et vérifié / proposé / reporté ».

**Fini quand** : on peut dérouler la présentation en 30 min, avec 15 min pour les questions.
