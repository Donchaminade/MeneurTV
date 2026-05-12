import React from 'react';

/** Chargement minimal pour Suspense (routes lazy). */
const RouteFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 py-16">
    <div className="h-10 w-10 rounded-full border-2 border-[#e50914]/30 border-t-[#e50914] animate-spin" aria-hidden />
    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Chargement…</p>
  </div>
);

export default RouteFallback;
