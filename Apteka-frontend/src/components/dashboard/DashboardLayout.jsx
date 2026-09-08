import React, { useEffect, useRef, useState } from 'react';
import { LogOut, Bell, User, LayoutGrid, RefreshCw } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import WebGLBackground from '../ui/WebGLBackground';
import JellyCursor from '../ui/JellyCursor';
import { API_URL } from '../../config';
import { notify } from '../../utils/notify';

gsap.registerPlugin(useGSAP);

export default function DashboardLayout({ 
  user, 
  activeTab, 
  setActiveTab, 
  menuItems, 
  children,
  onLogout 
}) {
  const containerRef = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    zone: user?.zone || '',
    photoUrl: user?.photoUrl || ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 1_500_000) {
      notify('Choisissez une image de moins de 1,5 Mo.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfile(current => ({ ...current, photoUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(profile)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Impossible de mettre à jour le profil.');
      notify('Profil mis à jour.', 'success');
      setProfileOpen(false);
      window.location.reload();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const todayLabel = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })
    .format(new Date()).replace('.', '').toUpperCase();

  useEffect(() => {
    const handleNotification = (event) => {
      setLatestNotification(event.detail || null);
      setHasNotification(true);
    };
    window.addEventListener('apteka:prescription-notification', handleNotification);
    window.addEventListener('apteka:doctor-notification', handleNotification);
    return () => {
      window.removeEventListener('apteka:prescription-notification', handleNotification);
      window.removeEventListener('apteka:doctor-notification', handleNotification);
    };
  }, []);

  // Trigger GSAP stagger animation on first render of the dashboard layout
  useGSAP(() => {
    gsap.fromTo('.dash-sidebar', 
      { opacity: 0, x: -50 }, 
      { opacity: 1, x: 0, duration: 1.2, ease: 'expo.out' }
    );
    
    gsap.fromTo('.dash-header', 
      { opacity: 0, y: -30 }, 
      { opacity: 1, y: 0, duration: 1, ease: 'expo.out', delay: 0.2 }
    );
  }, { scope: containerRef, dependencies: [] });

  // Trigger content-card animation only when the active tab changes
  useGSAP(() => {
    gsap.fromTo('.dash-content-card', 
      { opacity: 0, scale: 0.98, y: 30 }, 
      { opacity: 1, scale: 1, y: 0, duration: 1, ease: 'expo.out' }
    );
  }, { scope: containerRef, dependencies: [activeTab] });

  return (
    <div ref={containerRef} className="dashboard-root min-h-screen bg-[#050505] text-zinc-100 font-sans flex relative overflow-hidden antialiased pt-16 xl:pt-10 motion-safe:transition-colors">
      
      {/* WebGL Lusion-style Fluid Background */}
      <WebGLBackground />
      
      {/* Custom Physics Cursor */}
      <JellyCursor />

      {/* Sidebar - Floating rounded container */}
      <aside className="dash-sidebar hidden lg:flex flex-col justify-between w-[280px] m-6 mr-0 p-6 glass-premium-dark rounded-[24px] relative z-10 flex-shrink-0">
        <div>
          {/* Logo container */}
          <div className="flex items-center mb-10 pb-4 border-b border-white/5">
            <span className="text-xl font-[800] tracking-[-1px] uppercase text-white">APTEKA<span className="text-[#00f0ff]">.</span></span>
          </div>

          {/* Nav Menu */}
          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-4 px-5 py-4 rounded-xl font-medium transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] tracking-[0.5px] cursor-none ${
                    isActive 
                    ? 'nav-active text-white bg-white/10 translate-x-2'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.08] hover:translate-x-2'
                  }`}
                  data-cursor-magnet
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card at the bottom */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <button onClick={() => setProfileOpen(true)} className="w-full flex items-center gap-4 p-3 bg-black/20 border border-white/5 rounded-2xl shadow-inner text-left hover:bg-white/10 transition-colors cursor-none" data-cursor-magnet>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-[#00f0ff] to-blue-500 flex items-center justify-center text-black font-extrabold shadow-lg">
              {user?.photoUrl ? <img src={user.photoUrl} alt="" className="h-full w-full object-cover" /> : user?.firstName?.charAt(0) || 'U'}
            </div>
            <div className="flex-grow min-w-0">
              <h4 className="font-extrabold text-white text-sm truncate">{user?.firstName} {user?.lastName}</h4>
              <p className="text-[10px] font-bold text-[#00f0ff] uppercase tracking-widest truncate">{user?.role}</p>
            </div>
          </button>
          
          <button 
            onClick={onLogout}
            className="flex items-center justify-center gap-3 w-full mt-4 px-4 py-3 border border-white/10 rounded-[100px] hover:bg-white/10 hover:border-transparent text-xs font-bold text-white/50 hover:text-red-400 transition-all cursor-none"
            data-cursor-magnet
          >
            <LogOut size={14} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-grow flex flex-col min-w-0 p-6 relative z-10 gap-6">
        
        {/* Top Header bar */}
        <header className="dash-header dashboard-header flex items-end justify-between glass-premium-dark px-6 py-4 rounded-[28px]">
          {/* Page title / Tab Indicator */}
          <div>
            <p className="text-[0.85rem] font-semibold text-[#00f0ff] uppercase tracking-[2px] mb-1">
              Espace {user?.role === 'MEDECIN' ? 'Médecin' : user?.role === 'PHARMACIEN' ? 'Pharmacien' : user?.role === 'ADMINISTRATEUR' ? 'Administrateur' : 'Patient'} • Connecté
            </p>
            <h1 className="text-3xl font-light text-white tracking-[-1px] leading-none">
              {menuItems.find(item => item.id === activeTab)?.label || "Aperçu Global"}
            </h1>
          </div>

          {/* Quick Stats/Notification Icons */}
          <div className="flex items-center gap-3">
            <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-xs font-semibold tracking-wider text-white" data-cursor-magnet>
              {todayLabel}
            </div>
            <button type="button" onClick={() => { setHasNotification(false); setNotificationOpen(current => !current); }} className="relative p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/50 hover:text-[#00f0ff] transition-colors" data-cursor-magnet aria-label="Ouvrir les notifications" aria-expanded={notificationOpen}>
              <Bell size={18} />
              {hasNotification && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-400 ring-2 ring-zinc-950" />}
            </button>
            {notificationOpen && (
              <div className="absolute right-6 top-20 z-[200] w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-zinc-950 p-4 text-left shadow-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff]">Notifications</p>
                {latestNotification && user?.role === 'PATIENT' ? (
                  <button type="button" onClick={() => { setNotificationOpen(false); setActiveTab('prescriptions'); }} className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10">
                    <p className="text-sm font-bold text-white">Nouvelle ordonnance disponible</p>
                    <p className="mt-1 text-xs text-white/50">{latestNotification.code} · Cliquez pour consulter les médicaments prescrits.</p>
                  </button>
                ) : latestNotification && user?.role === 'MEDECIN' ? (
                  <button type="button" onClick={() => { setNotificationOpen(false); setActiveTab('medecin_renewals'); }} className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10">
                    <p className="text-sm font-bold text-white">Demande de renouvellement</p>
                    <p className="mt-1 text-xs text-white/50">{latestNotification.code} · Cliquez pour traiter la demande.</p>
                  </button>
                ) : <p className="mt-3 text-xs text-white/50">Aucune nouvelle notification.</p>}
              </div>
            )}
            
            {/* User quick badge for mobile screens */}
            <div className="flex lg:hidden items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-full">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-[#00f0ff] to-blue-500 flex items-center justify-center text-black font-extrabold text-xs">
                {user?.photoUrl ? <img src={user.photoUrl} alt="" className="h-full w-full object-cover" /> : user?.firstName?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Mobile Nav bar (rendered only on small screens) */}
        <nav className="flex lg:hidden overflow-x-auto gap-2 pb-2 border-b border-white/5 scrollbar-none">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all text-xs whitespace-nowrap cursor-none ${
                  isActive 
                    ? 'nav-active bg-gradient-to-r from-[#00f0ff] to-blue-500 text-black shadow-lg'
                    : 'text-white/50 bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Content Container Panel */}
        <main id="dashboard-content" tabIndex="-1" className="dash-content-card dashboard-content flex-grow glass-premium-dark rounded-[24px] p-4 sm:p-8 overflow-y-auto max-h-none lg:max-h-[calc(100vh-160px)]">
          {children}
        </main>
      </div>

      {profileOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <form onSubmit={saveProfile} className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950 p-6 text-left shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div><p className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff]">Mon profil</p><h2 className="mt-1 text-2xl font-light text-white">Informations personnelles</h2></div>
              <button type="button" onClick={() => setProfileOpen(false)} className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Fermer">×</button>
            </div>
            <div className="mb-6 flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-full bg-gradient-to-tr from-[#00f0ff] to-blue-500 text-2xl font-black text-black flex items-center justify-center">
                {profile.photoUrl ? <img src={profile.photoUrl} alt="Aperçu de profil" className="h-full w-full object-cover" /> : profile.firstName.charAt(0) || 'U'}
              </div>
              <label className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-white hover:bg-white/10">Changer la photo<input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" /></label>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {['firstName', 'lastName', 'phone', 'zone'].map(field => (
                <label key={field} className="flex flex-col gap-2 text-xs font-bold uppercase tracking-widest text-white/50">
                  {field === 'firstName' ? 'Prénom' : field === 'lastName' ? 'Nom' : field === 'phone' ? 'Téléphone' : 'Zone'}
                  <input value={profile[field]} onChange={event => setProfile(current => ({ ...current, [field]: event.target.value }))} className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-medium normal-case tracking-normal text-white outline-none focus:border-[#00f0ff]" />
                </label>
              ))}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={onLogout} className="rounded-xl border border-red-400/30 px-5 py-3 text-xs font-bold uppercase tracking-widest text-red-300 hover:bg-red-400/10">Déconnexion</button>
              <button disabled={savingProfile} className="rounded-xl bg-[#00f0ff] px-5 py-3 text-xs font-black uppercase tracking-widest text-black disabled:opacity-50">{savingProfile ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
