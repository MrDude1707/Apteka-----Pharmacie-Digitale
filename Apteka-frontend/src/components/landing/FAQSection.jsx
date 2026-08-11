import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const FAQS = [
  {
    question: "Comment fonctionne la recherche de médicaments ?",
    answer: "Lorsque votre médecin agréé rédige une prescription sur Apteka, un QR code unique vous est assigné. Vous pouvez alors chercher les médicaments prescrits, visualiser en temps réel les pharmacies disposant du stock sur la carte interactive, et vous y rendre. Le pharmacien n'aura qu'à scanner votre QR code pour valider la prescription et déduire automatiquement le stock."
  },
  {
    question: "Mes données de santé sont-elles protégées ?",
    answer: "Absolument. Apteka respecte les normes de confidentialité médicale les plus strictes. Vos ordonnances et données de santé sont cryptées et uniquement accessibles par vous-même, votre médecin traitant et le pharmacien lors de la délivrance chez une officine partenaire."
  },
  {
    question: "Puis-je renouveler une ordonnance ?",
    answer: "Oui. Si votre ordonnance requiert un renouvellement, vous pouvez faire une demande directement depuis votre tableau de bord patient. Votre médecin référent recevra la demande et pourra la valider, générant ainsi automatiquement une nouvelle ordonnance active liée à la précédente."
  },
  {
    question: "Suis-je obligé de me rendre dans une pharmacie spécifique ?",
    answer: "Tout à fait libre. Vous êtes totalement libre de vous rendre dans n'importe quelle pharmacie affichée sur la carte d'Antananarivo dès lors qu'elle dispose du stock nécessaire pour vos traitements."
  },
  {
    question: "L'application Apteka est-elle gratuite pour les patients ?",
    answer: "Oui, l'accès à l'application Apteka, la recherche de stocks de médicaments et l'obtention de votre ordonnance numérique sont totalement gratuits pour tous les patients d'Antananarivo. Les prix des médicaments sont identiques à ceux fixés officiellement en officine."
  }
];

function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border-b border-slate-200/80 py-5">
      <button
        onClick={onToggle}
        className="flex justify-between items-center w-full text-left font-bold text-slate-850 text-lg hover:text-teal-600 transition-colors py-2 focus:outline-none cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="pr-4">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-teal-500 flex-shrink-0"
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
            <p className="text-slate-500 font-semibold leading-relaxed mt-3 pr-8 text-[15px]">
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
    <section ref={containerRef} id="faq" className="py-24 px-6 sm:px-12 md:px-16 bg-slate-50/50 overflow-hidden relative">
      <div className="absolute top-[10%] right-[-10%] w-[35vw] h-[35vw] bg-teal-100/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[35vw] h-[35vw] bg-sky-100/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="faq-header text-center mb-16">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest bg-teal-50 px-4 py-1.5 rounded-full">FAQ</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mt-4 mb-4">
            Questions <span className="bg-gradient-to-r from-teal-600 to-sky-600 bg-clip-text text-transparent">Fréquentes</span>
          </h2>
          <p className="text-base text-slate-500 font-semibold leading-relaxed max-w-xl mx-auto">
            Trouvez rapidement des réponses aux questions les plus courantes concernant la plateforme d'authentification et de prescription médicale Apteka.
          </p>
        </div>

        {/* FAQ list */}
        <div className="faq-item-list bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-6 sm:p-8 md:p-10 shadow-lg shadow-sky-100/20">
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
