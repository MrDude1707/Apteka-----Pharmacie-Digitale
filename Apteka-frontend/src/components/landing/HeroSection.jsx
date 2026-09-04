import React from 'react';
import { motion } from 'framer-motion';

// =======================================================================
// SECTION HERO PRINCIPALE — OPTIMISÉE SANS 3D (LUSIVE DECONSTRUCTED)
// =======================================================================
export default function HeroSection({ onConnectClick, onHowItWorksClick, handleQuickDemoLogin }) {
  return (
    <section 
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#050505]"
    >
      {/* OVERLAY GRAIN (Bruit cinématographique) */}
      <div 
        className="absolute inset-0 z-[1] opacity-[0.15] pointer-events-none mix-blend-overlay" 
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' 
        }} 
      />

      {/* LUMIÈRES D'AMBIANCE (Glow effects) */}
      <div className="absolute top-[10%] left-[-10%] w-[40vw] h-[40vw] bg-teal-500/15 rounded-full blur-[150px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* CONTENEUR GRILLE (Séparation Texte / Lecteur Vidéo) */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mt-20 lg:mt-0">
        
        {/* COLONNE GAUCHE : TEXTE DIRECT ET FRANC */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <span className="text-[10px] font-bold text-teal-400 font-mono tracking-widest uppercase">Disponible à Madagascar</span>
          </motion.div>

          {/* Typographie Immersive & Directe */}
          <div className="overflow-hidden mb-2">
            <motion.h1 
              initial={{ y: "100%", rotate: 2 }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
              className="text-5xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text leading-[1.1] tracking-tight"
              style={{
                backgroundImage: 'linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.5) 100%)',
                WebkitBackgroundClip: 'text',
              }}
            >
              LA PHARMACIE.
            </motion.h1>
          </div>
          
          <div className="overflow-hidden">
             <motion.h1 
              initial={{ y: "100%", rotate: -2 }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ duration: 1.2, delay: 0.1, ease: [0.76, 0, 0.24, 1] }}
              className="text-5xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text leading-[1.1] tracking-tight flex items-center gap-4"
              style={{
                backgroundImage: 'linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.5) 100%)',
                WebkitBackgroundClip: 'text',
              }}
            >
              RÉINVENTÉE.
            </motion.h1>
          </div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.6 }}
            className="mt-8 text-zinc-400 max-w-xl text-base sm:text-lg font-normal leading-relaxed drop-shadow-md"
          >
            Fini les ordonnances papier perdues et les ruptures de stock surprises. 
            <strong> Apteka</strong> connecte directement votre médecin à votre pharmacie. 
            Recevez votre traitement sur votre téléphone et récupérez-le sans attendre.
          </motion.p>

          {/* Boutons d'Action */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9, ease: "backOut" }}
            className="mt-10 flex flex-wrap items-center gap-6"
          >
            <button
              onClick={onConnectClick}
              className="group relative px-8 py-4 bg-teal-500/10 backdrop-blur-md border border-teal-500/30 rounded-full text-white font-bold tracking-widest uppercase text-xs hover:border-teal-400 transition-all duration-500 overflow-hidden cursor-none"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-teal-500/30 to-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
              <span className="relative z-10 flex items-center gap-3">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(45,212,191,0.8)]"></div>
                Ouvrir mon espace
              </span>
            </button>

            <button
              onClick={handleQuickDemoLogin}
              className="px-6 py-4 text-xs font-bold text-zinc-400 hover:text-white tracking-widest uppercase transition-colors cursor-none"
            >
              Voir une démo
            </button>
          </motion.div>
        </div>

        {/* COLONNE DROITE : LECTEUR VIDÉO DE PRÉSENTATION ULTRA-PREMIUM */}
        <div className="col-span-1 lg:col-span-5 h-[45vh] lg:h-[60vh] w-full relative flex items-center justify-center">
          {/* Halo lumineux arrière */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-teal-500/20 to-sky-500/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full relative"
          >
            {/* Écran cinéma minimaliste sans cadre lourd (Bezel-less Professional Look) */}
            <div className="w-full h-full rounded-2xl bg-black/40 border border-white/10 hover:border-teal-500/40 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.8)] hover:shadow-[0_30px_100px_rgba(13,148,136,0.2)] transition-all duration-1000 flex items-center justify-center overflow-hidden group">
              
              {/* Overlay de reflet en verre très subtil pour un fini premium */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none z-10 opacity-40 group-hover:opacity-80 transition-opacity duration-1000" />
              
              {/* Vidéo de présentation */}
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover scale-100 group-hover:scale-[1.02] transition-transform duration-[2s] ease-out"
              >
                <source src="/videos/presentation.mp4" type="video/mp4" />
                <source src="/videos/hero-background.mp4" type="video/mp4" />
                <p className="text-zinc-500 text-center py-20 text-xs">Votre navigateur ne supporte pas la lecture de vidéos.</p>
              </video>

              {/* Overlay sombre subtil inférieur pour un aspect cinématographique profond */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
            </div>
          </motion.div>
        </div>
        
      </div>
    </section>
  );
}
