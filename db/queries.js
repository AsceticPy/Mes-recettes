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
      r.niveau_difficulte as "niveauDifficulte",
      COALESCE(get_recette_origines(r.id), ARRAY[]::TEXT[]) as origines,
      COALESCE(get_recette_ingredients_json(r.id), '[]'::jsonb) as ingredients,
      COALESCE(get_recette_etapes_json(r.id), '[]'::jsonb) as etapes,
      COALESCE(get_recette_tags_json(r.id), '[]'::jsonb) as tags
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
      r.niveau_difficulte as "niveauDifficulte",
      COALESCE(get_recette_origines(r.id), ARRAY[]::TEXT[]) as origines,
      COALESCE(get_recette_ingredients_json(r.id), '[]'::jsonb) as ingredients,
      COALESCE(get_recette_etapes_json(r.id), '[]'::jsonb) as etapes,
      COALESCE(get_recette_tags_json(r.id), '[]'::jsonb) as tags
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
      INSERT INTO recettes (id, nom, type_id, temps_preparation, temps_cuisson, nombre_personnes, image_url, photo_locale, niveau_difficulte)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      recetteData.id,
      recetteData.nom,
      typeId,
      recetteData.tempsPreparation || 0,
      recetteData.tempsCuisson || 0,
      recetteData.personnes || 4,
      recetteData.image || null,
      recetteData.photo || null,
      recetteData.niveauDifficulte || null
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

    // Insérer les tags
    if (recetteData.tags && Array.isArray(recetteData.tags)) {
      for (const tagId of recetteData.tags) {
        await client.query(
          'INSERT INTO recette_tags (recette_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [recetteData.id, tagId]
        );
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
        niveau_difficulte = $9,
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
      recetteData.photo,
      recetteData.niveauDifficulte || null
    ]);

    // Supprimer et réinsérer les relations
    await client.query('DELETE FROM recettes_origines WHERE recette_id = $1', [id]);
    await client.query('DELETE FROM recettes_ingredients WHERE recette_id = $1', [id]);
    await client.query('DELETE FROM etapes_recette WHERE recette_id = $1', [id]);
    await client.query('DELETE FROM recette_tags WHERE recette_id = $1', [id]);

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

    // Réinsérer les tags
    if (recetteData.tags && Array.isArray(recetteData.tags)) {
      for (const tagId of recetteData.tags) {
        await client.query(
          'INSERT INTO recette_tags (recette_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, tagId]
        );
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
      if (!repas) continue;
      for (const [moment, info] of Object.entries(repas)) {
        if (info && info.recetteId) {
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

// ============================================
// STATISTIQUES (Feature 5, 6, 7)
// ============================================

/**
 * Récupère toutes les statistiques culinaires
 */
async function getStatistiques() {
  // Total de réalisations
  const totalResult = await db.query(`
    SELECT COUNT(*) as total FROM historique_recettes WHERE statut = 'terminee'
  `);
  const totalRealisations = parseInt(totalResult.rows[0].total) || 0;

  // Temps total en cuisine (en minutes)
  const tempsResult = await db.query(`
    SELECT COALESCE(SUM(r.temps_preparation + r.temps_cuisson), 0) as temps
    FROM historique_recettes hr
    JOIN recettes r ON hr.recette_id = r.id
    WHERE hr.statut = 'terminee'
  `);
  const tempsTotal = parseInt(tempsResult.rows[0].temps) || 0;

  // Réalisations ce mois-ci
  const moisResult = await db.query(`
    SELECT COUNT(*) as total
    FROM historique_recettes
    WHERE statut = 'terminee'
    AND date_fin >= DATE_TRUNC('month', CURRENT_DATE)
  `);
  const ceMois = parseInt(moisResult.rows[0].total) || 0;

  // Favoris réalisés
  const favorisResult = await db.query(`
    SELECT COUNT(DISTINCT hr.recette_id) as total
    FROM historique_recettes hr
    JOIN favoris f ON hr.recette_id = f.recette_id
    WHERE hr.statut = 'terminee'
  `);
  const favorisRealises = parseInt(favorisResult.rows[0].total) || 0;

  // Top 10 recettes
  const topResult = await db.query(`
    SELECT
      hr.recette_id as "recetteId",
      r.nom,
      COUNT(*) as count
    FROM historique_recettes hr
    JOIN recettes r ON hr.recette_id = r.id
    WHERE hr.statut = 'terminee'
    GROUP BY hr.recette_id, r.nom
    ORDER BY count DESC
    LIMIT 10
  `);
  const topRecettes = topResult.rows.map(r => ({
    recetteId: r.recetteId,
    nom: r.nom,
    count: parseInt(r.count)
  }));

  // Stats par type
  const typeResult = await db.query(`
    SELECT
      t.code as type,
      COUNT(*) as count
    FROM historique_recettes hr
    JOIN recettes r ON hr.recette_id = r.id
    JOIN types_plat t ON r.type_id = t.id
    WHERE hr.statut = 'terminee'
    GROUP BY t.code
    ORDER BY count DESC
  `);
  const parType = typeResult.rows.map(r => ({
    type: r.type,
    count: parseInt(r.count)
  }));

  // Stats par origine
  const origineResult = await db.query(`
    SELECT
      o.nom as origine,
      COUNT(*) as count
    FROM historique_recettes hr
    JOIN recettes r ON hr.recette_id = r.id
    JOIN recettes_origines ro ON r.id = ro.recette_id
    JOIN origines o ON ro.origine_id = o.id
    WHERE hr.statut = 'terminee'
    GROUP BY o.nom
    ORDER BY count DESC
    LIMIT 6
  `);
  const parOrigine = origineResult.rows.map(r => ({
    origine: r.origine,
    count: parseInt(r.count)
  }));

  // Réalisations par jour (pour le calendrier)
  const joursResult = await db.query(`
    SELECT
      DATE(date_fin) as date,
      COUNT(*) as count
    FROM historique_recettes
    WHERE statut = 'terminee'
    AND date_fin >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY DATE(date_fin)
    ORDER BY date
  `);
  const realisationsParJour = joursResult.rows.map(r => ({
    date: r.date,
    count: parseInt(r.count)
  }));

  return {
    totalRealisations,
    tempsTotal,
    ceMois,
    favorisRealises,
    topRecettes,
    parType,
    parOrigine,
    realisationsParJour
  };
}

// ============================================
// NOTES PERSONNELLES (Feature 16)
// ============================================

/**
 * Récupère les notes d'une recette
 */
async function getNotesRecette(recetteId) {
  const result = await db.query(`
    SELECT
      id,
      recette_id as "recetteId",
      contenu,
      date_creation as "dateCreation"
    FROM notes_recettes
    WHERE recette_id = $1
    ORDER BY date_creation DESC
  `, [recetteId]);

  return result.rows;
}

/**
 * Ajoute une note à une recette
 */
async function ajouterNote(recetteId, contenu) {
  const result = await db.query(`
    INSERT INTO notes_recettes (recette_id, contenu)
    VALUES ($1, $2)
    RETURNING id, recette_id as "recetteId", contenu, date_creation as "dateCreation"
  `, [recetteId, contenu]);

  return result.rows[0];
}

/**
 * Supprime une note
 */
async function supprimerNote(noteId) {
  await db.query('DELETE FROM notes_recettes WHERE id = $1', [noteId]);
  return { success: true };
}

// ============================================
// TAGS
// ============================================

async function getAllTags() {
  const result = await db.query(`
    SELECT id, nom, categorie, icone, couleur
    FROM tags
    ORDER BY categorie, nom
  `);
  return result.rows;
}

async function getRecetteTags(recetteId) {
  const result = await db.query(`
    SELECT t.id, t.nom, t.categorie, t.icone, t.couleur
    FROM recette_tags rt
    JOIN tags t ON rt.tag_id = t.id
    WHERE rt.recette_id = $1
    ORDER BY t.categorie, t.nom
  `, [recetteId]);
  return result.rows;
}

// ============================================
// DASHBOARD
// ============================================

async function getDashboardConfig() {
  const result = await db.query(`
    SELECT id, widget_type as "widgetType", position, visible, config
    FROM dashboard_config
    ORDER BY position
  `);
  return result.rows;
}

async function updateDashboardConfig(configs) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    for (const config of configs) {
      await client.query(`
        UPDATE dashboard_config
        SET position = $2, visible = $3, config = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [config.id, config.position, config.visible, JSON.stringify(config.config)]);
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

async function getDashboardData() {
  // Recettes récentes (dernières consultées/réalisées)
  const recentesResult = await db.query(`
    SELECT DISTINCT ON (r.id)
      r.id, r.nom, t.code as type, r.photo_locale as photo, r.image_url as image,
      r.niveau_difficulte as "niveauDifficulte",
      hr.date_debut as "dateAcces"
    FROM historique_recettes hr
    JOIN recettes r ON hr.recette_id = r.id
    LEFT JOIN types_plat t ON r.type_id = t.id
    ORDER BY r.id, hr.date_debut DESC
    LIMIT 10
  `);
  // Re-sort by most recent access
  const recentes = recentesResult.rows.sort((a, b) => new Date(b.dateAcces) - new Date(a.dateAcces)).slice(0, 5);

  // Favoris
  const favorisResult = await db.query(`
    SELECT r.id, r.nom, t.code as type, r.photo_locale as photo, r.image_url as image,
      r.niveau_difficulte as "niveauDifficulte"
    FROM favoris f
    JOIN recettes r ON f.recette_id = r.id
    LEFT JOIN types_plat t ON r.type_id = t.id
    ORDER BY f.date_ajout DESC
    LIMIT 10
  `);

  // Planning du jour
  const today = new Date().toISOString().split('T')[0];
  const planningResult = await db.query(`
    SELECT p.moment, r.id as "recetteId", r.nom as "recetteNom",
      r.photo_locale as photo, r.image_url as image
    FROM planning p
    JOIN recettes r ON p.recette_id = r.id
    WHERE p.date_repas = $1
    ORDER BY p.moment
  `, [today]);

  // Formater le planning du jour en { midi: recetteId, soir: recetteId }
  const planningJour = {};
  for (const row of planningResult.rows) {
    planningJour[row.moment] = row.recetteId;
  }

  return {
    recentes,
    favoris: favorisResult.rows,
    planningJour
  };
}

// ============================================
// SUGGESTIONS INTELLIGENTES
// ============================================

async function getSuggestion() {
  // Algorithme de suggestion basé sur :
  // 1. Les favoris (poids élevé)
  // 2. Les recettes non réalisées depuis longtemps
  // 3. Les recettes populaires
  // 4. Éviter les répétitions récentes

  // Récupérer les recettes réalisées ces 3 derniers jours pour les exclure
  const recentesResult = await db.query(`
    SELECT DISTINCT recette_id FROM historique_recettes
    WHERE date_debut >= CURRENT_DATE - INTERVAL '3 days'
  `);
  const recentIds = recentesResult.rows.map(r => r.recette_id);

  // Essayer d'abord les favoris non réalisés récemment
  let result = await db.query(`
    SELECT r.id, r.nom, t.code as type, r.photo_locale as photo, r.image_url as image,
      r.temps_preparation as "tempsPreparation", r.temps_cuisson as "tempsCuisson",
      r.nombre_personnes as personnes, r.niveau_difficulte as "niveauDifficulte",
      COALESCE(get_recette_origines(r.id), ARRAY[]::TEXT[]) as origines,
      COALESCE(get_recette_tags_json(r.id), '[]'::jsonb) as tags
    FROM favoris f
    JOIN recettes r ON f.recette_id = r.id
    LEFT JOIN types_plat t ON r.type_id = t.id
    WHERE r.id != ALL($1::varchar[])
    ORDER BY RANDOM()
    LIMIT 1
  `, [recentIds]);

  if (result.rows.length > 0) {
    return { ...result.rows[0], raison: 'favori' };
  }

  // Sinon, recettes non réalisées depuis longtemps
  result = await db.query(`
    SELECT r.id, r.nom, t.code as type, r.photo_locale as photo, r.image_url as image,
      r.temps_preparation as "tempsPreparation", r.temps_cuisson as "tempsCuisson",
      r.nombre_personnes as personnes, r.niveau_difficulte as "niveauDifficulte",
      COALESCE(get_recette_origines(r.id), ARRAY[]::TEXT[]) as origines,
      COALESCE(get_recette_tags_json(r.id), '[]'::jsonb) as tags,
      MAX(hr.date_debut) as "derniereRealisation"
    FROM recettes r
    LEFT JOIN types_plat t ON r.type_id = t.id
    LEFT JOIN historique_recettes hr ON r.id = hr.recette_id AND hr.statut = 'terminee'
    WHERE r.id != ALL($1::varchar[])
    GROUP BY r.id, r.nom, t.code, r.photo_locale, r.image_url,
      r.temps_preparation, r.temps_cuisson, r.nombre_personnes, r.niveau_difficulte
    ORDER BY MAX(hr.date_debut) ASC NULLS FIRST, RANDOM()
    LIMIT 1
  `, [recentIds]);

  if (result.rows.length > 0) {
    return { ...result.rows[0], raison: result.rows[0].derniereRealisation ? 'pas_recente' : 'jamais_realisee' };
  }

  // Dernier recours : n'importe quelle recette
  result = await db.query(`
    SELECT r.id, r.nom, t.code as type, r.photo_locale as photo, r.image_url as image,
      r.temps_preparation as "tempsPreparation", r.temps_cuisson as "tempsCuisson",
      r.nombre_personnes as personnes, r.niveau_difficulte as "niveauDifficulte",
      COALESCE(get_recette_origines(r.id), ARRAY[]::TEXT[]) as origines,
      COALESCE(get_recette_tags_json(r.id), '[]'::jsonb) as tags
    FROM recettes r
    LEFT JOIN types_plat t ON r.type_id = t.id
    ORDER BY RANDOM()
    LIMIT 1
  `);

  return result.rows.length > 0 ? { ...result.rows[0], raison: 'aleatoire' } : null;
}

// ============================================
// NOTIFICATIONS
// ============================================

async function getNotificationSettings() {
  const result = await db.query(`
    SELECT id, timer_notifications as "timerNotifications",
      meal_reminder as "mealReminder",
      reminder_time as "reminderTime",
      active_days as "activeDays"
    FROM notification_settings
    LIMIT 1
  `);
  return result.rows[0] || { timerNotifications: true, mealReminder: true, reminderTime: '18:00:00', activeDays: ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'] };
}

async function updateNotificationSettings(settings) {
  const result = await db.query(`
    UPDATE notification_settings SET
      timer_notifications = $1,
      meal_reminder = $2,
      reminder_time = $3,
      active_days = $4,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
    RETURNING id
  `, [
    settings.timerNotifications,
    settings.mealReminder,
    settings.reminderTime,
    JSON.stringify(settings.activeDays)
  ]);
  return { success: result.rowCount > 0 };
}

// ============================================
// ÉQUILIBRAGE NUTRITIONNEL
// ============================================

async function getEquilibreNutritionnel(dateDebut, dateFin) {
  // Analyser les recettes planifiées sur la période
  const result = await db.query(`
    SELECT
      p.date_repas,
      p.moment,
      r.id as "recetteId",
      r.nom as "recetteNom",
      COALESCE(get_recette_tags_json(r.id), '[]'::jsonb) as tags
    FROM planning p
    JOIN recettes r ON p.recette_id = r.id
    WHERE p.date_repas >= $1 AND p.date_repas <= $2
    ORDER BY p.date_repas, p.moment
  `, [dateDebut, dateFin]);

  // Compter les catégories de tags
  const compteurs = {
    viandeRouge: 0,
    viandeBlanche: 0,
    poisson: 0,
    vegetarien: 0,
    vegan: 0,
    legumes: 0,
    feculents: 0,
    totalRepas: result.rows.length
  };

  const alertes = [];

  for (const row of result.rows) {
    const tags = row.tags || [];
    const tagNoms = tags.map(t => t.nom);
    if (tagNoms.includes('Végétarien')) compteurs.vegetarien++;
    if (tagNoms.includes('Vegan')) compteurs.vegan++;
    if (tagNoms.includes('Pescetarien')) compteurs.poisson++;
    if (tagNoms.includes('Léger')) compteurs.legumes++;
    if (tagNoms.includes('Riche en protéines')) compteurs.viandeRouge++;
  }

  // Générer des alertes
  if (compteurs.totalRepas > 0) {
    if (compteurs.vegetarien === 0 && compteurs.vegan === 0) {
      alertes.push({ type: 'warning', message: 'Pas de repas végétarien cette semaine. Pensez à varier !' });
    }
    if (compteurs.vegetarien + compteurs.vegan >= compteurs.totalRepas * 0.5) {
      alertes.push({ type: 'success', message: 'Bonne variété de protéines !' });
    }
    if (compteurs.legumes >= compteurs.totalRepas * 0.3) {
      alertes.push({ type: 'success', message: 'Bon apport en légumes !' });
    }
  }

  return {
    compteurs,
    alertes,
    repas: result.rows
  };
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
  getHistoriqueRecetteById,
  // Statistiques (Feature 5, 6, 7)
  getStatistiques,
  // Notes personnelles (Feature 16)
  getNotesRecette,
  ajouterNote,
  supprimerNote,
  // Tags
  getAllTags,
  getRecetteTags,
  // Dashboard
  getDashboardConfig,
  updateDashboardConfig,
  getDashboardData,
  // Suggestions
  getSuggestion,
  // Notifications
  getNotificationSettings,
  updateNotificationSettings,
  // Équilibre nutritionnel
  getEquilibreNutritionnel
};
