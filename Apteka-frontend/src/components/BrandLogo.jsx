import React from 'react';

export default function BrandLogo({ variant = 'light', className = '' }) {
  const isDark = variant === 'dark';
  
  return (
    <div className={`flex items-center gap-3 group select-none pointer-events-auto cursor-pointer ${className}`}>
      
      {/* Dynamic Stylized Medical-Digital Emblem */}
      <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
        
        {/* Outer glowing organic border (Glassmorphic health ring) */}
        <div className="absolute inset-0 rounded-xl bg-teal-500/5 border border-teal-500/20 group-hover:border-teal-400/40 group-hover:bg-teal-500/10 transition-all duration-500 shadow-[0_0_15px_rgba(20,184,166,0.1)] group-hover:shadow-[0_0_25px_rgba(20,184,166,0.35)]" />
        
        {/* Pulsing ring animation */}
        <span className="absolute inset-0 rounded-xl bg-teal-400/10 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 pointer-events-none" />

        {/* The Pharmacy Cross: Re-imagined as a minimalist digital loop */}
        <svg 
          viewBox="0 0 24 24" 
          className="w-5 h-5 text-teal-400 group-hover:text-cyan-300 group-hover:scale-105 transition-all duration-500" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3.2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          {/* Vertical line of the cross */}
          <line x1="12" y1="6" x2="12" y2="18"></line>
          {/* Horizontal line of the cross */}
          <line x1="6" y1="12" x2="18" y2="12"></line>
        </svg>

        {/* Minimalist central indicator of the digital cross */}
        <div className="absolute w-1.5 h-1.5 rounded-full bg-cyan-300 group-hover:bg-white shadow-[0_0_8px_rgba(34,211,238,1)] transition-colors duration-500" />
        
        {/* Small molecular orbiting dot representing pharmacists / chemistry */}
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 border border-[#09090b] shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
      </div>

      {/* Typography Design */}
      <div className="flex flex-col text-left justify-center">
        <span className={`text-xl font-black tracking-tight flex items-center leading-none ${isDark ? 'text-white' : 'text-zinc-900'}`}>
          APT<span className="text-teal-500 group-hover:text-cyan-500 transition-colors duration-500">E</span>KA
        </span>
        <span className={`text-[8px] font-extrabold font-mono tracking-[0.25em] uppercase mt-1 transition-colors ${isDark ? 'text-zinc-500 group-hover:text-zinc-450' : 'text-zinc-400 group-hover:text-zinc-555'}`}>
          Pharmacie Digitale
        </span>
      </div>

    </div>
  );
}
