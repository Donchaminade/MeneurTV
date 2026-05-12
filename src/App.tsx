import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './lib/UserContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Favorites from './pages/Favorites';
import Admin from './pages/Admin';
import ChannelDetail from './pages/ChannelDetail';
import Search from './pages/Search';
import Channels from './pages/Channels';
import Profile from './pages/Profile';
import Donate from './pages/Donate';
import DonationPopup from './components/DonationPopup';
import AuthModal from './components/AuthModal';

import BottomNav from './components/BottomNav';

const AppContent: React.FC = () => {
  const { user, profile, loading, authModal } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080808] text-white font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e50914]"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#080808] text-white font-sans selection:bg-[#e50914]/30 pb-20 md:pb-0">
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
          </Routes>
        </main>
        <BottomNav />
        <DonationPopup />
        <AuthModal 
          isOpen={authModal.isOpen} 
          onClose={authModal.close} 
          initialMode={authModal.mode} 
        />
      </div>
    </Router>
  );
};

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
