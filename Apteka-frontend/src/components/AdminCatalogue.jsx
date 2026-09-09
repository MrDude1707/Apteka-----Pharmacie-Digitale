import React, { useEffect, useState } from 'react';
import { API_URL } from '../config';
import { notify } from '../utils/notify';

export default function AdminCatalogue() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], pages: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(API_URL + '/api/auth/admin/catalogue?search=' + encodeURIComponent(search) + '&page=' + page,
          { signal: abort.signal, headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Catalogue indisponible.');
        setData(result); setError('');
      } catch (err) { if (err.name !== 'AbortError') setError(err.message); }
      finally { if (!abort.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [search, page, version]);
  async function save(event) {
    event.preventDefault(); if (saving) return;
    setSaving(true);
    try {
      const response = await fetch(API_URL + '/api/auth/admin/catalogue/' + editing.id, {
        method: 'PUT', headers: { Authorization: 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json' },
        body: JSON.stringify({ requiresPrescription: editing.requiresPrescription, isActive: editing.isActive, classificationSource: editing.classificationSource })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      notify(result.message, 'success'); setEditing(null); setVersion(v => v + 1);
    } catch (err) { notify(err.message, 'error'); }
    finally { setSaving(false); }
  }
  return <section className="space-y-5 text-left">
    <div className="glass-premium-dark rounded-3xl p-6">
      <h2 className="text-2xl text-white">Régime de délivrance du catalogue</h2>
      <p className="mt-2 text-sm text-white/70">Enregistrez les informations validées par un professionnel ou une source officielle. Un produit non vérifié ne peut pas être commandé.</p>
      <label className="mt-4 block text-sm text-white">Nom ou code CIS
        <input className="mt-2 w-full rounded-xl border border-white/20 bg-zinc-900 p-3 text-white" type="search" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </label>
    </div>
    {error && <p role="alert" className="text-red-300">{error}</p>}
    {loading ? <p role="status">Chargement du catalogue…</p> : <div className="space-y-3">
      {data.items.map(m => <article key={m.id} className="glass-premium-dark flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
        <div><h3 className="font-bold text-white">{m.nom}</h3><p className="text-sm text-white/70">{m.cis} · {m.forme}</p>
          <p className="mt-2 text-sm text-cyan-200">{!m.isActive ? 'Retiré du catalogue' : !m.classificationReviewed ? 'Régime à vérifier' : m.requiresPrescription ? 'Ordonnance obligatoire' : 'Sans ordonnance'}</p></div>
        <button className="rounded-xl border border-white/20 px-4 py-3 text-sm text-white" onClick={() => setEditing({ ...m, classificationSource: m.classificationSource || '' })}>Renseigner</button>
      </article>)}
      {!data.items.length && <p>Aucun produit trouvé.</p>}
      <div className="flex items-center justify-between gap-4 text-sm">
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-xl border border-white/20 p-3 disabled:opacity-40">Précédent</button>
        <span>{data.total} produits · Page {page} / {data.pages || 1}</span>
        <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="rounded-xl border border-white/20 p-3 disabled:opacity-40">Suivant</button>
      </div>
    </div>}
    {editing && <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 p-4">
      <form onSubmit={save} role="dialog" aria-modal="true" aria-label="Régime de délivrance" className="max-h-[90dvh] w-full max-w-lg space-y-5 overflow-auto rounded-2xl bg-zinc-950 p-6 text-white">
        <h3 className="text-xl">{editing.nom}</h3>
        <label className="block text-sm">Régime validé
          <select className="mt-2 w-full rounded-xl bg-zinc-900 p-3" value={String(editing.requiresPrescription)} onChange={e => setEditing(m => ({ ...m, requiresPrescription: e.target.value === 'true' }))}>
            <option value="true">Ordonnance obligatoire</option><option value="false">Sans ordonnance</option>
          </select>
        </label>
        <label className="flex gap-3"><input type="checkbox" checked={editing.isActive} onChange={e => setEditing(m => ({ ...m, isActive: e.target.checked }))} />Produit actif dans le catalogue</label>
        <label className="block text-sm">Source et référence de validation
          <textarea required minLength={10} maxLength={1000} className="mt-2 w-full rounded-xl bg-zinc-900 p-3" value={editing.classificationSource} onChange={e => setEditing(m => ({ ...m, classificationSource: e.target.value }))} placeholder="Référence du document, professionnel ayant validé et date" />
        </label>
        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" disabled={saving} onClick={() => setEditing(null)} className="rounded-xl border border-white/20 px-4 py-3">Annuler</button>
          <button disabled={saving} className="rounded-xl bg-cyan-300 px-4 py-3 font-bold text-black disabled:opacity-50">{saving ? 'Enregistrement…' : 'Enregistrer la validation'}</button>
        </div>
      </form>
    </div>}
  </section>;
}
