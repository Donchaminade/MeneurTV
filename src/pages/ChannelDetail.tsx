import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { iptvService, Channel } from '../lib/iptvApi';
import VideoPlayer from '../components/VideoPlayer';
import RatingSystem from '../components/RatingSystem';
import { useUser } from '../lib/UserContext';
import { usePiP } from '../lib/PiPContext';
import { getFavoriteIdsForDisplay } from '../lib/favoritesLocal';
import { recordRecentChannel } from '../lib/recentChannelsLocal';
import { Heart, Info, Share2, Tv, ArrowLeft, ChevronRight, Play, Shield, PictureInPicture2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ShareButton: React.FC<{ title: string }> = ({ title }) => {
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'idle' | 'shared'>('idle');

  const handleClick = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `MeneurTV — ${title}`, text: title, url });
        setMode('shared');
        window.setTimeout(() => setMode('idle'), 2000);
        return;
      } catch (err) {
        const e = err as { name?: string };
        if (e?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Partage / copie impossible :', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Partager ou copier le lien de la chaîne"
      className="relative p-3.5 rounded glass border-white/10 text-white hover:bg-[#e50914]/10 transition-colors group"
    >
      <AnimatePresence>
        {copied || mode === 'shared' ? (
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#e50914] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded shadow-xl whitespace-nowrap"
          >
            {mode === 'shared' ? 'Partagé !' : 'Lien copié !'}
          </motion.span>
        ) : null}
      </AnimatePresence>
      <Share2 size={18} className={cn('transition-transform', (copied || mode === 'shared') && 'scale-95')} />
    </button>
  );
};

const ChannelDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { startPip, stopPip } = usePiP();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [recommendations, setRecommendations] = useState<Channel[]>([]);
  const { profile, user, toggleFavorite, logView, authModal } = useUser();

  const favoriteIds = useMemo(() => {
    if (!user) return [];
    return getFavoriteIdsForDisplay(user.uid, profile?.favorites);
  }, [user, profile?.favorites]);

  useEffect(() => {
    stopPip();
  }, [id, stopPip]);

  useEffect(() => {
    const fetchData = async () => {
      await iptvService.loadData();
      const allChannels = iptvService.getEnrichedChannels();
      const rawId = id ? decodeURIComponent(id) : '';
      const found = allChannels.find((c) => c.id === rawId);
      if (found) {
        setChannel(found);
        logView(found.id);
        recordRecentChannel({ id: found.id, name: found.name, logo: found.logo });
        
        // Find related channels
        const related = allChannels
          .filter(c => c.id !== found.id && c.categories.some(cat => found.categories.includes(cat)))
          .slice(0, 40);
        setRecommendations(related);
      }
    };
    fetchData();
  }, [id, logView]);

  if (!channel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        <p className="text-gray-500 animate-pulse font-medium">Chargement du flux...</p>
      </div>
    );
  }

  const isRestricted = !profile;

  const hasPlayback = (channel.stream_urls?.length ?? 0) > 0 || !!channel.stream_url;

  const goHomeWithMini = () => {
    if (isRestricted || !hasPlayback) return;
    startPip({
      id: channel.id,
      name: channel.name,
      stream_url: channel.stream_urls?.[0] ?? channel.stream_url!,
      stream_urls: channel.stream_urls,
      logo: channel.logo,
    });
    navigate('/');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 lg:items-start">
      <div className="lg:col-span-2 space-y-8 lg:sticky lg:top-24 self-start w-full min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">
            <ArrowLeft size={14} /> Retour à l'accueil
          </Link>
          {!isRestricted && hasPlayback && (
            <button
              type="button"
              onClick={goHomeWithMini}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:border-[#e50914]/40 hover:text-white transition-colors"
              title="Continuer la lecture dans un mini lecteur en bas de l'écran"
            >
              <PictureInPicture2 size={16} className="text-[#e50914]" />
              Accueil + mini lecteur
            </button>
          )}
        </div>

        <div className="shadow-[0_20px_80px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden relative">
          {isRestricted ? (
            <div className="aspect-video bg-black/40 border border-white/5 flex flex-col items-center justify-center text-center p-8 space-y-6">
                <div className="w-20 h-20 bg-[#e50914]/10 rounded-full flex items-center justify-center text-[#e50914] border border-[#e50914]/20 animate-pulse">
                   <Shield size={40} />
                </div>
                <div className="space-y-2">
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Identification Requise</h3>
                   <p className="text-gray-500 text-sm max-w-sm">
                      Veuillez vous connecter pour débloquer la lecture en direct de toutes les chaînes sur MeneurTV.
                   </p>
                </div>
                <button 
                  onClick={() => authModal.open('login')}
                  className="bg-[#e50914] text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#b20710] transition-all shadow-2xl"
                >
                  Se Connecter
                </button>
            </div>
          ) : (
            <VideoPlayer urls={channel.stream_urls} url={channel.stream_url} poster={channel.logo} popoutTitle={channel.name} />
          )}
        </div>
        {!isRestricted && hasPlayback && (
          <p className="text-[9px] text-gray-500 leading-relaxed max-w-2xl">
            <span className="font-black uppercase tracking-widest text-gray-600">Lecture continue :</span> dans le
            lecteur, « fenêtre flottante » ouvre une autre fenêtre du navigateur (pratique sur mobile et entre onglets).
            L’icône PiP ouvre la vidéo au-dessus du bureau si le navigateur le propose. « Accueil + mini lecteur » garde
            un mini lecteur dans la page.
          </p>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-4 sm:p-8 rounded-2xl glass border-white/5">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white/5 p-3 sm:p-4 flex items-center justify-center border border-white/10 shrink-0">
              {channel.logo ? (
                <img src={channel.logo} alt={channel.name} className="w-full h-full object-contain" />
              ) : (
                <Tv size={28} className="text-gray-700 sm:hidden" />
              )}
              {!channel.logo && <Tv size={36} className="text-gray-700 hidden sm:block" />}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-black tracking-tight uppercase truncate">{channel.name}</h1>
              <div className="mt-1 sm:mt-2">
                <RatingSystem channelId={channel.id} />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3 sm:mt-4">
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-[#e50914] text-white shrink-0">LIVE</span>
                {channel.categories.map(cat => (
                  <span key={cat} className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/10 text-gray-400 truncate max-w-[100px]">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => {
                if (!user) {
                  alert("Veuillez vous connecter pour ajouter des favoris.");
                  return;
                }
                toggleFavorite(channel.id);
              }}
              className={cn(
                "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-95 border min-w-[120px]",
                favoriteIds.includes(channel.id)
                  ? "bg-[#e50914] border-[#e50914] text-white"
                  : "bg-white/5 border-white/10 text-white hover:bg-white/10"
              )}
            >
              <Heart size={18} className={favoriteIds.includes(channel.id) ? 'fill-white' : ''} />
              {favoriteIds.includes(channel.id) ? 'Favoris' : 'Ajouter'}
            </button>
            <ShareButton title={channel.name} />
          </div>
        </div>

        <div className="p-4 sm:p-8 rounded-2xl glass border-white/5 space-y-6 sm:space-y-8">
          <div className="flex items-center gap-2 text-[#e50914] font-black uppercase tracking-widest text-[10px]">
            <Info size={14} /> Fiche Technique
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Provenance</p>
              <p className="font-bold text-sm tracking-tight uppercase">{channel.country || 'Global'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Audio</p>
              <p className="font-bold text-sm tracking-tight uppercase">Multi-Langues</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Catégorie</p>
              <p className="font-bold text-sm tracking-tight uppercase truncate">{channel.categories[0] || 'Général'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">État</p>
              <p className="text-green-500 font-black text-sm tracking-tight uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Oppérationnel
              </p>
            </div>
          </div>
          {channel.website && (
            <div className="pt-4 border-t border-white/5">
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Webmaster</p>
              <a href={channel.website} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-[#e50914] text-xs font-bold truncate block transition-colors">
                {channel.website}
              </a>
            </div>
          )}
        </div>
      </div>

      <aside className="flex flex-col min-h-0 min-w-0 lg:max-h-[calc(100vh-6rem)]">
        <h3 className="text-sm font-black uppercase tracking-widest flex items-center justify-between shrink-0 mb-4">
          Plus de {channel.categories[0]} <ChevronRight size={14} className="text-[#e50914]" />
        </h3>
        <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0 pr-1 -mr-0.5 space-y-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]">
          {recommendations.map(rec => (
            <Link 
              key={rec.id} 
              to={`/channel/${rec.id}`}
              className="flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5"
            >
              <div className="w-24 h-14 rounded bg-[#0f0f0f] p-2 flex items-center justify-center border border-white/5 shrink-0 overflow-hidden relative">
                {rec.logo ? (
                  <img src={rec.logo} alt={rec.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                ) : (
                  <Tv size={20} className="text-gray-800" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play size={14} fill="white" />
                </div>
              </div>
              <div className="flex flex-col justify-center gap-1 min-w-0">
                <p className="font-black text-xs truncate group-hover:text-[#e50914] transition-colors uppercase tracking-tight">{rec.name}</p>
                <div className="flex gap-2">
                  <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">{rec.country}</span>
                  <span className="text-[9px] text-green-500 font-black uppercase tracking-widest">OK</span>
                </div>
              </div>
            </Link>
          ))}
          {recommendations.length === 0 && (
            <div className="py-12 border border-dashed border-white/10 rounded-xl text-center">
               <p className="text-gray-600 font-bold text-[10px] uppercase tracking-widest">Aucune suggestion</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default ChannelDetail;
