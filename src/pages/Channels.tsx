import React, { useState, useEffect, useMemo } from 'react';
import { iptvService, Channel, Category, Language } from '../lib/iptvApi';
import { Tv, Play, Heart, ChevronRight, Filter, Globe, Search, Languages, Shield } from 'lucide-react';
import { useUser } from '../lib/UserContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const Channels: React.FC = () => {
  const { profile, toggleFavorite } = useUser();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      await iptvService.loadData();
      setChannels(iptvService.getEnrichedChannels());
      setCategories(iptvService.getCategories());
      setLanguages(iptvService.getLanguages().sort((a, b) => a.name.localeCompare(b.name)));
      setCountriesList(iptvService.getCountries());
      setLoading(false);
    };
    fetchData();
  }, []);

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const countries = useMemo(() => {
    const uniqueCodes = Array.from(new Set(channels.map(c => c.country))).filter(Boolean);
    const mapped = uniqueCodes.map(code => ({
      code,
      name: countriesList.find(ct => ct.code === code)?.name || code
    }));
    return mapped.sort((a, b) => a.name.localeCompare(b.name));
  }, [channels, countriesList]);

  const filteredChannels = useMemo(() => {
    const list = channels.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'all' || c.categories.includes(selectedCategory);
      const matchCountry = selectedCountry === 'all' || c.country === selectedCountry;
      const matchLang = selectedLanguage === 'all' || c.languages.includes(selectedLanguage);
      return matchSearch && matchCat && matchCountry && matchLang;
    });

    const leaguesKeywords = ['bein', 'sky sport', 'canal+', 'dazn', 'espn', 'supersport', 'eurosport', 'laliga', 'premier league', 'bundesliga', 'bt sport', 'eleven sports', 'match tv'];

    // Sort to put top leagues first if in sports category or general search
    const sorted = [...list].sort((a, b) => {
      const aIsLeague = leaguesKeywords.some(key => a.name.toLowerCase().includes(key));
      const bIsLeague = leaguesKeywords.some(key => b.name.toLowerCase().includes(key));
      
      if (aIsLeague && !bIsLeague) return -1;
      if (!aIsLeague && bIsLeague) return 1;
      return 0;
    });

    // Restriction: Only 10 channels for unauthenticated or incomplete profiles
    if (!profile || !profile.isProfileComplete) {
      return sorted.slice(0, 10);
    }
    return sorted;
  }, [channels, searchTerm, selectedCategory, selectedCountry, selectedLanguage, profile]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-[#e50914]/20 border-t-[#e50914] rounded-full animate-spin" />
        <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Chargement du catalogue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <header className="space-y-4">
         <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 sm:h-8 bg-[#e50914] rounded-full" />
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-black tracking-tighter uppercase">TOUTES LES <span className="text-[#e50914]">CHAÎNES</span></h1>
         </div>
         <p className="text-gray-500 text-sm md:text-base font-medium max-w-xl">Accédez à notre bibliothèque complète de chaînes TV du monde entier. Filtrez par catégorie ou par pays pour trouver votre bonheur.</p>
      </header>

      {/* Filters Bar */}
      <div className="sticky top-[60px] sm:top-20 z-40 py-4 bg-[#080808]/80 backdrop-blur-md border-y border-white/5 -mx-4 md:-mx-8 px-4 md:px-8">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="relative flex-1 min-w-[200px]">
             <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
             <input 
              type="text" 
              placeholder="Rechercher une chaîne..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 sm:py-2.5 pl-12 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#e50914] transition-all"
             />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
             {/* Custom Category Dropdown */}
             <div className="relative">
                <button 
                  onClick={() => { setIsCategoryOpen(!isCategoryOpen); setIsCountryOpen(false); setIsLanguageOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 bg-white/5 border border-white/10 rounded-full py-2 px-6 text-[10px] font-black uppercase tracking-widest transition-all",
                    isCategoryOpen && "border-[#e50914] bg-[#e50914]/5 text-[#e50914]"
                  )}
                >
                  {selectedCategory === 'all' ? 'Catégories' : categories.find(c => c.id === selectedCategory)?.name}
                  <Filter size={12} />
                </button>

                <AnimatePresence>
                  {isCategoryOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full left-0 mt-2 w-64 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 max-h-80 overflow-y-auto no-scrollbar"
                    >
                      <button 
                        onClick={() => { setSelectedCategory('all'); setIsCategoryOpen(false); }}
                        className={cn(
                          "w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors",
                          selectedCategory === 'all' ? "text-[#e50914] bg-[#e50914]/5" : "text-gray-300"
                        )}
                      >
                        Toutes les catégories
                      </button>
                      {categories.map(cat => (
                        <button 
                          key={cat.id}
                          onClick={() => { setSelectedCategory(cat.id); setIsCategoryOpen(false); }}
                          className={cn(
                            "w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors border-t border-white/5",
                            selectedCategory === cat.id ? "text-[#e50914] bg-[#e50914]/5" : "text-gray-300"
                          )}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             {/* Custom Language Dropdown */}
             <div className="relative">
                <button 
                  onClick={() => { setIsLanguageOpen(!isLanguageOpen); setIsCategoryOpen(false); setIsCountryOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 bg-white/5 border border-white/10 rounded-full py-2 px-6 text-[10px] font-black uppercase tracking-widest transition-all",
                    isLanguageOpen && "border-[#e50914] bg-[#e50914]/5 text-[#e50914]"
                  )}
                >
                  {selectedLanguage === 'all' ? 'Langues' : languages.find(l => l.code === selectedLanguage)?.name}
                  <Languages size={12} />
                </button>

                <AnimatePresence>
                  {isLanguageOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 max-h-80 overflow-y-auto no-scrollbar"
                    >
                      <button 
                        onClick={() => { setSelectedLanguage('all'); setIsLanguageOpen(false); }}
                        className={cn(
                          "w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors",
                          selectedLanguage === 'all' ? "text-[#e50914] bg-[#e50914]/5" : "text-gray-300"
                        )}
                      >
                        Toutes les langues
                      </button>
                      {languages.map(lang => (
                        <button 
                          key={lang.code}
                          onClick={() => { setSelectedLanguage(lang.code); setIsLanguageOpen(false); }}
                          className={cn(
                            "w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors border-t border-white/5",
                            selectedLanguage === lang.code ? "text-[#e50914] bg-[#e50914]/5" : "text-gray-300"
                          )}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             {/* Custom Country Dropdown */}
             <div className="relative">
                <button 
                  onClick={() => { setIsCountryOpen(!isCountryOpen); setIsCategoryOpen(false); setIsLanguageOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 bg-white/5 border border-white/10 rounded-full py-2 px-6 text-[10px] font-black uppercase tracking-widest transition-all",
                    isCountryOpen && "border-[#e50914] bg-[#e50914]/5 text-[#e50914]"
                  )}
                >
                  {selectedCountry === 'all' ? 'Pays' : countries.find(c => c.code === selectedCountry)?.name.toUpperCase()}
                  <Globe size={12} />
                </button>

                <AnimatePresence>
                  {isCountryOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-2 w-64 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 max-h-80 overflow-y-auto no-scrollbar"
                    >
                      <button 
                        onClick={() => { setSelectedCountry('all'); setIsCountryOpen(false); }}
                        className={cn(
                          "w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors",
                          selectedCountry === 'all' ? "text-[#e50914] bg-[#e50914]/5" : "text-gray-300"
                        )}
                      >
                        Tous les pays
                      </button>
                      {countries.map(country => (
                        <button 
                          key={country.code}
                          onClick={() => { setSelectedCountry(country.code); setIsCountryOpen(false); }}
                          className={cn(
                            "w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors border-t border-white/5",
                            selectedCountry === country.code ? "text-[#e50914] bg-[#e50914]/5" : "text-gray-300"
                          )}
                        >
                          {country.name.toUpperCase()}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>

          <div className="hidden md:block ml-auto text-[10px] font-black uppercase tracking-widest text-gray-500">
            {filteredChannels.length} CHAÎNES DISPONIBLES
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        {filteredChannels.map((channel) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={channel.id}
            className="group relative bg-white/5 rounded-xl overflow-hidden border border-white/5 hover:border-[#e50914]/50 transition-all shadow-xl"
          >
            <Link to={`/channel/${channel.id}`} className="block">
              <div className="aspect-[4/3] relative bg-[#0a0a0a] flex items-center justify-center p-4 sm:p-6">
                {channel.logo ? (
                  <img src={channel.logo} alt={channel.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <Tv size={28} className="text-white/10 sm:hidden" />
                )}
                {!channel.logo && <Tv size={32} className="text-white/10 hidden sm:block" />}
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#e50914] rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-all duration-300">
                    <Play size={20} sm:size={24} fill="currentColor" className="ml-1" />
                  </div>
                </div>
              </div>
            </Link>

            <button 
              onClick={() => {
                if (!profile) {
                  alert("Veuillez vous connecter pour ajouter des favoris.");
                  return;
                }
                toggleFavorite(channel.id);
              }}
              className={cn(
                "absolute top-2 right-2 p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-all active:scale-90",
                profile?.favorites.includes(channel.id) ? "bg-[#e50914] text-white" : "bg-black/40 text-white hover:bg-[#e50914]"
              )}
            >
              <Heart size={12} sm:size={14} fill={profile?.favorites.includes(channel.id) ? "currentColor" : "none"} />
            </button>

            <div className="p-2 sm:p-3 space-y-0.5 sm:space-y-1">
              <h3 className="font-black text-[10px] sm:text-[11px] uppercase tracking-wider truncate">{channel.name}</h3>
              <div className="flex items-center justify-between">
                 <span className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate max-w-[60px]">
                   {countriesList.find(ct => ct.code === channel.country)?.name || channel.country || 'INT'}
                 </span>
                 <span className="px-1 py-0.5 sm:px-1.5 sm:py-0.5 bg-white/5 rounded text-[7px] sm:text-[8px] font-black text-gray-600 uppercase tracking-widest">LIVE</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {(!profile || !profile.isProfileComplete) && filteredChannels.length >= 10 && (
         <div className="mt-12 p-12 rounded-3xl bg-gradient-to-br from-[#e50914]/20 to-transparent border border-[#e50914]/20 flex flex-col items-center text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <Shield size={160} />
            </div>
            <div className="w-16 h-16 bg-[#e50914] rounded-2xl flex items-center justify-center text-white shadow-2xl">
               <Shield size={32} />
            </div>
            <div className="space-y-2">
               <h3 className="text-2xl font-black uppercase tracking-tighter">Accès Restreint</h3>
               <p className="text-gray-400 text-sm max-w-md mx-auto">
                  Pour accéder à l'intégralité de nos chaînes, veuillez créer un compte et compléter votre profil.
               </p>
            </div>
            <Link 
              to="/profile"
              className="bg-[#e50914] text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#b20710] transition-all shadow-2xl active:scale-95"
            >
              Compléter mon Profil
            </Link>
         </div>
      )}

      {filteredChannels.length > 150 && (
         <div className="py-12 text-center border-t border-white/5 mt-12">
            <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em]">Utilisez les filtres pour affiner votre recherche parmi {filteredChannels.length} chaînes</p>
         </div>
      )}

      {filteredChannels.length === 0 && (
        <div className="text-center py-40 bg-white/5 rounded-3xl border border-dashed border-white/10">
           <Tv size={48} className="mx-auto text-gray-800 mb-4" />
           <h2 className="text-xl font-black uppercase tracking-widest">Aucune chaîne trouvée</h2>
           <p className="text-gray-500 text-sm mt-2">Ajustez vos filtres ou essayez une autre recherche.</p>
        </div>
      )}
    </div>
  );
};

export default Channels;
