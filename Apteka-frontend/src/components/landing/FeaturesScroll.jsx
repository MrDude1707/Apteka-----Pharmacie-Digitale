import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ClipboardList, Search, ShieldCheck, ArrowRight, Eye } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function FeaturesScroll() {
  const containerRef = useRef(null);

  useGSAP(() => {
    // Fade in section title and subtitle
    gsap.fromTo('.features-header', 
      { opacity: 0, y: 30 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.8,
        scrollTrigger: {
          trigger: '.features-header',
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    );

    // Stagger feature cards sliding in from below with a 3D rotate
    gsap.fromTo('.feature-card',
      { opacity: 0, y: 80, rotateX: -10 },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.9,
        stagger: 0.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.feature-cards-grid',
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      }
    );

    // Subtle continuous parallax on individual graphic blobs
    gsap.to('.parallax-blob-1', {
      y: -50,
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });

    gsap.to('.parallax-blob-2', {
      y: 50,
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
  }, { scope: containerRef });

  const steps = [
    {
      num: "01",
      title: "Consultation & Ordonnance",
      desc: "Le médecin agréé rédige l'ordonnance électroniquement. Un QR Code crypté unique (ORD-XXXX) est généré instantanément dans votre espace sécurisé.",
      icon: <ClipboardList className="w-8 h-8 text-teal-600" />,
      color: "from-teal-500/10 to-teal-500/0",
      accent: "teal"
    },
    {
      num: "02",
      title: "Recherche de Stocks",
      desc: "Recherchez vos médicaments en un clic. Repérez immédiatement sur notre carte interactive les pharmacies les plus proches disposant du stock requis.",
      icon: <Search className="w-8 h-8 text-sky-600" />,
      color: "from-sky-500/10 to-sky-500/0",
      accent: "sky"
    },
    {
      num: "03",
      title: "Délivrance Sécurisée",
      desc: "Présentez votre QR Code chez le pharmacien. L'officine scanne le code pour vérifier l'authenticité de la prescription et déduit automatiquement le stock.",
      icon: <ShieldCheck className="w-8 h-8 text-indigo-600" />,
      color: "from-indigo-500/10 to-indigo-500/0",
      accent: "indigo"
    }
  ];

  return (
    <section ref={containerRef} id="features" className="relative py-24 px-6 sm:px-12 md:px-16 overflow-hidden bg-slate-50/50">
      
      {/* Dynamic parallax background blobs */}
      <div className="absolute top-[20%] left-[-5%] w-[35vw] h-[35vw] bg-teal-100/30 rounded-full blur-[100px] parallax-blob-1 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-5%] w-[40vw] h-[40vw] bg-sky-100/30 rounded-full blur-[120px] parallax-blob-2 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="features-header text-center max-w-2xl mx-auto mb-20">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest bg-teal-50 px-4 py-1.5 rounded-full">Comment ça marche ?</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mt-4 mb-6">
            Un parcours de soins <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-teal-600 to-sky-600 bg-clip-text text-transparent">totalement dématérialisé</span>
          </h2>
          <p className="text-base text-slate-500 font-semibold leading-relaxed">
            Apteka simplifie le parcours de soins en reliant instantanément les patients, les médecins agréés et les officines officielles. Suivez vos stocks en direct et sécurisez vos ordonnances.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="feature-cards-grid grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="feature-card group bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:shadow-sky-100/30 hover:border-slate-300/80 transition-all duration-300 flex flex-col justify-between min-h-[380px] relative overflow-hidden"
              style={{ perspective: 1000 }}
            >
              {/* Dynamic top gradient cover */}
              <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${step.accent === 'teal' ? 'from-teal-500 to-teal-400' : step.accent === 'sky' ? 'from-sky-500 to-sky-400' : 'from-indigo-500 to-indigo-400'}`} />
              
              <div>
                {/* Number & Icon header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="text-4xl font-black text-slate-200/80 group-hover:text-teal-500/20 transition-colors duration-300">
                    {step.num}
                  </div>
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                    {step.icon}
                  </div>
                </div>

                {/* Card Title */}
                <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-4 group-hover:text-teal-600 transition-colors duration-300">
                  {step.title}
                </h3>

                {/* Card Description */}
                <p className="text-sm text-slate-500 leading-relaxed font-semibold">
                  {step.desc}
                </p>
              </div>

              {/* Decorative subtle hover element */}
              <div className="mt-8 flex items-center gap-2 text-xs font-bold text-teal-600 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                En savoir plus
                <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
