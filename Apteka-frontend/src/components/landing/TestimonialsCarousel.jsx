import React, { useRef } from 'react';
import { Quote, Star } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const TESTIMONIALS = [
  { 
    initials: "AM", 
    name: "Alain Michel", 
    role: "Patient (Analakely)", 
    text: "Avant Apteka, mon père diabétique devait attendre qu'on fasse quatre pharmacies de garde différentes sous la pluie à Tana pour trouver de l'insuline. Maintenant, on vérifie l'inventaire en direct depuis le téléphone et on réserve immédiatement.", 
    rating: 5 
  },
  { 
    initials: "JR", 
    name: "Dr. Jean Razafy", 
    role: "Médecin Généraliste (Isoraka)", 
    text: "La numérisation réduit radicalement l'automédication sauvage et l'usage de ordonnances périmées, un problème majeur à Madagascar. Je sais exactement si mes traitements critiques ont été délivrés officiellement.", 
    rating: 5 
  },
  { 
    initials: "TK", 
    name: "Tojo Koloina", 
    role: "Pharmacien Co-Titulaire (Ankorondrano)", 
    text: "L'intégration du stock est transparente. Le QR code crypté d'Apteka prévient toute falsification d'ordonnances papier. C'est l'outil qui manquait pour sécuriser notre exercice officinal.", 
    rating: 5 
  },
  { 
    initials: "HL", 
    name: "Hariniaina Lalaina", 
    role: "Patiente (Ambohibao)", 
    text: "Plus besoin de tenter de déchiffrer les écritures manuscrites des ordonnances à la lueur d'une bougie lors des coupures d'électricité. La posologie est claire, propre, et le chemin vers l'officine ouverte est tracé.", 
    rating: 5 
  },
  { 
    initials: "SR", 
    name: "Dr. Sandra Raman", 
    role: "Pédiatre (Itaosy)", 
    text: "Un dispositif indispensable pour notre système de santé local. Voir les stocks en temps réel évite aux familles d'enfants malades des déplacements longs et épuisants dans les embouteillages d'Antananarivo.", 
    rating: 5 
  },
  { 
    initials: "MV", 
    name: "Mina Vololona", 
    role: "Patiente (Ivato)", 
    text: "Le renouvellement d'ordonnance à distance pour mon traitement d'hypertension se fait en quelques secondes. Le médecin valide et je reçois l'alerte sur mon téléphone. C'est sécurisant et moderne.", 
    rating: 5 
  }
];

export default function TestimonialsCarousel() {
  const containerRef = useRef(null);
  const leftPanelRef = useRef(null);

  useGSAP(() => {
    // Pin left column during vertical scrolling
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "bottom bottom",
      pin: leftPanelRef.current,
      pinSpacing: false,
      scrub: true,
    });

    // Stacking Cards animation timeline (style Spine.com)
    const cards = gsap.utils.toArray('.stack-card');
    cards.forEach((card, idx) => {
      if (idx === cards.length - 1) return; // La dernière carte ne se fait pas recouvrir
      
      const nextCard = cards[idx + 1];
      
      // Réduction de taille subtile à scale(0.95) et assombrissement fluide au défilement
      gsap.to(card, {
        scale: 0.95,
        filter: "brightness(0.55)", // Sans flou pour des performances optimales à 120fps
        transformOrigin: "top center",
        scrollTrigger: {
          trigger: nextCard,
          start: "top 80%", // Démarre le scale lorsque la carte suivante arrive dans l'écran
          end: "top 20%",   // Entièrement empilée (quand la suivante devient sticky à 20vh)
          scrub: true,
        }
      });
    });

  }, { scope: containerRef });

  return (
    <section ref={containerRef} id="testimonials" className="relative min-h-[350vh] bg-mhp-dark text-white py-32 flex flex-col lg:flex-row items-stretch border-t border-zinc-900/60">
      
      {/* Abstract light backdrops */}
      <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* LEFT COLUMN - STICKY TITLE (Spine-Style Frozen Header) */}
      <div ref={leftPanelRef} className="hidden lg:flex w-5/12 h-screen flex-col justify-center px-16 xl:px-24 sticky top-0 overflow-hidden z-20">
        <div className="flex flex-col gap-6 max-w-md">
          <span className="text-teal-400 font-extrabold uppercase tracking-widest text-xs">Témoignages</span>
          <h2 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Ce qu'ils disent de nous.
          </h2>
          <p className="text-zinc-400 text-sm font-medium leading-relaxed">
            Découvrez comment Apteka redéfinit le quotidien des patients, médecins et pharmaciens d'Antananarivo à travers des retours d'expérience authentiques.
          </p>
        </div>

        {/* Decorative Quote Mark */}
        <div className="text-teal-500/10 mt-12 flex justify-start pl-2">
          <Quote size={80} style={{ transform: 'scaleX(-1)' }} />
        </div>
      </div>

      {/* RIGHT COLUMN - VERTICAL STACKING TESTIMONIAL CARDS */}
      <div className="w-full lg:w-7/12 flex flex-col px-6 sm:px-12 md:px-16 lg:pl-0 lg:pr-12 xl:pr-24 gap-[10vh] pb-32 z-10">
        
        {/* Mobile Header Title */}
        <div className="flex lg:hidden flex-col gap-4 mb-16 text-left">
          <span className="text-teal-400 font-extrabold uppercase tracking-widest text-xs">Témoignages</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            Ce qu'ils disent de nous.
          </h2>
        </div>

        {/* Testimonial Cards stack */}
        {TESTIMONIALS.map((testimonial, index) => (
          <div
            key={index}
            className="stack-card sticky top-[20vh] w-full bg-zinc-900/80 backdrop-blur-2xl border border-zinc-800/80 rounded-[2.5rem] p-8 md:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-shadow duration-300 hover:border-teal-500/30 flex flex-col justify-between min-h-[380px] sm:min-h-[340px]"
            style={{
              boxShadow: "0 -20px 40px -15px rgba(0,0,0,0.3), 0 30px 60px -15px rgba(0,0,0,0.6)"
            }}
          >
            {/* Quote details */}
            <div>
              {/* Rating stars */}
              <div className="flex items-center gap-1 text-amber-500 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-base sm:text-lg md:text-xl font-medium text-zinc-100 leading-relaxed italic">
                "{testimonial.text}"
              </p>
            </div>

            {/* Author Card row */}
            <div className="flex items-center gap-4 mt-8 pt-6 border-t border-zinc-800/80">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-teal-500/10">
                {testimonial.initials}
              </div>
              <div>
                <h4 className="font-extrabold text-white text-sm sm:text-base">
                  {testimonial.name}
                </h4>
                <p className="text-[10px] sm:text-xs font-bold text-teal-400 uppercase tracking-widest mt-0.5">
                  {testimonial.role}
                </p>
              </div>
            </div>

          </div>
        ))}
      </div>

    </section>
  );
}