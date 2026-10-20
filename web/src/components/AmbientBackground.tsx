import React from 'react';

export const AmbientBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-screen bg-obsidian-bg text-text-primary selection:bg-mint/20 selection:text-mint-bright overflow-x-hidden">
      {/* Dynamic ambient lights */}
      <div 
        className="pointer-events-none fixed -top-[20%] -left-[10%] w-[55vw] h-[55vw] rounded-full opacity-30 blur-[130px]"
        style={{
          background: 'radial-gradient(circle, rgba(52, 211, 153, 0.15) 0%, rgba(17, 38, 31, 0.05) 70%, transparent 100%)',
        }}
      />
      <div 
        className="pointer-events-none fixed top-[40%] -right-[15%] w-[60vw] h-[60vw] rounded-full opacity-20 blur-[150px]"
        style={{
          background: 'radial-gradient(circle, rgba(234, 179, 8, 0.1) 0%, rgba(17, 38, 31, 0.05) 70%, transparent 100%)',
        }}
      />
      <div 
        className="pointer-events-none fixed -bottom-[10%] left-[20%] w-[50vw] h-[50vw] rounded-full opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(90, 240, 179, 0.1) 0%, rgba(11, 15, 14, 0.2) 70%, transparent 100%)',
        }}
      />

      {/* Subtle grid mesh overlay */}
      <div 
        className="pointer-events-none fixed inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
};
