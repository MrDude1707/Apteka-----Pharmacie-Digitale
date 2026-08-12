import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const RollingDigit = ({ digit }) => {
  const laneRef = useRef(null);
  
  useGSAP(() => {
    const parsed = parseInt(digit, 10);
    if (isNaN(parsed)) return;
    
    // Répétition de 3 cycles complets (30 chiffres) pour donner l'effet de roulement rapide (style Refokus)
    const rollCycles = 3;
    const targetYPercent = -((rollCycles * 10) + parsed) * 2; // 50 chiffres au total, donc chaque chiffre représente 2% de la hauteur totale (100 / 50 = 2)

    gsap.fromTo(laneRef.current,
      { yPercent: 0 },
      {
        yPercent: targetYPercent,
        duration: 2.5,
        ease: 'power4.out', // Démarrage ultra-rapide et décélération progressive parfaite
        scrollTrigger: {
          trigger: laneRef.current,
          start: 'top 95%',
          toggleActions: 'play none none none',
        }
      }
    );
  }, { dependencies: [digit] });

  // Répéter 5 fois la séquence 0-9 pour permettre le défilement fluide
  const digitsList = Array(5).fill([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).flat();

  return (
    <div className="relative overflow-hidden h-[1.1em] flex flex-col items-center select-none" style={{ height: '1em', lineHeight: '1em' }}>
      <div ref={laneRef} className="flex flex-col">
        {digitsList.map((d, idx) => (
          <span key={idx} className="block select-none" style={{ height: '1em', lineHeight: '1em' }}>
            {d}
          </span>
        ))}
      </div>
    </div>
  );
};

const RefokusCounter = ({ value, label, suffix = "" }) => {
  const valueStr = String(value);

  return (
    <div 
      className="flex flex-col items-center justify-center p-8 sm:p-10 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-[2.5rem] shadow-2xl hover:border-teal-500/30 hover:scale-[1.02] transition-all duration-500 group"
    >
      <div className="flex items-center text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent tracking-tighter font-mono leading-none">
        {valueStr.split('').map((char, index) => {
          if (isNaN(parseInt(char, 10)) && char !== '.') {
            return <span key={index} className="select-none leading-none">{char}</span>;
          }
          if (char === '.') {
            return <span key={index} className="leading-none select-none">.</span>;
          }
          return <RollingDigit key={index} digit={char} />;
        })}
        {suffix && <span className="select-none leading-none text-teal-400 font-bold">{suffix}</span>}
      </div>
      <span className="text-[10px] font-black text-zinc-500 mt-5 text-center uppercase tracking-widest leading-relaxed group-hover:text-zinc-400 transition-colors">
        {label}
      </span>
    </div>
  );
};

export default function StatsSection() {
  const containerRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo('.stats-container',
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: '.stats-container',
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  }, { scope: containerRef });

  return (
    <section ref={containerRef} id="statistiques" className="py-32 px-6 sm:px-12 md:px-16 bg-[#09090b] overflow-hidden relative border-t border-zinc-900/60">
      
      {/* Decorative ambient gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(13,148,136,0.03),transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.03),transparent_40%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto stats-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <RefokusCounter value={12} suffix="+" label="Officines Agréées d'Antananarivo" />
          <RefokusCounter value={1500} suffix="+" label="Molécules Référencées (DPLM)" />
          <RefokusCounter value={99.8} suffix="%" label="Falsifications & Doublons Éliminés" />
          <RefokusCounter value={24} suffix="/7" label="Mise à Jour des Officines de Garde" />
        </div>
      </div>
    </section>
  );
}