import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import MapRoute from './components/MapRoute';
import DoctorDashboard from './components/DoctorDashboard';
import PharmacistDashboard from './components/PharmacistDashboard';
import PatientDashboard from './components/PatientDashboard';
import DashboardLayout from './components/dashboard/DashboardLayout';
import { Search, CheckCircle, ClipboardList, ShoppingCart, MessageCircle, FileText, Send, X, CreditCard, HeartPulse, Printer, Pill, Users, Check, LayoutGrid, RefreshCw } from 'lucide-react';
import QRCode from 'react-qr-code';
import { API_URL } from './config';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [welcomeUser, setWelcomeUser] = useState<any>(null);
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [patientLocation, setPatientLocation] = useState({ lat: -18.913, lng: 47.525 });

  // RECHERCHE & AUTOCOMPLETE (Tâche 9)
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchStocks, setSearchStocks] = useState<any[]>([]);

  // CART & CHECKOUT (Tâche 5)
  const [cart, setCart] = useState<any[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const updateCartQty = (index: number, newQty: number) => {
    const newCart = [...cart];
    if (newQty < 1) return;
    if (newQty > newCart[index].quantite) {
      alert(`Désolé, seulement ${newCart[index].quantite} boîte(s) sont disponibles en stock.`);
      return;
    }
    newCart[index] = { ...newCart[index], qty: newQty };
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    if (newCart.length === 0) {
      setShowCheckout(false);
    }
  };

  // MESSAGERIE (Tâche 3)
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatDoctorId, setChatDoctorId] = useState('');

  // PRESCRIPTIONS & RENOUVELLEMENT (Tâche 2 & 4)
  const [myPrescriptions, setMyPrescriptions] = useState<any[]>([]);
  const [viewPdfOrdonnance, setViewPdfOrdonnance] = useState<any>(null);

  // ADMIN VITRINE (Tâche 1)
  const [adminVitrines, setAdminVitrines] = useState<any[]>([]);
  const [adminMedecins, setAdminMedecins] = useState<any[]>([]);
  const [allPharmacies, setAllPharmacies] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState('');

  // ADMIN COMPTES & SUPERVISION
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [loadingAdminData, setLoadingAdminData] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_URL}/api/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { 
          if(data && data.id) {
            setUser(data); 
            setActiveTab(data.role === 'MEDECIN' ? 'medecin_stocks' : data.role === 'PATIENT' ? 'recherche' : data.role === 'ADMINISTRATEUR' ? 'admin_vitrine' : 'pharmacien_deliver'); 
          } else {
            localStorage.removeItem('token');
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleAutocomplete = async (val: string) => {
    setSearchQuery(val);
    if(val.length < 2) return setSuggestions([]);
    const res = await fetch(`${API_URL}/api/patient/medicaments/autocomplete?q=${val}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
    setSuggestions(await res.json());
  };

  const handleSearchMeds = async (query = searchQuery) => {
    setSuggestions([]);
    setSearchQuery(query);
    const res = await fetch(`${API_URL}/api/patient/medicaments/recherche?query=${encodeURIComponent(query)}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
    const data = await res.json();
    setSearchStocks(data.stocks || []);
  };

  const loadPrescriptions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/patient/ordonnances/my-history`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
      const data = await res.json();
      if (!Array.isArray(data)) {
        console.warn("loadPrescriptions output is not an array:", data);
        setMyPrescriptions([]);
        return;
      }
      const parsedData = data.map((p: any) => ({
        ...p,
        medicaments: typeof p.medicaments === 'string' ? JSON.parse(p.medicaments) : p.medicaments
      }));
      setMyPrescriptions(parsedData);
    } catch (err) {
      console.error("Error loading prescriptions:", err);
      setMyPrescriptions([]);
    }
  };

  const requestRenewal = async (id: string) => {
    await fetch(`${API_URL}/api/patient/ordonnances/${id}/renew`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
    alert("Demande de renouvellement envoyée au médecin traitant !");
    loadPrescriptions();
  };

  const loadChat = async () => {
    const res = await fetch(`${API_URL}/api/patient/messages`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
    const data = await res.json();
    setChatMessages(data.messages || []);
    setChatDoctorId(data.doctorId);
  };

  const sendMessage = async () => {
    if(!newMessage.trim()) return;
    await fetch(`${API_URL}/api/patient/messages`, { method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ receiverId: chatDoctorId, content: newMessage }) });
    setNewMessage('');
    loadChat();
  };

  const processFakeCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if(cart.length===0) return;
    const pharmacieId = cart[0].pharmacieId; 
    const total = cart.reduce((acc, c) => acc + (c.medicament.prix||0)*(c.qty||1), 0);
    await fetch(`${API_URL}/api/patient/commandes`, { method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ pharmacieId, items: cart.map(c=>({...c, qty: c.qty||1})), total }) });
    setCart([]);
    setCheckoutSuccess(true);
    setTimeout(() => { setShowCheckout(false); setCheckoutSuccess(false); }, 3000);
  };

  const loadVitrineData = async () => {
    const res = await fetch(`${API_URL}/api/auth/admin/vitrine`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
    const data = await res.json();
    setAdminVitrines(data.vitrines); setAdminMedecins(data.medecins);
  };

  const linkVitrine = async (vitrineId: string, userId: string) => {
    await fetch(`${API_URL}/api/auth/admin/vitrine/${vitrineId}/link`, { method: 'PUT', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ userId }) });
    alert("Médecin lié à la vitrine !"); loadVitrineData();
  };

  const loadPendingUsers = async () => {
    setLoadingAdminData(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/admin/pending`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
      const data = await res.json();
      setPendingUsers(data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoadingAdminData(false);
    }
  };

  const loadAllUsers = async () => {
    setLoadingAdminData(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/admin/all-users`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
      const data = await res.json();
      setAllUsers(data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoadingAdminData(false);
    }
  };

  const loadAdminStats = async () => {
    setLoadingAdminData(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/admin/stats`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
      const data = await res.json();
      setAdminStats(data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoadingAdminData(false);
    }
  };

  const handleApprovePro = async (profileId: string) => {
    const res = await fetch(`${API_URL}/api/auth/admin/approve/${profileId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      loadPendingUsers();
    } else {
      alert(data.error || "Une erreur est survenue.");
    }
  };

  const handleRejectPro = async (profileId: string) => {
    if(!confirm("Voulez-vous vraiment rejeter et supprimer cette inscription ?")) return;
    const res = await fetch(`${API_URL}/api/auth/admin/reject/${profileId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      loadPendingUsers();
    } else {
      alert(data.error || "Une erreur est survenue.");
    }
  };

  const handleToggleBlock = async (profileId: string) => {
    const res = await fetch(`${API_URL}/api/auth/admin/toggle-block/${profileId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      loadAllUsers();
    } else {
      alert(data.error || "Une erreur est survenue.");
    }
  };

  useEffect(() => {
    if(activeTab === 'prescriptions') loadPrescriptions();
    if(activeTab === 'messagerie') loadChat();
    if(activeTab === 'admin_vitrine') loadVitrineData();
    if(activeTab === 'admin_users') loadPendingUsers();
    if(activeTab === 'admin_all_users') loadAllUsers();
    if(activeTab === 'admin_supervision') loadAdminStats();
    if(activeTab === 'pharmacies_map') fetch(`${API_URL}/api/public/pharmacies`).then(r=>r.json()).then(setAllPharmacies);
  }, [activeTab]);

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-emerald-500"></div></div>;
  if (!user) {
    if (showWelcomeAnimation && welcomeUser) {
      return (
        <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center animate-fade-in" style={{ fontFamily: 'Georgia, "Playfair Display", "Times New Roman", serif' }}>
          <div className="text-center max-w-2xl px-6 flex flex-col gap-6 select-none">
            <p className="text-gray-400 font-serif italic text-sm tracking-[0.2em] uppercase mb-4">Apteka</p>
            <h1 className="text-4xl md:text-5xl font-light text-black leading-snug tracking-tight animate-slide-up">
              Bonjour, <span className="font-semibold">{welcomeUser.firstName} {welcomeUser.lastName}</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-800 italic font-light tracking-wide mt-2 animate-slide-up delay-150">
              {welcomeUser.role === 'PATIENT' 
                ? "que la santé soit avec vous."
                : welcomeUser.role === 'MEDECIN'
                ? "merci pour votre dévouement aujourd'hui."
                : welcomeUser.role === 'PHARMACIEN'
                ? "votre dévouement est au cœur de notre service."
                : "ravi de vous revoir sur votre espace sécurisé."}
            </p>
            <div className="mt-12 flex justify-center">
              <div className="w-2 h-2 bg-black rounded-full animate-ping"></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <LandingPage 
        onLoginSuccess={(u) => {
          setWelcomeUser(u);
          setShowWelcomeAnimation(true);
          setTimeout(() => {
            setUser(u);
            setActiveTab(u.role === 'MEDECIN' ? 'medecin_stocks' : u.role === 'PATIENT' ? 'recherche' : u.role === 'ADMINISTRATEUR' ? 'admin_vitrine' : 'pharmacien_deliver');
            setShowWelcomeAnimation(false);
            setWelcomeUser(null);
          }, 3500);
        }} 
        handleQuickDemoLogin={(e) => {}} 
      />
    );
  }

  // Early returns for professional and patient workspaces to enable clean full-screen layouts
  if (user && user.role === 'MEDECIN') {
    return <DoctorDashboard user={user} activeTab={activeTab} setActiveTab={setActiveTab} />;
  }

  if (user && user.role === 'PHARMACIEN') {
    return <PharmacistDashboard user={user} activeTab={activeTab} setActiveTab={setActiveTab} />;
  }

  if (user && user.role === 'PATIENT') {
    return <PatientDashboard user={user} activeTab={activeTab} setActiveTab={setActiveTab} />;
  }

  const adminMenuItems = [
    { id: 'admin_users', label: 'Comptes en attente', icon: ClipboardList },
    { id: 'admin_all_users', label: 'Tous les comptes', icon: Users },
    { id: 'admin_vitrine', label: 'Liaison Vitrines', icon: RefreshCw },
    { id: 'admin_supervision', label: 'Supervision', icon: LayoutGrid }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.reload();
  };

  return (
    <DashboardLayout
      user={user}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      menuItems={adminMenuItems}
      onLogout={handleLogout}
    >
      {/* ADMIN: COMPTES EN ATTENTE D'APPROBATION */}
      {activeTab === 'admin_users' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          <div className="p-8 bg-white/50 backdrop-blur-md border border-slate-200/50 rounded-3xl shadow-sm relative text-left">
            <span className="text-xs font-bold text-amber-500 tracking-widest uppercase mb-1 block">Contrôle de Sécurité</span>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Comptes Professionnels en Attente</h3>
            <p className="text-xs font-semibold text-slate-400 leading-relaxed mt-1">Vérifiez les pièces justificatives et approuvez les accès des médecins et pharmaciens avant qu'ils ne puissent se connecter.</p>
          </div>

          {loadingAdminData ? (
            <div className="py-20 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500 mx-auto"></div>
              <p className="text-xs text-zinc-400 mt-4 font-bold uppercase tracking-wider">Chargement des comptes...</p>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="bg-white/50 backdrop-blur-md border border-slate-200/50 rounded-[2rem] p-12 text-center shadow-sm max-w-xl mx-auto flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-2xl font-bold border border-emerald-500/20">✓</div>
              <h4 className="text-xl font-black text-slate-800 tracking-tight">Tout est en ordre !</h4>
              <p className="text-sm text-slate-450 leading-relaxed font-medium">Aucune demande de compte professionnel n'est actuellement en attente d'approbation administrative.</p>
            </div>
          ) : (
            <div className="bg-white/50 backdrop-blur-md border border-slate-200/50 rounded-3xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="uppercase text-[11px] font-bold text-slate-450 tracking-wider">
                    <th className="p-5">Professionnel</th>
                    <th className="p-5">Rôle</th>
                    <th className="p-5">Rattachement / Zone</th>
                    <th className="p-5">Date d'inscription</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {pendingUsers.map(u => (
                    <tr key={u.id} className="hover:bg-white/5">
                      <td className="p-5">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-slate-850 text-base">{u.firstName} {u.lastName}</span>
                          <span className="text-xs text-slate-450 font-semibold mt-0.5">{u.email}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'MEDECIN' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {u.role === 'MEDECIN' ? '🩺 Médecin' : '💊 Pharmacien'}
                        </span>
                      </td>
                      <td className="p-5 text-left">
                        <span className="text-slate-400 font-bold text-xs">
                          {u.role === 'MEDECIN' ? `Zone : ${u.zone}` : `Officine : ${u.pharmacieName}`}
                        </span>
                      </td>
                      <td className="p-5 text-xs text-slate-500 font-medium">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                      </td>
                      <td className="p-5 text-right flex gap-2 justify-end">
                        <button
                          onClick={() => handleApprovePro(u.id)}
                          className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => handleRejectPro(u.id)}
                          className="px-4 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                        >
                          Rejeter
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

      {/* ADMIN: TOUS LES COMPTES */}
      {activeTab === 'admin_all_users' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          <div className="p-8 bg-white/50 backdrop-blur-md border border-slate-200/50 rounded-3xl shadow-sm relative text-left">
            <span className="text-xs font-bold text-emerald-500 tracking-widest uppercase mb-1 block">Base de données</span>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Tous les Comptes Utilisateurs</h3>
            <p className="text-xs font-semibold text-slate-400 leading-relaxed mt-1">Supervisez l'intégralité des comptes patients, professionnels et administrateurs enregistrés sur Apteka.</p>
          </div>

          {loadingAdminData ? (
            <div className="py-20 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500 mx-auto"></div>
              <p className="text-xs text-zinc-400 mt-4 font-bold uppercase tracking-wider">Chargement des comptes...</p>
            </div>
          ) : (
            <div className="bg-white/50 backdrop-blur-md border border-slate-200/50 rounded-3xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="uppercase text-[11px] font-bold text-slate-455 tracking-wider">
                    <th className="p-5">Utilisateur</th>
                    <th className="p-5">Rôle</th>
                    <th className="p-5">Statut</th>
                    <th className="p-5">Inscrit le</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {allUsers.map(u => (
                    <tr key={u.id} className="hover:bg-white/5">
                      <td className="p-5 flex flex-col text-left">
                        <span className="font-bold text-slate-850 text-base">{u.firstName} {u.lastName}</span>
                        <span className="text-xs text-slate-450 font-semibold mt-0.5">{u.email || "Non renseigné"}</span>
                      </td>
                      <td className="p-5">
                        <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          u.role === 'ADMINISTRATEUR' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          u.role === 'MEDECIN' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          u.role === 'PHARMACIEN' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50'
                        }`}>
                          {u.role === 'ADMINISTRATEUR' ? '🛡️ Admin' :
                           u.role === 'MEDECIN' ? '🩺 Médecin' :
                           u.role === 'PHARMACIEN' ? '💊 Pharmacien' :
                           '👤 Patient'}
                        </span>
                      </td>
                      <td className="p-5">
                        <span className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wide ${
                          u.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          u.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {u.status === 'ACTIVE' ? 'Actif' :
                           u.status === 'PENDING' ? 'En attente' :
                           'Bloqué'}
                        </span>
                      </td>
                      <td className="p-5 text-xs text-slate-455 font-semibold">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="p-5 text-right">
                        {u.role !== 'ADMINISTRATEUR' ? (
                          <button
                            onClick={() => handleToggleBlock(u.id)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 ${
                              u.status === 'BLOCKED' 
                                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600' 
                                : 'bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400'
                            }`}
                          >
                            {u.status === 'BLOCKED' ? 'Débloquer' : 'Bloquer'}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 font-semibold italic">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADMIN: SUPERVISION & STATISTIQUES */}
      {activeTab === 'admin_supervision' && adminStats && (
        <div className="flex flex-col gap-8 animate-in fade-in duration-300">
          <div className="p-8 bg-white/50 backdrop-blur-md border border-slate-200/50 rounded-3xl shadow-sm relative text-left">
            <span className="text-xs font-bold text-emerald-500 tracking-widest uppercase mb-1 block">Supervision en Temps Réel</span>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Tableau de bord d'activité</h3>
            <p className="text-xs font-semibold text-slate-400 leading-relaxed mt-1">Supervisez l'état général du système de santé Apteka d'Antananarivo.</p>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-white/50 backdrop-blur-md border border-slate-200/50 rounded-3xl shadow-sm flex flex-col gap-2 text-left">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pharmacies</span>
              <b className="text-3xl font-black text-slate-800">{adminStats.pharmaciesCount}</b>
              <span className="text-[10px] font-bold text-emerald-450">Officines rattachées</span>
            </div>
            <div className="p-6 bg-white/50 backdrop-blur-md border border-slate-200/50 rounded-3xl shadow-sm flex flex-col gap-2 text-left">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Professionnels</span>
              <b className="text-3xl font-black text-slate-800">{adminStats.activeProsCount}</b>
              <span className="text-[10px] font-bold text-emerald-450">Médecins & pharmaciens</span>
            </div>
            <div className="p-6 bg-white/50 backdrop-blur-md border border-slate-200/50 rounded-3xl shadow-sm flex flex-col gap-2 text-left">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Médicaments</span>
              <b className="text-3xl font-black text-slate-800">{adminStats.totalStockUnits}</b>
              <span className="text-[10px] font-bold text-emerald-450">Boîtes en stock réel</span>
            </div>
            <div className="p-6 bg-white/50 backdrop-blur-md border border-slate-200/50 rounded-3xl shadow-sm flex flex-col gap-2 text-left">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ordonnances</span>
              <b className="text-3xl font-black text-slate-800">{adminStats.ordonnancesDelivreesCount}</b>
              <span className="text-[10px] font-bold text-emerald-450">Délivrances certifiées</span>
            </div>
          </div>

          {/* Recent Orders / Ordonnances Table */}
          <div className="bg-white/50 backdrop-blur-md border border-slate-200/50 rounded-3xl shadow-sm overflow-hidden text-left flex flex-col">
            <div className="p-6 border-b border-zinc-800/40">
              <h4 className="font-extrabold text-slate-800 text-lg">Activité Récente des Ordonnances</h4>
              <p className="text-xs text-slate-455 mt-1 font-semibold leading-normal">Dernières transactions et émissions d'ordonnances sécurisées.</p>
            </div>

            {adminStats.recentOrdonnances?.length === 0 ? (
              <div className="p-12 text-center text-slate-455 text-xs font-bold">Aucune activité enregistrée pour le moment.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="uppercase text-[11px] font-bold text-slate-455 tracking-wider">
                    <th className="p-5">Code d'ordonnance</th>
                    <th className="p-5">Date d'émission</th>
                    <th className="p-5 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {adminStats.recentOrdonnances?.map((o: any, idx: number) => (
                    <tr key={idx} className="hover:bg-white/5">
                      <td className="p-5 font-mono font-bold text-teal-400 text-sm">{o.code}</td>
                      <td className="p-5 text-xs text-slate-455 font-semibold">
                        {new Date(o.dateEmission).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-5 text-right">
                        <span className={`inline-block px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wide ${
                          o.status === 'DELIVREE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {o.status === 'DELIVREE' ? 'Délivrée' : 'En attente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ADMIN VITRINE */}
      {activeTab === 'admin_vitrine' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          <div className="p-8 bg-white/50 backdrop-blur-md border border-slate-200/50 rounded-3xl shadow-sm relative text-left">
            <span className="text-xs font-bold text-teal-400 tracking-widest uppercase mb-1 block">Modération du Registre</span>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Liaison Vitrine ↔ Compte Réel</h3>
            <p className="text-xs font-semibold text-slate-400 leading-relaxed mt-1">Associez les fiches vitrines d'Antananarivo avec les comptes médecins réels enregistrés.</p>
          </div>

          <div className="bg-white/50 backdrop-blur-md border border-slate-200/50 rounded-3xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="uppercase text-[11px] font-bold text-slate-455 tracking-wider">
                  <th className="p-5">Fiche Vitrine</th>
                  <th className="p-5">Compte Assigné</th>
                  <th className="p-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {(Array.isArray(adminVitrines) ? adminVitrines : []).map(v => (
                  <tr key={v.id} className="hover:bg-white/5">
                    <td className="p-5 font-bold text-slate-850 text-base">{v.nom}</td>
                    <td className="p-5 text-slate-400 font-semibold">{v.user ? v.user.email : "Non assigné"}</td>
                    <td className="p-5 text-right">
                      <select 
                        onChange={(e) => linkVitrine(v.id, e.target.value)} 
                        defaultValue={v.userId||""} 
                        className="p-3 border border-zinc-800/60 rounded-xl text-xs font-bold outline-none bg-zinc-900 text-slate-200 cursor-pointer focus:border-teal-500"
                      >
                        <option value="">-- Aucun --</option>
                        {(Array.isArray(adminMedecins) ? adminMedecins : []).map(m => (
                          <option key={m.id} value={m.id}>
                            {m.email} ({m.profile?.firstName || "Médecin"})
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}