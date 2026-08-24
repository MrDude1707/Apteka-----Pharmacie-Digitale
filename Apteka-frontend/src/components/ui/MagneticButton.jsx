import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function MagneticButton({ 
  children, 
  onClick, 
  className = "", 
  variant = "primary", // primary or secondary
  icon: Icon
}) {
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!buttonRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    
    // Magnetic pull math
    const x = (clientX - (left + width / 2)) * 0.15;
    const y = (clientY - (top + height / 2)) * 0.15;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const isPrimary = variant === "primary";

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={`relative overflow-hidden flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold transition-colors duration-300 cursor-pointer group ${
        isPrimary 
          ? "bg-zinc-100 text-zinc-950 hover:text-white" 
          : "glass-awwwards-dark hover:bg-zinc-800 text-zinc-300 hover:text-white"
      } ${className}`}
    >
      {/* Expanding pupil background effect for primary button */}
      {isPrimary && (
        <span 
          className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 origin-center rounded-full transition-transform duration-500 ease-out"
          style={{ transform: isHovered ? 'scale(1)' : 'scale(0)' }}
        />
      )}

      {/* Button Text */}
      <span className="relative z-10">{children}</span>

      {/* Marquee Arrow Icon Interaction */}
      {Icon && (
        <div className="relative z-10 flex overflow-hidden w-5 h-5 items-center justify-center">
          <motion.div
            animate={{ x: isHovered ? '150%' : '0%' }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute"
          >
            <Icon size={18} />
          </motion.div>
          <motion.div
            initial={{ x: '-150%' }}
            animate={{ x: isHovered ? '0%' : '-150%' }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute"
          >
            <Icon size={18} />
          </motion.div>
        </div>
      )}
    </motion.button>
  );
}
