import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Stethoscope, Smartphone, Store } from 'lucide-react';

export default function FeaturesScroll() {
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const pathLength = useTransform(scrollYProgress, [0, 0.8], [0, 1]);
  const opacity1 = useTransform(scrollYProgress, [0, 0.2], [0.2, 1]);
  const opacity2 = useTransform(scrollYProgress, [0.3, 0.5], [0.2, 1]);
  const opacity3 = useTransform(scrollYProgress, [0.6, 0.8], [0.2, 1]);

  const scale1 = useTransform(scrollYProgress, [0, 0.2], [0.9, 1]);
  const scale2 = useTransform(scrollYProgress, [0.3, 0.5], [0.9, 1]);
  const scale3 = useTransform(scrollYProgress, [0.6, 0.8], [0.9, 1]);

  return (
    <section ref={containerRef} id="features" className="relative py-32 bg-[#050505] overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-6 sm:px-12 relative z-10 text-center mb-24">
        <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text mb-4" style={{ backgroundImage: 'linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.5) 100%)', WebkitBackgroundClip: 'text' }}>
          Comment ça marche ?
        </h2>
        <p className="text-zinc-400 max-w-2xl mx-auto text-lg">Trois étapes simples. Zéro papier. Zéro attente.</p>
      </div>

      <div className="relative max-w-4xl mx-auto px-6 sm:px-12 min-h-[800px] flex flex-col justify-between">
        
        <div className="absolute left-[39px] sm:left-1/2 top-0 bottom-0 w-0.5 bg-white/5 sm:-translate-x-1/2" />

        <div className="absolute left-[39px] sm:left-1/2 top-0 bottom-0 sm:-translate-x-1/2">
          <svg width="4" height="100%" className="overflow-visible">
            <motion.line 
              x1="2" y1="0" x2="2" y2="100%"
              stroke="#0d9488"
              strokeWidth="4"
              strokeLinecap="round"
              style={{ pathLength }}
              className="drop-shadow-[0_0_8px_rgba(13,148,136,0.8)]"
            />
          </svg>
        </div>

        {/* Traveling Light Pulse (Faisceau de lumière dynamique lié au scroll) */}
        <motion.div 
          className="absolute left-[38px] sm:left-1/2 w-1.5 h-20 bg-gradient-to-b from-teal-400 via-cyan-400 to-transparent sm:-translate-x-1/2 rounded-full blur-[1px] shadow-[0_0_15px_#00f0ff] z-10 pointer-events-none"
          style={{ 
            top: useTransform(scrollYProgress, [0, 0.8], ["0%", "85%"]),
            opacity: useTransform(scrollYProgress, [0, 0.05, 0.8, 0.95], [0, 1, 1, 0])
          }}
        />

        {/* Étape 1 */}
        <motion.div style={{ opacity: opacity1, scale: scale1 }} className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8 mb-32 transition-all duration-350">
          <div className="w-full sm:w-1/2 sm:pr-12 text-left sm:text-right order-2 sm:order-1 pl-20 sm:pl-0">
            <h3 className="text-2xl font-bold text-white mb-2">1. La Consultation</h3>
            <p className="text-zinc-400">Votre médecin rédige une ordonnance numérique sécurisée. Elle est instantanément enregistrée sur votre compte Apteka.</p>
          </div>
          <div className="absolute left-0 sm:left-1/2 top-1/2 -translate-y-1/2 sm:-translate-x-1/2 w-20 h-20 bg-[#050505] rounded-full border-4 border-[#050505] flex items-center justify-center z-20">
            <motion.div 
              style={{ scale: scale1 }}
              className="w-12 h-12 bg-teal-500/10 border border-teal-500/30 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(13,148,136,0.2)]"
            >
              <Stethoscope className="text-teal-400" size={24} strokeWidth={1.5} />
            </motion.div>
          </div>
          <div className="w-full sm:w-1/2 order-3 sm:order-3" />
        </motion.div>

        {/* Étape 2 */}
        <motion.div style={{ opacity: opacity2, scale: scale2 }} className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8 mb-32 transition-all duration-350">
          <div className="w-full sm:w-1/2 order-3 sm:order-1" />
          <div className="absolute left-0 sm:left-1/2 top-1/2 -translate-y-1/2 sm:-translate-x-1/2 w-20 h-20 bg-[#050505] rounded-full border-4 border-[#050505] flex items-center justify-center z-20">
            <motion.div 
              style={{ scale: scale2 }}
              className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.2)]"
            >
              <Smartphone className="text-cyan-400" size={24} strokeWidth={1.5} />
            </motion.div>
          </div>
          <div className="w-full sm:w-1/2 sm:pl-12 text-left order-2 sm:order-3 pl-20 sm:pl-0">
            <h3 className="text-2xl font-bold text-white mb-2">2. La Réservation</h3>
            <p className="text-zinc-400">Ouvrez l'application, vérifiez quelles pharmacies ont vos médicaments en stock, et réservez-les en un clic.</p>
          </div>
        </motion.div>

        {/* Étape 3 */}
        <motion.div style={{ opacity: opacity3, scale: scale3 }} className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8 transition-all duration-350">
          <div className="w-full sm:w-1/2 sm:pr-12 text-left sm:text-right order-2 sm:order-1 pl-20 sm:pl-0">
            <h3 className="text-2xl font-bold text-white mb-2">3. Le Retrait</h3>
            <p className="text-zinc-400">Passez à la pharmacie. Le pharmacien scanne votre téléphone et vous remet votre commande prête. Sans attente.</p>
          </div>
          <div className="absolute left-0 sm:left-1/2 top-1/2 -translate-y-1/2 sm:-translate-x-1/2 w-20 h-20 bg-[#050505] rounded-full border-4 border-[#050505] flex items-center justify-center z-20">
            <motion.div 
              style={{ scale: scale3 }}
              className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]"
            >
              <Store className="text-emerald-400" size={24} strokeWidth={1.5} />
            </motion.div>
          </div>
          <div className="w-full sm:w-1/2 order-3 sm:order-3" />
        </motion.div>

      </div>
    </section>
  );
}
