import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Pill, Plus, Trash2, Send, CheckCircle2, History, MapPin, Eye, Navigation, Users, Stethoscope, MessageCircle, X, RefreshCw, ClipboardList } from 'lucide-react';
import { API_URL } from '../config';
import PrescriptionPreview from './ui/PrescriptionPreview';
import DashboardLayout from './dashboard/DashboardLayout';

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

  // Menu items for sidebar layout coordination
  const menuItems = [
    { id: 'medecin_prescrire', label: 'Rédiger Ordonnance', icon: Stethoscope },
    { id: 'medecin_stocks', label: 'Stocks Réseau', icon: Pill },
    { id: 'medecin_history', label: 'Historique', icon: ClipboardList },
    { id: 'medecin_patients', label: 'Mes Patients', icon: Users },
    { id: 'medecin_renewals', label: 'Renouvellements', icon: RefreshCw },
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
      {/* 1. RÉDIGER UNE ORDONNANCE */}
      {activeTab === 'medecin_prescrire' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Formulaire Rédiger (Gauche) */}
          <div className="xl:col-span-6 flex flex-col gap-6">
            
            {/* Étape 1 : Recherche Patient */}
            <div className="p-6 rounded-3xl bg-white/50 backdrop-blur-md border border-slate-200/50 shadow-sm flex flex-col gap-4">
              <span className="text-[10px] font-black tracking-widest text-teal-600 uppercase">Étape 1</span>
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Rechercher le Patient rattaché</h3>
              
              <form onSubmit={handleSearchPatient} className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="Saisir l'adresse email du patient..."
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 focus:outline-none text-xs transition-all font-medium bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 bg-slate-900 hover:bg-teal-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Search size={14} />
                  Trouver
                </button>
              </form>

              {searchError && <p className="text-red-500 text-xs font-bold mt-1">❌ {searchError}</p>}

              {foundPatient && (
                <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/10 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex gap-3 items-center">
                    <div className="p-2.5 bg-teal-500/10 text-teal-600 rounded-xl">
                      <UserPlus size={18} />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest block">Dossier Associé</span>
                      <h4 className="text-xs font-extrabold text-slate-800 mt-0.5">{foundPatient.firstName} {foundPatient.lastName}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{foundPatient.email}</p>
                    </div>
                  </div>
                  <div className="p-1.5 rounded-full bg-teal-500 text-white shadow-md">
                    <CheckCircle2 size={14} />
                  </div>
                </div>
              )}
            </div>

            {/* Étape 2 : Ajouter des médicaments */}
            <div className="p-6 rounded-3xl bg-white/50 backdrop-blur-md border border-slate-200/50 shadow-sm flex flex-col gap-4">
              <span className="text-[10px] font-black tracking-widest text-teal-600 uppercase">Étape 2</span>
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Ajouter des Médicaments</h3>
              
              <div className="flex flex-col gap-4 mt-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sélectionner un produit dans le registre</label>
                  <select
                    value={selectedMedId}
                    onChange={(e) => setSelectedMedId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:outline-none text-xs transition-all font-bold bg-white"
                  >
                    {medicaments.map(m => (
                      <option key={m.id} value={m.id}>{m.nom} ({m.forme})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dosage unitaire</label>
                    <input
                      type="text"
                      placeholder="Ex: 1 comprimé"
                      value={itemDosage}
                      onChange={(e) => setItemDosage(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:outline-none text-xs transition-all font-semibold bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quantité (Boîtes)</label>
                    <input
                      type="number"
                      min={1}
                      value={itemQuantite}
                      onChange={(e) => setItemQuantite(parseInt(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:outline-none text-xs transition-all font-extrabold bg-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Instructions de prise (Posologie)</label>
                  <input
                    type="text"
                    placeholder="Ex: Matin et Soir avant le repas"
                    value={itemPosologie}
                    onChange={(e) => setItemPosologie(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:outline-none text-xs transition-all font-semibold bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Durée de traitement recommandée</label>
                  <input
                    type="text"
                    placeholder="Ex: 5 jours, 1 mois, etc."
                    value={itemDuree}
                    onChange={(e) => setItemDuree(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:outline-none text-xs transition-all font-semibold bg-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full mt-2 py-3 rounded-xl border border-teal-500/20 hover:bg-teal-50/50 text-teal-600 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={15} strokeWidth={2.5} />
                  Insérer à la feuille de soin
                </button>
              </div>
            </div>

            {/* Actions de validation */}
            <div className="p-6 rounded-3xl bg-white/50 backdrop-blur-md border border-slate-200/50 shadow-sm flex flex-col gap-4">
              <span className="text-[10px] font-black tracking-widest text-teal-600 uppercase">Étape 3</span>
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Validation & Signature</h3>
              <p className="text-xs text-slate-400 leading-normal font-medium mt-0.5">
                Veuillez relire attentivement l'ordonnance générée à droite. Une fois signée électroniquement, l'ordonnance sera enregistrée et un code unique ORD-XXXX sera généré.
              </p>

              {error && <p className="text-red-500 text-xs font-bold text-center mt-1">❌ {error}</p>}
              
              {successCode && (
                <div className="p-5 rounded-2xl bg-teal-500/5 border border-teal-500/10 flex flex-col gap-2.5 text-center animate-in zoom-in duration-300">
                  <span className="text-xs font-black text-teal-600 uppercase tracking-widest flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={14} />
                    PRESCRIPTION ENREGISTRÉE !
                  </span>
                  <p className="text-[11px] text-slate-500 font-bold leading-normal">{successMsg}</p>
                  <div className="bg-white border border-teal-500/20 rounded-xl p-3 shadow-inner">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Code d'ordonnance officiel</span>
                    <p className="text-lg font-mono font-black text-teal-600 tracking-[3px] mt-1">
                      {successCode}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal font-semibold mt-1">
                    Communiquez ce code au patient. Il recevra également un email d'Apteka avec sa prescription officielle et son QR code.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleSignPrescription}
                disabled={!foundPatient || prescribedItems.length === 0 || submitting || !!successCode}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-400 hover:to-sky-400 disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-400 text-white text-xs font-black shadow-lg shadow-teal-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
              >
                <Send size={14} />
                {submitting ? "Cryptage & Signature..." : successCode ? "Prescription Signée avec succès" : "Signer l'ordonnance (Estampillage)"}
              </button>

              {successCode && (
                <button
                  type="button"
                  onClick={() => {
                    setSuccessCode('');
                    setSuccessMsg('');
                    setPatient(null);
                    setPatientEmail('');
                    setPrescribedItems([]);
                  }}
                  className="w-full py-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-700 text-xs font-black transition-all cursor-pointer"
                >
                  Rédiger une nouvelle ordonnance
                </button>
              )}
            </div>

          </div>

          {/* Draft Ordonnance droite (A4 Live Preview) */}
          <div className="xl:col-span-6 flex flex-col gap-4">
            <div className="flex justify-between items-center px-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Aperçu en temps réel</span>
              {prescribedItems.length > 0 && !successCode && (
                <button
                  onClick={() => {
                    if (confirm("Effacer tout le brouillon ?")) setPrescribedItems([]);
                  }}
                  className="text-[10px] font-black text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Vider le brouillon
                </button>
              )}
            </div>
            
            {/* Live Paper Preview */}
            <div className="relative group">
              {prescribedItems.length > 0 && !successCode && (
                /* Interactive removal helper overlay */
                <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-black px-4 py-3 rounded-2xl shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 flex flex-col gap-1 text-center">
                  <span>💡 Note de l'Éditeur</span>
                  <span className="text-slate-350 font-semibold">Pour retirer un produit, cliquez sur sa ligne ci-dessous !</span>
                </div>
              )}

              <div 
                onClick={(e) => {
                  if (successCode) return;
                  // Handle interactive deletion directly on clicking a line item in the live A4 preview!
                  const targetLine = e.target.closest('[class*="hover:bg-emerald-50"]');
                  if (targetLine) {
                    const lineIndex = Array.from(targetLine.parentNode.children).indexOf(targetLine);
                    if (lineIndex !== -1) {
                      handleRemoveItem(lineIndex);
                    }
                  }
                }}
                className={successCode ? "" : "cursor-pointer"}
              >
                <PrescriptionPreview
                  doctor={{
                    lastName: user.lastName,
                    email: user.email,
                    specialite: user.zone ? "Médecin conventionné - " + user.zone : "Médecin conventionné - Analakely"
                  }}
                  patient={foundPatient}
                  items={prescribedItems}
                  code={successCode}
                  signed={!!successCode}
                />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 2. CONSULTER LES STOCKS DU RÉSEAU */}
      {activeTab === 'medecin_stocks' && (
        <div className="p-6 rounded-3xl bg-white/50 backdrop-blur-md border border-slate-200/50 shadow-sm flex flex-col gap-6">
          <div>
            <h3 className="text-base font-bold text-slate-850">Vérification de Disponibilité des Médicaments</h3>
            <p className="text-xs text-slate-500 mt-1">Recherchez un produit pour identifier en temps réel les pharmacies de votre zone ayant des stocks disponibles avant de rédiger l'ordonnance.</p>
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Sélectionner le médicament à vérifier</label>
              <select
                value={lookupMedId}
                onChange={(e) => setLookupMedId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:outline-none text-xs bg-white"
              >
                {medicaments.map(m => (
                  <option key={m.id} value={m.id}>{m.nom} ({m.forme})</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleLookupStocks}
              disabled={searchingStocks}
              className="px-6 py-3.5 bg-gradient-to-r from-teal-500 to-sky-500 text-white rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Search size={14} />
              {searchingStocks ? "Interrogation..." : "Vérifier le stock"}
            </button>
          </div>

          {/* Résultats de stock */}
          <div className="mt-4">
            {lookupStocks.length === 0 ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Eye size={36} className="stroke-[1.2] text-teal-500/40" />
                <p className="text-xs">Sélectionnez un médicament et cliquez sur Vérifier pour afficher les officines.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider">Officines avec stocks actifs (Antananarivo) :</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lookupStocks.map(stock => {
                    const isDoctorZone = stock.pharmacie.zone?.toLowerCase() === user.zone?.toLowerCase();
                    return (
                      <div key={stock.id} className={`p-4 rounded-xl border flex flex-col gap-2 shadow-sm ${
                        isDoctorZone ? 'bg-teal-500/5 border-teal-500/30' : 'bg-white border-slate-200/40'
                      }`}>
                        <div className="flex justify-between items-start gap-2">
                          <h5 className="font-bold text-xs text-slate-800 leading-tight">{stock.pharmacie.name}</h5>
                          {isDoctorZone && (
                            <span className="text-[9px] bg-teal-500 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                              Ma Zone
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin size={12} className="text-slate-450" />
                          <span>Quartier : {stock.pharmacie.zone}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 font-semibold">📞 Tél : {stock.pharmacie.phone}</p>
                        
                        <div className="mt-2 flex items-center justify-between border-t border-slate-200/30 pt-2 text-xs">
                          <span className="text-slate-500">Quantité disponible :</span>
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
        <div className="p-6 rounded-3xl bg-white/50 backdrop-blur-md border border-slate-200/50 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-850">Registre des Ordonnances Rédigées</h3>
            <p className="text-xs text-slate-500 mt-1">Consultez l'état et l'historique complet des prescriptions électroniques émises sous votre signature.</p>
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <History size={36} className="stroke-[1.2]" />
              <p className="text-xs">Vous n'avez pas encore rédigé d'ordonnance sur la plateforme.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/40 text-slate-500 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-2">Code Unique</th>
                    <th className="py-3 px-2">Patient</th>
                    <th className="py-3 px-2">Date d'Émission</th>
                    <th className="py-3 px-2">Médicaments Prescrits</th>
                    <th className="py-3 px-2 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map(p => (
                    <tr key={p.id} className="hover:bg-teal-50/20 transition-all duration-150">
                      <td className="py-4 px-2 font-mono font-bold text-teal-600 tracking-wider">{p.code}</td>
                      <td className="py-4 px-2 font-medium text-slate-850">{p.patientName}</td>
                      <td className="py-4 px-2 text-slate-500">{new Date(p.dateEmission).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                      <td className="py-4 px-2 text-slate-500 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {p.medicaments.map((m, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded border border-slate-200/50 font-semibold">
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
        <div className="p-6 rounded-3xl bg-white/50 backdrop-blur-md border border-slate-200/50 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-850">Mes Patients Assignés</h3>
            <p className="text-xs text-slate-500 mt-1">Liste des patients qui vous ont choisi comme médecin traitant lors de leur inscription sur la plateforme.</p>
          </div>

          {loadingPatients ? (
            <div className="py-12 text-center text-slate-400 text-xs">Chargement...</div>
          ) : !myPatientsLinked ? (
            <div className="py-10 text-center text-slate-500 flex flex-col items-center justify-center gap-2 px-6">
              <Stethoscope size={36} className="stroke-[1.2] text-amber-500/60" />
              <p className="text-xs max-w-md">{myPatientsMsg}</p>
              <p className="text-[10px] text-slate-400/80">(Un administrateur doit relier votre compte à une fiche médecin vitrine pour activer cette fonctionnalité.)</p>
            </div>
          ) : myPatients.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Users size={36} className="stroke-[1.2]" />
              <p className="text-xs">Aucun patient ne vous a encore choisi comme médecin traitant.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/40 text-slate-500 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-2">Patient</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">Téléphone</th>
                    <th className="py-3 px-2 text-center">Statut du compte</th>
                    <th className="py-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myPatients.map(p => (
                    <tr key={p.userId} className="hover:bg-teal-50/20 transition-all duration-150">
                      <td className="py-4 px-2 font-medium text-slate-800">{p.firstName} {p.lastName}</td>
                      <td className="py-4 px-2 text-slate-500">{p.email}</td>
                      <td className="py-4 px-2 text-slate-500">{p.phone || '—'}</td>
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
                          className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <MessageCircle size={12} /> Discuter
                        </button>
                        <button
                          onClick={() => {
                            setPatientEmail(p.email);
                            setActiveTab('medecin_prescrire');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-all cursor-pointer"
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
        <div className="p-6 rounded-3xl bg-white/50 backdrop-blur-md border border-slate-200/50 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-850">Demandes de Renouvellement</h3>
            <p className="text-xs text-slate-500 mt-1">Gérez les demandes de renouvellement d'ordonnance initiées par vos patients pour leurs anciens traitements.</p>
          </div>

          {loadingRenewals ? (
            <div className="py-12 text-center text-slate-400 text-xs">Chargement des demandes...</div>
          ) : renewals.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw size={36} className="stroke-[1.2] text-slate-400" />
              <p className="text-xs">Aucune demande de renouvellement en attente.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {renewals.map(r => (
                <div key={r.id} className="p-5 rounded-2xl bg-white/60 border border-slate-200/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-teal-600 font-bold text-xs bg-teal-500/10 px-2.5 py-1 rounded-lg">
                        {r.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">
                        Patient : <strong className="font-bold text-slate-900">{r.patient?.profile?.firstName} {r.patient?.profile?.lastName}</strong> ({r.patient?.email})
                      </span>
                    </div>
                    
                    <div className="bg-white/75 p-3.5 rounded-xl border border-slate-200/40 text-xs mt-1">
                      <p className="font-bold text-slate-850 mb-2">Médicaments à renouveler :</p>
                      <div className="flex flex-col gap-2">
                        {r.medicaments.map((med, idx) => (
                          <div key={idx} className="flex flex-wrap gap-2 text-slate-500 font-semibold">
                            <span className="font-bold text-slate-800">• {med.nom}</span>
                            <span>(Qté: {med.quantite})</span>
                            {med.dosage && <span>• Dosage: {med.dosage}</span>}
                            {med.posologie && <span className="italic">• Posologie: {med.posologie}</span>}
                            {med.duree && <span className="font-medium text-teal-600">• Durée: {med.duree}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handleApproveRenewal(r.id)}
                      className="px-5 py-3 bg-gradient-to-r from-teal-500 to-sky-500 text-white rounded-xl text-xs font-bold hover:from-teal-400 hover:to-sky-400 shadow-sm shadow-teal-500/10 transition-all cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-2xl w-full max-w-lg h-[80vh] rounded-[2.5rem] border border-white/60 relative flex flex-col overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-teal-600 to-sky-600 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 border border-white/30 rounded-full flex items-center justify-center font-bold text-white uppercase">
                  {activeChatPatient.firstName[0]}{activeChatPatient.lastName[0]}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">{activeChatPatient.firstName} {activeChatPatient.lastName}</h3>
                  <span className="text-[10px] text-teal-200 font-bold tracking-widest uppercase block mt-0.5">Discussion Sécurisée</span>
                </div>
              </div>
              <button onClick={() => setActiveChatPatient(null)} className="p-2 hover:bg-white/25 rounded-full transition-colors cursor-pointer"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-slate-50/40">
              {chatMessages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <MessageCircle size={48} className="mb-4 opacity-50 text-teal-500" />
                  <p className="text-xs font-bold text-slate-600">Aucun message échangé pour l'instant.</p>
                  <p className="text-[10px] text-slate-400/80 mt-1">Commencez la discussion sécurisée avec votre patient.</p>
                </div>
              ) : (
                chatMessages.map(m => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-2xl max-w-[80%] text-xs font-semibold shadow-sm leading-relaxed ${
                      m.senderId === user.id
                        ? 'bg-teal-500 text-white self-end rounded-br-none'
                        : 'bg-white border border-slate-200/40 text-slate-800 self-start rounded-bl-none'
                    }`}
                  >
                    {m.content}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
              <input
                type="text"
                value={newMessageText}
                onChange={e => setNewMessageText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendDoctorMessage()}
                className="flex-1 bg-slate-100 rounded-2xl px-5 text-xs outline-none font-semibold focus:ring-2 focus:ring-teal-500/20"
                placeholder="Écrivez votre message sécurisé..."
              />
              <button
                onClick={sendDoctorMessage}
                className="w-12 h-12 bg-teal-500 hover:bg-teal-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
              >
                <Send size={16}/>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
