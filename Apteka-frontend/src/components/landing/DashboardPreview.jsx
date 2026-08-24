import React, { useRef, useState } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';

export default function DashboardPreview() {
  const containerRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Springs pour lisser le mouvement de la souris (physique d'Awwwards)
  const mouseXSpring = useSpring(x, { stiffness: 100, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 100, damping: 20 });

  // Map le mouvement de la souris vers une rotation 3D subtile
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Normaliser la position de la souris entre -0.5 et 0.5 par rapport au centre de la boîte
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = (mouseX / width) - 0.5;
    const yPct = (mouseY / height) - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <section className="relative py-32 bg-[#050505] overflow-hidden flex items-center justify-center">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-teal-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 flex flex-col items-center">
        
        <div className="text-center mb-16 relative z-10 pointer-events-none">
          <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text mb-4" style={{ backgroundImage: 'linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.5) 100%)', WebkitBackgroundClip: 'text' }}>
            Un outil pensé pour vous
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">Que vous soyez médecin, patient ou pharmacien, l'interface s'adapte à vos besoins pour vous faire gagner du temps.</p>
        </div>

        {/* Le conteneur 3D */}
        <div 
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative w-full max-w-5xl aspect-video rounded-[2rem] p-4 sm:p-8 cursor-none"
          style={{ perspective: 1200 }}
        >
          <motion.div
            style={{
              rotateX,
              rotateY,
              transformStyle: "preserve-3d"
            }}
            className="w-full h-full relative rounded-2xl bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Barre de menu Mac-style (Fake) */}
            <div className="h-10 border-b border-white/5 bg-white/5 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
            </div>

            {/* Contenu du Fake Dashboard (Haute Fidélité Animé) */}
            <div className="flex-1 p-4 sm:p-6 flex flex-col sm:flex-row gap-6 overflow-hidden text-left">
              
              {/* Sidebar animée */}
              <div className="w-full sm:w-1/4 h-full bg-white/5 rounded-2xl border border-white/5 p-4 flex flex-col gap-4 shrink-0">
                <div className="w-3/4 h-4 bg-white/10 rounded-full" />
                <div className="relative overflow-hidden w-full h-10 bg-gradient-to-r from-teal-500/20 to-emerald-500/10 border border-teal-500/30 rounded-xl px-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">Activité Live</span>
                </div>
                <div className="w-full h-10 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors flex items-center px-3 gap-2">
                  <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Ordonnances</span>
                </div>
                <div className="w-full h-10 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors flex items-center px-3 gap-2">
                  <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Pharmacies</span>
                </div>
              </div>

              {/* Main content fake */}
              <div className="flex-1 h-full flex flex-col gap-5 overflow-hidden">
                
                {/* Header/Search fake */}
                <div className="w-full h-14 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between px-4 shrink-0">
                  <div className="w-1/3 h-5 bg-white/10 rounded-md" />
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 font-mono">Système Sécurisé</span>
                  </div>
                </div>

                {/* Cards fake */}
                <div className="grid grid-cols-3 gap-4 shrink-0">
                  <div className="h-24 bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col justify-between hover:border-teal-500/30 transition-colors relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-teal-500/10 rounded-bl-xl blur-sm" />
                    <div className="w-3/4 h-3 bg-white/10 rounded-full" />
                    <div className="text-xl font-mono font-black text-white flex items-baseline gap-1">
                      <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>24</motion.span>
                      <span className="text-[9px] font-bold text-teal-400">Med</span>
                    </div>
                  </div>
                  <div className="h-24 bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col justify-between hover:border-cyan-500/30 transition-colors relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-cyan-500/10 rounded-bl-xl blur-sm" />
                    <div className="w-3/4 h-3 bg-white/10 rounded-full" />
                    <div className="text-xl font-mono font-black text-white flex items-baseline gap-1">
                      <motion.span animate={{ opacity: [1, 0.7, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>1 420</motion.span>
                      <span className="text-[9px] font-bold text-cyan-400">Actives</span>
                    </div>
                  </div>
                  <div className="h-24 bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col justify-between hover:border-indigo-500/30 transition-colors relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-500/10 rounded-bl-xl blur-sm" />
                    <div className="w-3/4 h-3 bg-white/10 rounded-full" />
                    <div className="text-xl font-mono font-black text-white flex items-baseline gap-1">
                      <motion.span>114</motion.span>
                      <span className="text-[9px] font-bold text-indigo-400">Officines</span>
                    </div>
                  </div>
                </div>

                {/* Grid bas (Table + Live Chart) */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden">
                  
                  {/* Table fake d'ordonnances réelles */}
                  <div className="md:col-span-7 bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col gap-3 overflow-hidden justify-between">
                    <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 pb-2 border-b border-white/5">
                      Dernières Prescriptions (Antananarivo)
                    </div>
                    
                    {/* Row 1 */}
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-extrabold text-white">Dr. Randria — Analakely</span>
                        <span className="text-[8px] font-semibold text-zinc-500 font-mono">PATIENT : Fidèle R.</span>
                      </div>
                      <div className="px-2 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-[8px] font-black uppercase tracking-wider text-teal-400 flex items-center gap-1.5 shadow-[0_0_15px_rgba(20,184,166,0.1)]">
                        <div className="w-1 h-1 bg-teal-400 rounded-full animate-ping" />
                        Prêt
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-extrabold text-white">Dr. Razafy — Ivato</span>
                        <span className="text-[8px] font-semibold text-zinc-500 font-mono">PATIENT : Mirana T.</span>
                      </div>
                      <div className="px-2 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-[8px] font-black uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                        <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" />
                        En attente
                      </div>
                    </div>
                  </div>

                  {/* SVG Chart animé */}
                  <div className="md:col-span-5 bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden">
                    <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 pb-1">
                      Activité Réseau (Flux 24h)
                    </div>
                    <div className="flex-1 relative w-full h-full min-h-[80px]">
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 150 70" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.3"/>
                            <stop offset="100%" stopColor="#0d9488" stopOpacity="0"/>
                          </linearGradient>
                        </defs>
                        {/* Area glow */}
                        <motion.path
                          d="M 10 60 Q 30 20 60 45 T 110 15 T 140 30 L 140 60 Z"
                          fill="url(#chart-glow)"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                        />
                        {/* Glowing line */}
                        <motion.path
                          d="M 10 60 Q 30 20 60 45 T 110 15 T 140 30"
                          fill="none"
                          stroke="#00f0ff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatType: "loop", repeatDelay: 1 }}
                        />
                        {/* Pulsing endpoint */}
                        <motion.circle
                          cx="140" cy="30" r="2.5"
                          fill="#00f0ff"
                          animate={{ scale: [1, 1.8, 1], opacity: [0.8, 1, 0.8] }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                        />
                      </svg>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Effet de reflet (Glare) 3D par-dessus l'écran */}
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-2xl"
              style={{
                background: "linear-gradient(105deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 100%)",
                opacity: useTransform(mouseXSpring, [-0.5, 0.5], [0, 1]),
              }}
            />
          </motion.div>
        </div>

      </div>
    </section>
  );
}
