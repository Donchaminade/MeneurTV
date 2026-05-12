import React, { useState, useEffect } from 'react';
import { useUser } from '../lib/UserContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Phone, Heart, Share2, Shield, Settings, Check, CreditCard, Smartphone, Banknote, Coffee, Globe, LogOut } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, logOut } from '../lib/firebase';
import { iptvService as apiService, Channel as ChannelType } from '../lib/iptvApi';
import { cn, getDonationPaymentFields } from '../lib/utils';

const Profile: React.FC = () => {
  const { user, profile, updateProfile, loading: userLoading, authModal } = useUser();
  const navigate = useNavigate();
  
  const [channels, setChannels] = useState<ChannelType[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
  });
  const [copied, setCopied] = useState(false);
  const [donationCopied, setDonationCopied] = useState<string | null>(null);

  // Ne pas réécraser le formulaire pendant l'édition : onSnapshot peut se redéclencher
  // (cache → serveur, reconnexion) avec un nouvel objet `profile` et effaçait chaque frappe.
  useEffect(() => {
    if (isEditing || !profile) return;
    setFormData({
      displayName: profile.displayName || '',
      phoneNumber: profile.phoneNumber || '',
    });
  }, [profile, isEditing]);

  useEffect(() => {
    const fetchData = async () => {
      setChannels(apiService.getEnrichedChannels());
      const settingsDoc = await getDoc(doc(db, 'settings', 'donation'));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data());
      }
    };
    fetchData();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      ...formData,
      isProfileComplete: !!(formData.displayName && formData.phoneNumber),
    });
    setIsEditing(false);
  };

  const handleInvite = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyDonation = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setDonationCopied(type);
    setTimeout(() => setDonationCopied(null), 2000);
  };

  if (userLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <div className="w-12 h-12 border-4 border-[#e50914]/20 border-t-[#e50914] rounded-full animate-spin" />
        <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Chargement du profil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-8">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
          <User size={40} className="text-gray-800" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black uppercase tracking-widest">Compte Requis</h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">Veuillez vous connecter pour accéder à votre profil et vos favoris.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => authModal.open('login')}
            className="bg-[#e50914] text-white px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-[#b20710] transition-all shadow-2xl"
          >
            Se connecter
          </button>
          <button 
            onClick={() => navigate('/')}
            className="bg-white/5 border border-white/10 text-white px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const favoriteChannels = channels.filter(c => profile?.favorites.includes(c.id));

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <header className="relative py-8 sm:py-12 rounded-3xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 overflow-hidden px-6 sm:px-8 md:px-12">
        <div className="absolute top-0 right-0 p-4 sm:p-8">
            <button 
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                } else {
                  if (profile) {
                    setFormData({
                      displayName: profile.displayName || '',
                      phoneNumber: profile.phoneNumber || '',
                    });
                  }
                  setIsEditing(true);
                }
              }}
              className="p-2.5 sm:p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors"
            >
              <Settings size={20} className="text-gray-400" />
            </button>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
          <div className="relative">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[#e50914] rounded-full flex items-center justify-center shadow-2xl overflow-hidden border-4 border-[#0a0a0a]">
              {user.photoURL ? (
                <img src={user.photoURL} alt={profile?.displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl sm:text-5xl font-display font-black text-white">{(profile?.displayName || user.email || '?')[0].toUpperCase()}</span>
              )}
            </div>
            {profile?.isProfileComplete && (
              <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-green-500 text-white p-1 sm:p-1.5 rounded-full border-4 border-[#0a0a0a]">
                <Check size={16} />
              </div>
            )}
          </div>

          <div className="text-center md:text-left space-y-2 sm:space-y-3">
             <div className="space-y-1">
                <h1 className="text-2xl sm:text-4xl font-display font-black tracking-tighter uppercase leading-tight">
                  {profile?.displayName || 'Utilisateur'}
                  {profile?.isAdmin && <span className="ml-2 sm:ml-3 text-[8px] sm:text-[10px] px-1.5 sm:py-1 bg-[#e50914] rounded align-middle">ADMIN</span>}
                </h1>
                <p className="text-gray-500 text-xs sm:text-sm font-medium flex items-center justify-center md:justify-start gap-2">
                  <Mail size={14} /> {user.email}
                </p>
             </div>
             
             {!profile?.isProfileComplete && !isEditing && (
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                   Profil incomplet
                </div>
             )}
          </div>

          <div className="md:ml-auto flex flex-col items-center md:items-end gap-3">
            <button 
              onClick={handleInvite}
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full py-3 px-8 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all relative overflow-hidden"
            >
              <AnimatePresence>
                {copied ? (
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute inset-0 flex items-center justify-center bg-[#e50914]"
                  >
                    Lien Copié !
                  </motion.span>
                ) : null}
              </AnimatePresence>
              Inviter un ami <Share2 size={14} />
            </button>
            <button 
              onClick={() => { logOut(); navigate('/'); }}
              className="text-gray-500 hover:text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
            >
              Déconnexion <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Favorites Snippet */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-1.5 h-6 bg-[#e50914] rounded-full" />
                 <h2 className="text-sm font-black uppercase tracking-widest">Favoris Recents</h2>
              </div>
              <button onClick={() => navigate('/favorites')} className="text-[10px] font-black uppercase tracking-widest text-[#e50914] hover:underline">
                Voir tout
              </button>
            </div>
            
            {favoriteChannels.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {favoriteChannels.slice(0, 6).map(channel => (
                  <div key={channel.id} className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3 hover:border-white/20 transition-all">
                     <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center p-2">
                        {channel.logo ? <img src={channel.logo} alt="" className="w-full h-full object-contain" /> : <Heart size={20} className="text-gray-700" />}
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-wider truncate w-full">{channel.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-white/10">
                <Heart size={32} className="text-gray-800" />
                <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Aucun favori</p>
              </div>
            )}
          </section>

          {/* Donation Section */}
          <section id="donation" className="p-8 rounded-3xl bg-[#e50914]/5 border border-[#e50914]/10 space-y-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <Heart size={160} />
             </div>
             
             <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#e50914] rounded-xl flex items-center justify-center text-white shadow-2xl">
                         <Coffee size={20} />
                      </div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter">Soutenir le Projet</h2>
                   </div>
                   <Link to="/donate" className="text-[10px] font-black uppercase tracking-widest text-[#e50914] hover:text-white transition-colors">
                      Détails de Soutien →
                   </Link>
                </div>
                <p className="text-gray-400 text-sm max-w-xl leading-relaxed">
                  {settings?.supportMessage || " STREAMPRO est un projet passionné. Si vous aimez ce que nous faisons, envisagez de faire un don pour aider à maintenir le service gratuit pour tous."}
                </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-display">
                {(() => {
                  const pay = getDonationPaymentFields(settings);
                  return (
                    <>
                      <DonationCard
                        type="Flooz"
                        value={pay.flooz}
                        icon={<Smartphone size={20} />}
                        onCopy={() => copyDonation(pay.flooz, 'flooz')}
                        isCopied={donationCopied === 'flooz'}
                      />
                      <DonationCard
                        type="Yas"
                        value={pay.yas}
                        icon={<Smartphone size={20} />}
                        onCopy={() => copyDonation(pay.yas, 'yas')}
                        isCopied={donationCopied === 'yas'}
                      />
                      <DonationCard
                        type="Compte bancaire"
                        value={pay.bank}
                        icon={<CreditCard size={20} />}
                        onCopy={() => copyDonation(pay.bank, 'bank')}
                        isCopied={donationCopied === 'bank'}
                      />
                    </>
                  );
                })()}
             </div>
          </section>
        </div>

        <div className="space-y-8">
           {/* Edit Profile Form */}
           <AnimatePresence mode="wait">
             {isEditing ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6"
                >
                  <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <Settings size={16} /> Éditer le Profil
                  </h3>
                  <form onSubmit={handleUpdate} className="space-y-4 font-display">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Nom complet</label>
                      <input 
                        type="text" 
                        value={formData.displayName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-[#e50914]"
                        placeholder="Votre nom"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Numéro de téléphone</label>
                      <input 
                        type="text" 
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-[#e50914]"
                        placeholder="+228..."
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                       <button type="submit" className="flex-1 bg-[#e50914] text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px]">
                          Sauvegarder
                       </button>
                       <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-white/5 text-gray-400 py-3 rounded-xl font-black uppercase tracking-widest text-[10px]">
                          Annuler
                       </button>
                    </div>
                  </form>
                </motion.div>
             ) : (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-8">
                   <h3 className="text-sm font-black uppercase tracking-widest">Informations</h3>
                   <div className="space-y-6">
                      <InfoItem label="Nom" value={profile?.displayName || 'Non renseigné'} icon={<User size={16} />} />
                      <InfoItem label="Téléphone" value={profile?.phoneNumber || 'Non renseigné'} icon={<Phone size={16} />} />
                      <InfoItem label="Membre depuis" value={profile?.createdAt?.toDate().toLocaleDateString() || 'N/A'} icon={<Globe size={16} />} />
                   </div>
                   {!profile?.isProfileComplete && (
                      <button 
                        type="button"
                        onClick={() => {
                          if (profile) {
                            setFormData({
                              displayName: profile.displayName || '',
                              phoneNumber: profile.phoneNumber || '',
                            });
                          }
                          setIsEditing(true);
                        }}
                        className="w-full py-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-yellow-500/20 transition-all"
                      >
                        Compléter mon profil
                      </button>
                   )}
                </div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="flex items-center gap-4">
    <div className="p-2.5 bg-white/5 rounded-lg text-gray-500">
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-black uppercase tracking-tight truncate max-w-[180px]">{value}</p>
    </div>
  </div>
);

const DonationCard: React.FC<{ type: string; value?: string; icon: React.ReactNode; onCopy: () => void; isCopied: boolean }> = ({ type, value, icon, onCopy, isCopied }) => (
  <div className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-4 hover:border-[#e50914]/30 transition-all overflow-hidden relative">
    <div className="flex items-center justify-between">
      <div className="p-2 bg-[#e50914]/10 rounded-lg text-[#e50914]">{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-widest text-[#e50914]">{type}</span>
    </div>
    <div className="space-y-1">
       <p className="text-sm font-black tracking-tight truncate">{value || 'N/A'}</p>
       <button 
          onClick={onCopy}
          className="text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors flex items-center gap-2"
       >
          {isCopied ? <span className="text-green-500">Copié !</span> : <>Copier <Share2 size={10} /></>}
       </button>
    </div>
  </div>
);

export default Profile;
