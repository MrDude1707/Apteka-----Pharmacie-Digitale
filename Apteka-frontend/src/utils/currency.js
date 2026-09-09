export function formatMoney(amount, currency = 'MGA') {
  const value = Number(amount);
  if (!Number.isFinite(value)) return 'N/A';
  if (String(currency).toUpperCase() === 'EUR') {
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }
  return Math.round(value).toLocaleString('fr-FR') + ' MGA';
}
