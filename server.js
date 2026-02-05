/**
 * Serveur Cuisine PWA avec PostgreSQL
 * =====================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Importer les modules base de données
const db = require('./db/database');
const queries = require('./db/queries');
const { runMigration } = require('./db/migration');

// Configuration
const PORT = parseInt(process.env.PORT) || 8000;
const PHOTOS_DIR = process.env.PHOTOS_DIR || path.join(__dirname, 'photos');
const USE_DATABASE = process.env.USE_DATABASE !== 'false'; // Par défaut: utiliser la BDD

// Configuration fallback fichiers (si pas de BDD)
const RECETTES_DIR = path.join(__dirname, 'recettes');
const DATA_DIR = path.join(__dirname, 'data');
const INGREDIENTS_FILE = path.join(DATA_DIR, 'ingredients.json');
const FAVORIS_FILE = path.join(DATA_DIR, 'favoris.json');
const HISTORIQUE_FILE = path.join(DATA_DIR, 'historique-courses.json');
const UNITES_FILE = path.join(DATA_DIR, 'unites.json');
const ORIGINES_FILE = path.join(DATA_DIR, 'origines.json');
const PLANNING_FILE = path.join(DATA_DIR, 'planning.json');

// Types MIME
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Variable pour stocker l'état de connexion BDD
let dbConnected = false;

// Créer les dossiers s'ils n'existent pas
if (!fs.existsSync(PHOTOS_DIR)) fs.mkdirSync(PHOTOS_DIR, { recursive: true });
if (!fs.existsSync(RECETTES_DIR)) fs.mkdirSync(RECETTES_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Fonction pour générer un slug à partir du nom
function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// Fonction utilitaire pour parser le body JSON
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('JSON invalide'));
      }
    });
    req.on('error', reject);
  });
}

// Fonction utilitaire pour envoyer une réponse JSON
function sendJson(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Fonction utilitaire pour envoyer une erreur
function sendError(res, message, status = 500) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: message }));
}

// ============================================
// Fonctions de fallback fichiers (mode sans BDD)
// ============================================

function readJsonFile(filepath, defaultValue = []) {
  return new Promise((resolve) => {
    fs.readFile(filepath, 'utf8', (err, data) => {
      if (err) {
        resolve(defaultValue);
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        resolve(defaultValue);
      }
    });
  });
}

function writeJsonFile(filepath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8', (err) => {
      if (err) reject(err);
      else resolve({ success: true });
    });
  });
}

async function getAllRecettesFromFiles() {
  return new Promise((resolve, reject) => {
    fs.readdir(RECETTES_DIR, (err, files) => {
      if (err) {
        resolve([]);
        return;
      }
      const recettes = [];
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      if (jsonFiles.length === 0) {
        resolve([]);
        return;
      }
      let loaded = 0;
      jsonFiles.forEach(file => {
        fs.readFile(path.join(RECETTES_DIR, file), 'utf8', (err, data) => {
          loaded++;
          if (!err) {
            try {
              recettes.push(JSON.parse(data));
            } catch (e) {
              console.error(`Erreur parsing ${file}:`, e);
            }
          }
          if (loaded === jsonFiles.length) {
            resolve(recettes);
          }
        });
      });
    });
  });
}

// ============================================
// Gestionnaire de routes
// ============================================

async function handleRequest(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  try {
    // ========== API RECETTES ==========

    // GET /api/recettes - Liste des recettes
    if (pathname === '/api/recettes' && req.method === 'GET') {
      let recettes;
      if (dbConnected) {
        recettes = await queries.getAllRecettes();
      } else {
        recettes = await getAllRecettesFromFiles();
      }
      sendJson(res, recettes);
      return;
    }

    // POST /api/recettes - Créer une recette
    if (pathname === '/api/recettes' && req.method === 'POST') {
      const recette = await parseJsonBody(req);
      if (!recette.id) {
        recette.id = slugify(recette.nom);
      }

      if (dbConnected) {
        const result = await queries.createRecette(recette);
        sendJson(res, result);
      } else {
        const filepath = path.join(RECETTES_DIR, `${recette.id}.json`);
        await writeJsonFile(filepath, recette);
        sendJson(res, { success: true, id: recette.id });
      }
      return;
    }

    // PUT /api/recettes/:id - Modifier une recette
    if (pathname.startsWith('/api/recettes/') && req.method === 'PUT') {
      const id = pathname.replace('/api/recettes/', '');
      const recetteData = await parseJsonBody(req);

      // Gérer la photo en base64 si présente
      if (recetteData.photoData) {
        const photoData = recetteData.photoData;
        delete recetteData.photoData;

        const matches = photoData.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const data = matches[2];
          const photoPath = path.join(PHOTOS_DIR, recetteData.photo);
          fs.writeFileSync(photoPath, Buffer.from(data, 'base64'));
        }
      }

      if (dbConnected) {
        const result = await queries.updateRecette(id, recetteData);
        sendJson(res, result);
      } else {
        recetteData.id = id;
        const filepath = path.join(RECETTES_DIR, `${id}.json`);
        await writeJsonFile(filepath, recetteData);
        sendJson(res, { success: true, id });
      }
      return;
    }

    // DELETE /api/recettes/:id - Supprimer une recette
    if (pathname.startsWith('/api/recettes/') && req.method === 'DELETE') {
      const id = pathname.replace('/api/recettes/', '');

      if (dbConnected) {
        const result = await queries.deleteRecette(id);
        sendJson(res, result);
      } else {
        const filepath = path.join(RECETTES_DIR, `${id}.json`);
        fs.unlink(filepath, (err) => {
          if (err) {
            sendError(res, 'Recette non trouvée', 404);
          } else {
            sendJson(res, { success: true });
          }
        });
      }
      return;
    }

    // ========== API INGREDIENTS ==========

    if (pathname === '/api/ingredients' && req.method === 'GET') {
      if (dbConnected) {
        const ingredients = await queries.getAllIngredients();
        sendJson(res, ingredients);
      } else {
        const ingredients = await readJsonFile(INGREDIENTS_FILE);
        sendJson(res, ingredients);
      }
      return;
    }

    if (pathname === '/api/ingredients' && (req.method === 'POST' || req.method === 'PUT')) {
      const ingredients = await parseJsonBody(req);

      if (dbConnected) {
        const result = await queries.updateIngredients(ingredients);
        sendJson(res, result);
      } else {
        await writeJsonFile(INGREDIENTS_FILE, ingredients);
        sendJson(res, { success: true });
      }
      return;
    }

    // ========== API UNITES ==========

    if (pathname === '/api/unites' && req.method === 'GET') {
      if (dbConnected) {
        const unites = await queries.getAllUnites();
        sendJson(res, unites);
      } else {
        const unites = await readJsonFile(UNITES_FILE);
        sendJson(res, unites);
      }
      return;
    }

    if (pathname === '/api/unites' && (req.method === 'POST' || req.method === 'PUT')) {
      const unites = await parseJsonBody(req);

      if (dbConnected) {
        const result = await queries.updateUnites(unites);
        sendJson(res, result);
      } else {
        await writeJsonFile(UNITES_FILE, unites);
        sendJson(res, { success: true });
      }
      return;
    }

    // ========== API ORIGINES ==========

    if (pathname === '/api/origines' && req.method === 'GET') {
      if (dbConnected) {
        const origines = await queries.getAllOrigines();
        sendJson(res, origines);
      } else {
        const origines = await readJsonFile(ORIGINES_FILE);
        sendJson(res, origines);
      }
      return;
    }

    // ========== API FAVORIS ==========

    if (pathname === '/api/favoris' && req.method === 'GET') {
      if (dbConnected) {
        const favoris = await queries.getAllFavoris();
        sendJson(res, favoris);
      } else {
        const favoris = await readJsonFile(FAVORIS_FILE);
        sendJson(res, favoris);
      }
      return;
    }

    if (pathname === '/api/favoris' && req.method === 'POST') {
      const favoris = await parseJsonBody(req);

      if (dbConnected) {
        const result = await queries.updateFavoris(favoris);
        sendJson(res, result);
      } else {
        await writeJsonFile(FAVORIS_FILE, favoris);
        sendJson(res, { success: true });
      }
      return;
    }

    // ========== API PLANNING ==========

    if (pathname === '/api/planning' && req.method === 'GET') {
      if (dbConnected) {
        const planning = await queries.getPlanning();
        sendJson(res, planning);
      } else {
        const planning = await readJsonFile(PLANNING_FILE, {});
        sendJson(res, planning);
      }
      return;
    }

    if (pathname === '/api/planning' && req.method === 'POST') {
      const planning = await parseJsonBody(req);

      if (dbConnected) {
        const result = await queries.updatePlanning(planning);
        sendJson(res, result);
      } else {
        await writeJsonFile(PLANNING_FILE, planning);
        sendJson(res, { success: true });
      }
      return;
    }

    // ========== API HISTORIQUE COURSES ==========

    if (pathname === '/api/historique-courses' && req.method === 'GET') {
      if (dbConnected) {
        const historique = await queries.getHistoriqueCourses();
        sendJson(res, historique);
      } else {
        const historique = await readJsonFile(HISTORIQUE_FILE);
        sendJson(res, historique);
      }
      return;
    }

    if (pathname === '/api/historique-courses' && req.method === 'POST') {
      const historique = await parseJsonBody(req);

      if (dbConnected) {
        const result = await queries.updateHistoriqueCourses(historique);
        sendJson(res, result);
      } else {
        await writeJsonFile(HISTORIQUE_FILE, historique);
        sendJson(res, { success: true });
      }
      return;
    }

    // ========== API HISTORIQUE RECETTES (Suivi de progression) ==========

    // GET /api/historique-recettes - Liste de l'historique des recettes
    if (pathname === '/api/historique-recettes' && req.method === 'GET') {
      if (!dbConnected) {
        sendError(res, 'Fonctionnalité disponible uniquement avec PostgreSQL', 503);
        return;
      }

      const statut = url.searchParams.get('statut');
      const dateDebut = url.searchParams.get('dateDebut');
      const dateFin = url.searchParams.get('dateFin');
      const limit = parseInt(url.searchParams.get('limit')) || 50;
      const offset = parseInt(url.searchParams.get('offset')) || 0;

      const historique = await queries.getHistoriqueRecettes({ statut, dateDebut, dateFin, limit, offset });
      sendJson(res, historique);
      return;
    }

    // GET /api/historique-recettes/:id - Détails d'une entrée d'historique
    if (pathname.match(/^\/api\/historique-recettes\/\d+$/) && req.method === 'GET') {
      if (!dbConnected) {
        sendError(res, 'Fonctionnalité disponible uniquement avec PostgreSQL', 503);
        return;
      }

      const id = parseInt(pathname.split('/').pop());
      const entry = await queries.getHistoriqueRecetteById(id);
      if (!entry) {
        sendError(res, 'Entrée non trouvée', 404);
        return;
      }
      sendJson(res, entry);
      return;
    }

    // GET /api/recette-en-cours - Récupère la recette en cours
    if (pathname === '/api/recette-en-cours' && req.method === 'GET') {
      if (!dbConnected) {
        sendError(res, 'Fonctionnalité disponible uniquement avec PostgreSQL', 503);
        return;
      }

      const recetteEnCours = await queries.getRecetteEnCours();
      sendJson(res, recetteEnCours);
      return;
    }

    // GET /api/has-recette-en-cours - Vérifie s'il y a une recette en cours
    if (pathname === '/api/has-recette-en-cours' && req.method === 'GET') {
      if (!dbConnected) {
        sendJson(res, { hasRecetteEnCours: false });
        return;
      }

      const hasEnCours = await queries.hasRecetteEnCours();
      sendJson(res, { hasRecetteEnCours: hasEnCours });
      return;
    }

    // POST /api/demarrer-recette - Démarre une recette
    if (pathname === '/api/demarrer-recette' && req.method === 'POST') {
      if (!dbConnected) {
        sendError(res, 'Fonctionnalité disponible uniquement avec PostgreSQL', 503);
        return;
      }

      const { recetteId, nombrePersonnes } = await parseJsonBody(req);
      if (!recetteId) {
        sendError(res, 'recetteId requis', 400);
        return;
      }

      const result = await queries.demarrerRecette(recetteId, nombrePersonnes || 4);
      sendJson(res, result);
      return;
    }

    // POST /api/progression-recette - Met à jour la progression
    if (pathname === '/api/progression-recette' && req.method === 'POST') {
      if (!dbConnected) {
        sendError(res, 'Fonctionnalité disponible uniquement avec PostgreSQL', 503);
        return;
      }

      const { historiqueId, progressionEtapes } = await parseJsonBody(req);
      if (!historiqueId || !progressionEtapes) {
        sendError(res, 'historiqueId et progressionEtapes requis', 400);
        return;
      }

      const result = await queries.updateProgressionRecette(historiqueId, progressionEtapes);
      sendJson(res, result);
      return;
    }

    // POST /api/terminer-recette - Termine une recette
    if (pathname === '/api/terminer-recette' && req.method === 'POST') {
      if (!dbConnected) {
        sendError(res, 'Fonctionnalité disponible uniquement avec PostgreSQL', 503);
        return;
      }

      const { historiqueId, notes } = await parseJsonBody(req);
      if (!historiqueId) {
        sendError(res, 'historiqueId requis', 400);
        return;
      }

      const result = await queries.terminerRecette(historiqueId, notes);
      sendJson(res, result);
      return;
    }

    // GET /api/compteurs-realisations - Récupère les compteurs de toutes les recettes
    if (pathname === '/api/compteurs-realisations' && req.method === 'GET') {
      if (!dbConnected) {
        sendJson(res, {});
        return;
      }

      const compteurs = await queries.getAllNombreRealisations();
      sendJson(res, compteurs);
      return;
    }

    // GET /api/nombre-realisations/:recetteId - Récupère le compteur d'une recette
    if (pathname.match(/^\/api\/nombre-realisations\//) && req.method === 'GET') {
      if (!dbConnected) {
        sendJson(res, { count: 0 });
        return;
      }

      const recetteId = pathname.replace('/api/nombre-realisations/', '');
      const count = await queries.getNombreRealisations(recetteId);
      sendJson(res, { count });
      return;
    }

    // ========== API UPLOAD PHOTOS ==========

    if (pathname === '/api/photos' && req.method === 'POST') {
      const contentType = req.headers['content-type'];

      if (!contentType || !contentType.includes('multipart/form-data')) {
        sendError(res, 'Content-Type doit être multipart/form-data', 400);
        return;
      }

      const boundary = contentType.split('boundary=')[1];
      let body = Buffer.alloc(0);

      req.on('data', chunk => {
        body = Buffer.concat([body, chunk]);
      });

      req.on('end', () => {
        try {
          const bodyStr = body.toString('binary');
          const parts = bodyStr.split(`--${boundary}`);

          let filename = '';
          let fileData = null;
          let recipeName = '';

          for (const part of parts) {
            if (part.includes('Content-Disposition')) {
              const filenameMatch = part.match(/filename="([^"]+)"/);
              if (filenameMatch) {
                filename = filenameMatch[1];
              }

              const nameMatch = part.match(/name="([^"]+)"/);

              if (nameMatch && nameMatch[1] === 'photo') {
                const dataStart = part.indexOf('\r\n\r\n') + 4;
                const dataEnd = part.lastIndexOf('\r\n');
                if (dataStart > 0 && dataEnd > dataStart) {
                  fileData = Buffer.from(part.slice(dataStart, dataEnd), 'binary');
                }
              }

              if (nameMatch && nameMatch[1] === 'recipeName') {
                const dataStart = part.indexOf('\r\n\r\n') + 4;
                const dataEnd = part.lastIndexOf('\r\n');
                if (dataStart > 0 && dataEnd > dataStart) {
                  recipeName = part.slice(dataStart, dataEnd).trim();
                }
              }
            }
          }

          if (recipeName && filename) {
            const ext = path.extname(filename) || '.jpg';
            filename = slugify(recipeName) + ext;
          }

          if (!fileData || !filename) {
            sendError(res, 'Aucun fichier reçu', 400);
            return;
          }

          const filepath = path.join(PHOTOS_DIR, filename);
          fs.writeFile(filepath, fileData, (err) => {
            if (err) {
              console.error('Erreur sauvegarde photo:', err);
              sendError(res, 'Erreur sauvegarde image', 500);
              return;
            }
            sendJson(res, { success: true, filename: filename });
          });
        } catch (e) {
          console.error('Erreur upload:', e);
          sendError(res, 'Erreur traitement upload', 500);
        }
      });
      return;
    }

    // ========== API STATUS (santé) ==========

    if (pathname === '/api/status' && req.method === 'GET') {
      sendJson(res, {
        status: 'ok',
        database: dbConnected ? 'connected' : 'disconnected',
        mode: dbConnected ? 'postgresql' : 'files',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // ========== FICHIERS STATIQUES ==========

    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(__dirname, filePath);

    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404);
          res.end('Fichier non trouvé');
        } else {
          res.writeHead(500);
          res.end('Erreur serveur');
        }
        return;
      }
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(data);
    });

  } catch (error) {
    console.error('Erreur requête:', error);
    sendError(res, error.message || 'Erreur serveur', 500);
  }
}

// Créer le serveur HTTP
const server = http.createServer(handleRequest);

// ============================================
// Démarrage du serveur
// ============================================

async function startServer() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║   🍳 Démarrage du serveur Cuisine PWA...               ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  // Tenter la connexion à PostgreSQL si activé
  if (USE_DATABASE) {
    try {
      dbConnected = await db.checkConnection();

      if (dbConnected) {
        console.log('Mode: PostgreSQL');

        // Exécuter la migration au démarrage
        await runMigration();
      }
    } catch (error) {
      console.log('⚠ PostgreSQL non disponible, mode fichiers activé');
      console.log('  Erreur:', error.message);
      dbConnected = false;
    }
  }

  if (!dbConnected) {
    console.log('Mode: Fichiers JSON');
    console.log('  Pour utiliser PostgreSQL, lancez docker-compose up');
  }

  // Démarrer le serveur HTTP
  server.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║                                                        ║');
    console.log(`║   ✓ Serveur démarré sur http://localhost:${PORT}          ║`);
    console.log('║                                                        ║');
    console.log('║   Dossiers:                                            ║');
    console.log('║   - Photos:      ./photos/                             ║');
    console.log('║   - Recettes:    ./recettes/                           ║');
    console.log('║   - Données:     ./data/                               ║');
    console.log('║                                                        ║');
    console.log(`║   Base de données: ${dbConnected ? 'PostgreSQL ✓' : 'Fichiers JSON'}               ║`);
    console.log('║                                                        ║');
    console.log('║   Appuyez sur Ctrl+C pour arrêter                      ║');
    console.log('║                                                        ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
  });
}

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n\nArrêt du serveur...');
  if (dbConnected) {
    await db.closePool();
  }
  server.close(() => {
    console.log('Serveur arrêté');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\n\nArrêt du serveur...');
  if (dbConnected) {
    await db.closePool();
  }
  server.close(() => {
    console.log('Serveur arrêté');
    process.exit(0);
  });
});

// Démarrer le serveur
startServer();
