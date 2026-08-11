import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function GlassCard({ children, className = "", hoverTilt = true }) {
  const [hovered, setHovered] = useState(false);

  // Motion values for the 3D tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs to avoid jittery movements
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { stiffness: 180, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 180, damping: 20 });

  const handleMouseMove = (e) => {
    if (!hoverTilt) return;
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

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={hoverTilt ? {
        rotateX: rotateX,
        rotateY: rotateY,
        transformStyle: "preserve-3d",
      } : {}}
      animate={{
        scale: hovered && hoverTilt ? 1.015 : 1,
      }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      className={`glass-premium rounded-3xl p-6 relative overflow-hidden transition-smooth ${className}`}
    >
      {/* Dynamic light glare overlay that moves with mouse */}
      {hoverTilt && hovered && (
        <div 
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `radial-gradient(circle 180px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.18), transparent 80%)`,
          }}
          ref={(node) => {
            if (node) {
              // Update custom properties on the glare overlay
              x.on("change", (latestX) => {
                node.style.setProperty("--mouse-x", `${(latestX + 0.5) * 100}%`);
              });
              y.on("change", (latestY) => {
                node.style.setProperty("--mouse-y", `${(latestY + 0.5) * 100}%`);
              });
            }
          }}
        />
      )}
      
      {/* Content wrapper inside preserve-3d to push text out slightly */}
      <div style={hoverTilt ? { transform: "translateZ(15px)" } : {}} className="relative z-20">
        {children}
      </div>
    </motion.div>
  );
}