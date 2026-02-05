# ============================================
# Dockerfile pour Cuisine PWA
# ============================================

FROM node:20-alpine

# Métadonnées
LABEL maintainer="Cuisine PWA"
LABEL description="Application de gestion de recettes"

# Créer le répertoire de travail
WORKDIR /app

# Installer les dépendances système nécessaires
RUN apk add --no-cache dumb-init

# Copier les fichiers package.json en premier pour le cache Docker
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le reste des fichiers de l'application
COPY . .

# Créer les répertoires nécessaires
RUN mkdir -p /app/photos /app/recettes /app/data

# Définir l'utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Exposer le port
EXPOSE 3000

# Utiliser dumb-init pour une meilleure gestion des signaux
ENTRYPOINT ["dumb-init", "--"]

# Commande de démarrage
CMD ["node", "server.js"]
