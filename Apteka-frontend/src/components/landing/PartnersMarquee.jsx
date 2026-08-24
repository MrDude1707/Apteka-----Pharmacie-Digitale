import React from 'react';
import { motion } from 'framer-motion';

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

export default function PartnersMarquee() {
  // On duplique le tableau 2 fois pour assurer une boucle parfaite sans coupure visible
  const duplicatedPartners = [...PARTNERS, ...PARTNERS, ...PARTNERS];

  return (
    <section className="relative py-20 bg-[#050505] overflow-hidden">
      
      <div className="text-center mb-10">
        <h3 className="text-zinc-500 text-xs font-bold tracking-widest uppercase">Ils nous font confiance</h3>
      </div>

      {/* Le conteneur du Marquee */}
      <div className="w-full overflow-hidden whitespace-nowrap relative flex">
        
        {/* Masques dégradés (Fade edges) pour cacher l'entrée et la sortie du texte */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex gap-6 items-center"
          animate={{
            x: ["0%", "-33.333%"] // On ne décale que d'un tiers puisque le tableau est triplé
          }}
          transition={{
            ease: "linear",
            duration: 25,
            repeat: Infinity
          }}
        >
          {duplicatedPartners.map((partner, index) => (
            <div
              key={index}
              className="inline-flex items-center justify-center px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 hover:border-teal-500/50 transition-colors cursor-none"
            >
              <span className="font-bold text-zinc-300 tracking-wide">{partner}</span>
            </div>
          ))}
        </motion.div>
      </div>

    </section>
  );
}
