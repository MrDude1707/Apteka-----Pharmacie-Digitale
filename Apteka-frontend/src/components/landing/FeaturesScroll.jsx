import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ClipboardList, ShieldAlert, Search, ShieldCheck, ShoppingCart } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const PROTOCOL_STEPS = [
  {
    num: "01",
    title: "Diagnostic & Saisie",
    role: "Médecin Agréé",
    description: "Le parcours débute lors de la consultation. Le médecin certifié saisit l'ordonnance sur le registre officiel d'Apteka, en s'assurant de la compatibilité thérapeutique.",
    icon: <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400" />
  },
  {
    num: "02",
    title: "Chiffrement & Signature",
    role: "Sécurisation Cryptographique",
    description: "La feuille de soins numérique subit un hachage asymétrique scellé par l'Ordre National des Médecins. Un QR code d'accès unique et inviolable est crypté à la source.",
    icon: <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400" />
  },
  {
    num: "03",
    title: "Interopérabilité des Stocks",
    role: "Réseau Officiel d'Officines",
    description: "La plateforme interroge les serveurs sécurisés des pharmacies d'Antananarivo en temps réel pour localiser la molécule exacte sans que le patient n'ait à errer de garde en garde.",
    icon: <Search className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400" />
  },
  {
    num: "04",
    title: "Réservation Instantanée",
    role: "Patient connecté",
    description: "Le patient consulte la carte, choisit sa pharmacie de confiance détenant le produit, et bloque instantanément son traitement pour en garantir la disponibilité physique.",
    icon: <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400" />
  },
  {
    num: "05",
    title: "Scan & Délivrance Légale",
    role: "Pharmacien Certifié",
    description: "À l'officine, le pharmacien scanne le QR code, authentifie l'ordonnance numérique cryptée, délivre la boîte scellée officielle, et l'ordonnance passe à l'état 'honoré'.",
    icon: <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400" />
  }
];

export default function FeaturesScroll() {
  const containerRef = useRef(null);
  const pinContainerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Détection responsive pour basculer la position de l'arc (bas sur mobile, droite sur desktop)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useGSAP(() => {
    const animProxy = { val: 0 };
    gsap.to(animProxy, {
      val: 1,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        pin: pinContainerRef.current,
        pinSpacing: false,
        scrub: 0.8, // Inertie fluide haut de gamme
      },
      onUpdate: () => setProgress(animProxy.val)
    });
  }, { scope: containerRef });

  const activeStep = Math.min(4, Math.max(0, Math.round(progress * 4)));
  
  // Mathématiques de positionnement polaire
  // Sur mobile, l'élément actif est en haut (270°). Sur desktop, à gauche (180°).
  const activeAngle = isMobile ? 270 : 180; 
  const spacingAngle = isMobile ? 24 : 26;
  const totalRotation = 4 * spacingAngle;
  
  return (
    <section ref={containerRef} id="features" className="relative h-[400vh] bg-[#09090b] text-white">
      {/* Conteneur collant plein écran */}
      <div ref={pinContainerRef} className="sticky top-0 h-screen w-full overflow-hidden flex flex-col lg:flex-row items-center">
        
        {/* LA COURBE (DROITE OU BAS) - Reproduction exacte de l'arc latéral MyHealthPrac */}
        <div 
          className={`absolute pointer-events-none transition-all duration-700 ${
            isMobile 
              ? "top-[90%] left-1/2 w-[180vw] h-[180vw]" 
              : "top-1/2 right-0 w-[120vh] h-[120vh] lg:w-[1100px] lg:h-[1100px]"
          }`}
          style={{
            transform: isMobile ? 'translate(-50%, -50%)' : 'translate(50%, -50%)'
          }}
        >
          {/* Lignes de tracé géométriques */}
          <div className="absolute inset-0 rounded-full border border-zinc-800/80 shadow-[inset_0_0_100px_rgba(20,184,166,0.02)]" />
          <div className={`absolute rounded-full border border-zinc-900/50 ${isMobile ? "inset-[40px]" : "inset-[60px]"}`} />

          {/* Points orbitaux calculés dynamiquement */}
          {PROTOCOL_STEPS.map((step, i) => {
            const currentAngle = activeAngle - (i * spacingAngle) + (progress * totalRotation);
            const rad = (currentAngle * Math.PI) / 180;
            const x = 50 + 50 * Math.cos(rad);
            const y = 50 + 50 * Math.sin(rad);
            const isActive = activeStep === i;

            return (
              <div
                key={i}
                className="absolute flex items-center justify-center"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className={`relative flex items-center justify-center rounded-full transition-all duration-500 ease-out ${
                  isActive 
                    ? 'w-14 h-14 sm:w-16 sm:h-16 bg-[#09090b] border-2 border-teal-500 shadow-[0_0_35px_rgba(20,184,166,0.25)] scale-110'
                    : 'w-10 h-10 sm:w-12 sm:h-12 bg-[#09090b] border border-zinc-800/80 opacity-40 scale-90'
                }`}>
                  <span className={`font-mono text-base sm:text-lg font-black ${isActive ? 'text-teal-400' : 'text-zinc-600'}`}>
                    {step.num}
                  </span>
                  
                  {/* Libellé tangent exclusif au bureau pour l'immersion */}
                  {!isMobile && (
                    <div className={`absolute right-[calc(100%+1.5rem)] whitespace-nowrap transition-all duration-500 ${
                      isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                    }`}>
                      <span className="text-xl font-bold text-white tracking-tight">{step.title}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* BLOC TEXTE (GAUCHE OU HAUT) */}
        <div className="w-full h-full max-w-7xl mx-auto px-6 sm:px-12 relative z-10 flex flex-col justify-start pt-[12vh] lg:pt-0 lg:justify-center">
          <div className="w-full lg:w-5/12 xl:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
            
            {/* En-tête de section figé */}
            <div className="mb-10 lg:mb-16">
              <span className="text-teal-500 font-extrabold uppercase tracking-widest text-[10px] sm:text-xs bg-teal-500/10 px-3 py-1.5 rounded-full border border-teal-500/20">
                Le Protocole Apteka
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white leading-[1.1] mt-6">
                Un parcours unifié,<br className="hidden sm:block" />
                <span className="text-zinc-500">traçable au millimètre.</span>
              </h2>
            </div>
            
            {/* Description dynamique animée par l'étape */}
            <div className="relative h-[280px] w-full max-w-lg">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex flex-col items-center lg:items-start"
                >
                  <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 mb-6 text-center lg:text-left">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-teal-400 shrink-0">
                      {PROTOCOL_STEPS[activeStep].icon}
                    </div>
                    <div className="mt-2 lg:mt-0">
                      <span className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">
                        {PROTOCOL_STEPS[activeStep].role}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        {PROTOCOL_STEPS[activeStep].title}
                      </h3>
                    </div>
                  </div>
                  
                  <p className="text-zinc-400 text-sm sm:text-base md:text-lg font-medium leading-relaxed">
                    {PROTOCOL_STEPS[activeStep].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            
          </div>
        </div>

      </div>
    </section>
  );
}
