// URL de base de l'API backend.
// En développement, définie dans .env (VITE_API_URL=http://localhost:3001)
// En production, à définir dans les variables d'environnement de l'hébergeur du frontend.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Intercepteur global de fetch pour gérer les exclusions et blocages de compte en temps réel
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  const response = await originalFetch(...args);

  // Si l'API retourne un statut 403 (ou 401) lié à un compte bloqué ou restreint
  if (response.status === 403 || response.status === 401) {
    try {
      const clone = response.clone();
      const data = await clone.json();

      if (data && data.error && (
        data.error.toLowerCase().includes('suspendu') || 
        data.error.toLowerCase().includes('désactivé') || 
        data.error.toLowerCase().includes('bloqué') ||
        data.error.toLowerCase().includes('supprimé')
      )) {
        alert(`⚠️ Sécurité Apteka : ${data.error}`);
        localStorage.removeItem('token');
        // Recharger pour réinitialiser l'état React et rediriger vers la page d'accueil
        window.location.href = window.location.origin;
      }
    } catch (e) {
      // Ignorer silencieusement si la réponse n'est pas du JSON valide
    }
  }

  return response;
};
