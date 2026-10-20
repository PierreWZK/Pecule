# Jour 7/30 — Pécule, où passe votre argent, en un coup d'œil

> Stack : **React**, **Vite**, **Recharts**, **PocketBase** (comptes et base de données) · hébergement **Coolify** : le site sur `pecule.projectp.fr`, l'API sur `pecule-api.projectp.fr`.
> Durée visée : **2 h 45** pour le MVP, les bonus ensuite.

Ce document est notre contrat : on le suit étape par étape, et toute décision qui s'en écarte est d'abord notée ici. Il s'ajuste au début de la journée.

## 1. L'idée

Un tableau de bord de dépenses personnelles : on crée son compte, on saisit ses dépenses, et **Pécule** montre où part l'argent, mois par mois et catégorie par catégorie. Il compare au mois précédent et prévient quand un budget est dépassé.

Deux idées le rendent personnel :

- **L'objectif** : à l'inscription, on dit quel objet on veut s'offrir (une console, un vélo, un voyage…) et quelle habitude on serait prêt à arrêter. Pécule calcule en combien de mois l'objet est payé, puis propose d'autres économies d'après les vraies dépenses.
- **Le défi du jour** : une question de finances perso par jour, la même pour tout le monde, une seule tentative, une série 🔥.

## 2. MVP — ce qui doit fonctionner à la fin

1. **Comptes** : inscription et connexion par e-mail et mot de passe ; chacun ne voit que ses données.
2. **Objectif** demandé juste après l'inscription : l'objet, son prix, l'habitude à arrêter et son coût par mois → « payé dans N mois ».
3. Ajouter, modifier et supprimer une dépense (montant, date, catégorie, note).
4. Graphiques : répartition par catégorie (donut), évolution sur 6 mois (barres), cumul du mois comparé au mois précédent (courbe).
5. **Budgets** par catégorie, avec une jauge et une alerte au dépassement.
6. Filtres par mois et par catégorie.
7. **Défi du jour** : une question à choix multiples, l'explication, la série.
8. En ligne sur Coolify, avec un README à jour et un aperçu de lien (Open Graph).

### Périmètre volontairement limité

- Pas de connexion bancaire, pas d'import CSV (bonus).
- Pas de confirmation de l'adresse e-mail ni de mot de passe oublié en V1 (pas de serveur d'e-mails).
- Une seule devise : l'euro.

## 3. Cahier des charges fonctionnel

### A. Comptes

- Inscription : e-mail, mot de passe (8 caractères minimum), prénom facultatif.
- La session reste ouverte sur l'appareil ; bouton de déconnexion.
- Messages d'erreur en français (adresse déjà utilisée, mot de passe trop court, identifiants incorrects).

### B. L'objectif

1. « Quel objet voulez-vous vous offrir ? » : nom et prix.
2. « Quelle dépense seriez-vous prêt à arrêter ? » : une habitude proposée (café du matin, livraison de repas, cigarettes, abonnement de streaming, sorties) ou une saisie libre, avec son coût par mois.
3. Résultat : **mois nécessaires = prix ÷ économie mensuelle**, arrondi au mois supérieur, avec la date d'arrivée.

Sur le tableau de bord, la carte de l'objectif montre :

- la progression théorique depuis la création de l'objectif (mois écoulés × économie mensuelle) ;
- des **accélérateurs** tirés des vraies dépenses : « En réduisant Restaurants de 30 % (+42 €/mois), l'objet arrive 3 mois plus tôt » (sur les 3 plus grosses catégories, moyenne des 3 derniers mois).

L'objectif se modifie à tout moment ; une fois atteint, on en choisit un autre.

### C. Dépenses

- Formulaire rapide : montant (virgule acceptée), date (aujourd'hui par défaut), catégorie, note.
- Catégories fixes : Logement, Courses, Restaurants, Transport, Loisirs, Abonnements, Santé, Shopping, Autres.
- Liste du mois avec modification et suppression.

### D. Analyse

- Total du mois et écart avec le mois précédent, en euros et en %.
- Moyenne par jour, plus grosse dépense, top 3 des catégories.

### E. Budgets

- Un plafond par catégorie ; jauge verte, orange au-delà de 80 %, rouge au-delà de 100 %.
- Alerte dès la dépense qui fait passer le budget.

### F. Défi du jour

- Une question tirée d'après la date (heure de Paris) : la même pour tout le monde.
- 4 réponses, une seule tentative, puis l'explication.
- Série 🔥 de jours d'affilée et taux de bonnes réponses, gardés sur le compte.

## 4. Cahier des charges technique

### Architecture

```
src/
├── lib/          Fonctions pures, testées : montants, statistiques, objectif, défi, questions
├── pages/        Accueil, Objectif, Tableau de bord, Dépenses, Budgets, Défi
├── components/   Formulaire de dépense, graphiques, carte d'objectif, jauges
└── api.js        Client PocketBase (SDK officiel)
pocketbase/
├── Dockerfile    Image PocketBase
└── pb_migrations Collections et règles d'accès, appliquées au démarrage
```

### Données (PocketBase)

| Collection | Champs | Règle d'accès |
| --- | --- | --- |
| `users` | e-mail, mot de passe, prénom | collection d'authentification par défaut |
| `expenses` | user, amount (centimes), date, category, note | `user = @request.auth.id` |
| `budgets` | user, category, limit (centimes) | idem, un budget par catégorie |
| `goals` | user, item, price, habit, habit_monthly (centimes) | idem, un objectif par compte |
| `challenge_answers` | user, day, question, choice, correct | idem, une réponse par jour, pas de modification |

- Les montants sont des **entiers en centimes** : aucune erreur d'arrondi.
- À la création, la règle vérifie que `user` est bien l'utilisateur connecté : impossible d'écrire chez quelqu'un d'autre.
- Le schéma vit dans `pocketbase/pb_migrations/` : il est versionné et appliqué au démarrage.

### Mise en ligne

- **Site** : Coolify construit avec `npm run build` et publie `dist/`.
- **API** : PocketBase dans son propre conteneur (`pocketbase/Dockerfile`), avec un volume persistant pour `pb_data`.
- Le compte administrateur de PocketBase se crée via le lien d'installation affiché dans les logs au premier démarrage.

### Tests

`node --test` sur `src/lib/` : conversion des montants, statistiques, calcul de l'objectif, tirage et série du défi.

## 5. Critères de réussite

- [ ] Un utilisateur ne peut ni lire ni modifier les dépenses d'un autre (règles d'accès).
- [ ] « 549 € à 44 €/mois » donne 13 mois.
- [ ] Les totaux par catégorie correspondent à la somme des dépenses.
- [ ] Le budget dépassé est signalé dès la dépense qui le fait passer.
- [ ] Deux comptes ont la même question du jour ; on ne peut répondre qu'une fois.

## 6. Bonus facultatifs

- Import CSV d'un relevé bancaire.
- Dépenses récurrentes ajoutées chaque mois.
- Défi perso : deviner ses dépenses de la semaine dans une catégorie.
- Mot de passe oublié (avec un serveur d'e-mails).
- Export PDF du mois, mode clair.

## 7. Définition du « terminé »

Le MVP fonctionne, les critères de la section 5 sont cochés, le site est en ligne sur `pecule.projectp.fr`, le README a son lien et sa capture, et la carte du projet passe à « terminé » sur la vitrine.
