import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function JellyCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const isTouchDevice = useRef(false);

  // Position of the center dot (bypasses React re-renders completely on mousemove)
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Velocity of the cursor (bypasses React re-renders)
  const velocityX = useMotionValue(0);
  const velocityY = useMotionValue(0);

  const lastMousePos = useRef({ x: -100, y: -100, time: Date.now() });

  // Springs for smooth movement of the outer blob
  const springX = useSpring(-100, { stiffness: 180, damping: 18, mass: 0.7 });
  const springY = useSpring(-100, { stiffness: 180, damping: 18, mass: 0.7 });
  
  const springWidth = useSpring(48, { stiffness: 200, damping: 20 });
  const springHeight = useSpring(48, { stiffness: 200, damping: 20 });
  const springRadius = useSpring(50, { stiffness: 200, damping: 20 }); // value in %

  // Transform numeric spring radius to string percentage (e.g., 50 -> "50%")
  const borderRadiusString = useTransform(springRadius, (val) => `${val}%`);

  // Transform velocity to speed and angle
  const speed = useTransform([velocityX, velocityY], ([vx, vy]) => {
    return Math.sqrt(vx ** 2 + vy ** 2);
  });

  const angle = useTransform([velocityX, velocityY], ([vx, vy]) => {
    return Math.atan2(vy, vx) * (180 / Math.PI);
  });

  // Scale stretching on movement
  const scaleX = useTransform(speed, (s) => {
    if (isHovering) return 1;
    return 1 + Math.min(s * 0.003, 0.4);
  });

  const scaleY = useTransform(speed, (s) => {
    if (isHovering) return 1;
    return 1 - Math.min(s * 0.003, 0.2);
  });

  useEffect(() => {
    // Check if device is touch-based
    if (window.matchMedia("(pointer: coarse)").matches) {
      isTouchDevice.current = true;
      return;
    }

    const handleMouseMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      const now = Date.now();
      const dt = Math.max(now - lastMousePos.current.time, 1);

      const vx = (x - lastMousePos.current.x) / dt;
      const vy = (y - lastMousePos.current.y) / dt;

      // Update velocities with slight low-pass filtering for smooth damping
      const targetVx = vx * 16;
      const targetVy = vy * 16;
      velocityX.set(velocityX.get() * 0.7 + targetVx * 0.3);
      velocityY.set(velocityY.get() * 0.7 + targetVy * 0.3);

      // Instantly position the hard center dot (bypasses React render)
      mouseX.set(x);
      mouseY.set(y);

      lastMousePos.current = { x, y, time: now };

      // If not hovering, update the spring target to follow the mouse
      if (!isHovering) {
        springX.set(x - 24);
        springY.set(y - 24);
        springWidth.set(48);
        springHeight.set(48);
        springRadius.set(50);
      }
    };

    const handleMouseOver = (e) => {
      const target = e.target.closest('button, a, [data-magnetic], input, [data-cursor-magnet], select, textarea');
      if (target) {
        const rect = target.getBoundingClientRect();
        setIsHovering(true);

        // Lock onto target element bounds with a beautiful magnetic padding
        springX.set(rect.left - 10);
        springY.set(rect.top - 10);
        springWidth.set(rect.width + 20);
        springHeight.set(rect.height + 20);
        springRadius.set(15); // Squarish border radius
      }
    };

    const handleMouseOut = (e) => {
      const target = e.target.closest('button, a, [data-magnetic], input, [data-cursor-magnet], select, textarea');
      if (target) {
        setIsHovering(false);
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
  }, [isHovering, springX, springY, springWidth, springHeight, springRadius, velocityX, velocityY, mouseX, mouseY]);

  // If touch device, do not render any custom cursor
  if (isTouchDevice.current) return null;

  return (
    <>
      {/* 1. Point Central (Surgical Accuracy) */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[10000] mix-blend-difference"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          opacity: isHovering ? 0 : 1,
          scale: isHovering ? 0 : 1,
        }}
        transition={{ duration: 0.15 }}
      />

      {/* 2. Blob Élastique Externe (Smooth Orbit / Magnetic Catchup) */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] backdrop-blur-[2px] flex items-center justify-center"
        style={{
          x: springX,
          y: springY,
          width: springWidth,
          height: springHeight,
          borderRadius: borderRadiusString,
          border: '1px solid rgba(255,255,255,0.25)',
          background: isHovering ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.02)',
          rotate: isHovering ? 0 : angle,
          scaleX: scaleX,
          scaleY: scaleY,
          transformOrigin: 'center center',
        }}
      />
    </>
  );
}
