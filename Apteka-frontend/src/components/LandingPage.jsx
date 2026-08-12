import React, { memo, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Sparkles,
  Mail,
  Phone,
  ArrowRight
} from 'lucide-react';
import PatientAuth from './PatientAuth';
import Logo from './Logo';
import { API_URL } from '../config';

// Import our newly reconstructed premium components
import HeroSection from './landing/HeroSection';
import WhatIfHealth from './landing/WhatIfHealth';
import FeaturesScroll from './landing/FeaturesScroll';
import TestimonialsCarousel from './landing/TestimonialsCarousel';
import FAQSection from './landing/FAQSection';
import StatsSection from './landing/StatsSection';

// 1. Fallback Doctors List (Seeds alignment)
const FALLBACK_DOCTORS = [
  { id: "fallback-razafy", nom: "Dr. Jean Razafy", specialite: "Médecine générale", photoUrl: "/images/medecins/medecin-1.jpg" },
  { id: "fallback-rakoto", nom: "Dr. Voahangy Rakoto", specialite: "Pédiatrie", photoUrl: "/images/medecins/medecin-2.jpg" },
  { id: "fallback-andrianasolo", nom: "Dr. Hery Andrianasolo", specialite: "Cardiologie", photoUrl: "/images/medecins/medecin-3.jpg" },
  { id: "fallback-ravelojaona", nom: "Dr. Mialy Ravelojaona", specialite: "Gynécologie", photoUrl: "/images/medecins/medecin-4.jpg" },
  { id: "fallback-rabearison", nom: "Dr. Tojo Rabearison", specialite: "Dermatologie", photoUrl: "/images/medecins/medecin-5.jpg" }
];

// 2. Partner Pharmacies List
const PARTNERS = [
  "Pharmacie Centrale",
  "Pharmacie Analakely",
  "Pharmacie Isoraka",
  "Pharmacie de l'Océan",
  "Pharmacie du Progrès",
  "Pharmacie Santé",
  "Pharmacie de l'Avenue",
  "Pharmacie Métropole",
];

// 3. Infinite Horizontal Marquee for Partner Pharmacies
const InfiniteMarquee = () => {
  const duplicatedPartners = [...PARTNERS, ...PARTNERS];

  return (
    <div className="w-full overflow-hidden whitespace-nowrap py-10 relative">
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#09090b] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#09090b] to-transparent z-10 pointer-events-none" />

      <motion.div
        className="inline-flex gap-8"
        animate={{
          x: [0, "-50%"]
        }}
        transition={{
          ease: "linear",
          duration: 30,
          repeat: Infinity
        }}
      >
        {duplicatedPartners.map((partner, index) => (
          <span
            key={index}
            className="inline-block px-6 py-4 bg-zinc-900/60 backdrop-blur-md border border-zinc-800/60 rounded-2xl hover:text-teal-400 hover:border-teal-500/50 hover:scale-[1.03] transition-all cursor-default shadow-lg font-bold text-zinc-300"
          >
            {partner}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

export default function LandingPage({ onLoginSuccess, handleQuickDemoLogin }) {
  const [medecins, setMedecins] = useState([]);
  const [authView, setAuthView] = useState('login');
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const authSectionRef = useRef(null);

  // Monitor scroll height to make navbar float as a sleek glass pill
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/public/medecins-disponibles`)
      .then(res => res.json())
      .then(data => { if(Array.isArray(data)) setMedecins(data); })
      .catch(console.error);
  }, []);

  const displayMedecins = medecins.length > 0 ? medecins : FALLBACK_DOCTORS;

  const scrollToAuth = () => {
    authSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative font-sans bg-[#09090b] selection:bg-teal-500 selection:text-white overflow-x-hidden antialiased text-zinc-100">
      
      {/* Premium Floating Glassmorphic Navbar */}
      <nav 
        className={`fixed z-[100] transition-all duration-500 flex items-center justify-between ${
          isScrolled 
            ? "top-4 left-4 right-4 md:left-1/2 md:right-auto md:w-[90%] md:-translate-x-1/2 max-w-6xl px-8 py-3 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/60 rounded-full shadow-2xl" 
            : "top-0 left-0 w-full px-6 sm:px-12 py-5 bg-zinc-950/40 backdrop-blur-md border-b border-zinc-900/40 shadow-none"
        }`}
      >
        <span className="text-xl font-black bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent tracking-widest uppercase">APTEKA</span>
        
        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-xs font-bold text-zinc-400 tracking-wide">
          <button onClick={() => scrollToSection('features')} className="hover:text-teal-400 transition-colors uppercase cursor-pointer">Fonctionnalités</button>
          <button onClick={() => scrollToSection('statistiques')} className="hover:text-teal-400 transition-colors uppercase cursor-pointer">Statistiques</button>
          <button onClick={() => scrollToSection('testimonials')} className="hover:text-teal-400 transition-colors uppercase cursor-pointer">Avis</button>
          <button onClick={() => scrollToSection('faq')} className="hover:text-teal-400 transition-colors uppercase cursor-pointer">FAQ</button>
        </div>

        {/* Action Button */}
        <motion.button 
          whileHover={{ scale: 1.03, y: -0.5 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setAuthView('login');
            scrollToAuth();
          }} 
          className="px-6 py-3 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-extrabold shadow-md shadow-teal-500/10 hover:shadow-lg hover:shadow-teal-500/20 transition-all text-xs tracking-wider uppercase focus:outline-none cursor-pointer"
        >
          Connexion
        </motion.button>
      </nav>

      {/* Hero Section */}
      <HeroSection 
        onConnectClick={() => {
          setAuthView('login');
          scrollToAuth();
        }}
        onHowItWorksClick={() => scrollToSection('features')}
        handleQuickDemoLogin={() => {
          setAuthView('login');
          setShowDemoAccounts(true);
          scrollToAuth();
        }}
      />

      {/* The Manifest: What If Health Was... Section */}
      <WhatIfHealth />

      {/* Infinite Pharmacies Marquee */}
      <section className="bg-zinc-950/20 border-y border-zinc-900/60 relative z-20 py-4">
        <InfiniteMarquee />
      </section>

      {/* Features Scroll Section */}
      <FeaturesScroll />

      {/* Stats Section */}
      <StatsSection />

      {/* Testimonials Section */}
      <TestimonialsCarousel />

      {/* FAQ Section */}
      <FAQSection />

      {/* Portal Auth Section */}
      <section ref={authSectionRef} className="auth-section py-24 sm:py-32 bg-[#09090b] text-white relative z-20 border-t border-zinc-900 overflow-hidden">
        
        {/* Dynamic Abstract Backdrops */}
        <div className="absolute top-[10%] right-[-10%] w-[40vw] h-[40vw] bg-teal-500/5 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[10%] left-[-10%] w-[40vw] h-[40vw] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Column: Copywriting & Accounts Help */}
            <div className="lg:col-span-5 flex flex-col gap-8 text-left">
              <div className="flex flex-col gap-4">
                <span className="text-teal-400 font-bold uppercase tracking-widest text-xs">Accès Sécurisé</span>
                <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  Rejoignez le <br />Portail Apteka
                </h3>
                <p className="text-zinc-400 font-medium leading-relaxed text-sm sm:text-base">
                  Connectez-vous pour accéder à vos ordonnances cryptées, à la recherche de stocks de médicaments en temps réel et à la messagerie de santé intégrée. Que vous soyez patient, médecin ou pharmacien d'officine, gérez votre parcours de santé de manière moderne et transparente.
                </p>
              </div>

              {/* Demo Accounts Panel */}
              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-md">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
                      <Sparkles size={18}/>
                    </div>
                    <span className="text-sm font-extrabold text-white">Comptes de test pour démo rapide</span>
                  </div>
                  <ChevronDown size={18} className={`text-zinc-400 transition-transform ${showDemoAccounts ? 'rotate-180' : ''}`} />
                </div>
                
                <AnimatePresence>
                  {showDemoAccounts && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400">
                        <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/40 flex flex-col gap-0.5">
                          <span className="font-bold text-teal-400">👤 Patient</span>
                          <span>Email: patient@example.com</span>
                          <span>Code: password123</span>
                        </div>
                        <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/40 flex flex-col gap-0.5">
                          <span className="font-bold text-teal-400">🩺 Médecin</span>
                          <span>Email: dr.razafy@pharma.mg</span>
                          <span>Code: password123</span>
                        </div>
                        <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/40 flex flex-col gap-0.5">
                          <span className="font-bold text-teal-400">💊 Pharmacien</span>
                          <span>Email: pharmacien.analakely@pharma.mg</span>
                          <span>Code: password123</span>
                        </div>
                        <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/40 flex flex-col gap-0.5">
                          <span className="font-bold text-teal-400">🛡️ Admin</span>
                          <span>Email: admin@pharma.mg</span>
                          <span>Code: password123</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* Right Column: Glassmorphic Auth Form */}
            <div className="lg:col-span-7 w-full max-w-lg mx-auto lg:ml-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-zinc-900/40 border border-zinc-800/60 p-2 rounded-[2.5rem] shadow-2xl backdrop-blur-xl hover:border-teal-500/20 transition-colors"
              >
                <div className="bg-[#09090b] rounded-[2.3rem] p-6 sm:p-10">
                  <PatientAuth 
                    onLoginSuccess={onLoginSuccess} 
                    onToggleRegister={() => setAuthView(authView === 'login' ? 'register' : 'login')} 
                    initialView={authView} 
                    medecins={displayMedecins} 
                    preselectedDoctorId={selectedDoctorId} 
                  />
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-16 text-left relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            
            {/* Column 1: Brand Info */}
            <div className="flex flex-col gap-4">
              <span className="text-xl font-black bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent tracking-widest uppercase">APTEKA</span>
              <p className="text-zinc-400 font-semibold text-xs sm:text-sm leading-relaxed mt-2">
                Apteka connecte les acteurs de la santé d'Antananarivo pour fluidifier la prescription, sécuriser les ordonnances et centraliser les stocks officiels.
              </p>
              <span className="text-[11px] font-bold text-zinc-500 mt-2">
                © {new Date().getFullYear()} Apteka. Tous droits réservés.
              </span>
            </div>

            {/* Column 2: Navigation Links */}
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Navigation</h4>
              <ul className="flex flex-col gap-2.5 text-xs sm:text-sm font-semibold text-zinc-400">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-teal-400 transition-colors cursor-pointer">Comment ça marche</button></li>
                <li><button onClick={() => scrollToSection('statistiques')} className="hover:text-teal-400 transition-colors cursor-pointer">Statistiques</button></li>
                <li><button onClick={() => scrollToSection('testimonials')} className="hover:text-teal-400 transition-colors cursor-pointer">Avis</button></li>
              </ul>
            </div>

            {/* Column 3: Legal & FAQ */}
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Informations</h4>
              <ul className="flex flex-col gap-2.5 text-xs sm:text-sm font-semibold text-zinc-400">
                <li><button onClick={() => scrollToSection('faq')} className="hover:text-teal-400 transition-colors cursor-pointer">FAQ complète</button></li>
                <li><a href="#legal" className="hover:text-teal-400 transition-colors">Mentions Légales</a></li>
                <li><a href="#privacy" className="hover:text-teal-400 transition-colors">Confidentialité</a></li>
              </ul>
            </div>

            {/* Column 4: Contact & Socials */}
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Contact & Réseaux</h4>
              <div className="flex flex-col gap-2 text-xs sm:text-sm font-semibold text-zinc-400">
                <span className="flex items-center gap-2"><Mail size={14} className="text-teal-400" /> contact@apteka.mg</span>
                <span className="flex items-center gap-2"><Phone size={14} className="text-teal-400" /> +261 34 11 234 56</span>
              </div>
            </div>

          </div>
        </div>
      </footer>

    </div>
  );
}
