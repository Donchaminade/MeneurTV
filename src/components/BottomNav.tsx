import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, Shield, User, Tv } from 'lucide-react';
import { useUser } from '../lib/UserContext';
import { cn } from '../lib/utils';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { user, profile, authModal } = useUser();

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Chaînes', path: '/channels', icon: Tv },
    { name: 'Search', path: '/search', icon: Search },
    { name: 'Favorites', path: '/favorites', icon: Heart, protected: true },
    { name: 'Admin', path: '/admin', icon: Shield, adminOnly: true },
  ];

  const visibleLinks = navLinks.filter(link => {
    if (link.adminOnly) return profile?.isAdmin;
    if (link.protected) return !!user;
    return true;
  });

  return (
    <div className="md:hidden fixed bottom-1 left-4 right-4 z-50 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl px-2 py-3 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between">
        {visibleLinks.map(link => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "flex flex-col items-center gap-1 flex-1 transition-all active:scale-75",
                isActive ? "text-[#e50914]" : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Icon size={18} className={isActive ? "fill-[#e50914]/20" : ""} />
              <span className="text-[8px] font-black uppercase tracking-widest text-center truncate px-1">{link.name}</span>
            </Link>
          );
        })}
        {!user && (
           <button 
             type="button"
             onClick={() => authModal.open('login')}
             aria-label="Se connecter"
             className="flex flex-col items-center gap-1 flex-1 text-gray-500 active:scale-75 transition-transform"
           >
              <User size={18} />
              <span className="text-[8px] font-black uppercase tracking-widest">Login</span>
           </button>
        )}
      </div>
    </div>
  );
};

export default BottomNav;
