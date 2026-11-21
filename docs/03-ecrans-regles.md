# 3 · Écrans & règles métier

## Les écrans du prototype

| Écran | Étape du tunnel (brief) | Événement analytics |
|---|---|---|
| **Accueil** : grande image et accroche ; barre de recherche **Activité · Date · Participants** (calendrier mensuel : disponible = point vert, peu de places (3 ou moins) = point Soleil, complet = barré Argile, sans créneau = grisé ; légende et libellés lus à voix haute) ; cartes avec lieu, durée, âge, prix TTC et disponibilité pour la recherche (« Disponible le … à … », « Complet ce jour-là pour N personnes · prochain : … », « Pas de créneau ce jour-là ») ; encart « Mode démo » ; « Comment ça marche » ; bandeau de marque | Découverte | `view_item_list`, `search` |
| **Fiche activité** : titre et « Proposer à ton groupe », points clés (lieu, durée, capacité, âge, langue, saison), « Ce que tu vas vivre », « Inclus » / « À prévoir », « Où se retrouver », « À savoir » ; panneau de réservation fixe (prix, calendrier, horaires du jour, participants, total TTC, « Réserver ») ; « D'autres échappées » (mêmes cartes que l'accueil) ; barre mobile « Dès … · Choisir une date » puis « Total · Réserver » | Consultation d'une activité, sélection d'un créneau, **démarrage** | `view_item`, `select_slot`, `begin_checkout` |
| **Récapitulatif** (deux colonnes, sur le modèle « Confirmer et payer ») : « Ta sortie » (date, participants avec « Modifier », rendez-vous), « Coordonnées et paiement » marqué « version en ligne » sans aucun champ, mention « réservation simulée », « Confirmer » ; carte récapitulative avec détail du prix et **total TTC**, placée **avant** le bouton dans l'ordre de lecture (en haut sur mobile, à droite sur ordinateur) | Récapitulatif | `view_summary` |
| **Confirmation** : récapitulatif, « Préviens ton groupe » (partage) ou, en paiement partagé, « Chacun règle sa part » (parts réglées, lien de paiement), « Et ensuite ? » en 3 étapes, suggestion saisonnière ; décompte des places visible dans les outils de démo | Confirmation | `booking_confirmed` (avec les paramètres de campagne de l'arrivée) |

**Démarrage de la réservation** : clic sur « Réserver » avec un créneau choisi **et** un nombre de participants valide. Un clic sans créneau ou avec une saisie invalide n'est pas un démarrage : il déclenche `booking_error`.

## Règles métier → écran → preuve

Tests : `npm test` (86 tests). Fichiers : `src/domain/booking.test.ts` (domaine), `src/state/store.test.ts` (session), `src/App.test.tsx` (parcours dans l'interface).

| Règle du brief | Où | Test |
|---|---|---|
| Une activité complète reste consultable et son indisponibilité est compréhensible | Escape game : fiche ouverte, encadré « complète sur toutes les dates proposées », créneaux affichés « Complet », liens vers les autres activités ; carte d'accueil « Complet sur les dates proposées » | `App.test` › Créneaux et activités complets |
| Un seul créneau, un nombre entier de participants > 0, sans dépasser les places restantes | Créneaux en boutons radio ; saisie validée en direct avec message explicite | `booking.test` › participants, places restantes · `App.test` › Saisies invalides |
| Un créneau complet ne peut pas être réservé ; règles vérifiées au moment de confirmer | Créneau complet désactivé ; la confirmation revérifie tout contre l'état des places au moment du clic. Outil de démo pour le montrer | `booking.test` › revérifie au moment de confirmer · `App.test` › créneau devenu complet |
| Avant confirmation : activité, créneau, participants, total TTC | Récapitulatif | `App.test` › de la fiche à la confirmation |
| Après confirmation : places déduites du seul créneau choisi, récapitulatif affiché, décompte unique | Confirmation ; identifiant de parcours (`draftId`) rendant la confirmation idempotente, bouton désactivé, historique remplacé | `booking.test` › seul créneau, une seule fois · `App.test` › double clic, retour sur le récapitulatif |
| Une saisie invalide n'enregistre rien et ne modifie pas les disponibilités | Fiche (saisie), récapitulatif (URL modifiée à la main) | `booking.test` › état strictement inchangé · `App.test` › URL modifiée |
| Places cohérentes pendant la session ; persistance documentée | `sessionStorage` : conservées au rechargement, remises à zéro à la fermeture de l'onglet ou via « Réinitialiser la démo » | `store.test` |
| Réservation clairement simulée : ni paiement, ni email, ni donnée personnelle | Bandeau sur toutes les pages, encadré sur le récapitulatif, phrase sur la confirmation. Aucun champ de donnée personnelle | `App.test` › Mention de simulation |

## Cas limites joués devant le jury

| Action | Résultat attendu |
|---|---|
| 0, -2, 2,5, « abc » participants | Message en ligne, pas de passage au récapitulatif, rien d'enregistré |
| 8 participants sur le kayak du dimanche 18 avril, 9 h 30 (7 places) | « Il reste 7 places sur ce créneau. » |
| Clic sur un créneau complet | Impossible (désactivé, libellé « Complet ») |
| Accueil, 4 participants, samedi 24 avril | Céramique : « Complet ce jour-là pour 4 personnes · prochain : … » |
| Accueil, kayak, samedi 16 janvier | « Pas de créneau ce jour-là · prochain : … avril » (activité saisonnière) |
| 6 participants sur l'atelier céramique du samedi 24 avril | L'horaire à 2 places est grisé, « 2 places restantes · pas assez pour 6 », mais reste sélectionnable (le nombre se modifie) ; sur l'accueil, les cartes qui ne conviennent pas sont atténuées |
| Ouvrir l'escape game | Fiche consultable, indisponibilité expliquée, alternatives |
| Double clic sur « Confirmer » | Une seule réservation, places décomptées une fois |
| Retour arrière ou URL du récapitulatif après confirmation | « Cette réservation est déjà confirmée », aucun nouveau décompte |
| Outil de démo « le créneau devient complet », puis « Confirmer » | Refus explicite, rien d'enregistré |
| URL modifiée (`participants=99`) | Refus explicite au récapitulatif, pas de bouton « Confirmer » |
| Rechargement de la page | Places conservées |

## Cas limites hors du prototype : les réponses

Cas repérés en revue, qui relèvent de la production ou d'une décision du client. Ils ne sont pas construits ; la réponse est prête.

| Cas | Risque | Réponse |
|---|---|---|
| **Réservation la veille en paiement partagé** | Échéance des parts postérieure à la sortie | **Corrigé dans le prototype** : l'échéance est la plus proche de « 48 h après la réservation » et « 24 h avant l'activité » ; à moins de 24 h, seul « Je règle pour tout le groupe » est proposé (testé) |
| **Lien de paiement commun à tout le groupe** | Plus de parts réglées que de places, ou une part payée deux fois | Production : un lien par place, ou un compteur côté serveur qui ferme le paiement quand toutes les parts sont réglées. La page participant de la démo s'ouvre dans un autre navigateur et ne peut pas connaître ce compteur |
| **L'organisateur ne participe pas** (sortie offerte, enfants inscrits par un parent) | Libellés faux (« organisateur compris », « ta part ») | Production : case « Je ne participe pas » qui adapte les libellés et le paiement partagé. Mène aussi à la carte cadeau (reportée) |
| **Enfants dans le groupe** | Un enfant ne règle pas sa part | Paiement partagé « mixte » : l'organisateur règle plusieurs parts (la sienne et celles de ses enfants). Lié au tarif enfant (Q2) |
| **Même organisateur, même créneau, deux parcours** | Réservation en double par erreur (l'idempotence ne couvre que le même parcours) | Production : même email et même créneau → « Tu as déjà réservé ce créneau : ajouter des places ? ». Impossible dans le prototype, qui ne collecte pas d'email |
