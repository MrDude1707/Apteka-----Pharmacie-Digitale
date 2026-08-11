import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const TESTIMONIALS = [
  { initials: "AM", name: "Alain Michel", role: "Patient (Analakely)", text: "Apteka a totalement changé ma façon d'acheter mes traitements. Plus besoin de faire le tour des pharmacies de la ville, je sais exactement qui a le stock en temps réel.", rating: 5 },
  { initials: "JR", name: "Dr. Jean Razafy", role: "Médecin Référent", text: "La prescription électronique simplifie mon quotidien et sécurise la transmission. Mes patients sont rassurés et beaucoup mieux pris en charge.", rating: 5 },
  { initials: "TK", name: "Tojo Koloina", role: "Pharmacien (Pharmacie de Tana)", text: "Grâce à la déduction instantanée de stock via QR code, nous avons éliminé les erreurs de délivrance et optimisé notre logistique au quotidien.", rating: 5 },
  { initials: "HL", name: "Hariniaina Lalaina", role: "Patiente (Isoraka)", text: "Le calcul d'itinéraire vers la pharmacie la plus proche est d'une utilité incroyable, surtout en situation d'urgence ou pour les gardes de nuit.", rating: 5 },
  { initials: "SR", name: "Dr. Sandra Raman", role: "Pédiatre (Ambohibao)", text: "Un outil indispensable pour le système de santé de notre capitale. La visibilité immédiate sur les stocks évite aux familles des déplacements fatiguants.", rating: 5 },
  { initials: "MV", name: "Mina Vololona", role: "Patiente (Ankorondrano)", text: "La demande de renouvellement en un clic depuis mon espace est extrêmement simple. Une interface superbe, digne des plus grands outils modernes.", rating: 5 }
];

export default function TestimonialsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  const next = () => {
    setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const prev = () => {
    setActiveIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  useGSAP(() => {
    gsap.fromTo('.testimonial-header', 
      { opacity: 0, y: 30 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.8,
        scrollTrigger: {
          trigger: '.testimonial-header',
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  }, { scope: containerRef });

  return (
    <section ref={containerRef} id="testimonials" className="py-24 px-6 sm:px-12 md:px-16 overflow-hidden bg-gradient-to-br from-white via-sky-50/10 to-teal-50/20">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="testimonial-header text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest bg-teal-50 px-4 py-1.5 rounded-full">Témoignages</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mt-4 mb-4">
            Ils font confiance à <span className="bg-gradient-to-r from-teal-600 to-sky-600 bg-clip-text text-transparent">Apteka</span>
          </h2>
          <p className="text-base text-slate-500 font-semibold leading-relaxed">
            Découvrez les retours d'expérience des patients, médecins et pharmaciens d'Antananarivo qui utilisent notre plateforme au quotidien.
          </p>
        </div>

        {/* Carousel Content */}
        <div className="relative max-w-4xl mx-auto">
          
          <div className="absolute top-0 left-0 text-teal-500/10 -translate-x-6 -translate-y-6 pointer-events-none hidden md:block">
            <Quote size={120} style={{ transform: 'scaleX(-1)' }} />
          </div>

          <div className="min-h-[300px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="w-full bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-8 md:p-12 shadow-xl shadow-sky-100/25 relative z-10"
              >
                {/* Rating stars */}
                <div className="flex items-center gap-1 text-amber-400 mb-6">
                  {[...Array(TESTIMONIALS[activeIndex].rating)].map((_, i) => (
                    <Star key={i} size={18} fill="currentColor" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-lg md:text-xl font-medium text-slate-800 leading-relaxed italic mb-8">
                  "{TESTIMONIALS[activeIndex].text}"
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-teal-500/20">
                    {TESTIMONIALS[activeIndex].initials}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">
                      {TESTIMONIALS[activeIndex].name}
                    </h4>
                    <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                      {TESTIMONIALS[activeIndex].role}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mt-10">
            <button
              onClick={prev}
              className="p-4 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 text-slate-700 hover:text-teal-600 transition-all cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center gap-2">
              {TESTIMONIALS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${activeIndex === idx ? 'w-8 bg-teal-500' : 'w-2.5 bg-slate-200 hover:bg-slate-300'}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="p-4 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 text-slate-700 hover:text-teal-600 transition-all cursor-pointer"
            >
              <ChevronRight size={20} />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}
