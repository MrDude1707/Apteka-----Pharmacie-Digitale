import React, { lazy, Suspense, useState, useEffect } from 'react';
import Lenis from 'lenis';
import LandingPage from './components/LandingPage';
import TextReveal from './components/ui/TextReveal';
import WebGLBackground from './components/ui/WebGLBackground';
import { ClipboardList, Users, LayoutGrid, RefreshCw } from 'lucide-react';
import { API_URL } from './config';
import { notify } from './utils/notify';

const DoctorDashboard = lazy(() => import('./components/DoctorDashboard'));
const PharmacistDashboard = lazy(() => import('./components/PharmacistDashboard'));
const PatientDashboard = lazy(() => import('./components/PatientDashboard'));
const DashboardLayout = lazy(() => import('./components/dashboard/DashboardLayout'));
const AdminCatalogue = lazy(() => import('./components/AdminCatalogue'));

function LoadingScreen() {
  return <div className="flex h-screen items-center justify-center bg-[#050505]"><div className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-ping"></div></div>;
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [welcomeUser, setWelcomeUser] = useState<any>(null);
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  // Awwwards-level Smooth Scroll Physics via Lenis
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple-like smooth decel
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  // ADMIN VITRINE (Tâche 1)
  const [adminVitrines, setAdminVitrines] = useState<any[]>([]);
  const [adminMedecins, setAdminMedecins] = useState<any[]>([]);

  // ADMIN COMPTES & SUPERVISION
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [loadingAdminData, setLoadingAdminData] = useState(false);
  const [adminUserSearch, setAdminUserSearch] = useState('');
  const [adminRoleFilter, setAdminRoleFilter] = useState('TOUS');
  const [adminStatusFilter, setAdminStatusFilter] = useState('TOUS');

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

  const loadVitrineData = async () => {
    const res = await fetch(`${API_URL}/api/auth/admin/vitrine`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
    const data = await res.json();
    setAdminVitrines(data.vitrines); setAdminMedecins(data.medecins);
  };

  const linkVitrine = async (vitrineId: string, userId: string) => {
    await fetch(`${API_URL}/api/auth/admin/vitrine/${vitrineId}/link`, { method: 'PUT', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ userId }) });
    notify("Médecin lié à la vitrine !", 'success'); loadVitrineData();
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
      notify(data.message, 'success');
      loadPendingUsers();
    } else {
      notify(data.error || "Une erreur est survenue.", 'error');
    }
  };

  const handleRejectPro = async (profileId: string) => {
    if(!confirm("Voulez-vous vraiment rejeter et supprimer cette inscription ?")) return;
    const res = await fetch(`${API_URL}/api/auth/admin/reject/${profileId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
    const data = await res.json();
    if (res.ok) {
      notify(data.message, 'success');
      loadPendingUsers();
    } else {
      notify(data.error || "Une erreur est survenue.", 'error');
    }
  };

  const handleToggleBlock = async (profileId: string) => {
    const res = await fetch(`${API_URL}/api/auth/admin/toggle-block/${profileId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
    const data = await res.json();
    if (res.ok) {
      notify(data.message, 'success');
      loadAllUsers();
    } else {
      notify(data.error || "Une erreur est survenue.", 'error');
    }
  };

  useEffect(() => {
    if(activeTab === 'admin_vitrine') loadVitrineData();
    if(activeTab === 'admin_users') loadPendingUsers();
    if(activeTab === 'admin_all_users') loadAllUsers();
    if(activeTab === 'admin_supervision') loadAdminStats();
  }, [activeTab]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#050505]"><div className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-ping"></div></div>;
  if (!user) {
    if (showWelcomeAnimation && welcomeUser) {
      return (
        <div className="fixed inset-0 bg-[#050505] z-[9999] flex flex-col items-center justify-center cursor-none overflow-hidden font-sans">
          
          {/* Lusion Fluid Background (with opacity lowered for text readability) */}
          <div className="absolute inset-0 z-0 opacity-30">
            <WebGLBackground />
          </div>

          <div className="relative z-10 text-center max-w-4xl px-6 flex flex-col gap-6 select-none items-center justify-center">
            
            <div className="flex justify-center mb-6">
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-[#00f0ff] animate-pulse">
                Accès Sécurisé
              </span>
            </div>

            <div className="text-4xl md:text-6xl font-light text-white leading-tight tracking-tight flex flex-wrap justify-center gap-x-4">
              <TextReveal text="Bonjour," delay={0.2} duration={1.2} />
              <TextReveal text={`${welcomeUser.firstName} ${welcomeUser.lastName}.`} delay={0.6} duration={1.2} className="font-bold text-white" />
            </div>
            
            <div className="text-xl md:text-2xl text-white/50 font-light tracking-wide mt-2 flex justify-center">
              <TextReveal 
                text={
                  welcomeUser.role === 'PATIENT' 
                    ? "Que la santé soit avec vous."
                    : welcomeUser.role === 'MEDECIN'
                    ? "Merci pour votre dévouement aujourd'hui."
                    : welcomeUser.role === 'PHARMACIEN'
                    ? "Votre dévouement est au cœur de notre service."
                    : "Ravi de vous revoir sur votre espace."
                } 
                delay={1.2} 
                duration={1.2} 
              />
            </div>
            
            <div className="mt-16 flex justify-center opacity-0 animate-in fade-in zoom-in duration-1000 delay-[1800ms] fill-mode-forwards">
              <div className="w-2 h-2 bg-[#00f0ff] rounded-full animate-ping"></div>
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
          }, 3800); // Expanded slightly to enjoy the GSAP effect
        }} 
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
    { id: 'admin_catalogue', label: 'Catalogue : délivrance', icon: ClipboardList },
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
      {activeTab === 'admin_catalogue' && <AdminCatalogue />}
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
              <div className="flex flex-col gap-3 border-b border-slate-200/50 p-4 sm:flex-row">
                <input value={adminUserSearch} onChange={e => setAdminUserSearch(e.target.value)} placeholder="Rechercher par nom ou email…" className="flex-1 rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-400" />
                <select value={adminRoleFilter} onChange={e => setAdminRoleFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-800"><option value="TOUS">Tous les rôles</option><option value="PATIENT">Patients</option><option value="MEDECIN">Médecins</option><option value="PHARMACIEN">Pharmaciens</option><option value="ADMINISTRATEUR">Administrateurs</option></select>
                <select value={adminStatusFilter} onChange={e => setAdminStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-800"><option value="TOUS">Tous les statuts</option><option value="ACTIVE">Actifs</option><option value="PENDING">En attente</option><option value="BLOCKED">Bloqués</option></select>
              </div>
              <div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm">
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
              </table></div>
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
                  {allUsers.filter(u => {
                    const haystack = `${u.firstName || ''} ${u.lastName || ''} ${u.email || ''}`.toLowerCase();
                    return haystack.includes(adminUserSearch.toLowerCase()) && (adminRoleFilter === 'TOUS' || u.role === adminRoleFilter) && (adminStatusFilter === 'TOUS' || u.status === adminStatusFilter);
                  }).map(u => (
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
