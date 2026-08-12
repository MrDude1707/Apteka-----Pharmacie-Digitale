import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import QRCode from 'react-qr-code';
import { ShieldCheck, Calendar, MapPin, Phone, Mail, Award, FileText, User } from 'lucide-react';

export default function PrescriptionPreview({ 
  doctor = {}, 
  patient = null, 
  items = [], 
  code = "", 
  date = "", 
  signed = false 
}) {
  const currentDateStr = date || new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Track hover state for light effects
  const [hovered, setHovered] = useState(false);

  // Motion values for the 3D tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs to avoid jittery movements
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [12, -12]), { stiffness: 150, damping: 22 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-12, 12]), { stiffness: 150, damping: 22 });

  // Dynamic box shadow that moves opposite to the tilt direction, creating depth
  const shadowX = useSpring(useTransform(x, [-0.5, 0.5], [20, -20]), { stiffness: 150, damping: 22 });
  const shadowY = useSpring(useTransform(y, [-0.5, 0.5], [25, -25]), { stiffness: 150, damping: 22 });
  const shadowBlur = useSpring(useTransform(y, [-0.5, 0.5], [35, 55]), { stiffness: 150, damping: 22 });
  const shadowOpacity = useSpring(useTransform(y, [-0.5, 0.5], [0.10, 0.18]), { stiffness: 150, damping: 22 });

  // Map shadow values into a single CSS boxShadow string
  const boxShadow = useTransform(
    [shadowX, shadowY, shadowBlur, shadowOpacity],
    ([sx, sy, sb, so]) => `${sx}px ${sy + 18}px ${sb}px rgba(13, 148, 136, ${so}), 0px 4px 12px rgba(0, 0, 0, 0.03)`
  );

  // Light glare reflection coordinate
  const glareX = useTransform(x, [-0.5, 0.5], [100, 0]);
  const glareY = useTransform(y, [-0.5, 0.5], [100, 0]);
  const glareBackground = useTransform(
    [glareX, glareY],
    ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 65%)`
  );

  // Holographic security seal gradient angle and position shifts
  const holographicBackground = useTransform(
    [x, y],
    ([mx, my]) => {
      const angle = Math.atan2(my, mx) * (180 / Math.PI) + 135;
      return `linear-gradient(${angle}deg, #2dd4bf 0%, #06b6d4 25%, #a855f7 50%, #facc15 75%, #f43f5e 100%)`;
    }
  );

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Normalize coordinates to [-0.5, 0.5]
    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;
    
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    x.set(0);
    y.set(0);
  };

  const paperGridPattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath d='M 16,0 L 0,0 0,16' fill='none' stroke='%2310b981' stroke-width='0.5' stroke-opacity='0.02'/%3E%3C/svg%3E")`;

  return (
    <>
      {/* SVG Ink Bleed Filter for authentic rubber stamp texture */}
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }} aria-hidden="true">
        <defs>
          <filter id="ink-bleed">
            <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" result="displaced" />
            <feGaussianBlur in="displaced" stdDeviation="0.25" result="blurred" />
            <feMerge>
              <feMergeNode in="blurred" />
              <feMergeNode in="displaced" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <motion.div 
        id="print-prescription"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: rotateX,
          rotateY: rotateY,
          boxShadow: boxShadow,
          transformStyle: "preserve-3d",
          aspectRatio: '1/1.414', // A4 Aspect Ratio
          background: `radial-gradient(circle at 50% 50%, #ffffff 0%, #f7fbf9 100%), ${paperGridPattern}`,
          backgroundBlendMode: 'multiply',
        }}
        className="w-full rounded-3xl border border-teal-100/50 p-8 relative overflow-hidden transition-all duration-300 flex flex-col justify-between select-none"
      >
        {/* Holographic Security Foil Seal (Sceau Holographique) */}
        <div className="absolute top-6 right-6 z-20 flex flex-col items-center select-none pointer-events-none">
          <motion.div 
            style={{
              background: holographicBackground,
              boxShadow: '0 4px 20px rgba(13, 148, 136, 0.25), inset 0 2px 4px rgba(255,255,255,0.4)',
              transformStyle: "preserve-3d",
              transform: "translateZ(30px)" // Push seal out of the plane for 3D depth
            }}
            className="w-16 h-14 rounded-full border border-white/60 flex items-center justify-center relative overflow-hidden backdrop-blur-sm"
          >
            {/* Glossy sweep animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-[100%] animate-[shimmer_3s_infinite_ease-in-out]" />
            
            {/* Logo inside */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.35)] shrink-0 z-10">
              <path d="M12 2v20M17 5H7M5 12h14" />
            </svg>
            
            {/* Circular text wrapping the seal */}
            <div className="absolute inset-1 animate-[spin_15s_linear_infinite] opacity-75 z-0">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path id="sealCirclePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
                <text className="fill-white font-mono text-[7px] font-black tracking-[0.12em]">
                  <textPath href="#sealCirclePath" startOffset="0%">
                    SECURE - APTEKA - OFFICIAL - ORIGINAL - 
                  </textPath>
                </text>
              </svg>
            </div>
          </motion.div>
        </div>

        {/* Dynamic Specular Light Reflection Glare */}
        <motion.div 
          style={{
            background: glareBackground,
          }}
          className="absolute inset-0 pointer-events-none z-30 select-none mix-blend-overlay opacity-60"
        />

        {/* Paper Fold Crease Line (La Pliure du Papier) */}
        <div className="absolute left-0 right-0 top-1/2 h-[4px] pointer-events-none select-none z-10 flex flex-col justify-center opacity-85">
          {/* Upper dark shadow */}
          <div className="w-full h-[1px] bg-black/[0.035]" />
          {/* Lower bright paper highlight */}
          <div className="w-full h-[1px] bg-white/[0.3]" />
        </div>

        {/* Discreet Medical Cross Watermark Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.018] pointer-events-none select-none">
          <svg width="60%" height="60%" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-500">
            <path d="M19 10.5h-5.5V4.5c0-.83-.67-1.5-1.5-1.5h-1c-.83 0-1.5.67-1.5 1.5v5.5H4.5c-.83 0-1.5.67-1.5 1.5v1c0 .83.67 1.5 1.5 1.5h5.5V19.5c0 .83.67 1.5 1.5 1.5h1c.83 0 1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5v-1c0-.83-.67-1.5-1.5-1.5z" />
          </svg>
        </div>

        {/* Upper clinical page half */}
        <div style={{ transform: "translateZ(10px)" }} className="relative z-10">
          <div className="flex justify-between items-start border-b border-emerald-500/10 pb-6">
            {/* Doctor / Clinic Information */}
            <div className="flex flex-col gap-1.5 text-left max-w-[65%]">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0 shadow-sm border border-emerald-100/30">
                  <Award size={16} />
                </span>
                <h4 className="text-base font-black text-gray-900 leading-tight">
                  Dr. {doctor.lastName || "Jean Razafy"}
                </h4>
              </div>
              <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider pl-9">
                {doctor.specialite || "Médecin conventionné - Analakely"}
              </p>
              <div className="text-[10px] text-gray-400 font-semibold pl-9 flex flex-col gap-0.5 mt-1">
                <span className="flex items-center gap-1"><MapPin size={10} /> Cabinet Analakely, Antananarivo 101</span>
                <span className="flex items-center gap-1"><Phone size={10} /> Tél : +261 20 22 345 67</span>
                <span className="flex items-center gap-1"><Mail size={10} /> {doctor.email || "dr.razafy@pharma.mg"}</span>
              </div>
            </div>

            {/* Logo / Brand Watermark */}
            <div className="flex flex-col items-end text-right mr-20">
              <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase bg-emerald-500/10 border border-emerald-400/30 px-3 py-1 rounded-full shadow-sm">
                APTEKA DIGITAL
              </span>
              <span className="text-[9px] text-gray-400 font-semibold mt-1.5">
                Plateforme Agréée - Ministère de la Santé
              </span>
            </div>
          </div>

          {/* Patient and Date Header */}
          <div className="grid grid-cols-2 gap-4 my-6 bg-slate-50/70 backdrop-blur-sm p-4 rounded-2xl border border-slate-100/80 text-left shadow-sm">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <User size={10} /> Patient Référent
              </span>
              {patient ? (
                <>
                  <h5 className="text-xs font-extrabold text-gray-900 mt-1">
                    {patient.firstName} {patient.lastName}
                  </h5>
                  <span className="text-[10px] text-gray-500 font-medium">
                    {patient.email}
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-400 italic mt-1 font-medium">
                  Aucun patient sélectionné
                </span>
              )}
            </div>
            <div className="flex flex-col gap-0.5 items-end justify-between text-right">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 justify-end">
                  <Calendar size={10} /> Date d'Émission
                </span>
                <span className="text-xs font-bold text-gray-800 mt-1">
                  {currentDateStr}
                </span>
              </div>
              {code && (
                <span className="font-mono text-emerald-600 font-black text-[10px] bg-emerald-50/80 border border-emerald-100/50 px-2.5 py-0.5 rounded-lg shadow-sm mt-1">
                  ORD: {code}
                </span>
              )}
            </div>
          </div>

          {/* Rx Symbol & Medication Body */}
          <div className="flex flex-col items-start gap-4">
            <span className="text-3xl font-serif font-extrabold text-emerald-600 tracking-tight leading-none">
              R<span className="text-xl font-sans font-light text-gray-400">x</span>
            </span>

            <div className="w-full flex flex-col gap-3.5 max-h-[220px] overflow-y-auto pr-1">
              {items.length === 0 ? (
                <div className="w-full py-10 flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-2xl gap-2 bg-white/50">
                  <FileText size={24} className="text-gray-300" />
                  <span className="text-xs text-gray-400 font-semibold italic">
                    Aucun médicament ajouté à l'ordonnance
                  </span>
                </div>
              ) : (
                items.map((item, index) => (
                  <div 
                    key={index} 
                    className="w-full flex justify-between items-center py-3 px-4 bg-white/80 hover:bg-emerald-50/30 border border-slate-100/80 hover:border-emerald-200/50 rounded-xl transition-all duration-300 text-left shadow-sm hover:translate-x-1"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs text-emerald-600 font-extrabold">
                          {index + 1}.
                        </span>
                        <b className="text-xs font-extrabold text-gray-950 leading-tight">
                          {item.nom}
                        </b>
                        {item.dosage && (
                          <span className="text-[10px] text-gray-500 font-semibold bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">
                            {item.dosage}
                          </span>
                        )}
                      </div>
                      {item.posologie && (
                        <p className="text-[10px] text-gray-500 font-semibold pl-4 mt-0.5">
                          Posologie : {item.posologie}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100/40 px-2 py-0.5 rounded-md">
                        {item.quantite} bte{item.quantite > 1 ? 's' : ''}
                      </span>
                      {item.duree && (
                        <span className="text-[9px] font-bold text-gray-400">
                          Durée : {item.duree}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Signature and Verification Footer */}
        <div style={{ transform: "translateZ(15px)" }} className="border-t border-slate-100 pt-6 mt-6 flex justify-between items-end relative min-h-[100px] z-10">
          {/* Verification QR Code */}
          <div className="flex items-center gap-3 text-left">
            {code ? (
              <div className="p-1.5 bg-white border border-gray-100 rounded-2xl shadow-inner shrink-0 hover:scale-105 transition-transform duration-300">
                <QRCode 
                  value={`https://apteka-digitale.site/verify/${code}`} 
                  size={56}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
            ) : (
              <div className="w-[56px] h-[56px] bg-gray-50 border border-dashed border-gray-200 rounded-2xl flex items-center justify-center shrink-0">
                <span className="text-[8px] text-gray-300 font-bold text-center">QR Code</span>
              </div>
            )}
            <div className="flex flex-col gap-0.5 max-w-[190px]">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck size={11} className="text-emerald-500 stroke-[3]" /> Sécurité Blockchain
              </span>
              <p className="text-[9px] text-gray-400 leading-normal font-semibold">
                Ordonnance signée numériquement et certifiée par cryptographie. Flashez pour authentifier l'officine.
              </p>
            </div>
          </div>

          {/* Animated Doctor Hand-drawn Signature & Tactile Official Rubber Stamp */}
          <div className="flex items-center justify-center relative w-40 h-24">
            
            {/* SVG Handwritten Blue Ink Signature */}
            {signed && (
              <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center select-none">
                <svg viewBox="0 0 120 60" className="w-full h-full text-blue-700/85 drop-shadow-[0_1px_1.5px_rgba(30,58,138,0.15)]">
                  <motion.path
                    d="M15,35 Q30,12 45,30 T75,25 T105,20 Q115,50 80,40 Q55,35 30,45 Q50,45 100,38"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.9 }}
                    transition={{ duration: 1.8, ease: "easeInOut", delay: 0.4 }}
                  />
                  {/* Subtle Doctor's Initial Flourish */}
                  <motion.path
                    d="M35,22 Q30,52 40,42 T60,18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.85 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 1.6 }}
                  />
                </svg>
              </div>
            )}

            {/* Tactile Ink Stamp */}
            {signed ? (
              <motion.div 
                initial={{ scale: 3.5, rotate: -45, opacity: 0, y: -20, filter: 'blur(5px)' }}
                animate={{ 
                  scale: 1, 
                  rotate: -15, 
                  opacity: 0.92, 
                  y: 0,
                  filter: 'url(#ink-bleed)' 
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 180, 
                  damping: 15, 
                  delay: 0.1 
                }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center border-4 border-dashed border-emerald-600/85 rounded-2xl text-emerald-600/90 uppercase p-2 font-black tracking-tight select-none rotate-[-15deg] origin-center cursor-default shadow-[inset_0_0_8px_rgba(16,185,129,0.12)] z-10"
              >
                {/* Inner border ring of the stamp */}
                <div className="absolute inset-1 border border-emerald-600/40 rounded-xl pointer-events-none" />
                
                <div className="text-[7.5px] font-black tracking-[0.15em] text-emerald-600">DR. {doctor.lastName ? doctor.lastName.toUpperCase() : "RAZAFY"}</div>
                <div className="text-[10px] font-black my-0.5 flex items-center gap-1 justify-center">
                  <ShieldCheck size={11} className="stroke-[3]" /> AGRÉÉ APTEKA
                </div>
                <div className="text-[6.5px] tracking-widest font-black text-emerald-600/70">MINISTÈRE SANTÉ</div>
                <div className="text-[5.5px] font-mono mt-0.5 leading-none opacity-85 border-t border-emerald-600/20 pt-1 w-[80%] mx-auto">
                  {code || "ORD-SECURE"}
                </div>
              </motion.div>
            ) : (
              <div className="text-[9px] text-gray-400 font-bold tracking-wider uppercase border border-dashed border-gray-200 bg-gray-50/50 rounded-2xl w-full h-full flex flex-col gap-1 items-center justify-center text-center py-4 px-3">
                <span className="animate-pulse flex h-2 w-2 relative mb-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-[9px] text-gray-500 font-extrabold">En attente de signature</span>
              </div>
            )}

          </div>
        </div>
      </motion.div>
    </>
  );
}
