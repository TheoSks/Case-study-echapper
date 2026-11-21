# 6 · Plan de mesure

> Répond au quatrième point de la restitution : « la manière de mesurer les objectifs métier. Précise les événements et les informations nécessaires, les décisions possibles et les limites, notamment pour reconnaître un client qui revient ».

## Principes

1. **Deux sources, deux rôles.**
   - L'**analytics web** (événements du site, via le `dataLayer`) mesure les **parcours** : progression, décrochages, sources de campagne. Elle dépend du consentement : c'est un échantillon.
   - Le **moteur de réservation** (base des réservations, côté serveur) est la **source exacte** des réservations confirmées, du chiffre d'affaires et du **réachat**. Il ne dépend pas des cookies.
   - Les deux sont rapprochés par la **référence de réservation** (`booking_reference`), envoyée dans l'événement de confirmation.
2. **Une session** = la session analytics standard (fin après 30 minutes d'inactivité ou à minuit). Dans le prototype, elle est simulée par un identifiant en `sessionStorage` (`session_id`).
3. **Un seul vocabulaire** : les mêmes noms d'événements servent aux indicateurs, aux campagnes et aux futurs A/B tests (voir [recommandation technique](05-technique.md)).

## Le tunnel et ce qui marque le démarrage

| Étape du brief | Événement | Déclencheur exact |
|---|---|---|
| 1. Consultation d'une activité | `view_item` | Affichage d'une fiche activité |
| 2. Sélection d'un créneau | `select_slot` | Choix d'un horaire dans la fiche |
| 3. **Démarrage de la réservation** | `begin_checkout` | **Clic sur « Réserver » avec un horaire choisi ET un nombre de participants valide** (entier, au moins 1, au plus les places restantes) |
| 4. Récapitulatif | `view_summary` | Affichage du récapitulatif d'une demande valide |
| 5. Confirmation | `booking_confirmed` | Confirmation acceptée par la revérification des règles (une seule fois par réservation) |

**Pourquoi ce démarrage :** c'est le premier moment où l'organisateur s'engage sur une réservation **réalisable**. Un clic sur « Réserver » sans horaire, ou avec une saisie invalide, n'est pas un démarrage : il est compté comme une friction (`booking_error`). Cette définition est **prouvée par un test automatisé** (`src/App.test.tsx`, « Mesure du tunnel »).

## Plan de taggage

Paramètres communs à tous les événements : `session_id`, `timestamp`, et, s'ils existent à l'arrivée, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `gclid`, `fbclid` (mémorisés pour toute la session). En production s'ajoutent automatiquement la langue, l'appareil et la page.

| Événement | Paramètres | Rôle | Prototype |
|---|---|---|---|
| `view_item_list` | `item_count` | Arrivée sur le catalogue | ✅ |
| `search` | `activity_id`, `date`, `participants` | Ce que cherchent les organisateurs (dates, tailles de groupe) | ✅ |
| `view_item` | `activity_id`, `activity_name`, `full` | Étape 1 | ✅ |
| `select_slot` | `activity_id`, `slot_id` | Étape 2 | ✅ |
| `begin_checkout` | `activity_id`, `slot_id`, `participants`, `value`, `currency` | Étape 3 : démarrage | ✅ |
| `view_summary` | `activity_id`, `slot_id`, `participants`, `value`, `currency` | Étape 4 | ✅ |
| `booking_confirmed` | `booking_reference`, `activity_id`, `slot_id`, `participants`, `value`, `currency` | Étape 5 ; transmis aux régies comme conversion (`purchase` dans GA4) | ✅ |
| `booking_error` | `step` (`activity`, `summary`, `confirm`), `error_code` | Frictions : quelle règle bloque, à quelle étape | ✅ |
| `share_activity` / `share_booking` | `method`, `activity_id` ou `booking_reference` | Rôle de l'organisateur, bouche-à-oreille | ✅ |
| `experiment_viewed` | `experiment_id`, `variant` | Exposition à une variante A/B | 🟡 proposé |
| Événements emails (envoi, ouverture, clic) | `message` (J-2, J+1, relance), `booking_reference` | Efficacité des points de contact après réservation | 🟡 proposé (outil d'emailing) |

Dans le prototype, chaque événement est poussé dans `window.dataLayer` et affiché dans la console du navigateur ; aucun outil n'est connecté.

## Les indicateurs du brief

| Indicateur | Formule | Données | Décisions possibles |
|---|---|---|---|
| **Conversion du site** | Sessions avec au moins un `booking_confirmed` ÷ sessions | Événements web | Suivre l'effet du lancement, comparer par source, appareil, langue |
| **Progression dans le parcours** | Pour chaque étape : nombre de sessions ayant l'événement de l'étape | `view_item` → `select_slot` → `begin_checkout` → `view_summary` → `booking_confirmed` | Visualiser le tunnel, repérer l'étape qui perd le plus |
| **Passage et décrochage entre deux étapes** | Passage A→B = sessions ayant A **puis** B ÷ sessions ayant A. Décrochage = sessions ayant A **sans** B avant la fin de la session ÷ sessions ayant A | Événements web, ordonnés dans la session | Voir le tableau « Lire un décrochage » |
| **Finalisation et abandon** | Finalisation = sessions avec `begin_checkout` puis `booking_confirmed` ÷ sessions avec `begin_checkout`. Abandon = 1 − finalisation | `begin_checkout`, `booking_confirmed`, `booking_error` (étape `confirm`) | Si l'abandon monte : rassurance, prix, paiement, créneau devenu complet |
| **Réachat** | Parmi les **nouveaux clients** dont la 1re réservation date d'**au moins 6 mois**, part ayant fait une **2e réservation dans les 6 mois** suivant la 1re | Base des réservations : identifiant client, date de confirmation, canal | Mesurer l'effet des relances saisonnières ; ajuster leur moment et leur contenu |

### Lire un décrochage

| Décrochage | Hypothèses | Ce qu'on regarde | Action |
|---|---|---|---|
| Consultation → créneau | Pas de date qui convient, prix, manque d'infos | Recherches sans résultat (`search`), activités consultées | Ouvrir des créneaux, enrichir la fiche |
| Créneau → démarrage | Groupe trop grand, saisie confuse | `booking_error` : `participants_exceed_remaining`, `participants_not_integer` | Montrer la capacité plus tôt, ajuster le sélecteur |
| Démarrage → récapitulatif | Bug, lenteur | Erreurs techniques, temps de chargement | Correction |
| Récapitulatif → confirmation | Paiement, confiance, créneau devenu complet | `booking_error` étape `confirm`, `slot_full` | Rassurance (annulation, sécurité), blocage temporaire des places |

### Réachat : définitions retenues

- **Client** = l'organisateur, identifié par son **email saisi à la réservation**. C'est le seul identifiant stable sans compte client (hypothèse H6).
- **Identifiant client** = empreinte de l'email normalisé (minuscules, espaces retirés), calculée avec une **clé secrète** (HMAC-SHA-256). On peut ainsi relier les réservations d'un même client sans manipuler l'email en clair dans les analyses.
- **Nouveau client** = aucune réservation B2C avant celle-ci. Les réservations **B2B sont exclues** (champ « canal » du moteur de réservation).
- **Date de réservation** = date de **confirmation**, pas date de l'activité : on mesure le comportement d'achat.
- **Recul de 6 mois complets** : seuls les clients dont la 1re réservation a au moins 6 mois entrent dans le calcul. **Le premier chiffre fiable arrive donc 6 mois après le lancement.**
- En attendant, des **indicateurs avancés** : taux de consentement aux relances, clics sur les relances saisonnières, réachat à 3 mois.

## Piloter les campagnes payantes

| Indicateur | Formule | Décision |
|---|---|---|
| Conversion par source | Conversion du site, ventilée par `utm_source` / `utm_campaign` | Garder, couper ou retravailler une campagne |
| Coût par réservation | Dépense ÷ réservations attribuées | Comparer les canaux à budget égal |
| Retour sur dépense publicitaire | Chiffre d'affaires attribué ÷ dépense | Réallouer le budget vers ce qui rapporte |
| Tunnel par source | Progression, ventilée par source | Une source qui amène des visites sans réservation : mauvais ciblage ou mauvaise page d'arrivée |

**Conditions :** tous les liens payants portent des paramètres `utm_*` ; ils mènent à une **fiche activité** (pas à l'accueil) ; la conversion est transmise aux régies **côté serveur** (plus robuste face aux bloqueurs). Le prototype prouve l'attribution : les paramètres de l'arrivée sont joints à `booking_confirmed` (test « les paramètres de campagne de l'arrivée sont joints à la confirmation »).

## Les limites

| Limite | Effet | Réponse |
|---|---|---|
| **Consentement refusé** | Une partie des sessions n'est pas mesurée : le tunnel est un échantillon | Lire des **taux** plutôt que des volumes ; mode consentement de Google ; réservations exactes côté serveur |
| **Bloqueurs de publicité** | Événements perdus côté navigateur | Suivi côté serveur pour la conversion |
| **Un client, plusieurs sessions ou appareils** | Il consulte sur mobile, réserve sur ordinateur : la conversion par session est sous-estimée | Accepter cette limite au lancement ; rapprocher par email au moment de la réservation |
| **Cookies pour reconnaître un client qui revient** | Insuffisants : effacés, refusés, différents d'un appareil à l'autre | **Email haché saisi à la réservation**, côté serveur |
| **Email différent d'une réservation à l'autre** | Le même client compte pour deux nouveaux clients : réachat sous-estimé | Proposer de retrouver ses réservations par email ; compte client plus tard (reporté) |
| **Réservations de groupe** | Seul l'organisateur est identifié ; les participants sont invisibles | Le réachat **sous-estime** la fidélité réelle ; les liens partagés (`share_*` avec paramètres de suivi) mesurent une partie du bouche-à-oreille |
| **Recul de 6 mois** | Pas de réachat mesurable avant 6 mois | Indicateurs avancés (voir plus haut) |
| **Saisonnalité** | Les cohortes d'été et d'hiver ne se comparent pas directement | Lire le réachat par cohorte mensuelle |
| **Faible volume au lancement** | Taux instables, A/B tests non concluants | Période de référence (hypothèse H10) avant de fixer des cibles |
| **RGPD** | L'email haché reste une donnée personnelle (pseudonymisée) | Base légale : exécution de la réservation ; durée de conservation définie ; relances uniquement avec consentement séparé |

## Pilotage proposé

Un tableau de bord hebdomadaire (par exemple Looker Studio, connecté à BigQuery et à la base des réservations) :
1. Conversion du site et tunnel, par appareil et par source.
2. Frictions : `booking_error` par code et par étape.
3. Campagnes : coût par réservation et retour sur dépense.
4. Réservations, participants et chiffre d'affaires, par activité et par mois (source : moteur de réservation).
5. Réachat par cohorte mensuelle, dès que le recul de 6 mois est atteint.

## Conformité au brief

| Demande du brief | Réponse |
|---|---|
| « Conversion du site » | Formule, données, décisions |
| « Progression dans le parcours… Précise ce qui marque le démarrage » | Tunnel en 5 événements ; démarrage = `begin_checkout`, défini et testé |
| « Passage et décrochage entre deux étapes » | Formules ordonnées dans la session, tableau de lecture |
| « Finalisation et abandon » | Formules à partir de `begin_checkout` |
| « Réachat… six mois complets de recul » | Définitions (client, nouveau client, date, recul), source serveur |
| « Piloter les campagnes payantes » | `utm_*`, conversion par source, coût par réservation, retour sur dépense ; attribution testée |
| « Les événements et les informations nécessaires » | Plan de taggage, paramètres communs |
| « Les décisions possibles » | Colonne décisions, tableau « Lire un décrochage » |
| « Les limites, notamment pour reconnaître un client qui revient » | Tableau des limites ; email haché plutôt que cookies |
