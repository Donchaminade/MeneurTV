import React, { useEffect, useState, useMemo } from 'react';
import { iptvService, Channel, Category, Language } from '../lib/iptvApi';
import { ChevronRight, Heart, Play, Star, Filter, Globe, Tv } from 'lucide-react';
import { useUser } from '../lib/UserContext';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Home: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const { profile, toggleFavorite } = useUser();

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      await iptvService.loadData();
      setChannels(iptvService.getEnrichedChannels());
      setCategories(iptvService.getCategories());
      setLanguages(iptvService.getLanguages());
      setLoading(false);
    };
    fetchData();
  }, []);

  // Hero slideshow logic
  const featuredChannels = useMemo(() => {
    return channels
      .filter(c => c.logo && (c.categories.includes('news') || c.categories.includes('sports') || c.categories.includes('movies')))
      .slice(0, 5);
  }, [channels]);

  useEffect(() => {
    if (featuredChannels.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % featuredChannels.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [featuredChannels]);

  const filteredChannels = useMemo(() => {
    return channels.filter(c => {
      const matchCat = selectedCategory === 'all' || c.categories.includes(selectedCategory);
      return matchCat;
    });
  }, [channels, selectedCategory]);

  // Group channels by categories for the Netflix looks
  const rows = useMemo(() => {
    const grouped: Record<string, Channel[]> = {};
    filteredChannels.forEach(c => {
      c.categories.forEach(cat => {
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(c);
      });
    });

    const priorityCategories = ['sports', 'movies', 'series', 'news', 'music', 'kids', 'documentary', 'entertainment', 'general', 'lifestyle', 'comedy'];

    const leaguesKeywords = ['bein', 'sky sport', 'canal+', 'dazn', 'espn', 'supersport', 'eurosport', 'laliga', 'premier league', 'bundesliga', 'bt sport', 'eleven sports', 'match tv'];

    const leagueChannels = channels.filter(c => 
      leaguesKeywords.some(key => c.name.toLowerCase().includes(key))
    ).slice(0, 30);

    const categoricalRows = Object.entries(grouped)
      .map(([id, list]) => ({
        id,
        name: categories.find(c => c.id === id)?.name || id,
        channels: list.slice(0, 30) // Balanced row size
      }))
      .filter(row => row.channels.length >= 4) // Only show rows with enough content
      .sort((a, b) => {
        const aIndex = priorityCategories.indexOf(a.id);
        const bIndex = priorityCategories.indexOf(b.id);
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        return b.channels.length - a.channels.length;
      });

    const finalRows = [];
    if (leagueChannels.length >= 4) {
      finalRows.push({
        id: 'leagues',
        name: 'GRANDS CHAMPIONNATS',
        channels: leagueChannels
      });
    }

    return [...finalRows, ...categoricalRows].slice(0, 12);
  }, [filteredChannels, channels, categories]);

  if (loading) {
    return (
      <div className="space-y-12">
        <div className="h-96 w-full bg-white/5 animate-pulse rounded-3xl" />
        <div className="space-y-4">
          <div className="h-8 w-48 bg-white/5 animate-pulse rounded" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-40 w-72 flex-shrink-0 bg-white/5 animate-pulse rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const heroChannel = featuredChannels[currentHeroIndex] || channels[0];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      {heroChannel && (
        <div className="relative h-[60vh] md:h-[75vh] w-full rounded-2xl overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-black/20 to-transparent z-10" />
          
          <motion.img 
            key={heroChannel.id}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5 }}
            src={heroChannel.logo || `https://images.unsplash.com/photo-1522865080277-5154cc744459?auto=format&fit=crop&q=80&w=2000`} 
            alt={heroChannel.name}
            className="w-full h-full object-cover blur-[2px] brightness-40"
          />

          <div className="absolute bottom-8 sm:bottom-12 left-4 sm:left-8 md:left-12 z-20 max-w-2xl space-y-4">
            <motion.div 
               key={`meta-${heroChannel.id}`}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex items-center gap-2"
            >
              <div className="bg-[#e50914] px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest shrink-0">EN DIRECT</div>
              <div className="text-white/70 text-[10px] font-bold uppercase tracking-widest truncate">
                TENDANCE • {heroChannel.categories[0]}
              </div>
            </motion.div>
            
            <motion.h1 
              key={`title-${heroChannel.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl xs:text-4xl sm:text-5xl md:text-7xl font-display font-black tracking-tighter leading-none uppercase"
            >
              {heroChannel.name}
            </motion.h1>
            
            <motion.p 
              key={`desc-${heroChannel.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-gray-400 text-xs sm:text-sm md:text-lg line-clamp-2 max-w-lg font-medium leading-relaxed"
            >
              Regardez {heroChannel.name} en streaming HD illimité. Accédez au meilleur du direct partout dans le monde avec MeneurTV.
            </motion.p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={`/channel/${heroChannel.id}`}
                className="flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200 transition-all px-6 sm:px-8 py-2.5 sm:py-3 rounded font-black text-[11px] sm:text-sm uppercase tracking-wider min-w-[140px]"
              >
                <Play size={16} fill="black" /> Regarder
              </Link>
              <button 
                onClick={() => toggleFavorite(heroChannel.id)}
                className={cn(
                  "px-6 sm:px-8 py-2.5 sm:py-3 rounded border font-black text-[11px] sm:text-sm uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[140px]",
                  profile?.favorites.includes(heroChannel.id) 
                    ? "bg-[#e50914] border-[#e50914] text-white" 
                    : "bg-white/10 border-white/10 text-white hover:bg-white/20"
                )}
              >
                <Heart size={16} className={profile?.favorites.includes(heroChannel.id) ? 'fill-white' : ''} />
                Plus d'infos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3 overflow-x-auto pb-4 md:pb-0 w-full md:w-auto hide-scrollbar">
          <button 
            onClick={() => setSelectedCategory('all')}
            className={cn(
              "px-5 py-2 rounded text-[11px] font-black uppercase tracking-widest transition-all border",
              selectedCategory === 'all' 
                ? "bg-[#e50914] text-white border-[#e50914]" 
                : "bg-transparent text-gray-500 border-white/5 hover:border-white/20 hover:text-white"
            )}
          >
            TOUT
          </button>
          {categories.slice(0, 15).map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-5 py-2 rounded text-[11px] font-black uppercase tracking-widest transition-all border whitespace-nowrap",
                selectedCategory === cat.id 
                  ? "bg-[#e50914] text-white border-[#e50914]" 
                  : "bg-transparent text-gray-500 border-white/5 hover:border-white/20 hover:text-white"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto justify-end">
           <div className="flex flex-wrap gap-2">
              {['FRA', 'ENG', 'ESP', 'ARA'].map(lang => (
                <button 
                  key={lang}
                  className="px-2 py-1 rounded bg-white/5 text-[9px] font-black text-gray-400 hover:bg-[#e50914]/10 hover:text-[#e50914] transition-all border border-white/5"
                >
                  {lang}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* Channel Rows */}
      <div className="space-y-16">
        {rows.map(row => (
          <div key={row.id} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-black tracking-tight uppercase">
                {row.name} <span className="text-[#e50914]">TV</span>
              </h2>
              <div className="flex gap-2">
                 <button className="p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                    <ChevronRight className="rotate-180" size={18} />
                 </button>
                 <button className="p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                    <ChevronRight size={18} />
                 </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {row.channels.slice(0, 4).map(channel => (
                <Link
                  key={channel.id}
                  to={`/channel/${channel.id}`}
                  className="group block bg-[#0f0f0f] rounded-lg overflow-hidden border border-white/5 transition-all hover:scale-[1.02] hover:shadow-2xl hover:border-white/20"
                >
                  <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
                    {channel.logo ? (
                      <img src={channel.logo} alt={channel.name} className="w-full h-full object-contain p-4 sm:p-8 group-hover:blur-[2px] transition-all duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                        <Tv size={40} className="text-gray-800" />
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 text-white/30 group-hover:text-[#e50914] transition-colors">
                      <Heart size={14} fill={profile?.favorites.includes(channel.id) ? 'currentColor' : 'none'} className={profile?.favorites.includes(channel.id) ? 'text-[#e50914]' : ''} />
                    </div>

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center text-black shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                        <Play size={16} sm:size={20} fill="black" className="ml-1" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 sm:p-4 border-t border-white/5">
                    <div className="font-black text-xs sm:text-sm truncate tracking-tight">{channel.name}</div>
                    <div className="flex items-center justify-between mt-0.5 sm:mt-1">
                      <span className="text-[8px] sm:text-[9px] text-gray-500 uppercase font-black tracking-widest truncate">{channel.country} • {row.name}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
