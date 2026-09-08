import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Pill, Plus, Trash2, Send, CheckCircle2, History, MapPin, Eye, Navigation, Users, Stethoscope, MessageCircle, X, RefreshCw, ClipboardList } from 'lucide-react';
import { API_URL } from '../config';
import { notify } from '../utils/notify';
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

  // Chat / Messages State
  const [activeChatPatient, setActiveChatPatient] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  // Renewal Requests State
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

  // Renewal Requests logic
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
        notify("Renouvellement approuvé ! Nouveau code généré : " + data.newOrdonnance.code, 'success');
        loadRenewals();
      } else {
        notify(data.error || "Une erreur est survenue lors de l'approbation.", 'error');
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

  // Chat functions
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

    if (prescribedItems.some(item => item.medicamentId === med.id)) {
      notify("Ce médicament est déjà présent dans l'ordonnance.", 'error');
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

    setItemDosage('1 comprimé');
    setItemQuantite(1);
    setItemPosologie('3 fois par jour');
    setItemDuree('5 jours');
  };

  const handleRemoveItem = (index) => {
    setPrescribedItems(prescribedItems.filter((_, i) => i !== index));
  };

  const handleSignPrescription = async () => {
    if (!foundPatient) return;
    if (prescribedItems.length === 0) {
      notify("Veuillez ajouter au moins un médicament à l'ordonnance.", 'error');
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
            <div className="p-6 rounded-[24px] glass-premium-dark flex flex-col gap-4">
              <span className="text-[10px] font-black tracking-widest text-[#00f0ff] uppercase">Étape 1</span>
              <h3 className="text-lg font-light text-white tracking-tight">Rechercher le Patient rattaché</h3>
              
              <form onSubmit={handleSearchPatient} className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="email"
                    required
                    placeholder="Saisir l'adresse email du patient..."
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] focus:outline-none text-xs transition-all font-medium text-white placeholder-white/40"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3.5 bg-white text-black hover:bg-[#00f0ff] rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-none"
                  data-cursor-magnet
                >
                  <Search size={14} />
                  Trouver
                </button>
              </form>

              {searchError && <p className="text-red-400 text-xs font-bold mt-1">❌ {searchError}</p>}

              {foundPatient && (
                <div className="p-4 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/20 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex gap-4 items-center">
                    <div className="p-3 bg-[#00f0ff]/20 text-[#00f0ff] rounded-xl">
                      <UserPlus size={18} />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-[#00f0ff] uppercase tracking-widest block">Dossier Associé</span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{foundPatient.firstName} {foundPatient.lastName}</h4>
                      <p className="text-[10px] text-white/50 font-medium mt-0.5">{foundPatient.email}</p>
                    </div>
                  </div>
                  <div className="p-1.5 rounded-full bg-[#00f0ff] text-black shadow-md shadow-[#00f0ff]/20">
                    <CheckCircle2 size={14} />
                  </div>
                </div>
              )}
            </div>

            {/* Étape 2 : Ajouter des médicaments */}
            <div className="p-6 rounded-[24px] glass-premium-dark flex flex-col gap-4">
              <span className="text-[10px] font-black tracking-widest text-[#00f0ff] uppercase">Étape 2</span>
              <h3 className="text-lg font-light text-white tracking-tight">Ajouter des Médicaments</h3>
              
              <div className="flex flex-col gap-5 mt-1">
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black text-white/50 uppercase tracking-widest">Sélectionner un produit dans le registre</label>
                  <select
                    value={selectedMedId}
                    onChange={(e) => setSelectedMedId(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-[#00f0ff] focus:outline-none text-xs transition-all font-medium text-white appearance-none"
                  >
                    {medicaments.map(m => (
                      <option key={m.id} value={m.id} className="bg-zinc-900">{m.nom} ({m.forme})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-2 col-span-2">
                    <label className="text-[9px] font-black text-white/50 uppercase tracking-widest">Dosage unitaire</label>
                    <input
                      type="text"
                      placeholder="Ex: 1 comprimé"
                      value={itemDosage}
                      onChange={(e) => setItemDosage(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-[#00f0ff] focus:outline-none text-xs transition-all font-medium text-white placeholder-white/30"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black text-white/50 uppercase tracking-widest">Quantité</label>
                    <input
                      type="number"
                      min={1}
                      value={itemQuantite}
                      onChange={(e) => setItemQuantite(parseInt(e.target.value))}
                      className="w-full px-4 py-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-[#00f0ff] focus:outline-none text-xs transition-all font-bold text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black text-white/50 uppercase tracking-widest">Instructions de prise (Posologie)</label>
                  <input
                    type="text"
                    placeholder="Ex: Matin et Soir avant le repas"
                    value={itemPosologie}
                    onChange={(e) => setItemPosologie(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-[#00f0ff] focus:outline-none text-xs transition-all font-medium text-white placeholder-white/30"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black text-white/50 uppercase tracking-widest">Durée de traitement recommandée</label>
                  <input
                    type="text"
                    placeholder="Ex: 5 jours, 1 mois, etc."
                    value={itemDuree}
                    onChange={(e) => setItemDuree(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-[#00f0ff] focus:outline-none text-xs transition-all font-medium text-white placeholder-white/30"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full mt-2 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-none"
                  data-cursor-magnet
                >
                  <Plus size={15} strokeWidth={2.5} />
                  Insérer à la feuille de soin
                </button>
              </div>
            </div>

            {/* Actions de validation */}
            <div className="p-6 rounded-[24px] glass-premium-dark flex flex-col gap-4">
              <span className="text-[10px] font-black tracking-widest text-[#00f0ff] uppercase">Étape 3</span>
              <h3 className="text-lg font-light text-white tracking-tight">Validation & Signature</h3>
              <p className="text-xs text-white/50 leading-relaxed mt-0.5">
                Veuillez relire attentivement l'ordonnance générée à droite. Une fois signée électroniquement, l'ordonnance sera enregistrée et un code unique ORD-XXXX sera généré.
              </p>

              {error && <p className="text-red-400 text-xs font-bold text-center mt-2">❌ {error}</p>}
              
              {successCode && (
                <div className="p-5 rounded-2xl bg-[#00f0ff]/10 border border-[#00f0ff]/20 flex flex-col gap-3 text-center animate-in zoom-in duration-300 mt-2">
                  <span className="text-xs font-black text-[#00f0ff] uppercase tracking-widest flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={16} />
                    PRESCRIPTION ENREGISTRÉE !
                  </span>
                  <p className="text-[11px] text-white/70 font-medium leading-normal">{successMsg}</p>
                  <div className="bg-black/40 border border-[#00f0ff]/30 rounded-xl p-4 shadow-inner">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block">Code d'ordonnance officiel</span>
                    <p className="text-xl font-mono font-black text-[#00f0ff] tracking-[4px] mt-1.5">
                      {successCode}
                    </p>
                  </div>
                  <p className="text-[10px] text-white/50 leading-relaxed mt-1">
                    Communiquez ce code au patient. Il recevra également un email d'Apteka avec sa prescription officielle et son QR code.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleSignPrescription}
                disabled={!foundPatient || prescribedItems.length === 0 || submitting || !!successCode}
                className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-[#00f0ff] to-blue-500 hover:from-[#00c0cc] hover:to-blue-600 disabled:from-white/10 disabled:to-white/10 disabled:text-white/30 text-black text-xs font-bold shadow-lg shadow-[#00f0ff]/20 transition-all flex items-center justify-center gap-2 cursor-none"
                data-cursor-magnet
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
                  className="w-full py-3.5 mt-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all cursor-none"
                  data-cursor-magnet
                >
                  Rédiger une nouvelle ordonnance
                </button>
              )}
            </div>

          </div>

          {/* Draft Ordonnance droite (A4 Live Preview) */}
          <div className="xl:col-span-6 flex flex-col gap-4">
            <div className="flex justify-between items-center px-2">
              <span className="text-xs font-black uppercase tracking-wider text-white/40">Aperçu en temps réel</span>
              {prescribedItems.length > 0 && !successCode && (
                <button
                  onClick={() => {
                    if (confirm("Effacer tout le brouillon ?")) setPrescribedItems([]);
                  }}
                  className="text-[10px] font-bold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors cursor-none"
                  data-cursor-magnet
                >
                  Vider le brouillon
                </button>
              )}
            </div>
            
            {/* Live Paper Preview */}
            <div className="relative group">
              {prescribedItems.length > 0 && !successCode && (
                /* Interactive removal helper overlay */
                <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-md text-white text-[10px] font-medium px-4 py-3 rounded-2xl shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 flex flex-col gap-1 text-center border border-white/10">
                  <span className="text-[#00f0ff] font-bold">💡 Note de l'Éditeur</span>
                  <span className="text-white/70">Pour retirer un produit, cliquez sur sa ligne ci-dessous !</span>
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
                className={successCode ? "" : "cursor-none"}
                data-cursor-magnet={!successCode ? "true" : undefined}
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
        <div className="p-8 rounded-[24px] glass-premium-dark flex flex-col gap-8">
          <div>
            <h3 className="text-2xl font-light text-white tracking-tight">Vérification de Disponibilité des Médicaments</h3>
            <p className="text-xs text-white/50 mt-2">Recherchez un produit pour identifier en temps réel les pharmacies de votre zone ayant des stocks disponibles avant de rédiger l'ordonnance.</p>
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">Sélectionner le médicament à vérifier</label>
              <select
                value={lookupMedId}
                onChange={(e) => setLookupMedId(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-black/40 border border-white/10 focus:border-[#00f0ff] focus:outline-none text-sm font-medium text-white appearance-none"
              >
                {medicaments.map(m => (
                  <option key={m.id} value={m.id} className="bg-zinc-900">{m.nom} ({m.forme})</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleLookupStocks}
              disabled={searchingStocks}
              className="px-8 py-4 bg-white text-black hover:bg-[#00f0ff] rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 cursor-none disabled:opacity-50"
              data-cursor-magnet
            >
              <Search size={16} />
              {searchingStocks ? "Interrogation..." : "Vérifier le stock"}
            </button>
          </div>

          {/* Résultats de stock */}
          <div className="mt-4">
            {lookupStocks.length === 0 ? (
              <div className="py-20 text-center text-white/30 flex flex-col items-center justify-center gap-4">
                <Eye size={48} className="stroke-[1] opacity-50" />
                <p className="text-sm font-medium">Sélectionnez un médicament et cliquez sur Vérifier pour afficher les officines.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <h4 className="text-xs font-black text-[#00f0ff] uppercase tracking-widest">Officines avec stocks actifs (Antananarivo) :</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lookupStocks.map(stock => {
                    const isDoctorZone = stock.pharmacie.zone?.toLowerCase() === user.zone?.toLowerCase();
                    return (
                      <div key={stock.id} className={`p-6 rounded-2xl border flex flex-col gap-3 transition-all ${
                        isDoctorZone ? 'bg-[#00f0ff]/10 border-[#00f0ff]/30' : 'bg-white/5 border-white/10'
                      }`}>
                        <div className="flex justify-between items-start gap-2">
                          <h5 className="font-bold text-sm text-white leading-tight">{stock.pharmacie.name}</h5>
                          {isDoctorZone && (
                            <span className="text-[9px] bg-[#00f0ff] text-black font-black px-2.5 py-1 rounded-full uppercase tracking-widest shrink-0">
                              Ma Zone
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 mt-1">
                          <p className="text-xs text-white/60 flex items-center gap-2">
                            <MapPin size={12} className="text-[#00f0ff]" />
                            <span>Quartier : {stock.pharmacie.zone}</span>
                          </p>
                          <p className="text-xs text-white/60 font-medium ml-5">📞 Tél : {stock.pharmacie.phone}</p>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-medium">
                          <span className="text-white/50">Quantité disponible :</span>
                          <span className={`font-bold px-3 py-1 rounded-full ${
                            stock.quantite > 50 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
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
        <div className="p-8 rounded-[24px] glass-premium-dark flex flex-col gap-6">
          <div>
            <h3 className="text-2xl font-light text-white tracking-tight">Registre des Ordonnances Rédigées</h3>
            <p className="text-xs text-white/50 mt-2">Consultez l'état et l'historique complet des prescriptions électroniques émises sous votre signature.</p>
          </div>

          {history.length === 0 ? (
            <div className="py-20 text-center text-white/30 flex flex-col items-center justify-center gap-4">
              <History size={48} className="stroke-[1] opacity-50" />
              <p className="text-sm font-medium">Vous n'avez pas encore rédigé d'ordonnance sur la plateforme.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 uppercase text-[10px] tracking-widest font-black">
                    <th className="py-4 px-4">Code Unique</th>
                    <th className="py-4 px-4">Patient</th>
                    <th className="py-4 px-4">Date d'Émission</th>
                    <th className="py-4 px-4">Médicaments Prescrits</th>
                    <th className="py-4 px-4 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map(p => (
                    <tr key={p.id} className="hover:bg-white/5 transition-all duration-300">
                      <td className="py-5 px-4 font-mono font-bold text-[#00f0ff] tracking-widest">{p.code}</td>
                      <td className="py-5 px-4 font-medium text-white">{p.patientName}</td>
                      <td className="py-5 px-4 text-white/50">{new Date(p.dateEmission).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                      <td className="py-5 px-4 text-white/70 max-w-xs">
                        <div className="flex flex-wrap gap-2">
                          {p.medicaments.map((m, idx) => (
                            <span key={idx} className="bg-black/40 text-white/80 text-[10px] px-2.5 py-1 rounded-md border border-white/10 font-medium">
                              {m.nom} ({m.quantite})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <span className={`inline-block px-3 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                          p.status === 'DELIVREE' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
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
        <div className="p-8 rounded-[24px] glass-premium-dark flex flex-col gap-6">
          <div>
            <h3 className="text-2xl font-light text-white tracking-tight">Mes Patients Assignés</h3>
            <p className="text-xs text-white/50 mt-2">Liste des patients qui vous ont choisi comme médecin traitant lors de leur inscription sur la plateforme.</p>
          </div>

          {loadingPatients ? (
            <div className="py-20 text-center text-white/50 text-sm">Chargement...</div>
          ) : !myPatientsLinked ? (
            <div className="py-20 text-center text-white/40 flex flex-col items-center justify-center gap-4 px-6">
              <Stethoscope size={48} className="stroke-[1] text-orange-400/50" />
              <p className="text-sm max-w-md font-medium">{myPatientsMsg}</p>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mt-2">(Un administrateur doit relier votre compte à une fiche médecin vitrine pour activer cette fonctionnalité.)</p>
            </div>
          ) : myPatients.length === 0 ? (
            <div className="py-20 text-center text-white/30 flex flex-col items-center justify-center gap-4">
              <Users size={48} className="stroke-[1] opacity-50" />
              <p className="text-sm font-medium">Aucun patient ne vous a encore choisi comme médecin traitant.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 uppercase text-[10px] tracking-widest font-black">
                    <th className="py-4 px-4">Patient</th>
                    <th className="py-4 px-4">Email</th>
                    <th className="py-4 px-4">Téléphone</th>
                    <th className="py-4 px-4 text-center">Statut</th>
                    <th className="py-4 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {myPatients.map(p => (
                    <tr key={p.userId} className="hover:bg-white/5 transition-all duration-300">
                      <td className="py-5 px-4 font-bold text-white">{p.firstName} {p.lastName}</td>
                      <td className="py-5 px-4 text-white/60">{p.email}</td>
                      <td className="py-5 px-4 text-white/60">{p.phone || '—'}</td>
                      <td className="py-5 px-4 text-center">
                        <span className={`inline-block px-3 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                          p.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                        }`}>
                          {p.status === 'ACTIVE' ? 'Actif' : p.status}
                        </span>
                      </td>
                      <td className="py-5 px-4 text-right flex gap-3 justify-end items-center">
                        <button
                          onClick={() => {
                            setActiveChatPatient(p);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-[11px] font-bold transition-all flex items-center gap-2 cursor-none"
                          data-cursor-magnet
                        >
                          <MessageCircle size={14} /> Discuter
                        </button>
                        <button
                          onClick={() => {
                            setPatientEmail(p.email);
                            setActiveTab('medecin_prescrire');
                          }}
                          className="px-4 py-2.5 rounded-xl bg-white text-black hover:bg-[#00f0ff] text-[11px] font-bold transition-all cursor-none"
                          data-cursor-magnet
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
        <div className="p-8 rounded-[24px] glass-premium-dark flex flex-col gap-6">
          <div>
            <h3 className="text-2xl font-light text-white tracking-tight">Demandes de Renouvellement</h3>
            <p className="text-xs text-white/50 mt-2">Gérez les demandes de renouvellement d'ordonnance initiées par vos patients pour leurs anciens traitements.</p>
          </div>

          {loadingRenewals ? (
            <div className="py-20 text-center text-white/50 text-sm">Chargement des demandes...</div>
          ) : renewals.length === 0 ? (
            <div className="py-20 text-center text-white/30 flex flex-col items-center justify-center gap-4">
              <RefreshCw size={48} className="stroke-[1] opacity-50" />
              <p className="text-sm font-medium">Aucune demande de renouvellement en attente.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {renewals.map(r => (
                <div key={r.id} className="p-6 rounded-[20px] bg-white/5 border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-white/10 transition-colors">
                  <div className="flex-1 flex flex-col gap-3 w-full">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-[#00f0ff] font-bold text-xs bg-[#00f0ff]/10 px-3 py-1.5 rounded-lg border border-[#00f0ff]/20">
                        {r.code}
                      </span>
                      <span className="text-sm font-medium text-white/70">
                        Patient : <strong className="font-bold text-white">{r.patient?.profile?.firstName} {r.patient?.profile?.lastName}</strong> ({r.patient?.email})
                      </span>
                    </div>
                    
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-sm">
                      <p className="font-bold text-white/90 mb-3 text-xs uppercase tracking-widest">Médicaments à renouveler :</p>
                      <div className="flex flex-col gap-2.5">
                        {r.medicaments.map((med, idx) => (
                          <div key={idx} className="flex flex-wrap gap-3 text-white/60 font-medium">
                            <span className="font-bold text-white">• {med.nom}</span>
                            <span>(Qté: {med.quantite})</span>
                            {med.dosage && <span>• Dosage: {med.dosage}</span>}
                            {med.posologie && <span className="italic">• Posologie: {med.posologie}</span>}
                            {med.duree && <span className="font-semibold text-[#00f0ff]">• Durée: {med.duree}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handleApproveRenewal(r.id)}
                      className="px-6 py-4 bg-gradient-to-r from-[#00f0ff] to-blue-500 text-black rounded-xl text-xs font-bold hover:from-[#00c0cc] hover:to-blue-600 shadow-lg shadow-[#00f0ff]/20 transition-all cursor-none"
                      data-cursor-magnet
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
        <div className="fixed inset-0 bg-[#050505]/80 backdrop-blur-xl z-[2000] flex items-center justify-center p-4">
          <div className="glass-premium-dark w-full max-w-2xl h-[85vh] rounded-[32px] relative flex flex-col overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="bg-white/5 border-b border-white/10 p-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-full flex items-center justify-center font-bold text-white text-lg uppercase">
                  {activeChatPatient.firstName[0]}{activeChatPatient.lastName[0]}
                </div>
                <div>
                  <h3 className="font-light text-2xl text-white tracking-tight">{activeChatPatient.firstName} {activeChatPatient.lastName}</h3>
                  <span className="text-[10px] text-[#00f0ff] font-bold tracking-widest uppercase block mt-1">Discussion Sécurisée P2P</span>
                </div>
              </div>
              <button onClick={() => setActiveChatPatient(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-none text-white/50 hover:text-white" data-cursor-magnet>
                <X size={24}/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-5 bg-transparent">
              {chatMessages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-white/30">
                  <MessageCircle size={64} className="mb-6 opacity-40 text-[#00f0ff]" />
                  <p className="text-sm font-bold text-white/60">Canal de communication chiffré ouvert.</p>
                  <p className="text-xs text-white/40 mt-2">Commencez la discussion sécurisée avec votre patient.</p>
                </div>
              ) : (
                chatMessages.map(m => (
                  <div
                    key={m.id}
                    className={`p-4 rounded-2xl max-w-[80%] text-sm font-medium shadow-lg leading-relaxed ${
                      m.senderId === user.id
                        ? 'bg-[#00f0ff] text-black self-end rounded-br-none'
                        : 'bg-white/10 border border-white/10 text-white self-start rounded-bl-none'
                    }`}
                  >
                    {m.content}
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-white/5 border-t border-white/10 flex gap-4">
              <input
                type="text"
                value={newMessageText}
                onChange={e => setNewMessageText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendDoctorMessage()}
                className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white outline-none font-medium focus:border-[#00f0ff] placeholder-white/30 transition-colors cursor-none"
                placeholder="Écrivez votre message sécurisé..."
              />
              <button
                onClick={sendDoctorMessage}
                className="w-14 h-14 bg-white hover:bg-[#00f0ff] text-black rounded-2xl flex items-center justify-center shadow-lg transition-colors cursor-none"
                data-cursor-magnet
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
