import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function JellyCursor() {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [targetRect, setTargetRect] = useState(null);
  const lastMousePos = useRef({ x: -100, y: -100 });
  
  // Springs pour un mouvement ultra fluide du blob externe
  const springX = useSpring(0, { stiffness: 150, damping: 15, mass: 0.8 });
  const springY = useSpring(0, { stiffness: 150, damping: 15, mass: 0.8 });
  const springWidth = useSpring(48, { stiffness: 200, damping: 20 });
  const springHeight = useSpring(48, { stiffness: 200, damping: 20 });
  const springRadius = useSpring(50, { stiffness: 200, damping: 20 }); // en pourcentage

  useEffect(() => {
    // Vérifier si l'appareil est tactile
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const handleMouseMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      
      const vx = x - lastMousePos.current.x;
      const vy = y - lastMousePos.current.y;
      
      setVelocity({ x: vx, y: vy });
      setMousePos({ x, y });
      
      lastMousePos.current = { x, y };

      if (!isHovering) {
        springX.set(x - 24);
        springY.set(y - 24);
        springWidth.set(48);
        springHeight.set(48);
        springRadius.set(50);
      }
    };

    const handleMouseOver = (e) => {
      const target = e.target.closest('button, a, [data-magnetic], input');
      if (target) {
        const rect = target.getBoundingClientRect();
        setIsHovering(true);
        setTargetRect({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        });
        
        // Aimantation du blob
        springX.set(rect.left - 10);
        springY.set(rect.top - 10);
        springWidth.set(rect.width + 20);
        springHeight.set(rect.height + 20);
        springRadius.set(15); // Border radius plus carré
      }
    };

    const handleMouseOut = (e) => {
      const target = e.target.closest('button, a, [data-magnetic], input');
      if (target) {
        setIsHovering(false);
        setTargetRect(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [isHovering, springX, springY, springWidth, springHeight, springRadius]);

  const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
  const angle = Math.atan2(velocity.y, velocity.x) * (180 / Math.PI);
  
  // Limiter l'étirement
  const scaleX = isHovering ? 1 : 1 + Math.min(speed * 0.004, 0.4);
  const scaleY = isHovering ? 1 : 1 - Math.min(speed * 0.004, 0.2);

  // Cacher le curseur par défaut sur les éléments interactifs
  useEffect(() => {
    document.body.style.cursor = 'none';
    const iterables = document.querySelectorAll('button, a, input');
    iterables.forEach(el => el.style.cursor = 'none');
    return () => {
      document.body.style.cursor = 'auto';
    };
  });

  return (
    <>
      {/* Point central (dur) */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[10000] mix-blend-difference"
        animate={{
          x: mousePos.x - 4,
          y: mousePos.y - 4,
          opacity: isHovering ? 0 : 1,
          scale: isHovering ? 0 : 1,
        }}
        transition={{ type: "tween", ease: "backOut", duration: 0.15 }}
      />

      {/* Blob élastique externe */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] backdrop-blur-[2px] flex items-center justify-center"
        style={{
          x: springX,
          y: springY,
          width: springWidth,
          height: springHeight,
          borderRadius: useSpring(springRadius, { stiffness: 200, damping: 20 }).get() + '%',
          border: '1px solid rgba(255,255,255,0.2)',
          background: isHovering ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)',
          rotate: isHovering ? 0 : angle,
          scaleX: scaleX,
          scaleY: scaleY,
          transformOrigin: 'center center',
        }}
      />
    </>
  );
}
