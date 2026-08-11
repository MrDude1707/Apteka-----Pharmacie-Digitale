import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const StatCounter = ({ value, label, suffix = "" }) => {
  const [displayVal, setDisplayVal] = useState(0);
  const containerRef = useRef(null);

  useGSAP(() => {
    const targetVal = parseInt(value, 10);
    if (isNaN(targetVal)) {
      setDisplayVal(value);
      return;
    }

    const obj = { val: 0 };
    gsap.to(obj, {
      val: targetVal,
      duration: 1.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
      onUpdate: () => {
        setDisplayVal(Math.round(obj.val));
      }
    });
  }, { scope: containerRef });

  return (
    <div 
      ref={containerRef} 
      className="flex flex-col items-center justify-center p-8 bg-white/50 backdrop-blur-xl border border-slate-200/50 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-teal-100/20 hover:scale-[1.02] hover:border-slate-300 transition-all duration-300"
    >
      <span className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-teal-500 to-sky-600 bg-clip-text text-transparent tracking-tight">
        {displayVal}{suffix}
      </span>
      <span className="text-xs font-bold text-slate-500 mt-3 text-center uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
};

export default function StatsSection() {
  const containerRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo('.stats-container',
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: '.stats-container',
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  }, { scope: containerRef });

  return (
    <section ref={containerRef} id="statistiques" className="py-20 px-6 sm:px-12 md:px-16 bg-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.05),transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.05),transparent_40%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto stats-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <StatCounter value={12} suffix="+" label="Pharmacies Partenaires" />
          <StatCounter value={1500} suffix="+" label="Traitements en Direct" />
          <StatCounter value={99.8} suffix="%" label="Taux d'Authentification" />
          <StatCounter value={24} suffix="/7" label="Disponibilité d'Urgence" />
        </div>
      </div>
    </section>
  );
}
