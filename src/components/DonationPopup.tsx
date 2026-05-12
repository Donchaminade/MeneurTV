import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, X, ExternalLink, Coffee } from 'lucide-react';
import { Link } from 'react-router-dom';

const DonationPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 45 minutes = 2700000 ms
    const interval = 45 * 60 * 1000;
    
    const showPopup = () => {
      setIsOpen(true);
    };

    const timer = setTimeout(showPopup, interval);

    return () => clearTimeout(timer);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative max-w-md w-full bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,1)] p-8 text-center space-y-6"
        >
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="w-20 h-20 bg-[#e50914]/10 rounded-full flex items-center justify-center mx-auto border border-[#e50914]/20">
            <Heart size={40} className="text-[#e50914] fill-[#e50914]" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Soutenez le <span className="text-[#e50914]">Concepteur</span></h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Nous espérons que vous appréciez votre expérience sur STREAMPRO. Pour nous aider à maintenir les serveurs et ajouter de nouvelles chaînes, un petit don serait grandement apprécié.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Link 
              to="/profile#donation" 
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-3 bg-[#e50914] text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-[#b20710] transition-all shadow-2xl"
            >
              Faire un don <Heart size={16} />
            </Link>
            <button 
              onClick={() => setIsOpen(false)}
              className="py-4 text-gray-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all"
            >
              Peut-être plus tard
            </button>
          </div>

          <div className="pt-4 border-t border-white/5">
             <div className="flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">
                <Coffee size={10} /> Powered by your generosity
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DonationPopup;
