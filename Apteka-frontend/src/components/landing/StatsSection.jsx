import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';

function Counter({ from, to, duration = 2 }) {
  const nodeRef = useRef(null);
  const inView = useInView(nodeRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (inView) {
      const controls = animate(from, to, {
        duration,
        ease: "easeOut",
        onUpdate(value) {
          if (nodeRef.current) {
            // Affichage avec un séparateur d'espace pour les milliers
            nodeRef.current.textContent = Math.round(value).toLocaleString('fr-FR');
          }
        }
      });
      return () => controls.stop();
    }
  }, [from, to, inView, duration]);

  return <span ref={nodeRef}>{from}</span>;
}

export default function StatsSection() {
  const stats = [
    { label: "Ordonnances Sécurisées", value: 12500, suffix: "+", color: "text-teal-400" },
    { label: "Pharmacies Connectées", value: 85, suffix: "", color: "text-cyan-400" },
    { label: "Temps Gagné (heures)", value: 4200, suffix: "h", color: "text-indigo-400" }
  ];

  return (
    <section className="relative py-24 bg-[#050505] border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6 sm:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
          
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
              whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: i * 0.2 }}
              className="flex flex-col items-center justify-center py-8 md:py-0"
            >
              <div className={`text-5xl sm:text-6xl font-black ${stat.color} drop-shadow-md tracking-tighter`}>
                <Counter from={0} to={stat.value} duration={2.5} />
                <span>{stat.suffix}</span>
              </div>
              <p className="text-zinc-500 font-medium mt-4 uppercase tracking-widest text-xs">
                {stat.label}
              </p>
            </motion.div>
          ))}

        </div>
      </div>
    </section>
  );
}
