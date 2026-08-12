import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const PILLARS = [
  {
    num: "01",
    title: "Instantanée",
    subtitle: "Des instants plutôt que des mois",
    description: "Plus besoin de faire la queue pendant des heures ou d'attendre des jours pour obtenir vos résultats. Vos ordonnances et la disponibilité des stocks de médicaments à Antananarivo sont synchronisées en temps réel.",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&auto=format&fit=crop"
  },
  {
    num: "02",
    title: "Prédictive",
    subtitle: "N'attendez jamais les symptômes",
    description: "Grâce à notre système intelligent d'alerte de pénurie et de suivi épidémiologique, anticipez les besoins en santé de votre famille avant même de vous déplacer en officine.",
    image: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=800&auto=format&fit=crop"
  },
  {
    num: "03",
    title: "Accessible",
    subtitle: "La santé sans frontières géographiques",
    description: "Que vous soyez au cœur d'Analakely ou dans les zones périphériques d'Iavoloha, accédez à un réseau de médecins certifiés et de pharmacies agréées en un seul clic.",
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=800&auto=format&fit=crop"
  },
  {
    num: "04",
    title: "Intelligente",
    subtitle: "Vos données racontent votre histoire",
    description: "Vos données médicales sont précieuses et cryptées de bout en bout. Elles permettent un suivi personnalisé de vos traitements et évitent les interactions médicamenteuses dangereuses.",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop"
  },
  {
    num: "05",
    title: "Conçue pour vous",
    subtitle: "Pas un protocole générique",
    description: "Chaque patient est unique. Apteka s'adapte à votre profil, vos prescriptions récurrentes et vos préférences d'officines pour vous offrir une expérience de soin sur-mesure.",
    image: "https://images.unsplash.com/photo-1579684389782-64d84b5e901a?q=80&w=800&auto=format&fit=crop"
  }
];

export default function WhatIfHealth() {
  const containerRef = useRef(null);
  const leftPanelRef = useRef(null);
  const imagesRef = useRef([]);

  useGSAP(() => {
    // Pin left panel during scroll of right panel
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "bottom bottom",
      pin: leftPanelRef.current,
      pinSpacing: false,
      scrub: true,
    });

    // Animate active state of pillars and cross-fade images
    PILLARS.forEach((_, index) => {
      const element = `.pillar-item-${index}`;

      gsap.fromTo(element,
        { opacity: 0.3, y: 30 },
        {
          opacity: 1,
          y: 0,
          scrollTrigger: {
            trigger: element,
            start: "top 70%",
            end: "bottom 30%",
            toggleActions: "play reverse play reverse",
            onEnter: () => setActiveImage(index),
            onEnterBack: () => setActiveImage(index),
          }
        }
      );
    });

    function setActiveImage(index) {
      imagesRef.current.forEach((img, i) => {
        if (i === index) {
          gsap.to(img, { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" });
        } else {
          gsap.to(img, { opacity: 0, scale: 0.95, duration: 0.6, ease: "power2.out" });
        }
      });
    }

    // Set initial active image
    setActiveImage(0);

  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative min-h-[250vh] bg-mhp-dark text-white py-32 flex flex-col lg:flex-row items-stretch">
      
      {/* Aurora backdrop effects */}
      <div className="absolute top-[20%] left-[-10%] w-[40vw] h-[40vw] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* LEFT PANEL - STICKY CONTENT */}
      <div ref={leftPanelRef} className="hidden lg:flex w-1/2 h-screen flex-col justify-start pt-[15vh] px-12 xl:px-24 sticky top-0 overflow-hidden z-20">
        <div className="flex flex-col gap-6 max-w-md">
          <span className="text-teal-400 font-extrabold uppercase tracking-widest text-xs">Le Manifeste Apteka</span>
          <h2 className="text-5xl font-extrabold tracking-tight text-white leading-none">
            Et si la santé était...
          </h2>
          <p className="text-zinc-400 text-sm font-medium leading-relaxed">
            Nous redéfinissons l'accès aux soins à Antananarivo en remplaçant l'incertitude par la prédictibilité et l'innovation technologique.
          </p>
        </div>

        {/* Dynamic Image Container */}
        <div className="relative w-full aspect-video rounded-3xl overflow-hidden mt-8 bg-zinc-900 border border-zinc-800 shadow-2xl">
          {PILLARS.map((pillar, index) => (
            <img
              key={index}
              ref={(el) => (imagesRef.current[index] = el)}
              src={pillar.image}
              alt={pillar.title}
              className="absolute inset-0 w-full h-full object-cover opacity-0 scale-95"
            />
          ))}
          {/* Futuristic Overlay overlay grid */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>

      {/* RIGHT PANEL - SCROLLING PILLARS */}
      <div className="w-full lg:w-1/2 flex flex-col justify-start px-6 sm:px-12 md:px-16 lg:pl-0 lg:pr-12 xl:pr-24 gap-40 lg:gap-64 pt-20 pb-[40vh] z-10">
        
        {/* Mobile Title */}
        <div className="flex lg:hidden flex-col gap-4 mb-10 text-left">
          <span className="text-teal-400 font-extrabold uppercase tracking-widest text-xs">Le Manifeste Apteka</span>
          <h2 className="text-4xl font-extrabold tracking-tight text-white leading-none">
            Et si la santé était...
          </h2>
        </div>

        {PILLARS.map((pillar, index) => (
          <div
            key={index}
            className={`pillar-item-${index} flex flex-col gap-6 text-left border-l-2 border-zinc-800 pl-8 focus:outline-none`}
          >
            {/* Pillar Number */}
            <span className="text-6xl font-black text-teal-500/10 font-mono tracking-tight leading-none">
              {pillar.num}
            </span>

            {/* Pillar Title */}
            <div className="flex flex-col gap-2">
              <h3 className="text-3xl font-bold text-white tracking-tight">
                {pillar.title}
              </h3>
              <span className="text-sm font-extrabold text-teal-400 tracking-wider">
                {pillar.subtitle}
              </span>
            </div>

            {/* Pillar Description */}
            <p className="text-zinc-400 text-sm sm:text-base font-medium leading-relaxed max-w-xl">
              {pillar.description}
            </p>

            {/* Mobile Image */}
            <div className="block lg:hidden w-full aspect-video rounded-2xl overflow-hidden mt-4 bg-zinc-900 border border-zinc-800">
              <img
                src={pillar.image}
                alt={pillar.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}