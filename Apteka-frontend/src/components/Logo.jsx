import React from 'react';

const SIZE_CLASSES = {
  sm: {
    image: 'h-16 w-auto',
    container: 'h-10 ml-3',
  },
  md: {
    image: 'h-24 w-auto',
    container: 'h-12 ml-4',
  },
  lg: {
    image: 'h-32 w-auto',
    container: 'h-16 ml-5',
  },
};

export default function Logo({ variant = 'light', size = 'md' }) {
  const sizes = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const isDark = variant === 'dark';

  return (
    <div className={`flex items-center ${sizes.container}`} aria-label="Apteka Pharmacie digital">
      <img
        src="/branding/logo.png"
        alt="Apteka Pharmacie digital"
        className={`${sizes.image} object-contain ${isDark ? '' : 'drop-shadow-sm'}`}
      />
    </div>
  );
}
