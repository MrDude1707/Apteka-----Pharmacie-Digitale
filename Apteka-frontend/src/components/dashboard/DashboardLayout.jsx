import React, { useEffect, useRef } from 'react';
import Logo from '../Logo';
import { LogOut, Bell, User, LayoutGrid, RefreshCw } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

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

  // Trigger GSAP stagger animation on first render of the dashboard layout
  useGSAP(() => {
    gsap.fromTo('.dash-sidebar', 
      { opacity: 0, x: -50 }, 
      { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }
    );
    
    gsap.fromTo('.dash-header', 
      { opacity: 0, y: -30 }, 
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 }
    );
  }, { scope: containerRef, dependencies: [] });

  // Trigger content-card animation only when the active tab changes
  useGSAP(() => {
    gsap.fromTo('.dash-content-card', 
      { opacity: 0, scale: 0.98, y: 15 }, 
      { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'power3.out' }
    );
  }, { scope: containerRef, dependencies: [activeTab] });

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-tr from-sky-50/60 via-teal-50/20 to-indigo-50/30 text-slate-800 font-sans flex relative overflow-hidden antialiased pt-16">
      
      {/* Aurora Ambient Glow Blobs */}
      <div className="absolute top-[10%] left-[-10%] w-[35vw] h-[35vw] bg-teal-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[40vw] h-[40vw] bg-sky-400/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] w-[25vw] h-[25vw] bg-indigo-400/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Sidebar - Floating rounded container */}
      <aside className="dash-sidebar hidden lg:flex flex-col justify-between w-80 m-6 mr-0 p-6 bg-white/45 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl shadow-sky-100/20 relative z-10 flex-shrink-0">
        <div>
          {/* Logo container */}
          <div className="flex justify-center mb-10 pb-4 border-b border-slate-200/40">
            <span className="text-xl font-black bg-gradient-to-r from-teal-500 to-sky-500 bg-clip-text text-transparent tracking-widest uppercase">APTEKA</span>
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
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all text-sm tracking-wide cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-teal-500 to-sky-500 text-white shadow-md shadow-teal-500/15 scale-[1.01]' 
                      : 'text-slate-500 hover:text-teal-600 hover:bg-white/50'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card at the bottom */}
        <div className="mt-8 pt-6 border-t border-slate-200/40">
          <div className="flex items-center gap-4 p-3 bg-white/40 border border-white/60 rounded-2xl shadow-sm">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center text-white font-extrabold shadow-inner shadow-black/5">
              {user?.firstName?.charAt(0) || 'U'}
            </div>
            <div className="flex-grow min-w-0">
              <h4 className="font-extrabold text-slate-800 text-sm truncate">{user?.firstName} {user?.lastName}</h4>
              <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest truncate">{user?.role}</p>
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="flex items-center justify-center gap-3 w-full mt-4 px-4 py-3 border border-slate-200/60 rounded-2xl hover:bg-white/50 hover:border-slate-300 text-xs font-bold text-slate-500 hover:text-red-500 transition-all cursor-pointer"
          >
            <LogOut size={14} />
            Se Déconnecter
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-grow flex flex-col min-w-0 p-6 relative z-10">
        
        {/* Top Header bar */}
        <header className="dash-header flex items-center justify-between mb-6 px-4 py-3 bg-white/35 backdrop-blur-xl border border-white/50 rounded-2xl shadow-sm">
          {/* Page title / Tab Indicator */}
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              {menuItems.find(item => item.id === activeTab)?.label || "Espace Professionnel"}
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Bienvenue dans votre espace Apteka</p>
          </div>

          {/* Quick Stats/Notification Icons */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/50 hover:bg-white/80 border border-slate-200/50 rounded-xl cursor-pointer text-slate-600 hover:text-teal-600 transition-colors">
              <Bell size={18} />
            </div>
            
            {/* User quick badge for mobile screens */}
            <div className="flex lg:hidden items-center gap-2 p-1.5 bg-white/50 border border-slate-200/50 rounded-full">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center text-white font-extrabold text-xs">
                {user?.firstName?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Mobile Nav bar (rendered only on small screens) */}
        <nav className="flex lg:hidden overflow-x-auto gap-2 mb-4 pb-2 border-b border-slate-200/40 scrollbar-none">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold transition-all text-xs whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'bg-gradient-to-r from-teal-500 to-sky-500 text-white shadow-md' 
                    : 'text-slate-500 bg-white/30 border border-slate-200/40 hover:bg-white/50'
                }`}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Content Container Panel */}
        <main className="dash-content-card flex-grow bg-white/45 backdrop-blur-xl border border-white/60 rounded-3xl p-6 sm:p-8 shadow-xl shadow-sky-100/15 overflow-y-auto max-h-[calc(100vh-210px)] lg:max-h-[calc(100vh-160px)]">
          {children}
        </main>
      </div>

    </div>
  );
}
