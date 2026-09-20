import React from 'react';

export const Logo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-16 h-16 text-xl'
  };

  return (
    <div className={`flex items-center justify-center rounded-full bg-wavi-blue text-white font-bold tracking-widest ${sizeClasses[size]} ${className}`}>
      WAVI
    </div>
  );
};