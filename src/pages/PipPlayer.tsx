import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import { X } from 'lucide-react';

const LS_KEY = 'meneurtv_pip_launch';

export interface PipLaunchPayload {
  url: string;
  poster?: string;
  name?: string;
}

const PipPlayer: React.FC = () => {
  const [payload, setPayload] = useState<PipLaunchPayload | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as PipLaunchPayload;
      localStorage.removeItem(LS_KEY);
      if (data && typeof data.url === 'string' && data.url.length > 0) {
        setPayload({ url: data.url, poster: data.poster, name: data.name });
      }
    } catch {
      localStorage.removeItem(LS_KEY);
    }
  }, []);

  if (!payload?.url) {
    return (
      <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-sm text-gray-400 text-center max-w-sm">
          Aucune lecture à afficher. Sur une chaîne, utilise « Fenêtre flottante » dans les contrôles du lecteur.
        </p>
        <button
          type="button"
          className="text-[10px] font-black uppercase tracking-widest text-[#e50914] hover:underline"
          onClick={() => window.close()}
        >
          Fermer la fenêtre
        </button>
        <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white">
          Retour à l’accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-black flex flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/10 shrink-0 bg-[#0a0a0a]">
        <span className="text-[10px] font-black uppercase tracking-widest truncate text-white/90">
          {payload.name || 'MeneurTV'}
        </span>
        <button
          type="button"
          onClick={() => window.close()}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 shrink-0"
          title="Fermer"
        >
          <X size={18} />
        </button>
      </header>
      <div className="flex-1 min-h-0 flex flex-col">
        <VideoPlayer
          url={payload.url}
          poster={payload.poster}
          popoutTitle={payload.name}
          allowPopout={false}
          showNativePipButton
        />
      </div>
    </div>
  );
};

export default PipPlayer;
