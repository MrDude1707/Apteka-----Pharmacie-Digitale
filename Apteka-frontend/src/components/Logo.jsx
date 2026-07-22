import React from 'react';

const SIZE_CLASSES = {
  sm: {
    image: 'h-8 w-[92px]',
  },
  md: {
    image: 'h-10 w-[116px]',
  },
  lg: {
    image: 'h-12 w-[140px]',
  },
};

export default function Logo({ variant = 'light', size = 'md' }) {
  const sizes = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const isDark = variant === 'dark';

  return (
    <div className="flex items-center" aria-label="Apteka Pharmacie digital">
      <img
        src="/branding/logo.png"
        alt="Apteka Pharmacie digital"
        className={`${sizes.image} object-contain ${isDark ? '' : 'drop-shadow-sm'}`}
      />
    </div>
  );
}
