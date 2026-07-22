import React, { useState, useEffect } from 'react';
import { Search, ClipboardList, CheckCircle2, AlertTriangle, Package, RefreshCw, Layers, ShieldCheck, MapPin } from 'lucide-react';
import { API_URL } from '../config';

export default function PharmacistDashboard({ user, activeTab, setActiveTab }) {
  // Search Prescription State
  const [searchCode, setSearchCode] = useState('');
  const [foundOrdonnance, setFoundOrdonnance] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);

  // Delivery Precheck Results
  const [stockStatus, setStockStatus] = useState([]); // { medicamentId, nom, requis, disponible, canDeliver }
  const [canDeliverAll, setCanDeliverAll] = useState(true);

  // My Pharmacy Inventory State
  const [myStocks, setMyStocks] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [replenishMedId, setReplenishMedId] = useState('');
  const [replenishQty, setReplenishReplenishQty] = useState(10);
  const [replenishSuccess, setReplenishSuccess] = useState('');

  // General Status States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [delivering, setDelivering] = useState(false);

  // Load Inventory stocks
  const fetchMyStocks = async () => {
    if (!user.pharmacie) return;
    setLoadingStocks(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/pharmacien/stocks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMyStocks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStocks(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pharmacien_stocks') {
      fetchMyStocks();
    }
  }, [activeTab]);

  // Lookup Prescription by Code
  const handleSearchOrdonnance = async (e) => {
    e.preventDefault();
    setSearchError('');
    setError('');
    setSuccess('');
    setFoundOrdonnance(null);
    setStockStatus([]);
    setSearching(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/pharmacien/ordonnances/code/${searchCode}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.error || "Ordonnance introuvable. Veuillez vérifier le code.");
      } else {
        const parsedData = {
          ...data,
          medicaments: typeof data.medicaments === 'string' ? JSON.parse(data.medicaments) : data.medicaments
        };
        setFoundOrdonnance(parsedData);
        
        // Exécuter un pré-contrôle des stocks locaux pour cette ordonnance
        runLocalStockPrecheck(parsedData);
      }
    } catch (err) {
      setSearchError("Une erreur est survenue lors de la recherche.");
    } finally {
      setSearching(false);
    }
  };

  // Run Real-time Local Stock Pre-check
  const runLocalStockPrecheck = async (ordonnance) => {
    try {
      const token = localStorage.getItem('token');
      // Charger les stocks actuels pour comparer
      const res = await fetch(`${API_URL}/api/pharmacien/stocks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const currentStocks = await res.json();
      
      const checkResults = [];
      let deliverable = true;

      const prescritMeds = typeof ordonnance.medicaments === 'string'
        ? JSON.parse(ordonnance.medicaments)
        : ordonnance.medicaments;

      prescritMeds.forEach(item => {
        const localStock = currentStocks.find(s => s.medicamentId === item.medicamentId);
        const qtyAvailable = localStock ? localStock.quantite : 0;
        const canDeliverItem = qtyAvailable >= item.quantite;

        if (!canDeliverItem) {
          deliverable = false;
        }

        checkResults.push({
          medicamentId: item.medicamentId,
          nom: item.nom,
          requis: item.quantite,
          disponible: qtyAvailable,
          canDeliver: canDeliverItem
        });
      });

      setStockStatus(checkResults);
      setCanDeliverAll(deliverable);

    } catch (err) {
      console.error("Erreur de pré-contrôle de stock:", err);
    }
  };

  // Validate and execute delivery
  const handleDeliverOrdonnance = async () => {
    if (!foundOrdonnance) return;
    setError('');
    setSuccess('');
    setDelivering(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/pharmacien/ordonnances/deliver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ordonnanceId: foundOrdonnance.id })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "La délivrance a échoué.");
      } else {
        setSuccess(data.message);
        // Mettre à jour l'état de l'ordonnance affichée
        setFoundOrdonnance({
          ...foundOrdonnance,
          status: 'DELIVREE',
          dateDelivrance: new Date()
        });

        // Recharger le code de recherche
        setSearchCode('');
      }
    } catch (err) {
      setError("Erreur réseau lors de la validation.");
    } finally {
      setDelivering(false);
    }
  };

  // Quick Replenish Inventory Stock
  const handleReplenishStock = async (e) => {
    e.preventDefault();
    setReplenishSuccess('');
    
    if (!replenishMedId) {
      alert("Veuillez sélectionner un médicament.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/pharmacien/stocks/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          medicamentId: replenishMedId,
          quantiteAjoutee: parseInt(replenishQty)
        })
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
      } else {
        setReplenishSuccess("Le réapprovisionnement de l'inventaire a été validé !");
        fetchMyStocks(); // Recharger
      }
    } catch (err) {
      alert("Erreur de connexion.");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto my-6 px-4 flex flex-col gap-6">

      {/* HEADER INFO */}
      <div className="p-6 rounded-2xl bg-white border border-apple-border/30 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-apple-blue uppercase tracking-widest">Espace Pharmacien</span>
          <h2 className="text-2xl font-bold tracking-tight text-apple-dark mt-1">
            Officine : {user.pharmacie ? user.pharmacie.name : "Non rattaché"}
          </h2>
          <p className="text-xs text-apple-charcoal mt-1 flex items-center gap-1.5">
            <MapPin size={12} className="text-apple-blue" />
            <span>Adresse : Antananarivo, Quartier {user.pharmacie ? user.pharmacie.zone : "N/A"}</span>
          </p>
        </div>
      </div>

      {/* 1. SAISIE ET DÉLIVRANCE D'ORDONNANCE */}
      {activeTab === 'pharmacien_deliver' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Module de recherche et détails ordonnance */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Boîte de recherche */}
            <div className="p-6 rounded-2xl bg-white border border-apple-border/30 flex flex-col gap-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-apple-dark">Recherche de Prescription Électronique</h3>
              <p className="text-xs text-apple-charcoal">Saisissez le code unique ORD-XXXX présenté par le patient pour charger la prescription certifiée :</p>
              
              <form onSubmit={handleSearchOrdonnance} className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-apple-charcoal/50" />
                  <input
                    type="text"
                    required
                    placeholder="Saisir le code d'ordonnance (ex: ORD-4927)..."
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-xs transition-all duration-200 font-mono tracking-wider font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="px-6 py-2 bg-apple-blue hover:bg-apple-blue/95 text-white rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Search size={14} />
                  {searching ? "Recherche..." : "Charger"}
                </button>
              </form>

              {searchError && <p className="text-red-500 text-xs font-medium">❌ {searchError}</p>}
            </div>

            {/* Détails de l'ordonnance chargée */}
            {foundOrdonnance && (
              <div className="p-6 rounded-2xl bg-white border border-apple-border/30 flex flex-col gap-4 animate-in fade-in duration-300">
                <div className="border-b border-apple-border/30 pb-3 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-apple-blue uppercase tracking-widest">Ordonnance validée par le Médecin</span>
                    <h4 className="text-sm font-bold text-apple-dark font-mono tracking-wider mt-0.5">{foundOrdonnance.code}</h4>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                    foundOrdonnance.status === 'DELIVREE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {foundOrdonnance.status === 'DELIVREE' ? 'Délivrée' : 'En Attente de retrait'}
                  </span>
                </div>

                {/* Métadonnées Médecin / Patient */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-apple-lightGrey/50 p-4 rounded-xl border border-apple-border/20">
                  <div>
                    <p className="text-apple-charcoal text-[10px] uppercase tracking-wider font-semibold">Médecin Prescripteur</p>
                    <p className="font-bold text-apple-dark mt-0.5">Dr. {foundOrdonnance.medecin.firstName} {foundOrdonnance.medecin.lastName}</p>
                    <p className="text-[11px] text-apple-charcoal">{foundOrdonnance.medecin.email}</p>
                  </div>
                  <div>
                    <p className="text-apple-charcoal text-[10px] uppercase tracking-wider font-semibold">Patient bénéficiaire</p>
                    <p className="font-bold text-apple-dark mt-0.5">{foundOrdonnance.patient.firstName} {foundOrdonnance.patient.lastName}</p>
                    <p className="text-[11px] text-apple-charcoal">{foundOrdonnance.patient.email}</p>
                  </div>
                </div>

                {/* Liste des médicaments prescrits */}
                <div className="flex flex-col gap-2">
                  <h5 className="text-[11px] font-bold text-apple-dark uppercase tracking-wider">Médicaments Rédigés :</h5>
                  <div className="flex flex-col gap-2">
                    {foundOrdonnance.medicaments.map((med, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-apple-lightGrey/20 border border-apple-border/20 text-xs flex flex-col gap-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-apple-dark text-sm">{med.nom}</span>
                          <span className="text-[10px] font-extrabold text-apple-blue bg-apple-blue/5 px-2.5 py-1 rounded-lg border border-apple-blue/10">
                            Quantité : {med.quantite} boîte(s)
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 bg-white p-2.5 rounded-lg border border-apple-border/20 text-[11px]">
                          <div>
                            <span className="text-[9px] font-bold uppercase text-apple-charcoal/60">Dosage unitaire</span>
                            <p className="font-semibold text-apple-dark mt-0.5">{med.dosage || "1 comprimé"}</p>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase text-apple-charcoal/60">Instructions (Posologie)</span>
                            <p className="font-semibold text-apple-dark mt-0.5">{med.posologie}</p>
                          </div>
                        </div>
                        {med.duree && (
                          <div className="text-[11px] font-medium text-apple-charcoal mt-1">
                            Durée de traitement : <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{med.duree}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Module de vérification des stocks et validation de la délivrance */}
          {foundOrdonnance && (
            <div className="lg:col-span-5 flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="p-6 rounded-2xl bg-white border border-apple-border/30 flex flex-col gap-5 sticky top-24 shadow-sm">
                <div className="border-b border-apple-border/30 pb-3">
                  <h4 className="text-xs font-bold text-apple-dark uppercase tracking-wider">Pré-contrôle d'Inventaire Officine</h4>
                </div>

                {/* Comparatif de stocks pour chaque produit */}
                <div className="flex flex-col gap-3">
                  {stockStatus.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-apple-lightGrey/30 border border-apple-border/20 text-xs flex flex-col gap-2">
                      <div className="flex justify-between font-semibold">
                        <span className="text-apple-dark max-w-[180px] truncate">{item.nom}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          item.canDeliver ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                        }`}>
                          {item.canDeliver ? 'Disponible' : 'Rupture !'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-[11px] text-apple-charcoal">
                        <span>Stock requis :</span>
                        <span className="font-bold">{item.requis} boîte(s)</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-apple-charcoal">
                        <span>Stock disponible chez vous :</span>
                        <span className={`font-bold ${item.canDeliver ? 'text-apple-dark' : 'text-red-500'}`}>
                          {item.disponible} boîte(s)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Écran d'état global */}
                {foundOrdonnance.status === 'DELIVREE' ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col gap-1.5 text-center text-emerald-800 text-xs font-medium">
                    <CheckCircle2 size={24} className="text-emerald-500 mx-auto" />
                    <p className="font-bold">Cette ordonnance a été entièrement délivrée par votre pharmacie.</p>
                    <p className="text-[10px] text-emerald-700">La transaction de déduction de stock a été validée.</p>
                  </div>
                ) : canDeliverAll ? (
                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex flex-col gap-1.5 text-xs text-emerald-800">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <span>Tous les produits sont en stock !</span>
                    </div>
                    <p className="text-[10px] text-emerald-700">Vous disposez de l'inventaire nécessaire pour valider la délivrance des médicaments.</p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex flex-col gap-1.5 text-xs text-red-800">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle size={16} className="text-red-500" />
                      <span>Rupture de stock détectée !</span>
                    </div>
                    <p className="text-[10px] text-red-700">Votre officine ne dispose pas de la quantité requise pour délivrer cette ordonnance. Veuillez commander du stock ou réapprovisionner l'inventaire.</p>
                  </div>
                )}

                {success && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center text-xs font-semibold text-emerald-800 animate-pulse">
                    🟢 {success}
                  </div>
                )}
                {error && <p className="text-red-500 text-xs font-medium text-center">❌ {error}</p>}

                {foundOrdonnance.status !== 'DELIVREE' && (
                  <button
                    type="button"
                    onClick={handleDeliverOrdonnance}
                    disabled={!canDeliverAll || delivering}
                    className="w-full py-3 rounded-xl bg-apple-blue hover:bg-apple-blue/95 disabled:bg-gray-100 disabled:text-gray-400 text-white text-xs font-semibold shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck size={14} />
                    {delivering ? "Validation..." : "Délivrer les médicaments"}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* 2. GESTION DES STOCKS OFFICINE */}
      {activeTab === 'pharmacien_stocks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Liste d'inventaire */}
          <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-apple-border/30 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-apple-dark">État de votre Inventaire Officine</h3>
                <p className="text-xs text-apple-charcoal mt-0.5">Retrouvez les stocks enregistrés dans votre base locale :</p>
              </div>
              <button
                onClick={fetchMyStocks}
                className="p-2 rounded-lg bg-apple-lightGrey hover:bg-apple-border/30 text-apple-dark transition-all duration-200"
                title="Actualiser les stocks"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {loadingStocks ? (
              <p className="text-center py-12 text-xs text-apple-charcoal">Chargement de votre inventaire...</p>
            ) : myStocks.length === 0 ? (
              <p className="text-center py-12 text-xs text-apple-charcoal/50">Aucun produit dans votre inventaire. Veuillez enregistrer du stock.</p>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-apple-border/30 text-apple-charcoal uppercase text-[10px] tracking-wider">
                      <th className="py-2.5">Médicament</th>
                      <th className="py-2.5">Substance Active</th>
                      <th className="py-2.5">Prix Unitaire</th>
                      <th className="py-2.5 text-center">Quantité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-apple-border/20">
                    {myStocks.map(stock => (
                      <tr key={stock.id} className="hover:bg-apple-lightGrey/30">
                        <td className="py-3 font-semibold text-apple-dark">{stock.medicament.nom}</td>
                        <td className="py-3 text-apple-charcoal text-[11px]">{stock.medicament.substanceActive || "N/A"}</td>
                        <td className="py-3 text-apple-charcoal">{stock.medicament.prix ? `${stock.medicament.prix.toFixed(2)} €` : "N/A"}</td>
                        <td className="py-3 text-center">
                          <span className={`inline-block font-semibold px-2.5 py-0.5 rounded-full ${
                            stock.quantite > 50 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {stock.quantite} boîte(s)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Formulaire de réapprovisionnement */}
          <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-apple-border/30 flex flex-col gap-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-apple-dark">Réapprovisionner</h3>
            <p className="text-xs text-apple-charcoal">Incrémentez le stock existant de votre pharmacie lors de la réception de colis grossistes :</p>
            
            <form onSubmit={handleReplenishStock} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-apple-charcoal uppercase tracking-wider">Choisir le médicament</label>
                <select
                  value={replenishMedId}
                  onChange={(e) => setReplenishMedId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-xs bg-white"
                >
                  <option value="">-- Sélectionner --</option>
                  {myStocks.map(s => (
                    <option key={s.medicamentId} value={s.medicamentId}>{s.medicament.nom}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-apple-charcoal uppercase tracking-wider">Quantité à AJOUTER</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={replenishQty}
                  onChange={(e) => setReplenishReplenishQty(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-xs"
                />
              </div>

              {replenishSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                  {replenishSuccess}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-apple-blue hover:bg-apple-blue/95 text-white text-xs font-semibold shadow-sm transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Package size={14} />
                Valider l'entrée de stock
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
