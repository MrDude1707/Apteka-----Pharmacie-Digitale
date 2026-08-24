/**
 * Un limiteur de débit (Rate Limiter) en mémoire, léger et sans dépendances.
 * Protège les routes sensibles comme la connexion ou la validation de l'OTP contre le brute-force.
 */
const rateLimitStore = new Map();

// Nettoyage régulier des adresses IP expirées pour éviter les fuites de mémoire (toutes les 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 10 * 60 * 1000).unref(); // .unref() pour permettre la fermeture propre du processus Node si besoin

/**
 * Crée une instance de middleware de limitation de débit
 * @param {Object} options Configuration du limiteur
 * @param {number} options.windowMs Fenêtre de temps en millisecondes
 * @param {number} options.max Nombre maximum de requêtes autorisées par fenêtre
 * @param {string} options.message Message renvoyé en cas de dépassement
 */
function createLimiter({ windowMs, max, message }) {
  return function limiter(req, res, next) {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let clientData = rateLimitStore.get(ip);

    if (!clientData || now > clientData.resetTime) {
      // Premier accès ou la fenêtre de temps a expiré, on initialise
      clientData = {
        count: 1,
        resetTime: now + windowMs
      };
      rateLimitStore.set(ip, clientData);
    } else {
      // Incrémentation dans la fenêtre en cours
      clientData.count++;
    }

    // Définir les en-têtes standard HTTP de limitation de débit
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - clientData.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(clientData.resetTime / 1000));

    if (clientData.count > max) {
      const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: message || "Trop de tentatives de requêtes depuis cette adresse. Veuillez patienter avant de réessayer.",
        retryAfter
      });
    }

    next();
  };
}

module.exports = {
  createLimiter
};
