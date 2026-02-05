/**
 * Module des requêtes PostgreSQL
 * Cuisine PWA - Toutes les opérations CRUD
 */

const db = require('./database');

// ============================================
// RECETTES
// ============================================

/**
 * Récupère toutes les recettes avec leurs détails
 */
async function getAllRecettes() {
  const result = await db.query(`
    SELECT
      r.id,
      r.nom,
      t.code as type,
      r.temps_preparation as "tempsPreparation",
      r.temps_cuisson as "tempsCuisson",
      r.nombre_personnes as "personnes",
      r.image_url as "image",
      r.photo_locale as "photo",
      COALESCE(get_recette_origines(r.id), ARRAY[]::TEXT[]) as origines,
      COALESCE(get_recette_ingredients_json(r.id), '[]'::jsonb) as ingredients,
      COALESCE(get_recette_etapes_json(r.id), '[]'::jsonb) as etapes
    FROM recettes r
    LEFT JOIN types_plat t ON r.type_id = t.id
    ORDER BY r.nom
  `);

  return result.rows;
}

/**
 * Récupère une recette par son ID
 */
async function getRecetteById(id) {
  const result = await db.query(`
    SELECT
      r.id,
      r.nom,
      t.code as type,
      r.temps_preparation as "tempsPreparation",
      r.temps_cuisson as "tempsCuisson",
      r.nombre_personnes as "personnes",
      r.image_url as "image",
      r.photo_locale as "photo",
      COALESCE(get_recette_origines(r.id), ARRAY[]::TEXT[]) as origines,
      COALESCE(get_recette_ingredients_json(r.id), '[]'::jsonb) as ingredients,
      COALESCE(get_recette_etapes_json(r.id), '[]'::jsonb) as etapes
    FROM recettes r
    LEFT JOIN types_plat t ON r.type_id = t.id
    WHERE r.id = $1
  `, [id]);

  return result.rows[0] || null;
}

/**
 * Crée une nouvelle recette
 */
async function createRecette(recetteData) {
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

    // Insérer les origines
    if (recetteData.origines && Array.isArray(recetteData.origines)) {
      for (const origineName of recetteData.origines) {
        await client.query(
          'INSERT INTO origines (nom) VALUES ($1) ON CONFLICT (nom) DO NOTHING',
          [origineName]
        );

        const origineResult = await client.query(
          'SELECT id FROM origines WHERE nom = $1',
          [origineName]
        );

        if (origineResult.rows.length > 0) {
          await client.query(
            'INSERT INTO recettes_origines (recette_id, origine_id) VALUES ($1, $2)',
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
    return { success: true, id: recetteData.id };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Met à jour une recette existante
 */
async function updateRecette(id, recetteData) {
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

    // Mettre à jour la recette
    await client.query(`
      UPDATE recettes SET
        nom = $2,
        type_id = $3,
        temps_preparation = $4,
        temps_cuisson = $5,
        nombre_personnes = $6,
        image_url = COALESCE($7, image_url),
        photo_locale = COALESCE($8, photo_locale),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [
      id,
      recetteData.nom,
      typeId,
      recetteData.tempsPreparation || 0,
      recetteData.tempsCuisson || 0,
      recetteData.personnes || 4,
      recetteData.image,
      recetteData.photo
    ]);

    // Supprimer et réinsérer les relations
    await client.query('DELETE FROM recettes_origines WHERE recette_id = $1', [id]);
    await client.query('DELETE FROM recettes_ingredients WHERE recette_id = $1', [id]);
    await client.query('DELETE FROM etapes_recette WHERE recette_id = $1', [id]);

    // Réinsérer les origines
    if (recetteData.origines && Array.isArray(recetteData.origines)) {
      for (const origineName of recetteData.origines) {
        await client.query(
          'INSERT INTO origines (nom) VALUES ($1) ON CONFLICT (nom) DO NOTHING',
          [origineName]
        );

        const origineResult = await client.query(
          'SELECT id FROM origines WHERE nom = $1',
          [origineName]
        );

        if (origineResult.rows.length > 0) {
          await client.query(
            'INSERT INTO recettes_origines (recette_id, origine_id) VALUES ($1, $2)',
            [id, origineResult.rows[0].id]
          );
        }
      }
    }

    // Réinsérer les ingrédients
    if (recetteData.ingredients && Array.isArray(recetteData.ingredients)) {
      for (let i = 0; i < recetteData.ingredients.length; i++) {
        const ing = recetteData.ingredients[i];
        await client.query(
          'INSERT INTO recettes_ingredients (recette_id, nom_ingredient, quantite, unite, ordre) VALUES ($1, $2, $3, $4, $5)',
          [id, ing.nom, ing.quantite || null, ing.unite || null, i]
        );
      }
    }

    // Réinsérer les étapes
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
          [id, i + 1, texte, duree]
        );
      }
    }

    await client.query('COMMIT');
    return { success: true, id };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Supprime une recette
 */
async function deleteRecette(id) {
  const result = await db.query('DELETE FROM recettes WHERE id = $1', [id]);
  return { success: result.rowCount > 0 };
}

// ============================================
// INGREDIENTS (Base de référence)
// ============================================

/**
 * Récupère toutes les catégories d'ingrédients avec leurs items
 */
async function getAllIngredients() {
  const result = await db.query(`
    SELECT
      ci.id,
      ci.nom as categorie,
      COALESCE(
        (SELECT json_agg(i.nom ORDER BY i.nom)
         FROM ingredients i
         WHERE i.categorie_id = ci.id),
        '[]'::json
      ) as items
    FROM categories_ingredients ci
    ORDER BY ci.ordre, ci.nom
  `);

  return result.rows.map(row => ({
    categorie: row.categorie,
    items: row.items
  }));
}

/**
 * Met à jour les catégories d'ingrédients
 */
async function updateIngredients(data) {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Supprimer toutes les données existantes
    await client.query('DELETE FROM ingredients');
    await client.query('DELETE FROM categories_ingredients');

    // Réinsérer
    for (let i = 0; i < data.length; i++) {
      const cat = data[i];

      const catResult = await client.query(
        'INSERT INTO categories_ingredients (nom, ordre) VALUES ($1, $2) RETURNING id',
        [cat.categorie, i]
      );
      const categorieId = catResult.rows[0].id;

      for (const item of cat.items) {
        await client.query(
          'INSERT INTO ingredients (nom, categorie_id) VALUES ($1, $2)',
          [item, categorieId]
        );
      }
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ============================================
// UNITES
// ============================================

/**
 * Récupère toutes les catégories d'unités
 */
async function getAllUnites() {
  const result = await db.query(`
    SELECT
      cu.id,
      cu.nom as categorie,
      COALESCE(
        (SELECT json_agg(u.nom ORDER BY u.nom)
         FROM unites u
         WHERE u.categorie_id = cu.id),
        '[]'::json
      ) as unites
    FROM categories_unites cu
    ORDER BY cu.ordre, cu.nom
  `);

  return result.rows.map(row => ({
    categorie: row.categorie,
    unites: row.unites
  }));
}

/**
 * Met à jour les catégories d'unités
 */
async function updateUnites(data) {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM unites');
    await client.query('DELETE FROM categories_unites');

    for (let i = 0; i < data.length; i++) {
      const cat = data[i];

      const catResult = await client.query(
        'INSERT INTO categories_unites (nom, ordre) VALUES ($1, $2) RETURNING id',
        [cat.categorie, i]
      );
      const categorieId = catResult.rows[0].id;

      for (const unite of cat.unites) {
        await client.query(
          'INSERT INTO unites (nom, categorie_id) VALUES ($1, $2)',
          [unite, categorieId]
        );
      }
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ============================================
// ORIGINES
// ============================================

/**
 * Récupère toutes les origines
 */
async function getAllOrigines() {
  const result = await db.query('SELECT nom FROM origines ORDER BY nom');
  return result.rows.map(row => row.nom);
}

/**
 * Met à jour les origines
 */
async function updateOrigines(data) {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Ne pas supprimer les origines utilisées
    // Ajouter uniquement les nouvelles
    for (const origine of data) {
      await client.query(
        'INSERT INTO origines (nom) VALUES ($1) ON CONFLICT (nom) DO NOTHING',
        [origine]
      );
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ============================================
// FAVORIS
// ============================================

/**
 * Récupère tous les IDs des recettes favorites
 */
async function getAllFavoris() {
  const result = await db.query('SELECT recette_id FROM favoris ORDER BY date_ajout DESC');
  return result.rows.map(row => row.recette_id);
}

/**
 * Met à jour la liste des favoris
 */
async function updateFavoris(favorisIds) {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM favoris');

    for (const recetteId of favorisIds) {
      await client.query(
        'INSERT INTO favoris (recette_id) VALUES ($1) ON CONFLICT DO NOTHING',
        [recetteId]
      );
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Ajoute une recette aux favoris
 */
async function addFavori(recetteId) {
  await db.query(
    'INSERT INTO favoris (recette_id) VALUES ($1) ON CONFLICT DO NOTHING',
    [recetteId]
  );
  return { success: true };
}

/**
 * Retire une recette des favoris
 */
async function removeFavori(recetteId) {
  await db.query('DELETE FROM favoris WHERE recette_id = $1', [recetteId]);
  return { success: true };
}

// ============================================
// PLANNING
// ============================================

/**
 * Récupère le planning complet
 */
async function getPlanning() {
  const result = await db.query(`
    SELECT date_repas, moment, recette_id
    FROM planning
    ORDER BY date_repas, moment
  `);

  // Transformer en format JSON attendu par le frontend
  const planning = {};
  for (const row of result.rows) {
    const dateStr = row.date_repas.toISOString().split('T')[0];
    if (!planning[dateStr]) {
      planning[dateStr] = {};
    }
    planning[dateStr][row.moment] = { recetteId: row.recette_id };
  }

  return planning;
}

/**
 * Met à jour le planning complet
 */
async function updatePlanning(data) {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM planning');

    for (const [date, repas] of Object.entries(data)) {
      for (const [moment, info] of Object.entries(repas)) {
        if (info.recetteId) {
          await client.query(`
            INSERT INTO planning (date_repas, moment, recette_id)
            VALUES ($1, $2, $3)
          `, [date, moment, info.recetteId]);
        }
      }
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ============================================
// HISTORIQUE COURSES
// ============================================

/**
 * Récupère l'historique des courses
 */
async function getHistoriqueCourses() {
  const result = await db.query(`
    SELECT
      hc.id,
      hc.date_creation as date,
      hc.nombre_personnes as personnes,
      hc.liste_json as liste,
      COALESCE(
        (SELECT json_agg(hcr.recette_nom)
         FROM historique_courses_recettes hcr
         WHERE hcr.historique_id = hc.id),
        '[]'::json
      ) as recettes
    FROM historique_courses hc
    ORDER BY hc.date_creation DESC
  `);

  return result.rows;
}

/**
 * Ajoute une entrée à l'historique des courses
 */
async function addHistoriqueCourses(entry) {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const result = await client.query(`
      INSERT INTO historique_courses (date_creation, nombre_personnes, liste_json)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [entry.date || new Date(), entry.personnes, JSON.stringify(entry.liste)]);

    const historiqueId = result.rows[0].id;

    if (entry.recettes && Array.isArray(entry.recettes)) {
      for (const recetteNom of entry.recettes) {
        await client.query(
          'INSERT INTO historique_courses_recettes (historique_id, recette_nom) VALUES ($1, $2)',
          [historiqueId, recetteNom]
        );
      }
    }

    await client.query('COMMIT');
    return { success: true, id: historiqueId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Met à jour l'historique complet des courses
 */
async function updateHistoriqueCourses(data) {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM historique_courses_recettes');
    await client.query('DELETE FROM historique_courses');

    for (const entry of data) {
      const result = await client.query(`
        INSERT INTO historique_courses (date_creation, nombre_personnes, liste_json)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [entry.date, entry.personnes, JSON.stringify(entry.liste)]);

      const historiqueId = result.rows[0].id;

      if (entry.recettes && Array.isArray(entry.recettes)) {
        for (const recetteNom of entry.recettes) {
          await client.query(
            'INSERT INTO historique_courses_recettes (historique_id, recette_nom) VALUES ($1, $2)',
            [historiqueId, recetteNom]
          );
        }
      }
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ============================================
// HISTORIQUE RECETTES (Suivi de progression)
// ============================================

/**
 * Démarre une nouvelle recette (crée une entrée dans l'historique)
 */
async function demarrerRecette(recetteId, nombrePersonnes = 4) {
  const result = await db.query(`
    INSERT INTO historique_recettes (recette_id, nombre_personnes, statut, progression_etapes)
    VALUES ($1, $2, 'en_cours', '{"etapes": []}'::jsonb)
    RETURNING id, date_debut
  `, [recetteId, nombrePersonnes]);

  return {
    success: true,
    id: result.rows[0].id,
    dateDebut: result.rows[0].date_debut
  };
}

/**
 * Récupère la recette en cours la plus récente
 */
async function getRecetteEnCours() {
  const result = await db.query(`
    SELECT
      hr.id,
      hr.recette_id as "recetteId",
      r.nom as "recetteNom",
      t.code as type,
      r.image_url as image,
      r.photo_locale as photo,
      hr.date_debut as "dateDebut",
      hr.progression_etapes as "progressionEtapes",
      hr.nombre_personnes as "nombrePersonnes",
      COALESCE(get_recette_ingredients_json(r.id), '[]'::jsonb) as ingredients,
      COALESCE(get_recette_etapes_json(r.id), '[]'::jsonb) as etapes,
      COALESCE(get_recette_origines(r.id), ARRAY[]::TEXT[]) as origines
    FROM historique_recettes hr
    JOIN recettes r ON hr.recette_id = r.id
    LEFT JOIN types_plat t ON r.type_id = t.id
    WHERE hr.statut = 'en_cours'
    ORDER BY hr.date_debut DESC
    LIMIT 1
  `);

  return result.rows[0] || null;
}

/**
 * Vérifie s'il y a une recette en cours
 */
async function hasRecetteEnCours() {
  const result = await db.query(`
    SELECT EXISTS(
      SELECT 1 FROM historique_recettes WHERE statut = 'en_cours'
    ) as has_en_cours
  `);
  return result.rows[0].has_en_cours;
}

/**
 * Met à jour la progression d'une recette en cours
 */
async function updateProgressionRecette(historiqueId, progressionEtapes) {
  const result = await db.query(`
    UPDATE historique_recettes
    SET progression_etapes = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND statut = 'en_cours'
    RETURNING id
  `, [historiqueId, JSON.stringify(progressionEtapes)]);

  return { success: result.rowCount > 0 };
}

/**
 * Termine une recette (change le statut et enregistre la date de fin)
 */
async function terminerRecette(historiqueId, notes = null) {
  const result = await db.query(`
    UPDATE historique_recettes
    SET statut = 'terminee', date_fin = CURRENT_TIMESTAMP, notes = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND statut = 'en_cours'
    RETURNING id, date_fin
  `, [historiqueId, notes]);

  if (result.rowCount === 0) {
    return { success: false, error: 'Recette non trouvée ou déjà terminée' };
  }

  return {
    success: true,
    id: result.rows[0].id,
    dateFin: result.rows[0].date_fin
  };
}

/**
 * Récupère l'historique complet des recettes réalisées
 */
async function getHistoriqueRecettes(options = {}) {
  const { statut, dateDebut, dateFin, limit = 50, offset = 0 } = options;

  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (statut) {
    whereClause += ` AND hr.statut = $${paramIndex}`;
    params.push(statut);
    paramIndex++;
  }

  if (dateDebut) {
    whereClause += ` AND hr.date_debut >= $${paramIndex}`;
    params.push(dateDebut);
    paramIndex++;
  }

  if (dateFin) {
    whereClause += ` AND hr.date_debut <= $${paramIndex}`;
    params.push(dateFin);
    paramIndex++;
  }

  params.push(limit, offset);

  const result = await db.query(`
    SELECT
      hr.id,
      hr.recette_id as "recetteId",
      r.nom as "recetteNom",
      t.code as type,
      r.image_url as image,
      r.photo_locale as photo,
      hr.date_debut as "dateDebut",
      hr.date_fin as "dateFin",
      hr.statut,
      hr.nombre_personnes as "nombrePersonnes",
      hr.notes,
      CASE
        WHEN hr.date_fin IS NOT NULL THEN
          EXTRACT(EPOCH FROM (hr.date_fin - hr.date_debut)) / 60
        ELSE NULL
      END as "dureeMinutes"
    FROM historique_recettes hr
    JOIN recettes r ON hr.recette_id = r.id
    LEFT JOIN types_plat t ON r.type_id = t.id
    ${whereClause}
    ORDER BY hr.date_debut DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `, params);

  return result.rows;
}

/**
 * Récupère le nombre de réalisations pour une recette
 */
async function getNombreRealisations(recetteId) {
  const result = await db.query(`
    SELECT COUNT(*) as count
    FROM historique_recettes
    WHERE recette_id = $1 AND statut = 'terminee'
  `, [recetteId]);

  return parseInt(result.rows[0].count);
}

/**
 * Récupère les compteurs de réalisations pour toutes les recettes
 */
async function getAllNombreRealisations() {
  const result = await db.query(`
    SELECT recette_id as "recetteId", COUNT(*) as count
    FROM historique_recettes
    WHERE statut = 'terminee'
    GROUP BY recette_id
  `);

  // Transformer en objet {recetteId: count}
  const compteurs = {};
  for (const row of result.rows) {
    compteurs[row.recetteId] = parseInt(row.count);
  }
  return compteurs;
}

/**
 * Récupère une entrée d'historique par son ID
 */
async function getHistoriqueRecetteById(historiqueId) {
  const result = await db.query(`
    SELECT
      hr.id,
      hr.recette_id as "recetteId",
      r.nom as "recetteNom",
      t.code as type,
      r.image_url as image,
      r.photo_locale as photo,
      hr.date_debut as "dateDebut",
      hr.date_fin as "dateFin",
      hr.statut,
      hr.progression_etapes as "progressionEtapes",
      hr.nombre_personnes as "nombrePersonnes",
      hr.notes,
      COALESCE(get_recette_ingredients_json(r.id), '[]'::jsonb) as ingredients,
      COALESCE(get_recette_etapes_json(r.id), '[]'::jsonb) as etapes,
      COALESCE(get_recette_origines(r.id), ARRAY[]::TEXT[]) as origines
    FROM historique_recettes hr
    JOIN recettes r ON hr.recette_id = r.id
    LEFT JOIN types_plat t ON r.type_id = t.id
    WHERE hr.id = $1
  `, [historiqueId]);

  return result.rows[0] || null;
}

module.exports = {
  // Recettes
  getAllRecettes,
  getRecetteById,
  createRecette,
  updateRecette,
  deleteRecette,
  // Ingrédients
  getAllIngredients,
  updateIngredients,
  // Unités
  getAllUnites,
  updateUnites,
  // Origines
  getAllOrigines,
  updateOrigines,
  // Favoris
  getAllFavoris,
  updateFavoris,
  addFavori,
  removeFavori,
  // Planning
  getPlanning,
  updatePlanning,
  // Historique courses
  getHistoriqueCourses,
  addHistoriqueCourses,
  updateHistoriqueCourses,
  // Historique recettes (suivi de progression)
  demarrerRecette,
  getRecetteEnCours,
  hasRecetteEnCours,
  updateProgressionRecette,
  terminerRecette,
  getHistoriqueRecettes,
  getNombreRealisations,
  getAllNombreRealisations,
  getHistoriqueRecetteById
};
