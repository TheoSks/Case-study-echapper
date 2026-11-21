# 1 · Cadrage du besoin

> Répond au premier point de la restitution : « le besoin, tes hypothèses et les questions à clarifier avec le client ».

## 1. Le besoin

### Ce que demande Échappée

Échappée vend aujourd'hui ses activités à des organisations, par téléphone, puis via un portail. Elle ouvre un **site public pour les particuliers et les groupes**, avec trois attentes :

1. **Donner envie de réserver.**
2. **Un parcours utilisable** : découvrir l'offre, trouver une activité adaptée et réserver en ligne, notamment depuis un téléphone.
3. **Faire revenir** : garder le contact après la réservation, de la préparation de l'activité jusqu'à une prochaine visite.

Et une attente de pilotage : repérer les frictions jusqu'à la réservation, suivre le retour des clients, piloter les campagnes payantes du lancement.

### Ce qui change avec le B2C

Le canal est nouveau : on ne transpose pas le fonctionnement B2B.

| | B2B aujourd'hui | B2C demain |
|---|---|---|
| Qui réserve | Un contact identifié dans une organisation | Un inconnu qui découvre la marque |
| Comment | Par téléphone, avec un conseiller | Seul, en ligne, souvent sur mobile, à toute heure |
| Volume | Peu de réservations, de grande taille | Beaucoup de petites réservations |
| Relation | Suivie, via un portail | Ponctuelle : à entretenir pour qu'il revienne |
| Connaissance client | Acquise | À construire, sans compte client |

### L'utilisateur clé : l'organisateur

Qu'il s'agisse d'un duo, d'une famille ou d'un groupe d'amis ou d'association, **une seule personne réserve pour les autres**. C'est elle qu'il faut convaincre, et c'est elle qui reviendra.

Ce que ça implique :
- **Choisir** : l'activité doit être filtrée par la taille du groupe, avec la disponibilité réelle, pour « trouver une activité adaptée ».
- **Décider** : le prix total du groupe doit être visible avant de s'engager.
- **Organiser** : l'organisateur doit pouvoir transmettre les infos pratiques à ses participants (point de contact proposé, sujet 2).
- **Revenir** : c'est l'organisateur qu'on relance. Limite : les participants restent inconnus (sujet 6).

### Du besoin à la réponse

| Besoin | Réponse produit | Sujet |
|---|---|---|
| Découvrir l'offre | Accueil avec les activités et leurs infos clés : lieu, durée, prix | Prototype |
| Trouver une activité adaptée | « Vous serez combien ? », disponibilité affichée en clair | Prototype |
| Réserver depuis un téléphone | Tunnel court, total visible, action toujours accessible | Prototype |
| Garder le contact jusqu'à la prochaine visite | Préparation, après l'activité, relance saisonnière | 2 · Parcours |
| Piloter le site et les campagnes | Plan de taggage et indicateurs | 6 · Mesure |

## 2. Hypothèses

| # | Hypothèse | Conséquence |
|---|---|---|
| H1 | **Stock partagé** : B2B et B2C vendent les mêmes créneaux, avec une seule source de vérité des places | Le site ne détient jamais les places : il interroge un moteur de réservation central. Risque principal : la surréservation |
| H2 | **Prix par personne TTC**, identique quel que soit le nombre de participants | Total = prix unitaire × participants |
| H3 | Groupes jusqu'à **10 participants** en ligne ; au-delà, **demande de devis** | Devis proposé, non développé. Dans le prototype, aucun créneau ne dépasse 10 places : la seule limite appliquée reste celle du brief, les places restantes |
| H4 | **Paiement du total en ligne** à la réservation | Confirmation immédiate. Acompte pour les groupes reporté |
| H5 | **Français et anglais** au lancement | Architecture prête pour d'autres langues. Prototype en français uniquement |
| H6 | **Pas de compte client** | En production, l'email saisi à la réservation identifie le client qui revient. Le prototype ne demande aucune donnée personnelle |
| H7 | **Trafic majoritairement mobile** | Conception mobile d'abord |
| H8 | **Une réservation = un organisateur** | Un seul contact par réservation, quel que soit le nombre de participants. Si les membres d'un groupe préfèrent réserver chacun de leur côté, rien ne casse : le stock est unique et chaque réservation est revérifiée. Le risque est le **groupe éclaté** (le dernier trouve le créneau complet) ; le prototype y répond par un lien qui garde le créneau et par le **paiement partagé** (places bloquées pour tout le groupe, chacun règle sa part). À vérifier dans les données (voir [mesure](06-mesure.md)) |
| H9 | **Contraintes par activité** : âge minimum, savoir nager pour le kayak | Affichées sur la fiche, non contrôlées dans le prototype |
| H10 | **Pas d'objectif chiffré** au lancement | Canal nouveau : les premières semaines servent de période de référence avant de fixer des cibles |

## 3. Questions à clarifier avec le client

★ = présentées à l'oral, par ordre d'impact sur la conception.

| # | Question | Ce que la réponse change |
|---|---|---|
| ★ Q1 | Dans quel outil vivent les places aujourd'hui, et comment le B2B les consomme-t-il ? | Intégration du moteur de réservation, risque de surréservation (H1) |
| ★ Q2 | Existe-t-il des tarifs groupe ou enfant ? | Calcul du total, seuil du devis (H2, H3) |
| ★ Q3 | Météo : qui annule une activité extérieure, combien de temps avant, quelle alternative (report, avoir, autre activité) ? | Messages avant l'activité, conditions de vente, confiance au moment de réserver |
| ★ Q4 | Quels objectifs et quel budget pour les campagnes du lancement ? | Cibles des indicateurs, plan de taggage des campagnes (H10) |
| Q5 | Quels marchés après FR et EN ? Les touristes étrangers sont-ils une cible ? | Langues, contenus, saisonnalité de l'offre (H5) |
| Q6 | Quelle politique d'annulation et de report pour les particuliers ? | Conditions de vente, réassurance dans le parcours |
| Q7 | Un prestataire de paiement existe-t-il déjà ? | Choix technique, délais (H4) |
| Q8 | Une privatisation est-elle possible pour les groupes de plus de 10 ? | Parcours devis (H3) |
| Q9 | Le tarif public peut-il attirer des entreprises qui contourneraient le B2B ? | Règles de prix, conditions d'accès |
| Q10 | Les équipes peuvent-elles accueillir des particuliers le week-end et en soirée ? | Créneaux ouverts au public |
| Q11 | Qui édite les contenus, et à quel rythme ? | Choix du CMS, autonomie du marketing |
| Q12 | Quels outils existent déjà : CRM, emailing, gestion du consentement ? | Points de contact après réservation, RGPD |
| Q13 | Vos groupes paient-ils ensemble ou chacun sa part ? Une part non réglée à l'échéance : à la charge de l'organisateur, ou place remise en vente ? | Paiement partagé (H8) : délai, relances, conditions de vente |

Hors périmètre : le portail B2B et les clients entreprises.
