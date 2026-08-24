import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import { API_URL } from '../config';

// Import our newly reconstructed premium components
import HeroSection from './landing/HeroSection';
import WhatIfHealth from './landing/WhatIfHealth';
import FeaturesScroll from './landing/FeaturesScroll';
import DashboardPreview from './landing/DashboardPreview';
import ProductShowcase from './landing/ProductShowcase';
import SecuritySection from './landing/SecuritySection';
import TestimonialsCarousel from './landing/TestimonialsCarousel';
import FAQSection from './landing/FAQSection';
import StatsSection from './landing/StatsSection';
import BrandLogo from './BrandLogo';
import JellyCursor from './ui/JellyCursor';
import PartnersMarquee from './landing/PartnersMarquee';
import LiquidLoginModal from './landing/LiquidLoginModal';
import WebGLBackground from './ui/WebGLBackground';
import TextReveal from './ui/TextReveal';
import MagneticButton from './ui/MagneticButton';

export default function LandingPage({ onLoginSuccess, handleQuickDemoLogin }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Monitor scroll height to make navbar float as a sleek glass pill
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative font-sans bg-[#050505] selection:bg-[#00f0ff] selection:text-black overflow-x-hidden antialiased text-white cursor-none">
      
      {/* Noise Overlay Cinematic (Animated) */}
      <div 
        className="fixed -inset-[10%] w-[120vw] h-[120vh] pointer-events-none z-[9999] opacity-[0.09] animated-grain" 
        style={{
          background: 'url(\'data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E\')'
        }}
      />

      {/* Persistent Fluid Background */}
      <div className="fixed inset-0 z-0 opacity-40">
        <WebGLBackground />
      </div>

      <JellyCursor />
      
      {/* Modal de connexion Liquide */}
      <LiquidLoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onLoginSuccess={onLoginSuccess}
        handleQuickDemoLogin={handleQuickDemoLogin}
      />

      {/* Premium Floating Glassmorphic Navbar */}
      <nav 
        className={`fixed z-[100] transition-all duration-700 ease-out flex items-center justify-between ${
          isScrolled 
            ? "top-6 left-6 right-6 md:left-1/2 md:right-auto md:w-[90%] md:-translate-x-1/2 max-w-6xl px-8 py-4 glass-premium-dark rounded-full shadow-2xl" 
            : "top-0 left-0 w-full px-6 sm:px-12 py-6 bg-transparent shadow-none border-b border-white/5"
        }`}
      >
        <div data-cursor-magnet className="cursor-none" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <BrandLogo variant="dark" />
        </div>
        
        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-10 text-xs font-black text-white/50 tracking-widest">
          <button data-cursor-magnet onClick={() => scrollToSection('features')} className="hover:text-white transition-colors uppercase cursor-none">L'Expérience</button>
          <button data-cursor-magnet onClick={() => scrollToSection('securite')} className="hover:text-white transition-colors uppercase cursor-none">Chiffrement</button>
          <button data-cursor-magnet onClick={() => scrollToSection('statistiques')} className="hover:text-white transition-colors uppercase cursor-none">Écosystème</button>
        </div>

        {/* Action Button */}
        <MagneticButton 
          onClick={() => setIsLoginOpen(true)} 
          className="cursor-none text-xs tracking-widest uppercase shadow-xl font-bold px-8 py-3.5"
          variant="primary"
        >
          Espace Connecté
        </MagneticButton>
      </nav>

      <div className="relative z-10">
        {/* LUSION-INSPIRED SECTIONS */}
        <HeroSection 
          onConnectClick={() => setIsLoginOpen(true)} 
          onHowItWorksClick={() => scrollToSection('features')}
          handleQuickDemoLogin={handleQuickDemoLogin}
        />
        
        <PartnersMarquee />

        <div id="features">
          <FeaturesScroll />
        </div>
        
        <DashboardPreview />
        
        <div id="statistiques">
          <StatsSection />
        </div>

        <div id="securite">
          <SecuritySection />
        </div>

        {/* CALL TO ACTION PREMIUM EN BAS DE PAGE */}
        <section className="relative py-40 flex items-center justify-center overflow-hidden border-t border-white/5">
          <div className="relative z-10 text-center max-w-5xl mx-auto px-6 flex flex-col items-center">
            
            <div className="flex justify-center mb-8">
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-[#00f0ff]">
                L'Avenir de la santé
              </span>
            </div>

            <div className="text-5xl sm:text-7xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-12 flex flex-col items-center gap-2">
              <TextReveal text="LA SANTÉ." delay={0.1} duration={1.2} />
              <TextReveal text="SANS COMPROMIS." delay={0.3} duration={1.2} className="text-[#00f0ff]" />
            </div>
            
            <MagneticButton 
              onClick={() => setIsLoginOpen(true)}
              className="cursor-none text-xs tracking-widest uppercase px-12 py-6 font-bold shadow-2xl scale-105"
              variant="secondary"
            >
              <span className="relative z-10 text-white flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-ping"></div>
                Ouvrir mon espace numérique
              </span>
            </MagneticButton>
          </div>
        </section>

        {/* Ultra Minimalist Footer */}
        <footer className="w-full py-12 bg-transparent border-t border-white/5 flex flex-col md:flex-row items-center justify-between px-12 text-white/30 text-[10px] font-black tracking-widest uppercase">
          <div data-cursor-magnet className="cursor-none flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center text-white/50">C</div>
            {new Date().getFullYear()} APTEKA DIGITALE
          </div>
          <div className="mt-4 md:mt-0 flex gap-8">
            <span data-cursor-magnet className="hover:text-white transition-colors cursor-none">Confidentialité</span>
            <span data-cursor-magnet className="hover:text-white transition-colors cursor-none">Mentions Légales</span>
            <span data-cursor-magnet className="hover:text-white transition-colors cursor-none">Tananarive, MDG</span>
          </div>
        </footer>
      </div>

    </div>
  );
}