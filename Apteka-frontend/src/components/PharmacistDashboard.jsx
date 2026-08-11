import React, { useState, useEffect } from 'react';
import { Search, ClipboardList, CheckCircle2, AlertTriangle, Package, RefreshCw, Layers, ShieldCheck, MapPin, Pill } from 'lucide-react';
import { API_URL } from '../config';
import DashboardLayout from './dashboard/DashboardLayout';

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

  // Orders and Deliveries State
  const [commandes, setCommandes] = useState([]);
  const [loadingCommandes, setLoadingCommandes] = useState(false);

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

  // Load Pharmacy Orders
  const fetchPharmacyCommandes = async () => {
    setLoadingCommandes(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/pharmacien/commandes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setCommandes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCommandes(false);
    }
  };

  // Update order status (ex: PAYEE -> EN_ROUTE -> LIVREE)
  const handleUpdateCommandeStatus = async (commandeId, nextStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/pharmacien/commandes/${commandeId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Statut de commande mis à jour !");
        fetchPharmacyCommandes();
      } else {
        alert(data.error || "Erreur de mise à jour du statut.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'pharmacien_stocks') {
      fetchMyStocks();
    }
    if (activeTab === 'pharmacien_deliveries') {
      fetchPharmacyCommandes();
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

  // Menu items config for Sidebar Navigation
  const menuItems = [
    { id: 'pharmacien_deliver', label: 'Délivrer Ordonnance', icon: ShieldCheck },
    { id: 'pharmacien_deliveries', label: 'Commandes & Livraisons', icon: Package },
    { id: 'pharmacien_stocks', label: 'Gérer l\'Inventaire', icon: Pill },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <DashboardLayout
      user={user}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      menuItems={menuItems}
      onLogout={handleLogout}
    >
      {/* 1. SAISIE ET DÉLIVRANCE D'ORDONNANCE */}
      {activeTab === 'pharmacien_deliver' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
          
          {/* Module de recherche et détails ordonnance */}
          <div className="xl:col-span-7 flex flex-col gap-6">
            
            {/* Boîte de recherche avec animation de scan laser */}
            <div className="p-6 rounded-3xl bg-white/50 backdrop-blur-md border border-slate-200/50 shadow-sm flex flex-col gap-4 relative overflow-hidden">
              {searching && (
                <>
                  <div className="scan-laser-line" />
                  <div className="absolute inset-0 hologram-overlay z-0 pointer-events-none" />
                </>
              )}
              
              <div className="relative z-10 flex flex-col gap-1">
                <span className="text-[10px] font-black tracking-widest text-teal-600 uppercase">Analyseur RFID / QR Code</span>
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Recherche de Prescription Certifiée</h3>
                <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">Saisissez le code unique ORD-XXXX présenté par le patient pour charger la prescription certifiée :</p>
              </div>
              
              <form onSubmit={handleSearchOrdonnance} className="flex gap-2 relative z-10 mt-1">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Saisir le code d'ordonnance (ex: ORD-4927)..."
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:outline-none text-xs transition-all font-mono tracking-wider font-extrabold text-slate-800 bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="px-6 py-3 bg-slate-900 hover:bg-teal-500 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Search size={14} />
                  {searching ? "Analyse..." : "Vérifier"}
                </button>
              </form>

              {searchError && <p className="text-red-500 text-xs font-bold relative z-10 mt-1">❌ {searchError}</p>}
            </div>

            {/* Détails de l'ordonnance chargée */}
            {foundOrdonnance && (
              <div className="p-6 rounded-3xl bg-white/50 backdrop-blur-md border border-slate-200/50 shadow-sm flex flex-col gap-5 animate-in fade-in duration-300">
                <div className="border-b border-slate-100 pb-3.5 flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest block">Prescription Authentifiée</span>
                    <h4 className="text-sm font-mono font-black text-slate-800 tracking-wider mt-0.5">{foundOrdonnance.code}</h4>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[9px] uppercase font-black tracking-wider ${
                    foundOrdonnance.status === 'DELIVREE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {foundOrdonnance.status === 'DELIVREE' ? 'Délivrée' : 'En Attente de retrait'}
                  </span>
                </div>

                {/* Métadonnées Médecin / Patient */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-100/50 p-4 rounded-2xl border border-slate-200/50">
                  <div className="text-left">
                    <span className="text-slate-400 text-[9px] uppercase tracking-widest font-black block mb-1">Médecin Prescripteur</span>
                    <b className="font-extrabold text-slate-800">Dr. {foundOrdonnance.medecin.firstName} {foundOrdonnance.medecin.lastName}</b>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{foundOrdonnance.medecin.email}</p>
                  </div>
                  <div className="text-left border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
                    <span className="text-slate-400 text-[9px] uppercase tracking-widest font-black block mb-1">Patient bénéficiaire</span>
                    <b className="font-extrabold text-slate-800">{foundOrdonnance.patient.firstName} {foundOrdonnance.patient.lastName}</b>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{foundOrdonnance.patient.email}</p>
                  </div>
                </div>

                {/* Liste des médicaments prescrits */}
                <div className="flex flex-col gap-2">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Médicaments à délivrer :</h5>
                  <div className="flex flex-col gap-3">
                    {foundOrdonnance.medicaments.map((med, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-white/60 border border-slate-200/30 text-xs flex flex-col gap-2.5 text-left">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-extrabold text-slate-850 text-sm">{med.nom}</span>
                          <span className="text-[10px] font-black text-teal-700 bg-teal-50 px-3 py-1 rounded-xl border border-teal-100/60 font-semibold">
                            Requis : {med.quantite} boîte(s)
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200/30 text-[10px] font-medium text-slate-500">
                          <div>
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Dosage</span>
                            <p className="font-bold text-slate-800 mt-0.5">{med.dosage || "1 comprimé"}</p>
                          </div>
                          <div>
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Instructions (Posologie)</span>
                            <p className="font-bold text-slate-800 mt-0.5">{med.posologie}</p>
                          </div>
                        </div>
                        {med.duree && (
                          <div className="text-[10px] font-bold text-slate-400">
                            Durée recommandée : <span className="font-black text-teal-600 bg-teal-50 border border-teal-100/60 px-2.5 py-0.5 rounded-lg ml-1">{med.duree}</span>
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
            <div className="xl:col-span-5 flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="p-6 rounded-3xl bg-white/50 backdrop-blur-md border border-slate-200/50 shadow-sm flex flex-col gap-5 sticky top-24">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Contrôle de l'Inventaire</h4>
                  <span className="text-[9px] font-black text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-full uppercase">Temps Réel</span>
                </div>

                {/* Comparatif de stocks pour chaque produit */}
                <div className="flex flex-col gap-4">
                  {stockStatus.map((item, idx) => {
                    const pct = item.disponible > 0 ? Math.min((item.disponible / item.requis) * 100, 100) : 0;
                    return (
                      <div key={idx} className="p-4 rounded-2xl bg-white/60 border border-slate-200/30 text-xs flex flex-col gap-2 text-left">
                        <div className="flex justify-between items-center font-extrabold">
                          <span className="text-slate-800 max-w-[150px] truncate leading-tight font-black">{item.nom}</span>
                          <span className={`text-[9px] uppercase font-black px-2.5 py-0.5 rounded-lg shrink-0 ${
                            item.canDeliver ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {item.canDeliver ? 'Disponible' : 'Insuffisant'}
                          </span>
                        </div>
                        
                        {/* Progress Stock Health Bar */}
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              item.canDeliver ? 'bg-teal-500' : 'bg-rose-500 animate-pulse'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                          <span className="flex items-center gap-1">Requis : <strong className="font-extrabold text-slate-800">{item.requis}</strong></span>
                          <span className="flex items-center gap-1">En Stock : <strong className={`font-extrabold ${item.canDeliver ? 'text-slate-850' : 'text-rose-500'}`}>{item.disponible}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* État global */}
                {foundOrdonnance.status === 'DELIVREE' ? (
                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100/60 flex flex-col gap-2 text-center text-emerald-800 text-xs font-semibold shadow-inner">
                    <CheckCircle2 size={28} className="text-emerald-500 mx-auto" />
                    <p className="font-black text-sm text-slate-850">Délivrée avec Succès !</p>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                      Les médicaments ont été remis au patient et les stocks de l'officine ont été mis à jour instantanément.
                    </p>
                  </div>
                ) : canDeliverAll ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col gap-1.5 text-xs text-emerald-800 text-left">
                    <div className="flex items-center gap-1.5 font-black text-emerald-700">
                      <CheckCircle2 size={16} />
                      <span>Validation d'officine prête</span>
                    </div>
                    <p className="text-[10px] text-slate-450 font-semibold leading-normal">
                      Votre inventaire local dispose de tous les produits requis. Vous pouvez valider la délivrance en toute sécurité.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex flex-col gap-1.5 text-xs text-rose-800 text-left">
                    <div className="flex items-center gap-1.5 font-black text-rose-700">
                      <AlertTriangle size={16} />
                      <span>Rupture d'inventaire détectée</span>
                    </div>
                    <p className="text-[10px] text-slate-450 font-semibold leading-normal">
                      Votre officine ne possède pas le stock suffisant pour couvrir cette ordonnance. Veuillez réapprovisionner via l'onglet Inventaire.
                    </p>
                  </div>
                )}

                {success && (
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center text-[11px] font-black text-emerald-600 animate-pulse uppercase tracking-wider">
                    {success}
                  </div>
                )}
                {error && <p className="text-red-500 text-xs font-bold text-center">❌ {error}</p>}

                {foundOrdonnance.status !== 'DELIVREE' && (
                  <button
                    type="button"
                    onClick={handleDeliverOrdonnance}
                    disabled={!canDeliverAll || delivering}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 text-white text-xs font-black shadow-lg shadow-teal-500/15 transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
                  >
                    <ShieldCheck size={14} />
                    {delivering ? "Mise à jour des registres..." : "Valider la délivrance physique"}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* 2. COMMANDES ET LIVRAISONS OFFICINE */}
      {activeTab === 'pharmacien_deliveries' && (
        <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300 text-left">
          <div className="text-left bg-white/40 p-5 border border-slate-200/40 rounded-2xl shadow-sm flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-slate-850">Suivi des Commandes & Expéditions</h3>
              <p className="text-xs text-slate-500 mt-1">Gérez et préparez les commandes payées par vos patients via Stripe.</p>
            </div>
            <button
              onClick={fetchPharmacyCommandes}
              disabled={loadingCommandes}
              className="p-2.5 bg-white border border-slate-200/60 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-teal-600 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={16} className={loadingCommandes ? 'animate-spin' : ''} />
            </button>
          </div>

          {loadingCommandes && commandes.length === 0 ? (
            <div className="py-20 text-center text-slate-500 flex flex-col items-center justify-center gap-3 bg-white/40 border border-slate-200/40 rounded-[2rem]">
              <RefreshCw size={36} className="animate-spin text-teal-500/60" />
              <p className="text-xs font-semibold">Chargement des commandes de la pharmacie...</p>
            </div>
          ) : commandes.length === 0 ? (
            <div className="py-16 bg-white/45 backdrop-blur-md border border-slate-200/50 rounded-3xl text-center text-slate-450 flex flex-col items-center justify-center gap-3">
              <Package size={42} className="text-teal-500/30" />
              <p className="text-sm font-extrabold text-slate-800">Aucune commande enregistrée</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Aucun patient n'a encore passé de commande en ligne pour votre officine. Dès qu'un paiement Stripe est validé, il s'affichera ici.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {commandes.map(cmd => {
                const items = typeof cmd.items === 'string' ? JSON.parse(cmd.items) : cmd.items;
                const dateText = new Date(cmd.createdAt).toLocaleDateString('fr-FR', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                });
                
                const profile = cmd.patient?.profile || {};
                const patientName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || cmd.patient?.email;
                const patientPhone = profile.phone || "Téléphone N/A";
                const patientZone = profile.zone || "Zone N/A";

                return (
                  <div key={cmd.id} className="p-6 bg-white/60 backdrop-blur-md border border-slate-200/40 rounded-[2rem] shadow-sm flex flex-col gap-5 text-left hover:border-teal-500/25 transition-colors">
                    <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Commande : #{cmd.id.slice(0, 8)}</span>
                          {cmd.status === "PAYEE" && <span className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full font-black">📦 En préparation</span>}
                          {cmd.status === "EN_ROUTE" && <span className="bg-sky-100 text-sky-700 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full font-black">🛵 En livraison</span>}
                          {cmd.status === "LIVREE" && <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full font-black">✅ Livrée</span>}
                        </div>
                        <h4 className="text-base font-black text-slate-800 mt-2">Destinataire : {patientName}</h4>
                        <p className="text-[11px] text-slate-550 font-semibold flex items-center gap-1.5 mt-1">
                          📍 Quartier: <span className="font-extrabold text-slate-700">{patientZone}</span> • 📞 Tél: <span className="font-extrabold text-slate-700">{patientPhone}</span>
                        </p>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className="text-sm text-slate-400 font-bold block">{dateText}</span>
                        <span className="text-base font-black text-teal-600 block mt-1">{cmd.total.toFixed(2)} €</span>
                      </div>
                    </div>

                    {/* DÉTAIL DES PRODUITS DE LA COMMANDE */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Médicaments à préparer :</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {items.map((it, idx) => (
                          <div key={idx} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex justify-between items-center gap-2">
                            <div className="truncate">
                              <p className="font-extrabold text-slate-800 text-xs truncate">{it.medicament.nom}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5 font-bold">Quantité requise : {it.qty || 1} boîte(s)</p>
                            </div>
                            <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-100 text-[10px] text-slate-600 font-extrabold shrink-0">
                              {((it.medicament.prix || 0) * (it.qty || 1)).toFixed(2)} €
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ACTIONS DU PHARMACIEN */}
                    <div className="border-t border-slate-100 pt-4 flex justify-end gap-3">
                      {cmd.status === "PAYEE" && (
                        <button
                          onClick={() => handleUpdateCommandeStatus(cmd.id, "EN_ROUTE")}
                          className="px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-sky-400 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-sky-500/10 transition-all cursor-pointer flex items-center gap-2 font-black"
                        >
                          🛵 Expédier & Confier au livreur
                        </button>
                      )}
                      
                      {cmd.status === "EN_ROUTE" && (
                        <button
                          onClick={() => handleUpdateCommandeStatus(cmd.id, "LIVREE")}
                          className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-500/10 transition-all cursor-pointer flex items-center gap-2 font-black"
                        >
                          ✅ Confirmer la livraison réussie
                        </button>
                      )}

                      {cmd.status === "LIVREE" && (
                        <span className="text-xs text-slate-400 font-extrabold flex items-center gap-1 font-black">
                          🏆 Remis en main propre au destinataire
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. GESTION DES STOCKS OFFICINE */}
      {activeTab === 'pharmacien_stocks' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Liste d'inventaire */}
          <div className="xl:col-span-8 p-6 rounded-3xl bg-white/50 backdrop-blur-md border border-slate-200/50 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">État de votre Inventaire Officine</h3>
                <p className="text-xs text-slate-500 mt-0.5">Retrouvez les stocks enregistrés dans votre base locale :</p>
              </div>
              <button
                onClick={fetchMyStocks}
                className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-teal-600 transition-all cursor-pointer shadow-sm"
                title="Actualiser les stocks"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {loadingStocks ? (
              <p className="text-center py-12 text-xs text-slate-500">Chargement de votre inventaire...</p>
            ) : myStocks.length === 0 ? (
              <p className="text-center py-12 text-xs text-slate-400">Aucun produit dans votre inventaire. Veuillez réapprovisionner.</p>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200/40 text-slate-500 uppercase text-[10px] tracking-wider">
                      <th className="py-2.5">Médicament</th>
                      <th className="py-2.5">Substance Active</th>
                      <th className="py-2.5">Prix Unitaire</th>
                      <th className="py-2.5 text-center">Quantité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myStocks.map(stock => (
                      <tr key={stock.id} className="hover:bg-teal-50/20 transition-colors">
                        <td className="py-3 font-semibold text-slate-800">{stock.medicament.nom}</td>
                        <td className="py-3 text-slate-500 text-[11px] font-semibold">{stock.medicament.substanceActive || "N/A"}</td>
                        <td className="py-3 text-slate-500 font-semibold">{stock.medicament.prix ? `${stock.medicament.prix.toFixed(2)} €` : "N/A"}</td>
                        <td className="py-3 text-center">
                          <span className={`inline-block font-bold px-2.5 py-0.5 rounded-full ${
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
          <div className="xl:col-span-4 p-6 rounded-3xl bg-white/50 backdrop-blur-md border border-slate-200/50 shadow-sm flex flex-col gap-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-black">Réapprovisionner</h3>
            <p className="text-xs text-slate-500 font-semibold">Incrémentez le stock existant de votre pharmacie lors de la réception de colis grossistes :</p>
            
            <form onSubmit={handleReplenishStock} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Choisir le médicament</label>
                <select
                  value={replenishMedId}
                  onChange={(e) => setReplenishMedId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:outline-none text-xs bg-white font-bold"
                >
                  <option value="">-- Sélectionner --</option>
                  {myStocks.map(s => (
                    <option key={s.medicamentId} value={s.medicamentId}>{s.medicament.nom}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Quantité à AJOUTER</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={replenishQty}
                  onChange={(e) => setReplenishReplenishQty(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:outline-none text-xs bg-white font-extrabold"
                />
              </div>

              {replenishSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-750 text-xs font-bold border border-emerald-100">
                  {replenishSuccess}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 text-white text-xs font-bold shadow-md shadow-teal-500/10 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Package size={14} />
                Valider l'entrée de stock
              </button>
            </form>
          </div>

        </div>
      )}
    </DashboardLayout>
  );
}
