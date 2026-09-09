import React, { useState, useEffect } from 'react';
import { Search, ClipboardList, CheckCircle2, AlertTriangle, Package, RefreshCw, Layers, ShieldCheck, MapPin, Pill } from 'lucide-react';
import { API_URL } from '../config';
import { notify } from '../utils/notify';
import DashboardLayout from './dashboard/DashboardLayout';

export default function PharmacistDashboard({ user, activeTab, setActiveTab }) {
  // Search Prescription State
  const [searchCode, setSearchCode] = useState('');
  const [foundOrdonnance, setFoundOrdonnance] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);

  // Delivery Precheck Results
  const [stockStatus, setStockStatus] = useState([]); // { medicamentId, nom, requis, disponible, canDeliver }
  const [canDeliverAll, setCanDeliverAll] = useState(false);
  const [statusBusy, setStatusBusy] = useState(null);

  // My Pharmacy Inventory State
  const [myStocks, setMyStocks] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [replenishMedId, setReplenishMedId] = useState('');
  const [replenishQty, setReplenishReplenishQty] = useState(10);
  const [replenishSuccess, setReplenishSuccess] = useState('');

  // Orders and Deliveries State
  const [commandes, setCommandes] = useState([]);
  const [loadingCommandes, setLoadingCommandes] = useState(false);
  const [commandeFilter, setCommandeFilter] = useState('TOUS');
  const [commandeSearch, setCommandeSearch] = useState('');
  const [stockSearch, setStockSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('TOUS');

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

  // Update order status
  const handleUpdateCommandeStatus = async (commandeId, nextStatus) => {
    if (statusBusy) return;
    if (nextStatus === 'PAYEE' && !window.confirm('Confirmez-vous avoir encaissé le paiement en officine ?')) return;
    setStatusBusy(commandeId);
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
        notify(data.message || "Statut de commande mis à jour !", 'success');
        fetchPharmacyCommandes();
      } else {
        notify(data.error || "Erreur de mise à jour du statut.", 'error');
      }
    } catch (err) {
      notify('Impossible de mettre à jour la commande.', 'error');
    } finally { setStatusBusy(null); }
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
    setCanDeliverAll(false);
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
    setCanDeliverAll(false);
    if (ordonnance.commande) {
      const ready = ordonnance.status === 'PENDING' && ordonnance.commande.status === 'PAYEE' && ordonnance.commande.pharmacieId === user.pharmacie?.id;
      setStockStatus((ordonnance.medicaments || []).map(m => ({ medicamentId: m.medicamentId, nom: m.nom, requis: m.quantite, disponible: m.quantite, canDeliver: ready })));
      setCanDeliverAll(ready);
      if (!ready) setError('Commande à payer en officine ou ordonnance non délivrable dans cette pharmacie.');
      return;
    }
    if (ordonnance.status !== 'PENDING') return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/pharmacien/stocks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const currentStocks = await res.json();
      if (!res.ok || !Array.isArray(currentStocks)) throw new Error('Stock indisponible');
      
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
    if (!foundOrdonnance || delivering || !canDeliverAll) return;
    if (!window.confirm("Confirmer la remise des médicaments et la délivrance définitive ? Le stock déjà réservé ne sera pas débité à nouveau.")) return;
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
        setFoundOrdonnance({
          ...foundOrdonnance,
          status: 'DELIVREE',
          dateDelivrance: new Date()
        });
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
      notify("Veuillez sélectionner un médicament.", 'error');
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
        notify(data.error, 'error');
      } else {
        setReplenishSuccess("Le réapprovisionnement de l'inventaire a été validé !");
        fetchMyStocks(); // Recharger
      }
    } catch (err) {
      notify("Erreur de connexion.", 'error');
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
            <div className="p-8 rounded-[24px] glass-premium-dark shadow-sm flex flex-col gap-4 relative overflow-hidden">
              {searching && (
                <>
                  <div className="scan-laser-line" />
                  <div className="absolute inset-0 hologram-overlay z-0 pointer-events-none opacity-50" />
                </>
              )}
              
              <div className="relative z-10 flex flex-col gap-1">
                <span className="text-[10px] font-black tracking-widest text-[#00f0ff] uppercase">Analyseur RFID / QR Code</span>
                <h3 className="text-3xl font-light text-white tracking-tight">Recherche Certifiée</h3>
                <p className="text-sm text-white/50 mt-1 font-medium leading-relaxed">Saisissez le code unique ORD-XXXX présenté par le patient pour charger la prescription certifiée :</p>
              </div>
              
              <form onSubmit={handleSearchOrdonnance} className="flex gap-4 relative z-10 mt-3">
                <div className="relative flex-1">
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    required
                    placeholder="Saisir le code (ex: ORD-4927)..."
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                    className="w-full pl-14 pr-4 py-4 rounded-xl bg-black/40 border border-white/10 focus:border-[#00f0ff] focus:outline-none text-sm font-mono tracking-[4px] font-black text-[#00f0ff] placeholder-white/30 transition-colors cursor-none uppercase"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="px-8 py-4 bg-white hover:bg-[#00f0ff] disabled:bg-white/5 disabled:text-white/20 text-black rounded-xl text-sm font-bold uppercase tracking-widest transition-all flex items-center gap-3 cursor-none shadow-xl"
                  data-cursor-magnet
                >
                  <Search size={18} />
                  {searching ? "Analyse..." : "Vérifier"}
                </button>
              </form>

              {searchError && <p className="text-red-400 text-xs font-bold relative z-10 mt-2">❌ {searchError}</p>}
            </div>

            {/* Détails de l'ordonnance chargée */}
            {foundOrdonnance && (
              <div className="p-8 rounded-[24px] glass-premium-dark shadow-sm flex flex-col gap-6 animate-in fade-in duration-300">
                <div className="border-b border-white/10 pb-5 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-[#00f0ff] uppercase tracking-widest block">Prescription Authentifiée</span>
                    <h4 className="text-2xl font-mono font-light text-white tracking-widest mt-1">{foundOrdonnance.code}</h4>
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest ${
                    foundOrdonnance.status === 'DELIVREE' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                  }`}>
                    {({ DELIVREE: 'Délivrée', PENDING: 'À délivrer', EXPIREE: 'Expirée', ANNULEE: 'Annulée' })[foundOrdonnance.status] || foundOrdonnance.status}
                  </span>
                </div>

                {/* Métadonnées Médecin / Patient */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-black/30 p-5 rounded-[20px] border border-white/5">
                  <div className="text-left">
                    <span className="text-white/40 text-[10px] uppercase tracking-widest font-black block mb-2">Médecin Prescripteur</span>
                    <b className="font-light text-xl text-white">Dr. {foundOrdonnance.medecin.firstName} {foundOrdonnance.medecin.lastName}</b>
                    <p className="text-xs text-white/50 font-medium mt-1">{foundOrdonnance.medecin.email}</p>
                  </div>
                  <div className="text-left border-t sm:border-t-0 sm:border-l border-white/5 pt-4 sm:pt-0 sm:pl-5">
                    <span className="text-white/40 text-[10px] uppercase tracking-widest font-black block mb-2">Patient bénéficiaire</span>
                    <b className="font-light text-xl text-white">{foundOrdonnance.patient.firstName} {foundOrdonnance.patient.lastName}</b>
                    <p className="text-xs text-white/50 font-medium mt-1">{foundOrdonnance.patient.email}</p>
                  </div>
                </div>

                {/* Liste des médicaments prescrits */}
                <div className="flex flex-col gap-3 mt-2">
                  <h5 className="text-[10px] font-black text-white/40 uppercase tracking-widest text-left">Médicaments à délivrer :</h5>
                  <div className="flex flex-col gap-4">
                    {foundOrdonnance.medicaments.map((med, idx) => (
                      <div key={idx} className="p-5 rounded-[20px] bg-white/5 border border-white/10 text-sm flex flex-col gap-3 text-left">
                        <div className="flex justify-between items-start gap-4">
                          <span className="font-bold text-white text-lg">{med.nom}</span>
                          <span className="text-[10px] font-black text-[#00f0ff] bg-[#00f0ff]/10 px-4 py-2 rounded-xl border border-[#00f0ff]/20 uppercase tracking-widest">
                            Requis : {med.quantite}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 bg-black/40 p-4 rounded-xl border border-white/5 text-xs font-medium text-white/60">
                          <div>
                            <span className="text-[9px] font-black uppercase text-white/40 tracking-widest block mb-1">Dosage</span>
                            <p className="font-bold text-white">{med.dosage || "1 comprimé"}</p>
                          </div>
                          <div>
                            <span className="text-[9px] font-black uppercase text-white/40 tracking-widest block mb-1">Posologie</span>
                            <p className="font-bold text-white">{med.posologie}</p>
                          </div>
                        </div>
                        {med.duree && (
                          <div className="text-xs font-medium text-white/40 mt-1">
                            Durée : <span className="font-bold text-[#00f0ff] uppercase tracking-widest ml-1">{med.duree}</span>
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
              <div className="p-8 rounded-[24px] glass-premium-dark shadow-sm flex flex-col gap-6 sticky top-24">
                <div className="border-b border-white/10 pb-4 flex justify-between items-center">
                  <h4 className="text-xs font-black text-white/40 uppercase tracking-widest">Contrôle Inventaire</h4>
                  <span className="text-[9px] font-black text-[#00f0ff] bg-[#00f0ff]/10 border border-[#00f0ff]/20 px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full"></span> Temps Réel
                  </span>
                </div>

                {/* Comparatif de stocks pour chaque produit */}
                <div className="flex flex-col gap-4">
                  {stockStatus.map((item, idx) => {
                    const pct = item.disponible > 0 ? Math.min((item.disponible / item.requis) * 100, 100) : 0;
                    return (
                      <div key={idx} className="p-5 rounded-[20px] bg-white/5 border border-white/10 text-sm flex flex-col gap-3 text-left">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-white max-w-[180px] truncate leading-tight">{item.nom}</span>
                          <span className={`text-[9px] uppercase font-black px-3 py-1.5 rounded-lg shrink-0 ${
                            item.canDeliver ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {item.canDeliver ? 'Disponible' : 'Insuffisant'}
                          </span>
                        </div>
                        
                        {/* Progress Stock Health Bar */}
                        <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden mt-1 border border-white/5">
                          <div 
                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                              item.canDeliver ? 'bg-[#00f0ff]' : 'bg-red-500 animate-pulse'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-[11px] font-medium text-white/50 mt-1">
                          <span className="flex items-center gap-1.5 uppercase tracking-widest">Requis : <strong className="font-black text-white">{item.requis}</strong></span>
                          <span className="flex items-center gap-1.5 uppercase tracking-widest">Stock : <strong className={`font-black ${item.canDeliver ? 'text-[#00f0ff]' : 'text-red-400'}`}>{item.disponible}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {foundOrdonnance.commande && <p className="text-sm text-cyan-200">Quantités déjà réservées pour la commande associée. Aucun second débit à la délivrance.</p>}
                {/* État global */}
                {foundOrdonnance.status === 'DELIVREE' ? (
                  <div className="p-6 rounded-[20px] bg-green-500/10 border border-green-500/20 flex flex-col gap-3 text-center text-green-400 text-sm font-medium">
                    <CheckCircle2 size={36} className="text-green-400 mx-auto" />
                    <p className="font-black text-lg text-white">Délivrée avec Succès !</p>
                    <p className="text-[11px] text-green-200/50 mt-1 leading-relaxed max-w-[250px] mx-auto">
                      Les médicaments ont été remis au patient. Stocks mis à jour.
                    </p>
                  </div>
                ) : canDeliverAll ? (
                  <div className="p-5 rounded-[20px] bg-[#00f0ff]/10 border border-[#00f0ff]/20 flex flex-col gap-2 text-sm text-[#00f0ff] text-left">
                    <div className="flex items-center gap-3 font-black text-lg text-white">
                      <ShieldCheck size={20} className="text-[#00f0ff]" />
                      <span>Validation Prête</span>
                    </div>
                    <p className="text-xs text-white/50 font-medium leading-relaxed mt-1">
                      Votre inventaire local dispose de tous les produits requis. Vous pouvez valider la délivrance physique.
                    </p>
                  </div>
                ) : (
                  <div className="p-5 rounded-[20px] bg-red-500/10 border border-red-500/20 flex flex-col gap-2 text-sm text-red-400 text-left">
                    <div className="flex items-center gap-3 font-black text-lg text-white">
                      <AlertTriangle size={20} className="text-red-500" />
                      <span>Rupture d'Inventaire</span>
                    </div>
                    <p className="text-xs text-white/50 font-medium leading-relaxed mt-1">
                      Votre officine ne possède pas le stock suffisant pour couvrir cette ordonnance. Veuillez réapprovisionner l'inventaire.
                    </p>
                  </div>
                )}

                {success && (
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center text-xs font-black text-green-400 animate-pulse uppercase tracking-widest mt-2">
                    {success}
                  </div>
                )}
                {error && <p className="text-red-400 text-xs font-bold text-center mt-2">❌ {error}</p>}

                {foundOrdonnance.status !== 'DELIVREE' && (
                  <button
                    type="button"
                    onClick={handleDeliverOrdonnance}
                    disabled={!canDeliverAll || delivering}
                    className="w-full py-5 rounded-xl bg-gradient-to-r from-[#00f0ff] to-blue-500 hover:from-[#00c0cc] hover:to-blue-600 disabled:from-white/10 disabled:to-white/10 disabled:text-white/20 text-black text-sm font-bold uppercase tracking-widest shadow-xl shadow-[#00f0ff]/20 transition-all flex items-center justify-center gap-3 cursor-none mt-2"
                    data-cursor-magnet
                  >
                    <ShieldCheck size={18} />
                    {delivering ? "Enregistrement..." : "Valider la délivrance"}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* 2. COMMANDES ET LIVRAISONS OFFICINE */}
      {activeTab === 'pharmacien_deliveries' && (
        <div className="max-w-5xl mx-auto flex flex-col gap-8 animate-in fade-in duration-300 text-left">
          <div className="text-left glass-premium-dark p-8 rounded-[24px] flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-light text-white tracking-tight">Suivi des Commandes & Expéditions</h3>
              <p className="text-sm text-white/50 mt-2 font-medium">Gérez et préparez les commandes payées par vos patients via Stripe.</p>
            </div>
            <button
              onClick={fetchPharmacyCommandes}
              disabled={loadingCommandes}
              className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white/70 transition-colors shrink-0 disabled:opacity-50 cursor-none"
              data-cursor-magnet
            >
              <RefreshCw size={20} className={loadingCommandes ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="glass-premium-dark p-4 rounded-2xl flex flex-col sm:flex-row gap-3">
            <input value={commandeSearch} onChange={e => setCommandeSearch(e.target.value)} placeholder="Rechercher par patient, email ou numéro…" className="flex-1 px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-sm text-white" />
            <select value={commandeFilter} onChange={e => setCommandeFilter(e.target.value)} className="px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-sm text-white">
              <option value="TOUS">Tous les statuts</option><option value="RESERVEE">À payer en officine</option><option value="ANNULEE">Annulées</option><option value="PAYEE">Payées</option><option value="EN_ROUTE">En route</option><option value="LIVREE">Livrées</option>
            </select>
          </div>

          {loadingCommandes && commandes.length === 0 ? (
            <div className="py-24 text-center text-white/50 flex flex-col items-center justify-center gap-4 glass-premium-dark rounded-[32px]">
              <RefreshCw size={48} className="animate-spin text-[#00f0ff]/60" />
              <p className="text-sm font-medium tracking-widest uppercase">Synchronisation des flux...</p>
            </div>
          ) : commandes.length === 0 ? (
            <div className="py-24 glass-premium-dark rounded-[32px] text-center text-white/40 flex flex-col items-center justify-center gap-4">
              <Package size={64} className="text-[#00f0ff]/30" />
              <p className="text-2xl font-light text-white">Aucune commande enregistrée</p>
              <p className="text-sm text-white/40 max-w-md mt-2">
                Aucun patient n'a encore passé de commande en ligne pour votre officine. Dès qu'un paiement Stripe est validé, il s'affichera ici.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {commandes.filter(cmd => {
                const profile = cmd.patient?.profile || {};
                const haystack = `${cmd.id} ${cmd.patient?.email || ''} ${profile.firstName || ''} ${profile.lastName || ''}`.toLowerCase();
                return (commandeFilter === 'TOUS' || cmd.status === commandeFilter) && haystack.includes(commandeSearch.toLowerCase());
              }).map(cmd => {
                const items = typeof cmd.items === 'string' ? JSON.parse(cmd.items) : cmd.items;
                const dateText = new Date(cmd.createdAt).toLocaleDateString('fr-FR', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                });
                
                const profile = cmd.patient?.profile || {};
                const patientName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || cmd.patient?.email;
                const patientPhone = profile.phone || "Téléphone N/A";
                const patientZone = profile.zone || "Zone N/A";

                return (
                  <div key={cmd.id} className="p-8 glass-premium-dark rounded-[32px] flex flex-col gap-6 text-left hover:border-[#00f0ff]/20 transition-all">
                    <div className="flex flex-wrap justify-between items-start gap-4 border-b border-white/10 pb-5">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-[#00f0ff] uppercase tracking-widest">Commande : #{cmd.id.slice(0, 8)}</span>
                          {cmd.status === 'RESERVEE' && <span className="text-sm text-amber-200">Réservée — à encaisser</span>}
                          {cmd.status === 'ANNULEE' && <span className="text-sm text-white/60">Annulée</span>}
                          {cmd.status === "PAYEE" && <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[9px] font-black uppercase px-3 py-1 rounded-lg">📦 En préparation</span>}
                          {cmd.status === "EN_ROUTE" && <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase px-3 py-1 rounded-lg">🛵 En livraison</span>}
                          {cmd.status === "LIVREE" && <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-black uppercase px-3 py-1 rounded-lg">✅ Livrée</span>}
                        </div>
                        <h4 className="text-2xl font-light text-white mt-3">Destinataire : <span className="font-bold">{patientName}</span></h4>
                        <p className="text-xs text-white/50 font-medium flex items-center gap-2 mt-2">
                          📍 Quartier: <span className="font-bold text-[#00f0ff]">{patientZone}</span> • 📞 Tél: <span className="font-bold text-white/70">{patientPhone}</span>
                        </p>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className="text-xs text-white/40 font-bold uppercase tracking-widest block">{dateText}</span>
                        <span className="text-3xl font-light text-white block mt-2">{cmd.total.toFixed(2)} €</span>
                      </div>
                    </div>

                    {/* DÉTAIL DES PRODUITS DE LA COMMANDE */}
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Médicaments à préparer :</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {items.map((it, idx) => (
                          <div key={idx} className="p-4 bg-white/5 rounded-[16px] border border-white/10 flex justify-between items-center gap-3">
                            <div className="truncate">
                              <p className="font-bold text-white text-sm truncate">{it.medicament.nom}</p>
                              <p className="text-[10px] text-white/50 mt-1 font-black uppercase tracking-widest">Qté : {it.qty || 1}</p>
                            </div>
                            <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 text-[11px] text-[#00f0ff] font-black shrink-0">
                              {((it.medicament.prix || 0) * (it.qty || 1)).toFixed(2)} €
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {cmd.ordonnance && <p className="text-sm text-cyan-200">Ordonnance : {cmd.ordonnance.code} · {cmd.ordonnance.status === 'DELIVREE' ? 'Délivrée' : 'À valider dans Délivrer Ordonnance'}</p>}
                    <p className="text-xs text-white/70">Suivi de livraison simulé pour la démonstration web.</p>
                    {/* ACTIONS DU PHARMACIEN */}
                    <div className="border-t border-white/10 pt-6 flex justify-end gap-4 mt-2">
                      {cmd.status === 'RESERVEE' && <button disabled={!!statusBusy} onClick={() => handleUpdateCommandeStatus(cmd.id, 'PAYEE')} className="rounded-xl bg-white px-5 py-3 font-bold text-black disabled:opacity-50">Confirmer le paiement en officine</button>}
                      {cmd.status === "PAYEE" && (
                        <button
                          disabled={!!statusBusy || (!!cmd.ordonnanceId && cmd.ordonnance?.status !== 'DELIVREE')} onClick={() => handleUpdateCommandeStatus(cmd.id, "EN_ROUTE")}
                          className="px-6 py-4 rounded-xl bg-white hover:bg-[#00f0ff] text-black font-bold text-xs uppercase tracking-widest shadow-xl transition-all cursor-none flex items-center gap-3"
                          data-cursor-magnet
                        >
                          <Package size={16} /> Expédier & Confier au livreur
                        </button>
                      )}
                      
                      {cmd.status === "EN_ROUTE" && (
                        <button
                          disabled={!!statusBusy} onClick={() => handleUpdateCommandeStatus(cmd.id, "LIVREE")}
                          className="px-6 py-4 rounded-xl bg-gradient-to-r from-[#00f0ff] to-blue-500 text-black hover:from-[#00c0cc] hover:to-blue-600 font-bold text-xs uppercase tracking-widest shadow-xl shadow-[#00f0ff]/20 transition-all cursor-none flex items-center gap-3"
                          data-cursor-magnet
                        >
                          <CheckCircle2 size={16} /> Confirmer Livraison Réussie
                        </button>
                      )}

                      {cmd.status === "LIVREE" && (
                        <span className="text-xs text-white/40 font-black uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-green-400" /> Remis en main propre
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
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
          
          {/* Liste d'inventaire */}
          <div className="xl:col-span-8 p-8 rounded-[32px] glass-premium-dark flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <h3 className="text-2xl font-light text-white tracking-tight">Inventaire Local</h3>
                <p className="text-xs text-white/50 mt-1 font-medium">Quantités disponibles, hors unités déjà réservées pour les commandes :</p>
              </div>
              <button
                onClick={fetchMyStocks}
                className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-none shadow-sm"
                title="Actualiser les stocks"
                data-cursor-magnet
              >
                <RefreshCw size={18} className={loadingStocks ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input value={stockSearch} onChange={e => setStockSearch(e.target.value)} placeholder="Rechercher un médicament ou une substance…" className="flex-1 px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-sm text-white" />
              <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-sm text-white">
                <option value="TOUS">Tous les stocks</option><option value="FAIBLE">Stock faible (≤ 10)</option><option value="RUPTURE">Rupture</option>
              </select>
            </div>

            {loadingStocks && myStocks.length === 0 ? (
              <p className="text-center py-20 text-sm text-white/40 font-medium">Chargement de votre inventaire sécurisé...</p>
            ) : myStocks.length === 0 ? (
              <p className="text-center py-20 text-sm text-white/30 font-medium">Aucun produit dans l'inventaire. Veuillez réapprovisionner.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-white/30 uppercase text-[10px] tracking-widest font-black">
                      <th className="py-4 px-4">Médicament</th>
                      <th className="py-4 px-4">Substance Active</th>
                      <th className="py-4 px-4">Prix Unitaire</th>
                      <th className="py-4 px-4 text-center">Quantité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {myStocks.filter(stock => {
                      const text = `${stock.medicament.nom} ${stock.medicament.substanceActive || ''}`.toLowerCase();
                      const matchSearch = text.includes(stockSearch.toLowerCase());
                      const matchFilter = stockFilter === 'TOUS' || (stockFilter === 'RUPTURE' ? stock.quantite === 0 : stock.quantite <= 10);
                      return matchSearch && matchFilter;
                    }).map(stock => (
                      <tr key={stock.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-5 px-4 font-bold text-white text-base">{stock.medicament.nom}</td>
                        <td className="py-5 px-4 text-white/50 text-[11px] font-bold uppercase tracking-wider">{stock.medicament.substanceActive || "N/A"}</td>
                        <td className="py-5 px-4 text-[#00f0ff] font-light text-lg">{stock.medicament.prix ? `${stock.medicament.prix.toFixed(2)} €` : "N/A"}</td>
                        <td className="py-5 px-4 text-center">
                          <span className={`inline-block font-black px-4 py-2 rounded-xl text-xs ${
                            stock.quantite > 50 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                          }`}>
                            {stock.quantite}
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
          <div className="xl:col-span-4 p-8 rounded-[32px] glass-premium-dark flex flex-col gap-6 sticky top-24">
            <div>
              <h3 className="text-xl font-light text-white tracking-tight">Réapprovisionner</h3>
              <p className="text-xs text-white/50 font-medium mt-2">Incrémentez le stock existant suite à une livraison grossiste :</p>
            </div>
            
            <form onSubmit={handleReplenishStock} className="flex flex-col gap-5 mt-2">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Choisir le produit</label>
                <select
                  value={replenishMedId}
                  onChange={(e) => setReplenishMedId(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl bg-black/40 border border-white/10 focus:border-[#00f0ff] focus:outline-none text-sm font-bold text-white appearance-none cursor-none"
                >
                  <option value="" className="bg-zinc-900">-- Sélectionner --</option>
                  {myStocks.map(s => (
                    <option key={s.medicamentId} value={s.medicamentId} className="bg-zinc-900">{s.medicament.nom}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Quantité Reçue (Boîtes)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={replenishQty}
                  onChange={(e) => setReplenishReplenishQty(parseInt(e.target.value))}
                  className="w-full px-5 py-4 rounded-xl bg-black/40 border border-white/10 focus:border-[#00f0ff] focus:outline-none text-lg font-light text-white cursor-none"
                />
              </div>

              {replenishSuccess && (
                <div className="p-4 rounded-xl bg-green-500/10 text-green-400 text-xs font-black border border-green-500/20 text-center uppercase tracking-widest animate-pulse">
                  {replenishSuccess}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 mt-2 rounded-xl bg-white hover:bg-[#00f0ff] text-black text-xs font-bold uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 cursor-none"
                data-cursor-magnet
              >
                <Package size={16} />
                Ajouter au stock
              </button>
            </form>
          </div>

        </div>
      )}
    </DashboardLayout>
  );
}
