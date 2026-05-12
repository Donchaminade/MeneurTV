import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { iptvService, Channel, Category, Language } from '../lib/iptvApi';
import { Search as SearchIcon, Filter, Globe, Tv, Play, Heart, ChevronRight, X, Languages } from 'lucide-react';
import { useUser } from '../lib/UserContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

/** Fond + texte lisibles (évite menu natif fond blanc / texte blanc). */
const selectFieldClass =
  'w-full rounded-lg py-3 pl-10 pr-4 text-sm font-bold appearance-none focus:outline-none focus:border-[#e50914] ' +
  'border border-white/10 bg-[#141414] text-white [color-scheme:dark]';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, toggleFavorite } = useUser();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const query = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || 'all';
  const selectedLanguage = searchParams.get('lang') || 'all';
  const selectedCountry = searchParams.get('country') || 'all';

  useEffect(() => {
    const fetchData = async () => {
      await iptvService.loadData();
      setChannels(iptvService.getEnrichedChannels());
      setCategories(iptvService.getCategories());
      setLanguages(iptvService.getLanguages());
      setCountries(iptvService.getCountries());
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredChannels = useMemo(() => {
    return channels.filter(channel => {
      const matchesQuery = !query || 
        channel.name.toLowerCase().includes(query.toLowerCase()) ||
        channel.id.toLowerCase().includes(query.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
        channel.categories.includes(selectedCategory);
      
      const matchesCountry = selectedCountry === 'all' || 
        channel.country === selectedCountry;

      const matchesLanguage = selectedLanguage === 'all' || 
        channel.languages.includes(selectedLanguage);

      return matchesQuery && matchesCategory && matchesCountry && matchesLanguage;
    });
  }, [channels, query, selectedCategory, selectedCountry, selectedLanguage]);

  const updateFilters = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === 'all' || !value) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-[#e50914]/20 border-t-[#e50914] rounded-full animate-spin" />
        <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Initialisation du moteur de recherche...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
             <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tighter uppercase">RECHERCHE <span className="text-[#e50914]">AVANCÉE</span></h1>
             <p className="text-gray-500 text-sm md:text-base font-medium">Explorez des milliers de chaînes avec des filtres précis.</p>
          </div>
          <div className="bg-[#e50914] text-white px-5 py-2.5 rounded font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-xl self-start md:self-auto">
            {filteredChannels.length} RÉSULTATS
          </div>
        </div>

        {/* Improved Search Bar */}
        <div className="relative group">
          <input 
            type="text" 
            value={query}
            onChange={(e) => updateFilters({ q: e.target.value })}
            placeholder="Nom de la chaîne, réseau, ID..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 sm:py-5 px-12 sm:px-14 text-lg sm:text-xl font-bold text-white focus:outline-none focus:border-[#e50914] focus:ring-4 focus:ring-[#e50914]/10 transition-all placeholder:text-gray-600 [color-scheme:dark]" 
          />
          <SearchIcon size={22} className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#e50914] transition-colors" />
          {query && (
            <button 
              onClick={() => updateFilters({ q: '' })}
              className="absolute right-5 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Catégorie</label>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <select 
                value={selectedCategory}
                onChange={(e) => updateFilters({ category: e.target.value })}
                className={selectFieldClass}
              >
                <option value="all" className="bg-[#141414] text-white">Toutes les catégories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-[#141414] text-white">{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Country */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Pays</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <select 
                value={selectedCountry}
                onChange={(e) => updateFilters({ country: e.target.value })}
                className={selectFieldClass}
              >
                <option value="all" className="bg-[#141414] text-white">Tous les pays</option>
                {countries.sort((a, b) => a.name.localeCompare(b.name)).map(country => (
                  <option key={country.code} value={country.code.toLowerCase()} className="bg-[#141414] text-white">{country.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Langue</label>
            <div className="relative">
              <Languages className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <select 
                value={selectedLanguage}
                onChange={(e) => updateFilters({ lang: e.target.value })}
                className={selectFieldClass}
              >
                <option value="all" className="bg-[#141414] text-white">Toutes les langues</option>
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code} className="bg-[#141414] text-white">{lang.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort Or Status (Static for now) */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Qualité</label>
            <div className="relative">
              <Tv className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <select 
                className={selectFieldClass}
                defaultValue="all"
              >
                <option value="all" className="bg-[#141414] text-white">Toutes qualités</option>
                <option value="hd" className="bg-[#141414] text-white">Haute Définition (HD)</option>
                <option value="sd" className="bg-[#141414] text-white">Définition Standard (SD)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="min-h-[400px]">
        {filteredChannels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredChannels.slice(0, 100).map((channel) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={channel.id}
                  className="group relative bg-[#0f0f0f] border border-white/5 rounded-xl overflow-hidden hover:border-white/20 hover:scale-[1.03] transition-all duration-300 shadow-xl"
                >
                  <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
                    {channel.logo ? (
                      <img src={channel.logo} alt={channel.name} className="w-full h-full object-contain p-8 group-hover:blur-[2px] transition-all duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                        <Tv size={48} className="text-gray-900" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                      <Link to={`/channel/${channel.id}`} className="bg-white text-black p-4 rounded-full scale-75 group-hover:scale-100 transition-all hover:bg-[#e50914] hover:text-white shadow-2xl">
                        <Play size={20} fill="currentColor" className="ml-1" />
                      </Link>
                    </div>

                    <button 
                      onClick={() => toggleFavorite(channel.id)}
                      className={cn(
                        "absolute top-4 right-4 p-2.5 rounded-md shadow-2xl active:scale-95 transition-all",
                        (profile?.favorites ?? []).includes(channel.id) ? "bg-[#e50914] text-white" : "bg-black/50 text-white hover:bg-white/10"
                      )}
                    >
                      <Heart size={16} fill={(profile?.favorites ?? []).includes(channel.id) ? "currentColor" : "none"} />
                    </button>

                    <div className="absolute top-4 left-4">
                       <span className="bg-[#e50914] text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest shadow-lg">LIVE</span>
                    </div>
                  </div>

                  <div className="p-5 border-t border-white/5 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <h3 className="font-black text-sm tracking-tight truncate uppercase">{channel.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">{channel.country}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest truncate">{channel.categories[0] || 'Général'}</span>
                      </div>
                    </div>
                    <Link to={`/channel/${channel.id}`} className="p-2 bg-white/5 rounded text-gray-400 hover:text-white transition-colors shrink-0">
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 glass rounded-2xl border border-dashed border-white/10">
             <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                <SearchIcon size={40} className="text-gray-700" />
             </div>
             <div className="space-y-2">
                <h2 className="text-lg font-black uppercase tracking-widest">Aucun résultat trouvé</h2>
                <p className="text-gray-500 max-w-sm text-sm font-medium">Nous n'avons trouvé aucune chaîne correspondant à vos critères. Essayez d'ajuster les filtres ou la recherche.</p>
             </div>
             <button 
              onClick={() => updateFilters({ q: '', category: 'all', country: 'all', lang: 'all' })}
              className="bg-[#e50914] text-white px-8 py-3 rounded font-black text-[10px] uppercase tracking-widest hover:bg-[#b20710] shadow-xl transition-all active:scale-95"
             >
               Réinitialiser les filtres
             </button>
          </div>
        )}

        {filteredChannels.length > 100 && (
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Affichage des 100 premiers résultats sur {filteredChannels.length}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
