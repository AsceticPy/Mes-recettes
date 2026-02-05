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
