import React, { useMemo } from 'react';
import { motion } from 'motion/react';

export function GamingBackground() {
  // Generate random particles once to avoid re-renders
  const particles = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      size: Math.random() * 3 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 10,
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#050505] pointer-events-none">
      {/* Animated Gradient Background */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-[-10%] opacity-50"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(239, 68, 68, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(239, 68, 68, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(15, 15, 15, 1) 0%, transparent 100%)
          `
        }}
      />

      {/* Cyber Grid Effect */}
      <div 
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(circle at 50% 50%, black, transparent 90%)'
        }}
      />

      {/* Floating Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ 
            x: `${p.x}%`, 
            y: `${p.y}%`, 
            opacity: 0 
          }}
          animate={{
            y: [`${p.y}%`, `${p.y - 15}%`, `${p.y}%`],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut"
          }}
          className="absolute rounded-full bg-red-500 blur-[1px]"
          style={{
            width: p.size,
            height: p.size,
            boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)'
          }}
        />
      ))}

      {/* Subtle Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.02]">
        <div className="w-full h-full" style={{
          background: 'linear-gradient(0deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
          backgroundSize: '100% 4px',
        }} />
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-radial-[circle_at_50%_50%] from-transparent via-transparent to-[#050505] opacity-60" />
    </div>
  );
}
