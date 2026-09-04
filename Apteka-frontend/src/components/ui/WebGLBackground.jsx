import React from 'react';

export default function WebGLBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none w-screen h-screen overflow-hidden bg-[#050505]">
      {/* Dynamic ambient glowing backdrops that drift slowly */}
      <div 
        className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full blur-[150px] opacity-[0.25] pointer-events-none mix-blend-screen animate-drift-slow"
        style={{
          background: 'radial-gradient(circle, rgba(13, 148, 136, 0.4) 0%, rgba(0, 0, 0, 0) 70%)',
        }}
      />
      <div 
        className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[150px] opacity-[0.2] pointer-events-none mix-blend-screen animate-drift-medium"
        style={{
          background: 'radial-gradient(circle, rgba(0, 68, 255, 0.3) 0%, rgba(0, 0, 0, 0) 70%)',
        }}
      />
      <div 
        className="absolute top-[40%] left-[30%] w-[50vw] h-[50vw] rounded-full blur-[180px] opacity-[0.15] pointer-events-none mix-blend-screen animate-drift-fast"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(0, 0, 0, 0) 70%)',
        }}
      />

      {/* Hardware-accelerated keyframe animation definitions */}
      <style>{`
        @keyframes driftSlow {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes driftMedium {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-50px, 50px) scale(1.08); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes driftFast {
          0% { transform: translate(0px, 0px) scale(1); }
          40% { transform: translate(60px, 40px) scale(0.9); }
          80% { transform: translate(-40px, -30px) scale(1.05); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-drift-slow {
          animation: driftSlow 30s ease-in-out infinite;
          will-change: transform;
        }
        .animate-drift-medium {
          animation: driftMedium 22s ease-in-out infinite;
          will-change: transform;
        }
        .animate-drift-fast {
          animation: driftFast 15s ease-in-out infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  );
}
