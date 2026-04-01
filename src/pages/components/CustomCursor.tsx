import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    // Only run on devices with a fine pointer (mouse)
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickable = target.tagName.toLowerCase() === 'button' || 
                          target.tagName.toLowerCase() === 'a' || 
                          target.closest('button') || 
                          target.closest('a') ||
                          target.tagName.toLowerCase() === 'input' ||
                          target.tagName.toLowerCase() === 'select' ||
                          target.tagName.toLowerCase() === 'textarea';
      setIsHovering(!!isClickable);
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <>
      <motion.div
        className="custom-cursor-dot hidden md:block"
        animate={{
          x: mousePosition.x,
          y: mousePosition.y,
          scale: isHovering ? 0 : 1,
        }}
        transition={{ type: 'tween', ease: 'linear', duration: 0 }}
      />
      <motion.div
        className="custom-cursor-outline hidden md:block"
        animate={{
          x: mousePosition.x,
          y: mousePosition.y,
          scale: isHovering ? 1.5 : 1,
          backgroundColor: isHovering ? 'rgba(167, 139, 250, 0.1)' : 'transparent',
          borderColor: isHovering ? 'rgba(167, 139, 250, 0.8)' : 'rgba(167, 139, 250, 0.4)',
        }}
        transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.2 }}
      />
    </>
  );
}
