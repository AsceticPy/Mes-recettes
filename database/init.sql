-- ============================================
-- Cuisine PWA - Script d'initialisation PostgreSQL
-- ============================================

-- Création de l'extension pour les UUID si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: categories_ingredients
-- Catégories d'ingrédients (Viandes, Légumes, etc.)
-- ============================================
CREATE TABLE categories_ingredients (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    ordre INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: ingredients
-- Liste des ingrédients disponibles
-- ============================================
CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(200) NOT NULL,
    categorie_id INT REFERENCES categories_ingredients(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nom, categorie_id)
);

CREATE INDEX idx_ingredients_categorie ON ingredients(categorie_id);
CREATE INDEX idx_ingredients_nom ON ingredients(nom);

-- ============================================
-- TABLE: categories_unites
-- Catégories d'unités de mesure (Poids, Volume, etc.)
-- ============================================
CREATE TABLE categories_unites (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    ordre INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: unites
-- Unités de mesure (g, kg, ml, c. à soupe, etc.)
-- ============================================
CREATE TABLE unites (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    categorie_id INT REFERENCES categories_unites(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nom, categorie_id)
);

CREATE INDEX idx_unites_categorie ON unites(categorie_id);

-- ============================================
-- TABLE: origines
-- Origines/cuisines (Française, Italienne, etc.)
-- ============================================
CREATE TABLE origines (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: types_plat
-- Types de plat (entrée, plat, dessert, etc.)
-- ============================================
CREATE TABLE types_plat (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    libelle VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertion des types de plat par défaut
INSERT INTO types_plat (code, libelle) VALUES
    ('entree', 'Entrée'),
    ('plat', 'Plat principal'),
    ('dessert', 'Dessert'),
    ('accompagnement', 'Accompagnement'),
    ('sauce', 'Sauce'),
    ('boisson', 'Boisson'),
    ('petit-dejeuner', 'Petit-déjeuner'),
    ('snack', 'Snack/Encas');

-- ============================================
-- TABLE: recettes
-- Table principale des recettes
-- ============================================
CREATE TABLE recettes (
    id VARCHAR(255) PRIMARY KEY,  -- Slug de la recette (ex: "pain-de-seigle")
    nom VARCHAR(255) NOT NULL,
    type_id INT REFERENCES types_plat(id) ON DELETE SET NULL,
    temps_preparation INT DEFAULT 0,  -- en minutes
    temps_cuisson INT DEFAULT 0,      -- en minutes
    nombre_personnes INT DEFAULT 4,
    image_url TEXT,
    photo_locale VARCHAR(255),        -- Nom du fichier photo local
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recettes_type ON recettes(type_id);
CREATE INDEX idx_recettes_nom ON recettes(nom);

-- ============================================
-- TABLE: recettes_origines
-- Relation many-to-many entre recettes et origines
-- ============================================
CREATE TABLE recettes_origines (
    recette_id VARCHAR(255) REFERENCES recettes(id) ON DELETE CASCADE,
    origine_id INT REFERENCES origines(id) ON DELETE CASCADE,
    PRIMARY KEY (recette_id, origine_id)
);

CREATE INDEX idx_recettes_origines_recette ON recettes_origines(recette_id);
CREATE INDEX idx_recettes_origines_origine ON recettes_origines(origine_id);

-- ============================================
-- TABLE: recettes_ingredients
-- Ingrédients d'une recette avec quantités
-- ============================================
CREATE TABLE recettes_ingredients (
    id SERIAL PRIMARY KEY,
    recette_id VARCHAR(255) NOT NULL REFERENCES recettes(id) ON DELETE CASCADE,
    nom_ingredient VARCHAR(200) NOT NULL,  -- Nom tel que saisi (peut différer de la base)
    quantite DECIMAL(10, 2),
    unite VARCHAR(100),
    ordre INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recettes_ingredients_recette ON recettes_ingredients(recette_id);

-- ============================================
-- TABLE: etapes_recette
-- Étapes de préparation d'une recette
-- ============================================
CREATE TABLE etapes_recette (
    id SERIAL PRIMARY KEY,
    recette_id VARCHAR(255) NOT NULL REFERENCES recettes(id) ON DELETE CASCADE,
    ordre INT NOT NULL,
    description TEXT NOT NULL,
    duree_minutes INT,  -- Durée optionnelle pour le timer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(recette_id, ordre)
);

CREATE INDEX idx_etapes_recette ON etapes_recette(recette_id);

-- ============================================
-- TABLE: favoris
-- Recettes favorites de l'utilisateur
-- ============================================
CREATE TABLE favoris (
    id SERIAL PRIMARY KEY,
    recette_id VARCHAR(255) NOT NULL REFERENCES recettes(id) ON DELETE CASCADE,
    date_ajout TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(recette_id)
);

CREATE INDEX idx_favoris_recette ON favoris(recette_id);

-- ============================================
-- TABLE: planning
-- Planning des repas par jour
-- ============================================
CREATE TABLE planning (
    id SERIAL PRIMARY KEY,
    date_repas DATE NOT NULL,
    moment VARCHAR(20) NOT NULL CHECK (moment IN ('midi', 'soir')),
    recette_id VARCHAR(255) REFERENCES recettes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_repas, moment)
);

CREATE INDEX idx_planning_date ON planning(date_repas);
CREATE INDEX idx_planning_recette ON planning(recette_id);

-- ============================================
-- TABLE: historique_courses
-- Historique des listes de courses générées
-- ============================================
CREATE TABLE historique_courses (
    id SERIAL PRIMARY KEY,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    nombre_personnes INT DEFAULT 4,
    liste_json JSONB NOT NULL  -- Stockage JSON de la liste complète
);

-- ============================================
-- TABLE: historique_courses_recettes
-- Recettes incluses dans une liste de courses
-- ============================================
CREATE TABLE historique_courses_recettes (
    id SERIAL PRIMARY KEY,
    historique_id INT NOT NULL REFERENCES historique_courses(id) ON DELETE CASCADE,
    recette_nom VARCHAR(255) NOT NULL
);

CREATE INDEX idx_historique_courses_recettes ON historique_courses_recettes(historique_id);

-- ============================================
-- TABLE: historique_recettes
-- Historique des recettes démarrées/réalisées
-- ============================================
CREATE TABLE historique_recettes (
    id SERIAL PRIMARY KEY,
    recette_id VARCHAR(255) NOT NULL REFERENCES recettes(id) ON DELETE CASCADE,
    date_debut TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_fin TIMESTAMP WITH TIME ZONE,
    statut VARCHAR(20) NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'terminee')),
    progression_etapes JSONB DEFAULT '{"etapes": []}'::jsonb,
    nombre_personnes INT DEFAULT 4,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes fréquentes
CREATE INDEX idx_historique_recettes_statut ON historique_recettes(statut);
CREATE INDEX idx_historique_recettes_date_debut ON historique_recettes(date_debut DESC);
CREATE INDEX idx_historique_recettes_recette_id ON historique_recettes(recette_id);

-- ============================================
-- TABLE: notes_recettes (Feature 16)
-- Notes personnelles pour les recettes
-- ============================================
CREATE TABLE notes_recettes (
    id SERIAL PRIMARY KEY,
    recette_id VARCHAR(255) NOT NULL REFERENCES recettes(id) ON DELETE CASCADE,
    contenu TEXT NOT NULL,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notes_recettes_recette_id ON notes_recettes(recette_id);
CREATE INDEX idx_notes_recettes_date ON notes_recettes(date_creation DESC);

-- ============================================
-- TRIGGERS: Mise à jour automatique de updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger sur les tables avec updated_at
CREATE TRIGGER update_recettes_updated_at
    BEFORE UPDATE ON recettes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_ingredients_updated_at
    BEFORE UPDATE ON categories_ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredients_updated_at
    BEFORE UPDATE ON ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_unites_updated_at
    BEFORE UPDATE ON categories_unites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unites_updated_at
    BEFORE UPDATE ON unites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_origines_updated_at
    BEFORE UPDATE ON origines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planning_updated_at
    BEFORE UPDATE ON planning
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_historique_recettes_updated_at
    BEFORE UPDATE ON historique_recettes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VUES: Vues utiles pour les requêtes
-- ============================================

-- Vue complète d'une recette avec son type
CREATE VIEW vue_recettes AS
SELECT
    r.id,
    r.nom,
    t.code as type,
    t.libelle as type_libelle,
    r.temps_preparation,
    r.temps_cuisson,
    (r.temps_preparation + r.temps_cuisson) as temps_total,
    r.nombre_personnes,
    r.image_url,
    r.photo_locale,
    r.created_at,
    r.updated_at
FROM recettes r
LEFT JOIN types_plat t ON r.type_id = t.id;

-- Vue du planning avec les noms de recettes
CREATE VIEW vue_planning AS
SELECT
    p.id,
    p.date_repas,
    p.moment,
    p.recette_id,
    r.nom as recette_nom,
    r.image_url,
    r.photo_locale
FROM planning p
LEFT JOIN recettes r ON p.recette_id = r.id;

-- Vue pour compter les réalisations de chaque recette
CREATE VIEW vue_compteur_realisations AS
SELECT
    recette_id,
    COUNT(*) as nombre_realisations
FROM historique_recettes
WHERE statut = 'terminee'
GROUP BY recette_id;

-- Vue de l'historique des recettes avec détails
CREATE VIEW vue_historique_recettes AS
SELECT
    hr.id,
    hr.recette_id,
    r.nom as recette_nom,
    t.code as type,
    r.image_url,
    r.photo_locale,
    hr.date_debut,
    hr.date_fin,
    hr.statut,
    hr.progression_etapes,
    hr.nombre_personnes,
    hr.notes,
    CASE
        WHEN hr.date_fin IS NOT NULL THEN
            EXTRACT(EPOCH FROM (hr.date_fin - hr.date_debut)) / 60
        ELSE NULL
    END as duree_minutes
FROM historique_recettes hr
JOIN recettes r ON hr.recette_id = r.id
LEFT JOIN types_plat t ON r.type_id = t.id
ORDER BY hr.date_debut DESC;

-- ============================================
-- FONCTIONS: Fonctions utilitaires
-- ============================================

-- Fonction pour obtenir les origines d'une recette en tableau
CREATE OR REPLACE FUNCTION get_recette_origines(p_recette_id VARCHAR)
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT o.nom
        FROM recettes_origines ro
        JOIN origines o ON ro.origine_id = o.id
        WHERE ro.recette_id = p_recette_id
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les ingrédients d'une recette en JSON
CREATE OR REPLACE FUNCTION get_recette_ingredients_json(p_recette_id VARCHAR)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'nom', ri.nom_ingredient,
                'quantite', ri.quantite,
                'unite', ri.unite
            ) ORDER BY ri.ordre
        )
        FROM recettes_ingredients ri
        WHERE ri.recette_id = p_recette_id
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les étapes d'une recette en JSON
CREATE OR REPLACE FUNCTION get_recette_etapes_json(p_recette_id VARCHAR)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            CASE
                WHEN er.duree_minutes IS NOT NULL THEN
                    jsonb_build_object('texte', er.description, 'duree', er.duree_minutes)
                ELSE
                    to_jsonb(er.description)
            END
            ORDER BY er.ordre
        )
        FROM etapes_recette er
        WHERE er.recette_id = p_recette_id
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir le nombre de réalisations d'une recette
CREATE OR REPLACE FUNCTION get_nombre_realisations(p_recette_id VARCHAR)
RETURNS INT AS $$
BEGIN
    RETURN (
        SELECT COALESCE(COUNT(*), 0)
        FROM historique_recettes
        WHERE recette_id = p_recette_id AND statut = 'terminee'
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir la recette en cours la plus récente
CREATE OR REPLACE FUNCTION get_recette_en_cours()
RETURNS TABLE (
    id INT,
    recette_id VARCHAR,
    recette_nom VARCHAR,
    date_debut TIMESTAMP WITH TIME ZONE,
    progression_etapes JSONB,
    nombre_personnes INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        hr.id,
        hr.recette_id,
        r.nom as recette_nom,
        hr.date_debut,
        hr.progression_etapes,
        hr.nombre_personnes
    FROM historique_recettes hr
    JOIN recettes r ON hr.recette_id = r.id
    WHERE hr.statut = 'en_cours'
    ORDER BY hr.date_debut DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLE: tags
-- Tags alimentaires complets (régimes, allergènes, nutritionnels, etc.)
-- ============================================
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(50) UNIQUE NOT NULL,
    categorie VARCHAR(50),  -- 'regime', 'allergen', 'nutrition', 'autre'
    icone VARCHAR(10),
    couleur VARCHAR(7),     -- Code couleur hex
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: recette_tags
-- Relation many-to-many entre recettes et tags
-- ============================================
CREATE TABLE recette_tags (
    recette_id VARCHAR(255) REFERENCES recettes(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (recette_id, tag_id)
);

CREATE INDEX idx_recette_tags_recette ON recette_tags(recette_id);
CREATE INDEX idx_recette_tags_tag ON recette_tags(tag_id);

-- Tags prédéfinis
INSERT INTO tags (nom, categorie, icone, couleur) VALUES
    -- Régimes alimentaires
    ('Végétarien', 'regime', '🥬', '#27ae60'),
    ('Vegan', 'regime', '🌱', '#2ecc71'),
    ('Sans porc', 'regime', '🥩', '#e67e22'),
    ('Halal', 'regime', '☪️', '#8e44ad'),
    ('Casher', 'regime', '✡️', '#2980b9'),
    ('Pescetarien', 'regime', '🐟', '#1abc9c'),
    -- Allergènes/Intolérances
    ('Sans gluten', 'allergen', '🌾', '#f39c12'),
    ('Sans lactose', 'allergen', '🥛', '#3498db'),
    ('Sans fruits à coque', 'allergen', '🥜', '#e74c3c'),
    ('Sans fruits de mer', 'allergen', '🦐', '#c0392b'),
    ('Sans œufs', 'allergen', '🥚', '#d35400'),
    ('Sans arachides', 'allergen', '🌰', '#a04000'),
    -- Nutritionnels
    ('Riche en protéines', 'nutrition', '💪', '#9b59b6'),
    ('Léger', 'nutrition', '🥗', '#27ae60'),
    ('Faible en calories', 'nutrition', '🔥', '#e74c3c'),
    ('Bon pour le cœur', 'nutrition', '❤️', '#e74c3c'),
    ('Oméga-3', 'nutrition', '🧠', '#3498db'),
    -- Autres
    ('Thermomix', 'autre', '🤖', '#9b59b6'),
    ('Rapide', 'autre', '⚡', '#f1c40f'),
    ('Un seul plat', 'autre', '🍽️', '#e67e22'),
    ('Préparation à l''avance', 'autre', '❄️', '#3498db'),
    ('Se congèle bien', 'autre', '🧊', '#2980b9');

-- ============================================
-- Colonne niveau_difficulte sur recettes
-- ============================================
ALTER TABLE recettes ADD COLUMN IF NOT EXISTS niveau_difficulte VARCHAR(20) CHECK (niveau_difficulte IN ('Facile', 'Moyen', 'Difficile'));

-- ============================================
-- TABLE: dashboard_config
-- Configuration des widgets de la page d'accueil
-- ============================================
CREATE TABLE dashboard_config (
    id SERIAL PRIMARY KEY,
    widget_type VARCHAR(50) NOT NULL,
    position INTEGER DEFAULT 0,
    visible BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Configuration par défaut des widgets
INSERT INTO dashboard_config (widget_type, position, visible, config) VALUES
    ('recettes_recentes', 0, true, '{"nombre": 5}'::jsonb),
    ('favoris', 1, true, '{"nombre": 5}'::jsonb),
    ('planning_jour', 2, true, '{}'::jsonb),
    ('suggestion_jour', 3, true, '{}'::jsonb);

CREATE TRIGGER update_dashboard_config_updated_at
    BEFORE UPDATE ON dashboard_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: notification_settings
-- Paramètres des notifications
-- ============================================
CREATE TABLE notification_settings (
    id SERIAL PRIMARY KEY,
    timer_notifications BOOLEAN DEFAULT true,
    meal_reminder BOOLEAN DEFAULT true,
    reminder_time TIME DEFAULT '18:00:00',
    active_days JSONB DEFAULT '["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Paramètres par défaut
INSERT INTO notification_settings (timer_notifications, meal_reminder) VALUES (true, true);

CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Fonction pour obtenir les tags d'une recette
-- ============================================
CREATE OR REPLACE FUNCTION get_recette_tags_json(p_recette_id VARCHAR)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', t.id,
                'nom', t.nom,
                'categorie', t.categorie,
                'icone', t.icone,
                'couleur', t.couleur
            ) ORDER BY t.categorie, t.nom
        ), '[]'::jsonb)
        FROM recette_tags rt
        JOIN tags t ON rt.tag_id = t.id
        WHERE rt.recette_id = p_recette_id
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PERMISSIONS: Accorder les droits à l'utilisateur
-- ============================================
-- Note: L'utilisateur est créé par Docker avec les variables d'environnement
-- Les permissions sont automatiquement accordées au propriétaire

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cuisine_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cuisine_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO cuisine_user;

-- ============================================
-- FIN DU SCRIPT D'INITIALISATION
-- ============================================
