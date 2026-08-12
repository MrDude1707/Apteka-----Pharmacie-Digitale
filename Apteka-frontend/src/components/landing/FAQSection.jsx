import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

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

function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border-b border-zinc-800/60 py-5 last:border-0">
      <button
        onClick={onToggle}
        className="flex justify-between items-center w-full text-left font-bold text-zinc-100 text-lg hover:text-teal-400 transition-colors py-2 focus:outline-none cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="pr-4">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-teal-400 flex-shrink-0"
        >
          <ChevronDown size={22} />
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
            <p className="text-zinc-400 font-medium leading-relaxed mt-3 pr-8 text-[15px]">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);
  const containerRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo('.faq-header', 
      { opacity: 0, y: 30 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.8,
        scrollTrigger: {
          trigger: '.faq-header',
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    );

    gsap.fromTo('.faq-item-list', 
      { opacity: 0, y: 40 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.8,
        scrollTrigger: {
          trigger: '.faq-item-list',
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  }, { scope: containerRef });

  return (
    <section ref={containerRef} id="faq" className="py-32 px-6 sm:px-12 md:px-16 bg-mhp-dark overflow-hidden relative border-t border-zinc-900/60">
      <div className="absolute top-[10%] right-[-10%] w-[35vw] h-[35vw] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[35vw] h-[35vw] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="faq-header text-center mb-20">
          <span className="text-xs font-bold text-teal-400 uppercase tracking-widest bg-teal-950/40 border border-teal-800/40 px-4 py-1.5 rounded-full">FAQ</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mt-6 mb-6">
            Questions <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Fréquentes</span>
          </h2>
          <p className="text-base text-zinc-400 font-semibold leading-relaxed max-w-xl mx-auto">
            Trouvez rapidement des réponses aux questions les plus courantes concernant la plateforme d'authentification et de prescription médicale Apteka.
          </p>
        </div>

        {/* FAQ list */}
        <div className="faq-item-list bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl">
          {FAQS.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>

      </div>
    </section>
  );
}