# 🍽️ Mes Recettes de Cuisine

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Licence](https://img.shields.io/badge/Licence-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.0.0-blue.svg)](package.json)

**Application Progressive Web App (PWA) complète de gestion de recettes de cuisine**, conçue pour organiser vos recettes, planifier vos repas, générer des listes de courses et suivre votre progression en temps réel pendant la réalisation.

Installable sur mobile et desktop, l'application fonctionne avec une base de données PostgreSQL pour une gestion robuste des données, tout en proposant un mode de fonctionnement dégradé avec des fichiers JSON pour un démarrage simplifié.

---

## 📋 Table des matières

- [Fonctionnalites principales](#-fonctionnalités-principales)
- [Technologies utilisees](#-technologies-utilisées)
- [Prerequis](#-prérequis)
- [Installation et deploiement](#-installation-et-déploiement)
- [Variables d'environnement](#-variables-denvironnement)
- [Architecture de la base de donnees](#-architecture-de-la-base-de-données)
- [Structure du projet](#-structure-du-projet)
- [Utilisation de l'application](#-utilisation-de-lapplication)
- [API REST](#-api-rest)
- [Contribution](#-contribution)
- [Licence](#-licence)

---

## ✨ Fonctionnalites principales

### Gestion des recettes
- Creation, modification et suppression de recettes avec photo
- Categorisation par type (entree, plat, dessert, accompagnement, sauce, boisson...)
- Attribution d'origines geographiques (cuisine francaise, italienne, japonaise...)
- Systeme de favoris pour retrouver rapidement vos recettes preferees
- Ajustement automatique des quantites selon le nombre de personnes
- Export PDF des recettes

### Recherche et filtres avances
- Recherche par nom de recette
- Filtrage par type, temps de preparation, origine et ingredients disponibles
- Tri par nom, type, origine, nombre de realisations ou temps total
- Selection aleatoire de recettes (par type ou menu complet entree + plat + dessert)

### Planning de repas
- Calendrier hebdomadaire avec vue midi/soir
- Ajout de recettes par glisser-deposer ou selection dans une modale
- Navigation entre les semaines
- Generation de liste de courses a partir du planning

### Listes de courses
- Generation automatique a partir d'une selection de recettes
- Ajustement du nombre de personnes par recette
- Regroupement intelligent des ingredients par categorie
- Copie en un clic et sauvegarde dans l'historique
- Generation depuis le planning hebdomadaire

### Mode realisation avec suivi de progression
- Bouton "Demarrer la recette" pour entrer en mode realisation
- Navigation etape par etape avec barre de progression
- Validation automatique des etapes au passage a la suivante
- Timers integres dans les etapes (quand configures)
- Sauvegarde automatique de la progression en base de donnees
- Reprise intelligente a la derniere etape validee

### Historique et statistiques
- Historique complet des recettes demarrees et terminees
- Filtrage par statut (en cours / terminee) et par periode
- Compteur de realisations affiche sur les cartes de recettes
- Badge "Realisee X fois" pour chaque recette
- Tri par popularite (nombre de realisations)

### Administration centralisee
- Gestion des recettes (ajout, modification, suppression)
- Gestion des ingredients par categories
- Gestion des unites de mesure par categories
- Interface de recherche dans chaque section

### Experience utilisateur
- Progressive Web App installable sur mobile et desktop
- Support du mode hors ligne via Service Worker
- Interface responsive (mobile, tablette, desktop)
- Support automatique du mode sombre
- Widget de timers actifs flottant et repliable

---

## 🛠 Technologies utilisees

### Frontend
| Technologie | Description |
|---|---|
| **HTML5 / CSS3 / JavaScript** | Interface utilisateur sans framework |
| **PWA** | Service Worker, manifest.json, mode offline |
| **CSS Variables** | Theming dynamique (mode clair/sombre) |

### Backend
| Technologie | Description |
|---|---|
| **Node.js 20+** | Serveur HTTP natif (sans Express) |
| **PostgreSQL 16** | Base de donnees relationnelle |
| **pg** | Client PostgreSQL pour Node.js |

### Infrastructure
| Technologie | Description |
|---|---|
| **Docker** | Conteneurisation de l'application |
| **Docker Compose** | Orchestration multi-conteneurs |
| **pgAdmin 4** | Interface web d'administration PostgreSQL |

---

## 📦 Prerequis

- **Docker** >= 20.10 et **Docker Compose** >= 2.0 (methode recommandee)
- Ou **Node.js** >= 18.0 et **PostgreSQL** >= 14 (installation manuelle)

---

## 🚀 Installation et deploiement

### Methode recommandee : Docker Compose

#### 1. Cloner le repository

```bash
git clone https://github.com/votre-utilisateur/cuisine-pwa.git
cd cuisine-pwa
```

#### 2. Configurer l'environnement

```bash
cp .env.example .env
```

Editez le fichier `.env` si vous souhaitez modifier les valeurs par defaut (ports, mots de passe...).

#### 3. Lancer l'application

```bash
docker-compose up -d
```

Cette commande demarre trois services :
- **Application** accessible sur [http://localhost:8000](http://localhost:8000)
- **PostgreSQL** sur le port 5432
- **pgAdmin** accessible sur [http://localhost:5051](http://localhost:5051)

#### 4. Verifier le statut

```bash
docker-compose ps
```

#### Commandes utiles

```bash
# Voir les logs en temps reel
docker-compose logs -f

# Arreter les services
docker-compose down

# Reconstruire apres modification du code
docker-compose up -d --build

# Reinitialiser la base de donnees (supprime les donnees)
docker-compose down -v && docker-compose up -d
```

### Methode alternative : Installation manuelle

#### 1. Installer les dependances

```bash
npm install
```

#### 2. Configurer PostgreSQL

Creer une base de donnees et executer le script d'initialisation :

```bash
createdb cuisine_db
psql -d cuisine_db -f database/init.sql
```

#### 3. Configurer l'environnement

```bash
cp .env.example .env
# Editer .env avec vos parametres de connexion PostgreSQL
```

#### 4. Demarrer l'application

```bash
# Avec PostgreSQL
npm start

# Sans PostgreSQL (mode fichiers JSON)
npm run dev
```

L'application est accessible sur [http://localhost:8000](http://localhost:8000).

---

## ⚙ Variables d'environnement

| Variable | Description | Valeur par defaut |
|---|---|---|
| `PORT` | Port de l'application | `8000` |
| `USE_DATABASE` | Activer PostgreSQL (`true`/`false`) | `true` |
| `DB_HOST` | Hote de la base de donnees | `localhost` |
| `DB_PORT` | Port PostgreSQL | `5432` |
| `DB_NAME` | Nom de la base de donnees | `cuisine_db` |
| `DB_USER` | Utilisateur PostgreSQL | `cuisine_user` |
| `DB_PASSWORD` | Mot de passe PostgreSQL | *(voir .env.example)* |
| `APP_PORT` | Port expose par Docker | `8000` |

> **Note :** En mode Docker, `DB_HOST` est automatiquement defini sur `postgres` (nom du service).

---

## 🗄 Architecture de la base de donnees

Le schema est initialise automatiquement via `database/init.sql` au premier demarrage du conteneur PostgreSQL.

### Schema des tables

```
┌─────────────────────┐     ┌──────────────────────┐
│  categories_         │     │  categories_          │
│  ingredients         │     │  unites               │
│  ─────────────────   │     │  ────────────────     │
│  id (PK)             │     │  id (PK)              │
│  nom                 │     │  nom                  │
│  ordre               │     │  ordre                │
└────────┬────────────┘     └────────┬─────────────┘
         │ 1:N                       │ 1:N
         ▼                           ▼
┌─────────────────────┐     ┌──────────────────────┐
│  ingredients         │     │  unites               │
│  ─────────────────   │     │  ────────────────     │
│  id (PK)             │     │  id (PK)              │
│  nom                 │     │  nom                  │
│  categorie_id (FK)   │     │  categorie_id (FK)    │
└─────────────────────┘     └──────────────────────┘

┌──────────────────────┐
│  types_plat           │
│  ────────────────     │
│  id (PK)              │
│  code (unique)        │◄─────────────────────┐
│  libelle              │                      │
└──────────────────────┘                      │
                                               │
┌──────────────────────────────────────────────┼──────────┐
│  recettes                                    │          │
│  ──────────────────────────────────────      │          │
│  id (PK, VARCHAR - slug)                     │          │
│  nom                                         │          │
│  type_id (FK) ───────────────────────────────┘          │
│  temps_preparation (minutes)                             │
│  temps_cuisson (minutes)                                 │
│  nombre_personnes                                        │
│  image_url                                               │
│  photo_locale                                            │
└────────┬──────────────┬─────────────┬───────────────────┘
         │              │             │
         │ 1:N          │ 1:N         │ N:M
         ▼              ▼             ▼
┌────────────────┐ ┌──────────┐ ┌──────────────────┐  ┌──────────┐
│ recettes_      │ │ etapes_  │ │ recettes_        │  │ origines │
│ ingredients    │ │ recette  │ │ origines         │  │ ──────── │
│ ────────────── │ │ ──────── │ │ ──────────────── │  │ id (PK)  │
│ id (PK)        │ │ id (PK)  │ │ recette_id (FK)  │──│ nom      │
│ recette_id(FK) │ │ rec.(FK) │ │ origine_id (FK)  │  └──────────┘
│ nom_ingredient │ │ ordre    │ └──────────────────┘
│ quantite       │ │ descrip. │
│ unite          │ │ duree_   │
│ ordre          │ │ minutes  │
└────────────────┘ └──────────┘

┌──────────────────────────────────────────┐
│  historique_recettes                      │
│  ──────────────────────────────────      │
│  id (PK)                                  │
│  recette_id (FK → recettes)               │
│  date_debut (TIMESTAMP)                   │
│  date_fin (TIMESTAMP, nullable)           │
│  statut ('en_cours' | 'terminee')         │
│  progression_etapes (JSONB)               │
│  nombre_personnes                         │
│  notes                                    │
└──────────────────────────────────────────┘

┌─────────────────┐  ┌───────────────────┐  ┌────────────────────────┐
│  favoris         │  │  planning          │  │  historique_courses     │
│  ─────────────   │  │  ───────────────   │  │  ──────────────────    │
│  id (PK)         │  │  id (PK)           │  │  id (PK)               │
│  recette_id (FK) │  │  date_repas        │  │  date_creation         │
│  date_ajout      │  │  moment            │  │  nombre_personnes      │
└─────────────────┘  │  (midi/soir)        │  │  liste_json (JSONB)    │
                      │  recette_id (FK)    │  └────────────────────────┘
                      └───────────────────┘
```

### Vues et fonctions

| Element | Description |
|---|---|
| `vue_recettes` | Recettes avec type et temps total |
| `vue_planning` | Planning avec noms et images des recettes |
| `vue_compteur_realisations` | Nombre de realisations par recette |
| `vue_historique_recettes` | Historique avec calcul de duree |
| `get_nombre_realisations()` | Compteur de realisations d'une recette |
| `get_recette_en_cours()` | Session de realisation active |

### Structure JSONB de `progression_etapes`

```json
{
  "etapes": [
    { "validee": true },
    { "validee": true },
    { "validee": false, "timer": { "duree_totale": 600, "temps_restant": 300, "etat": "paused" } },
    { "validee": false }
  ]
}
```

---

## 📁 Structure du projet

```
cuisine-pwa/
├── docker-compose.yml          # Orchestration Docker (app + PostgreSQL + pgAdmin)
├── Dockerfile                  # Image Docker de l'application
├── .env.example                # Template des variables d'environnement
├── package.json                # Dependances et scripts npm
├── server.js                   # Serveur Node.js (HTTP natif, routes API)
├── manifest.json               # Configuration PWA
├── sw.js                       # Service Worker (cache offline)
├── index.html                  # Interface utilisateur (SPA)
│
├── css/
│   └── styles.css              # Feuille de styles (responsive + mode sombre)
│
├── js/
│   └── app.js                  # Logique applicative frontend
│
├── db/
│   ├── database.js             # Pool de connexion PostgreSQL
│   ├── queries.js              # Fonctions de requetes SQL
│   └── migration.js            # Migration des donnees JSON → PostgreSQL
│
├── database/
│   └── init.sql                # Script d'initialisation du schema PostgreSQL
│
├── recettes/                   # Fichiers JSON des recettes (70+)
│   ├── sushis.json
│   ├── boeuf-bourguignon.json
│   └── ...
│
├── data/                       # Stockage JSON (mode sans PostgreSQL)
│   ├── ingredients.json
│   ├── unites.json
│   ├── origines.json
│   ├── favoris.json
│   ├── planning.json
│   └── historique-courses.json
│
├── photos/                     # Photos des recettes (upload)
└── images/                     # Icones PWA
    ├── icon-192.png
    └── icon-512.png
```

---

## 📖 Utilisation de l'application

### Ajouter une recette

1. Ouvrir le **menu lateral** (icone hamburger)
2. Aller dans **Administration > Gestion des recettes**
3. Cliquer sur **"Ajouter une recette"**
4. Remplir le formulaire : nom, type, temps, ingredients, etapes, photo
5. Pour chaque etape, vous pouvez configurer un **timer** (duree en minutes)
6. Valider le formulaire

### Generer une liste de courses

1. Aller dans **Liste de courses** depuis le menu
2. Cocher les recettes souhaitees (avec filtres disponibles)
3. Ajuster le nombre de personnes par recette
4. Cliquer sur **"Generer la liste"**
5. Copier ou sauvegarder la liste generee

Vous pouvez aussi generer une liste depuis le **planning hebdomadaire** ou depuis la **vue detail** d'une recette.

### Demarrer et suivre une recette

1. Ouvrir une recette depuis la liste
2. La **vue consultation** affiche les informations et ingredients (sans les etapes)
3. Cliquer sur **"Demarrer"** pour entrer en mode realisation
4. Naviguer entre les etapes avec les boutons Precedent/Suivant
5. Chaque passage a l'etape suivante **valide automatiquement** l'etape en cours
6. Utiliser les **timers** integres quand disponibles
7. Cliquer sur **"Terminer la recette"** pour finaliser

### Reprendre une recette en cours

- Le bouton **"Reprendre"** apparait dans le menu lateral si une recette est en cours
- Depuis la vue detail, le bouton **"Reprendre"** remplace "Demarrer"
- La recette reprend automatiquement a la **derniere etape validee + 1**
- L'historique complet est accessible via **Historique** dans le menu

### Utiliser le planning

1. Aller dans **Planning semaine** depuis le menu
2. Cliquer sur un creneau (midi ou soir) pour ajouter une recette
3. Naviguer entre les semaines avec les fleches
4. Generer la liste de courses de la semaine entiere

---

## 🔌 API REST

L'application expose une API REST complete. Tous les endpoints retournent du JSON.

### Recettes
| Methode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/recettes` | Liste de toutes les recettes |
| `POST` | `/api/recettes` | Creer une recette |
| `PUT` | `/api/recettes/:id` | Modifier une recette |
| `DELETE` | `/api/recettes/:id` | Supprimer une recette |

### Ingredients et unites
| Methode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/ingredients` | Liste des ingredients |
| `GET` | `/api/unites` | Liste des unites de mesure |
| `GET` | `/api/origines` | Liste des origines |

### Favoris et planning
| Methode | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/favoris` | Gestion des favoris |
| `GET/POST` | `/api/planning` | Gestion du planning |

### Listes de courses
| Methode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/historique-courses` | Historique des listes |
| `POST` | `/api/historique-courses` | Sauvegarder une liste |

### Suivi de progression *(PostgreSQL requis)*
| Methode | Endpoint | Description |
|---|---|---|
| `POST` | `/api/demarrer-recette` | Demarrer une session de realisation |
| `POST` | `/api/progression-recette` | Mettre a jour la progression |
| `POST` | `/api/terminer-recette` | Terminer une recette |
| `GET` | `/api/recette-en-cours` | Session en cours |
| `GET` | `/api/has-recette-en-cours` | Verifier si session active |
| `GET` | `/api/historique-recettes` | Historique avec filtres |
| `GET` | `/api/compteurs-realisations` | Compteurs de realisations |

### Systeme
| Methode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/status` | Statut du serveur et de la BDD |
| `POST` | `/api/photos` | Upload de photo (multipart) |

---

## 🏗 Infrastructure Docker

### Services

```yaml
# 3 services orchestres par Docker Compose

postgres       # PostgreSQL 16 Alpine - Base de donnees
  ├── Port: 5432
  ├── Volume: postgres_data (persistant)
  ├── Init: database/init.sql (auto)
  └── Healthcheck: pg_isready

app            # Node.js 20 Alpine - Application
  ├── Port: 8000 → 3000 (interne)
  ├── Volumes: photos/, recettes/, data/
  ├── Depends: postgres (healthy)
  └── User: nodejs (non-root, securise)

pgadmin        # pgAdmin 4 - Administration BDD
  ├── Port: 5051
  └── Login: admin@cuisine.com / admin123
```

### Reseau

Tous les services communiquent via le reseau Docker `cuisine_network` (bridge).

### Persistance des donnees

| Volume | Contenu |
|---|---|
| `postgres_data` | Donnees PostgreSQL |
| `pgadmin_data` | Configuration pgAdmin |
| `./photos/` | Photos des recettes (mount) |

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment participer :

1. **Forker** le repository
2. Creer une **branche** pour votre fonctionnalite (`git checkout -b feature/ma-fonctionnalite`)
3. **Commiter** vos modifications (`git commit -m "Ajout de ma fonctionnalite"`)
4. **Pousser** sur votre fork (`git push origin feature/ma-fonctionnalite`)
5. Ouvrir une **Pull Request**

### Conventions de code

- JavaScript vanilla (pas de framework frontend)
- Nommage en francais pour les variables metier
- Commentaires en francais
- CSS avec variables personnalisees (custom properties)

---

## 📄 Licence

Ce projet est distribue sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de details.

---

## 👤 Auteur

Developpe par **Pierre** avec l'assistance de Claude (Anthropic).

---

## 🗺 Roadmap

Ameliorations envisagees pour les prochaines versions :

- [ ] Synchronisation multi-appareils
- [ ] Partage de recettes entre utilisateurs
- [ ] Import/export de recettes (format standard)
- [ ] Calcul nutritionnel automatique
- [ ] Suggestions de recettes basees sur les ingredients disponibles
- [ ] Mode multi-utilisateurs avec authentification
- [ ] Notifications push pour les timers
