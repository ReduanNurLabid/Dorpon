import React from 'react';

export const AmbientBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-screen bg-background text-on-surface antialiased selection:bg-secondary-container selection:text-primary overflow-x-hidden">
      {/* Subtle broadsheet paper grain texture */}
      <div 
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(rgba(0, 0, 0, 0.4) 1px, transparent 1px)`,
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
