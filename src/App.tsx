import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { UserProvider, useUser } from './lib/UserContext';
import { PiPProvider } from './lib/PiPContext';
import FloatingPlayer from './components/FloatingPlayer';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Favorites from './pages/Favorites';
import Admin from './pages/Admin';
import ChannelDetail from './pages/ChannelDetail';
import PipPlayer from './pages/PipPlayer';
import Search from './pages/Search';
import Channels from './pages/Channels';
import Profile from './pages/Profile';
import Donate from './pages/Donate';
import DonationPopup from './components/DonationPopup';
import InstallPwaPrompt from './components/InstallPwaPrompt';
import AuthModal from './components/AuthModal';

import BottomNav from './components/BottomNav';

const AppContent: React.FC = () => {
  const location = useLocation();
  const { user, loading, authModal } = useUser();
  const [accountDisabledBanner, setAccountDisabledBanner] = useState<string | null>(null);

  useEffect(() => {
    if (loading || user) return;
    if (sessionStorage.getItem('meneurtv_account_disabled')) {
      sessionStorage.removeItem('meneurtv_account_disabled');
      setAccountDisabledBanner('Votre compte a été désactivé. Contactez un administrateur pour rétablir l’accès.');
    }
  }, [loading, user]);

  if (location.pathname === '/pip-player') {
    return <PipPlayer />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080808] text-white font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e50914]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans selection:bg-[#e50914]/30 pb-20 md:pb-0">
      {accountDisabledBanner && (
        <div
          role="alert"
          className="fixed top-0 inset-x-0 z-[300] flex items-center justify-between gap-4 bg-red-900/95 border-b border-red-500/40 px-4 py-3 text-sm text-white shadow-lg"
        >
          <span className="font-medium">{accountDisabledBanner}</span>
          <button
            type="button"
            onClick={() => setAccountDisabledBanner(null)}
            className="shrink-0 text-[10px] font-black uppercase tracking-widest text-white/80 hover:text-white"
          >
            Fermer
          </button>
        </div>
      )}
      <Navbar />
      <main className="pt-20 pb-12 px-4 md:px-8 max-w-screen-2xl mx-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/channels" element={<Channels />} />
          <Route path="/search" element={<Search />} />
          <Route path="/favorites" element={user ? <Favorites /> : <Navigate to="/" />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/channel/:id" element={<ChannelDetail />} />
          <Route path="/pip-player" element={<PipPlayer />} />
        </Routes>
      </main>
      <BottomNav />
      <InstallPwaPrompt />
      <DonationPopup />
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={authModal.close}
        initialMode={authModal.mode}
      />
      <FloatingPlayer />
    </div>
  );
};

export default function App() {
  return (
    <UserProvider>
      <Router>
        <PiPProvider>
          <AppContent />
        </PiPProvider>
      </Router>
    </UserProvider>
  );
}
