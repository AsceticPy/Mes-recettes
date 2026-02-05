# Documentation Base de Données PostgreSQL

## Modèle Conceptuel de Données (MCD)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SCHEMA BASE DE DONNÉES                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
│ categories_         │       │    ingredients      │       │   types_plat        │
│ ingredients         │       │                     │       │                     │
├─────────────────────┤       ├─────────────────────┤       ├─────────────────────┤
│ PK id              │──1:N──│ PK id              │       │ PK id              │
│    nom (unique)    │       │    nom             │       │    code (unique)   │
│    ordre           │       │ FK categorie_id    │       │    libelle         │
│    created_at      │       │    created_at      │       └──────────┬──────────┘
│    updated_at      │       │    updated_at      │                  │
└─────────────────────┘       └─────────────────────┘                  │
                                                                       │
┌─────────────────────┐       ┌─────────────────────┐                  │
│ categories_unites   │       │      unites         │                  │
├─────────────────────┤       ├─────────────────────┤                  │
│ PK id              │──1:N──│ PK id              │                  │
│    nom (unique)    │       │    nom             │                  │
│    ordre           │       │ FK categorie_id    │                  │
└─────────────────────┘       └─────────────────────┘                  │
                                                                       │
┌─────────────────────┐                                                │
│     origines        │                                                │
├─────────────────────┤       ┌─────────────────────────────────────────┴──────┐
│ PK id              │       │                    recettes                     │
│    nom (unique)    │       ├────────────────────────────────────────────────┤
│    created_at      │──N:M──│ PK id (VARCHAR - slug)                         │
│    updated_at      │       │    nom                                         │
└──────────┬──────────┘       │ FK type_id                                     │
           │                  │    temps_preparation                           │
           │                  │    temps_cuisson                               │
           │                  │    nombre_personnes                            │
           │                  │    image_url                                   │
           │                  │    photo_locale                                │
           │                  │    created_at                                  │
           │                  │    updated_at                                  │
           │                  └────────────────────┬───────────────────────────┘
           │                                       │
           │       ┌───────────────────────────────┼───────────────────────────┐
           │       │                               │                           │
           │       ▼                               ▼                           ▼
┌──────────┴──────────────┐  ┌─────────────────────────────┐  ┌─────────────────────────┐
│  recettes_origines      │  │  recettes_ingredients       │  │    etapes_recette       │
│  (table de liaison)     │  │                             │  │                         │
├─────────────────────────┤  ├─────────────────────────────┤  ├─────────────────────────┤
│ PK,FK recette_id       │  │ PK id                       │  │ PK id                   │
│ PK,FK origine_id       │  │ FK recette_id               │  │ FK recette_id           │
└─────────────────────────┘  │    nom_ingredient           │  │    ordre                │
                             │    quantite                 │  │    description          │
                             │    unite                    │  │    duree_minutes        │
                             │    ordre                    │  │    created_at           │
                             └─────────────────────────────┘  └─────────────────────────┘

┌─────────────────────┐       ┌─────────────────────────────┐
│     favoris         │       │        planning             │
├─────────────────────┤       ├─────────────────────────────┤
│ PK id              │       │ PK id                       │
│ FK recette_id      │       │    date_repas               │
│    date_ajout      │       │    moment (midi/soir)       │
└─────────────────────┘       │ FK recette_id               │
                              │    created_at               │
                              │    updated_at               │
                              └─────────────────────────────┘

┌─────────────────────────────┐       ┌─────────────────────────────────┐
│   historique_courses        │       │  historique_courses_recettes    │
├─────────────────────────────┤       ├─────────────────────────────────┤
│ PK id                       │──1:N──│ PK id                           │
│    date_creation            │       │ FK historique_id                │
│    nombre_personnes         │       │    recette_nom                  │
│    liste_json (JSONB)       │       └─────────────────────────────────┘
└─────────────────────────────┘
```

## Tables détaillées

### Table `recettes`
Table principale contenant les recettes.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | VARCHAR(255) | PK | Slug unique (ex: "pain-de-seigle") |
| nom | VARCHAR(255) | NOT NULL | Nom de la recette |
| type_id | INT | FK → types_plat | Type de plat |
| temps_preparation | INT | DEFAULT 0 | Durée en minutes |
| temps_cuisson | INT | DEFAULT 0 | Durée en minutes |
| nombre_personnes | INT | DEFAULT 4 | Nombre de portions |
| image_url | TEXT | | URL externe de l'image |
| photo_locale | VARCHAR(255) | | Nom du fichier photo local |
| created_at | TIMESTAMP | DEFAULT NOW | Date de création |
| updated_at | TIMESTAMP | DEFAULT NOW | Date de modification |

### Table `recettes_ingredients`
Ingrédients associés à une recette avec quantités.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | SERIAL | PK | Identifiant auto |
| recette_id | VARCHAR(255) | FK → recettes | Référence à la recette |
| nom_ingredient | VARCHAR(200) | NOT NULL | Nom tel que saisi |
| quantite | DECIMAL(10,2) | | Quantité (peut être NULL) |
| unite | VARCHAR(100) | | Unité de mesure |
| ordre | INT | DEFAULT 0 | Ordre d'affichage |

### Table `etapes_recette`
Étapes de préparation avec timer optionnel.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | SERIAL | PK | Identifiant auto |
| recette_id | VARCHAR(255) | FK → recettes | Référence à la recette |
| ordre | INT | NOT NULL | Numéro de l'étape |
| description | TEXT | NOT NULL | Texte de l'étape |
| duree_minutes | INT | | Durée pour le timer (optionnel) |

## Informations de connexion

### Mot de passe PostgreSQL
```
Utilisateur: cuisine_user
Mot de passe: CuisineApp2024!SecureP@ss
Base de données: cuisine_db
```

⚠️ **Important**: En production, générez un nouveau mot de passe sécurisé et mettez à jour le fichier `.env`.

### Génération d'un mot de passe sécurisé
```bash
# Avec OpenSSL
openssl rand -base64 32

# Ou avec /dev/urandom
head -c 32 /dev/urandom | base64
```

## Déploiement

### Prérequis
- Docker et Docker Compose installés
- Node.js 18+ (pour développement local)

### Démarrage rapide avec Docker

```bash
# 1. Copier le fichier de configuration
cp .env.example .env

# 2. (Optionnel) Modifier le mot de passe dans .env

# 3. Démarrer les services
docker-compose up -d

# 4. Vérifier les logs
docker-compose logs -f
```

L'application sera accessible sur http://localhost:3000

### Démarrage en développement (sans Docker)

```bash
# 1. Installer les dépendances
npm install

# 2. Mode fichiers JSON (sans PostgreSQL)
npm run dev

# 3. Ou avec PostgreSQL local
npm start
```

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| PORT | Port du serveur HTTP | 8000 |
| USE_DATABASE | Utiliser PostgreSQL | true |
| DB_HOST | Hôte PostgreSQL | localhost |
| DB_PORT | Port PostgreSQL | 5432 |
| DB_NAME | Nom de la base | cuisine_db |
| DB_USER | Utilisateur | cuisine_user |
| DB_PASSWORD | Mot de passe | (voir .env.example) |

## Migration des données

La migration s'exécute automatiquement au premier démarrage :

1. **Vérification** : Le serveur vérifie si la base contient déjà des recettes
2. **Migration des références** : Ingrédients, unités, origines
3. **Migration des recettes** : Chaque fichier JSON est lu et inséré
4. **Migration utilisateur** : Favoris, planning, historique (première fois)

### Logs de migration
```
╔════════════════════════════════════════╗
║  Migration JSON → PostgreSQL           ║
╚════════════════════════════════════════╝

✓ Connexion PostgreSQL établie
→ Migration des ingrédients...
  ✓ Ingrédients migrés
→ Migration des unités...
  ✓ Unités migrées
→ Migration des origines...
  ✓ Origines migrées
→ Migration des recettes...
    ✓ Pain de seigle
    ✓ Baba ghanoush
    ...
  ✓ Recettes migrées: 150, Erreurs: 0

✓ Migration terminée avec succès !
```

## Requêtes utiles

### Obtenir une recette complète
```sql
SELECT
    r.id,
    r.nom,
    t.code as type,
    get_recette_origines(r.id) as origines,
    get_recette_ingredients_json(r.id) as ingredients,
    get_recette_etapes_json(r.id) as etapes
FROM recettes r
LEFT JOIN types_plat t ON r.type_id = t.id
WHERE r.id = 'pain-de-seigle';
```

### Rechercher des recettes par ingrédient
```sql
SELECT DISTINCT r.id, r.nom
FROM recettes r
JOIN recettes_ingredients ri ON r.id = ri.recette_id
WHERE ri.nom_ingredient ILIKE '%poulet%';
```

### Statistiques
```sql
SELECT
    t.libelle as type,
    COUNT(*) as nombre_recettes
FROM recettes r
JOIN types_plat t ON r.type_id = t.id
GROUP BY t.libelle
ORDER BY nombre_recettes DESC;
```

## Sauvegarde et restauration

### Sauvegarde
```bash
# Sauvegarder la base
docker exec cuisine_postgres pg_dump -U cuisine_user cuisine_db > backup.sql

# Ou avec compression
docker exec cuisine_postgres pg_dump -U cuisine_user cuisine_db | gzip > backup.sql.gz
```

### Restauration
```bash
# Restaurer depuis une sauvegarde
cat backup.sql | docker exec -i cuisine_postgres psql -U cuisine_user cuisine_db

# Ou avec fichier compressé
gunzip -c backup.sql.gz | docker exec -i cuisine_postgres psql -U cuisine_user cuisine_db
```

## Sécurité

- ✅ Requêtes préparées (protection injection SQL)
- ✅ Validation des entrées côté serveur
- ✅ Transactions pour la cohérence des données
- ✅ Pool de connexions avec timeout
- ✅ Mot de passe sécurisé par défaut

### Recommandations production
1. Changer le mot de passe par défaut
2. Utiliser HTTPS (reverse proxy nginx/traefik)
3. Restreindre l'accès réseau à PostgreSQL
4. Activer les logs d'audit PostgreSQL
5. Sauvegardes automatiques régulières
