/**
 * Module de migration des données JSON vers PostgreSQL
 * Cuisine PWA
 */

const fs = require('fs').promises;
const path = require('path');
const db = require('./database');

const RECETTES_DIR = process.env.RECETTES_DIR || path.join(__dirname, '..', 'recettes');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');

/**
 * Vérifie si la migration a déjà été effectuée
 */
async function isMigrationDone() {
  try {
    const result = await db.query('SELECT COUNT(*) as count FROM recettes');
    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Migre les catégories d'ingrédients
 */
async function migrateIngredients() {
  console.log('→ Migration des ingrédients...');

  try {
    const filePath = path.join(DATA_DIR, 'ingredients.json');
    const data = await fs.readFile(filePath, 'utf8');
    const categories = JSON.parse(data);

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];

      // Insérer la catégorie
      const catResult = await db.query(
        'INSERT INTO categories_ingredients (nom, ordre) VALUES ($1, $2) ON CONFLICT (nom) DO UPDATE SET ordre = $2 RETURNING id',
        [cat.categorie, i]
      );
      const categorieId = catResult.rows[0].id;

      // Insérer les ingrédients
      for (const item of cat.items) {
        await db.query(
          'INSERT INTO ingredients (nom, categorie_id) VALUES ($1, $2) ON CONFLICT (nom, categorie_id) DO NOTHING',
          [item, categorieId]
        );
      }
    }

    console.log('  ✓ Ingrédients migrés');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('  ⚠ Fichier ingredients.json non trouvé, ignoré');
    } else {
      throw error;
    }
  }
}

/**
 * Migre les catégories d'unités
 */
async function migrateUnites() {
  console.log('→ Migration des unités...');

  try {
    const filePath = path.join(DATA_DIR, 'unites.json');
    const data = await fs.readFile(filePath, 'utf8');
    const categories = JSON.parse(data);

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];

      // Insérer la catégorie
      const catResult = await db.query(
        'INSERT INTO categories_unites (nom, ordre) VALUES ($1, $2) ON CONFLICT (nom) DO UPDATE SET ordre = $2 RETURNING id',
        [cat.categorie, i]
      );
      const categorieId = catResult.rows[0].id;

      // Insérer les unités
      for (const unite of cat.unites) {
        await db.query(
          'INSERT INTO unites (nom, categorie_id) VALUES ($1, $2) ON CONFLICT (nom, categorie_id) DO NOTHING',
          [unite, categorieId]
        );
      }
    }

    console.log('  ✓ Unités migrées');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('  ⚠ Fichier unites.json non trouvé, ignoré');
    } else {
      throw error;
    }
  }
}

/**
 * Migre les origines/cuisines
 */
async function migrateOrigines() {
  console.log('→ Migration des origines...');

  try {
    const filePath = path.join(DATA_DIR, 'origines.json');
    const data = await fs.readFile(filePath, 'utf8');
    const origines = JSON.parse(data);

    for (const origine of origines) {
      await db.query(
        'INSERT INTO origines (nom) VALUES ($1) ON CONFLICT (nom) DO NOTHING',
        [origine]
      );
    }

    console.log('  ✓ Origines migrées');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('  ⚠ Fichier origines.json non trouvé, ignoré');
    } else {
      throw error;
    }
  }
}

/**
 * Migre une recette individuelle
 */
async function migrateRecette(recetteData) {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Obtenir l'ID du type de plat
    let typeId = null;
    if (recetteData.type) {
      const typeResult = await client.query(
        'SELECT id FROM types_plat WHERE code = $1',
        [recetteData.type]
      );
      if (typeResult.rows.length > 0) {
        typeId = typeResult.rows[0].id;
      }
    }

    // Insérer la recette
    await client.query(`
      INSERT INTO recettes (id, nom, type_id, temps_preparation, temps_cuisson, nombre_personnes, image_url, photo_locale)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        nom = EXCLUDED.nom,
        type_id = EXCLUDED.type_id,
        temps_preparation = EXCLUDED.temps_preparation,
        temps_cuisson = EXCLUDED.temps_cuisson,
        nombre_personnes = EXCLUDED.nombre_personnes,
        image_url = EXCLUDED.image_url,
        photo_locale = EXCLUDED.photo_locale,
        updated_at = CURRENT_TIMESTAMP
    `, [
      recetteData.id,
      recetteData.nom,
      typeId,
      recetteData.tempsPreparation || 0,
      recetteData.tempsCuisson || 0,
      recetteData.personnes || 4,
      recetteData.image || null,
      recetteData.photo || null
    ]);

    // Supprimer les anciennes relations avant réinsertion
    await client.query('DELETE FROM recettes_origines WHERE recette_id = $1', [recetteData.id]);
    await client.query('DELETE FROM recettes_ingredients WHERE recette_id = $1', [recetteData.id]);
    await client.query('DELETE FROM etapes_recette WHERE recette_id = $1', [recetteData.id]);

    // Insérer les origines
    if (recetteData.origines && Array.isArray(recetteData.origines)) {
      for (const origineName of recetteData.origines) {
        // S'assurer que l'origine existe
        await client.query(
          'INSERT INTO origines (nom) VALUES ($1) ON CONFLICT (nom) DO NOTHING',
          [origineName]
        );

        // Obtenir l'ID de l'origine
        const origineResult = await client.query(
          'SELECT id FROM origines WHERE nom = $1',
          [origineName]
        );

        if (origineResult.rows.length > 0) {
          await client.query(
            'INSERT INTO recettes_origines (recette_id, origine_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [recetteData.id, origineResult.rows[0].id]
          );
        }
      }
    }

    // Insérer les ingrédients
    if (recetteData.ingredients && Array.isArray(recetteData.ingredients)) {
      for (let i = 0; i < recetteData.ingredients.length; i++) {
        const ing = recetteData.ingredients[i];
        await client.query(
          'INSERT INTO recettes_ingredients (recette_id, nom_ingredient, quantite, unite, ordre) VALUES ($1, $2, $3, $4, $5)',
          [recetteData.id, ing.nom, ing.quantite || null, ing.unite || null, i]
        );
      }
    }

    // Insérer les étapes
    if (recetteData.etapes && Array.isArray(recetteData.etapes)) {
      for (let i = 0; i < recetteData.etapes.length; i++) {
        const etape = recetteData.etapes[i];
        let texte, duree = null;

        if (typeof etape === 'object') {
          texte = etape.texte;
          duree = etape.duree || null;
        } else {
          texte = etape;
        }

        await client.query(
          'INSERT INTO etapes_recette (recette_id, ordre, description, duree_minutes) VALUES ($1, $2, $3, $4)',
          [recetteData.id, i + 1, texte, duree]
        );
      }
    }

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Migre toutes les recettes du dossier
 */
async function migrateRecettes() {
  console.log('→ Migration des recettes...');

  try {
    const files = await fs.readdir(RECETTES_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    let migrated = 0;
    let errors = 0;

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(RECETTES_DIR, file);
        const data = await fs.readFile(filePath, 'utf8');
        const recette = JSON.parse(data);

        // Vérifier si la recette existe déjà
        const existing = await db.query(
          'SELECT id FROM recettes WHERE id = $1',
          [recette.id]
        );

        if (existing.rows.length === 0) {
          await migrateRecette(recette);
          migrated++;
          console.log(`    ✓ ${recette.nom}`);
        }
      } catch (error) {
        console.error(`    ✗ Erreur pour ${file}:`, error.message);
        errors++;
      }
    }

    console.log(`  ✓ Recettes migrées: ${migrated}, Erreurs: ${errors}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('  ⚠ Dossier recettes non trouvé');
    } else {
      throw error;
    }
  }
}

/**
 * Migre les favoris
 */
async function migrateFavoris() {
  console.log('→ Migration des favoris...');

  try {
    const filePath = path.join(DATA_DIR, 'favoris.json');
    const data = await fs.readFile(filePath, 'utf8');
    const favoris = JSON.parse(data);

    for (const recetteId of favoris) {
      // Vérifier que la recette existe
      const exists = await db.query('SELECT id FROM recettes WHERE id = $1', [recetteId]);
      if (exists.rows.length > 0) {
        await db.query(
          'INSERT INTO favoris (recette_id) VALUES ($1) ON CONFLICT (recette_id) DO NOTHING',
          [recetteId]
        );
      }
    }

    console.log('  ✓ Favoris migrés');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('  ⚠ Fichier favoris.json non trouvé, ignoré');
    } else {
      throw error;
    }
  }
}

/**
 * Migre le planning
 */
async function migratePlanning() {
  console.log('→ Migration du planning...');

  try {
    const filePath = path.join(DATA_DIR, 'planning.json');
    const data = await fs.readFile(filePath, 'utf8');
    const planning = JSON.parse(data);

    for (const [date, repas] of Object.entries(planning)) {
      for (const [moment, info] of Object.entries(repas)) {
        if (info.recetteId) {
          // Vérifier que la recette existe
          const exists = await db.query('SELECT id FROM recettes WHERE id = $1', [info.recetteId]);
          if (exists.rows.length > 0) {
            await db.query(`
              INSERT INTO planning (date_repas, moment, recette_id)
              VALUES ($1, $2, $3)
              ON CONFLICT (date_repas, moment) DO UPDATE SET recette_id = $3, updated_at = CURRENT_TIMESTAMP
            `, [date, moment, info.recetteId]);
          }
        }
      }
    }

    console.log('  ✓ Planning migré');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('  ⚠ Fichier planning.json non trouvé, ignoré');
    } else {
      throw error;
    }
  }
}

/**
 * Migre l'historique des courses
 */
async function migrateHistoriqueCourses() {
  console.log('→ Migration de l\'historique des courses...');

  try {
    const filePath = path.join(DATA_DIR, 'historique-courses.json');
    const data = await fs.readFile(filePath, 'utf8');
    const historique = JSON.parse(data);

    for (const entry of historique) {
      const result = await db.query(`
        INSERT INTO historique_courses (date_creation, nombre_personnes, liste_json)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [entry.date, entry.personnes, JSON.stringify(entry.liste)]);

      const historiqueId = result.rows[0].id;

      // Ajouter les recettes associées
      if (entry.recettes && Array.isArray(entry.recettes)) {
        for (const recetteNom of entry.recettes) {
          await db.query(
            'INSERT INTO historique_courses_recettes (historique_id, recette_nom) VALUES ($1, $2)',
            [historiqueId, recetteNom]
          );
        }
      }
    }

    console.log('  ✓ Historique des courses migré');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('  ⚠ Fichier historique-courses.json non trouvé, ignoré');
    } else {
      throw error;
    }
  }
}

/**
 * Applique les migrations de schéma pour les nouvelles fonctionnalités
 */
async function migrateSchema() {
  console.log('→ Vérification du schéma...');

  // Ajouter colonne niveau_difficulte si elle n'existe pas
  try {
    await db.query(`
      ALTER TABLE recettes ADD COLUMN IF NOT EXISTS niveau_difficulte VARCHAR(20)
      CHECK (niveau_difficulte IN ('Facile', 'Moyen', 'Difficile'))
    `);
  } catch (e) {
    // La colonne existe peut-être déjà avec la contrainte
    if (!e.message.includes('already exists')) {
      console.log('  Note: niveau_difficulte -', e.message);
    }
  }

  // Créer table tags si elle n'existe pas
  await db.query(`
    CREATE TABLE IF NOT EXISTS tags (
      id SERIAL PRIMARY KEY,
      nom VARCHAR(50) UNIQUE NOT NULL,
      categorie VARCHAR(50),
      icone VARCHAR(10),
      couleur VARCHAR(7),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Créer table recette_tags si elle n'existe pas
  await db.query(`
    CREATE TABLE IF NOT EXISTS recette_tags (
      recette_id VARCHAR(255) REFERENCES recettes(id) ON DELETE CASCADE,
      tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (recette_id, tag_id)
    )
  `);

  // Créer les index s'ils n'existent pas
  await db.query(`CREATE INDEX IF NOT EXISTS idx_recette_tags_recette ON recette_tags(recette_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_recette_tags_tag ON recette_tags(tag_id)`);

  // Insérer les tags prédéfinis
  const tagsPredefinis = [
    ['Végétarien', 'regime', '🥬', '#27ae60'],
    ['Vegan', 'regime', '🌱', '#2ecc71'],
    ['Sans porc', 'regime', '🥩', '#e67e22'],
    ['Halal', 'regime', '☪️', '#8e44ad'],
    ['Casher', 'regime', '✡️', '#2980b9'],
    ['Pescetarien', 'regime', '🐟', '#1abc9c'],
    ['Sans gluten', 'allergen', '🌾', '#f39c12'],
    ['Sans lactose', 'allergen', '🥛', '#3498db'],
    ['Sans fruits à coque', 'allergen', '🥜', '#e74c3c'],
    ['Sans fruits de mer', 'allergen', '🦐', '#c0392b'],
    ['Sans œufs', 'allergen', '🥚', '#d35400'],
    ['Sans arachides', 'allergen', '🌰', '#a04000'],
    ['Riche en protéines', 'nutrition', '💪', '#9b59b6'],
    ['Léger', 'nutrition', '🥗', '#27ae60'],
    ['Faible en calories', 'nutrition', '🔥', '#e74c3c'],
    ['Bon pour le cœur', 'nutrition', '❤️', '#e74c3c'],
    ['Oméga-3', 'nutrition', '🧠', '#3498db'],
    ['Thermomix', 'autre', '🤖', '#9b59b6'],
    ['Rapide', 'autre', '⚡', '#f1c40f'],
    ['Un seul plat', 'autre', '🍽️', '#e67e22'],
    ['Préparation à l\'avance', 'autre', '❄️', '#3498db'],
    ['Se congèle bien', 'autre', '🧊', '#2980b9']
  ];

  for (const [nom, categorie, icone, couleur] of tagsPredefinis) {
    await db.query(
      `INSERT INTO tags (nom, categorie, icone, couleur) VALUES ($1, $2, $3, $4) ON CONFLICT (nom) DO NOTHING`,
      [nom, categorie, icone, couleur]
    );
  }

  // Créer table dashboard_config si elle n'existe pas
  await db.query(`
    CREATE TABLE IF NOT EXISTS dashboard_config (
      id SERIAL PRIMARY KEY,
      widget_type VARCHAR(50) NOT NULL,
      position INTEGER DEFAULT 0,
      visible BOOLEAN DEFAULT true,
      config JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insérer la config par défaut si vide
  const dashResult = await db.query('SELECT COUNT(*) as count FROM dashboard_config');
  if (parseInt(dashResult.rows[0].count) === 0) {
    await db.query(`
      INSERT INTO dashboard_config (widget_type, position, visible, config) VALUES
        ('recettes_recentes', 0, true, '{"nombre": 5}'::jsonb),
        ('favoris', 1, true, '{"nombre": 5}'::jsonb),
        ('planning_jour', 2, true, '{}'::jsonb),
        ('suggestion_jour', 3, true, '{}'::jsonb)
    `);
  }

  // Créer table notification_settings si elle n'existe pas
  await db.query(`
    CREATE TABLE IF NOT EXISTS notification_settings (
      id SERIAL PRIMARY KEY,
      timer_notifications BOOLEAN DEFAULT true,
      meal_reminder BOOLEAN DEFAULT true,
      reminder_time TIME DEFAULT '18:00:00',
      active_days JSONB DEFAULT '["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"]'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const notifResult = await db.query('SELECT COUNT(*) as count FROM notification_settings');
  if (parseInt(notifResult.rows[0].count) === 0) {
    await db.query(`INSERT INTO notification_settings (timer_notifications, meal_reminder) VALUES (true, true)`);
  }

  // Créer la fonction get_recette_tags_json si elle n'existe pas
  await db.query(`
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
    $$ LANGUAGE plpgsql
  `);

  console.log('  ✓ Schéma mis à jour');
}

/**
 * Exécute la migration complète
 */
async function runMigration() {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Migration JSON → PostgreSQL           ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');

  try {
    // Vérifier la connexion
    const connected = await db.checkConnection();
    if (!connected) {
      throw new Error('Impossible de se connecter à PostgreSQL');
    }

    // Vérifier si la migration a déjà été faite
    const alreadyDone = await isMigrationDone();
    if (alreadyDone) {
      console.log('ℹ La base de données contient déjà des recettes.');
      console.log('  Vérification des nouvelles recettes à migrer...');
    }

    // Migrer les données de référence
    await migrateIngredients();
    await migrateUnites();
    await migrateOrigines();

    // Migrer les recettes
    await migrateRecettes();

    // Migrer les données utilisateur (seulement si première migration)
    if (!alreadyDone) {
      await migrateFavoris();
      await migratePlanning();
      await migrateHistoriqueCourses();
    }

    // Toujours appliquer les migrations de schéma
    await migrateSchema();

    console.log('');
    console.log('✓ Migration terminée avec succès !');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('✗ Erreur durant la migration:', error.message);
    console.error('');
    throw error;
  }
}

module.exports = {
  runMigration,
  migrateRecette,
  isMigrationDone
};
