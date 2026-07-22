import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Pill, Plus, Trash2, Send, CheckCircle2, History, MapPin, Eye, Navigation, Users, Stethoscope, MessageCircle, X, RefreshCw } from 'lucide-react';
import { API_URL } from '../config';

export default function DoctorDashboard({ user, activeTab, setActiveTab }) {
  // Patient Search State
  const [patientEmail, setPatientEmail] = useState('');
  const [foundPatient, setPatient] = useState(null);
  const [searchError, setSearchError] = useState('');

  // Medicines Directory
  const [medicaments, setMedicaments] = useState([]);
  
  // Prescription Builder State
  const [prescribedItems, setPrescribedItems] = useState([]); // Array of { medicamentId, nom, dosage, quantite, posologie, duree }
  const [selectedMedId, setSelectedMedId] = useState('');
  const [itemDosage, setItemDosage] = useState('1 comprimé');
  const [itemQuantite, setItemQuantite] = useState(1);
  const [itemPosologie, setItemPosologie] = useState('3 fois par jour');
  const [itemDuree, setItemDuree] = useState('5 jours');

  // Network Stocks Lookup State
  const [lookupMedId, setLookupMedId] = useState('');
  const [lookupStocks, setLookupStocks] = useState([]);
  const [searchingStocks, setSearchingStocks] = useState(false);

  // History State
  const [history, setHistory] = useState([]);

  // Mes Patients State
  const [myPatients, setMyPatients] = useState([]);
  const [myPatientsLinked, setMyPatientsLinked] = useState(true);
  const [myPatientsMsg, setMyPatientsMsg] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Chat / Messages State (Task 3)
  const [activeChatPatient, setActiveChatPatient] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  // Renewal Requests State (Task 4)
  const [renewals, setRenewals] = useState([]);
  const [loadingRenewals, setLoadingRenewals] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [successCode, setSuccessCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load public medicines list
  useEffect(() => {
    const loadMeds = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/medicaments`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setMedicaments(data);
          if (data.length > 0) {
            setSelectedMedId(data[0].id);
            setLookupMedId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Erreur de chargement des médicaments:", err);
      }
    };
    loadMeds();
  }, []);

  // Fetch prescriptions history
  const loadHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/medecin/ordonnances/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const parsedHistory = data.map(p => ({
          ...p,
          medicaments: typeof p.medicaments === 'string' ? JSON.parse(p.medicaments) : p.medicaments
        }));
        setHistory(parsedHistory);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'medecin_history') {
      loadHistory();
    }
  }, [activeTab]);

  // Fetch "mes patients assignés"
  const loadMyPatients = async () => {
    setLoadingPatients(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/medecin/mes-patients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMyPatients(data.patients || []);
        setMyPatientsLinked(data.linked);
        setMyPatientsMsg(data.message || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'medecin_patients') {
      loadMyPatients();
    }
  }, [activeTab]);

  // Renewal Requests logic (Task 4)
  const loadRenewals = async () => {
    setLoadingRenewals(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/medecin/renewals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        const parsedRenewals = (data || []).map(r => ({
          ...r,
          medicaments: typeof r.medicaments === 'string' ? JSON.parse(r.medicaments) : r.medicaments
        }));
        setRenewals(parsedRenewals);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRenewals(false);
    }
  };

  const handleApproveRenewal = async (renewalId) => {
    if (!confirm("Voulez-vous vraiment approuver et renouveler cette ordonnance ? Une nouvelle ordonnance sera générée avec les mêmes médicaments.")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/medecin/ordonnances/${renewalId}/approve-renewal`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert("Renouvellement approuvé ! Nouveau code généré : " + data.newOrdonnance.code);
        loadRenewals();
      } else {
        alert(data.error || "Une erreur est survenue lors de l'approbation.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'medecin_renewals') {
      loadRenewals();
    }
  }, [activeTab]);

  // Chat functions (Task 3)
  const loadChat = async (patientId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/medecin/messages/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendDoctorMessage = async () => {
    if (!newMessageText.trim() || !activeChatPatient) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/medecin/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: activeChatPatient.userId,
          content: newMessageText
        })
      });
      if (res.ok) {
        setNewMessageText('');
        loadChat(activeChatPatient.userId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!activeChatPatient) return;
    loadChat(activeChatPatient.userId);
    const interval = setInterval(() => {
      loadChat(activeChatPatient.userId);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeChatPatient]);

  // Search Patient
  const handleSearchPatient = async (e) => {
    e.preventDefault();
    setSearchError('');
    setPatient(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/medecin/patient/search?email=${patientEmail}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.error || "Aucun patient trouvé.");
      } else {
        setPatient(data);
      }
    } catch (err) {
      setSearchError("Erreur lors de la recherche.");
    }
  };

  // Add Item to active prescription draft
  const handleAddItem = () => {
    const med = medicaments.find(m => m.id === selectedMedId);
    if (!med) return;

    // Éviter les doublons
    if (prescribedItems.some(item => item.medicamentId === med.id)) {
      alert("Ce médicament est déjà présent dans l'ordonnance.");
      return;
    }

    setPrescribedItems([
      ...prescribedItems,
      {
        medicamentId: med.id,
        nom: med.nom,
        dosage: itemDosage,
        quantite: parseInt(itemQuantite),
        posologie: itemPosologie,
        duree: itemDuree
      }
    ]);

    // Reset item inputs to default
    setItemDosage('1 comprimé');
    setItemQuantite(1);
    setItemPosologie('3 fois par jour');
    setItemDuree('5 jours');
  };

  // Remove Item from Draft
  const handleRemoveItem = (index) => {
    setPrescribedItems(prescribedItems.filter((_, i) => i !== index));
  };

  // Submit electronic prescription
  const handleSignPrescription = async () => {
    if (!foundPatient) return;
    if (prescribedItems.length === 0) {
      alert("Veuillez ajouter au moins un médicament à l'ordonnance.");
      return;
    }

    setError('');
    setSuccessMsg('');
    setSuccessCode('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/medecin/ordonnances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: foundPatient.id,
          medicaments: prescribedItems
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Impossible d'enregistrer l'ordonnance.");
      } else {
        setSuccessMsg(data.message);
        setSuccessCode(data.ordonnanceCode);

        // Clear states
        setPatient(null);
        setPatientEmail('');
        setPrescribedItems([]);
      }
    } catch (err) {
      setError("Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  };

  // Check stocks globally
  const handleLookupStocks = async () => {
    if (!lookupMedId) return;
    setSearchingStocks(true);
    setLookupStocks([]);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/medecin/stocks/medicament/${lookupMedId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setLookupStocks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingStocks(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto my-6 px-4 flex flex-col gap-6">

      {/* HEADER */}
      <div className="p-6 rounded-2xl bg-white border border-apple-border/30 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-apple-blue uppercase tracking-widest">Tableau de bord</span>
          <h2 className="text-2xl font-bold tracking-tight text-apple-dark mt-1">Espace Dr. {user.lastName}</h2>
          <p className="text-xs text-apple-charcoal mt-1">Rattachement d'exercice de zone : <strong className="text-apple-blue">{user.zone || "Analakely"}</strong></p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('medecin_prescrire')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === 'medecin_prescrire' ? 'bg-apple-blue text-white shadow-sm font-bold' : 'bg-apple-lightGrey text-apple-dark hover:bg-black/5'
            }`}
          >
            Nouveau Prescription
          </button>
          <button
            onClick={() => setActiveTab('medecin_stocks')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === 'medecin_stocks' ? 'bg-apple-blue text-white shadow-sm font-bold' : 'bg-apple-lightGrey text-apple-dark hover:bg-black/5'
            }`}
          >
            Consulter Stocks Réseau
          </button>
          <button
            onClick={() => setActiveTab('medecin_history')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === 'medecin_history' ? 'bg-apple-blue text-white shadow-sm font-bold' : 'bg-apple-lightGrey text-apple-dark hover:bg-black/5'
            }`}
          >
            Historique Rédigé
          </button>
          <button
            onClick={() => setActiveTab('medecin_patients')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === 'medecin_patients' ? 'bg-apple-blue text-white shadow-sm font-bold' : 'bg-apple-lightGrey text-apple-dark hover:bg-black/5'
            }`}
          >
            Mes Patients
          </button>
          <button
            onClick={() => setActiveTab('medecin_renewals')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === 'medecin_renewals' ? 'bg-apple-blue text-white shadow-sm font-bold' : 'bg-apple-lightGrey text-apple-dark hover:bg-black/5'
            }`}
          >
            Renouvellements
          </button>
        </div>
      </div>

      {/* 1. RÉDIGER UNE ORDONNANCE */}
      {activeTab === 'medecin_prescrire' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Formulaire Rédiger */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Étape 1 : Recherche Patient */}
            <div className="p-6 rounded-2xl bg-white border border-apple-border/30 flex flex-col gap-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-apple-dark">1. Sélectionner le Patient rattaché</h3>
              
              <form onSubmit={handleSearchPatient} className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-apple-charcoal/50" />
                  <input
                    type="email"
                    required
                    placeholder="Saisir l'adresse email du patient..."
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-xs transition-all duration-200"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-apple-blue hover:bg-apple-blue/95 text-white rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Search size={14} />
                  Rechercher
                </button>
              </form>

              {searchError && <p className="text-red-500 text-xs font-medium mt-1">❌ {searchError}</p>}

              {foundPatient && (
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Patient Identifié</span>
                    <h4 className="text-sm font-bold text-apple-dark mt-0.5">{foundPatient.firstName} {foundPatient.lastName}</h4>
                    <p className="text-xs text-apple-charcoal mt-0.5">{foundPatient.email}</p>
                  </div>
                  <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 size={20} />
                  </div>
                </div>
              )}
            </div>

            {/* Étape 2 : Ajouter des médicaments */}
            <div className="p-6 rounded-2xl bg-white border border-apple-border/30 flex flex-col gap-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-apple-dark">2. Ajouter des Médicaments à l'Ordonnance</h3>
              
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-apple-charcoal uppercase tracking-wider">Sélectionner un produit</label>
                  <select
                    value={selectedMedId}
                    onChange={(e) => setSelectedMedId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-xs transition-all duration-200 bg-white"
                  >
                    {medicaments.map(m => (
                      <option key={m.id} value={m.id}>{m.nom} ({m.forme})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-[10px] font-semibold text-apple-charcoal uppercase tracking-wider">Dosage unitaire</label>
                    <input
                      type="text"
                      placeholder="Ex: 1 comprimé"
                      value={itemDosage}
                      onChange={(e) => setItemDosage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-xs transition-all duration-200"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-apple-charcoal uppercase tracking-wider">Quantité</label>
                    <input
                      type="number"
                      min={1}
                      value={itemQuantite}
                      onChange={(e) => setItemQuantite(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-xs transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-apple-charcoal uppercase tracking-wider">Instructions de prise (Posologie)</label>
                  <input
                    type="text"
                    placeholder="Ex: Matin et Soir avant le repas"
                    value={itemPosologie}
                    onChange={(e) => setItemPosologie(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-xs transition-all duration-200"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-apple-charcoal uppercase tracking-wider">Durée du traitement</label>
                  <input
                    type="text"
                    placeholder="Ex: 5 jours, 1 mois, etc."
                    value={itemDuree}
                    onChange={(e) => setItemDuree(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-xs transition-all duration-200"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full mt-2 py-2.5 rounded-xl border border-apple-blue hover:bg-apple-blue/5 text-apple-blue text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={16} />
                  Ajouter le médicament à l'ordonnance
                </button>
              </div>
            </div>
          </div>

          {/* Draft Ordonnance droite */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="p-6 rounded-2xl bg-white border border-apple-border/30 flex flex-col gap-4 sticky top-24 shadow-sm">
              <div className="border-b border-apple-border/30 pb-3 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-apple-dark">Contenu de l'Ordonnance</span>
                <span className="text-[10px] bg-amber-50 text-amber-600 font-semibold px-2 py-0.5 rounded-full border border-amber-100">Brouillon Actif</span>
              </div>

              {prescribedItems.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center gap-2 text-apple-charcoal/50">
                  <Pill size={32} className="stroke-[1.5]" />
                  <p className="text-xs">Aucun médicament ajouté à la prescription pour le moment.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {prescribedItems.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-apple-lightGrey/80 border border-apple-border/20 flex items-start justify-between gap-3 text-xs">
                      <div className="flex-1">
                        <p className="font-bold text-apple-dark">{item.nom}</p>
                        <p className="text-apple-charcoal mt-1">Dosage : <strong className="font-semibold">{item.dosage}</strong> (Qté : {item.quantite}){item.duree && <span> • Durée : <strong className="font-semibold">{item.duree}</strong></span>}</p>
                        <p className="text-apple-charcoal mt-0.5 text-[11px] italic">Posologie : {item.posologie}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition-all duration-200"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Success Screen */}
              {successCode && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col gap-2 text-center animate-in zoom-in duration-300">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center justify-center gap-1">
                    <CheckCircle2 size={12} />
                    Rédigé avec Succès !
                  </span>
                  <p className="text-xs text-apple-dark font-medium">{successMsg}</p>
                  <p className="text-sm font-semibold text-apple-blue bg-white border border-apple-blue/20 rounded-lg p-2 tracking-[2px] mt-1">
                    {successCode}
                  </p>
                  <p className="text-[10px] text-apple-charcoal">Partagez ce code avec le patient. Il lui permettra de retirer ses médicaments dans n'importe quelle pharmacie agréée d'Antananarivo.</p>
                </div>
              )}

              {error && <p className="text-red-500 text-xs font-medium text-center">❌ {error}</p>}

              <button
                type="button"
                onClick={handleSignPrescription}
                disabled={!foundPatient || prescribedItems.length === 0 || submitting}
                className="w-full py-3 rounded-xl bg-apple-blue hover:bg-apple-blue/95 disabled:bg-gray-100 disabled:text-gray-400 text-white text-xs font-semibold shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send size={14} />
                {submitting ? "Signature en cours..." : "Valider & Signer l'ordonnance"}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* 2. CONSULTER LES STOCKS DU RÉSEAU */}
      {activeTab === 'medecin_stocks' && (
        <div className="p-6 rounded-2xl bg-white border border-apple-border/30 flex flex-col gap-6">
          <div>
            <h3 className="text-base font-bold text-apple-dark">Vérification de Disponibilité des Médicaments</h3>
            <p className="text-xs text-apple-charcoal mt-1">Recherchez un produit pour identifier en temps réel les pharmacies de votre zone ayant des stocks disponibles avant de rédiger l'ordonnance.</p>
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-apple-charcoal uppercase tracking-wider">Sélectionner le médicament à vérifier</label>
              <select
                value={lookupMedId}
                onChange={(e) => setLookupMedId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-apple-border/40 focus:border-apple-blue focus:outline-none text-xs bg-white"
              >
                {medicaments.map(m => (
                  <option key={m.id} value={m.id}>{m.nom} ({m.forme})</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleLookupStocks}
              disabled={searchingStocks}
              className="px-6 py-2.5 bg-apple-blue hover:bg-apple-blue/95 text-white rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Search size={14} />
              {searchingStocks ? "Interrogation..." : "Vérifier le stock"}
            </button>
          </div>

          {/* Résultats de stock */}
          <div className="mt-4">
            {lookupStocks.length === 0 ? (
              <div className="py-12 text-center text-apple-charcoal/50 flex flex-col items-center justify-center gap-2">
                <Eye size={36} className="stroke-[1.2] text-apple-blue/40" />
                <p className="text-xs">Sélectionnez un médicament et cliquez sur Vérifier pour afficher les officines.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-apple-dark uppercase tracking-wider">Officines avec stocks actifs (Antananarivo) :</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lookupStocks.map(stock => {
                    const isDoctorZone = stock.pharmacie.zone?.toLowerCase() === user.zone?.toLowerCase();
                    return (
                      <div key={stock.id} className={`p-4 rounded-xl border flex flex-col gap-2 shadow-sm ${
                        isDoctorZone ? 'bg-apple-blue/5 border-apple-blue/30' : 'bg-white border-apple-border/30'
                      }`}>
                        <div className="flex justify-between items-start gap-2">
                          <h5 className="font-bold text-xs text-apple-dark leading-tight">{stock.pharmacie.name}</h5>
                          {isDoctorZone && (
                            <span className="text-[9px] bg-apple-blue text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                              Ma Zone
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-apple-charcoal flex items-center gap-1">
                          <MapPin size={12} className="text-apple-charcoal/60" />
                          <span>Quartier : {stock.pharmacie.zone}</span>
                        </p>
                        <p className="text-[11px] text-apple-charcoal">📞 Tél : {stock.pharmacie.phone}</p>
                        
                        <div className="mt-2 flex items-center justify-between border-t border-apple-border/20 pt-2 text-xs">
                          <span className="text-apple-charcoal">Quantité disponible :</span>
                          <span className={`font-bold px-2.5 py-0.5 rounded-full ${
                            stock.quantite > 50 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {stock.quantite} boîtes
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. HISTORIQUE DES PRESCRIPTIONS ÉMISES */}
      {activeTab === 'medecin_history' && (
        <div className="p-6 rounded-2xl bg-white border border-apple-border/30 flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-apple-dark">Registre des Ordonnances Rédigées</h3>
            <p className="text-xs text-apple-charcoal mt-1">Consultez l'état et l'historique complet des prescriptions électroniques émises sous votre signature.</p>
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center text-apple-charcoal/40 flex flex-col items-center justify-center gap-2">
              <History size={36} className="stroke-[1.2]" />
              <p className="text-xs">Vous n'avez pas encore rédigé d'ordonnance sur la plateforme.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-apple-border/40 text-apple-charcoal uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-2">Code Unique</th>
                    <th className="py-3 px-2">Patient</th>
                    <th className="py-3 px-2">Date d'Émission</th>
                    <th className="py-3 px-2">Médicaments Prescrits</th>
                    <th className="py-3 px-2 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-apple-border/20">
                  {history.map(p => (
                    <tr key={p.id} className="hover:bg-apple-lightGrey/40 transition-all duration-150">
                      <td className="py-4 px-2 font-mono font-bold text-apple-blue tracking-wider">{p.code}</td>
                      <td className="py-4 px-2 font-medium text-apple-dark">{p.patientName}</td>
                      <td className="py-4 px-2 text-apple-charcoal">{new Date(p.dateEmission).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                      <td className="py-4 px-2 text-apple-charcoal max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {p.medicaments.map((m, idx) => (
                            <span key={idx} className="bg-apple-lightGrey text-apple-dark text-[10px] px-2 py-0.5 rounded border border-apple-border/30">
                              {m.nom} ({m.quantite})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full font-semibold text-[10px] uppercase ${
                          p.status === 'DELIVREE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {p.status === 'DELIVREE' ? 'Délivrée' : 'En Attente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. MES PATIENTS ASSIGNÉS (choisis par le patient à l'inscription) */}
      {activeTab === 'medecin_patients' && (
        <div className="p-6 rounded-2xl bg-white border border-apple-border/30 flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-apple-dark">Mes Patients Assignés</h3>
            <p className="text-xs text-apple-charcoal mt-1">Liste des patients qui vous ont choisi comme médecin traitant lors de leur inscription sur la plateforme.</p>
          </div>

          {loadingPatients ? (
            <div className="py-12 text-center text-apple-charcoal/40 text-xs">Chargement...</div>
          ) : !myPatientsLinked ? (
            <div className="py-10 text-center text-apple-charcoal/60 flex flex-col items-center justify-center gap-2 px-6">
              <Stethoscope size={36} className="stroke-[1.2] text-amber-500/60" />
              <p className="text-xs max-w-md">{myPatientsMsg}</p>
              <p className="text-[10px] text-apple-charcoal/50">(Un administrateur doit relier votre compte à une fiche médecin vitrine pour activer cette fonctionnalité.)</p>
            </div>
          ) : myPatients.length === 0 ? (
            <div className="py-12 text-center text-apple-charcoal/40 flex flex-col items-center justify-center gap-2">
              <Users size={36} className="stroke-[1.2]" />
              <p className="text-xs">Aucun patient ne vous a encore choisi comme médecin traitant.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-apple-border/40 text-apple-charcoal uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-2">Patient</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">Téléphone</th>
                    <th className="py-3 px-2 text-center">Statut du compte</th>
                    <th className="py-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-apple-border/20">
                  {myPatients.map(p => (
                    <tr key={p.userId} className="hover:bg-apple-lightGrey/40 transition-all duration-150">
                      <td className="py-4 px-2 font-medium text-apple-dark">{p.firstName} {p.lastName}</td>
                      <td className="py-4 px-2 text-apple-charcoal">{p.email}</td>
                      <td className="py-4 px-2 text-apple-charcoal">{p.phone || '—'}</td>
                      <td className="py-4 px-2 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full font-semibold text-[10px] uppercase ${
                          p.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {p.status === 'ACTIVE' ? 'Actif' : p.status}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setActiveChatPatient(p);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-semibold hover:bg-emerald-600 transition-all duration-200 cursor-pointer flex items-center gap-1"
                        >
                          <MessageCircle size={12} /> Discuter
                        </button>
                        <button
                          onClick={() => {
                            setPatientEmail(p.email);
                            setActiveTab('medecin_prescrire');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-apple-blue/10 text-apple-blue text-[10px] font-semibold hover:bg-apple-blue/20 transition-all duration-200 cursor-pointer"
                        >
                          Prescrire
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. DEMANDES DE RENOUVELLEMENT */}
      {activeTab === 'medecin_renewals' && (
        <div className="p-6 rounded-2xl bg-white border border-apple-border/30 flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-apple-dark">Demandes de Renouvellement</h3>
            <p className="text-xs text-apple-charcoal mt-1">Gérez les demandes de renouvellement d'ordonnance initiées par vos patients pour leurs anciens traitements.</p>
          </div>

          {loadingRenewals ? (
            <div className="py-12 text-center text-apple-charcoal/40 text-xs">Chargement des demandes...</div>
          ) : renewals.length === 0 ? (
            <div className="py-12 text-center text-apple-charcoal/40 flex flex-col items-center justify-center gap-2">
              <RefreshCw size={36} className="stroke-[1.2] text-apple-charcoal/50 animate-none" />
              <p className="text-xs">Aucune demande de renouvellement en attente.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {renewals.map(r => (
                <div key={r.id} className="p-5 rounded-2xl bg-apple-lightGrey/50 border border-apple-border/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-apple-blue font-bold text-xs bg-apple-blue/10 px-2 py-0.5 rounded">
                        {r.code}
                      </span>
                      <span className="text-xs font-semibold text-apple-dark">
                        Patient : <strong className="font-bold">{r.patient?.profile?.firstName} {r.patient?.profile?.lastName}</strong> ({r.patient?.email})
                      </span>
                    </div>
                    
                    <div className="bg-white p-3.5 rounded-xl border border-apple-border/20 text-xs mt-1">
                      <p className="font-semibold text-apple-dark mb-2">Médicaments à renouveler :</p>
                      <div className="flex flex-col gap-2">
                        {r.medicaments.map((med, idx) => (
                          <div key={idx} className="flex flex-wrap gap-2 text-apple-charcoal">
                            <span className="font-bold text-apple-dark">• {med.nom}</span>
                            <span>(Qté: {med.quantite})</span>
                            {med.dosage && <span>• Dosage: {med.dosage}</span>}
                            {med.posologie && <span className="italic">• Posologie: {med.posologie}</span>}
                            {med.duree && <span className="font-medium text-blue-600">• Durée: {med.duree}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveRenewal(r.id)}
                      className="px-4 py-2 bg-apple-blue text-white rounded-xl text-xs font-semibold hover:bg-apple-blue/90 shadow-sm transition-all duration-200 cursor-pointer"
                    >
                      Approuver & Générer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CHAT SECURE MODAL */}
      {activeChatPatient && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg h-[80vh] rounded-[2.5rem] relative flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-gray-900 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-white uppercase">
                  {activeChatPatient.firstName[0]}{activeChatPatient.lastName[0]}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">{activeChatPatient.firstName} {activeChatPatient.lastName}</h3>
                  <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">Patient Assigné</span>
                </div>
              </div>
              <button onClick={() => setActiveChatPatient(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors cursor-pointer"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-gray-50/50">
              {chatMessages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <MessageCircle size={48} className="mb-4 opacity-50"/>
                  <p className="text-xs font-semibold">Aucun message échangé pour l'instant.</p>
                  <p className="text-[10px] text-gray-400/80 mt-1">Commencez la discussion sécurisée avec votre patient.</p>
                </div>
              ) : (
                chatMessages.map(m => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-2xl max-w-[80%] text-xs font-medium shadow-sm leading-relaxed ${
                      m.senderId === user.id
                        ? 'bg-emerald-500 text-white self-end rounded-br-none'
                        : 'bg-white border border-gray-100 text-gray-800 self-start rounded-bl-none'
                    }`}
                  >
                    {m.content}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
              <input
                type="text"
                value={newMessageText}
                onChange={e => setNewMessageText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendDoctorMessage()}
                className="flex-1 bg-gray-100 rounded-2xl px-5 text-xs outline-none font-medium focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Écrivez votre message sécurisé..."
              />
              <button
                onClick={sendDoctorMessage}
                className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-colors cursor-pointer animate-none"
              >
                <Send size={16}/>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
