const { randomUUID } = require('node:crypto');
const { createCareWorkflows, WorkflowError } = require('./careWorkflows');

function createCheckoutWorkflows(db, stripe, env = process.env) {
  const care = createCareWorkflows(db);
  const demoEnabled = () => env.NODE_ENV !== 'production' && env.DEMO_PAYMENTS === 'true';

  async function create(patientId, data) {
    const allowed = (env.APP_URL || env.FRONTEND_URL || 'http://localhost:5173').split(',').map(v => v.trim());
    const frontendUrl = data.frontendUrl || allowed[0];
    if (!allowed.includes(frontendUrl)) throw new WorkflowError(400, 'Origine de retour non autorisée.');
    const demo = demoEnabled();
    if (!demo && !env.STRIPE_SECRET_KEY) throw new WorkflowError(503, 'Paiement en ligne indisponible. Vous pouvez réserver et payer en officine.');
    const commande = await care.order(patientId, data, 'EN_ATTENTE_DE_PAIEMENT');
    let session;
    try {
      if (demo) {
        session = { id: 'mock_' + randomUUID() };
        session.url = frontendUrl + '/?payment=success&commande_id=' + commande.id + '&session_id=' + session.id;
      } else {
        session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'], mode: 'payment',
          line_items: commande.items.map(item => ({
            price_data: { currency: 'eur', product_data: { name: item.medicament.nom },
              unit_amount: Math.round(item.medicament.prix * 100) }, quantity: item.qty
          })),
          success_url: frontendUrl + '/?payment=success&commande_id=' + commande.id + '&session_id={CHECKOUT_SESSION_ID}',
          cancel_url: frontendUrl + '/?payment=cancel&commande_id=' + commande.id,
          metadata: { commandeId: commande.id, patientId }
        }, { idempotencyKey: 'checkout-' + commande.id });
      }
      await db.commande.update({ where: { id: commande.id }, data: { stripeSessionId: session.id } });
      return { url: session.url, sessionId: session.id };
    } catch (error) {
      // Never release units while a real Checkout session might still be payable.
      let safeToRelease = !session && ['StripeInvalidRequestError', 'StripeAuthenticationError', 'StripePermissionError'].includes(error.type);
      if (session) {
        if (demo) safeToRelease = true;
        else {
          try {
            const closed = await stripe.checkout.sessions.expire(session.id);
            safeToRelease = closed.status === 'expired' && closed.payment_status !== 'paid';
          } catch { /* Ambiguous: leave inventory reserved for reconciliation. */ }
        }
      }
      if (safeToRelease) {
        let released = false;
        try {
          await care.cancelOrder(patientId, commande.id);
          released = true;
        } catch { /* Keep the explicit reconciliation path if local cleanup fails. */ }
        if (released) throw new WorkflowError(502, 'Paiement non démarré. La réservation a été annulée et le stock libéré. Réessayez ou choisissez le paiement en officine.');
      }
      throw new WorkflowError(502, 'Paiement à rapprocher pour la commande ' + commande.id + '. La réservation est conservée pour éviter un double achat. Contactez l’assistance.');
    }
  }

  async function cancel(patientId, commandeId) {
    const cmd = await db.commande.findUnique({ where: { id: commandeId } });
    if (!cmd || cmd.patientId !== patientId) throw new WorkflowError(404, 'Commande introuvable.');
    if (cmd.status === 'EN_ATTENTE_DE_PAIEMENT') {
      if (!cmd.stripeSessionId) throw new WorkflowError(409, 'Session de paiement à rapprocher. Contactez l’assistance avant de libérer cette réservation.');
      if (cmd.stripeSessionId.startsWith('mock_')) {
        if (!demoEnabled()) throw new WorkflowError(409, 'Session de démonstration indisponible.');
      } else {
        let session = await stripe.checkout.sessions.retrieve(cmd.stripeSessionId);
        if (session.metadata?.commandeId !== cmd.id || session.metadata?.patientId !== patientId) throw new WorkflowError(409, 'Session de paiement incohérente.');
        if (session.status === 'open') session = await stripe.checkout.sessions.expire(session.id);
        if (session.status !== 'expired' || session.payment_status === 'paid') throw new WorkflowError(409, 'Cette session ne peut pas être annulée. Vérifiez son paiement.');
      }
    }
    return care.cancelOrder(patientId, cmd.id);
  }
  return { create, cancel };
}
module.exports = { createCheckoutWorkflows };
