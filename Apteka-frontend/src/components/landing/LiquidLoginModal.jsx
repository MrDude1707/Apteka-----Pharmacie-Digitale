import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import PatientAuth from '../PatientAuth';

export default function LiquidLoginModal({ isOpen, onClose, onLoginSuccess }) {
  
  // Bloquer le scroll de la page quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#050505]"
          initial={{ clipPath: "circle(0% at 50% 100%)", opacity: 0 }}
          animate={{ clipPath: "circle(150% at 50% 50%)", opacity: 1 }}
          exit={{ clipPath: "circle(0% at 50% 100%)", opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
        >
          {/* Background effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/20 via-[#050505] to-[#050505] pointer-events-none" />
          
          <div 
            className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay" 
            style={{ 
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' 
            }} 
          />

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 z-50 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white backdrop-blur-md transition-colors cursor-none"
          >
            <X size={24} />
          </button>

          {/* Auth Component Container */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="relative z-10 w-full max-w-xl px-6 max-h-screen overflow-y-auto pt-24 pb-12 hide-scrollbar"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">Rejoindre le Réseau</h2>
              <p className="text-zinc-400 text-sm">Authentifiez-vous pour accéder à votre espace sécurisé.</p>
            </div>
            
            {/* 
              On englobe PatientAuth dans un conteneur au style pur Lusion 
              (Le composant interne PatientAuth gère sa propre logique d'onglets)
            */}
            <PatientAuth 
              onLoginSuccess={onLoginSuccess} 
              initialView="login"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
