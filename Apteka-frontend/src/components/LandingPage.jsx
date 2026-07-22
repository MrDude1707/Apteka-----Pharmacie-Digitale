import React, { memo, useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useInView } from 'framer-motion';
import {
  Pill,
  MapPin,
  ClipboardList,
  Users,
  User,
  ArrowDown,
  ShieldCheck,
  HeartPulse,
  Laptop,
  Star,
  Clock,
  ChevronDown,
  Check,
  Shield,
  Activity,
  FileCheck2,
  ArrowRight,
  Sparkles,
  MessageCircle,
  HelpCircle,
  Mail,
  Phone,
  Play,
  Lock,
  Eye,
  Key
} from 'lucide-react';
import PatientAuth from './PatientAuth';
import Logo from './Logo';
import { API_URL } from '../config';

// 1. Reusable Animated Counter Component using quadratic ease-out
const StatCounter = ({ value, label, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!isInView) return;

    const numericValue = parseInt(value, 10);
    if (isNaN(numericValue)) {
      setCount(value);
      return;
    }

    let start = 0;
    const end = numericValue;
    const duration = 2.0; // seconds
    const totalFrames = 120;
    let frame = 0;

    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      // Ease out quad
      const currentCount = Math.round(end * (progress * (2 - progress)));
      
      if (frame >= totalFrames) {
        setCount(end);
        clearInterval(counter);
      } else {
        setCount(currentCount);
      }
    }, (duration * 1000) / totalFrames);

    return () => clearInterval(counter);
  }, [value, isInView]);

  return (
    <div ref={ref} className="flex flex-col items-center justify-center p-8 bg-white/70 backdrop-blur-md rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <span className="text-4xl sm:text-5xl font-black text-emerald-500 tracking-tight">
        {count}{suffix}
      </span>
      <span className="text-sm font-semibold text-gray-500 mt-2 text-center uppercase tracking-wider">{label}</span>
    </div>
  );
};

// 2. Reusable Accordion FAQ Item
const FAQItem = ({ question, answer, isOpen, onToggle }) => {
  return (
    <div className="border-b border-gray-100 py-5">
      <button
        onClick={onToggle}
        className="flex justify-between items-center w-full text-left font-bold text-gray-900 text-lg md:text-xl hover:text-emerald-500 transition-colors py-2 focus:outline-none"
        aria-expanded={isOpen}
      >
        <span>{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-emerald-500 ml-4 flex-shrink-0"
        >
          <ChevronDown size={24} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="text-gray-500 font-medium leading-relaxed mt-3 pr-8 text-base">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 3. Fallback Doctors List (Seeds alignment)
const FALLBACK_DOCTORS = [
  { id: "fallback-razafy", nom: "Dr. Jean Razafy", specialite: "Médecine générale", photoUrl: "/images/medecins/medecin-1.jpg" },
  { id: "fallback-rakoto", nom: "Dr. Voahangy Rakoto", specialite: "Pédiatrie", photoUrl: "/images/medecins/medecin-2.jpg" },
  { id: "fallback-andrianasolo", nom: "Dr. Hery Andrianasolo", specialite: "Cardiologie", photoUrl: "/images/medecins/medecin-3.jpg" },
  { id: "fallback-ravelojaona", nom: "Dr. Mialy Ravelojaona", specialite: "Gynécologie", photoUrl: "/images/medecins/medecin-4.jpg" },
  { id: "fallback-rabearison", nom: "Dr. Tojo Rabearison", specialite: "Dermatologie", photoUrl: "/images/medecins/medecin-5.jpg" }
];

// 4. Testimonials List
const TESTIMONIALS = [
  { initials: "AM", name: "Alain Michel", role: "Patient (Analakely)", text: "Apteka a totalement changé ma façon d'acheter mes traitements. Plus besoin de faire le tour des pharmacies de la ville, je sais exactement qui a le stock en temps réel.", rating: 5 },
  { initials: "JR", name: "Dr. Jean Razafy", role: "Médecin Référent", text: "La prescription électronique simplifie mon quotidien et sécurise la transmission. Mes patients sont rassurés et beaucoup mieux pris en charge.", rating: 5 },
  { initials: "TK", name: "Tojo Koloina", role: "Pharmacien (Pharmacie de Tana)", text: "Grâce à la déduction instantanée de stock via QR code, nous avons éliminé les erreurs de délivrance et optimisé notre logistique au quotidien.", rating: 5 },
  { initials: "HL", name: "Hariniaina Lalaina", role: "Patiente (Isoraka)", text: "Le calcul d'itinéraire vers la pharmacie la plus proche est d'une utilité incroyable, surtout en situation d'urgence ou pour les gardes de nuit.", rating: 5 },
  { initials: "SR", name: "Dr. Sandra Raman", role: "Pédiatre (Ambohibao)", text: "Un outil indispensable pour le système de santé de notre capitale. La visibilité immédiate sur les stocks évite aux familles des déplacements fatiguants.", rating: 5 },
  { initials: "MV", name: "Mina Vololona", role: "Patiente (Ankorondrano)", text: "La demande de renouvellement en un clic depuis mon espace est extrêmement simple. Une interface superbe, digne des plus grands outils modernes.", rating: 5 }
];

// 5. Partner Pharmacies List
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

// 6. Infinite Horizontal Marquee for Partner Pharmacies
const InfiniteMarquee = () => {
  const duplicatedPartners = [...PARTNERS, ...PARTNERS];

  return (
    <div className="w-full overflow-hidden whitespace-nowrap py-10 relative">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      <motion.div
        className="inline-flex gap-8"
        animate={{
          x: [0, "-50%"]
        }}
        transition={{
          ease: "linear",
          duration: 25,
          repeat: Infinity
        }}
      >
        {duplicatedPartners.map((partner, index) => (
          <span
            key={index}
            className="inline-block px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl hover:text-emerald-500 hover:border-emerald-200 transition-all cursor-default shadow-sm font-bold text-gray-700"
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
  const [openFaq, setOpenFaq] = useState(null);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  const authSectionRef = useRef(null);
  const featuresSectionRef = useRef(null);
  const stickySectionRef = useRef(null);

  // Parallax Scroll Tracking for Video Background
  const { scrollY } = useScroll();
  const videoY = useTransform(scrollY, [0, 800], [0, 180]);
  const videoScale = useTransform(scrollY, [0, 800], [1, 1.12]);
  const videoOpacity = useTransform(scrollY, [0, 800], [0.85, 0.35]);

  // Scroll Progress Bar Setup
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Sticky Horizontal Scroll for Doctor Selection
  const { scrollYProgress: stickyScrollProgress } = useScroll({
    target: stickySectionRef,
    offset: ["start start", "end end"]
  });
  const x = useTransform(stickyScrollProgress, [0.1, 0.9], ["0%", "-62%"]);

  useEffect(() => {
    fetch(`${API_URL}/api/public/medecins-disponibles`)
      .then(res => res.json())
      .then(data => { if(Array.isArray(data)) setMedecins(data); })
      .catch(console.error);
  }, []);

  const displayMedecins = medecins.length > 0 ? medecins : FALLBACK_DOCTORS;

  const handleSelectDoctor = (docId) => {
    setSelectedDoctorId(docId);
    setAuthView('register');
    authSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Stagger Container Animations
  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 90, damping: 18 }
    }
  };

  return (
    <div className="relative font-sans bg-white selection:bg-emerald-500 selection:text-white overflow-x-hidden antialiased text-gray-900">
      
      {/* Scroll Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-emerald-500 z-[100] origin-left" 
        style={{ scaleX }} 
      />

      {/* Floating Glassmorphic Navbar */}
      <nav className="fixed top-0 w-full z-50 px-6 sm:px-12 py-4 flex items-center justify-between bg-white/70 backdrop-blur-xl border-b border-gray-100/60 shadow-sm transition-all duration-300">
        <Logo variant="light" size="md" />
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
          <button onClick={() => featuresSectionRef.current?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-emerald-500 transition-colors">Comment ça marche</button>
          <a href="#statistiques" className="hover:text-emerald-500 transition-colors">Statistiques</a>
          <a href="#pourquoi-apteka" className="hover:text-emerald-500 transition-colors">Avantages</a>
          <a href="#apercu-produit" className="hover:text-emerald-500 transition-colors">Aperçu</a>
          <a href="#temoignages" className="hover:text-emerald-500 transition-colors">Témoignages</a>
          <a href="#faq" className="hover:text-emerald-500 transition-colors">FAQ</a>
        </div>
        <motion.button 
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setAuthView('login');
            authSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
          }} 
          className="px-6 py-2.5 rounded-full bg-emerald-500 text-white font-extrabold shadow-md shadow-emerald-500/20 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/30 transition-all text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          Espace Connexion
        </motion.button>
      </nav>

      {/* SECTION 1: HERO SECTION */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 overflow-hidden">
        
        {/* Parallax Video Container */}
        <motion.div 
          style={{ y: videoY, scale: videoScale, opacity: videoOpacity }}
          className="absolute inset-0 z-0 bg-teal-950 pointer-events-none"
        >
          <video className="w-full h-full object-cover" src="/videos/hero-background.mp4" autoPlay loop muted playsInline />
          {/* Enhanced Overlay for Modern Vignette and Depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-teal-950/40 via-gray-900/40 to-white" />
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/30 via-transparent to-transparent" />
        </motion.div>

        {/* Content Box */}
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-5xl mt-8">
          <motion.span 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-[11px] font-bold uppercase tracking-widest text-emerald-300 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 backdrop-blur-md"
          >
            Apteka - L'avenir de la Pharmacie Numérique
          </motion.span>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, type: "spring", stiffness: 100 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-tight drop-shadow-sm"
          >
            La santé à Antananarivo, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">
              connectée en temps réel.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="text-base sm:text-xl text-emerald-50/90 max-w-2xl mt-4 font-medium leading-relaxed drop-shadow-sm"
          >
            Apteka simplifie le parcours de soins en reliant instantanément les patients, les médecins agréés et les officines officielles. Suivez vos stocks en direct et sécurisez vos ordonnances.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button 
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => featuresSectionRef.current?.scrollIntoView({ behavior: 'smooth' })} 
              className="px-8 py-4.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-black text-base shadow-lg shadow-emerald-500/30 transition-all focus:outline-none"
            >
              Découvrir la plateforme
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setAuthView('login');
                authSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
              }} 
              className="px-8 py-4.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-black text-base backdrop-blur-md border border-white/20 transition-all focus:outline-none"
            >
              Créer mon compte
            </motion.button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer z-20"
          onClick={() => featuresSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          <span className="text-[10px] text-white/50 uppercase tracking-widest font-black">Faites défiler</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center p-1.5"
          >
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* SECTION 2: COMMENT CA MARCHE */}
      <section ref={featuresSectionRef} id="comment-ca-marche" className="py-24 sm:py-32 bg-white relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-emerald-500 font-bold uppercase tracking-widest text-sm">Le parcours de soins réinventé</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mt-3">
              Comment fonctionne Apteka ?
            </h2>
          </div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-3 gap-8 lg:gap-12"
          >
            {/* Step 1 */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -6 }}
              className="flex flex-col items-center text-center gap-6 p-10 rounded-[2.5rem] bg-gray-50 border border-gray-100 hover:shadow-xl hover:shadow-gray-200/40 hover:bg-white transition-all duration-300"
            >
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                <HeartPulse size={36}/>
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">1. Consultation & Ordonnance</h3>
              <p className="text-gray-500 font-semibold leading-relaxed text-sm sm:text-base">
                Le médecin agréé rédige l'ordonnance électroniquement. Un QR Code crypté unique (ORD-XXXX) est généré instantanément dans votre espace sécurisé.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -6 }}
              className="flex flex-col items-center text-center gap-6 p-10 rounded-[2.5rem] bg-gray-50 border border-gray-100 hover:shadow-xl hover:shadow-gray-200/40 hover:bg-white transition-all duration-300"
            >
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                <Laptop size={36}/>
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">2. Recherche de Stocks</h3>
              <p className="text-gray-500 font-semibold leading-relaxed text-sm sm:text-base">
                Recherchez vos médicaments en un clic. Repérez immédiatement sur notre carte interactive les pharmacies les plus proches disposant du stock requis.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -6 }}
              className="flex flex-col items-center text-center gap-6 p-10 rounded-[2.5rem] bg-gray-50 border border-gray-100 hover:shadow-xl hover:shadow-gray-200/40 hover:bg-white transition-all duration-300"
            >
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                <ShieldCheck size={36}/>
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">3. Délivrance Sécurisée</h3>
              <p className="text-gray-500 font-semibold leading-relaxed text-sm sm:text-base">
                Présentez votre QR Code chez le pharmacien. L'officine scanne le code pour vérifier l'authenticité de la prescription et déduit automatiquement le stock.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2.5: CHOIX DU MEDECIN REFERENT (STICKY HORIZONTAL SCROLL) */}
      <section ref={stickySectionRef} id="selection-medecin" className="relative h-[175vh] bg-white z-20 border-t border-gray-100">
        <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 w-full flex flex-col gap-12">
            <div className="text-left max-w-2xl">
              <span className="text-emerald-500 font-bold uppercase tracking-widest text-sm flex items-center gap-1.5">
                <Sparkles size={16} /> Suivi médical sur-mesure
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mt-3">
                Sélectionnez votre Médecin Référent
              </h2>
              <p className="text-gray-500 font-semibold leading-relaxed text-sm sm:text-base mt-2">
                Choisissez l'un de nos praticiens agréés à Antananarivo pour bénéficier d'un suivi de santé personnalisé. En sélectionnant un médecin, son profil sera pré-configuré lors de votre inscription. Continuez à faire défiler vers le bas pour faire défiler les praticiens horizontalement !
              </p>
            </div>

            {/* Horizontal Moving Row driven by vertical scroll */}
            <div className="relative w-full overflow-hidden py-4">
              <motion.div 
                style={{ x }} 
                className="flex gap-8 w-max pl-4"
              >
                {displayMedecins.map((doc) => {
                  const isSelected = selectedDoctorId === doc.id;
                  return (
                    <motion.div
                      key={doc.id}
                      whileHover={{ y: -8, scale: 1.02 }}
                      onClick={() => handleSelectDoctor(doc.id)}
                      className={`w-[350px] shrink-0 p-8 rounded-[2rem] border transition-all duration-300 cursor-pointer flex flex-col items-center justify-between text-center relative ${
                        isSelected 
                          ? 'bg-white border-emerald-500 shadow-[0_20px_40px_rgba(16,185,129,0.1)] ring-2 ring-emerald-500/20' 
                          : 'bg-white border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:border-emerald-500/30 hover:shadow-[0_20px_45px_rgba(16,185,129,0.05)]'
                      }`}
                    >
                      {/* Subtle Badge if Selected */}
                      {isSelected && (
                        <span className="absolute top-4 right-4 bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <Check size={10} strokeWidth={3} /> Sélectionné
                        </span>
                      )}
                      
                      {/* Empty profile avatar placeholder with animation */}
                      <div className="flex flex-col items-center mt-4">
                        <div className={`w-24 h-24 rounded-[1.8rem] flex items-center justify-center border mb-4 relative overflow-hidden transition-all duration-300 ${
                          isSelected 
                            ? 'bg-emerald-500/10 border-emerald-200 text-emerald-500 shadow-inner' 
                            : 'bg-gray-50 border-gray-100 text-gray-400 group-hover:bg-emerald-50/50 group-hover:text-emerald-500'
                        }`}>
                          <User size={44} strokeWidth={1.5} className="relative z-10" />
                          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                        
                        <h4 className="text-xl font-black text-gray-900 tracking-tight">{doc.nom}</h4>
                        <p className="text-sm font-bold text-emerald-500 uppercase tracking-wide mt-1.5 bg-emerald-50 px-3 py-1 rounded-full">{doc.specialite || 'Médecin Référent'}</p>
                        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5 justify-center font-medium"><MapPin size={12} className="text-emerald-400" /> Antananarivo, Madagascar</p>
                      </div>

                      <div className="w-full mt-8">
                        <button
                          type="button"
                          className={`w-full py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${
                            isSelected 
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                              : 'bg-gray-50 text-gray-700 hover:bg-emerald-500 hover:text-white hover:shadow-md hover:shadow-emerald-500/25 border border-gray-100 hover:border-emerald-500'
                          }`}
                        >
                          {isSelected ? "Prêt à s'inscrire" : "Choisir ce médecin"}
                          <ArrowRight size={13} className={isSelected ? "translate-x-0.5" : ""} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: STATISTIQUES */}
      <section id="statistiques" className="py-20 bg-gradient-to-b from-gray-50 to-white relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-emerald-500 font-bold uppercase tracking-widest text-sm">Chiffres Clés</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mt-3">
              Apteka en quelques chiffres
            </h2>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <StatCounter value="114" label="Pharmacies Partenaires" />
            <StatCounter value="100" label="Médicaments enregistrés" />
            <StatCounter value="24" label="Disponibilité Totale" suffix="/7" />
            <StatCounter value="98" label="Satisfaction Patient" suffix="%" />
          </div>
        </div>
      </section>

      {/* SECTION 4: POURQUOI APTEKA */}
      <section id="pourquoi-apteka" className="py-24 sm:py-32 bg-white relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-emerald-500 font-bold uppercase tracking-widest text-sm">Pourquoi Nous Choisir</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mt-3">
              Une plateforme robuste, fiable et certifiée
            </h2>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {/* Card 1 */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:bg-emerald-50/40 hover:border-emerald-100 transition-all duration-300 flex flex-col gap-4 text-left"
            >
              <div className="text-emerald-500 p-3.5 bg-emerald-50 rounded-2xl w-fit"><Shield size={24}/></div>
              <h4 className="text-xl font-extrabold text-gray-900 tracking-tight mt-2">Données Sécurisées</h4>
              <p className="text-gray-500 font-semibold text-sm leading-relaxed">
                Toutes les informations médicales et d'ordonnance sont strictement cryptées et hébergées selon les normes de confidentialité.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:bg-emerald-50/40 hover:border-emerald-100 transition-all duration-300 flex flex-col gap-4 text-left"
            >
              <div className="text-emerald-500 p-3.5 bg-emerald-50 rounded-2xl w-fit"><Activity size={24}/></div>
              <h4 className="text-xl font-extrabold text-gray-900 tracking-tight mt-2">Stock en Temps Réel</h4>
              <p className="text-gray-500 font-semibold text-sm leading-relaxed">
                Finis les déplacements inutiles. Nous offrons une visibilité en direct sur les inventaires des pharmacies de la capitale.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:bg-emerald-50/40 hover:border-emerald-100 transition-all duration-300 flex flex-col gap-4 text-left"
            >
              <div className="text-emerald-500 p-3.5 bg-emerald-50 rounded-2xl w-fit"><FileCheck2 size={24}/></div>
              <h4 className="text-xl font-extrabold text-gray-900 tracking-tight mt-2">Ordonnances Certifiées</h4>
              <p className="text-gray-500 font-semibold text-sm leading-relaxed">
                Un système de signature électronique et de QR code infalsifiable pour authentifier l'ordonnance chez le pharmacien.
              </p>
            </motion.div>

            {/* Card 4 */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:bg-emerald-50/40 hover:border-emerald-100 transition-all duration-300 flex flex-col gap-4 text-left"
            >
              <div className="text-emerald-500 p-3.5 bg-emerald-50 rounded-2xl w-fit"><Clock size={24}/></div>
              <h4 className="text-xl font-extrabold text-gray-900 tracking-tight mt-2">Disponibilité 24/7</h4>
              <p className="text-gray-500 font-semibold text-sm leading-relaxed">
                Trouvez une pharmacie de garde disponible à tout moment pour faire face aux urgences nocturnes sans stress.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 5: APERCU PRODUIT */}
      <section id="apercu-produit" className="py-24 sm:py-32 bg-gray-50/50 border-y border-gray-100 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Text Column */}
            <div className="lg:col-span-5 flex flex-col gap-6 text-left">
              <span className="text-emerald-500 font-bold uppercase tracking-widest text-sm">Aperçu de la Plateforme</span>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                Une interface épurée pensée pour l'urgence.
              </h3>
              <p className="text-gray-500 font-semibold leading-relaxed text-sm sm:text-base">
                Que vous soyez patient recherchant vos traitements, pharmacien gérant vos délivrances ou médecin prescrivant en ligne, Apteka s'adapte à tous vos écrans avec une clarté optimale.
              </p>
              
              <div className="flex flex-col gap-4 font-bold text-gray-700 text-sm sm:text-base mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <Check size={14}/>
                  </div>
                  <span>Recherche instantanée de stocks</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <Check size={14}/>
                  </div>
                  <span>Cartographie dynamique et calcul d'itinéraires</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <Check size={14}/>
                  </div>
                  <span>Ordonnance dématérialisée et QR Code infalsifiable</span>
                </div>
              </div>
            </div>

            {/* Mockups Column */}
            <div className="lg:col-span-7 grid sm:grid-cols-12 gap-8 relative items-center">
              {/* Radial Blur Backdrops */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-400/10 blur-[120px] rounded-full pointer-events-none" />

              {/* Desktop Mockup (Left 7 Cols) */}
              <div className="sm:col-span-7 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                {/* Browser bar */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 block" />
                  </div>
                  <div className="bg-white px-3 py-1 rounded border border-gray-100 text-[9px] text-gray-400 font-mono flex-grow max-w-xs mx-auto text-center truncate">
                    app.apteka.mg/patient/recherche
                  </div>
                </div>
                {/* Browser area */}
                <div className="p-4 bg-gray-50/20 flex flex-col gap-4 text-left">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] font-bold">A</div>
                      <span className="text-[11px] font-bold text-gray-800">Apteka Dashboard</span>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">Patient Connecté</span>
                  </div>
                  
                  {/* Search simulation */}
                  <div className="flex flex-col gap-1.5">
                    <div className="text-[10px] font-bold text-gray-600">Rechercher un traitement :</div>
                    <div className="flex gap-2">
                      <div className="flex-grow bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs flex items-center gap-2 text-gray-800 font-semibold shadow-sm">
                        <Pill size={14} className="text-emerald-500" />
                        <span>Amoxicilline 500 mg</span>
                      </div>
                      <button className="bg-emerald-500 text-white rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-default">Trouver</button>
                    </div>
                  </div>

                  {/* Results simulation */}
                  <div className="flex flex-col gap-1.5 mt-1">
                    <div className="text-[9px] uppercase font-bold tracking-wider text-gray-400">Pharmacies à proximité :</div>
                    <div className="flex flex-col gap-1.5">
                      <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-gray-800">Pharmacie Analakely</span>
                          <span className="text-[8px] text-gray-400">Analakely, Tana</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">En Stock</span>
                          <span className="text-[8px] text-gray-400 font-medium">1.2 km • 2.10 €</span>
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-gray-800">Pharmacie Isoraka</span>
                          <span className="text-[8px] text-gray-400">Isoraka, Tana</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">En Stock</span>
                          <span className="text-[8px] text-gray-400 font-medium">0.8 km • 1.95 €</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Mockup (Right 5 Cols) */}
              <div className="sm:col-span-5 bg-gray-900 p-2.5 rounded-[2.2rem] shadow-2xl border-4 border-gray-800 overflow-hidden max-w-[240px] mx-auto hover:shadow-emerald-500/10 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                {/* Screen frame */}
                <div className="bg-white rounded-[1.8rem] overflow-hidden text-left flex flex-col min-h-[340px]">
                  {/* Status Bar */}
                  <div className="bg-gray-50 px-4 pt-2.5 pb-1 flex justify-between items-center text-[7px] text-gray-500 font-bold">
                    <span>09:41</span>
                    <div className="flex gap-1">
                      <span>5G</span>
                      <span>100%</span>
                    </div>
                  </div>
                  
                  {/* Prescription */}
                  <div className="p-3.5 flex flex-col gap-3 flex-grow bg-gradient-to-b from-gray-50 to-white">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black uppercase tracking-wider text-emerald-500">APTEKA SÛRETÉ</span>
                      <span className="text-[7px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Certifié</span>
                    </div>

                    <div className="border-b border-gray-100 pb-2 flex flex-col">
                      <h4 className="text-[9px] font-black text-gray-900 uppercase">Ordonnance Électronique</h4>
                      <div className="text-[8px] text-gray-500 mt-0.5">Patient: Toky Randria</div>
                      <div className="text-[8px] text-gray-500">Docteur: Dr. Jean Razafy</div>
                    </div>

                    {/* QR Code Container */}
                    <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-xl flex flex-col items-center gap-1">
                      <div className="w-16 h-16 bg-white p-1 rounded-lg border border-gray-100 flex items-center justify-center">
                        <div className="grid grid-cols-6 grid-rows-6 gap-0.5 w-full h-full">
                          {Array.from({ length: 36 }).map((_, i) => (
                            <div
                              key={i}
                              className={`rounded-xs ${
                                (i % 5 === 0 || i % 7 === 1 || i < 6 || i % 6 === 0 || i > 30 || (i > 12 && i < 18)) && i !== 14 && i !== 22
                                  ? 'bg-gray-900'
                                  : 'bg-transparent'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="font-mono text-[7px] font-bold text-gray-500">ORD-8392-TANA</span>
                    </div>

                    {/* Medicines info */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[7px] font-bold text-gray-400 uppercase tracking-wider">Traitements</span>
                      <div className="flex flex-col gap-0.5 text-[8px] text-gray-800 font-bold">
                        <div>• Amoxicilline 500mg</div>
                        <div className="text-[7px] text-gray-400 pl-2 font-medium">1 gél. matin/soir • 7j</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 6: TEMOIGNAGES */}
      <section id="temoignages" className="py-24 sm:py-32 bg-white relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-emerald-500 font-bold uppercase tracking-widest text-sm">Avis d'utilisateurs</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mt-3">
              Ils font confiance à Apteka
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <div 
                key={idx} 
                className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-xl hover:shadow-gray-200/40 hover:bg-white transition-all duration-300 flex flex-col gap-5 text-left"
              >
                <div className="flex gap-1 text-amber-400">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={18} fill="currentColor" />
                  ))}
                </div>
                <p className="text-gray-600 font-medium leading-relaxed italic text-sm sm:text-base flex-grow">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-base tracking-wider shadow-sm">
                    {t.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-gray-900 text-sm sm:text-base">{t.name}</span>
                    <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mt-0.5">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: PHARMACIES PARTENAIRES MARQUEE */}
      <section className="bg-white relative z-20">
        <div className="text-center mb-6">
          <span className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">Notre réseau de confiance</span>
        </div>
        <InfiniteMarquee />
      </section>

      {/* SECTION 8: FAQ ACCORDION */}
      <section id="faq" className="py-24 sm:py-32 bg-white relative z-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-emerald-500 font-bold uppercase tracking-widest text-sm">Une question ?</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mt-3">
              Questions Fréquentes
            </h2>
          </div>

          <div className="bg-gray-50/50 rounded-[2.5rem] border border-gray-100/80 p-6 sm:p-12 shadow-sm">
            <FAQItem 
              question="Comment fonctionne la réservation ?" 
              answer="Lorsque votre médecin agréé rédige une prescription sur Apteka, un QR code unique vous est assigné. Vous pouvez alors chercher les médicaments prescrits, visualiser en temps réel les pharmacies disposant du stock sur la carte interactive, et vous y rendre. Le pharmacien n'aura qu'à scanner votre QR code pour valider la prescription et déduire automatiquement le stock." 
              isOpen={openFaq === 0}
              onToggle={() => setOpenFaq(openFaq === 0 ? null : 0)}
            />
            <FAQItem 
              question="Mes données sont-elles protégées ?" 
              answer="Absolument. Apteka respecte les normes de confidentialité médicale les plus strictes. Vos ordonnances et données de santé sont cryptées et uniquement accessibles par vous-même, votre médecin traitant et le pharmacien lors de la délivrance chez une officine partenaire." 
              isOpen={openFaq === 1}
              onToggle={() => setOpenFaq(openFaq === 1 ? null : 1)}
            />
            <FAQItem 
              question="Puis-je renouveler une ordonnance ?" 
              answer="Oui. Si votre ordonnance requiert un renouvellement, vous pouvez faire une demande directement depuis votre tableau de bord patient. Votre médecin référent recevra la demande et pourra la valider, générant ainsi automatiquement une nouvelle ordonnance active liée à la précédente." 
              isOpen={openFaq === 2}
              onToggle={() => setOpenFaq(openFaq === 2 ? null : 2)}
            />
            <FAQItem 
              question="Puis-je changer de pharmacie ?" 
              answer="Tout à fait. Vous êtes totalement libre de vous rendre dans n'importe quelle pharmacie affichée sur la carte d'Antananarivo dès lors qu'elle dispose du stock nécessaire pour vos traitements." 
              isOpen={openFaq === 3}
              onToggle={() => setOpenFaq(openFaq === 3 ? null : 3)}
            />
            <FAQItem 
              question="Comment contacter un médecin ?" 
              answer="Lors de votre inscription ou à tout moment depuis votre compte patient, vous pouvez choisir votre médecin traitant référent parmi nos professionnels partenaires d'Apteka. Vous pourrez alors lui envoyer des messages via notre messagerie sécurisée intégrée et prendre rendez-vous." 
              isOpen={openFaq === 4}
              onToggle={() => setOpenFaq(openFaq === 4 ? null : 4)}
            />
            <FAQItem 
              question="L'application est-elle gratuite ?" 
              answer="Oui, l'accès à l'application Apteka, la recherche de stocks de médicaments et l'obtention de votre ordonnance numérique sont totalement gratuits pour tous les patients d'Antananarivo. Les prix des médicaments sont identiques à ceux fixés officiellement en officine." 
              isOpen={openFaq === 5}
              onToggle={() => setOpenFaq(openFaq === 5 ? null : 5)}
            />
          </div>
        </div>
      </section>

      {/* SECTION 9: CONNEXION & MEDECINS VITRINE */}
      <section ref={authSectionRef} className="py-24 sm:py-32 bg-gray-950 text-white relative z-20 border-t border-gray-900 overflow-hidden">
        {/* Abstract Backdrop Glow */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-16 items-start">
            
            {/* Left Column: Portal Information & Demo Accounts */}
            <div className="lg:col-span-5 flex flex-col gap-8 text-left">
              <div className="flex flex-col gap-4">
                <span className="text-emerald-400 font-bold uppercase tracking-widest text-xs">Accès Sécurisé</span>
                <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  Rejoignez le Portail Apteka
                </h3>
                <p className="text-gray-400 font-medium leading-relaxed text-sm sm:text-base">
                  Connectez-vous pour accéder à vos ordonnances cryptées, à la recherche de stocks de médicaments en temps réel et à la messagerie de santé intégrée. Que vous soyez patient, médecin ou pharmacien d'officine, gérez votre parcours de santé de manière moderne et transparente.
                </p>
              </div>

              {/* Quick Demo Help Panel */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowDemoAccounts(!showDemoAccounts)}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><Sparkles size={18}/></div>
                    <span className="text-sm font-extrabold text-white">Comptes de test pour démo rapide</span>
                  </div>
                  <ChevronDown size={18} className={`text-gray-400 transition-transform ${showDemoAccounts ? 'rotate-180' : ''}`} />
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10 text-xs font-mono text-gray-300">
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col gap-0.5">
                          <span className="font-bold text-emerald-400">👤 Patient</span>
                          <span>Email: patient@example.com</span>
                          <span>Code: password123</span>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col gap-0.5">
                          <span className="font-bold text-emerald-400">🩺 Médecin</span>
                          <span>Email: dr.razafy@pharma.mg</span>
                          <span>Code: password123</span>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col gap-0.5">
                          <span className="font-bold text-emerald-400">💊 Pharmacien</span>
                          <span>Email: pharmacien.analakely@pharma.mg</span>
                          <span>Code: password123</span>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col gap-0.5">
                          <span className="font-bold text-emerald-400">🛡️ Admin</span>
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
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-white/5 border border-white/10 p-2 rounded-[2.5rem] shadow-2xl backdrop-blur-xl hover:border-emerald-500/20 transition-colors"
              >
                <div className="bg-gray-900 rounded-[2.3rem] p-6 sm:p-10">
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

      {/* SECTION 10: FOOTER */}
      <footer className="bg-gray-50 border-t border-gray-100 py-16 text-left relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            
            {/* Column 1: Brand Info */}
            <div className="flex flex-col gap-4">
              <Logo variant="light" size="sm" />
              <p className="text-gray-500 font-semibold text-xs sm:text-sm leading-relaxed mt-2">
                Apteka connecte les acteurs de la santé d'Antananarivo pour fluidifier la prescription, sécuriser les ordonnances et centraliser les stocks officiels.
              </p>
              <span className="text-[11px] font-bold text-gray-400 mt-2">
                © {new Date().getFullYear()} Apteka. Tous droits réservés.
              </span>
            </div>

            {/* Column 2: Navigation Links */}
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Navigation</h4>
              <ul className="flex flex-col gap-2.5 text-xs sm:text-sm font-semibold text-gray-500">
                <li><button onClick={() => featuresSectionRef.current?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-emerald-500 transition-colors">Comment ça marche</button></li>
                <li><a href="#statistiques" className="hover:text-emerald-500 transition-colors">Statistiques de santé</a></li>
                <li><a href="#pourquoi-apteka" className="hover:text-emerald-500 transition-colors">Pourquoi Apteka ?</a></li>
                <li><a href="#apercu-produit" className="hover:text-emerald-500 transition-colors">Aperçu interactif</a></li>
              </ul>
            </div>

            {/* Column 3: Legal & FAQ */}
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Informations</h4>
              <ul className="flex flex-col gap-2.5 text-xs sm:text-sm font-semibold text-gray-500">
                <li><a href="#faq" className="hover:text-emerald-500 transition-colors">FAQ complète</a></li>
                <li><a href="#legal" className="hover:text-emerald-500 transition-colors">Mentions Légales</a></li>
                <li><a href="#privacy" className="hover:text-emerald-500 transition-colors">Politique de Confidentialité</a></li>
                <li><a href="#contact" className="hover:text-emerald-500 transition-colors">Contact Support</a></li>
              </ul>
            </div>

            {/* Column 4: Contact & Socials */}
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Contact & Réseaux</h4>
              <div className="flex flex-col gap-2 text-xs sm:text-sm font-semibold text-gray-500">
                <span className="flex items-center gap-2"><Mail size={14} className="text-emerald-500" /> contact@apteka.mg</span>
                <span className="flex items-center gap-2"><Phone size={14} className="text-emerald-500" /> +261 34 11 234 56</span>
              </div>
              <div className="flex items-center gap-3.5 mt-2">
                {/* Social icons mockup since we use standard links */}
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-gray-100 hover:bg-emerald-500 hover:text-white text-gray-500 transition-all shadow-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/></svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-gray-100 hover:bg-emerald-500 hover:text-white text-gray-500 transition-all shadow-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-gray-100 hover:bg-emerald-500 hover:text-white text-gray-500 transition-all shadow-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-gray-100 hover:bg-emerald-500 hover:text-white text-gray-500 transition-all shadow-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 3.513 1.305 4.372.997.107-.775.518-1.305.962-1.602-2.665-.305-5.467-1.334-5.467-5.93 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
              </div>
            </div>

          </div>
        </div>
      </footer>

    </div>
  );
}
