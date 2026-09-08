import React, { useEffect, useState } from 'react';

export default function ToastViewport() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (event) => {
      const id = `${Date.now()}-${Math.random()}`;
      const toast = { id, ...event.detail };
      setToasts((current) => [...current, toast]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, 4000);
    };

    window.addEventListener('apteka:toast', handleToast);
    return () => window.removeEventListener('apteka:toast', handleToast);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[10000] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl ${
            toast.type === 'error'
              ? 'border-red-400/30 bg-red-950/90 text-red-100'
              : toast.type === 'success'
                ? 'border-emerald-400/30 bg-emerald-950/90 text-emerald-100'
                : 'border-white/10 bg-zinc-900/95 text-white'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
