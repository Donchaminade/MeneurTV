import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Tv, Search, User, LogOut, ChevronDown, Heart, Shield, Play } from 'lucide-react';
import { useUser } from '../lib/UserContext';
import { logOut } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { iptvService, Channel } from '../lib/iptvApi';
import AuthModal from './AuthModal';

const Navbar: React.FC = () => {
  const { user, profile, authModal } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Channel[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const ensureSearchCatalog = React.useCallback(async () => {
    if (catalogLoaded) return;
    await iptvService.loadData();
    setAllChannels(iptvService.getEnrichedChannels());
    setCatalogLoaded(true);
  }, [catalogLoaded]);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const filtered = allChannels
        .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, allChannels]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const navLinks = [
    { name: 'Accueil', path: '/' },
    { name: 'Favoris', path: '/favorites' },
    { name: 'Chaînes', path: '/channels' },
    { name: 'Recherche', path: '/search' },
    { name: 'Admin', path: '/admin', adminOnly: true },
  ];

  const visibleLinks = navLinks.filter(link => {
    if (link.adminOnly) return profile?.isAdmin;
    return true;
  });

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-black/80 backdrop-blur-md shadow-2xl border-b border-white/5 py-3' : 'bg-gradient-to-b from-black to-transparent py-5'}`}>
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link to="/" className="flex items-center gap-1 group">
            <span className="text-2xl font-display font-black tracking-tighter text-[#e50914]">
              MENEUR<span className="text-white">TV</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {visibleLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-semibold transition-colors hover:text-white uppercase tracking-wider ${location.pathname === link.path ? 'text-white' : 'text-gray-400'}`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative group hidden sm:block">
            <form onSubmit={handleSearchSubmit}>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => {
                  void ensureSearchCatalog();
                  setSearchQuery(e.target.value);
                }}
                onFocus={() => {
                  void ensureSearchCatalog();
                  if (searchQuery.length > 1) setShowSuggestions(true);
                }}
                placeholder="Rechercher une chaîne..." 
                aria-label="Rechercher une chaîne"
                className="bg-black/50 border border-white/10 rounded-full py-1.5 px-4 pl-10 text-xs focus:outline-none focus:border-[#e50914] w-48 md:w-64 transition-all" 
              />
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            </form>

            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-2 w-full min-w-[300px] bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-2 z-[70]"
                >
                  <p className="px-4 py-2 text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">Suggestions pour "{searchQuery}"</p>
                  {suggestions.map(rec => (
                    <Link
                      key={rec.id}
                      to={`/channel/${rec.id}`}
                      onClick={() => setShowSuggestions(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors group"
                    >
                      <div className="w-10 h-6 bg-white/5 rounded p-1 flex items-center justify-center shrink-0">
                        {rec.logo ? <img src={rec.logo} alt="" className="w-full h-full object-contain" /> : <Tv size={12} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate text-gray-300 group-hover:text-white">{rec.name}</p>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{rec.categories[0]}</p>
                      </div>
                      <Play size={12} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                  <button 
                    type="button"
                    onClick={handleSearchSubmit}
                    aria-label="Voir tous les résultats de recherche"
                    className="w-full py-2 text-[9px] font-black text-[#e50914] uppercase tracking-widest hover:bg-[#e50914]/5 transition-colors border-t border-white/5"
                  >
                    Voir tous les résultats
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 p-1 pl-3 pr-1 rounded-full border border-white/10 hover:bg-white/5 transition-colors"
                id="user-menu-button"
                aria-label="Menu compte utilisateur"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
              >
                <span className="text-xs font-bold text-gray-300 hidden sm:block uppercase tracking-widest">{user.displayName?.split(' ')[0]}</span>
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full border border-white/20" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#e50914] flex items-center justify-center text-sm font-black">
                    {user.email?.[0].toUpperCase()}
                  </div>
                )}
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    className="absolute right-0 mt-3 w-64 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden py-2 z-[60]"
                  >
                    <div className="px-4 py-3 border-b border-white/5 mb-2">
                      <p className="text-xs font-black uppercase tracking-tight truncate">{user.displayName || profile?.displayName || 'Utilisateur'}</p>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest truncate">{user.email}</p>
                    </div>
                    
                    <Link 
                      to="/profile" 
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <User size={16} /> Mon Profil
                    </Link>

                    <Link 
                      to="/favorites" 
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <Heart size={16} /> Favoris
                    </Link>
                    
                    {profile?.isAdmin && (
                      <Link 
                        to="/admin" 
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <Shield size={16} /> Panneau Admin
                      </Link>
                    )}

                    <button
                      onClick={() => { logOut(); setIsUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 mt-2 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors border-t border-white/5"
                    >
                      <LogOut size={16} /> Déconnexion
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => authModal.open('login')}
              className="bg-[#e50914] hover:bg-[#b20710] text-white text-[10px] sm:text-xs font-black uppercase tracking-widest px-6 py-2.5 rounded transition-all active:scale-95 shadow-xl"
              id="login-button"
            >
              Connexion
            </button>
          )}

          <div className="lg:hidden" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
