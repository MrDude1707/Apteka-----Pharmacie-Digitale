// URL de base de l'API backend.
// En développement, définie dans .env (VITE_API_URL=http://localhost:3001)
// En production, à définir dans les variables d'environnement de l'hébergeur du frontend.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
