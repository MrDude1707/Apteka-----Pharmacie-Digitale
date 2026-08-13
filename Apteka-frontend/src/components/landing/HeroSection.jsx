import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ShieldCheck, HeartPulse, ArrowRight } from 'lucide-react';
import InteractiveBackgroundA from './InteractiveBackgroundA';

gsap.registerPlugin(useGSAP);

export default function HeroSection({ onConnectClick, onHowItWorksClick, handleQuickDemoLogin }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const badgesRef = useRef(null);
  const buttonsRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Initial fade in for container backdrops
    tl.fromTo('.ambient-glow', 
      { opacity: 0, scale: 0.8 }, 
      { opacity: 1, scale: 1, duration: 1.8, stagger: 0.3 }
    );

    // Stagger text and badges entrance
    tl.fromTo('.hero-fade-up',
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.15 },
      '-=1.2'
    );
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center pt-24 pb-12 px-6 sm:px-12 md:px-16 overflow-hidden bg-mhp-dark">
      
      {/* Interactive WebGL Background */}
      <InteractiveBackgroundA text="APTEKA" />

      {/* Aurora Ambient Glow Effects (Dark Mode) */}
      <div className="absolute top-[10%] left-[-10%] w-[45vw] h-[45vw] bg-teal-500/5 rounded-full blur-[120px] ambient-glow pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[50vw] h-[55vw] bg-cyan-500/5 rounded-full blur-[140px] ambient-glow pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] bg-indigo-500/5 rounded-full blur-[100px] ambient-glow pointer-events-none" />

      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Use absolute positioning to float the text over the center if desired, or keep left aligned. Here we keep it somewhat left/center aligned to let the A shine. */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 pointer-events-none">
        
        {/* Left Side: Copywriting & Content (pointer-events-auto so buttons work) */}
        <div ref={textRef} className="lg:col-span-8 text-left flex flex-col justify-center pointer-events-auto">
          
          {/* Tagline Badge */}
          <div className="hero-fade-up flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 w-fit shadow-lg mb-6">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
            </span>
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Plateforme Agréée - Madagascar</span>
          </div>

          {/* Primary Heading */}
          <h1 className="hero-fade-up text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.1] tracking-tight mb-6 mix-blend-screen drop-shadow-2xl">
            La prescription sécurisée, <br />
            <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              sans circuit informel.
            </span>
          </h1>

          {/* Paragraph */}
          <p className="hero-fade-up text-base sm:text-lg text-zinc-300 font-medium max-w-xl leading-relaxed mb-8 drop-shadow-md">
            Face aux risques de contrefaçons et aux errances de recherche de stocks à Antananarivo, Apteka numérise la chaîne de délivrance médicale. Suivi d'inventaires en temps réel, ordonnances chiffrées infalsifiables et distribution officielle agréée.
          </p>

          {/* Action Buttons */}
          <div ref={buttonsRef} className="hero-fade-up flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10">
            <button
              onClick={onConnectClick}
              className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold shadow-[0_0_30px_rgba(20,184,166,0.2)] hover:shadow-[0_0_40px_rgba(20,184,166,0.4)] hover:-translate-y-0.5 transition-all text-base tracking-wide flex items-center justify-center gap-2 cursor-pointer"
            >
              Accéder au Portail Clinique
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={onHowItWorksClick}
              className="px-8 py-4 rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-zinc-700/80 hover:bg-zinc-800 hover:text-white text-zinc-300 font-bold transition-all text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              Consulter les Protocoles
            </button>
          </div>

          {/* Inline Trust Badges */}
          <div ref={badgesRef} className="hero-fade-up grid grid-cols-2 gap-4 border-t border-zinc-700/60 pt-8 max-w-md bg-zinc-950/20 backdrop-blur-sm p-4 rounded-3xl mt-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/20">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-zinc-100">Traçabilité Chiffrée</h4>
                <p className="text-xs font-semibold text-zinc-400">Signatures cryptographiques</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/20">
                <HeartPulse size={20} />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-zinc-100">Officines Agréées MSP</h4>
                <p className="text-xs font-semibold text-zinc-400">Flux d'inventaires officiels</p>
              </div>
            </div>
          </div>

          {/* Quick Demo Credentials shortcut */}
          <div className="hero-fade-up mt-8 inline-flex">
            <button 
              onClick={handleQuickDemoLogin}
              className="text-sm font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-4 flex items-center gap-2 bg-zinc-950/50 backdrop-blur-sm py-2 px-4 rounded-full border border-cyan-500/20"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              Tester rapidement avec des comptes démo
            </button>
          </div>

        </div>

      </div>



    </section>
  );
}
