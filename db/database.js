/**
 * Module de connexion et gestion PostgreSQL
 * Cuisine PWA
 */

const { Pool } = require('pg');

// Configuration du pool de connexions
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'cuisine_db',
  user: process.env.DB_USER || 'cuisine_user',
  password: process.env.DB_PASSWORD || 'CuisineApp2024!SecureP@ss',
  max: 20,                    // Nombre max de connexions dans le pool
  idleTimeoutMillis: 30000,   // Temps avant fermeture d'une connexion inactive
  connectionTimeoutMillis: 2000, // Timeout de connexion
});

// Gestion des erreurs du pool
pool.on('error', (err) => {
  console.error('Erreur inattendue du pool PostgreSQL:', err);
});

/**
 * Exécute une requête SQL avec des paramètres
 * @param {string} text - Requête SQL
 * @param {Array} params - Paramètres de la requête
 * @returns {Promise<Object>} Résultat de la requête
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log('Requête exécutée:', { text: text.substring(0, 100), duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Erreur SQL:', error.message);
    throw error;
  }
}

/**
 * Obtient un client du pool pour les transactions
 * @returns {Promise<Object>} Client PostgreSQL
 */
async function getClient() {
  const client = await pool.connect();
  const originalRelease = client.release.bind(client);

  // Surcharger release pour gérer les erreurs
  client.release = () => {
    client.release = originalRelease;
    return originalRelease();
  };

  return client;
}

/**
 * Vérifie la connexion à la base de données
 * @returns {Promise<boolean>}
 */
async function checkConnection() {
  try {
    await query('SELECT 1');
    console.log('✓ Connexion PostgreSQL établie');
    return true;
  } catch (error) {
    console.error('✗ Erreur de connexion PostgreSQL:', error.message);
    return false;
  }
}

/**
 * Ferme le pool de connexions
 */
async function closePool() {
  await pool.end();
  console.log('Pool PostgreSQL fermé');
}

module.exports = {
  query,
  getClient,
  checkConnection,
  closePool,
  pool
};
