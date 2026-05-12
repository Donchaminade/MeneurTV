import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Smartphone, CreditCard, MessageSquare, Heart, ArrowLeft, Coffee, Banknote, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDonationPaymentFields } from '../lib/utils';

const Donate: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'donation');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching donation settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e50914]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-12">
      <Link 
        to="/profile"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
      >
        <ArrowLeft size={14} /> Retour au profil
      </Link>

      <header className="text-center space-y-6">
        <div className="w-24 h-24 bg-[#e50914]/10 rounded-full flex items-center justify-center mx-auto border border-[#e50914]/20">
          <Heart size={48} className="text-[#e50914] animate-pulse fill-[#e50914]/10" />
        </div>
        <div className="space-y-3">
          <h1 className="text-5xl md:text-6xl font-display font-black tracking-tighter uppercase leading-[0.9]">
            SOUTENIR <br />
            <span className="text-[#e50914]">LE PROJET</span>
          </h1>
          <p className="text-gray-500 text-sm md:text-lg font-medium max-w-xl mx-auto leading-relaxed">
            Votre contribution nous aide à maintenir les serveurs actifs et à améliorer continuellement votre expérience TV.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {(() => {
           const pay = getDonationPaymentFields(settings);
           return (
             <>
               <DonationMethodCard
                 icon={<Smartphone size={32} />}
                 label="Flooz"
                 value={pay.flooz || 'Non configuré'}
                 color="text-orange-500"
               />
               <DonationMethodCard
                 icon={<Smartphone size={32} />}
                 label="Yas"
                 value={pay.yas || 'Non configuré'}
                 color="text-blue-500"
               />
               <DonationMethodCard
                 icon={<CreditCard size={32} />}
                 label="Compte bancaire"
                 value={pay.bank || 'Non configuré'}
                 color="text-[#e50914]"
               />
             </>
           );
         })()}
      </div>

      <div className="glass p-10 rounded-[40px] border-white/5 space-y-8 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
            <MessageSquare size={120} />
         </div>
         
         <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-6 bg-[#e50914] rounded-full" />
               <h2 className="text-sm font-black uppercase tracking-[0.2em]">Message du Développeur</h2>
            </div>
            <p className="text-gray-400 font-medium leading-relaxed italic text-lg">
               "{settings?.supportMessage || "Merci pour votre générosité. Chaque don compte pour faire grandir STREAMPRO."}"
            </p>
         </div>

         <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 border border-green-500/20">
                  <ShieldCheck size={24} />
               </div>
               <div>
                  <h4 className="text-xs font-black uppercase tracking-widest">Transactions Sécurisées</h4>
                  <p className="text-[10px] text-gray-500 font-medium">Vos données de paiement sont protégées.</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <Coffee size={20} className="text-[#e50914]" />
               <Banknote size={20} className="text-green-500" />
               <Smartphone size={20} className="text-blue-500" />
            </div>
         </div>
      </div>

      <div className="text-center">
         <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-700">
            STREAMPRO © 2024 • MERCI POUR VOTRE FIDÉLITÉ
         </p>
      </div>
    </div>
  );
};

const DonationMethodCard: React.FC<{ icon: React.ReactNode, label: string, value: string, color: string }> = ({ icon, label, value, color }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass p-8 rounded-3xl border-white/5 flex flex-col items-center text-center space-y-6 hover:border-white/10 transition-all"
  >
    <div className={`w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center ${color} border border-white/5`}>
      {icon}
    </div>
    <div className="space-y-2">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{label}</h3>
      <p className="text-lg font-black tracking-tight text-white">{value}</p>
    </div>
    <button 
      onClick={() => navigator.clipboard.writeText(value)}
      className="text-[9px] font-black uppercase tracking-widest text-[#e50914] hover:text-white transition-colors"
    >
      Copier les détails
    </button>
  </motion.div>
);

export default Donate;
