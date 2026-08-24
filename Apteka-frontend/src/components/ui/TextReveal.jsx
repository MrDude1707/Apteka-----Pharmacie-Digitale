import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function TextReveal({ 
  text, 
  className = "", 
  delay = 0, 
  duration = 0.8,
  element: Element = "div" 
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  // Split string into words for staggering
  const words = text.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: delay * i },
    }),
  };

  const child = {
    visible: {
      y: 0,
      rotateZ: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100,
        duration: duration,
      },
    },
    hidden: {
      y: "120%",
      rotateZ: 3,
      opacity: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100,
        duration: duration,
      },
    },
  };

  return (
    <Element ref={ref} className={className}>
      <motion.div
        variants={container}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="flex flex-wrap"
      >
        {words.map((word, idx) => (
          <span
            key={idx}
            className="overflow-hidden inline-flex mr-[0.25em]" // keeps space between words
          >
            <motion.span 
              variants={child} 
              className="inline-block"
              style={{ transformOrigin: "left bottom" }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </motion.div>
    </Element>
  );
}
