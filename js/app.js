// === Application de gestion de recettes ===

// Configuration
const API_URL = '';
const PHOTOS_PATH = 'photos/';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop';

// Données
let recettes = [];
let ingredientsBase = [];
let unitesBase = [];
let originesBase = [];
let tagsBase = [];
let planning = {};
let favoris = new Set();
let historiqueCourses = [];
let compteursRealisations = {}; // {recetteId: count}

// État de l'application
const state = {
  currentPage: 'recettes',
  recetteActuelle: null,
  etapeActuelle: 0,
  nombrePersonnes: 4,
  personnesBase: 4,
  vueToutes: false,
  ingredientsSelectionnes: new Set(),
  ingredientsPanelOpen: false,
  photoSelectionnee: null,
  ingredientsRecette: [], // Ingrédients ajoutés au formulaire
  originesRecette: [], // Origines sélectionnées pour le formulaire
  // Liste de courses
  coursesPersonnes: 4,
  recettesSelectionnees: new Set(),
  coursesRecherche: '',
  coursesFiltreType: '',
  coursesFiltreOrigine: '',
  coursesFiltreFavoris: false,
  listeCoursesGeneree: null, // Stocke la liste générée pour sauvegarde
  // Filtres recettes
  filtreFavoris: false,
  filtreOrigine: '',
  // Planning
  semaineActuelle: null, // Date du lundi de la semaine actuelle
  jourSelectionne: null, // Jour sélectionné pour ajouter une recette
  repasSelectionne: null, // 'midi' ou 'soir'
  modalRecetteFiltres: { recherche: '', type: '', origine: '', favoris: false },
  // Historique recettes (suivi de progression)
  recetteEnCours: null, // Données de la recette en cours
  historiqueRecettes: [], // Liste de l'historique
  historiqueFiltre: { statut: '', dateDebut: '', dateFin: '' },
  // Mode réalisation dans la vue détail
  modeRealisation: false, // true = étapes visibles avec checkboxes, false = consultation
  sessionRealisationId: null, // ID de la session en cours dans historique_recettes
  // Feature 3: Ce soir je cuisine avec...
  ceSoirIngredients: new Set(),
  // Feature 5, 6, 7: Statistiques
  statsCalendrierMois: new Date(),
  // Feature 8: Planning mensuel
  vuePlanning: 'semaine', // 'semaine' ou 'mois'
  planningMoisActuel: new Date(),
  // Feature 25: Thèmes
  theme: { mode: 'light', accent: '#e74c3c' },
  // Feature 26: Vue liste/grille
  vueRecettes: 'grille', // 'grille' ou 'liste'
  // Feature 16: Notes
  notesRecetteId: null,
  // Tags et difficulté
  tagsSelectionnes: new Set(),
  editTagsSelectionnes: new Set(),
  filtreTagsSelectionnes: new Set(),
  tagsPanelOpen: false,
  // Dashboard
  dashboardData: null,
  // Notifications
  notificationSettings: null
};

// === Éléments du DOM ===
const elements = {};

function initElements() {
  // Sidebar
  elements.sidebar = document.getElementById('sidebar');
  elements.sidebarOverlay = document.getElementById('sidebar-overlay');
  elements.btnMenu = document.getElementById('btn-menu');
  elements.btnCloseSidebar = document.getElementById('btn-close-sidebar');
  elements.sidebarLinks = document.querySelectorAll('.sidebar-link');
  elements.pageTitle = document.getElementById('page-title');

  // Pages
  elements.pageRecettes = document.getElementById('page-recettes');
  elements.pageDetail = document.getElementById('page-detail');
  elements.pageIngredients = document.getElementById('page-ingredients');
  elements.pageAjout = document.getElementById('page-ajout');

  // Liste des recettes
  elements.recettesGrid = document.getElementById('recettes-grid');
  elements.recherche = document.getElementById('recherche');
  elements.filtreType = document.getElementById('filtre-type');
  elements.filtreTemps = document.getElementById('filtre-temps');
  elements.triRecettes = document.getElementById('tri-recettes');

  // Filtre ingrédients
  elements.btnToggleIngredients = document.getElementById('btn-toggle-ingredients');
  elements.ingredientsFilterPanel = document.getElementById('ingredients-filter-panel');
  elements.ingredientsTags = document.getElementById('ingredients-tags');
  elements.ingredientsSearch = document.getElementById('ingredients-search');
  elements.ingredientsCount = document.getElementById('ingredients-count');
  elements.btnClearIngredients = document.getElementById('btn-clear-ingredients');
  elements.filtreFavoris = document.getElementById('filtre-favoris');
  elements.filtreOrigine = document.getElementById('filtre-origine');

  // Origines dans le formulaire
  elements.originesTags = document.getElementById('origines-tags');

  // Détail de recette
  elements.btnRetour = document.getElementById('btn-retour');
  elements.btnExportPdf = document.getElementById('btn-export-pdf');
  elements.detailImage = document.getElementById('detail-image');
  elements.detailNom = document.getElementById('detail-nom');
  elements.detailPrep = document.getElementById('detail-prep');
  elements.detailCuisson = document.getElementById('detail-cuisson');
  elements.ingredientsListe = document.getElementById('ingredients-liste');
  elements.nbPersonnes = document.getElementById('nb-personnes');
  elements.btnMoins = document.getElementById('btn-moins');
  elements.btnPlus = document.getElementById('btn-plus');

  // Étapes
  elements.btnToggleEtapes = document.getElementById('btn-toggle-etapes');
  elements.etapeNavigation = document.getElementById('etape-navigation');
  elements.etapesListe = document.getElementById('etapes-liste');
  elements.etapeNumero = document.getElementById('etape-numero');
  elements.progressionFill = document.getElementById('progression-fill');
  elements.etapeContenu = document.getElementById('etape-contenu');
  elements.btnPrecedent = document.getElementById('btn-precedent');
  elements.btnSuivant = document.getElementById('btn-suivant');

  // Page ingrédients
  elements.ingredientsManager = document.getElementById('ingredients-manager');
  elements.btnAddCategorie = document.getElementById('btn-add-categorie');

  // Page liste de courses
  elements.pageCourses = document.getElementById('page-courses');
  elements.coursesRecettesListe = document.getElementById('courses-recettes-liste');
  elements.coursesNbPersonnes = document.getElementById('courses-nb-personnes');
  elements.coursesMoins = document.getElementById('courses-moins');
  elements.coursesPlus = document.getElementById('courses-plus');
  elements.btnGenererListe = document.getElementById('btn-generer-liste');
  elements.coursesResultat = document.getElementById('courses-resultat');
  elements.listeCourses = document.getElementById('liste-courses');
  elements.btnCopierListe = document.getElementById('btn-copier-liste');
  elements.btnSauvegarderListe = document.getElementById('btn-sauvegarder-liste');
  elements.coursesRecherche = document.getElementById('courses-recherche');
  elements.coursesFiltreType = document.getElementById('courses-filtre-type');
  elements.coursesFiltreOrigine = document.getElementById('courses-filtre-origine');
  elements.coursesTabs = document.querySelectorAll('.courses-tab');
  elements.tabNouvelle = document.getElementById('tab-nouvelle');
  elements.tabHistorique = document.getElementById('tab-historique');
  elements.historiqueListe = document.getElementById('historique-liste');

  // Formulaire d'ajout
  elements.formRecette = document.getElementById('form-recette');
  elements.selectCategorie = document.getElementById('select-categorie');
  elements.selectIngredient = document.getElementById('select-ingredient');
  elements.inputQuantite = document.getElementById('input-quantite');
  elements.selectCategorieUnite = document.getElementById('select-categorie-unite');
  elements.selectUnite = document.getElementById('select-unite');
  elements.btnAddIngredientSelect = document.getElementById('btn-add-ingredient-select');
  elements.ingredientsRecetteListe = document.getElementById('ingredients-recette-liste');
  elements.etapesInputs = document.getElementById('etapes-inputs');
  elements.btnAddEtape = document.getElementById('btn-add-etape');
  elements.btnCancelForm = document.getElementById('btn-cancel-form');
  elements.inputPhoto = document.getElementById('input-photo');
  elements.photoPreview = document.getElementById('photo-preview');
  elements.photoPreviewImg = document.getElementById('photo-preview-img');
  elements.btnRemovePhoto = document.getElementById('btn-remove-photo');

  // Modal recette aléatoire
  elements.btnRecetteAleatoire = document.getElementById('btn-recette-aleatoire');
  elements.modalAleatoire = document.getElementById('modal-aleatoire');
  elements.btnCloseModalAleatoire = document.getElementById('btn-close-modal-aleatoire');
  elements.btnsAleatoireType = document.querySelectorAll('.btn-aleatoire-type');
  elements.btnMenuAleatoireComplet = document.getElementById('btn-menu-aleatoire-complet');
  elements.modalMenuComplet = document.getElementById('modal-menu-complet');
  elements.btnCloseModalMenu = document.getElementById('btn-close-modal-menu');
  elements.menuCompletResultat = document.getElementById('menu-complet-resultat');
  elements.btnRegénérerMenu = document.getElementById('btn-regenerer-menu');

  // Planning
  elements.pagePlanning = document.getElementById('page-planning');
  elements.planningCalendrier = document.getElementById('planning-calendrier');
  elements.planningPeriode = document.getElementById('planning-periode');
  elements.btnSemainePrecedente = document.getElementById('btn-semaine-precedente');
  elements.btnSemaineSuivante = document.getElementById('btn-semaine-suivante');
  elements.btnGenererCoursesSemaine = document.getElementById('btn-generer-courses-semaine');

  // Modal sélection recette
  elements.modalSelectRecette = document.getElementById('modal-select-recette');
  elements.btnCloseModalSelect = document.getElementById('btn-close-modal-select');
  elements.modalRecherche = document.getElementById('modal-recherche');
  elements.modalFiltreType = document.getElementById('modal-filtre-type');
  elements.modalFiltreOrigine = document.getElementById('modal-filtre-origine');
  elements.modalFiltreFavoris = document.getElementById('modal-filtre-favoris');
  elements.modalRecettesListe = document.getElementById('modal-recettes-liste');

  // Pages Administration
  elements.pageAdminRecettes = document.getElementById('page-admin-recettes');
  elements.pageAdminIngredients = document.getElementById('page-admin-ingredients');
  elements.pageAdminUnites = document.getElementById('page-admin-unites');
  elements.adminRecettesRecherche = document.getElementById('admin-recettes-recherche');
  elements.adminRecettesListe = document.getElementById('admin-recettes-liste');
  elements.adminIngredientsManager = document.getElementById('admin-ingredients-manager');
  elements.adminUnitesManager = document.getElementById('admin-unites-manager');
  elements.btnAdminAddCategorieIng = document.getElementById('btn-admin-add-categorie-ing');
  elements.btnAdminAddCategorieUnite = document.getElementById('btn-admin-add-categorie-unite');

  // Modals Administration
  elements.modalEditRecette = document.getElementById('modal-edit-recette');
  elements.btnCloseModalEdit = document.getElementById('btn-close-modal-edit');
  elements.formEditRecette = document.getElementById('form-edit-recette');
  elements.btnCancelEdit = document.getElementById('btn-cancel-edit');

  elements.modalConfirmDelete = document.getElementById('modal-confirm-delete');
  elements.btnCloseModalDelete = document.getElementById('btn-close-modal-delete');
  elements.btnCancelDelete = document.getElementById('btn-cancel-delete');
  elements.btnConfirmDelete = document.getElementById('btn-confirm-delete');
  elements.modalDeleteMessage = document.getElementById('modal-delete-message');

  elements.modalEditIngredient = document.getElementById('modal-edit-ingredient');
  elements.btnCloseModalIngredient = document.getElementById('btn-close-modal-ingredient');
  elements.formEditIngredient = document.getElementById('form-edit-ingredient');
  elements.btnCancelIngredient = document.getElementById('btn-cancel-ingredient');

  elements.modalEditCategorieIng = document.getElementById('modal-edit-categorie-ing');
  elements.btnCloseModalCategorieIng = document.getElementById('btn-close-modal-categorie-ing');
  elements.formEditCategorieIng = document.getElementById('form-edit-categorie-ing');
  elements.btnCancelCategorieIng = document.getElementById('btn-cancel-categorie-ing');

  elements.modalEditUnite = document.getElementById('modal-edit-unite');
  elements.btnCloseModalUnite = document.getElementById('btn-close-modal-unite');
  elements.formEditUnite = document.getElementById('form-edit-unite');
  elements.btnCancelUnite = document.getElementById('btn-cancel-unite');

  elements.modalEditCategorieUnite = document.getElementById('modal-edit-categorie-unite');
  elements.btnCloseModalCategorieUnite = document.getElementById('btn-close-modal-categorie-unite');
  elements.formEditCategorieUnite = document.getElementById('form-edit-categorie-unite');
  elements.btnCancelCategorieUnite = document.getElementById('btn-cancel-categorie-unite');

  // Boutons vue détail recette
  elements.btnModifierRecette = document.getElementById('btn-modifier-recette');
  elements.btnCoursesRecette = document.getElementById('btn-courses-recette');

  // Modal liste de courses pour une recette
  elements.modalCoursesRecette = document.getElementById('modal-courses-recette');
  elements.btnCloseModalCoursesRecette = document.getElementById('btn-close-modal-courses-recette');
  elements.modalCoursesNbPersonnes = document.getElementById('modal-courses-nb-personnes');
  elements.modalCoursesMoins = document.getElementById('modal-courses-moins');
  elements.modalCoursesPlus = document.getElementById('modal-courses-plus');
  elements.modalCoursesListe = document.getElementById('modal-courses-liste');
  elements.btnCopierCoursesRecette = document.getElementById('btn-copier-courses-recette');

  // Filtre favoris dans courses
  elements.coursesFiltreFavoris = document.getElementById('courses-filtre-favoris');

  // Bouton démarrer recette
  elements.btnDemarrerRecette = document.getElementById('btn-demarrer-recette');

  // Menu reprendre
  elements.menuReprendreContainer = document.getElementById('menu-reprendre-container');
  elements.btnReprendreRecette = document.getElementById('btn-reprendre-recette');

  // Page historique recettes
  elements.pageHistoriqueRecettes = document.getElementById('page-historique-recettes');
  elements.historiqueRecettesStats = document.getElementById('historique-stats');
  elements.historiqueRecettesListe = document.getElementById('historique-recettes-liste');
  elements.historiqueRecettesEmpty = document.getElementById('historique-recettes-empty');
  elements.historiqueFiltreStatut = document.getElementById('historique-filtre-statut');
  elements.historiqueDateDebut = document.getElementById('historique-date-debut');
  elements.historiqueDateFin = document.getElementById('historique-date-fin');
  elements.btnHistoriqueFiltrer = document.getElementById('btn-historique-filtrer');

  // Page recette en cours
  elements.pageRecetteEnCours = document.getElementById('page-recette-en-cours');
  elements.btnRetourRecetteEnCours = document.getElementById('btn-retour-recette-en-cours');
  elements.btnTerminerRecette = document.getElementById('btn-terminer-recette');
  elements.enCoursImage = document.getElementById('en-cours-image');
  elements.enCoursNom = document.getElementById('en-cours-nom');
  elements.enCoursDateDebut = document.getElementById('en-cours-date-debut');
  elements.enCoursPersonnes = document.getElementById('en-cours-personnes');
  elements.enCoursProgressionText = document.getElementById('en-cours-progression-text');
  elements.enCoursProgressionFill = document.getElementById('en-cours-progression-fill');
  elements.enCoursIngredients = document.getElementById('en-cours-ingredients');
  elements.enCoursEtapes = document.getElementById('en-cours-etapes');

  // Boutons mode consultation/réalisation dans vue détail
  elements.btnReprendreDetail = document.getElementById('btn-reprendre-detail');
  elements.btnArreterRealisation = document.getElementById('btn-arreter-realisation');
  elements.etapesSection = document.getElementById('etapes-section');

  // Feature 3: Ce soir je cuisine avec...
  elements.btnCeSoir = document.getElementById('btn-ce-soir');
  elements.modalCeSoir = document.getElementById('modal-ce-soir');
  elements.btnCloseModalCeSoir = document.getElementById('btn-close-modal-ce-soir');
  elements.ceSoirRecherche = document.getElementById('ce-soir-recherche');
  elements.ceSoirIngredients = document.getElementById('ce-soir-ingredients');
  elements.ceSoirCount = document.getElementById('ce-soir-count');
  elements.btnCeSoirClear = document.getElementById('btn-ce-soir-clear');
  elements.btnCeSoirChercher = document.getElementById('btn-ce-soir-chercher');
  elements.ceSoirResultats = document.getElementById('ce-soir-resultats');
  elements.ceSoirListe = document.getElementById('ce-soir-liste');

  // Feature 5, 6, 7: Statistiques
  elements.pageStatistiques = document.getElementById('page-statistiques');
  elements.badgeProgression = document.getElementById('badge-progression');
  elements.statsTotalRecettes = document.getElementById('stats-total-recettes');
  elements.statsTempsTotal = document.getElementById('stats-temps-total');
  elements.statsCeMois = document.getElementById('stats-ce-mois');
  elements.statsFavoris = document.getElementById('stats-favoris');
  elements.statsTopRecettes = document.getElementById('stats-top-recettes');
  elements.statsParType = document.getElementById('stats-par-type');
  elements.statsParOrigine = document.getElementById('stats-par-origine');
  elements.calendrierMoisTitre = document.getElementById('calendrier-mois-titre');
  elements.btnCalendrierMoisPrec = document.getElementById('btn-calendrier-mois-prec');
  elements.btnCalendrierMoisSuiv = document.getElementById('btn-calendrier-mois-suiv');
  elements.calendrierRealisations = document.getElementById('calendrier-realisations');
  elements.progressionBadgeFill = document.getElementById('progression-badge-fill');

  // Feature 8: Planning mensuel
  elements.btnVueSemaine = document.getElementById('btn-vue-semaine');
  elements.btnVueMois = document.getElementById('btn-vue-mois');
  elements.planningMensuel = document.getElementById('planning-mensuel');
  elements.planningMensuelGrille = document.getElementById('planning-mensuel-grille');

  // Feature 10: Tags détail
  elements.detailTags = document.getElementById('detail-tags');

  // Filtres difficulté et tags
  elements.filtreDifficulte = document.getElementById('filtre-difficulte');
  elements.btnToggleTags = document.getElementById('btn-toggle-tags');
  elements.tagsFilterPanel = document.getElementById('tags-filter-panel');
  elements.tagsFilterChips = document.getElementById('tags-filter-chips');
  elements.tagsFilterSearch = document.getElementById('tags-filter-search');
  elements.tagsFilterCount = document.getElementById('tags-filter-count');
  elements.btnClearTags = document.getElementById('btn-clear-tags');

  // Dashboard
  elements.pageDashboard = document.getElementById('page-dashboard');
  elements.dashboardContainer = document.getElementById('dashboard-container');
  elements.suggestionContenu = document.getElementById('suggestion-contenu');
  elements.planningJourContenu = document.getElementById('planning-jour-contenu');
  elements.recentesContenu = document.getElementById('recentes-contenu');
  elements.favorisDashboardContenu = document.getElementById('favoris-dashboard-contenu');
  elements.btnRefreshSuggestion = document.getElementById('btn-refresh-suggestion');

  // Notifications
  elements.pageNotifications = document.getElementById('page-notifications');
  elements.notifTimer = document.getElementById('notif-timer');
  elements.notifRappelRepas = document.getElementById('notif-rappel-repas');
  elements.notifHeureRappel = document.getElementById('notif-heure-rappel');
  elements.notifPermissionStatus = document.getElementById('notif-permission-status');
  elements.btnDemanderNotif = document.getElementById('btn-demander-notif');
  elements.btnSauverNotifications = document.getElementById('btn-sauver-notifications');

  // Équilibre nutritionnel
  elements.equilibreNutritionnel = document.getElementById('equilibre-nutritionnel');
  elements.btnToggleEquilibre = document.getElementById('btn-toggle-equilibre');
  elements.equilibreContenu = document.getElementById('equilibre-contenu');
  elements.equilibreBarres = document.getElementById('equilibre-barres');
  elements.equilibreAlertes = document.getElementById('equilibre-alertes');

  // Feature 16: Notes
  elements.btnNotesRecette = document.getElementById('btn-notes-recette');
  elements.modalNotes = document.getElementById('modal-notes');
  elements.btnCloseModalNotes = document.getElementById('btn-close-modal-notes');
  elements.notesHistorique = document.getElementById('notes-historique');
  elements.inputNouvelleNote = document.getElementById('input-nouvelle-note');
  elements.btnAjouterNote = document.getElementById('btn-ajouter-note');

  // Feature 25: Thèmes
  elements.btnTheme = document.getElementById('btn-theme');
  elements.modalThemes = document.getElementById('modal-themes');
  elements.btnCloseModalThemes = document.getElementById('btn-close-modal-themes');

  // Feature 26: Vue liste/grille
  elements.btnVueGrille = document.getElementById('btn-vue-grille');
  elements.btnVueListe = document.getElementById('btn-vue-liste');

  // Feature 28: Conversion
  elements.btnConversion = document.getElementById('btn-conversion');
  elements.modalConversion = document.getElementById('modal-conversion');
  elements.btnCloseModalConversion = document.getElementById('btn-close-modal-conversion');
  elements.conversionValeur = document.getElementById('conversion-valeur');
  elements.conversionUniteSource = document.getElementById('conversion-unite-source');
  elements.conversionUniteCible = document.getElementById('conversion-unite-cible');
  elements.conversionResultat = document.getElementById('conversion-resultat');
}

// === Fonctions API ===

async function chargerRecettes() {
  try {
    const response = await fetch(`${API_URL}/api/recettes`);
    if (!response.ok) throw new Error('Erreur chargement recettes');
    recettes = await response.json();
    return recettes;
  } catch (error) {
    console.error('Erreur chargement recettes:', error);
    recettes = [];
    return [];
  }
}

async function chargerIngredients() {
  try {
    const response = await fetch(`${API_URL}/api/ingredients`);
    if (!response.ok) throw new Error('Erreur chargement ingrédients');
    ingredientsBase = await response.json();
    return ingredientsBase;
  } catch (error) {
    console.error('Erreur chargement ingrédients:', error);
    ingredientsBase = [];
    return [];
  }
}

async function chargerFavoris() {
  try {
    const response = await fetch(`${API_URL}/api/favoris`);
    if (!response.ok) throw new Error('Erreur chargement favoris');
    const data = await response.json();
    favoris = new Set(data);
    return favoris;
  } catch (error) {
    console.error('Erreur chargement favoris:', error);
    favoris = new Set();
    return favoris;
  }
}

async function sauvegarderFavoris() {
  try {
    const response = await fetch(`${API_URL}/api/favoris`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Array.from(favoris))
    });
    if (!response.ok) throw new Error('Erreur sauvegarde favoris');
    return await response.json();
  } catch (error) {
    console.error('Erreur sauvegarde favoris:', error);
    throw error;
  }
}

async function chargerHistoriqueCourses() {
  try {
    const response = await fetch(`${API_URL}/api/historique-courses`);
    if (!response.ok) throw new Error('Erreur chargement historique');
    historiqueCourses = await response.json();
    return historiqueCourses;
  } catch (error) {
    console.error('Erreur chargement historique:', error);
    historiqueCourses = [];
    return [];
  }
}

async function chargerUnites() {
  try {
    const response = await fetch(`${API_URL}/api/unites`);
    if (!response.ok) throw new Error('Erreur chargement unités');
    unitesBase = await response.json();
    return unitesBase;
  } catch (error) {
    console.error('Erreur chargement unités:', error);
    unitesBase = [];
    return [];
  }
}

async function chargerOrigines() {
  try {
    const response = await fetch(`${API_URL}/api/origines`);
    if (!response.ok) throw new Error('Erreur chargement origines');
    originesBase = await response.json();
    return originesBase;
  } catch (error) {
    console.error('Erreur chargement origines:', error);
    originesBase = [];
    return [];
  }
}

async function chargerTags() {
  try {
    const response = await fetch(`${API_URL}/api/tags`);
    if (!response.ok) throw new Error('Erreur chargement tags');
    tagsBase = await response.json();
    return tagsBase;
  } catch (error) {
    console.error('Erreur chargement tags:', error);
    tagsBase = [];
    return [];
  }
}

async function chargerPlanning() {
  try {
    const response = await fetch(`${API_URL}/api/planning`);
    if (!response.ok) throw new Error('Erreur chargement planning');
    planning = await response.json();
    return planning;
  } catch (error) {
    console.error('Erreur chargement planning:', error);
    planning = {};
    return {};
  }
}

async function sauvegarderPlanning() {
  try {
    const response = await fetch(`${API_URL}/api/planning`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planning)
    });
    if (!response.ok) throw new Error('Erreur sauvegarde planning');
    return await response.json();
  } catch (error) {
    console.error('Erreur sauvegarde planning:', error);
    throw error;
  }
}

async function sauvegarderHistoriqueCourses() {
  try {
    const response = await fetch(`${API_URL}/api/historique-courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(historiqueCourses)
    });
    if (!response.ok) throw new Error('Erreur sauvegarde historique');
    return await response.json();
  } catch (error) {
    console.error('Erreur sauvegarde historique:', error);
    throw error;
  }
}

async function sauvegarderIngredients() {
  try {
    const response = await fetch(`${API_URL}/api/ingredients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ingredientsBase)
    });
    if (!response.ok) throw new Error('Erreur sauvegarde ingrédients');
    return await response.json();
  } catch (error) {
    console.error('Erreur sauvegarde ingrédients:', error);
    throw error;
  }
}

async function sauvegarderRecette(recette) {
  try {
    const response = await fetch(`${API_URL}/api/recettes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recette)
    });
    if (!response.ok) throw new Error('Erreur sauvegarde recette');
    return await response.json();
  } catch (error) {
    console.error('Erreur sauvegarde recette:', error);
    throw error;
  }
}

async function uploadPhoto(file, recipeName) {
  try {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('recipeName', recipeName);

    const response = await fetch(`${API_URL}/api/photos`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Erreur upload photo');
    return await response.json();
  } catch (error) {
    console.error('Erreur upload photo:', error);
    throw error;
  }
}

// === Fonctions utilitaires ===

function formatTemps(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const heures = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${heures}h${mins}` : `${heures}h`;
}

function formatQuantite(quantite, unite) {
  const qty = Math.round(quantite * 100) / 100;
  const qtyStr = qty % 1 === 0 ? qty.toString() : qty.toFixed(2).replace(/\.?0+$/, '');

  if (!unite) {
    return qtyStr;
  }
  return `${qtyStr} ${unite}`;
}

function getTypeLabel(type) {
  const labels = {
    entree: 'Entrée',
    plat: 'Plat',
    dessert: 'Dessert'
  };
  return labels[type] || type;
}

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

function getImageUrl(image) {
  if (!image) return DEFAULT_IMAGE;
  if (image.startsWith('http')) return image;
  return `${PHOTOS_PATH}${image}`;
}

function normaliserIngredient(nom) {
  return nom.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// === Navigation Sidebar ===

function toggleSidebar(open) {
  if (open) {
    elements.sidebar.classList.add('open');
    elements.sidebarOverlay.classList.add('active');
  } else {
    elements.sidebar.classList.remove('open');
    elements.sidebarOverlay.classList.remove('active');
  }
}

function navigateToPage(pageName, garderPresélectionsCourses = false) {
  state.currentPage = pageName;

  // Cacher toutes les pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  // Mettre à jour les liens actifs
  elements.sidebarLinks.forEach(link => {
    link.classList.remove('active');
    if (link.dataset.page === pageName) {
      link.classList.add('active');
    }
  });

  // Afficher la page correspondante
  const pageTitles = {
    dashboard: 'Accueil',
    recettes: 'Mes Recettes',
    ingredients: 'Ingrédients',
    ajout: 'Nouvelle Recette',
    detail: 'Détail Recette',
    courses: 'Liste de courses',
    planning: 'Planning semaine',
    'admin-recettes': 'Gestion Recettes',
    'admin-ingredients': 'Gestion Ingrédients',
    'admin-unites': 'Gestion Unités',
    'historique-recettes': 'Historique',
    'recette-en-cours': 'Recette en cours',
    'statistiques': 'Statistiques',
    'notifications': 'Notifications'
  };

  elements.pageTitle.textContent = pageTitles[pageName] || 'Mes Recettes';

  switch (pageName) {
    case 'dashboard':
      elements.pageDashboard.classList.add('active');
      chargerDashboard();
      break;
    case 'recettes':
      elements.pageRecettes.classList.add('active');
      afficherRecettes();
      break;
    case 'ingredients':
      elements.pageIngredients.classList.add('active');
      afficherPageIngredients();
      break;
    case 'ajout':
      elements.pageAjout.classList.add('active');
      initialiserFormulaire();
      break;
    case 'detail':
      elements.pageDetail.classList.add('active');
      break;
    case 'courses':
      elements.pageCourses.classList.add('active');
      afficherPageCourses(garderPresélectionsCourses);
      break;
    case 'planning':
      elements.pagePlanning.classList.add('active');
      afficherPagePlanning();
      break;
    case 'admin-recettes':
      elements.pageAdminRecettes.classList.add('active');
      afficherAdminRecettes();
      break;
    case 'admin-ingredients':
      elements.pageAdminIngredients.classList.add('active');
      afficherAdminIngredients();
      break;
    case 'admin-unites':
      elements.pageAdminUnites.classList.add('active');
      afficherAdminUnites();
      break;
    case 'historique-recettes':
      elements.pageHistoriqueRecettes.classList.add('active');
      chargerHistoriqueRecettes().then(() => afficherHistoriqueRecettes());
      break;
    case 'recette-en-cours':
      elements.pageRecetteEnCours.classList.add('active');
      break;
    case 'statistiques':
      elements.pageStatistiques.classList.add('active');
      afficherPageStatistiques();
      break;
    case 'notifications':
      elements.pageNotifications.classList.add('active');
      chargerPageNotifications();
      break;
  }

  // Fermer le sidebar sur mobile
  toggleSidebar(false);
  window.scrollTo(0, 0);
}

// === Liste des recettes ===

function extraireIngredientsUniques() {
  const ingredientsMap = new Map();

  recettes.forEach(recette => {
    recette.ingredients.forEach(ing => {
      const normalise = normaliserIngredient(ing.nom);
      if (!ingredientsMap.has(normalise)) {
        ingredientsMap.set(normalise, ing.nom);
      }
    });
  });

  return Array.from(ingredientsMap.values()).sort((a, b) =>
    a.localeCompare(b, 'fr', { sensitivity: 'base' })
  );
}

function afficherRecettes(recettesFiltered = recettes, matchInfo = null) {
  if (recettesFiltered.length === 0) {
    elements.recettesGrid.innerHTML = `
      <div class="no-results">
        <svg viewBox="0 0 24 24">
          <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <p>Aucune recette ne correspond à votre recherche</p>
      </div>
    `;
    return;
  }

  elements.recettesGrid.innerHTML = recettesFiltered.map(recette => {
    let matchHtml = '';
    if (matchInfo && matchInfo.has(recette.id)) {
      const info = matchInfo.get(recette.id);
      const isComplete = info.matched === info.total;
      matchHtml = `
        <div class="match-info">
          <span class="match-badge ${isComplete ? '' : 'partial'}">${info.matched}/${info.total} ingrédients</span>
        </div>
      `;
    }

    const imageUrl = getImageUrl(recette.image);
    const isFavori = favoris.has(recette.id);
    const origines = recette.origines || [];
    const origineHtml = origines.length > 0 ?
      `<span class="recette-card-origines">${origines.slice(0, 2).join(', ')}${origines.length > 2 ? '...' : ''}</span>` : '';

    // Compteur de réalisations
    const nbRealisations = getCompteurRealisations(recette.id);
    const compteurHtml = nbRealisations > 0 ? `
      <div class="compteur-realisations">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>
        <span>Réalisée ${nbRealisations} fois</span>
      </div>
    ` : '';

    // Tags spéciaux (Feature 10)
    const tagsHtml = genererTagsCarteRecette(recette);

    // Difficulté
    const difficulteHtml = recette.niveauDifficulte ? `<span class="difficulte-badge difficulte-${recette.niveauDifficulte.toLowerCase()}">${getDifficulteLabel(recette.niveauDifficulte)}</span>` : '';

    return `
      <article class="recette-card" data-id="${recette.id}" tabindex="0" role="button" aria-label="Voir la recette ${recette.nom}">
        <button class="recette-card-favoris ${isFavori ? 'active' : ''}" data-id="${recette.id}" aria-label="${isFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        </button>
        <img src="${imageUrl}" alt="${recette.nom}" loading="lazy" onerror="this.src='${DEFAULT_IMAGE}'">
        <div class="recette-card-content">
          <h3>${recette.nom}</h3>
          ${origineHtml}
          ${matchHtml}
          ${compteurHtml}
          ${tagsHtml}
          <div class="recette-card-meta">
            <span>
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
              ${formatTemps(recette.tempsPreparation + recette.tempsCuisson)}
            </span>
            <span>
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              ${recette.personnes} pers.
            </span>
            <span class="type-badge">${getTypeLabel(recette.type)}</span>
            ${difficulteHtml}
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Event listeners pour les cartes
  document.querySelectorAll('.recette-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Ne pas naviguer si on clique sur le bouton favori
      if (e.target.closest('.recette-card-favoris')) return;
      const id = card.dataset.id;
      afficherDetailRecette(id);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = card.dataset.id;
        afficherDetailRecette(id);
      }
    });
  });

  // Event listeners pour les boutons favoris
  document.querySelectorAll('.recette-card-favoris').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      await toggleFavori(id);
      btn.classList.toggle('active');
    });
  });
}

async function toggleFavori(recetteId) {
  if (favoris.has(recetteId)) {
    favoris.delete(recetteId);
  } else {
    favoris.add(recetteId);
  }
  await sauvegarderFavoris();
}

// === Filtre par ingrédients ===

function afficherTagsIngredients(filtre = '') {
  const tousIngredients = extraireIngredientsUniques();
  const filtreNormalise = normaliserIngredient(filtre);

  const ingredientsFiltres = filtre
    ? tousIngredients.filter(ing => normaliserIngredient(ing).includes(filtreNormalise))
    : tousIngredients;

  elements.ingredientsTags.innerHTML = ingredientsFiltres.map(ing => {
    const normalise = normaliserIngredient(ing);
    const isSelected = state.ingredientsSelectionnes.has(normalise);
    return `
      <span class="ingredient-tag ${isSelected ? 'selected' : ''}" data-ingredient="${normalise}">
        ${ing}
      </span>
    `;
  }).join('');

  document.querySelectorAll('.ingredient-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const ingredient = tag.dataset.ingredient;
      if (state.ingredientsSelectionnes.has(ingredient)) {
        state.ingredientsSelectionnes.delete(ingredient);
        tag.classList.remove('selected');
      } else {
        state.ingredientsSelectionnes.add(ingredient);
        tag.classList.add('selected');
      }
      mettreAJourCompteurIngredients();
      filtrerRecettes();
    });
  });
}

function mettreAJourCompteurIngredients() {
  const count = state.ingredientsSelectionnes.size;
  elements.ingredientsCount.textContent = `${count} ingrédient${count > 1 ? 's' : ''} sélectionné${count > 1 ? 's' : ''}`;
}

// === Filtrage des recettes ===

function filtrerRecettes() {
  const recherche = elements.recherche.value.toLowerCase().trim();
  const typeFiltre = elements.filtreType.value;
  const tempsFiltre = elements.filtreTemps.value;
  const origineFiltre = state.filtreOrigine;
  const ingredientsSelectionnes = state.ingredientsSelectionnes;
  const difficulteFiltre = elements.filtreDifficulte ? elements.filtreDifficulte.value : '';
  const tagsFiltre = Array.from(state.filtreTagsSelectionnes);

  const matchInfo = new Map();

  let recettesFiltrees = recettes.filter(recette => {
    // Filtre favoris
    if (state.filtreFavoris && !favoris.has(recette.id)) {
      return false;
    }

    const matchNom = recette.nom.toLowerCase().includes(recherche);
    const matchType = !typeFiltre || recette.type === typeFiltre;

    // Filtre par origine
    let matchOrigine = true;
    if (origineFiltre) {
      const originesRecette = recette.origines || [];
      matchOrigine = originesRecette.includes(origineFiltre);
    }

    const tempsTotal = recette.tempsPreparation + recette.tempsCuisson;
    let matchTemps = true;
    if (tempsFiltre === '30') {
      matchTemps = tempsTotal < 30;
    } else if (tempsFiltre === '60') {
      matchTemps = tempsTotal < 60;
    } else if (tempsFiltre === '61') {
      matchTemps = tempsTotal >= 60;
    }

    // Filtre par difficulté
    let matchDifficulte = true;
    if (difficulteFiltre) {
      matchDifficulte = recette.niveauDifficulte === difficulteFiltre;
    }

    // Filtre par tags
    let matchTags = true;
    if (tagsFiltre.length > 0) {
      const recetteTags = (recette.tags || []).map(t => t.id);
      matchTags = tagsFiltre.every(tagId => recetteTags.includes(tagId));
    }

    let matchIngredients = true;
    if (ingredientsSelectionnes.size > 0) {
      const ingredientsRecette = recette.ingredients.map(ing => normaliserIngredient(ing.nom));

      // Logique ET : la recette doit contenir TOUS les ingrédients sélectionnés
      const ingredientsMatchés = Array.from(ingredientsSelectionnes).filter(ing =>
        ingredientsRecette.includes(ing)
      ).length;

      matchInfo.set(recette.id, {
        matched: ingredientsMatchés,
        total: ingredientsSelectionnes.size
      });

      // Vérifier que TOUS les ingrédients sélectionnés sont présents
      matchIngredients = ingredientsMatchés === ingredientsSelectionnes.size;
    }

    return matchNom && matchType && matchTemps && matchOrigine && matchIngredients && matchDifficulte && matchTags;
  });

  // Trier par nombre total d'ingrédients si filtre par ingrédients actif
  if (ingredientsSelectionnes.size > 0) {
    recettesFiltrees.sort((a, b) => {
      return a.ingredients.length - b.ingredients.length;
    });
  }

  // Appliquer le tri sélectionné
  const tri = elements.triRecettes.value;
  if (tri) {
    recettesFiltrees.sort((a, b) => {
      switch (tri) {
        case 'nom':
          return a.nom.localeCompare(b.nom, 'fr');
        case 'type':
          return (a.type || '').localeCompare(b.type || '', 'fr');
        case 'origine':
          const origA = (a.origines && a.origines[0]) || '';
          const origB = (b.origines && b.origines[0]) || '';
          return origA.localeCompare(origB, 'fr');
        case 'realisations':
          const countA = getCompteurRealisations(a.id);
          const countB = getCompteurRealisations(b.id);
          return countB - countA; // Décroissant : les plus réalisées en premier
        case 'temps':
          const tempsA = (a.tempsPreparation || 0) + (a.tempsCuisson || 0);
          const tempsB = (b.tempsPreparation || 0) + (b.tempsCuisson || 0);
          return tempsA - tempsB; // Croissant : les plus rapides en premier
        case 'difficulte':
          const niveaux = { 'Facile': 1, 'Moyen': 2, 'Difficile': 3 };
          return (niveaux[a.niveauDifficulte] || 0) - (niveaux[b.niveauDifficulte] || 0);
        default:
          return 0;
      }
    });
  }

  afficherRecettes(recettesFiltrees, ingredientsSelectionnes.size > 0 ? matchInfo : null);
}

// === Détail d'une recette ===

async function afficherDetailRecette(id) {
  const recette = recettes.find(r => r.id === id);
  if (!recette) return;

  state.recetteActuelle = recette;
  state.nombrePersonnes = recette.personnes;
  state.personnesBase = recette.personnes;
  state.etapeActuelle = 0;
  state.vueToutes = false;
  state.modeRealisation = false; // Par défaut, mode consultation
  state.sessionRealisationId = null;

  const imageUrl = getImageUrl(recette.image);
  elements.detailImage.src = imageUrl;
  elements.detailImage.alt = recette.nom;
  elements.detailImage.onerror = function () { this.src = DEFAULT_IMAGE; };
  elements.detailNom.textContent = recette.nom;
  elements.detailPrep.textContent = formatTemps(recette.tempsPreparation);
  elements.detailCuisson.textContent = formatTemps(recette.tempsCuisson);
  elements.nbPersonnes.textContent = state.nombrePersonnes;

  afficherIngredients();
  afficherEtapes();
  afficherTagsRecette(recette);
  afficherDifficulteDetail(recette);

  // Mode consultation par défaut : masquer les étapes
  basculerModeConsultation();

  // Vérifier s'il y a une session en cours pour cette recette
  await verifierSessionEnCoursPourRecette(recette.id);

  elements.pageTitle.textContent = recette.nom;
  navigateToPage('detail');
}

// Vérifier s'il existe une session de réalisation en cours pour cette recette
async function verifierSessionEnCoursPourRecette(recetteId) {
  try {
    const response = await fetch(`${API_URL}/api/recette-en-cours`);
    if (!response.ok) {
      // PostgreSQL non disponible : garder "Démarrer" visible
      // Le clic affichera un message expliquant qu'il faut PostgreSQL
      elements.btnDemarrerRecette.classList.remove('hidden');
      elements.btnReprendreDetail.classList.add('hidden');
      return;
    }

    const sessionEnCours = await response.json();

    if (sessionEnCours && sessionEnCours.recetteId === recetteId) {
      // Il y a une session en cours pour cette recette : afficher "Reprendre"
      state.sessionRealisationId = sessionEnCours.id;
      state.recetteEnCours = sessionEnCours;
      elements.btnDemarrerRecette.classList.add('hidden');
      elements.btnReprendreDetail.classList.remove('hidden');
    } else {
      // Pas de session pour cette recette : afficher "Démarrer"
      elements.btnDemarrerRecette.classList.remove('hidden');
      elements.btnReprendreDetail.classList.add('hidden');
    }
  } catch (error) {
    console.warn('Erreur vérification session:', error);
    // En cas d'erreur réseau, afficher le bouton Démarrer par défaut
    elements.btnDemarrerRecette.classList.remove('hidden');
    elements.btnReprendreDetail.classList.add('hidden');
  }
}

// Basculer en mode consultation (étapes masquées)
function basculerModeConsultation() {
  state.modeRealisation = false;

  // Masquer la section étapes
  elements.etapesSection.classList.add('hidden');

  // Masquer le bouton Arrêter
  elements.btnArreterRealisation.classList.add('hidden');

  // Toujours afficher "Démarrer" par défaut en mode consultation
  // verifierSessionEnCoursPourRecette() ajustera ensuite si une session existe
  elements.btnDemarrerRecette.classList.remove('hidden');
  elements.btnReprendreDetail.classList.add('hidden');
}

// Basculer en mode réalisation (étapes visibles)
function basculerModeRealisation() {
  state.modeRealisation = true;

  // Afficher la section étapes
  elements.etapesSection.classList.remove('hidden');

  // Configurer la vue des étapes
  elements.etapeNavigation.classList.remove('hidden');
  elements.etapesListe.classList.add('hidden');
  elements.btnToggleEtapes.textContent = 'Voir toutes les étapes';

  // Masquer Démarrer/Reprendre, afficher Terminer
  elements.btnDemarrerRecette.classList.add('hidden');
  elements.btnReprendreDetail.classList.add('hidden');
  elements.btnArreterRealisation.classList.remove('hidden');

  // Feature 35 : Reprendre à la bonne étape (dernière validée + 1)
  if (state.recetteEnCours && state.recetteEnCours.progressionEtapes) {
    const etapes = state.recetteEnCours.progressionEtapes.etapes || [];
    const totalEtapes = state.recetteActuelle ? state.recetteActuelle.etapes.length : 0;

    // Trouver la dernière étape validée
    let derniereValidee = -1;
    for (let i = etapes.length - 1; i >= 0; i--) {
      if (etapes[i] && etapes[i].validee) {
        derniereValidee = i;
        break;
      }
    }

    if (derniereValidee >= 0 && derniereValidee < totalEtapes - 1) {
      // Reprendre à l'étape suivante de la dernière validée
      state.etapeActuelle = derniereValidee + 1;
    } else if (derniereValidee >= totalEtapes - 1) {
      // Toutes validées : afficher la dernière
      state.etapeActuelle = totalEtapes - 1;
    } else {
      // Aucune validée : commencer à la première
      state.etapeActuelle = 0;
    }

    mettreAJourEtapeActuelle();
  }
}

// Valider une étape dans la progression et sauvegarder
async function validerEtapeProgression(etapeIndex) {
  if (!state.recetteEnCours) {
    // Créer une structure de progression locale
    state.recetteEnCours = state.recetteEnCours || {};
    if (!state.recetteEnCours.progressionEtapes) {
      state.recetteEnCours.progressionEtapes = { etapes: [] };
    }
  }

  const progression = state.recetteEnCours.progressionEtapes;

  // S'assurer que le tableau est assez grand
  while (progression.etapes.length <= etapeIndex) {
    progression.etapes.push({ validee: false });
  }

  // Marquer comme validée
  progression.etapes[etapeIndex].validee = true;

  // Sauvegarder côté serveur
  if (state.sessionRealisationId) {
    try {
      await fetch(`${API_URL}/api/progression-recette`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          historiqueId: state.sessionRealisationId,
          progressionEtapes: progression
        })
      });
    } catch (error) {
      console.error('Erreur sauvegarde progression:', error);
    }
  }
}

function afficherIngredients() {
  const recette = state.recetteActuelle;
  const ratio = state.nombrePersonnes / state.personnesBase;

  elements.ingredientsListe.innerHTML = recette.ingredients.map(ing => {
    const quantiteAjustee = ing.quantite * ratio;
    return `
      <li>
        <span class="ingredient-nom">${ing.nom}</span>
        <span class="ingredient-quantite">${formatQuantite(quantiteAjustee, ing.unite)}</span>
      </li>
    `;
  }).join('');
}

function afficherEtapes() {
  const recette = state.recetteActuelle;

  elements.etapesListe.innerHTML = recette.etapes.map((etape, index) => {
    const etapeData = typeof etape === 'object' ? etape : { texte: etape, duree: null };
    const texte = etapeData.texte || etape;
    const duree = etapeData.duree; // Utiliser uniquement la durée configurée, pas la détection automatique

    if (duree) {
      return `
        <li class="etape-avec-timer">
          <div class="etape-texte">${texte}</div>
          <div class="etape-timer-container etape-timer-centered">
            <button type="button" class="btn-timer btn-timer-etape" onclick="demarrerTimer('${recette.id}', ${index}, ${duree})">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.962 8.962 0 0012 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
              </svg>
              Démarrer le timer (${duree} min)
            </button>
          </div>
        </li>
      `;
    }
    return `<li>${texte}</li>`;
  }).join('');

  mettreAJourEtapeActuelle();
}

function detecterDureeEtape(texte) {
  // Détecter les durées mentionnées dans le texte
  const patterns = [
    /(\d+)\s*(?:minute|min|mn)/i,
    /pendant\s*(\d+)\s*(?:minute|min|mn)/i,
    /(\d+)\s*(?:heure|h)/i,
    /environ\s*(\d+)\s*(?:minute|min|mn)/i
  ];

  for (const pattern of patterns) {
    const match = texte.match(pattern);
    if (match) {
      let duree = parseInt(match[1]);
      // Si c'est en heures, convertir en minutes
      if (/heure|h/i.test(match[0])) {
        duree *= 60;
      }
      return duree;
    }
  }
  return null;
}

function mettreAJourEtapeActuelle() {
  const recette = state.recetteActuelle;
  const totalEtapes = recette.etapes.length;
  const etapeIndex = state.etapeActuelle;

  elements.etapeNumero.textContent = `Étape ${etapeIndex + 1}/${totalEtapes}`;
  const progression = ((etapeIndex + 1) / totalEtapes) * 100;
  elements.progressionFill.style.width = `${progression}%`;

  const etape = recette.etapes[etapeIndex];
  const etapeData = typeof etape === 'object' ? etape : { texte: etape, duree: null };
  const texteEtape = etapeData.texte || etape;
  const duree = etapeData.duree; // Utiliser uniquement la durée configurée

  if (duree) {
    elements.etapeContenu.innerHTML = `
      <div class="etape-texte-nav">${texteEtape}</div>
      <div class="etape-timer-nav-container">
        <button type="button" class="btn-timer btn-timer-nav" onclick="demarrerTimer('${recette.id}', ${etapeIndex}, ${duree})">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.962 8.962 0 0012 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
          </svg>
          Démarrer le timer (${duree} min)
        </button>
      </div>
    `;
  } else {
    elements.etapeContenu.textContent = texteEtape;
  }

  elements.btnPrecedent.disabled = etapeIndex === 0;
  elements.btnSuivant.disabled = etapeIndex === totalEtapes - 1;

  if (etape === totalEtapes - 1) {
    elements.btnSuivant.innerHTML = `
      Terminé
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
    `;
  } else {
    elements.btnSuivant.innerHTML = `
      Suivant
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
      </svg>
    `;
  }
}

// === Page gestion des ingrédients ===

function afficherPageIngredients() {
  elements.ingredientsManager.innerHTML = ingredientsBase.map((cat, catIndex) => `
    <div class="categorie-card" data-cat-index="${catIndex}">
      <div class="categorie-header">
        <h3>${cat.categorie}</h3>
        <div class="categorie-actions">
          <button class="btn-icon btn-delete-cat" title="Supprimer la catégorie">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="categorie-body">
        <div class="ingredients-list">
          ${cat.items.map((item, itemIndex) => `
            <span class="ingredient-chip" data-item-index="${itemIndex}">
              ${item}
              <button class="btn-remove-chip" title="Supprimer">
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </span>
          `).join('')}
        </div>
        <form class="add-ingredient-form">
          <input type="text" placeholder="Nouvel ingrédient..." required>
          <button type="submit">Ajouter</button>
        </form>
      </div>
    </div>
  `).join('');

  // Event listeners pour les catégories
  document.querySelectorAll('.categorie-card').forEach(card => {
    const catIndex = parseInt(card.dataset.catIndex);

    // Supprimer catégorie
    card.querySelector('.btn-delete-cat').addEventListener('click', async () => {
      if (confirm('Supprimer cette catégorie et tous ses ingrédients ?')) {
        ingredientsBase.splice(catIndex, 1);
        await sauvegarderIngredients();
        afficherPageIngredients();
      }
    });

    // Supprimer ingrédient
    card.querySelectorAll('.btn-remove-chip').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const itemIndex = parseInt(btn.closest('.ingredient-chip').dataset.itemIndex);
        ingredientsBase[catIndex].items.splice(itemIndex, 1);
        await sauvegarderIngredients();
        afficherPageIngredients();
      });
    });

    // Ajouter ingrédient
    card.querySelector('.add-ingredient-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = e.target.querySelector('input');
      const nom = input.value.trim();
      if (nom) {
        ingredientsBase[catIndex].items.push(nom);
        ingredientsBase[catIndex].items.sort((a, b) => a.localeCompare(b, 'fr'));
        await sauvegarderIngredients();
        afficherPageIngredients();
      }
    });
  });
}

function ajouterCategorie() {
  const nom = prompt('Nom de la nouvelle catégorie :');
  if (nom && nom.trim()) {
    ingredientsBase.push({
      categorie: nom.trim(),
      items: []
    });
    sauvegarderIngredients().then(() => {
      afficherPageIngredients();
    });
  }
}

// === Page Liste de courses ===

function afficherPageCourses(garderPresélections = false) {
  if (!garderPresélections) {
    state.recettesSelectionnees.clear();
  }
  state.coursesRecherche = '';
  state.coursesFiltreType = '';
  state.coursesFiltreOrigine = '';
  state.listeCoursesGeneree = null;
  elements.coursesResultat.classList.add('hidden');
  elements.coursesNbPersonnes.textContent = state.coursesPersonnes;
  elements.coursesRecherche.value = '';
  elements.coursesFiltreType.value = '';
  elements.coursesFiltreOrigine.value = '';

  afficherRecettesCourses();
  afficherHistoriqueCourses();
}

function afficherRecettesCourses() {
  const recherche = state.coursesRecherche.toLowerCase();
  const typeFiltre = state.coursesFiltreType;
  const origineFiltre = state.coursesFiltreOrigine;
  const favorisOnly = state.coursesFiltreFavoris;

  const recettesFiltrees = recettes.filter(recette => {
    const matchNom = recette.nom.toLowerCase().includes(recherche);
    const matchType = !typeFiltre || recette.type === typeFiltre;
    const originesRecette = recette.origines || [];
    const matchOrigine = !origineFiltre || originesRecette.includes(origineFiltre);
    const matchFavoris = !favorisOnly || favoris.has(recette.id);
    return matchNom && matchType && matchOrigine && matchFavoris;
  });

  elements.coursesRecettesListe.innerHTML = recettesFiltrees.map(recette => {
    const isChecked = state.recettesSelectionnees.has(recette.id);
    const isFavori = favoris.has(recette.id);
    return `
      <label class="courses-recette-item">
        <input type="checkbox" data-id="${recette.id}" ${isChecked ? 'checked' : ''}>
        <div class="courses-recette-info">
          <span class="courses-recette-nom">
            ${isFavori ? '<svg viewBox="0 0 24 24" width="14" height="14" style="color: var(--color-warning); vertical-align: middle; margin-right: 4px;"><path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>' : ''}
            ${recette.nom}
          </span>
          <span class="courses-recette-meta">${getTypeLabel(recette.type)} • ${recette.personnes} pers. • ${formatTemps(recette.tempsPreparation + recette.tempsCuisson)}</span>
        </div>
      </label>
    `;
  }).join('');

  if (recettesFiltrees.length === 0) {
    elements.coursesRecettesListe.innerHTML = '<p class="no-results">Aucune recette trouvée</p>';
  }

  // Event listeners pour les checkboxes
  elements.coursesRecettesListe.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const id = checkbox.dataset.id;
      if (checkbox.checked) {
        state.recettesSelectionnees.add(id);
      } else {
        state.recettesSelectionnees.delete(id);
      }
    });
  });
}

function trouverCategorieIngredient(nomIngredient) {
  const nomNormalise = normaliserIngredient(nomIngredient);

  for (const cat of ingredientsBase) {
    for (const item of cat.items) {
      if (normaliserIngredient(item) === nomNormalise) {
        return cat.categorie;
      }
    }
  }
  return 'Autres';
}

function genererListeCourses() {
  if (state.recettesSelectionnees.size === 0) {
    alert('Veuillez sélectionner au moins une recette.');
    return;
  }

  // Agréger les ingrédients de toutes les recettes sélectionnées
  const ingredientsAgregés = new Map();

  state.recettesSelectionnees.forEach(recetteId => {
    const recette = recettes.find(r => r.id === recetteId);
    if (!recette) return;

    // Calculer le ratio pour ajuster les quantités
    const ratio = state.coursesPersonnes / recette.personnes;

    recette.ingredients.forEach(ing => {
      const key = `${normaliserIngredient(ing.nom)}_${ing.unite || ''}`;
      const quantiteAjustee = ing.quantite * ratio;

      if (ingredientsAgregés.has(key)) {
        const existing = ingredientsAgregés.get(key);
        existing.quantite += quantiteAjustee;
      } else {
        ingredientsAgregés.set(key, {
          nom: ing.nom,
          quantite: quantiteAjustee,
          unite: ing.unite || '',
          categorie: trouverCategorieIngredient(ing.nom)
        });
      }
    });
  });

  // Arrondir les quantités à l'entier supérieur et organiser par catégorie
  const listeParCategorie = {};

  ingredientsAgregés.forEach(ing => {
    const quantiteArrondie = Math.ceil(ing.quantite);
    const categorie = ing.categorie;

    if (!listeParCategorie[categorie]) {
      listeParCategorie[categorie] = [];
    }

    listeParCategorie[categorie].push({
      nom: ing.nom,
      quantite: quantiteArrondie,
      unite: ing.unite
    });
  });

  // Trier les ingrédients dans chaque catégorie
  Object.keys(listeParCategorie).forEach(cat => {
    listeParCategorie[cat].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  });

  // Stocker pour sauvegarde
  state.listeCoursesGeneree = {
    date: new Date().toISOString(),
    personnes: state.coursesPersonnes,
    recettes: Array.from(state.recettesSelectionnees).map(id => {
      const r = recettes.find(rec => rec.id === id);
      return r ? r.nom : id;
    }),
    liste: listeParCategorie
  };

  // Afficher la liste par catégories
  const categoriesOrdonnees = Object.keys(listeParCategorie).sort((a, b) => {
    // Mettre "Autres" à la fin
    if (a === 'Autres') return 1;
    if (b === 'Autres') return -1;
    return a.localeCompare(b, 'fr');
  });

  elements.listeCourses.innerHTML = categoriesOrdonnees.map(categorie => {
    const items = listeParCategorie[categorie];
    return `
      <div class="liste-courses-categorie">
        <div class="liste-courses-categorie-titre">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05l-5 2V1h-1.97v6.05l-4.03-2L10 9.31V1H8.03v8.31L4 5.05l1.66 16.48c.1.82.79 1.46 1.63 1.46h1.66l.1-2.23c.02-.66.58-1.22 1.28-1.22h6.34c.7 0 1.26.56 1.28 1.22l.11 2.23z"/>
          </svg>
          ${categorie}
        </div>
        <ul class="liste-courses-items">
          ${items.map(ing => {
            const qtyStr = ing.quantite > 0 ? `${ing.quantite}${ing.unite ? ' ' + ing.unite : ''}` : '';
            return `<li><span class="ingredient-nom">${ing.nom}</span> ${qtyStr ? `<span class="ingredient-quantite">- ${qtyStr}</span>` : ''}</li>`;
          }).join('')}
        </ul>
      </div>
    `;
  }).join('');

  elements.coursesResultat.classList.remove('hidden');
}

async function sauvegarderListeCourses() {
  if (!state.listeCoursesGeneree) {
    alert('Veuillez d\'abord générer une liste de courses.');
    return;
  }

  // Ajouter la liste à l'historique
  historiqueCourses.unshift(state.listeCoursesGeneree);

  // Limiter l'historique à 20 entrées
  if (historiqueCourses.length > 20) {
    historiqueCourses = historiqueCourses.slice(0, 20);
  }

  await sauvegarderHistoriqueCourses();

  // Notification
  const toast = document.createElement('div');
  toast.className = 'copie-success';
  toast.textContent = 'Liste sauvegardée !';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);

  afficherHistoriqueCourses();
}

function afficherHistoriqueCourses() {
  if (historiqueCourses.length === 0) {
    elements.historiqueListe.innerHTML = '<p class="historique-vide">Aucune liste sauvegardée</p>';
    return;
  }

  elements.historiqueListe.innerHTML = historiqueCourses.map((liste, index) => {
    const date = new Date(liste.date);
    const dateStr = date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div class="historique-item" data-index="${index}">
        <div class="historique-item-info">
          <span class="historique-item-date">${dateStr}</span>
          <span class="historique-item-recettes">${liste.recettes.join(', ')} (${liste.personnes} pers.)</span>
        </div>
        <div class="historique-item-actions">
          <button class="btn-voir-liste" data-index="${index}">Voir</button>
          <button class="btn-supprimer-liste" data-index="${index}">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Event listeners
  elements.historiqueListe.querySelectorAll('.btn-voir-liste').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      afficherListeHistorique(index);
    });
  });

  elements.historiqueListe.querySelectorAll('.btn-supprimer-liste').forEach(btn => {
    btn.addEventListener('click', async () => {
      const index = parseInt(btn.dataset.index);
      if (confirm('Supprimer cette liste de courses ?')) {
        historiqueCourses.splice(index, 1);
        await sauvegarderHistoriqueCourses();
        afficherHistoriqueCourses();
      }
    });
  });
}

function afficherListeHistorique(index) {
  const liste = historiqueCourses[index];
  if (!liste) return;

  // Changer vers l'onglet nouvelle liste pour afficher
  elements.coursesTabs.forEach(tab => tab.classList.remove('active'));
  document.querySelector('.courses-tab[data-tab="nouvelle"]').classList.add('active');
  elements.tabNouvelle.classList.add('active');
  elements.tabHistorique.classList.remove('active');

  state.listeCoursesGeneree = liste;

  // Afficher la liste
  const categoriesOrdonnees = Object.keys(liste.liste).sort((a, b) => {
    if (a === 'Autres') return 1;
    if (b === 'Autres') return -1;
    return a.localeCompare(b, 'fr');
  });

  elements.listeCourses.innerHTML = categoriesOrdonnees.map(categorie => {
    const items = liste.liste[categorie];
    return `
      <div class="liste-courses-categorie">
        <div class="liste-courses-categorie-titre">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05l-5 2V1h-1.97v6.05l-4.03-2L10 9.31V1H8.03v8.31L4 5.05l1.66 16.48c.1.82.79 1.46 1.63 1.46h1.66l.1-2.23c.02-.66.58-1.22 1.28-1.22h6.34c.7 0 1.26.56 1.28 1.22l.11 2.23z"/>
          </svg>
          ${categorie}
        </div>
        <ul class="liste-courses-items">
          ${items.map(ing => {
            const qtyStr = ing.quantite > 0 ? `${ing.quantite}${ing.unite ? ' ' + ing.unite : ''}` : '';
            return `<li><span class="ingredient-nom">${ing.nom}</span> ${qtyStr ? `<span class="ingredient-quantite">- ${qtyStr}</span>` : ''}</li>`;
          }).join('')}
        </ul>
      </div>
    `;
  }).join('');

  elements.coursesResultat.classList.remove('hidden');
}

// === Fonctions Recette Aléatoire ===

function ouvrirModalAleatoire() {
  elements.modalAleatoire.classList.add('active');
}

function fermerModalAleatoire() {
  elements.modalAleatoire.classList.remove('active');
}

function selectionnerRecetteAleatoire(type) {
  // Filtrer les recettes par type si spécifié
  let recettesFiltrees = recettes;
  if (type) {
    recettesFiltrees = recettes.filter(r => r.type === type);
  }

  if (recettesFiltrees.length === 0) {
    alert('Aucune recette disponible pour ce type.');
    return;
  }

  // Sélectionner une recette au hasard
  const indexAleatoire = Math.floor(Math.random() * recettesFiltrees.length);
  const recetteChoisie = recettesFiltrees[indexAleatoire];

  // Fermer la modal et afficher la recette
  fermerModalAleatoire();
  afficherDetailRecette(recetteChoisie.id);
}

function genererMenuAleatoireComplet() {
  // Obtenir une recette de chaque type
  const entrees = recettes.filter(r => r.type === 'entree');
  const plats = recettes.filter(r => r.type === 'plat');
  const desserts = recettes.filter(r => r.type === 'dessert');

  const menu = {
    entree: entrees.length > 0 ? entrees[Math.floor(Math.random() * entrees.length)] : null,
    plat: plats.length > 0 ? plats[Math.floor(Math.random() * plats.length)] : null,
    dessert: desserts.length > 0 ? desserts[Math.floor(Math.random() * desserts.length)] : null
  };

  afficherMenuComplet(menu);
}

function afficherMenuComplet(menu) {
  fermerModalAleatoire();
  elements.modalMenuComplet.classList.add('active');

  const typeInfo = {
    entree: { emoji: '🥗', label: 'Entrée' },
    plat: { emoji: '🍝', label: 'Plat' },
    dessert: { emoji: '🍰', label: 'Dessert' }
  };

  let html = '';

  ['entree', 'plat', 'dessert'].forEach(type => {
    const recette = menu[type];
    const info = typeInfo[type];

    if (recette) {
      html += `
        <div class="menu-item" data-id="${recette.id}">
          <div class="menu-item-type">
            <span class="type-emoji">${info.emoji}</span>
            <span class="type-label">${info.label}</span>
          </div>
          <div class="menu-item-info">
            <div class="menu-item-nom">${recette.nom}</div>
            <div class="menu-item-meta">
              ${formatTemps(recette.tempsPreparation + recette.tempsCuisson)} • ${recette.personnes} pers.
            </div>
          </div>
          <div class="menu-item-arrow">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="menu-item menu-item-vide">
          <div class="menu-item-type">
            <span class="type-emoji">${info.emoji}</span>
            <span class="type-label">${info.label}</span>
          </div>
          <div class="menu-item-info">
            <div class="menu-item-nom" style="color: var(--color-text-light);">Aucune recette disponible</div>
          </div>
        </div>
      `;
    }
  });

  elements.menuCompletResultat.innerHTML = html;

  // Event listeners pour les items du menu
  elements.menuCompletResultat.querySelectorAll('.menu-item[data-id]').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      fermerModalMenuComplet();
      afficherDetailRecette(id);
    });
  });
}

function fermerModalMenuComplet() {
  elements.modalMenuComplet.classList.remove('active');
}

// === Fonctions Planning ===

function getLundiSemaine(date) {
  const d = new Date(date);
  const jour = d.getDay();
  const diff = d.getDate() - jour + (jour === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDateKey(date) {
  return date.toISOString().split('T')[0];
}

function formatDateAffichage(date) {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

function initialiserPlanning() {
  if (!state.semaineActuelle) {
    state.semaineActuelle = getLundiSemaine(new Date());
  }
}

function afficherPagePlanning() {
  initialiserPlanning();
  afficherCalendrier();
  // Charger l'équilibre nutritionnel si la section est visible
  if (elements.equilibreContenu && !elements.equilibreContenu.classList.contains('hidden')) {
    chargerEquilibreNutritionnel();
  }
}

function afficherCalendrier() {
  const lundi = state.semaineActuelle;
  const dimanche = new Date(lundi);
  dimanche.setDate(dimanche.getDate() + 6);

  // Afficher la période
  const moisLundi = lundi.toLocaleDateString('fr-FR', { month: 'long' });
  const moisDimanche = dimanche.toLocaleDateString('fr-FR', { month: 'long' });
  const annee = lundi.getFullYear();

  if (moisLundi === moisDimanche) {
    elements.planningPeriode.textContent = `${lundi.getDate()} - ${dimanche.getDate()} ${moisLundi} ${annee}`;
  } else {
    elements.planningPeriode.textContent = `${lundi.getDate()} ${moisLundi} - ${dimanche.getDate()} ${moisDimanche} ${annee}`;
  }

  // Générer le calendrier
  const joursNoms = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  let html = '';

  for (let i = 0; i < 7; i++) {
    const jour = new Date(lundi);
    jour.setDate(jour.getDate() + i);
    const dateKey = formatDateKey(jour);
    const repas = planning[dateKey] || { midi: null, soir: null };
    const isToday = formatDateKey(new Date()) === dateKey;

    html += `
      <div class="planning-jour ${isToday ? 'today' : ''}">
        <div class="planning-jour-header">
          <span class="planning-jour-nom">${joursNoms[i]}</span>
          <span class="planning-jour-date">${jour.getDate()}</span>
        </div>
        <div class="planning-repas">
          <div class="planning-repas-slot" data-date="${dateKey}" data-repas="midi">
            <span class="repas-label">Midi</span>
            ${genererContenuRepas(repas.midi, dateKey, 'midi')}
          </div>
          <div class="planning-repas-slot" data-date="${dateKey}" data-repas="soir">
            <span class="repas-label">Soir</span>
            ${genererContenuRepas(repas.soir, dateKey, 'soir')}
          </div>
        </div>
      </div>
    `;
  }

  elements.planningCalendrier.innerHTML = html;

  // Event listeners
  document.querySelectorAll('.btn-add-repas').forEach(btn => {
    btn.addEventListener('click', () => {
      const date = btn.dataset.date;
      const repas = btn.dataset.repas;
      ouvrirModalSelectRecette(date, repas);
    });
  });

  document.querySelectorAll('.btn-remove-repas').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const date = btn.dataset.date;
      const repas = btn.dataset.repas;
      await supprimerRepas(date, repas);
    });
  });

  document.querySelectorAll('.planning-recette').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      afficherDetailRecette(id);
    });
  });
}

function genererContenuRepas(repasData, dateKey, repasType) {
  if (!repasData) {
    return `
      <button type="button" class="btn-add-repas" data-date="${dateKey}" data-repas="${repasType}">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>
    `;
  }

  const recette = recettes.find(r => r.id === repasData.recetteId);
  if (!recette) {
    return `
      <button type="button" class="btn-add-repas" data-date="${dateKey}" data-repas="${repasType}">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>
    `;
  }

  return `
    <div class="planning-recette" data-id="${recette.id}">
      <span class="planning-recette-nom">${recette.nom}</span>
      <span class="planning-recette-type type-badge-mini">${getTypeLabel(recette.type)}</span>
      <button type="button" class="btn-remove-repas" data-date="${dateKey}" data-repas="${repasType}">
        <svg viewBox="0 0 24 24" width="14" height="14">
          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  `;
}

function changerSemaine(direction) {
  const nouvelleSemaine = new Date(state.semaineActuelle);
  nouvelleSemaine.setDate(nouvelleSemaine.getDate() + (direction * 7));
  state.semaineActuelle = nouvelleSemaine;
  afficherCalendrier();
}

function ouvrirModalSelectRecette(date, repas) {
  state.jourSelectionne = date;
  state.repasSelectionne = repas;
  state.modalRecetteFiltres = { recherche: '', type: '', origine: '', favoris: false };

  // Remplir le filtre origine de la modal
  let optionsOrigine = '<option value="">Toutes origines</option>';
  originesBase.forEach(origine => {
    optionsOrigine += `<option value="${origine}">${origine}</option>`;
  });
  elements.modalFiltreOrigine.innerHTML = optionsOrigine;

  // Reset les filtres
  elements.modalRecherche.value = '';
  elements.modalFiltreType.value = '';
  elements.modalFiltreOrigine.value = '';
  elements.modalFiltreFavoris.classList.remove('active');

  afficherRecettesModal();
  elements.modalSelectRecette.classList.add('active');
}

function fermerModalSelectRecette() {
  elements.modalSelectRecette.classList.remove('active');
  state.jourSelectionne = null;
  state.repasSelectionne = null;
}

function afficherRecettesModal() {
  const { recherche, type, origine, favoris: filtreFav } = state.modalRecetteFiltres;

  const recettesFiltrees = recettes.filter(recette => {
    const matchNom = recette.nom.toLowerCase().includes(recherche.toLowerCase());
    const matchType = !type || recette.type === type;
    const originesRecette = recette.origines || [];
    const matchOrigine = !origine || originesRecette.includes(origine);
    const matchFav = !filtreFav || favoris.has(recette.id);
    return matchNom && matchType && matchOrigine && matchFav;
  });

  if (recettesFiltrees.length === 0) {
    elements.modalRecettesListe.innerHTML = '<p class="no-results">Aucune recette trouvée</p>';
    return;
  }

  elements.modalRecettesListe.innerHTML = recettesFiltrees.map(recette => {
    const isFav = favoris.has(recette.id);
    return `
      <div class="modal-recette-item" data-id="${recette.id}">
        <div class="modal-recette-info">
          ${isFav ? '<svg class="fav-icon" viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>' : ''}
          <span class="modal-recette-nom">${recette.nom}</span>
          <span class="modal-recette-meta">${getTypeLabel(recette.type)} • ${formatTemps(recette.tempsPreparation + recette.tempsCuisson)}</span>
        </div>
        <svg class="modal-recette-arrow" viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
        </svg>
      </div>
    `;
  }).join('');

  // Event listeners
  elements.modalRecettesListe.querySelectorAll('.modal-recette-item').forEach(item => {
    item.addEventListener('click', () => {
      const recetteId = item.dataset.id;
      ajouterRepasPlanifie(state.jourSelectionne, state.repasSelectionne, recetteId);
    });
  });
}

async function ajouterRepasPlanifie(date, repas, recetteId) {
  if (!planning[date]) {
    planning[date] = { midi: null, soir: null };
  }
  planning[date][repas] = { recetteId };

  try {
    await sauvegarderPlanning();
  } catch (error) {
    console.error('Erreur sauvegarde planning:', error);
    alert('Erreur lors de la sauvegarde du planning');
  }
  fermerModalSelectRecette();
  afficherCalendrier();
}

async function supprimerRepas(date, repas) {
  if (planning[date]) {
    planning[date][repas] = null;
    try {
      await sauvegarderPlanning();
    } catch (error) {
      console.error('Erreur suppression repas:', error);
      alert('Erreur lors de la suppression du repas');
    }
    afficherCalendrier();
  }
}

function genererListeCoursesSemaine() {
  // Collecter toutes les recettes de la semaine
  const recettesIds = new Set();
  const lundi = state.semaineActuelle;

  for (let i = 0; i < 7; i++) {
    const jour = new Date(lundi);
    jour.setDate(jour.getDate() + i);
    const dateKey = formatDateKey(jour);
    const repasJour = planning[dateKey];

    if (repasJour) {
      if (repasJour.midi?.recetteId) recettesIds.add(repasJour.midi.recetteId);
      if (repasJour.soir?.recetteId) recettesIds.add(repasJour.soir.recetteId);
    }
  }

  if (recettesIds.size === 0) {
    alert('Aucune recette planifiée cette semaine.');
    return;
  }

  // Préparer les recettes présélectionnées AVANT la navigation
  state.recettesSelectionnees = recettesIds;

  // Naviguer vers la page courses avec le flag pour garder les présélections
  navigateToPage('courses', true);

  // Déclencher la génération après un court délai
  setTimeout(() => {
    genererListeCourses();
  }, 100);
}

// === Fonction Export PDF ===

function exporterRecettePDF() {
  const recette = state.recetteActuelle;
  if (!recette) return;

  const imageUrl = getImageUrl(recette.image);
  const origines = recette.origines || [];
  const originesStr = origines.length > 0 ? origines.join(', ') : '';

  // Créer le contenu HTML pour le PDF
  const printContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>${recette.nom} - Recette</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #2c3e50;
          padding: 2cm;
        }
        .header {
          display: flex;
          gap: 2rem;
          margin-bottom: 2rem;
          page-break-inside: avoid;
        }
        .header-image {
          width: 200px;
          height: 150px;
          object-fit: cover;
          border-radius: 12px;
        }
        .header-info {
          flex: 1;
        }
        h1 {
          font-size: 1.75rem;
          color: #e74c3c;
          margin-bottom: 0.5rem;
        }
        .meta {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 0.5rem;
          color: #7f8c8d;
          font-size: 0.9rem;
        }
        .origines {
          font-style: italic;
          color: #7f8c8d;
          font-size: 0.9rem;
        }
        .type-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: #e74c3c;
          color: white;
          border-radius: 20px;
          font-size: 0.85rem;
          margin-top: 0.5rem;
        }
        .section {
          margin-bottom: 1.5rem;
          page-break-inside: avoid;
        }
        .section h2 {
          font-size: 1.25rem;
          color: #2c3e50;
          border-bottom: 2px solid #e74c3c;
          padding-bottom: 0.5rem;
          margin-bottom: 1rem;
        }
        .ingredients-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }
        .ingredient {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #eee;
        }
        .ingredient-nom {
          font-weight: 500;
        }
        .ingredient-qte {
          color: #7f8c8d;
        }
        .etapes {
          counter-reset: etape;
        }
        .etape {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          page-break-inside: avoid;
        }
        .etape-num {
          width: 2rem;
          height: 2rem;
          background: #e74c3c;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.9rem;
          flex-shrink: 0;
        }
        .etape-text {
          flex: 1;
          padding-top: 0.25rem;
        }
        .footer {
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #ddd;
          text-align: center;
          color: #7f8c8d;
          font-size: 0.8rem;
        }
        @media print {
          body {
            padding: 1cm;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${imageUrl}" alt="${recette.nom}" class="header-image" onerror="this.style.display='none'">
        <div class="header-info">
          <h1>${recette.nom}</h1>
          <div class="meta">
            <span>⏱️ Préparation : ${formatTemps(recette.tempsPreparation)}</span>
            <span>🍳 Cuisson : ${formatTemps(recette.tempsCuisson)}</span>
            <span>👥 ${recette.personnes} personnes</span>
          </div>
          ${originesStr ? `<p class="origines">🌍 ${originesStr}</p>` : ''}
          <span class="type-badge">${getTypeLabel(recette.type)}</span>
        </div>
      </div>

      <div class="section">
        <h2>Ingrédients</h2>
        <div class="ingredients-grid">
          ${recette.ingredients.map(ing => `
            <div class="ingredient">
              <span class="ingredient-nom">${ing.nom}</span>
              <span class="ingredient-qte">${formatQuantite(ing.quantite, ing.unite)}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="section">
        <h2>Préparation</h2>
        <div class="etapes">
          ${recette.etapes.map((etape, index) => `
            <div class="etape">
              <span class="etape-num">${index + 1}</span>
              <p class="etape-text">${etape}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="footer">
        <p>Recette générée depuis Mes Recettes de Cuisine</p>
      </div>
    </body>
    </html>
  `;

  // Ouvrir une nouvelle fenêtre pour l'impression
  const printWindow = window.open('', '_blank');
  printWindow.document.write(printContent);
  printWindow.document.close();

  // Attendre le chargement de l'image puis imprimer
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
}

function copierListeCourses() {
  const categories = elements.listeCourses.querySelectorAll('.liste-courses-categorie');
  let texte = '';

  categories.forEach(cat => {
    const titre = cat.querySelector('.liste-courses-categorie-titre')?.textContent?.trim() || '';
    const items = cat.querySelectorAll('.liste-courses-items li');

    texte += `\n=== ${titre} ===\n`;
    items.forEach(li => {
      const nom = li.querySelector('.ingredient-nom')?.textContent || '';
      const qte = li.querySelector('.ingredient-quantite')?.textContent || '';
      texte += `• ${nom} ${qte}\n`.trim() + '\n';
    });
  });

  navigator.clipboard.writeText(texte.trim()).then(() => {
    const toast = document.createElement('div');
    toast.className = 'copie-success';
    toast.textContent = 'Liste copiée !';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }).catch(err => {
    alert('Erreur lors de la copie : ' + err.message);
  });
}

// === Formulaire d'ajout de recette ===

function remplirSelectCategories() {
  let options = '<option value="">Choisir une catégorie...</option>';

  ingredientsBase.forEach((cat, index) => {
    options += `<option value="${index}">${cat.categorie}</option>`;
  });

  elements.selectCategorie.innerHTML = options;
  elements.selectIngredient.innerHTML = '<option value="">Choisir un ingrédient...</option>';
  elements.selectIngredient.disabled = true;
}

function remplirSelectIngredients(categorieIndex) {
  if (categorieIndex === '' || categorieIndex === null) {
    elements.selectIngredient.innerHTML = '<option value="">Choisir un ingrédient...</option>';
    elements.selectIngredient.disabled = true;
    return;
  }

  const cat = ingredientsBase[parseInt(categorieIndex)];
  if (!cat) return;

  let options = '<option value="">Choisir un ingrédient...</option>';
  cat.items.forEach(item => {
    options += `<option value="${item}">${item}</option>`;
  });

  elements.selectIngredient.innerHTML = options;
  elements.selectIngredient.disabled = false;
}

function remplirSelectCategoriesUnites() {
  let options = '<option value="">Catégorie...</option>';

  unitesBase.forEach((cat, index) => {
    options += `<option value="${index}">${cat.categorie}</option>`;
  });

  elements.selectCategorieUnite.innerHTML = options;
  elements.selectUnite.innerHTML = '<option value="">Unité...</option>';
  elements.selectUnite.disabled = true;
}

function remplirSelectUnites(categorieIndex) {
  if (categorieIndex === '' || categorieIndex === null) {
    elements.selectUnite.innerHTML = '<option value="">Unité...</option>';
    elements.selectUnite.disabled = true;
    return;
  }

  const cat = unitesBase[parseInt(categorieIndex)];
  if (!cat) return;

  let options = '<option value="">Unité...</option>';
  cat.unites.forEach(unite => {
    options += `<option value="${unite}">${unite}</option>`;
  });

  elements.selectUnite.innerHTML = options;
  elements.selectUnite.disabled = false;
}

function getOriginesUtilisees() {
  // Collecter toutes les origines effectivement présentes dans les recettes
  const originesSet = new Set();
  recettes.forEach(recette => {
    const originesRecette = recette.origines || [];
    originesRecette.forEach(origine => originesSet.add(origine));
  });
  // Trier alphabétiquement
  return Array.from(originesSet).sort((a, b) => a.localeCompare(b, 'fr'));
}

function remplirFiltreOrigines() {
  // Obtenir seulement les origines effectivement utilisées dans les recettes
  const originesUtilisees = getOriginesUtilisees();

  // Remplir le filtre de la liste des recettes
  let options = '<option value="">Toutes les origines</option>';
  originesUtilisees.forEach(origine => {
    options += `<option value="${origine}">${origine}</option>`;
  });
  elements.filtreOrigine.innerHTML = options;

  // Remplir aussi le filtre de la page courses
  elements.coursesFiltreOrigine.innerHTML = options;
}

function afficherOriginesTags() {
  elements.originesTags.innerHTML = originesBase.map(origine => {
    const isSelected = state.originesRecette.includes(origine);
    return `
      <span class="origine-tag ${isSelected ? 'selected' : ''}" data-origine="${origine}">
        ${origine}
      </span>
    `;
  }).join('');

  // Event listeners
  elements.originesTags.querySelectorAll('.origine-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const origine = tag.dataset.origine;
      if (state.originesRecette.includes(origine)) {
        state.originesRecette = state.originesRecette.filter(o => o !== origine);
        tag.classList.remove('selected');
      } else {
        state.originesRecette.push(origine);
        tag.classList.add('selected');
      }
    });
  });
}

function initialiserFormulaire() {
  elements.formRecette.reset();
  state.ingredientsRecette = [];
  state.originesRecette = [];
  state.photoSelectionnee = null;
  elements.ingredientsRecetteListe.innerHTML = '';
  elements.etapesInputs.innerHTML = '';
  elements.photoPreview.classList.add('hidden');
  elements.photoPreviewImg.src = '';

  remplirSelectCategories();
  remplirSelectCategoriesUnites();
  afficherOriginesTags();
  ajouterLigneEtape();
  ajouterLigneEtape();
  remplirTagsFormulaire('tags-recette-select');
}

function ajouterIngredientAuFormulaire() {
  const nom = elements.selectIngredient.value;
  const quantite = parseFloat(elements.inputQuantite.value) || 0;
  const unite = elements.selectUnite.value;

  if (!nom) {
    alert('Veuillez sélectionner un ingrédient.');
    return;
  }

  // Vérifier si déjà ajouté
  if (state.ingredientsRecette.some(ing => ing.nom === nom)) {
    alert('Cet ingrédient est déjà dans la liste.');
    return;
  }

  state.ingredientsRecette.push({ nom, quantite, unite });
  afficherIngredientsRecette();

  // Reset les champs
  elements.selectIngredient.value = '';
  elements.inputQuantite.value = '';
  elements.selectCategorieUnite.value = '';
  elements.selectUnite.value = '';
  elements.selectUnite.disabled = true;
}

function afficherIngredientsRecette() {
  elements.ingredientsRecetteListe.innerHTML = state.ingredientsRecette.map((ing, index) => `
    <div class="ingredient-recette-item" data-index="${index}">
      <div class="ingredient-recette-info">
        <span class="ingredient-recette-nom">${ing.nom}</span>
        <span class="ingredient-recette-quantite">${formatQuantite(ing.quantite, ing.unite)}</span>
      </div>
      <button type="button" class="btn-remove-ingredient" aria-label="Supprimer">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  `).join('');

  // Event listeners
  document.querySelectorAll('.btn-remove-ingredient').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.closest('.ingredient-recette-item').dataset.index);
      state.ingredientsRecette.splice(index, 1);
      afficherIngredientsRecette();
    });
  });
}

function ajouterLigneEtape(texte = '', duree = null) {
  const index = elements.etapesInputs.children.length + 1;
  const div = document.createElement('div');
  div.className = 'etape-input-row';
  div.innerHTML = `
    <span class="etape-number">${index}</span>
    <textarea placeholder="Décrivez cette étape..." required>${texte}</textarea>
    <div class="etape-duree-input">
      <input type="number" class="input-duree-etape" placeholder="min" min="0" value="${duree || ''}" title="Durée du timer (minutes)">
      <span class="duree-label">min</span>
    </div>
    <button type="button" class="btn-remove" aria-label="Supprimer cette étape">
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>
  `;

  div.querySelector('.btn-remove').addEventListener('click', () => {
    if (elements.etapesInputs.children.length > 1) {
      div.remove();
      renumeroterEtapes();
    }
  });

  elements.etapesInputs.appendChild(div);
}

function renumeroterEtapes() {
  const etapes = elements.etapesInputs.querySelectorAll('.etape-input-row');
  etapes.forEach((etape, index) => {
    etape.querySelector('.etape-number').textContent = index + 1;
  });
}

function handlePhotoSelection(e) {
  const file = e.target.files[0];
  if (file) {
    state.photoSelectionnee = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      elements.photoPreviewImg.src = e.target.result;
      elements.photoPreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }
}

function removePhoto() {
  state.photoSelectionnee = null;
  elements.inputPhoto.value = '';
  elements.photoPreview.classList.add('hidden');
  elements.photoPreviewImg.src = '';
}

async function soumettreRecette(e) {
  e.preventDefault();

  const nom = document.getElementById('input-nom').value.trim();
  const type = document.getElementById('input-type').value;
  const personnes = parseInt(document.getElementById('input-personnes').value);
  const tempsPreparation = parseInt(document.getElementById('input-prep').value);
  const tempsCuisson = parseInt(document.getElementById('input-cuisson').value);

  // Récupérer les étapes
  const etapes = [];
  elements.etapesInputs.querySelectorAll('.etape-input-row').forEach(row => {
    const texte = row.querySelector('textarea').value.trim();
    const dureeInput = row.querySelector('.input-duree-etape');
    const duree = dureeInput && dureeInput.value ? parseInt(dureeInput.value) : null;
    if (texte) {
      etapes.push({ texte, duree });
    }
  });

  // Validation
  if (state.ingredientsRecette.length === 0) {
    alert('Veuillez ajouter au moins un ingrédient.');
    return;
  }

  if (etapes.length === 0) {
    alert('Veuillez ajouter au moins une étape.');
    return;
  }

  try {
    // Upload de la photo si sélectionnée
    let imageName = '';
    if (state.photoSelectionnee) {
      const uploadResult = await uploadPhoto(state.photoSelectionnee, nom);
      imageName = uploadResult.filename;
    }

    // Récupérer difficulté et tags
    const niveauDifficulte = document.getElementById('input-difficulte').value || null;
    const tagIds = getSelectedTagIds('tags-recette-select');

    // Créer la recette
    const id = slugify(nom);
    const nouvelleRecette = {
      id,
      nom,
      type,
      tempsPreparation,
      tempsCuisson,
      personnes,
      image: imageName,
      origines: state.originesRecette,
      ingredients: state.ingredientsRecette,
      etapes,
      niveauDifficulte,
      tags: tagIds
    };

    // Sauvegarder
    await sauvegarderRecette(nouvelleRecette);

    // Recharger les recettes
    await chargerRecettes();

    // Mettre à jour les filtres d'origines (filtrage dynamique)
    remplirFiltreOrigines();

    // Retourner à la liste
    navigateToPage('recettes');
    alert('Recette enregistrée avec succès !');

  } catch (error) {
    alert('Erreur lors de la sauvegarde: ' + error.message);
  }
}

// === Gestionnaires d'événements ===

function initialiserEvenements() {
  // Sidebar
  elements.btnMenu.addEventListener('click', () => toggleSidebar(true));
  elements.btnCloseSidebar.addEventListener('click', () => toggleSidebar(false));
  elements.sidebarOverlay.addEventListener('click', () => toggleSidebar(false));

  // Navigation
  elements.sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      navigateToPage(page);
    });
  });

  // Filtres
  elements.recherche.addEventListener('input', filtrerRecettes);
  elements.filtreType.addEventListener('change', filtrerRecettes);
  elements.filtreTemps.addEventListener('change', filtrerRecettes);
  elements.filtreOrigine.addEventListener('change', (e) => {
    state.filtreOrigine = e.target.value;
    filtrerRecettes();
  });

  // Tri
  elements.triRecettes.addEventListener('change', filtrerRecettes);

  // Toggle panneau ingrédients
  elements.btnToggleIngredients.addEventListener('click', () => {
    state.ingredientsPanelOpen = !state.ingredientsPanelOpen;
    elements.ingredientsFilterPanel.classList.toggle('hidden', !state.ingredientsPanelOpen);
    elements.btnToggleIngredients.classList.toggle('active', state.ingredientsPanelOpen);
  });

  // Recherche ingrédients
  elements.ingredientsSearch.addEventListener('input', (e) => {
    afficherTagsIngredients(e.target.value);
  });

  // Effacer sélection ingrédients
  elements.btnClearIngredients.addEventListener('click', () => {
    state.ingredientsSelectionnes.clear();
    afficherTagsIngredients(elements.ingredientsSearch.value);
    mettreAJourCompteurIngredients();
    filtrerRecettes();
  });

  // Filtre favoris
  elements.filtreFavoris.addEventListener('click', () => {
    state.filtreFavoris = !state.filtreFavoris;
    elements.filtreFavoris.classList.toggle('active', state.filtreFavoris);
    filtrerRecettes();
  });

  // Retour à la liste depuis détail
  elements.btnRetour.addEventListener('click', () => {
    state.recetteActuelle = null;
    navigateToPage('recettes');
  });

  // Export PDF
  elements.btnExportPdf.addEventListener('click', exporterRecettePDF);

  // Sélecteur de personnes
  elements.btnMoins.addEventListener('click', () => {
    if (state.nombrePersonnes > 1) {
      state.nombrePersonnes--;
      elements.nbPersonnes.textContent = state.nombrePersonnes;
      afficherIngredients();
    }
  });

  elements.btnPlus.addEventListener('click', () => {
    if (state.nombrePersonnes < 50) {
      state.nombrePersonnes++;
      elements.nbPersonnes.textContent = state.nombrePersonnes;
      afficherIngredients();
    }
  });

  // Toggle vue des étapes
  elements.btnToggleEtapes.addEventListener('click', () => {
    state.vueToutes = !state.vueToutes;

    if (state.vueToutes) {
      elements.etapeNavigation.classList.add('hidden');
      elements.etapesListe.classList.remove('hidden');
      elements.btnToggleEtapes.textContent = 'Voir étape par étape';
    } else {
      elements.etapeNavigation.classList.remove('hidden');
      elements.etapesListe.classList.add('hidden');
      elements.btnToggleEtapes.textContent = 'Voir toutes les étapes';
    }
  });

  // Navigation des étapes
  elements.btnPrecedent.addEventListener('click', () => {
    if (state.etapeActuelle > 0) {
      state.etapeActuelle--;
      mettreAJourEtapeActuelle();
    }
  });

  elements.btnSuivant.addEventListener('click', () => {
    const totalEtapes = state.recetteActuelle.etapes.length;

    // Feature 35 : Valider l'étape actuelle en mode réalisation
    if (state.modeRealisation && state.sessionRealisationId) {
      validerEtapeProgression(state.etapeActuelle);
    }

    if (state.etapeActuelle < totalEtapes - 1) {
      state.etapeActuelle++;
      mettreAJourEtapeActuelle();
    }
  });

  // Page ingrédients
  elements.btnAddCategorie.addEventListener('click', ajouterCategorie);

  // Page liste de courses
  elements.coursesMoins.addEventListener('click', () => {
    if (state.coursesPersonnes > 1) {
      state.coursesPersonnes--;
      elements.coursesNbPersonnes.textContent = state.coursesPersonnes;
    }
  });

  elements.coursesPlus.addEventListener('click', () => {
    if (state.coursesPersonnes < 50) {
      state.coursesPersonnes++;
      elements.coursesNbPersonnes.textContent = state.coursesPersonnes;
    }
  });

  elements.btnGenererListe.addEventListener('click', genererListeCourses);
  elements.btnCopierListe.addEventListener('click', copierListeCourses);
  elements.btnSauvegarderListe.addEventListener('click', sauvegarderListeCourses);

  // Filtres de la page courses
  elements.coursesRecherche.addEventListener('input', (e) => {
    state.coursesRecherche = e.target.value;
    afficherRecettesCourses();
  });

  elements.coursesFiltreType.addEventListener('change', (e) => {
    state.coursesFiltreType = e.target.value;
    afficherRecettesCourses();
  });

  elements.coursesFiltreOrigine.addEventListener('change', (e) => {
    state.coursesFiltreOrigine = e.target.value;
    afficherRecettesCourses();
  });

  // Onglets de la page courses
  elements.coursesTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      elements.coursesTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      if (tabName === 'nouvelle') {
        elements.tabNouvelle.classList.add('active');
        elements.tabHistorique.classList.remove('active');
      } else {
        elements.tabNouvelle.classList.remove('active');
        elements.tabHistorique.classList.add('active');
      }
    });
  });

  // Formulaire d'ajout - sélection par catégorie
  elements.selectCategorie.addEventListener('change', (e) => {
    remplirSelectIngredients(e.target.value);
  });

  // Sélection par catégorie d'unités
  elements.selectCategorieUnite.addEventListener('change', (e) => {
    remplirSelectUnites(e.target.value);
  });

  elements.btnAddIngredientSelect.addEventListener('click', ajouterIngredientAuFormulaire);
  elements.btnAddEtape.addEventListener('click', () => ajouterLigneEtape());
  elements.formRecette.addEventListener('submit', soumettreRecette);
  elements.btnCancelForm.addEventListener('click', () => navigateToPage('recettes'));

  // Gestion photo
  elements.inputPhoto.addEventListener('change', handlePhotoSelection);
  elements.btnRemovePhoto.addEventListener('click', removePhoto);

  // Modal recette aléatoire
  elements.btnRecetteAleatoire.addEventListener('click', ouvrirModalAleatoire);
  elements.btnCloseModalAleatoire.addEventListener('click', fermerModalAleatoire);
  elements.modalAleatoire.addEventListener('click', (e) => {
    if (e.target === elements.modalAleatoire) {
      fermerModalAleatoire();
    }
  });

  // Boutons de type aléatoire
  elements.btnsAleatoireType.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      selectionnerRecetteAleatoire(type);
    });
  });

  // Menu aléatoire complet
  elements.btnMenuAleatoireComplet.addEventListener('click', genererMenuAleatoireComplet);
  elements.btnCloseModalMenu.addEventListener('click', fermerModalMenuComplet);
  elements.modalMenuComplet.addEventListener('click', (e) => {
    if (e.target === elements.modalMenuComplet) {
      fermerModalMenuComplet();
    }
  });
  elements.btnRegénérerMenu.addEventListener('click', genererMenuAleatoireComplet);

  // Planning
  elements.btnSemainePrecedente.addEventListener('click', () => changerSemaine(-1));
  elements.btnSemaineSuivante.addEventListener('click', () => changerSemaine(1));
  elements.btnGenererCoursesSemaine.addEventListener('click', genererListeCoursesSemaine);

  // Modal sélection recette
  elements.btnCloseModalSelect.addEventListener('click', fermerModalSelectRecette);
  elements.modalSelectRecette.addEventListener('click', (e) => {
    if (e.target === elements.modalSelectRecette) {
      fermerModalSelectRecette();
    }
  });

  elements.modalRecherche.addEventListener('input', (e) => {
    state.modalRecetteFiltres.recherche = e.target.value;
    afficherRecettesModal();
  });

  elements.modalFiltreType.addEventListener('change', (e) => {
    state.modalRecetteFiltres.type = e.target.value;
    afficherRecettesModal();
  });

  elements.modalFiltreOrigine.addEventListener('change', (e) => {
    state.modalRecetteFiltres.origine = e.target.value;
    afficherRecettesModal();
  });

  elements.modalFiltreFavoris.addEventListener('click', () => {
    state.modalRecetteFiltres.favoris = !state.modalRecetteFiltres.favoris;
    elements.modalFiltreFavoris.classList.toggle('active', state.modalRecetteFiltres.favoris);
    afficherRecettesModal();
  });

  // Navigation clavier
  document.addEventListener('keydown', (e) => {
    if (!state.recetteActuelle || state.vueToutes) return;

    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (state.etapeActuelle > 0) {
        state.etapeActuelle--;
        mettreAJourEtapeActuelle();
      }
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const totalEtapes = state.recetteActuelle.etapes.length;
      if (state.etapeActuelle < totalEtapes - 1) {
        state.etapeActuelle++;
        mettreAJourEtapeActuelle();
      }
    } else if (e.key === 'Escape') {
      navigateToPage('recettes');
    }
  });

  // Bouton retour navigateur
  window.addEventListener('popstate', () => {
    if (state.recetteActuelle || state.currentPage !== 'recettes') {
      navigateToPage('recettes');
    }
  });

  // === Administration Events ===

  // Bouton Ajouter une recette (dans admin)
  document.getElementById('btn-admin-ajout-recette').addEventListener('click', () => {
    navigateToPage('ajout');
  });

  // Recherche admin recettes
  elements.adminRecettesRecherche.addEventListener('input', (e) => {
    afficherAdminRecettes(e.target.value);
  });

  // Boutons nouvelle catégorie
  elements.btnAdminAddCategorieIng.addEventListener('click', () => {
    ouvrirModalEditCategorieIng(null, '');
  });

  elements.btnAdminAddCategorieUnite.addEventListener('click', () => {
    ouvrirModalEditCategorieUnite(null, '');
  });

  // Modal édition recette
  elements.btnCloseModalEdit.addEventListener('click', fermerModalEditRecette);
  elements.btnCancelEdit.addEventListener('click', fermerModalEditRecette);
  elements.modalEditRecette.addEventListener('click', (e) => {
    if (e.target === elements.modalEditRecette) {
      fermerModalEditRecette();
    }
  });
  elements.formEditRecette.addEventListener('submit', sauvegarderEditRecette);

  // Edit recette - sélecteurs catégories/ingrédients
  document.getElementById('edit-select-categorie').addEventListener('change', (e) => {
    remplirEditSelectIngredients(e.target.value);
  });

  document.getElementById('edit-select-categorie-unite').addEventListener('change', (e) => {
    remplirEditSelectUnites(e.target.value);
  });

  document.getElementById('btn-edit-add-ingredient').addEventListener('click', ajouterEditIngredient);

  document.getElementById('btn-edit-add-etape').addEventListener('click', () => {
    ajouterEditLigneEtape();
  });

  // Edit recette - photo
  document.getElementById('edit-photo').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      adminState.editPhotoSelectionnee = file;
      adminState.editPhotoChanged = true;
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById('edit-photo-preview-img').src = event.target.result;
        document.getElementById('edit-photo-preview').classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('btn-edit-remove-photo').addEventListener('click', () => {
    adminState.editPhotoSelectionnee = null;
    adminState.editPhotoChanged = true;
    document.getElementById('edit-photo').value = '';
    document.getElementById('edit-photo-preview').classList.add('hidden');
    document.getElementById('edit-photo-preview-img').src = '';
  });

  // Modal confirmation suppression
  elements.btnCloseModalDelete.addEventListener('click', fermerModalConfirmDelete);
  elements.btnCancelDelete.addEventListener('click', fermerModalConfirmDelete);
  elements.btnConfirmDelete.addEventListener('click', confirmerSuppression);
  elements.modalConfirmDelete.addEventListener('click', (e) => {
    if (e.target === elements.modalConfirmDelete) {
      fermerModalConfirmDelete();
    }
  });

  // Modal édition ingrédient
  elements.btnCloseModalIngredient.addEventListener('click', fermerModalEditIngredient);
  elements.btnCancelIngredient.addEventListener('click', fermerModalEditIngredient);
  elements.formEditIngredient.addEventListener('submit', sauvegarderEditIngredient);
  elements.modalEditIngredient.addEventListener('click', (e) => {
    if (e.target === elements.modalEditIngredient) {
      fermerModalEditIngredient();
    }
  });

  // Modal édition catégorie ingrédient
  elements.btnCloseModalCategorieIng.addEventListener('click', fermerModalEditCategorieIng);
  elements.btnCancelCategorieIng.addEventListener('click', fermerModalEditCategorieIng);
  elements.formEditCategorieIng.addEventListener('submit', sauvegarderEditCategorieIng);
  elements.modalEditCategorieIng.addEventListener('click', (e) => {
    if (e.target === elements.modalEditCategorieIng) {
      fermerModalEditCategorieIng();
    }
  });

  // Modal édition unité
  elements.btnCloseModalUnite.addEventListener('click', fermerModalEditUnite);
  elements.btnCancelUnite.addEventListener('click', fermerModalEditUnite);
  elements.formEditUnite.addEventListener('submit', sauvegarderEditUnite);
  elements.modalEditUnite.addEventListener('click', (e) => {
    if (e.target === elements.modalEditUnite) {
      fermerModalEditUnite();
    }
  });

  // Modal édition catégorie unité
  elements.btnCloseModalCategorieUnite.addEventListener('click', fermerModalEditCategorieUnite);
  elements.btnCancelCategorieUnite.addEventListener('click', fermerModalEditCategorieUnite);
  elements.formEditCategorieUnite.addEventListener('submit', sauvegarderEditCategorieUnite);
  elements.modalEditCategorieUnite.addEventListener('click', (e) => {
    if (e.target === elements.modalEditCategorieUnite) {
      fermerModalEditCategorieUnite();
    }
  });

  // === Filtre favoris dans courses ===
  elements.coursesFiltreFavoris.addEventListener('click', () => {
    state.coursesFiltreFavoris = !state.coursesFiltreFavoris;
    elements.coursesFiltreFavoris.classList.toggle('active', state.coursesFiltreFavoris);
    afficherRecettesCourses();
  });

  // === Bouton Modifier recette depuis vue détail ===
  elements.btnModifierRecette.addEventListener('click', () => {
    if (state.recetteActuelle) {
      ouvrirModalEditRecette(state.recetteActuelle.id);
    }
  });

  // === Bouton liste de courses pour une recette ===
  elements.btnCoursesRecette.addEventListener('click', ouvrirModalCoursesRecette);

  // Modal courses recette
  elements.btnCloseModalCoursesRecette.addEventListener('click', fermerModalCoursesRecette);
  elements.modalCoursesRecette.addEventListener('click', (e) => {
    if (e.target === elements.modalCoursesRecette) {
      fermerModalCoursesRecette();
    }
  });

  elements.modalCoursesMoins.addEventListener('click', () => {
    if (coursesRecetteState.nbPersonnes > 1) {
      coursesRecetteState.nbPersonnes--;
      elements.modalCoursesNbPersonnes.textContent = coursesRecetteState.nbPersonnes;
      genererListeCoursesRecette();
    }
  });

  elements.modalCoursesPlus.addEventListener('click', () => {
    if (coursesRecetteState.nbPersonnes < 50) {
      coursesRecetteState.nbPersonnes++;
      elements.modalCoursesNbPersonnes.textContent = coursesRecetteState.nbPersonnes;
      genererListeCoursesRecette();
    }
  });

  elements.btnCopierCoursesRecette.addEventListener('click', copierListeCoursesRecette);

  // === Toggle widget des timers actifs ===
  document.getElementById('btn-toggle-timers').addEventListener('click', () => {
    const container = document.getElementById('timers-actifs');
    const btn = document.getElementById('btn-toggle-timers');
    container.classList.toggle('collapsed');
    btn.textContent = container.classList.contains('collapsed') ? '+' : '−';
  });

  // === Historique recettes (suivi de progression) ===

  // Bouton Démarrer recette (vue détail)
  elements.btnDemarrerRecette.addEventListener('click', demarrerRecette);

  // Bouton Reprendre recette dans la vue détail
  elements.btnReprendreDetail.addEventListener('click', reprendreRecetteDetail);

  // Bouton Terminer la recette (vue détail, mode réalisation)
  elements.btnArreterRealisation.addEventListener('click', terminerRecetteDetail);

  // Bouton Reprendre recette dans le menu latéral
  elements.btnReprendreRecette.addEventListener('click', (e) => {
    e.preventDefault();
    reprendreRecetteEnCours();
  });

  // Page recette en cours - Retour
  elements.btnRetourRecetteEnCours.addEventListener('click', () => {
    navigateToPage('historique-recettes');
  });

  // Bouton Terminer recette (page recette en cours)
  elements.btnTerminerRecette.addEventListener('click', terminerRecetteEnCours);

  // Filtres historique
  elements.btnHistoriqueFiltrer.addEventListener('click', filtrerHistoriqueRecettes);
}

// === Administration ===

// État de l'administration
const adminState = {
  deleteCallback: null,
  editRecetteId: null,
  editIngredients: [],
  editOrigines: [],
  editPhotoSelectionnee: null,
  editPhotoChanged: false,
  editPhotoExistante: null
};

// État des timers
const timersState = {
  actifs: new Map(), // Map<timerId, {recetteId, etapeIndex, duree, restant, interval, status}>
  nextId: 1
};

// État de la modal courses recette
const coursesRecetteState = {
  nbPersonnes: 4,
  recette: null
};

// === Gestion des Recettes (Admin) ===

function afficherAdminRecettes(recherche = '') {
  const searchTerm = recherche.toLowerCase().trim();

  let recettesFiltrees = recettes;
  if (searchTerm) {
    recettesFiltrees = recettes.filter(r =>
      r.nom.toLowerCase().includes(searchTerm)
    );
  }

  if (recettesFiltrees.length === 0) {
    elements.adminRecettesListe.innerHTML = `
      <div class="admin-empty">
        <svg viewBox="0 0 24 24" width="64" height="64">
          <path fill="currentColor" d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/>
        </svg>
        <p>Aucune recette trouvée</p>
      </div>
    `;
    return;
  }

  elements.adminRecettesListe.innerHTML = recettesFiltrees.map(recette => {
    const imageUrl = recette.photo ? `${PHOTOS_PATH}${recette.photo}` : DEFAULT_IMAGE;
    const temps = recette.tempsPreparation + recette.tempsCuisson;
    const origines = (recette.origines || []).join(', ');

    return `
      <div class="admin-recette-item" data-id="${recette.id}">
        <img src="${imageUrl}" alt="${recette.nom}" class="admin-recette-img" onerror="this.src='${DEFAULT_IMAGE}'">
        <div class="admin-recette-info">
          <div class="admin-recette-nom">${recette.nom}</div>
          <div class="admin-recette-meta">
            <span class="type-badge">${getTypeLabel(recette.type)}</span>
            <span>⏱️ ${formatTemps(temps)}</span>
            <span>👥 ${recette.personnes} pers.</span>
            ${origines ? `<span>🌍 ${origines}</span>` : ''}
          </div>
        </div>
        <div class="admin-recette-actions">
          <button type="button" class="btn-admin-action btn-edit" data-action="edit" title="Modifier">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
          <button type="button" class="btn-admin-action btn-delete" data-action="delete" title="Supprimer">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Event listeners
  elements.adminRecettesListe.querySelectorAll('.admin-recette-item').forEach(item => {
    const recetteId = item.dataset.id;

    item.querySelector('.btn-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      ouvrirModalEditRecette(recetteId);
    });

    item.querySelector('.btn-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      const recette = recettes.find(r => r.id === recetteId);
      ouvrirModalConfirmDelete(
        `Êtes-vous sûr de vouloir supprimer la recette "${recette.nom}" ?`,
        () => supprimerRecetteAdmin(recetteId)
      );
    });
  });
}

async function supprimerRecetteAdmin(id) {
  try {
    const response = await fetch(`${API_URL}/api/recettes/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Erreur suppression');

    await chargerRecettes();
    afficherAdminRecettes(elements.adminRecettesRecherche.value);
    remplirFiltreOrigines();
  } catch (error) {
    console.error('Erreur suppression recette:', error);
    alert('Erreur lors de la suppression de la recette');
  }
}

function ouvrirModalEditRecette(recetteId) {
  const recette = recettes.find(r => r.id === recetteId);
  if (!recette) return;

  adminState.editRecetteId = recetteId;
  adminState.editIngredients = [...recette.ingredients];
  adminState.editOrigines = [...(recette.origines || [])];
  adminState.editPhotoSelectionnee = null;
  adminState.editPhotoChanged = false;
  adminState.editPhotoExistante = recette.photo || null;

  // Remplir le formulaire
  document.getElementById('edit-recette-id').value = recetteId;
  document.getElementById('edit-nom').value = recette.nom;
  document.getElementById('edit-type').value = recette.type;
  document.getElementById('edit-personnes').value = recette.personnes;
  document.getElementById('edit-prep').value = recette.tempsPreparation;
  document.getElementById('edit-cuisson').value = recette.tempsCuisson;

  // Photo
  const photoPreview = document.getElementById('edit-photo-preview');
  const photoPreviewImg = document.getElementById('edit-photo-preview-img');
  if (recette.photo) {
    photoPreviewImg.src = `${PHOTOS_PATH}${recette.photo}`;
    photoPreview.classList.remove('hidden');
  } else {
    photoPreview.classList.add('hidden');
    photoPreviewImg.src = '';
  }

  // Origines
  remplirEditOriginesTags();

  // Ingrédients
  remplirEditSelectCategories();
  remplirEditSelectCategoriesUnites();
  afficherEditIngredientsRecette();

  // Difficulté
  const editDifficulte = document.getElementById('edit-difficulte');
  if (editDifficulte) {
    editDifficulte.value = recette.niveauDifficulte || '';
  }

  // Tags
  const recetteTagIds = new Set((recette.tags || []).map(t => t.id));
  remplirTagsFormulaire('edit-tags-recette-select', recetteTagIds);

  // Étapes
  const etapesInputs = document.getElementById('edit-etapes-inputs');
  etapesInputs.innerHTML = '';
  recette.etapes.forEach(etape => {
    // Support pour l'ancien format (string) et le nouveau format ({texte, duree})
    if (typeof etape === 'string') {
      ajouterEditLigneEtape(etape, null);
    } else {
      ajouterEditLigneEtape(etape.texte, etape.duree);
    }
  });

  elements.modalEditRecette.classList.add('active');
}

function fermerModalEditRecette() {
  elements.modalEditRecette.classList.remove('active');
  adminState.editRecetteId = null;
  adminState.editIngredients = [];
  adminState.editOrigines = [];
}

function remplirEditOriginesTags() {
  const container = document.getElementById('edit-origines-tags');
  container.innerHTML = originesBase.map(origine => {
    const isSelected = adminState.editOrigines.includes(origine);
    return `
      <span class="origine-tag ${isSelected ? 'selected' : ''}" data-origine="${origine}">
        ${origine}
      </span>
    `;
  }).join('');

  container.querySelectorAll('.origine-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const origine = tag.dataset.origine;
      if (adminState.editOrigines.includes(origine)) {
        adminState.editOrigines = adminState.editOrigines.filter(o => o !== origine);
        tag.classList.remove('selected');
      } else {
        adminState.editOrigines.push(origine);
        tag.classList.add('selected');
      }
    });
  });
}

function remplirEditSelectCategories() {
  const select = document.getElementById('edit-select-categorie');
  let options = '<option value="">Choisir une catégorie...</option>';
  ingredientsBase.forEach((cat, index) => {
    options += `<option value="${index}">${cat.categorie}</option>`;
  });
  select.innerHTML = options;

  const selectIng = document.getElementById('edit-select-ingredient');
  selectIng.innerHTML = '<option value="">Choisir un ingrédient...</option>';
  selectIng.disabled = true;
}

function remplirEditSelectIngredients(categorieIndex) {
  const selectIng = document.getElementById('edit-select-ingredient');

  if (categorieIndex === '' || categorieIndex === null) {
    selectIng.innerHTML = '<option value="">Choisir un ingrédient...</option>';
    selectIng.disabled = true;
    return;
  }

  const cat = ingredientsBase[parseInt(categorieIndex)];
  if (!cat) return;

  let options = '<option value="">Choisir un ingrédient...</option>';
  cat.items.forEach(item => {
    options += `<option value="${item}">${item}</option>`;
  });

  selectIng.innerHTML = options;
  selectIng.disabled = false;
}

function remplirEditSelectCategoriesUnites() {
  const select = document.getElementById('edit-select-categorie-unite');
  let options = '<option value="">Catégorie...</option>';
  unitesBase.forEach((cat, index) => {
    options += `<option value="${index}">${cat.categorie}</option>`;
  });
  select.innerHTML = options;

  const selectUnite = document.getElementById('edit-select-unite');
  selectUnite.innerHTML = '<option value="">Unité...</option>';
  selectUnite.disabled = true;
}

function remplirEditSelectUnites(categorieIndex) {
  const selectUnite = document.getElementById('edit-select-unite');

  if (categorieIndex === '' || categorieIndex === null) {
    selectUnite.innerHTML = '<option value="">Unité...</option>';
    selectUnite.disabled = true;
    return;
  }

  const cat = unitesBase[parseInt(categorieIndex)];
  if (!cat) return;

  let options = '<option value="">Unité...</option>';
  cat.unites.forEach(unite => {
    options += `<option value="${unite}">${unite}</option>`;
  });

  selectUnite.innerHTML = options;
  selectUnite.disabled = false;
}

function ajouterEditIngredient() {
  const nom = document.getElementById('edit-select-ingredient').value;
  const quantite = parseFloat(document.getElementById('edit-input-quantite').value) || 0;
  const unite = document.getElementById('edit-select-unite').value;

  if (!nom) {
    alert('Veuillez sélectionner un ingrédient.');
    return;
  }

  if (adminState.editIngredients.some(ing => ing.nom === nom)) {
    alert('Cet ingrédient est déjà dans la liste.');
    return;
  }

  adminState.editIngredients.push({ nom, quantite, unite });
  afficherEditIngredientsRecette();

  document.getElementById('edit-select-ingredient').value = '';
  document.getElementById('edit-input-quantite').value = '';
  document.getElementById('edit-select-categorie-unite').value = '';
  document.getElementById('edit-select-unite').value = '';
  document.getElementById('edit-select-unite').disabled = true;
}

function afficherEditIngredientsRecette() {
  const container = document.getElementById('edit-ingredients-liste');
  container.innerHTML = adminState.editIngredients.map((ing, index) => `
    <div class="ingredient-recette-item" data-index="${index}">
      <div class="ingredient-recette-info">
        <span class="ingredient-recette-nom">${ing.nom}</span>
        <span class="ingredient-recette-quantite">${formatQuantite(ing.quantite, ing.unite)}</span>
      </div>
      <button type="button" class="btn-remove-ingredient" aria-label="Supprimer">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  `).join('');

  container.querySelectorAll('.btn-remove-ingredient').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.closest('.ingredient-recette-item').dataset.index);
      adminState.editIngredients.splice(index, 1);
      afficherEditIngredientsRecette();
    });
  });
}

function ajouterEditLigneEtape(texte = '', duree = null) {
  const container = document.getElementById('edit-etapes-inputs');
  const index = container.children.length + 1;
  const div = document.createElement('div');
  div.className = 'etape-input-row';
  div.innerHTML = `
    <span class="etape-number">${index}</span>
    <textarea placeholder="Décrivez cette étape..." required>${texte}</textarea>
    <div class="etape-duree-input">
      <input type="number" class="input-duree-etape" placeholder="min" min="0" value="${duree || ''}" title="Durée du timer (minutes)">
      <span class="duree-label">min</span>
    </div>
    <button type="button" class="btn-remove" aria-label="Supprimer cette étape">
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>
  `;

  div.querySelector('.btn-remove').addEventListener('click', () => {
    if (container.children.length > 1) {
      div.remove();
      renumeroterEditEtapes();
    }
  });

  container.appendChild(div);
}

function renumeroterEditEtapes() {
  const container = document.getElementById('edit-etapes-inputs');
  container.querySelectorAll('.etape-input-row').forEach((row, index) => {
    row.querySelector('.etape-number').textContent = index + 1;
  });
}

async function sauvegarderEditRecette(e) {
  e.preventDefault();

  const id = adminState.editRecetteId;
  const nom = document.getElementById('edit-nom').value.trim();
  const type = document.getElementById('edit-type').value;
  const personnes = parseInt(document.getElementById('edit-personnes').value);
  const tempsPreparation = parseInt(document.getElementById('edit-prep').value);
  const tempsCuisson = parseInt(document.getElementById('edit-cuisson').value);

  // Validation du nom
  if (!nom) {
    alert('Veuillez saisir un nom pour la recette.');
    return;
  }

  // Validation du type
  if (!type) {
    alert('Veuillez sélectionner un type de plat.');
    return;
  }

  const etapesRows = document.getElementById('edit-etapes-inputs').querySelectorAll('.etape-input-row');
  const etapes = [];
  etapesRows.forEach(row => {
    const texte = row.querySelector('textarea').value.trim();
    const dureeInput = row.querySelector('.input-duree-etape');
    const duree = dureeInput && dureeInput.value ? parseInt(dureeInput.value) : null;
    if (texte) {
      etapes.push({ texte, duree });
    }
  });

  if (etapes.length === 0) {
    alert('Veuillez ajouter au moins une étape.');
    return;
  }

  if (adminState.editIngredients.length === 0) {
    alert('Veuillez ajouter au moins un ingrédient.');
    return;
  }

  // Récupérer difficulté et tags
  const niveauDifficulte = document.getElementById('edit-difficulte').value || null;
  const tagIds = getSelectedTagIds('edit-tags-recette-select');

  const recetteData = {
    nom,
    type,
    personnes,
    tempsPreparation,
    tempsCuisson,
    ingredients: adminState.editIngredients,
    etapes,
    origines: adminState.editOrigines,
    niveauDifficulte,
    tags: tagIds
  };

  // Gérer la photo
  if (adminState.editPhotoChanged) {
    // La photo a été modifiée
    if (adminState.editPhotoSelectionnee) {
      // Nouvelle photo uploadée
      const photoNom = nom.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const extension = adminState.editPhotoSelectionnee.name.split('.').pop();
      recetteData.photo = `${photoNom}.${extension}`;
      recetteData.photoData = await fileToBase64(adminState.editPhotoSelectionnee);
    } else {
      // La photo a été supprimée
      recetteData.photo = null;
    }
  } else {
    // La photo n'a pas été modifiée, conserver l'existante
    recetteData.photo = adminState.editPhotoExistante;
  }

  try {
    const response = await fetch(`${API_URL}/api/recettes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recetteData)
    });

    if (!response.ok) throw new Error('Erreur sauvegarde');

    await chargerRecettes();
    fermerModalEditRecette();
    afficherAdminRecettes(elements.adminRecettesRecherche.value);
    remplirFiltreOrigines();
  } catch (error) {
    console.error('Erreur sauvegarde recette:', error);
    alert('Erreur lors de la sauvegarde de la recette');
  }
}

// === Gestion des Ingrédients (Admin) ===

function afficherAdminIngredients() {
  elements.adminIngredientsManager.innerHTML = ingredientsBase.map((categorie, catIndex) => `
    <div class="admin-categorie-card" data-categorie="${catIndex}">
      <div class="admin-categorie-header">
        <h3>${categorie.categorie}</h3>
        <div class="admin-categorie-header-actions">
          <button type="button" class="btn-header-icon" data-action="edit-categorie" title="Modifier le nom">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
          <button type="button" class="btn-header-icon" data-action="delete-categorie" title="Supprimer la catégorie">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="admin-categorie-body">
        <div class="admin-items-list">
          ${categorie.items.map((item, itemIndex) => `
            <div class="admin-item-chip" data-item="${itemIndex}">
              <span>${item}</span>
              <button type="button" class="btn-chip-action btn-chip-edit" title="Modifier">
                <svg viewBox="0 0 24 24" width="12" height="12">
                  <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>
              <button type="button" class="btn-chip-action btn-chip-delete" title="Supprimer">
                <svg viewBox="0 0 24 24" width="12" height="12">
                  <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          `).join('')}
        </div>
        <div class="admin-add-item-row">
          <input type="text" placeholder="Nouvel ingrédient..." class="input-new-ingredient">
          <button type="button" class="btn-add-ingredient-inline">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Ajouter
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Event listeners
  elements.adminIngredientsManager.querySelectorAll('.admin-categorie-card').forEach(card => {
    const catIndex = parseInt(card.dataset.categorie);
    const categorie = ingredientsBase[catIndex];

    // Modifier nom catégorie
    card.querySelector('[data-action="edit-categorie"]').addEventListener('click', () => {
      ouvrirModalEditCategorieIng(catIndex, categorie.categorie);
    });

    // Supprimer catégorie
    card.querySelector('[data-action="delete-categorie"]').addEventListener('click', () => {
      ouvrirModalConfirmDelete(
        `Êtes-vous sûr de vouloir supprimer la catégorie "${categorie.categorie}" et tous ses ingrédients ?`,
        () => supprimerCategorieIngredient(catIndex)
      );
    });

    // Modifier/supprimer ingrédients
    card.querySelectorAll('.admin-item-chip').forEach(chip => {
      const itemIndex = parseInt(chip.dataset.item);
      const itemNom = categorie.items[itemIndex];

      chip.querySelector('.btn-chip-edit').addEventListener('click', () => {
        ouvrirModalEditIngredient(catIndex, itemIndex, itemNom);
      });

      chip.querySelector('.btn-chip-delete').addEventListener('click', () => {
        ouvrirModalConfirmDelete(
          `Êtes-vous sûr de vouloir supprimer l'ingrédient "${itemNom}" ?`,
          () => supprimerIngredient(catIndex, itemIndex)
        );
      });
    });

    // Ajouter ingrédient inline
    const input = card.querySelector('.input-new-ingredient');
    const btnAdd = card.querySelector('.btn-add-ingredient-inline');

    btnAdd.addEventListener('click', () => {
      const nom = input.value.trim();
      if (nom) {
        ajouterIngredientInline(catIndex, nom);
        input.value = '';
      }
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const nom = input.value.trim();
        if (nom) {
          ajouterIngredientInline(catIndex, nom);
          input.value = '';
        }
      }
    });
  });
}

async function ajouterIngredientInline(catIndex, nom) {
  ingredientsBase[catIndex].items.push(nom);
  ingredientsBase[catIndex].items.sort((a, b) => a.localeCompare(b, 'fr'));

  try {
    await sauvegarderIngredients();
    afficherAdminIngredients();
  } catch (error) {
    console.error('Erreur ajout ingrédient:', error);
    alert('Erreur lors de l\'ajout de l\'ingrédient');
  }
}

async function supprimerIngredient(catIndex, itemIndex) {
  ingredientsBase[catIndex].items.splice(itemIndex, 1);

  try {
    await sauvegarderIngredients();
    afficherAdminIngredients();
  } catch (error) {
    console.error('Erreur suppression ingrédient:', error);
    alert('Erreur lors de la suppression');
  }
}

async function supprimerCategorieIngredient(catIndex) {
  ingredientsBase.splice(catIndex, 1);

  try {
    await sauvegarderIngredients();
    afficherAdminIngredients();
  } catch (error) {
    console.error('Erreur suppression catégorie:', error);
    alert('Erreur lors de la suppression');
  }
}

async function sauvegarderIngredients() {
  const response = await fetch(`${API_URL}/api/ingredients`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ingredientsBase)
  });
  if (!response.ok) throw new Error('Erreur sauvegarde ingrédients');
}

function ouvrirModalEditIngredient(catIndex, itemIndex, nom) {
  document.getElementById('modal-ingredient-title').textContent = 'Modifier l\'ingrédient';
  document.getElementById('ingredient-edit-categorie').value = catIndex;
  document.getElementById('ingredient-edit-index').value = itemIndex;
  document.getElementById('ingredient-edit-nom').value = nom;
  elements.modalEditIngredient.classList.add('active');
}

function ouvrirModalAddIngredient(catIndex) {
  document.getElementById('modal-ingredient-title').textContent = 'Ajouter un ingrédient';
  document.getElementById('ingredient-edit-categorie').value = catIndex;
  document.getElementById('ingredient-edit-index').value = '';
  document.getElementById('ingredient-edit-nom').value = '';
  elements.modalEditIngredient.classList.add('active');
}

function fermerModalEditIngredient() {
  elements.modalEditIngredient.classList.remove('active');
}

async function sauvegarderEditIngredient(e) {
  e.preventDefault();

  const catIndex = parseInt(document.getElementById('ingredient-edit-categorie').value);
  const itemIndex = document.getElementById('ingredient-edit-index').value;
  const nom = document.getElementById('ingredient-edit-nom').value.trim();

  if (!nom) return;

  if (itemIndex !== '') {
    // Modification
    ingredientsBase[catIndex].items[parseInt(itemIndex)] = nom;
  } else {
    // Ajout
    ingredientsBase[catIndex].items.push(nom);
  }

  ingredientsBase[catIndex].items.sort((a, b) => a.localeCompare(b, 'fr'));

  try {
    await sauvegarderIngredients();
    fermerModalEditIngredient();
    afficherAdminIngredients();
  } catch (error) {
    console.error('Erreur sauvegarde ingrédient:', error);
    alert('Erreur lors de la sauvegarde');
  }
}

function ouvrirModalEditCategorieIng(catIndex, nom) {
  document.getElementById('modal-categorie-ing-title').textContent = catIndex !== null ? 'Modifier la catégorie' : 'Nouvelle catégorie';
  document.getElementById('categorie-ing-edit-index').value = catIndex !== null ? catIndex : '';
  document.getElementById('categorie-ing-edit-nom').value = nom || '';
  elements.modalEditCategorieIng.classList.add('active');
}

function fermerModalEditCategorieIng() {
  elements.modalEditCategorieIng.classList.remove('active');
}

async function sauvegarderEditCategorieIng(e) {
  e.preventDefault();

  const catIndex = document.getElementById('categorie-ing-edit-index').value;
  const nom = document.getElementById('categorie-ing-edit-nom').value.trim();

  if (!nom) return;

  if (catIndex !== '') {
    // Modification
    ingredientsBase[parseInt(catIndex)].categorie = nom;
  } else {
    // Ajout
    ingredientsBase.push({ categorie: nom, items: [] });
  }

  try {
    await sauvegarderIngredients();
    fermerModalEditCategorieIng();
    afficherAdminIngredients();
  } catch (error) {
    console.error('Erreur sauvegarde catégorie:', error);
    alert('Erreur lors de la sauvegarde');
  }
}

// === Gestion des Unités (Admin) ===

function afficherAdminUnites() {
  elements.adminUnitesManager.innerHTML = unitesBase.map((categorie, catIndex) => `
    <div class="admin-categorie-card" data-categorie="${catIndex}">
      <div class="admin-categorie-header">
        <h3>${categorie.categorie}</h3>
        <div class="admin-categorie-header-actions">
          <button type="button" class="btn-header-icon" data-action="edit-categorie" title="Modifier le nom">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
          <button type="button" class="btn-header-icon" data-action="delete-categorie" title="Supprimer la catégorie">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="admin-categorie-body">
        <div class="admin-items-list">
          ${categorie.unites.map((unite, uniteIndex) => `
            <div class="admin-item-chip" data-item="${uniteIndex}">
              <span>${unite}</span>
              <button type="button" class="btn-chip-action btn-chip-edit" title="Modifier">
                <svg viewBox="0 0 24 24" width="12" height="12">
                  <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>
              <button type="button" class="btn-chip-action btn-chip-delete" title="Supprimer">
                <svg viewBox="0 0 24 24" width="12" height="12">
                  <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          `).join('')}
        </div>
        <div class="admin-add-item-row">
          <input type="text" placeholder="Nouvelle unité..." class="input-new-unite">
          <button type="button" class="btn-add-unite-inline">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Ajouter
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Event listeners
  elements.adminUnitesManager.querySelectorAll('.admin-categorie-card').forEach(card => {
    const catIndex = parseInt(card.dataset.categorie);
    const categorie = unitesBase[catIndex];

    // Modifier nom catégorie
    card.querySelector('[data-action="edit-categorie"]').addEventListener('click', () => {
      ouvrirModalEditCategorieUnite(catIndex, categorie.categorie);
    });

    // Supprimer catégorie
    card.querySelector('[data-action="delete-categorie"]').addEventListener('click', () => {
      ouvrirModalConfirmDelete(
        `Êtes-vous sûr de vouloir supprimer la catégorie "${categorie.categorie}" et toutes ses unités ?`,
        () => supprimerCategorieUnite(catIndex)
      );
    });

    // Modifier/supprimer unités
    card.querySelectorAll('.admin-item-chip').forEach(chip => {
      const uniteIndex = parseInt(chip.dataset.item);
      const uniteNom = categorie.unites[uniteIndex];

      chip.querySelector('.btn-chip-edit').addEventListener('click', () => {
        ouvrirModalEditUnite(catIndex, uniteIndex, uniteNom);
      });

      chip.querySelector('.btn-chip-delete').addEventListener('click', () => {
        ouvrirModalConfirmDelete(
          `Êtes-vous sûr de vouloir supprimer l'unité "${uniteNom}" ?`,
          () => supprimerUnite(catIndex, uniteIndex)
        );
      });
    });

    // Ajouter unité inline
    const input = card.querySelector('.input-new-unite');
    const btnAdd = card.querySelector('.btn-add-unite-inline');

    btnAdd.addEventListener('click', () => {
      const nom = input.value.trim();
      if (nom) {
        ajouterUniteInline(catIndex, nom);
        input.value = '';
      }
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const nom = input.value.trim();
        if (nom) {
          ajouterUniteInline(catIndex, nom);
          input.value = '';
        }
      }
    });
  });
}

async function ajouterUniteInline(catIndex, nom) {
  unitesBase[catIndex].unites.push(nom);

  try {
    await sauvegarderUnites();
    afficherAdminUnites();
  } catch (error) {
    console.error('Erreur ajout unité:', error);
    alert('Erreur lors de l\'ajout de l\'unité');
  }
}

async function supprimerUnite(catIndex, uniteIndex) {
  unitesBase[catIndex].unites.splice(uniteIndex, 1);

  try {
    await sauvegarderUnites();
    afficherAdminUnites();
  } catch (error) {
    console.error('Erreur suppression unité:', error);
    alert('Erreur lors de la suppression');
  }
}

async function supprimerCategorieUnite(catIndex) {
  unitesBase.splice(catIndex, 1);

  try {
    await sauvegarderUnites();
    afficherAdminUnites();
  } catch (error) {
    console.error('Erreur suppression catégorie:', error);
    alert('Erreur lors de la suppression');
  }
}

async function sauvegarderUnites() {
  const response = await fetch(`${API_URL}/api/unites`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(unitesBase)
  });
  if (!response.ok) throw new Error('Erreur sauvegarde unités');
}

function ouvrirModalEditUnite(catIndex, uniteIndex, nom) {
  document.getElementById('modal-unite-title').textContent = 'Modifier l\'unité';
  document.getElementById('unite-edit-categorie').value = catIndex;
  document.getElementById('unite-edit-index').value = uniteIndex;
  document.getElementById('unite-edit-nom').value = nom;
  elements.modalEditUnite.classList.add('active');
}

function fermerModalEditUnite() {
  elements.modalEditUnite.classList.remove('active');
}

async function sauvegarderEditUnite(e) {
  e.preventDefault();

  const catIndex = parseInt(document.getElementById('unite-edit-categorie').value);
  const uniteIndex = document.getElementById('unite-edit-index').value;
  const nom = document.getElementById('unite-edit-nom').value.trim();

  if (!nom) return;

  if (uniteIndex !== '') {
    unitesBase[catIndex].unites[parseInt(uniteIndex)] = nom;
  } else {
    unitesBase[catIndex].unites.push(nom);
  }

  try {
    await sauvegarderUnites();
    fermerModalEditUnite();
    afficherAdminUnites();
  } catch (error) {
    console.error('Erreur sauvegarde unité:', error);
    alert('Erreur lors de la sauvegarde');
  }
}

function ouvrirModalEditCategorieUnite(catIndex, nom) {
  document.getElementById('modal-categorie-unite-title').textContent = catIndex !== null ? 'Modifier la catégorie' : 'Nouvelle catégorie';
  document.getElementById('categorie-unite-edit-index').value = catIndex !== null ? catIndex : '';
  document.getElementById('categorie-unite-edit-nom').value = nom || '';
  elements.modalEditCategorieUnite.classList.add('active');
}

function fermerModalEditCategorieUnite() {
  elements.modalEditCategorieUnite.classList.remove('active');
}

async function sauvegarderEditCategorieUnite(e) {
  e.preventDefault();

  const catIndex = document.getElementById('categorie-unite-edit-index').value;
  const nom = document.getElementById('categorie-unite-edit-nom').value.trim();

  if (!nom) return;

  if (catIndex !== '') {
    unitesBase[parseInt(catIndex)].categorie = nom;
  } else {
    unitesBase.push({ categorie: nom, unites: [] });
  }

  try {
    await sauvegarderUnites();
    fermerModalEditCategorieUnite();
    afficherAdminUnites();
  } catch (error) {
    console.error('Erreur sauvegarde catégorie:', error);
    alert('Erreur lors de la sauvegarde');
  }
}

// === Modal Confirmation Suppression ===

function ouvrirModalConfirmDelete(message, callback) {
  elements.modalDeleteMessage.textContent = message;
  adminState.deleteCallback = callback;
  elements.modalConfirmDelete.classList.add('active');
}

function fermerModalConfirmDelete() {
  elements.modalConfirmDelete.classList.remove('active');
  adminState.deleteCallback = null;
}

function confirmerSuppression() {
  if (adminState.deleteCallback) {
    adminState.deleteCallback();
  }
  fermerModalConfirmDelete();
}

// === Liste de courses pour une recette individuelle ===

function ouvrirModalCoursesRecette() {
  if (!state.recetteActuelle) return;

  coursesRecetteState.recette = state.recetteActuelle;
  coursesRecetteState.nbPersonnes = state.recetteActuelle.personnes;

  elements.modalCoursesNbPersonnes.textContent = coursesRecetteState.nbPersonnes;
  genererListeCoursesRecette();
  elements.modalCoursesRecette.classList.add('active');
}

function fermerModalCoursesRecette() {
  elements.modalCoursesRecette.classList.remove('active');
}

function genererListeCoursesRecette() {
  const recette = coursesRecetteState.recette;
  if (!recette) return;

  const ratio = coursesRecetteState.nbPersonnes / recette.personnes;

  // Regrouper par catégorie
  const parCategorie = {};

  recette.ingredients.forEach(ing => {
    const categorie = trouverCategorieIngredient(ing.nom);
    if (!parCategorie[categorie]) {
      parCategorie[categorie] = [];
    }

    const quantiteAjustee = ing.quantite ? (ing.quantite * ratio) : 0;
    parCategorie[categorie].push({
      nom: ing.nom,
      quantite: quantiteAjustee,
      unite: ing.unite || ''
    });
  });

  // Générer le HTML
  let html = '';
  Object.keys(parCategorie).sort().forEach(categorie => {
    html += `
      <div class="liste-courses-categorie">
        <div class="liste-courses-categorie-titre">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05l-5 2V1h-1.97v6.05l-4.03-2L10 9.31V1H8.03v8.31L4 5.05l1.66 16.48c.1.82.79 1.46 1.63 1.46h1.66l.1-2.23c.02-.66.58-1.22 1.28-1.22h6.34c.7 0 1.26.56 1.28 1.22l.11 2.23z"/>
          </svg>
          ${categorie}
        </div>
        <ul class="liste-courses-items">
          ${parCategorie[categorie].map(item => `
            <li>
              <span class="ingredient-nom">${item.nom}</span>
              <span class="ingredient-quantite">${formatQuantite(item.quantite, item.unite)}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  });

  elements.modalCoursesListe.innerHTML = html;
}

function trouverCategorieIngredient(nomIngredient) {
  for (const cat of ingredientsBase) {
    if (cat.items.some(item => item.toLowerCase() === nomIngredient.toLowerCase())) {
      return cat.categorie;
    }
  }
  return 'Autres';
}

function copierListeCoursesRecette() {
  const categories = elements.modalCoursesListe.querySelectorAll('.liste-courses-categorie');
  let texte = `Liste de courses - ${coursesRecetteState.recette.nom} (${coursesRecetteState.nbPersonnes} pers.)\n`;

  categories.forEach(cat => {
    const titre = cat.querySelector('.liste-courses-categorie-titre')?.textContent?.trim() || '';
    const items = cat.querySelectorAll('.liste-courses-items li');

    texte += `\n=== ${titre} ===\n`;
    items.forEach(li => {
      const nom = li.querySelector('.ingredient-nom')?.textContent || '';
      const qte = li.querySelector('.ingredient-quantite')?.textContent || '';
      texte += `• ${nom} ${qte}\n`.trim() + '\n';
    });
  });

  navigator.clipboard.writeText(texte.trim()).then(() => {
    const toast = document.createElement('div');
    toast.className = 'copie-success';
    toast.textContent = 'Liste copiée !';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  });
}

// === Timers pour les étapes ===

function demarrerTimer(recetteId, etapeIndex, dureeMinutes) {
  const timerId = timersState.nextId++;
  const dureeSecondes = dureeMinutes * 60;

  const timer = {
    id: timerId,
    recetteId,
    etapeIndex,
    duree: dureeSecondes,
    restant: dureeSecondes,
    status: 'running',
    interval: null
  };

  timer.interval = setInterval(() => {
    timer.restant--;

    if (timer.restant <= 0) {
      timer.status = 'finished';
      clearInterval(timer.interval);
      jouerSonTimer();
      afficherNotificationTimer(timer);
    }

    mettreAJourAffichageTimers();
  }, 1000);

  timersState.actifs.set(timerId, timer);
  mettreAJourAffichageTimers();

  return timerId;
}

function pauseTimer(timerId) {
  const timer = timersState.actifs.get(timerId);
  if (!timer) return;

  if (timer.status === 'running') {
    clearInterval(timer.interval);
    timer.status = 'paused';
  } else if (timer.status === 'paused') {
    timer.interval = setInterval(() => {
      timer.restant--;
      if (timer.restant <= 0) {
        timer.status = 'finished';
        clearInterval(timer.interval);
        jouerSonTimer();
        afficherNotificationTimer(timer);
      }
      mettreAJourAffichageTimers();
    }, 1000);
    timer.status = 'running';
  }

  mettreAJourAffichageTimers();
}

function resetTimer(timerId) {
  const timer = timersState.actifs.get(timerId);
  if (!timer) return;

  clearInterval(timer.interval);
  timer.restant = timer.duree;
  timer.status = 'paused';
  mettreAJourAffichageTimers();
}

function stopTimer(timerId) {
  const timer = timersState.actifs.get(timerId);
  if (!timer) return;

  clearInterval(timer.interval);
  timersState.actifs.delete(timerId);
  mettreAJourAffichageTimers();
}

function formatTempsTimer(secondes) {
  const mins = Math.floor(secondes / 60);
  const secs = secondes % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function jouerSonTimer() {
  // Créer un son de notification
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;

    oscillator.start();

    // Jouer une séquence de bips
    setTimeout(() => oscillator.frequency.value = 1000, 200);
    setTimeout(() => oscillator.frequency.value = 800, 400);
    setTimeout(() => oscillator.frequency.value = 1000, 600);
    setTimeout(() => {
      oscillator.stop();
      audioContext.close();
    }, 800);
  } catch (e) {
    console.log('Audio non disponible');
  }
}

function afficherNotificationTimer(timer) {
  // Notification système si permission accordée
  if ('Notification' in window && Notification.permission === 'granted') {
    const recette = recettes.find(r => r.id === timer.recetteId);
    const recetteNom = recette ? recette.nom : 'Recette';
    new Notification('Timer terminé !', {
      body: `Étape ${timer.etapeIndex + 1} de "${recetteNom}" est terminée`,
      icon: 'images/icon-192.png'
    });
  }
}

function mettreAJourAffichageTimers() {
  // Mettre à jour le widget des timers actifs
  const container = document.getElementById('timers-actifs');
  const liste = document.getElementById('timers-actifs-liste');

  if (!container || !liste) return;

  if (timersState.actifs.size === 0) {
    container.style.display = 'none';
    liste.innerHTML = '';
    return;
  }

  container.style.display = 'flex';

  let html = '';
  timersState.actifs.forEach((timer, id) => {
    const recette = recettes.find(r => r.id === timer.recetteId);
    const recetteNom = recette ? recette.nom : 'Recette';

    html += `
      <div class="timer-actif-item ${timer.status}">
        <div class="timer-actif-info">
          <div class="timer-actif-nom">${recetteNom} - Étape ${timer.etapeIndex + 1}</div>
          <div class="timer-actif-temps ${timer.status}">${formatTempsTimer(timer.restant)}</div>
        </div>
        <div class="timer-actif-controls">
          ${timer.status !== 'finished' ? `
            <button type="button" class="btn-timer-control" onclick="pauseTimer(${id})" title="${timer.status === 'running' ? 'Pause' : 'Reprendre'}">
              <svg viewBox="0 0 24 24" width="16" height="16">
                ${timer.status === 'running'
                  ? '<path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'
                  : '<path fill="currentColor" d="M8 5v14l11-7z"/>'}
              </svg>
            </button>
            <button type="button" class="btn-timer-control" onclick="resetTimer(${id})" title="Réinitialiser">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
            </button>
          ` : ''}
          <button type="button" class="btn-timer-control" onclick="stopTimer(${id})" title="Fermer">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  });

  liste.innerHTML = html;
}

// Demander permission pour les notifications
function demanderPermissionNotifications() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// ========================================
// HISTORIQUE DES RECETTES (Suivi de progression)
// ========================================

// Charger les compteurs de réalisations
async function chargerCompteursRealisations() {
  try {
    const response = await fetch(`${API_URL}/api/compteurs-realisations`);
    if (!response.ok) return {};
    compteursRealisations = await response.json();
    return compteursRealisations;
  } catch (error) {
    console.warn('Compteurs non disponibles:', error);
    compteursRealisations = {};
    return {};
  }
}

// Vérifier s'il y a une recette en cours
async function verifierRecetteEnCours() {
  try {
    const response = await fetch(`${API_URL}/api/has-recette-en-cours`);
    if (!response.ok) return false;
    const data = await response.json();

    if (data.hasRecetteEnCours) {
      elements.menuReprendreContainer.classList.remove('hidden');
    } else {
      elements.menuReprendreContainer.classList.add('hidden');
    }

    return data.hasRecetteEnCours;
  } catch (error) {
    console.warn('Vérification recette en cours non disponible:', error);
    elements.menuReprendreContainer.classList.add('hidden');
    return false;
  }
}

// Démarrer une recette (crée une session et bascule en mode réalisation)
async function demarrerRecette() {
  if (!state.recetteActuelle) return;

  try {
    const response = await fetch(`${API_URL}/api/demarrer-recette`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recetteId: state.recetteActuelle.id,
        nombrePersonnes: state.nombrePersonnes
      })
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 503) {
        alert('Cette fonctionnalité nécessite PostgreSQL. Veuillez lancer l\'application avec Docker.');
        return;
      }
      throw new Error(error.error || 'Erreur lors du démarrage');
    }

    const result = await response.json();

    // Sauvegarder l'ID de la session
    state.sessionRealisationId = result.id;

    // Initialiser la progression vierge
    state.recetteEnCours = {
      id: result.id,
      recetteId: state.recetteActuelle.id,
      progressionEtapes: { etapes: [] },
      nombrePersonnes: state.nombrePersonnes
    };

    // Basculer en mode réalisation (afficher les étapes)
    basculerModeRealisation();

    // Mettre à jour le menu Reprendre global
    elements.menuReprendreContainer.classList.remove('hidden');

  } catch (error) {
    console.error('Erreur démarrage recette:', error);
    alert('Erreur lors du démarrage de la recette');
  }
}

// Reprendre une recette depuis la vue détail (bascule en mode réalisation)
async function reprendreRecetteDetail() {
  if (!state.recetteEnCours || !state.sessionRealisationId) {
    // Charger la session en cours
    await chargerRecetteEnCours();
  }

  if (state.recetteEnCours) {
    basculerModeRealisation();
  }
}

// Terminer la recette depuis la vue détail
async function terminerRecetteDetail() {
  if (!state.sessionRealisationId) return;

  if (!confirm('Voulez-vous marquer cette recette comme terminée ?')) return;

  try {
    const response = await fetch(`${API_URL}/api/terminer-recette`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        historiqueId: state.sessionRealisationId
      })
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la terminaison');
    }

    // Recharger les compteurs
    await chargerCompteursRealisations();

    // Réinitialiser l'état
    state.sessionRealisationId = null;
    state.recetteEnCours = null;

    // Revenir en mode consultation
    basculerModeConsultation();
    elements.btnDemarrerRecette.classList.remove('hidden');
    elements.btnReprendreDetail.classList.add('hidden');

    // Vérifier s'il reste une recette en cours (pour le menu)
    await verifierRecetteEnCours();

    // Notification
    alert('Recette terminée avec succès !');

  } catch (error) {
    console.error('Erreur terminaison recette:', error);
    alert('Erreur lors de la terminaison de la recette');
  }
}

// Charger la recette en cours
async function chargerRecetteEnCours() {
  try {
    const response = await fetch(`${API_URL}/api/recette-en-cours`);
    if (!response.ok) return null;

    const recette = await response.json();
    if (!recette) return null;

    state.recetteEnCours = recette;
    afficherRecetteEnCours();
    return recette;
  } catch (error) {
    console.error('Erreur chargement recette en cours:', error);
    return null;
  }
}

// Reprendre la recette en cours (depuis le menu latéral)
async function reprendreRecetteEnCours() {
  toggleSidebar(false);

  const sessionEnCours = await chargerRecetteEnCours();
  if (sessionEnCours) {
    // Trouver la recette correspondante
    const recette = recettes.find(r => r.id === sessionEnCours.recetteId);
    if (recette) {
      // Afficher la recette en mode consultation d'abord
      state.recetteActuelle = recette;
      state.nombrePersonnes = sessionEnCours.nombrePersonnes || recette.personnes;
      state.personnesBase = recette.personnes;
      state.etapeActuelle = 0;
      state.vueToutes = false;
      state.sessionRealisationId = sessionEnCours.id;

      // Afficher les infos de la recette
      const imageUrl = getImageUrl(recette.image);
      elements.detailImage.src = imageUrl;
      elements.detailImage.alt = recette.nom;
      elements.detailImage.onerror = function () { this.src = DEFAULT_IMAGE; };
      elements.detailNom.textContent = recette.nom;
      elements.detailPrep.textContent = formatTemps(recette.tempsPreparation);
      elements.detailCuisson.textContent = formatTemps(recette.tempsCuisson);
      elements.nbPersonnes.textContent = state.nombrePersonnes;

      afficherIngredients();
      afficherEtapes();

      // Naviguer vers la page détail
      elements.pageTitle.textContent = recette.nom;
      navigateToPage('detail');

      // Basculer directement en mode réalisation
      basculerModeRealisation();
    } else {
      alert('Recette non trouvée');
    }
  } else {
    alert('Aucune recette en cours');
    elements.menuReprendreContainer.classList.add('hidden');
  }
}

// Afficher la recette en cours
function afficherRecetteEnCours() {
  const recette = state.recetteEnCours;
  if (!recette) return;

  // Image
  const imageUrl = recette.photo
    ? `${PHOTOS_PATH}${recette.photo}`
    : recette.image || DEFAULT_IMAGE;
  elements.enCoursImage.src = imageUrl;
  elements.enCoursImage.alt = recette.recetteNom;

  // Nom
  elements.enCoursNom.textContent = recette.recetteNom;

  // Date de début
  const dateDebut = new Date(recette.dateDebut);
  elements.enCoursDateDebut.textContent = dateDebut.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  // Nombre de personnes
  elements.enCoursPersonnes.textContent = recette.nombrePersonnes;

  // Ingrédients
  afficherIngredientsEnCours(recette.ingredients, recette.nombrePersonnes);

  // Étapes avec checkboxes
  afficherEtapesEnCours(recette.etapes, recette.progressionEtapes);

  // Mise à jour de la progression globale
  mettreAJourProgressionGlobale();
}

// Afficher les ingrédients pour la recette en cours
function afficherIngredientsEnCours(ingredients, nombrePersonnes) {
  const ratio = nombrePersonnes / 4; // Base 4 personnes

  elements.enCoursIngredients.innerHTML = ingredients.map(ing => {
    const quantite = ing.quantite ? (ing.quantite * ratio).toFixed(1).replace(/\.0$/, '') : '';
    return `
      <li>
        <span class="ingredient-quantite">${quantite}</span>
        ${ing.unite || ''} ${ing.nom}
      </li>
    `;
  }).join('');
}

// Afficher les étapes avec checkboxes
function afficherEtapesEnCours(etapes, progressionEtapes) {
  const progression = progressionEtapes?.etapes || [];

  elements.enCoursEtapes.innerHTML = etapes.map((etape, index) => {
    const etapeProgression = progression[index] || { validee: false };
    const isCompleted = etapeProgression.validee;
    const timerInfo = etape.timer_duree ? generateTimerInfoHtml(etape, index, etapeProgression.timer) : '';

    return `
      <li class="en-cours-etape-item ${isCompleted ? 'completed' : ''}" data-index="${index}">
        <div class="etape-checkbox-container">
          <div class="etape-checkbox ${isCompleted ? 'checked' : ''}" onclick="toggleEtapeCheckbox(${index})">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
          </div>
        </div>
        <div class="etape-content">
          <span class="etape-numero">Étape ${index + 1}</span>
          <p class="etape-texte">${etape.description || etape.texte}</p>
          ${timerInfo}
        </div>
      </li>
    `;
  }).join('');
}

// Générer le HTML du timer info pour une étape
function generateTimerInfoHtml(etape, index, timerState) {
  const dureeMinutes = etape.timer_duree;
  let stateLabel = 'Non démarré';
  let stateClass = 'en-attente';

  if (timerState) {
    switch (timerState.etat) {
      case 'running':
        stateLabel = 'En cours';
        stateClass = 'en-cours';
        break;
      case 'paused':
        stateLabel = 'En pause';
        stateClass = 'pause';
        break;
      case 'finished':
        stateLabel = 'Terminé';
        stateClass = 'termine';
        break;
    }
  }

  return `
    <div class="etape-timer-info">
      <svg viewBox="0 0 24 24">
        <path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
      </svg>
      <span>Timer : ${dureeMinutes} min</span>
      <span class="etape-timer-badge ${stateClass}">${stateLabel}</span>
    </div>
  `;
}

// Toggle checkbox d'une étape
async function toggleEtapeCheckbox(index) {
  const recette = state.recetteEnCours;
  if (!recette) return;

  // Initialiser la progression si nécessaire
  if (!recette.progressionEtapes) {
    recette.progressionEtapes = { etapes: [] };
  }
  if (!recette.progressionEtapes.etapes[index]) {
    recette.progressionEtapes.etapes[index] = { validee: false };
  }

  // Toggle la validation
  recette.progressionEtapes.etapes[index].validee = !recette.progressionEtapes.etapes[index].validee;

  // Mise à jour visuelle immédiate
  const etapeItem = elements.enCoursEtapes.querySelector(`[data-index="${index}"]`);
  if (etapeItem) {
    etapeItem.classList.toggle('completed', recette.progressionEtapes.etapes[index].validee);
    const checkbox = etapeItem.querySelector('.etape-checkbox');
    if (checkbox) {
      checkbox.classList.toggle('checked', recette.progressionEtapes.etapes[index].validee);
    }
  }

  // Mise à jour progression globale
  mettreAJourProgressionGlobale();

  // Sauvegarder côté serveur
  try {
    await fetch(`${API_URL}/api/progression-recette`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        historiqueId: recette.id,
        progressionEtapes: recette.progressionEtapes
      })
    });
  } catch (error) {
    console.error('Erreur sauvegarde progression:', error);
  }
}

// Mettre à jour la barre de progression globale
function mettreAJourProgressionGlobale() {
  const recette = state.recetteEnCours;
  if (!recette || !recette.etapes) return;

  const totalEtapes = recette.etapes.length;
  const etapesValidees = (recette.progressionEtapes?.etapes || [])
    .filter(e => e && e.validee).length;

  const pourcentage = totalEtapes > 0 ? (etapesValidees / totalEtapes) * 100 : 0;

  elements.enCoursProgressionText.textContent = `${etapesValidees} / ${totalEtapes} étapes complétées`;
  elements.enCoursProgressionFill.style.width = `${pourcentage}%`;
}

// Terminer la recette en cours
async function terminerRecetteEnCours() {
  const recette = state.recetteEnCours;
  if (!recette) return;

  if (!confirm('Voulez-vous marquer cette recette comme terminée ?')) return;

  try {
    const response = await fetch(`${API_URL}/api/terminer-recette`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        historiqueId: recette.id
      })
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la terminaison');
    }

    // Recharger les compteurs
    await chargerCompteursRealisations();

    // Mettre à jour l'affichage si on est sur la page recettes
    afficherRecettes();

    // Vérifier s'il y a encore une recette en cours
    await verifierRecetteEnCours();

    // Retourner à l'historique
    state.recetteEnCours = null;
    navigateToPage('historique-recettes');

  } catch (error) {
    console.error('Erreur terminaison recette:', error);
    alert('Erreur lors de la terminaison de la recette');
  }
}

// Charger l'historique des recettes
async function chargerHistoriqueRecettes() {
  try {
    const params = new URLSearchParams();
    if (state.historiqueFiltre.statut) {
      params.append('statut', state.historiqueFiltre.statut);
    }
    if (state.historiqueFiltre.dateDebut) {
      params.append('dateDebut', state.historiqueFiltre.dateDebut);
    }
    if (state.historiqueFiltre.dateFin) {
      params.append('dateFin', state.historiqueFiltre.dateFin);
    }

    const url = `${API_URL}/api/historique-recettes${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 503) {
        return [];
      }
      throw new Error('Erreur chargement historique');
    }

    state.historiqueRecettes = await response.json();
    return state.historiqueRecettes;
  } catch (error) {
    console.warn('Historique non disponible:', error);
    state.historiqueRecettes = [];
    return [];
  }
}

// Filtrer l'historique des recettes
async function filtrerHistoriqueRecettes() {
  state.historiqueFiltre.statut = elements.historiqueFiltreStatut.value;
  state.historiqueFiltre.dateDebut = elements.historiqueDateDebut.value;
  state.historiqueFiltre.dateFin = elements.historiqueDateFin.value;

  await chargerHistoriqueRecettes();
  afficherHistoriqueRecettes();
}

// Afficher l'historique des recettes
function afficherHistoriqueRecettes() {
  const historique = state.historiqueRecettes;

  // Stats
  const enCours = historique.filter(h => h.statut === 'en_cours').length;
  const terminees = historique.filter(h => h.statut === 'terminee').length;

  elements.historiqueRecettesStats.innerHTML = `
    <div class="stat-badge en-cours">
      <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
      <span>${enCours} en cours</span>
    </div>
    <div class="stat-badge terminees">
      <svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
      <span>${terminees} terminées</span>
    </div>
  `;

  if (historique.length === 0) {
    elements.historiqueRecettesListe.classList.add('hidden');
    elements.historiqueRecettesEmpty.classList.remove('hidden');
    return;
  }

  elements.historiqueRecettesEmpty.classList.add('hidden');
  elements.historiqueRecettesListe.classList.remove('hidden');

  elements.historiqueRecettesListe.innerHTML = historique.map(entry => {
    const imageUrl = entry.photo
      ? `${PHOTOS_PATH}${entry.photo}`
      : entry.image || DEFAULT_IMAGE;

    const dateDebut = new Date(entry.dateDebut);
    const dateFin = entry.dateFin ? new Date(entry.dateFin) : null;

    const dureeText = entry.dureeMinutes
      ? `${Math.round(entry.dureeMinutes)} min`
      : 'En cours';

    return `
      <div class="historique-item" onclick="ouvrirHistoriqueRecette(${entry.id})">
        <img src="${imageUrl}" alt="${entry.recetteNom}" class="historique-item-image">
        <div class="historique-item-info">
          <div class="historique-item-nom">${entry.recetteNom}</div>
          <div class="historique-item-meta">
            <span>
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>
              ${dateDebut.toLocaleDateString('fr-FR')}
            </span>
            <span>
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
              ${dureeText}
            </span>
            <span>
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
              ${entry.nombrePersonnes} pers.
            </span>
          </div>
        </div>
        <span class="historique-item-statut ${entry.statut === 'en_cours' ? 'en-cours' : 'terminee'}">
          ${entry.statut === 'en_cours' ? 'En cours' : 'Terminée'}
        </span>
      </div>
    `;
  }).join('');
}

// Ouvrir une entrée de l'historique
async function ouvrirHistoriqueRecette(id) {
  try {
    const response = await fetch(`${API_URL}/api/historique-recettes/${id}`);
    if (!response.ok) throw new Error('Erreur chargement');

    const entry = await response.json();
    const recette = recettes.find(r => r.id === entry.recetteId);

    if (!recette) {
      alert('Recette non trouvée');
      return;
    }

    if (entry.statut === 'en_cours') {
      // Si en cours, ouvrir la recette en mode réalisation
      state.recetteActuelle = recette;
      state.nombrePersonnes = entry.nombrePersonnes || recette.personnes;
      state.personnesBase = recette.personnes;
      state.etapeActuelle = 0;
      state.vueToutes = false;
      state.sessionRealisationId = entry.id;
      state.recetteEnCours = entry;

      // Afficher les infos
      const imageUrl = getImageUrl(recette.image);
      elements.detailImage.src = imageUrl;
      elements.detailImage.alt = recette.nom;
      elements.detailImage.onerror = function () { this.src = DEFAULT_IMAGE; };
      elements.detailNom.textContent = recette.nom;
      elements.detailPrep.textContent = formatTemps(recette.tempsPreparation);
      elements.detailCuisson.textContent = formatTemps(recette.tempsCuisson);
      elements.nbPersonnes.textContent = state.nombrePersonnes;

      afficherIngredients();
      afficherEtapes();

      elements.pageTitle.textContent = recette.nom;
      navigateToPage('detail');

      // Basculer en mode réalisation
      basculerModeRealisation();
    } else {
      // Si terminée, afficher en mode consultation
      await afficherDetailRecette(recette.id);
    }
  } catch (error) {
    console.error('Erreur ouverture historique:', error);
    alert('Erreur lors de l\'ouverture de l\'entrée');
  }
}

// Obtenir le compteur de réalisations pour une recette
function getCompteurRealisations(recetteId) {
  return compteursRealisations[recetteId] || 0;
}

// ========================================
// FEATURE 3: CE SOIR JE CUISINE AVEC...
// ========================================

function ouvrirModalCeSoir() {
  elements.modalCeSoir.classList.add('active');
  state.ceSoirIngredients.clear();
  afficherIngredientsCeSoir();
  elements.ceSoirResultats.classList.add('hidden');
  mettreAJourCompteurCeSoir();
}

function fermerModalCeSoir() {
  elements.modalCeSoir.classList.remove('active');
}

function afficherIngredientsCeSoir(filtre = '') {
  const filtreNormalise = filtre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let html = '';

  ingredientsBase.forEach(categorie => {
    categorie.items.forEach(ing => {
      const nomNormalise = ing.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (filtreNormalise && !nomNormalise.includes(filtreNormalise)) return;

      const isSelected = state.ceSoirIngredients.has(ing);
      html += `<span class="ce-soir-ingredient ${isSelected ? 'selected' : ''}" onclick="toggleIngredientCeSoir('${ing.replace(/'/g, "\\'")}')">${ing}</span>`;
    });
  });

  elements.ceSoirIngredients.innerHTML = html || '<p style="padding: 1rem; color: var(--color-text-light);">Aucun ingrédient trouvé</p>';
}

function toggleIngredientCeSoir(nom) {
  if (state.ceSoirIngredients.has(nom)) {
    state.ceSoirIngredients.delete(nom);
  } else {
    state.ceSoirIngredients.add(nom);
  }
  afficherIngredientsCeSoir(elements.ceSoirRecherche.value);
  mettreAJourCompteurCeSoir();
}

function mettreAJourCompteurCeSoir() {
  elements.ceSoirCount.textContent = `${state.ceSoirIngredients.size} ingrédient(s) sélectionné(s)`;
}

function clearIngredientsCeSoir() {
  state.ceSoirIngredients.clear();
  afficherIngredientsCeSoir(elements.ceSoirRecherche.value);
  mettreAJourCompteurCeSoir();
  elements.ceSoirResultats.classList.add('hidden');
}

function chercherRecettesCeSoir() {
  if (state.ceSoirIngredients.size === 0) {
    alert('Veuillez sélectionner au moins un ingrédient');
    return;
  }

  const ingredientsDisponibles = Array.from(state.ceSoirIngredients).map(i =>
    i.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  );

  const resultats = recettes.map(recette => {
    const ingredientsRecette = recette.ingredients.map(i =>
      i.nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    );

    let matchCount = 0;
    ingredientsRecette.forEach(ing => {
      if (ingredientsDisponibles.some(disp => ing.includes(disp) || disp.includes(ing))) {
        matchCount++;
      }
    });

    const matchPercent = ingredientsRecette.length > 0 ? (matchCount / ingredientsRecette.length) * 100 : 0;

    return { recette, matchCount, matchPercent, totalIngredients: ingredientsRecette.length };
  }).filter(r => r.matchCount > 0)
    .sort((a, b) => b.matchPercent - a.matchPercent || b.matchCount - a.matchCount)
    .slice(0, 10);

  if (resultats.length === 0) {
    elements.ceSoirListe.innerHTML = '<p style="padding: 1rem; text-align: center; color: var(--color-text-light);">Aucune recette correspondante</p>';
  } else {
    elements.ceSoirListe.innerHTML = resultats.map(r => {
      const imageUrl = getImageUrl(r.recette.image);
      return `
        <div class="ce-soir-recette" onclick="fermerModalCeSoir(); afficherDetailRecette('${r.recette.id}');">
          <img src="${imageUrl}" alt="${r.recette.nom}" class="ce-soir-recette-img" onerror="this.src='${DEFAULT_IMAGE}'">
          <div class="ce-soir-recette-info">
            <div class="ce-soir-recette-nom">${r.recette.nom}</div>
            <div class="ce-soir-recette-match">
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
              ${r.matchCount}/${r.totalIngredients} ingrédients (${Math.round(r.matchPercent)}%)
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  elements.ceSoirResultats.classList.remove('hidden');
}

// ========================================
// FEATURE 5, 6, 7: STATISTIQUES
// ========================================

const BADGES = [
  { nom: 'Chef débutant', emoji: '👨‍🍳', seuil: 0 },
  { nom: 'Chef amateur', emoji: '👨‍🍳', seuil: 10 },
  { nom: 'Chef confirmé', emoji: '🧑‍🍳', seuil: 25 },
  { nom: 'Chef expérimenté', emoji: '👩‍🍳', seuil: 50 },
  { nom: 'Chef étoilé', emoji: '⭐', seuil: 100 },
  { nom: 'Chef légendaire', emoji: '🏆', seuil: 200 }
];

async function chargerStatistiques() {
  try {
    const response = await fetch(`${API_URL}/api/statistiques`);
    if (!response.ok) {
      if (response.status === 503) return null;
      throw new Error('Erreur chargement statistiques');
    }
    return await response.json();
  } catch (error) {
    console.warn('Statistiques non disponibles:', error);
    return null;
  }
}

async function afficherPageStatistiques() {
  const stats = await chargerStatistiques();

  if (!stats) {
    // Mode dégradé sans PostgreSQL
    elements.statsTotalRecettes.textContent = '0';
    elements.statsTempsTotal.textContent = '0h';
    elements.statsCeMois.textContent = '0';
    elements.statsFavoris.textContent = favoris.size;
    elements.statsTopRecettes.innerHTML = '<p style="text-align: center; color: var(--color-text-light);">Statistiques non disponibles (PostgreSQL requis)</p>';
    return;
  }

  // Résumé
  elements.statsTotalRecettes.textContent = stats.totalRealisations || 0;
  const heures = Math.floor((stats.tempsTotal || 0) / 60);
  const minutes = (stats.tempsTotal || 0) % 60;
  elements.statsTempsTotal.textContent = heures > 0 ? `${heures}h${minutes > 0 ? minutes : ''}` : `${minutes}min`;
  elements.statsCeMois.textContent = stats.ceMois || 0;
  elements.statsFavoris.textContent = stats.favorisRealises || 0;

  // Badge de progression (Feature 7)
  const totalRecettes = stats.totalRealisations || 0;
  const badgeActuel = BADGES.reduce((acc, b) => totalRecettes >= b.seuil ? b : acc, BADGES[0]);
  const badgeSuivant = BADGES.find(b => b.seuil > totalRecettes) || BADGES[BADGES.length - 1];

  elements.badgeProgression.innerHTML = `
    <div class="badge-icon">${badgeActuel.emoji}</div>
    <div class="badge-info">
      <span class="badge-titre">${badgeActuel.nom}</span>
      <span class="badge-details">${totalRecettes} recettes réalisées</span>
    </div>
  `;

  // Progression vers prochain badge
  const progressionContainer = document.getElementById('progression-badge');
  if (progressionContainer && badgeSuivant.seuil > badgeActuel.seuil) {
    const progress = ((totalRecettes - badgeActuel.seuil) / (badgeSuivant.seuil - badgeActuel.seuil)) * 100;
    progressionContainer.innerHTML = `
      <div class="progression-badge-info">
        <span class="badge-actuel">${badgeActuel.nom}</span>
        <span class="badge-suivant">→ ${badgeSuivant.nom} (${badgeSuivant.seuil} recettes)</span>
      </div>
      <div class="progression-bar-large">
        <div class="progression-fill" style="width: ${Math.min(progress, 100)}%"></div>
      </div>
      <span class="progression-label">${totalRecettes} / ${badgeSuivant.seuil} recettes</span>
    `;
  }

  // Top 10 recettes
  if (stats.topRecettes && stats.topRecettes.length > 0) {
    elements.statsTopRecettes.innerHTML = stats.topRecettes.map((item, index) => {
      const recette = recettes.find(r => r.id === item.recetteId);
      if (!recette) return '';
      const imageUrl = getImageUrl(recette.image);
      return `
        <div class="stats-top-item" onclick="afficherDetailRecette(${recette.id})">
          <span class="stats-top-rank">${index + 1}</span>
          <img src="${imageUrl}" alt="${recette.nom}" class="stats-top-img" onerror="this.src='${DEFAULT_IMAGE}'">
          <div class="stats-top-info">
            <div class="stats-top-nom">${recette.nom}</div>
            <div class="stats-top-count">${item.count} fois réalisée</div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    elements.statsTopRecettes.innerHTML = '<p style="text-align: center; color: var(--color-text-light);">Aucune recette réalisée pour le moment</p>';
  }

  // Stats par type
  afficherStatsParType(stats.parType || []);

  // Stats par origine
  afficherStatsParOrigine(stats.parOrigine || []);

  // Calendrier des réalisations (Feature 6)
  afficherCalendrierRealisations(stats.realisationsParJour || []);
}

function afficherStatsParType(data) {
  const colors = { entree: '#3498db', plat: '#e74c3c', dessert: '#f39c12' };
  const labels = { entree: 'Entrées', plat: 'Plats', dessert: 'Desserts' };
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    elements.statsParType.innerHTML = '<p style="text-align: center; color: var(--color-text-light);">Aucune donnée</p>';
    return;
  }

  elements.statsParType.innerHTML = data.map(d => {
    const percent = Math.round((d.count / total) * 100);
    return `
      <div class="stats-donut-item">
        <span class="stats-donut-color" style="background: ${colors[d.type] || '#999'}"></span>
        <span class="stats-donut-label">${labels[d.type] || d.type}</span>
        <div class="stats-donut-bar">
          <div class="stats-donut-fill" style="width: ${percent}%; background: ${colors[d.type] || '#999'}"></div>
        </div>
        <span class="stats-donut-value">${d.count}</span>
      </div>
    `;
  }).join('');
}

function afficherStatsParOrigine(data) {
  const colors = ['#e74c3c', '#3498db', '#27ae60', '#9b59b6', '#f39c12', '#1abc9c'];
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    elements.statsParOrigine.innerHTML = '<p style="text-align: center; color: var(--color-text-light);">Aucune donnée</p>';
    return;
  }

  elements.statsParOrigine.innerHTML = data.slice(0, 6).map((d, i) => {
    const percent = Math.round((d.count / total) * 100);
    return `
      <div class="stats-donut-item">
        <span class="stats-donut-color" style="background: ${colors[i % colors.length]}"></span>
        <span class="stats-donut-label">${d.origine || 'Non spécifié'}</span>
        <div class="stats-donut-bar">
          <div class="stats-donut-fill" style="width: ${percent}%; background: ${colors[i % colors.length]}"></div>
        </div>
        <span class="stats-donut-value">${d.count}</span>
      </div>
    `;
  }).join('');
}

// Feature 6: Calendrier des réalisations
function afficherCalendrierRealisations(realisations) {
  const mois = state.statsCalendrierMois;
  const annee = mois.getFullYear();
  const moisIndex = mois.getMonth();

  const premierJour = new Date(annee, moisIndex, 1);
  const dernierJour = new Date(annee, moisIndex + 1, 0);

  const joursSemaine = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  elements.calendrierMoisTitre.textContent = `${moisNoms[moisIndex]} ${annee}`;

  // Créer une map des réalisations par jour
  const realisationsMap = {};
  realisations.forEach(r => {
    const date = r.date.split('T')[0];
    realisationsMap[date] = (realisationsMap[date] || 0) + r.count;
  });

  let html = joursSemaine.map(j => `<span class="calendrier-jour-header">${j}</span>`).join('');

  // Trouver le premier lundi à afficher
  let jourDebut = new Date(premierJour);
  const premierJourSemaine = (premierJour.getDay() + 6) % 7; // 0 = lundi
  jourDebut.setDate(jourDebut.getDate() - premierJourSemaine);

  const aujourdhui = new Date().toISOString().split('T')[0];

  for (let i = 0; i < 42; i++) {
    const dateStr = jourDebut.toISOString().split('T')[0];
    const estAutreMois = jourDebut.getMonth() !== moisIndex;
    const estAujourdhui = dateStr === aujourdhui;
    const count = realisationsMap[dateStr] || 0;

    let classes = 'calendrier-jour';
    if (estAutreMois) classes += ' autre-mois';
    if (estAujourdhui) classes += ' today';
    if (count > 0) classes += ' has-realisation';

    html += `
      <div class="${classes}" data-date="${dateStr}" title="${count > 0 ? count + ' recette(s) réalisée(s)' : ''}">
        ${jourDebut.getDate()}
        ${count > 0 ? `<span class="calendrier-jour-count">${count}</span>` : ''}
      </div>
    `;

    jourDebut.setDate(jourDebut.getDate() + 1);
  }

  elements.calendrierRealisations.innerHTML = html;
}

function calendrierMoisPrecedent() {
  state.statsCalendrierMois.setMonth(state.statsCalendrierMois.getMonth() - 1);
  afficherPageStatistiques();
}

function calendrierMoisSuivant() {
  state.statsCalendrierMois.setMonth(state.statsCalendrierMois.getMonth() + 1);
  afficherPageStatistiques();
}

// ========================================
// FEATURE 8: PLANNING MENSUEL
// ========================================

function toggleVuePlanning(vue) {
  state.vuePlanning = vue;

  elements.btnVueSemaine.classList.toggle('active', vue === 'semaine');
  elements.btnVueMois.classList.toggle('active', vue === 'mois');

  if (elements.planningCalendrier) {
    elements.planningCalendrier.classList.toggle('hidden', vue === 'mois');
  }
  elements.planningMensuel.classList.toggle('hidden', vue === 'semaine');

  if (vue === 'mois') {
    afficherPlanningMensuel();
  } else {
    afficherPlanning();
  }
}

function afficherPlanningMensuel() {
  const mois = state.planningMoisActuel;
  const annee = mois.getFullYear();
  const moisIndex = mois.getMonth();

  const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  elements.planningPeriode.textContent = `${moisNoms[moisIndex]} ${annee}`;

  const premierJour = new Date(annee, moisIndex, 1);
  const dernierJour = new Date(annee, moisIndex + 1, 0);

  let jourDebut = new Date(premierJour);
  const premierJourSemaine = (premierJour.getDay() + 6) % 7;
  jourDebut.setDate(jourDebut.getDate() - premierJourSemaine);

  const aujourdhui = new Date().toISOString().split('T')[0];
  let html = '';

  for (let i = 0; i < 42; i++) {
    const dateStr = jourDebut.toISOString().split('T')[0];
    const estAutreMois = jourDebut.getMonth() !== moisIndex;
    const estAujourdhui = dateStr === aujourdhui;
    const planningJour = planning[dateStr] || {};

    let classes = 'planning-mensuel-jour';
    if (estAutreMois) classes += ' autre-mois';
    if (estAujourdhui) classes += ' today';

    const recettesHtml = [];
    if (planningJour.midi) {
      const midiId = planningJour.midi.recetteId || planningJour.midi;
      const recette = recettes.find(r => r.id === midiId);
      if (recette) {
        recettesHtml.push(`<div class="planning-mensuel-recette midi" title="${recette.nom}">${recette.nom}</div>`);
      }
    }
    if (planningJour.soir) {
      const soirId = planningJour.soir.recetteId || planningJour.soir;
      const recette = recettes.find(r => r.id === soirId);
      if (recette) {
        recettesHtml.push(`<div class="planning-mensuel-recette soir" title="${recette.nom}">${recette.nom}</div>`);
      }
    }

    html += `
      <div class="${classes}" onclick="ouvrirJourPlanning('${dateStr}')">
        <div class="planning-mensuel-numero">${jourDebut.getDate()}</div>
        <div class="planning-mensuel-recettes">${recettesHtml.join('')}</div>
      </div>
    `;

    jourDebut.setDate(jourDebut.getDate() + 1);
  }

  elements.planningMensuelGrille.innerHTML = html;
}

function ouvrirJourPlanning(dateStr) {
  // Si on est en vue mois, passer en vue semaine sur cette date
  const date = new Date(dateStr);
  const lundi = new Date(date);
  lundi.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  state.semaineActuelle = lundi;
  toggleVuePlanning('semaine');
}

// ========================================
// FEATURE 10: TAGS DYNAMIQUES ET DIFFICULTÉ
// ========================================

const TAG_ICONS = {
  'Végétarien': '🥬', 'Vegan': '🌱', 'Sans gluten': '🌾', 'Sans lactose': '🥛',
  'Sans oeufs': '🥚', 'Sans fruits à coque': '🥜', 'Thermomix': '🤖',
  'Protéiné': '💪', 'Léger': '🥗', 'Riche en fibres': '🌾', 'Comfort food': '😋',
  'Batch cooking': '📦', 'Rapide': '⚡', 'Économique': '💰', 'Fête': '🎉',
  'Pique-nique': '🧺', 'Bébé': '👶', 'Enfant': '👧', 'Été': '☀️',
  'Hiver': '❄️', 'Automne': '🍂', 'Printemps': '🌸'
};

const TAG_CATEGORIES_COLORS = {
  'Régimes alimentaires': '#27ae60',
  'Allergènes': '#e67e22',
  'Nutritionnel': '#3498db',
  'Autre': '#9b59b6'
};

function getTagIcon(tagNom) {
  return TAG_ICONS[tagNom] || '🏷️';
}

function getTagCategoryColor(categorie) {
  return TAG_CATEGORIES_COLORS[categorie] || '#95a5a6';
}

function getDifficulteLabel(niveau) {
  const labels = { 'Facile': '🟢 Facile', 'Moyen': '🟠 Moyen', 'Difficile': '🔴 Difficile' };
  return labels[niveau] || niveau;
}

function afficherDifficulteDetail(recette) {
  const container = document.getElementById('detail-difficulte');
  if (!container) return;
  if (recette.niveauDifficulte) {
    container.innerHTML = `<span class="difficulte-badge difficulte-${recette.niveauDifficulte.toLowerCase()}">${getDifficulteLabel(recette.niveauDifficulte)}</span>`;
    container.classList.remove('hidden');
  } else {
    container.innerHTML = '';
    container.classList.add('hidden');
  }
}

function afficherTagsRecette(recette) {
  if (!elements.detailTags) return;

  const tags = recette.tags || [];
  if (tags.length === 0) {
    elements.detailTags.innerHTML = '';
    return;
  }

  elements.detailTags.innerHTML = tags.map(tag =>
    `<span class="recette-tag" style="--tag-color: ${getTagCategoryColor(tag.categorie)}">${getTagIcon(tag.nom)} ${tag.nom}</span>`
  ).join('');
}

function genererTagsCarteRecette(recette) {
  const tags = recette.tags || [];
  if (tags.length === 0) return '';

  return `<div class="recette-card-tags">${tags.slice(0, 4).map(tag =>
    `<span class="recette-tag" style="--tag-color: ${getTagCategoryColor(tag.categorie)}" title="${tag.nom}">${getTagIcon(tag.nom)}</span>`
  ).join('')}${tags.length > 4 ? `<span class="recette-tag tag-more">+${tags.length - 4}</span>` : ''}</div>`;
}

// Afficher les tags comme des chips cliquables dans le panneau de filtre
function afficherTagsFiltreChips(filtre = '') {
  if (!elements.tagsFilterChips) return;
  const filtreNormalise = filtre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const tagsFiltres = filtre
    ? tagsBase.filter(tag => tag.nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(filtreNormalise))
    : tagsBase;

  elements.tagsFilterChips.innerHTML = tagsFiltres.map(tag => {
    const isSelected = state.filtreTagsSelectionnes.has(tag.id);
    return `
      <span class="ingredient-tag ${isSelected ? 'selected' : ''}" data-tag-id="${tag.id}">
        ${getTagIcon(tag.nom)} ${tag.nom}
      </span>
    `;
  }).join('');

  elements.tagsFilterChips.querySelectorAll('.ingredient-tag').forEach(chip => {
    chip.addEventListener('click', () => {
      const tagId = parseInt(chip.dataset.tagId);
      if (state.filtreTagsSelectionnes.has(tagId)) {
        state.filtreTagsSelectionnes.delete(tagId);
        chip.classList.remove('selected');
      } else {
        state.filtreTagsSelectionnes.add(tagId);
        chip.classList.add('selected');
      }
      mettreAJourCompteurTagsFiltre();
      filtrerRecettes();
    });
  });
}

function mettreAJourCompteurTagsFiltre() {
  if (!elements.tagsFilterCount) return;
  const count = state.filtreTagsSelectionnes.size;
  elements.tagsFilterCount.textContent = `${count} tag${count > 1 ? 's' : ''} sélectionné${count > 1 ? 's' : ''}`;
}

// Initialiser le panneau de filtre tags (appelé une fois au démarrage)
function remplirFiltreTags() {
  afficherTagsFiltreChips();
}

// Remplir les tags dans les formulaires d'ajout/édition
function remplirTagsFormulaire(containerId, selectedTagIds = new Set()) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const grouped = {};
  tagsBase.forEach(tag => {
    if (!grouped[tag.categorie]) grouped[tag.categorie] = [];
    grouped[tag.categorie].push(tag);
  });

  let html = '';
  Object.keys(grouped).forEach(cat => {
    html += `<div class="tags-categorie"><h4 style="color: ${getTagCategoryColor(cat)}">${cat}</h4><div class="tags-liste">`;
    grouped[cat].forEach(tag => {
      const checked = selectedTagIds.has(tag.id) ? 'selected' : '';
      html += `<span class="tag-selectable ${checked}" data-tag-id="${tag.id}" style="--tag-color: ${getTagCategoryColor(cat)}">${getTagIcon(tag.nom)} ${tag.nom}</span>`;
    });
    html += `</div></div>`;
  });
  container.innerHTML = html;

  // Event listeners pour toggle
  container.querySelectorAll('.tag-selectable').forEach(el => {
    el.addEventListener('click', () => {
      el.classList.toggle('selected');
    });
  });
}

function getSelectedTagIds(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  return Array.from(container.querySelectorAll('.tag-selectable.selected')).map(el => parseInt(el.dataset.tagId));
}

// ========================================
// FEATURE 16: NOTES PERSONNELLES
// ========================================

function ouvrirModalNotes(recetteId) {
  state.notesRecetteId = recetteId;
  elements.modalNotes.classList.add('active');
  elements.inputNouvelleNote.value = '';
  chargerNotesRecette(recetteId);
}

function fermerModalNotes() {
  elements.modalNotes.classList.remove('active');
  state.notesRecetteId = null;
}

async function chargerNotesRecette(recetteId) {
  try {
    const response = await fetch(`${API_URL}/api/notes-recette/${recetteId}`);
    if (!response.ok) {
      if (response.status === 503) {
        elements.notesHistorique.innerHTML = '<p class="notes-empty">Notes non disponibles (PostgreSQL requis)</p>';
        return;
      }
      throw new Error('Erreur chargement notes');
    }

    const notes = await response.json();
    afficherNotesRecette(notes);
  } catch (error) {
    console.error('Erreur chargement notes:', error);
    elements.notesHistorique.innerHTML = '<p class="notes-empty">Erreur lors du chargement des notes</p>';
  }
}

function afficherNotesRecette(notes) {
  if (!notes || notes.length === 0) {
    elements.notesHistorique.innerHTML = '<p class="notes-empty">Aucune note pour cette recette</p>';
    return;
  }

  elements.notesHistorique.innerHTML = notes.map(note => {
    const date = new Date(note.dateCreation);
    return `
      <div class="note-item" data-id="${note.id}">
        <div class="note-item-header">
          <span class="note-item-date">${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          <button class="note-item-delete" onclick="supprimerNote(${note.id})" title="Supprimer">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div class="note-item-content">${note.contenu}</div>
      </div>
    `;
  }).join('');
}

async function ajouterNote() {
  const contenu = elements.inputNouvelleNote.value.trim();
  if (!contenu) {
    alert('Veuillez entrer une note');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/notes-recette`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recetteId: state.notesRecetteId,
        contenu: contenu
      })
    });

    if (!response.ok) {
      if (response.status === 503) {
        alert('Cette fonctionnalité nécessite PostgreSQL');
        return;
      }
      throw new Error('Erreur ajout note');
    }

    elements.inputNouvelleNote.value = '';
    chargerNotesRecette(state.notesRecetteId);
  } catch (error) {
    console.error('Erreur ajout note:', error);
    alert('Erreur lors de l\'ajout de la note');
  }
}

async function supprimerNote(noteId) {
  if (!confirm('Supprimer cette note ?')) return;

  try {
    const response = await fetch(`${API_URL}/api/notes-recette/${noteId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Erreur suppression note');

    chargerNotesRecette(state.notesRecetteId);
  } catch (error) {
    console.error('Erreur suppression note:', error);
    alert('Erreur lors de la suppression de la note');
  }
}

// ========================================
// FEATURE 25: THÈMES PERSONNALISABLES
// ========================================

function ouvrirModalThemes() {
  elements.modalThemes.classList.add('active');
  chargerThemeActuel();
}

function fermerModalThemes() {
  elements.modalThemes.classList.remove('active');
}

function chargerThemeActuel() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    state.theme = JSON.parse(savedTheme);
  }

  // Mettre à jour les boutons de mode
  document.querySelectorAll('.theme-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === state.theme.mode);
  });

  // Mettre à jour les boutons de couleur
  document.querySelectorAll('.theme-color-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === state.theme.accent);
  });

  appliquerTheme();
}

function changerModeTheme(mode) {
  state.theme.mode = mode;
  sauvegarderTheme();
  appliquerTheme();

  document.querySelectorAll('.theme-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}

function changerCouleurAccent(couleur) {
  state.theme.accent = couleur;
  sauvegarderTheme();
  appliquerTheme();

  document.querySelectorAll('.theme-color-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === couleur);
  });
}

function sauvegarderTheme() {
  localStorage.setItem('theme', JSON.stringify(state.theme));
}

function appliquerTheme() {
  // Appliquer la couleur d'accent
  document.documentElement.style.setProperty('--color-primary', state.theme.accent);

  // Calculer couleur plus foncée pour hover
  const darkerColor = ajusterLuminosite(state.theme.accent, -20);
  document.documentElement.style.setProperty('--color-primary-dark', darkerColor);

  // Mode clair/sombre
  if (state.theme.mode === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}

function ajusterLuminosite(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
  return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// ========================================
// FEATURE 26: VUE LISTE/GRILLE
// ========================================

function toggleVueRecettes(vue) {
  state.vueRecettes = vue;
  localStorage.setItem('vueRecettes', vue);

  elements.btnVueGrille.classList.toggle('active', vue === 'grille');
  elements.btnVueListe.classList.toggle('active', vue === 'liste');

  elements.recettesGrid.classList.toggle('vue-liste', vue === 'liste');
}

// ========================================
// FEATURE 28: CONVERSION D'UNITÉS
// ========================================

const CONVERSIONS = {
  // Masse
  g: { base: 'g', factor: 1 },
  kg: { base: 'g', factor: 1000 },
  oz: { base: 'g', factor: 28.3495 },
  lb: { base: 'g', factor: 453.592 },
  // Volume
  ml: { base: 'ml', factor: 1 },
  cl: { base: 'ml', factor: 10 },
  l: { base: 'ml', factor: 1000 },
  tsp: { base: 'ml', factor: 5 },
  tbsp: { base: 'ml', factor: 15 },
  cup: { base: 'ml', factor: 250 },
  // Température
  c: { base: 'c', factor: 1 },
  f: { base: 'f', factor: 1 }
};

function ouvrirModalConversion() {
  elements.modalConversion.classList.add('active');
  elements.conversionValeur.value = '';
  elements.conversionResultat.textContent = '-';
}

function fermerModalConversion() {
  elements.modalConversion.classList.remove('active');
}

function effectuerConversion() {
  const valeur = parseFloat(elements.conversionValeur.value);
  const source = elements.conversionUniteSource.value;
  const cible = elements.conversionUniteCible.value;

  if (isNaN(valeur) || !source || !cible) {
    elements.conversionResultat.textContent = '-';
    return;
  }

  // Température - cas spécial
  if ((source === 'c' || source === 'f') && (cible === 'c' || cible === 'f')) {
    let resultat;
    if (source === 'c' && cible === 'f') {
      resultat = (valeur * 9/5) + 32;
    } else if (source === 'f' && cible === 'c') {
      resultat = (valeur - 32) * 5/9;
    } else {
      resultat = valeur;
    }
    elements.conversionResultat.textContent = `${resultat.toFixed(1)} ${cible === 'c' ? '°C' : '°F'}`;
    return;
  }

  // Vérifier que les unités sont compatibles
  const sourceInfo = CONVERSIONS[source];
  const cibleInfo = CONVERSIONS[cible];

  if (!sourceInfo || !cibleInfo || sourceInfo.base !== cibleInfo.base) {
    elements.conversionResultat.textContent = 'Incompatible';
    return;
  }

  // Convertir vers la base puis vers l'unité cible
  const valeurBase = valeur * sourceInfo.factor;
  const resultat = valeurBase / cibleInfo.factor;

  elements.conversionResultat.textContent = `${resultat.toFixed(2)} ${cible}`;
}

// ========================================
// INITIALISATION DES NOUVELLES FEATURES
// ========================================

// ========================================
// DASHBOARD
// ========================================

async function chargerDashboard() {
  try {
    const [dashboardRes, suggestionRes] = await Promise.all([
      fetch(`${API_URL}/api/dashboard/data`),
      fetch(`${API_URL}/api/suggestion`)
    ]);

    if (dashboardRes.ok) {
      const data = await dashboardRes.json();
      afficherDashboardRecentes(data.recentes || []);
      afficherDashboardFavoris(data.favoris || []);
      afficherDashboardPlanningJour(data.planningJour || {});
    }

    if (suggestionRes.ok) {
      const suggestion = await suggestionRes.json();
      afficherSuggestion(suggestion);
    }
  } catch (error) {
    console.error('Erreur chargement dashboard:', error);
  }
}

function afficherSuggestion(suggestion) {
  if (!elements.suggestionContenu) return;
  if (!suggestion || !suggestion.id) {
    elements.suggestionContenu.innerHTML = '<p class="widget-empty">Aucune suggestion disponible. Ajoutez des recettes !</p>';
    return;
  }

  const imageUrl = getImageUrl(suggestion.image);
  const difficulteHtml = suggestion.niveauDifficulte ? `<span class="difficulte-badge difficulte-${suggestion.niveauDifficulte.toLowerCase()}">${getDifficulteLabel(suggestion.niveauDifficulte)}</span>` : '';

  elements.suggestionContenu.innerHTML = `
    <div class="suggestion-card" data-id="${suggestion.id}">
      <img src="${imageUrl}" alt="${suggestion.nom}" onerror="this.src='${DEFAULT_IMAGE}'">
      <div class="suggestion-info">
        <h4>${suggestion.nom}</h4>
        <div class="suggestion-meta">
          <span>${formatTemps((suggestion.tempsPreparation || 0) + (suggestion.tempsCuisson || 0))}</span>
          <span>${suggestion.personnes || 4} pers.</span>
          ${difficulteHtml}
        </div>
        ${suggestion.raison ? `<p class="suggestion-raison">${suggestion.raison}</p>` : ''}
      </div>
    </div>
  `;

  elements.suggestionContenu.querySelector('.suggestion-card')?.addEventListener('click', () => {
    afficherDetailRecette(suggestion.id);
  });
}

function afficherDashboardRecentes(recettesList) {
  if (!elements.recentesContenu) return;
  if (recettesList.length === 0) {
    elements.recentesContenu.innerHTML = '<p class="widget-empty">Aucune recette récente</p>';
    return;
  }

  elements.recentesContenu.innerHTML = `<div class="widget-recettes-list">${recettesList.slice(0, 5).map(r => `
    <div class="widget-recette-item" data-id="${r.id}">
      <img src="${getImageUrl(r.image)}" alt="${r.nom}" onerror="this.src='${DEFAULT_IMAGE}'">
      <span>${r.nom}</span>
    </div>
  `).join('')}</div>`;

  elements.recentesContenu.querySelectorAll('.widget-recette-item').forEach(el => {
    el.addEventListener('click', () => afficherDetailRecette(el.dataset.id));
  });
}

function afficherDashboardFavoris(favorisList) {
  if (!elements.favorisDashboardContenu) return;
  if (favorisList.length === 0) {
    elements.favorisDashboardContenu.innerHTML = '<p class="widget-empty">Aucun favori</p>';
    return;
  }

  elements.favorisDashboardContenu.innerHTML = `<div class="widget-recettes-list">${favorisList.slice(0, 5).map(r => `
    <div class="widget-recette-item" data-id="${r.id}">
      <img src="${getImageUrl(r.image)}" alt="${r.nom}" onerror="this.src='${DEFAULT_IMAGE}'">
      <span>${r.nom}</span>
    </div>
  `).join('')}</div>`;

  elements.favorisDashboardContenu.querySelectorAll('.widget-recette-item').forEach(el => {
    el.addEventListener('click', () => afficherDetailRecette(el.dataset.id));
  });
}

function afficherDashboardPlanningJour(planningJour) {
  if (!elements.planningJourContenu) return;
  const midi = planningJour.midi;
  const soir = planningJour.soir;

  if (!midi && !soir) {
    elements.planningJourContenu.innerHTML = '<p class="widget-empty">Rien de prévu aujourd\'hui</p>';
    return;
  }

  let html = '';
  if (midi) {
    const recette = recettes.find(r => r.id === midi);
    if (recette) {
      html += `<div class="planning-jour-repas"><span class="repas-label-small">Midi</span><div class="widget-recette-item" data-id="${recette.id}"><img src="${getImageUrl(recette.image)}" alt="${recette.nom}" onerror="this.src='${DEFAULT_IMAGE}'"><span>${recette.nom}</span></div></div>`;
    }
  }
  if (soir) {
    const recette = recettes.find(r => r.id === soir);
    if (recette) {
      html += `<div class="planning-jour-repas"><span class="repas-label-small">Soir</span><div class="widget-recette-item" data-id="${recette.id}"><img src="${getImageUrl(recette.image)}" alt="${recette.nom}" onerror="this.src='${DEFAULT_IMAGE}'"><span>${recette.nom}</span></div></div>`;
    }
  }

  elements.planningJourContenu.innerHTML = html;
  elements.planningJourContenu.querySelectorAll('.widget-recette-item').forEach(el => {
    el.addEventListener('click', () => afficherDetailRecette(el.dataset.id));
  });
}

// ========================================
// NOTIFICATIONS
// ========================================

async function chargerPageNotifications() {
  // Vérifier le statut des permissions
  updateNotifPermissionStatus();

  try {
    const response = await fetch(`${API_URL}/api/notification-settings`);
    if (response.ok) {
      const settings = await response.json();
      state.notificationSettings = settings;

      if (elements.notifTimer) elements.notifTimer.checked = settings.timerEnabled !== false;
      if (elements.notifRappelRepas) elements.notifRappelRepas.checked = settings.rappelRepasEnabled === true;
      if (elements.notifHeureRappel) elements.notifHeureRappel.value = settings.rappelHeure || '18:00';

      // Jours actifs
      const jours = settings.rappelJours || [1, 2, 3, 4, 5];
      document.querySelectorAll('#rappel-jours-options .jour-checkbox input').forEach(cb => {
        cb.checked = jours.includes(parseInt(cb.value));
      });
    }
  } catch (error) {
    console.error('Erreur chargement notifications:', error);
  }
}

function updateNotifPermissionStatus() {
  if (!elements.notifPermissionStatus) return;
  if (!('Notification' in window)) {
    elements.notifPermissionStatus.textContent = 'Statut : Les notifications ne sont pas supportées par ce navigateur';
    elements.btnDemanderNotif.classList.add('hidden');
    return;
  }

  const permission = Notification.permission;
  if (permission === 'granted') {
    elements.notifPermissionStatus.textContent = 'Statut : Notifications autorisées';
    elements.btnDemanderNotif.classList.add('hidden');
  } else if (permission === 'denied') {
    elements.notifPermissionStatus.textContent = 'Statut : Notifications bloquées. Modifiez les paramètres de votre navigateur.';
    elements.btnDemanderNotif.classList.add('hidden');
  } else {
    elements.notifPermissionStatus.textContent = 'Statut : Permission non accordée';
    elements.btnDemanderNotif.classList.remove('hidden');
  }
}

async function demanderPermissionNotification() {
  if (!('Notification' in window)) return;
  const permission = await Notification.requestPermission();
  updateNotifPermissionStatus();
  if (permission === 'granted') {
    new Notification('Cuisine PWA', { body: 'Les notifications sont activées !' });
  }
}

async function sauverNotificationSettings() {
  const settings = {
    timerEnabled: elements.notifTimer ? elements.notifTimer.checked : true,
    rappelRepasEnabled: elements.notifRappelRepas ? elements.notifRappelRepas.checked : false,
    rappelHeure: elements.notifHeureRappel ? elements.notifHeureRappel.value : '18:00',
    rappelJours: Array.from(document.querySelectorAll('#rappel-jours-options .jour-checkbox input:checked')).map(cb => parseInt(cb.value))
  };

  try {
    const response = await fetch(`${API_URL}/api/notification-settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (response.ok) {
      state.notificationSettings = settings;
      alert('Paramètres de notifications enregistrés !');
      planifierRappelRepas();
    }
  } catch (error) {
    console.error('Erreur sauvegarde notifications:', error);
    alert('Erreur lors de la sauvegarde');
  }
}

let rappelRepasTimeout = null;

function planifierRappelRepas() {
  if (rappelRepasTimeout) clearTimeout(rappelRepasTimeout);
  if (!state.notificationSettings || !state.notificationSettings.rappelRepasEnabled) return;
  if (Notification.permission !== 'granted') return;

  const now = new Date();
  const jourSemaine = now.getDay(); // 0=Dim, 1=Lun...
  const joursActifs = state.notificationSettings.rappelJours || [1, 2, 3, 4, 5];

  if (!joursActifs.includes(jourSemaine)) return;

  const [heures, minutes] = (state.notificationSettings.rappelHeure || '18:00').split(':').map(Number);
  const rappelTime = new Date(now);
  rappelTime.setHours(heures, minutes, 0, 0);

  const delai = rappelTime.getTime() - now.getTime();
  if (delai > 0) {
    rappelRepasTimeout = setTimeout(() => {
      new Notification('Cuisine PWA', {
        body: 'Qu\'est-ce qu\'on mange ce soir ? Consultez votre planning !',
        icon: 'images/icon-192.png'
      });
    }, delai);
  }
}

// ========================================
// ÉQUILIBRE NUTRITIONNEL
// ========================================

async function chargerEquilibreNutritionnel() {
  if (!elements.equilibreBarres || !elements.equilibreAlertes) return;

  const lundi = state.semaineActuelle;
  if (!lundi) return;

  const dimanche = new Date(lundi);
  dimanche.setDate(dimanche.getDate() + 6);

  const dateDebut = formatDateKey(lundi);
  const dateFin = formatDateKey(dimanche);

  try {
    const response = await fetch(`${API_URL}/api/equilibre-nutritionnel?dateDebut=${dateDebut}&dateFin=${dateFin}`);
    if (!response.ok) return;

    const data = await response.json();
    afficherEquilibreBarres(data);
    afficherEquilibreAlertes(data);
  } catch (error) {
    console.error('Erreur chargement équilibre:', error);
  }
}

function afficherEquilibreBarres(data) {
  if (!elements.equilibreBarres) return;

  const categories = data.categories || {};
  const total = Object.values(categories).reduce((a, b) => a + b, 0) || 1;

  const colors = {
    'Régimes alimentaires': '#27ae60',
    'Allergènes': '#e67e22',
    'Nutritionnel': '#3498db',
    'Autre': '#9b59b6'
  };

  let html = '<div class="equilibre-resume">';
  html += `<p><strong>${data.totalRepas || 0}</strong> repas planifiés cette semaine</p>`;
  html += '</div>';

  if (data.tags && data.tags.length > 0) {
    html += '<div class="equilibre-tags-repartition">';
    data.tags.forEach(tag => {
      const pourcent = Math.round((tag.count / total) * 100);
      html += `
        <div class="equilibre-tag-bar">
          <span class="equilibre-tag-label">${getTagIcon(tag.nom)} ${tag.nom}</span>
          <div class="equilibre-bar-track">
            <div class="equilibre-bar-fill" style="width: ${pourcent}%; background: ${colors[tag.categorie] || '#95a5a6'}"></div>
          </div>
          <span class="equilibre-tag-count">${tag.count}</span>
        </div>
      `;
    });
    html += '</div>';
  } else {
    html += '<p class="widget-empty">Aucune donnée nutritionnelle pour cette semaine</p>';
  }

  elements.equilibreBarres.innerHTML = html;
}

function afficherEquilibreAlertes(data) {
  if (!elements.equilibreAlertes) return;

  const alertes = [];
  const totalRepas = data.totalRepas || 0;

  if (totalRepas === 0) {
    elements.equilibreAlertes.innerHTML = '';
    return;
  }

  // Vérifier la variété
  const tagsByCategorie = {};
  (data.tags || []).forEach(t => {
    if (!tagsByCategorie[t.categorie]) tagsByCategorie[t.categorie] = 0;
    tagsByCategorie[t.categorie] += t.count;
  });

  if (totalRepas >= 7 && !tagsByCategorie['Régimes alimentaires']) {
    alertes.push({ type: 'info', message: 'Pensez à varier avec des repas végétariens ou vegan cette semaine.' });
  }

  if (totalRepas < 10) {
    alertes.push({ type: 'warning', message: `Seulement ${totalRepas} repas planifiés. Complétez votre planning pour un meilleur équilibre.` });
  }

  if (alertes.length === 0) {
    alertes.push({ type: 'success', message: 'Bon équilibre nutritionnel cette semaine !' });
  }

  elements.equilibreAlertes.innerHTML = alertes.map(a =>
    `<div class="equilibre-alerte alerte-${a.type}">${a.message}</div>`
  ).join('');
}

function initialiserNouvellesFeaturesEvenements() {
  // Feature 3: Ce soir je cuisine avec...
  if (elements.btnCeSoir) {
    elements.btnCeSoir.addEventListener('click', ouvrirModalCeSoir);
  }
  if (elements.btnCloseModalCeSoir) {
    elements.btnCloseModalCeSoir.addEventListener('click', fermerModalCeSoir);
  }
  if (elements.ceSoirRecherche) {
    elements.ceSoirRecherche.addEventListener('input', (e) => afficherIngredientsCeSoir(e.target.value));
  }
  if (elements.btnCeSoirClear) {
    elements.btnCeSoirClear.addEventListener('click', clearIngredientsCeSoir);
  }
  if (elements.btnCeSoirChercher) {
    elements.btnCeSoirChercher.addEventListener('click', chercherRecettesCeSoir);
  }
  if (elements.modalCeSoir) {
    elements.modalCeSoir.addEventListener('click', (e) => {
      if (e.target === elements.modalCeSoir) fermerModalCeSoir();
    });
  }

  // Feature 5, 6, 7: Statistiques
  if (elements.btnCalendrierMoisPrec) {
    elements.btnCalendrierMoisPrec.addEventListener('click', calendrierMoisPrecedent);
  }
  if (elements.btnCalendrierMoisSuiv) {
    elements.btnCalendrierMoisSuiv.addEventListener('click', calendrierMoisSuivant);
  }

  // Feature 8: Planning mensuel
  if (elements.btnVueSemaine) {
    elements.btnVueSemaine.addEventListener('click', () => toggleVuePlanning('semaine'));
  }
  if (elements.btnVueMois) {
    elements.btnVueMois.addEventListener('click', () => toggleVuePlanning('mois'));
  }

  // Feature 16: Notes
  if (elements.btnNotesRecette) {
    elements.btnNotesRecette.addEventListener('click', () => {
      if (state.recetteActuelle) ouvrirModalNotes(state.recetteActuelle.id);
    });
  }
  if (elements.btnCloseModalNotes) {
    elements.btnCloseModalNotes.addEventListener('click', fermerModalNotes);
  }
  if (elements.btnAjouterNote) {
    elements.btnAjouterNote.addEventListener('click', ajouterNote);
  }
  if (elements.modalNotes) {
    elements.modalNotes.addEventListener('click', (e) => {
      if (e.target === elements.modalNotes) fermerModalNotes();
    });
  }

  // Feature 25: Thèmes
  if (elements.btnTheme) {
    elements.btnTheme.addEventListener('click', ouvrirModalThemes);
  }
  if (elements.btnCloseModalThemes) {
    elements.btnCloseModalThemes.addEventListener('click', fermerModalThemes);
  }
  if (elements.modalThemes) {
    elements.modalThemes.addEventListener('click', (e) => {
      if (e.target === elements.modalThemes) fermerModalThemes();
    });
  }
  document.querySelectorAll('.theme-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => changerModeTheme(btn.dataset.mode));
  });
  document.querySelectorAll('.theme-color-btn').forEach(btn => {
    btn.addEventListener('click', () => changerCouleurAccent(btn.dataset.color));
  });

  // Feature 26: Vue liste/grille
  if (elements.btnVueGrille) {
    elements.btnVueGrille.addEventListener('click', () => toggleVueRecettes('grille'));
  }
  if (elements.btnVueListe) {
    elements.btnVueListe.addEventListener('click', () => toggleVueRecettes('liste'));
  }

  // Feature 28: Conversion
  if (elements.btnConversion) {
    elements.btnConversion.addEventListener('click', ouvrirModalConversion);
  }
  if (elements.btnCloseModalConversion) {
    elements.btnCloseModalConversion.addEventListener('click', fermerModalConversion);
  }
  if (elements.modalConversion) {
    elements.modalConversion.addEventListener('click', (e) => {
      if (e.target === elements.modalConversion) fermerModalConversion();
    });
  }
  if (elements.conversionValeur) {
    elements.conversionValeur.addEventListener('input', effectuerConversion);
  }
  if (elements.conversionUniteSource) {
    elements.conversionUniteSource.addEventListener('change', effectuerConversion);
  }
  if (elements.conversionUniteCible) {
    elements.conversionUniteCible.addEventListener('change', effectuerConversion);
  }

  // Dashboard
  if (elements.btnRefreshSuggestion) {
    elements.btnRefreshSuggestion.addEventListener('click', async () => {
      elements.suggestionContenu.innerHTML = '<p class="widget-loading">Chargement...</p>';
      try {
        const res = await fetch(`${API_URL}/api/suggestion`);
        if (res.ok) afficherSuggestion(await res.json());
      } catch (e) { console.error(e); }
    });
  }

  // Filtres difficulté et tags
  if (elements.filtreDifficulte) {
    elements.filtreDifficulte.addEventListener('change', filtrerRecettes);
  }

  // Toggle panneau tags
  if (elements.btnToggleTags) {
    elements.btnToggleTags.addEventListener('click', () => {
      state.tagsPanelOpen = !state.tagsPanelOpen;
      elements.tagsFilterPanel.classList.toggle('hidden', !state.tagsPanelOpen);
      elements.btnToggleTags.classList.toggle('active', state.tagsPanelOpen);
    });
  }

  // Recherche tags
  if (elements.tagsFilterSearch) {
    elements.tagsFilterSearch.addEventListener('input', (e) => {
      afficherTagsFiltreChips(e.target.value);
    });
  }

  // Effacer sélection tags
  if (elements.btnClearTags) {
    elements.btnClearTags.addEventListener('click', () => {
      state.filtreTagsSelectionnes.clear();
      afficherTagsFiltreChips(elements.tagsFilterSearch ? elements.tagsFilterSearch.value : '');
      mettreAJourCompteurTagsFiltre();
      filtrerRecettes();
    });
  }

  // Notifications
  if (elements.btnDemanderNotif) {
    elements.btnDemanderNotif.addEventListener('click', demanderPermissionNotification);
  }
  if (elements.btnSauverNotifications) {
    elements.btnSauverNotifications.addEventListener('click', sauverNotificationSettings);
  }

  // Équilibre nutritionnel toggle
  if (elements.btnToggleEquilibre) {
    elements.btnToggleEquilibre.addEventListener('click', () => {
      elements.equilibreContenu.classList.toggle('hidden');
      elements.btnToggleEquilibre.classList.toggle('active');
      if (!elements.equilibreContenu.classList.contains('hidden')) {
        chargerEquilibreNutritionnel();
      }
    });
  }

  // Charger les préférences sauvegardées
  const savedVue = localStorage.getItem('vueRecettes');
  if (savedVue) {
    toggleVueRecettes(savedVue);
  }

  // Appliquer le thème sauvegardé
  chargerThemeActuel();
}

// === Initialisation de l'application ===

async function init() {
  initElements();
  await Promise.all([
    chargerRecettes(),
    chargerIngredients(),
    chargerUnites(),
    chargerOrigines(),
    chargerTags(),
    chargerPlanning(),
    chargerFavoris(),
    chargerHistoriqueCourses(),
    chargerCompteursRealisations(),
    verifierRecetteEnCours()
  ]);
  remplirFiltreOrigines();
  remplirFiltreTags();
  afficherTagsIngredients();
  initialiserEvenements();
  initialiserNouvellesFeaturesEvenements();
  // Charger le dashboard (page d'accueil par défaut)
  navigateToPage('dashboard');
  // Planifier le rappel repas
  planifierRappelRepas();
}

// Démarrer l'application
document.addEventListener('DOMContentLoaded', init);
