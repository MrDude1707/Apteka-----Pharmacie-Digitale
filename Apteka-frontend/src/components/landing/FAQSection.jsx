import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircleQuestion } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FAQS = [
  {
    question: "Comment Apteka garantit-il l'authenticité d'une ordonnance ?",
    answer: "Chaque prescription fait l'objet d'une signature cryptographique liée au numéro d'enregistrement du médecin agréé au tableau de l'Ordre National de Madagascar. Le QR code généré ne contient pas vos molécules en clair, mais une clé d'accès sécurisée déchiffrable uniquement par le lecteur d'officines partenaires agréées."
  },
  {
    question: "Comment l'état des stocks d'officines est-il mis à jour ?",
    answer: "Les pharmacies partenaires synchronisent de manière sécurisée leur logiciel de gestion d'inventaire avec la plateforme Apteka. Les données de disponibilité visibles sur la carte d'Antananarivo proviennent directement de ces flux synchronisés, éliminant tout déplacement inutile."
  },
  {
    question: "Comment est gérée la confidentialité de mon dossier médical ?",
    answer: "Les serveurs d'Apteka encryptent les données de santé à l'aide de clés symétriques AES-256. Aucune information médicale n'est stockée en clair ou vendue à des tiers. Seuls le médecin prescripteur certifié et le pharmacien d'officine au moment de la délivrance physique ont l'autorisation de déchiffrer votre prescription."
  },
  {
    question: "Que se passe-t-il si un médicament est en rupture de stock ?",
    answer: "L'application localise immédiatement les officines de la capitale disposant encore du stock physique requis. En cas de rupture globale de la molécule d'origine, le pharmacien peut suggérer et valider une alternative générique équivalente autorisée par la nomenclature officielle de la Direction de la Pharmacie (DPLM) de Madagascar."
  },
  {
    question: "Quel est le cadre réglementaire d'Apteka à Madagascar ?",
    answer: "Apteka opère en stricte conformité avec le code de déontologie médicale et pharmaceutique de Madagascar. Les tarifs des médicaments délivrés sont identiques aux prix officiellement réglementés en officine nationale. L'utilisation du portail patient et la consultation des stocks sont gratuites et financées par la modernisation du réseau officinal."
  }
];

function FAQItem({ question, answer, isOpen, onToggle, index }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`mb-4 rounded-2xl border transition-all duration-300 overflow-hidden ${
        isOpen 
          ? 'bg-zinc-900/80 border-teal-500/30 shadow-[0_0_30px_rgba(20,184,166,0.1)]' 
          : 'bg-zinc-900/30 border-zinc-800/60 hover:bg-zinc-900/50 hover:border-zinc-700/80'
      }`}
    >
      <button
        onClick={onToggle}
        className="flex justify-between items-center w-full text-left p-6 sm:p-8 focus:outline-none cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className={`font-bold text-lg sm:text-xl transition-colors duration-300 pr-4 ${isOpen ? 'text-teal-400' : 'text-zinc-100'}`}>
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className={`flex-shrink-0 p-2.5 rounded-full transition-colors duration-300 ${
            isOpen ? 'bg-teal-500/20 text-teal-400' : 'bg-zinc-800/50 text-zinc-400'
          }`}
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0">
              <div className="w-full h-px bg-gradient-to-r from-teal-500/20 to-transparent mb-5"></div>
              <p className="text-zinc-400 font-medium leading-relaxed text-[15px] sm:text-base">
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0); // Premier élément ouvert par défaut
  const containerRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo('.faq-left-col', 
      { opacity: 0, x: -40 },
      { 
        opacity: 1, 
        x: 0, 
        duration: 0.8,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 75%',
        }
      }
    );
  }, { scope: containerRef });

  return (
    <section ref={containerRef} id="faq" className="py-24 sm:py-32 px-6 sm:px-12 md:px-16 bg-mhp-dark relative overflow-hidden border-t border-zinc-900/60">
      {/* Background glow effects */}
      <div className="absolute top-[20%] left-[-10%] w-[40vw] h-[40vw] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          
          {/* Left Column: Sticky Header */}
          <div className="faq-left-col lg:col-span-5 lg:sticky lg:top-32">
            <div className="inline-flex items-center justify-center p-3.5 bg-teal-500/10 rounded-2xl border border-teal-500/20 mb-8 shadow-[0_0_30px_rgba(20,184,166,0.15)]">
              <MessageCircleQuestion className="text-teal-400" size={32} />
            </div>
            
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-6 leading-[1.1]">
              Des questions ? <br/>
              <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Nous avons les réponses.</span>
            </h2>
            
            <p className="text-lg text-zinc-400 font-medium leading-relaxed mb-10 max-w-md">
              Découvrez comment la plateforme Apteka sécurise vos prescriptions et modernise l'accès aux médicaments à Madagascar.
            </p>

            <div className="hidden lg:flex flex-col space-y-4 p-8 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <h3 className="text-white font-bold text-xl relative z-10">Vous ne trouvez pas votre réponse ?</h3>
              <p className="text-zinc-400 text-sm leading-relaxed relative z-10">Notre équipe de support est disponible pour les professionnels de santé et les patients.</p>
              <button className="mt-4 bg-white text-zinc-950 font-bold py-3.5 px-8 rounded-full hover:bg-teal-50 hover:scale-105 transition-all duration-300 w-fit text-sm relative z-10 shadow-lg">
                Contacter le support
              </button>
            </div>
          </div>

          {/* Right Column: FAQ Items */}
          <div className="lg:col-span-7 pt-4 lg:pt-0">
            <div className="space-y-4">
              {FAQS.map((faq, index) => (
                <FAQItem
                  key={index}
                  index={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openIndex === index}
                  onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}