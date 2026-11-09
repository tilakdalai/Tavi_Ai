import React from 'react';
import logoImg from '../../assets/logo.png';

export default function BrandLogo({ size = 36, animated = false, className = '' }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center select-none flex-shrink-0 ${className}`}
    >
      <img
        src={logoImg}
        alt="Tavi AI"
        width={size}
        height={size}
        className={`w-full h-full object-contain rounded-full transition-all duration-300 ${
          animated
            ? 'animate-pulse drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]'
            : 'drop-shadow-[0_0_6px_rgba(59,130,246,0.35)]'
        }`}
        draggable={false}
      />
    </div>
  );
}
