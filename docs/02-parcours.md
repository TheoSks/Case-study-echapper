# 2 · Parcours global & fidélisation

> Répond au deuxième point de la restitution : « le parcours global, les fonctionnalités retenues pour le lancement et tes arbitrages ».
> Fil conducteur : **l'organisateur**, la personne qui réserve pour les autres (voir [cadrage](01-cadrage.md)).

## Donner envie de réserver

Trois principes, tirés du guide de marque (« Donner envie. Rester clair. ») :

| Principe | Dans le site |
|---|---|
| **Montrer le geste** | Des visuels qui montrent ce qu'on fait (les mains dans l'argile, la pagaie), un texte « ce que tu vas vivre » avec des verbes concrets : modeler, pagayer, explorer |
| **Tout dire tout de suite** | Lieu, durée et prix TTC dès la carte ; total du groupe en direct ; disponibilité écrite en toutes lettres, jamais portée par la seule couleur |
| **Rassurer sans forcer** | Météo et annulation expliquées, âge minimum affiché. **Aucun faux avis, aucune fausse urgence** (« plus que 2 places ! ») : la confiance d'un nouveau canal se gagne par la clarté |

## Organisation de l'information

Le site est organisé **autour de l'activité** : les campagnes payantes mènent directement à une fiche, qui doit donc se suffire à elle-même (infos, créneaux, réservation).

| Page | Rôle | Prototype |
|---|---|---|
| En-tête | Navigation fixe : Activités · Comment ça marche · Groupes & contact · Réserver | ✅ |
| Accueil | Découvrir l'offre, rechercher par activité, date et participants | ✅ |
| Fiche activité | Comprendre, choisir un créneau et le nombre de participants, démarrer la réservation | ✅ |
| Récapitulatif | Vérifier activité, créneau, participants, total TTC ; confirmer | ✅ |
| Confirmation | Récapitulatif, partage avec le groupe, prochaines étapes | ✅ |
| Groupes & contact | Section de l'accueil (construite) : devis au-delà de 10, questions avant réservation ; formulaire de devis, téléphone et email proposés | ✅ section · 🟡 formulaire |
| Infos pratiques | Météo, annulation, accès | 🟡 proposé |
| Sélecteur FR / EN | Site en deux langues | 🟡 proposé |

## Le parcours, de la découverte à la nouvelle réservation

```mermaid
flowchart LR
  A[1 · Découvrir] --> B[2 · Choisir] --> C[3 · Réserver] --> D[4 · Préparer] --> E[5 · Vivre] --> F[6 · Prolonger] --> G[7 · Revenir]
  G -. relance saisonnière .-> B
  F -. photos et lien partagés : les participants deviennent organisateurs .-> A
```

| Étape | Ce que vit l'organisateur | Point de contact | Ce qu'Échappée y gagne |
|---|---|---|---|
| **1. Découvrir** | Voit une annonce, cherche une sortie, reçoit un lien d'un proche | Campagnes payantes et référencement qui **mènent directement à la fiche activité**, avec paramètres de suivi | Une arrivée mesurable par source de campagne |
| **2. Choisir** | Indique combien ils seront, compare, consulte les créneaux | Site : accueil, fiche activité | Les frictions de choix deviennent visibles |
| **3. Réserver** | Choisit un créneau et le nombre de participants, vérifie le total, paie | Site : récapitulatif, confirmation, ajout à l'agenda | La conversion, et l'email du client (en production) |
| **4. Préparer** (J0 à J-2) | Prévient son groupe, s'organise | Email de confirmation (J0). **Lien à partager avec les participants.** Email de préparation (J-2) : quoi apporter, accès, **météo** | Moins d'absences et de retards ; la marque touche aussi les participants |
| **5. Vivre** (jour J) | Fait l'activité | Sur place : l'animateur prend quelques photos | La matière du message suivant |
| **6. Prolonger** (J+1) | Se souvient de la sortie | Email de remerciement avec les photos et une demande d'avis | Des avis, des photos que l'organisateur partage |
| **7. Revenir** (J+30 et après) | Cherche la prochaine sortie | **Relance saisonnière** selon l'activité faite (kayak l'été → céramique ou escape game l'hiver) ; pour un groupe, rappel **à la même période l'année suivante** | Le réachat à 6 mois, des périodes creuses mieux remplies |

Le **téléphone**, canal historique d'Échappée, reste un point de contact : pour les groupes de plus de 10 (devis) et pour les questions avant réservation.

### Comment le produit fait revenir

Les étapes 4 à 7 forment une boucle :
- **L'organisateur** est accompagné avant et après, puis on lui propose la sortie suivante au bon moment de l'année.
- **Les participants** découvrent la marque par le lien partagé et les photos. C'est une **hypothèse** : on la vérifie en mesurant les visites issues des liens partagés (paramètres de suivi).

### La météo (activités en extérieur)

Proposé, à valider avec le client (question Q3 du cadrage) : la prévision figure dans l'email J-2. Si Échappée annule, le client est prévenu par email avec un choix : report, autre activité, ou remboursement selon la politique retenue.

### Ce que le parcours ne couvre pas

Le brief exclut la conception de campagnes d'acquisition. Pour la découverte, on décrit uniquement les **points d'entrée** (une campagne mène à une fiche activité, avec des paramètres de suivi), pas les campagnes.

## Fonctionnalités : construit, proposé, reporté

**Critère de tri** : une fonctionnalité entre au lancement si elle fait bouger un indicateur du brief (conversion, campagnes payantes, réachat) **et** qu'elle ne demande pas d'infrastructure lourde. Le prototype, lui, se limite aux règles métier et à deux éléments qui rendent visibles nos positions (partage avec le groupe, frise « Et ensuite ? »).

| ✅ Construit et vérifié (prototype) | 🟡 Proposé pour le lancement (non développé) | ⏭️ Reporté |
|---|---|---|
| Recherche Activité · Date (calendrier des jours disponibles) · Participants, résultats adaptés à chaque cas | Paiement du total en ligne | Compte client |
| Fiche activité, disponibilité écrite en toutes lettres, activité complète consultable | Saisie du prénom et de l'email, consentement séparé pour les relances | Relance des réservations abandonnées |
| Réservation d'un créneau, revérification à la confirmation | Email de confirmation (J0) | Liste d'attente sur un créneau complet |
| Récapitulatif TTC, confirmation, places déduites une seule fois | Email de préparation et météo (J-2) | Rappel par SMS (J-1) |
| Outil de démo : simuler un créneau devenu complet, réinitialiser | Email de remerciement, avis et photos (J+1) | Carte cadeau |
| **Partage avec le groupe** : proposer la sortie avant de réserver, puis transmettre lieu, heure et « à prévoir » après (partage natif du téléphone, copie sur ordinateur) | Relance saisonnière, rappel annuel pour les groupes | Programme de fidélité, parrainage |
| Frise « Et ensuite ? » montrant les prochains points de contact | Demande de devis au-delà de 10 personnes | Avis affichés sur le site |
| Événements du tunnel (`dataLayer` local, sans outil connecté) | Page d'infos pratiques : météo, annulation, accès | Acompte pour les groupes, annulation en ligne |
| Mention « réservation simulée » sur tout le parcours | Site en anglais | Autres langues |
| | Ajout à l'agenda (.ics) | Espace « Mes réservations » |

Le prototype n'envoie aucun email : la frise « Et ensuite ? » décrit ce que ferait la version en ligne, sans jamais dire qu'un message a été envoyé.

## Arbitrages

| # | Choix | Pourquoi |
|---|---|---|
| 1 | **Un seul canal après la réservation : l'email** | Un outil, un consentement. Le SMS coûte plus cher : on l'ajoutera si les absences deviennent un problème mesuré |
| 2 | **Relance saisonnière plutôt que programme de fidélité** | Un programme demande du volume et de la comptabilité. La relance n'utilise que ce qu'on sait déjà (activité, date), remplit les périodes creuses et se mesure par le réachat à 6 mois |
| 3 | **Pas de compte client** | Un compte ajoute de la friction sur mobile ; l'email suffit à reconnaître le client qui revient |
| 4 | **Collecter les avis dès le lancement, les afficher plus tard** | Il faut du volume et de la modération avant de les montrer |
| 5 | **Pas de liste d'attente au lancement** | Elle exige un système de notification. En attendant, un créneau complet renvoie vers les autres créneaux et activités |
| 6 | **Relance des abandons reportée** | Elle suppose d'avoir l'email et le consentement avant la fin du parcours |
| 7 | **Carte cadeau reportée malgré son potentiel** (Noël) | Complexité du paiement et de la comptabilité. Premier candidat pour la V2 |
| 8 | **Partage avec le groupe construit dans le prototype** | Peu coûteux, sans donnée collectée, et il rend concret le rôle de l'organisateur |
| 9 | **Pas de filtre par type d'activité** | Avec 3 activités, un filtre n'apporte rien ; la taille du groupe et la date sont les vrais critères d'adaptation. À revoir quand le catalogue grandira |
| 10 | **Recherche sur le modèle du marché : Activité · Date · Participants** | Benchmark (GetYourGuide, Funbooker, Airbnb Expériences) : l'organisateur raisonne en « quoi », « quand » et « combien ». Le calendrier ne propose que les jours où un horaire peut accueillir le groupe ; les jours complets restent visibles, barrés |
| 11 | **Planning sur l'année, avec saisonnalité** | Céramique toute l'année, kayak d'avril à octobre : c'est la réalité d'une activité de plein air, et la base de la relance saisonnière |
| 12 | **Fiche activité sur le modèle d'Airbnb Expériences** | Repris : points clés sous le titre, « Ce que tu vas vivre » concret, « Où se retrouver », « À savoir », réservation toujours visible, suggestions en fin de page. Écartés : avis et notes (la marque interdit de revendiquer des avis), profil d'hôte (personne inventée), favoris (pas de compte), galerie (une image par activité), carte (service externe) |

## Conformité au brief

| Demande du brief | Réponse |
|---|---|
| « Une expérience qui donne envie de réserver » | Section « Donner envie de réserver » |
| « L'organisation de l'information, les écrans, les interactions, la marque » | Section « Organisation de l'information » ; écrans détaillés dans le prototype |
| « Découvrir l'offre, trouver une activité adaptée, réserver, notamment depuis leur téléphone » | Étapes 1 à 3 ; filtre par taille de groupe ; conception mobile d'abord |
| « Le parcours global, de la découverte à une éventuelle nouvelle réservation » | Les 7 étapes et la boucle |
| « Les points de contact au-delà du site » | Emails J0, J-2, J+1, relance saisonnière, partage, sur place, téléphone |
| « Comment le produit pourrait encourager les clients à revenir » | Boucle organisateur et relance saisonnière |
| « Les fonctionnalités retenues pour le lancement et tes arbitrages » | Critère de tri, tableau en trois colonnes, 9 arbitrages |
| « Distingue construit et vérifié, proposé, reporté » | Tableau en trois colonnes |
