import React, { useEffect, useState, useMemo } from 'react';
import { iptvService, Channel } from '../lib/iptvApi';
import { useUser } from '../lib/UserContext';
import { signIn } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { Heart, Play, Tv, ArrowRight, Ghost, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const Favorites: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, toggleFavorite } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      await iptvService.loadData();
      setChannels(iptvService.getEnrichedChannels());
      setLoading(false);
    };
    fetchData();
  }, []);

  const favoriteChannels = useMemo(() => {
    if (!profile) return [];
    const ids = profile.favorites ?? [];
    return channels.filter((c) => ids.includes(c.id));
  }, [channels, profile]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-[#e50914]/20 border-t-[#e50914] rounded-full animate-spin" />
        <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Chargement de vos favoris...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-12">
        <div className="relative">
          <div className="w-32 h-32 bg-[#e50914]/10 rounded-full flex items-center justify-center border border-[#e50914]/20 animate-pulse">
            <Heart size={60} className="text-[#e50914] fill-[#e50914]/20" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-[#e50914] text-white p-3 rounded-2xl shadow-2xl">
             <Tv size={24} />
          </div>
        </div>

        <div className="text-center space-y-4 max-w-sm">
          <h2 className="text-3xl font-display font-black uppercase tracking-tighter">Accès <span className="text-[#e50914]">Reservé</span></h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Pour sauvegarder vos chaînes préférées et y accéder à tout moment, vous devez créer un compte sur MeneurTV.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
          <button 
            onClick={signIn}
            className="flex-1 bg-[#e50914] text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#b20710] transition-all active:scale-95 shadow-2xl"
          >
            Se Connecter
          </button>
          <Link 
            to="/"
            className="flex-1 bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all text-center"
          >
            Accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-20">
      <header className="relative min-h-[300px] rounded-[40px] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/5 flex flex-col justify-center px-8 md:px-16 overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000">
           <Heart size={300} className="fill-white" />
        </div>
        
        <div className="space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#e50914]/10 border border-[#e50914]/20 rounded-full text-[10px] font-black text-[#e50914] uppercase tracking-[0.2em]">
            Ma Bibliothèque
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter uppercase leading-none">
              VOS <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e50914] to-[#f52d3a]">FAVORIS</span>
            </h1>
            <p className="text-gray-500 text-sm md:text-base font-medium max-w-lg leading-relaxed">
              Consultez et gérez votre sélection personnelle de chaînes. Tout votre univers TV réuni au même endroit.
            </p>
          </div>
          
          {favoriteChannels.length > 0 && (
            <div className="flex items-center gap-8 pt-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Total chaînes</span>
                <span className="text-3xl font-display font-black text-white">{favoriteChannels.length}</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <Link to="/channels" className="text-[10px] font-black text-gray-500 hover:text-[#e50914] uppercase tracking-widest flex items-center gap-2 transition-colors">
                Ajouter plus <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="space-y-8">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-[#e50914] rounded-full" />
              <h2 className="text-sm font-black uppercase tracking-widest">Ma Liste</h2>
           </div>
        </div>

        <AnimatePresence mode="popLayout">
          {favoriteChannels.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {favoriteChannels.map(channel => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={channel.id}
                  className="group relative bg-white/5 rounded-2xl overflow-hidden border border-white/5 hover:border-[#e50914]/40 transition-all shadow-xl"
                >
                  <div className="aspect-[4/3] relative bg-[#0a0a0a] flex items-center justify-center p-8">
                    {channel.logo ? (
                      <img src={channel.logo} alt={channel.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <Tv size={32} className="text-white/10" />
                    )}
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <Link 
                        to={`/channel/${channel.id}`}
                        className="w-14 h-14 bg-[#e50914] rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-all duration-300 hover:bg-[#b20710]"
                      >
                        <Play size={28} fill="currentColor" className="ml-1" />
                      </Link>
                    </div>

                    <button 
                      onClick={() => toggleFavorite(channel.id)}
                      className="absolute top-3 right-3 p-2.5 rounded-full bg-[#e50914] text-white shadow-2xl active:scale-90 hover:scale-110 transition-all z-20"
                      title="Retirer des favoris"
                    >
                      <Heart size={16} fill="currentColor" />
                    </button>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-black text-xs uppercase tracking-wider truncate">{channel.name}</h3>
                    <div className="flex items-center justify-between">
                       <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{channel.country || 'INT'}</span>
                       <div className="flex items-center gap-1.5">
                          <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">EN DIRECT</span>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-40 rounded-[40px] bg-white/[0.02] border border-dashed border-white/10 space-y-8"
            >
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/5 relative">
                <Ghost size={48} className="text-gray-800" />
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-[#e50914]/10 rounded-full flex items-center justify-center border border-[#e50914]/20">
                   <Heart size={20} className="text-[#e50914]/40" />
                </div>
              </div>
              <div className="text-center space-y-3 max-w-xs">
                <h2 className="text-2xl font-black uppercase tracking-widest font-display">C'est bien calme ici...</h2>
                <p className="text-gray-500 text-sm leading-relaxed px-4">
                  Votre bibliothèque est vide. Commencez par explorer nos chaînes et ajoutez vos coups de cœur !
                </p>
              </div>
              <Link to="/channels" className="group flex items-center gap-3 bg-white text-black px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#e50914] hover:text-white transition-all active:scale-95 shadow-2xl">
                Explorer les Chaînes <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Favorites;

