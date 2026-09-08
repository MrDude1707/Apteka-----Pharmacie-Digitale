import React, { useEffect, useRef } from 'react';
import { LogOut, Bell, User, LayoutGrid, RefreshCw } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import WebGLBackground from '../ui/WebGLBackground';
import JellyCursor from '../ui/JellyCursor';

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
    <div ref={containerRef} className="dashboard-root min-h-screen bg-[#050505] text-zinc-100 font-sans flex relative overflow-hidden antialiased pt-16 xl:pt-10 cursor-none">
      
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
                  className={`flex items-center gap-4 px-5 py-4 rounded-xl font-medium transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] tracking-[0.5px] cursor-none ${
                    isActive 
                      ? 'text-white bg-white/10 translate-x-2' 
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
          <div className="flex items-center gap-4 p-3 bg-black/20 border border-white/5 rounded-2xl shadow-inner">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00f0ff] to-blue-500 flex items-center justify-center text-black font-extrabold shadow-lg">
              {user?.firstName?.charAt(0) || 'U'}
            </div>
            <div className="flex-grow min-w-0">
              <h4 className="font-extrabold text-white text-sm truncate">{user?.firstName} {user?.lastName}</h4>
              <p className="text-[10px] font-bold text-[#00f0ff] uppercase tracking-widest truncate">{user?.role}</p>
            </div>
          </div>
          
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
        <header className="dash-header flex items-end justify-between glass-premium-dark px-6 py-4 rounded-[100px]">
          {/* Page title / Tab Indicator */}
          <div>
            <p className="text-[0.85rem] font-semibold text-[#00f0ff] uppercase tracking-[2px] mb-1">
              Espace {user?.role === 'MEDECIN' ? 'Médecin' : user?.role === 'PHARMACIEN' ? 'Pharmacien' : 'Patient'} • Connecté
            </p>
            <h1 className="text-3xl font-light text-white tracking-[-1px] leading-none">
              {menuItems.find(item => item.id === activeTab)?.label || "Aperçu Global"}
            </h1>
          </div>

          {/* Quick Stats/Notification Icons */}
          <div className="flex items-center gap-3">
            <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-xs font-semibold tracking-wider text-white" data-cursor-magnet>
              LUN. 24 AOÛT
            </div>
            <div className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/50 hover:text-[#00f0ff] transition-colors cursor-none" data-cursor-magnet>
              <Bell size={18} />
            </div>
            
            {/* User quick badge for mobile screens */}
            <div className="flex lg:hidden items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-full">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00f0ff] to-blue-500 flex items-center justify-center text-black font-extrabold text-xs">
                {user?.firstName?.charAt(0) || 'U'}
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
                    ? 'bg-gradient-to-r from-[#00f0ff] to-blue-500 text-black shadow-lg' 
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
        <main className="dash-content-card flex-grow glass-premium-dark rounded-[24px] p-6 sm:p-8 overflow-y-auto max-h-[calc(100vh-210px)] lg:max-h-[calc(100vh-160px)]">
          {children}
        </main>
      </div>

    </div>
  );
}