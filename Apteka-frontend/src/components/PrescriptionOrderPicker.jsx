import React, { useEffect, useState } from 'react';
import { API_URL } from '../config';

export default function PrescriptionOrderPicker({ prescription, onSelect, onCancel }) {
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      try {
        const response = await fetch(API_URL + '/api/patient/ordonnances/' + prescription.id + '/pharmacies',
          { signal: abort.signal, headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setOptions(data); setSelected(data[0]?.pharmacie.id || '');
      } catch (err) { if (err.name !== 'AbortError') setError(err.message); }
      finally { if (!abort.signal.aborted) setLoading(false); }
    })();
    return () => abort.abort();
  }, [prescription.id]);
  return <div className="glass-premium-dark space-y-4 rounded-3xl p-6 text-left">
    <h3 className="text-xl text-white">Commander l’ordonnance {prescription.code}</h3>
    <p className="text-sm text-white/70">Les médicaments et quantités restent ceux prescrits. Choisissez une officine capable de fournir toute l’ordonnance.</p>
    {loading ? <p role="status">Vérification des disponibilités…</p> : error ? <p role="alert" className="text-red-300">{error}</p> : options.length ? <>
      <label className="block text-sm text-white">Officine
        <select value={selected} onChange={e => setSelected(e.target.value)} className="mt-2 w-full rounded-xl bg-zinc-900 p-3 text-white">
          {options.map(o => <option key={o.pharmacie.id} value={o.pharmacie.id}>{o.pharmacie.name}</option>)}
        </select>
      </label>
      <button type="button" className="rounded-xl bg-white px-5 py-3 font-bold text-black" onClick={() => onSelect(options.find(o => o.pharmacie.id === selected).items)}>Préparer le panier prescrit</button>
    </> : <p>Aucune officine ne possède actuellement tous les produits nécessaires.</p>}
    <button type="button" onClick={onCancel} className="ml-3 rounded-xl border border-white/20 px-4 py-3 text-sm text-white">Fermer</button>
  </div>;
}
