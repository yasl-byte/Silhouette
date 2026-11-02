# Silhouette v2

PWA de suivi sur un **cycle de 100 jours** (3 novembre 2026 → 10 février 2027) : Musculation, V-Shape, Souplesse, NEAT, Lecture, Prières, Tabac.

## Les cinq cercles (100 % = objectif atteint)

| Cercle | Cible pour 100 % | Calcul |
|---|---|---|
| Force | 42 séances (3 × 14 semaines) | Séance parfaite = 70 % musculation + 20 % V-Shape + 10 % échauffement, au prorata |
| Souplesse | 98 jours | Routine complète du jour, au prorata des mouvements cochés |
| Esprit | 14 semaines de 50 pages minimum | Chaque semaine vaut 1/14, au prorata des pages |
| Spiritualité | 5 prières × 98 jours | Prières cochées |
| Santé | 100 jours sans fumer | Une rechute remet le cercle à zéro |

Au 101e jour, les pourcentages du cycle sont archivés et les compteurs repartent de zéro. Les **records** (meilleur pourcentage par cercle) sont conservés. Le compteur de tabac, lui, ne s'arrête pas : seul le cercle Santé repart.
Le NEAT n'entre pas dans les cinq cercles : il s'affiche à part, comme bonus.

## Fonctions

- Jour : six onglets, échauffement avant chaque séance, minuteur de repos, signal « monter la charge », pesée lissée sur 7 jours.
- Permutation de deux dates (séances et jours ON/OFF), annulable ; refusée si la séance est entamée.
- Tabac : compteur à la seconde, grades militaires, record au jour et à l'heure près avec son grade, bouton de rechute avec confirmation et sermon.
- Prières : horaires Aladhan pour Charleroi et Bruxelles, verset du jour en français (traduction Hamidullah).
- Lecture : recherche Google Books ou saisie manuelle, pages par jour, progression par livre.
- Personnalisation : thème, palette et couleurs de chaque axe, taille du texte, modules masquables, durées de repos, méthode de calcul des prières.

## Réseau

Aladhan, l'API des versets et Google Books ne servent qu'au premier chargement : tout est conservé sur l'appareil ensuite. Sans connexion, l'application fonctionne avec ce qu'elle a déjà récupéré ; les horaires du mois en cours et du suivant, et les versets des sept prochains jours, sont préchargés à chaque ouverture en ligne.

## Modifier le programme

`data.js` contient exercices, échauffements, routine de souplesse, grades, sermons, liste de versets, palettes et cibles des cercles. Après modification, incrémenter `VERSION` dans `sw.js`.

## Déploiement (GitHub Pages)

1. Déposer le contenu de ce dossier à la racine d'un dépôt.
2. Réglages › Pages › branche `main`, dossier `/ (root)`.
3. Ouvrir l'URL sur le téléphone, puis « Ajouter à l'écran d'accueil ».

Les données restent dans le navigateur de l'appareil. **Exporter** régulièrement (Réglages › Sauvegarde).
