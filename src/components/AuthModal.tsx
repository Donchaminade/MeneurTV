import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Shield, AlertCircle, ArrowRight } from 'lucide-react';
import { signIn, auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  
  // Update mode when initialMode prop changes (e.g. when opening from different buttons)
  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
      }
      onClose();
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "Une erreur est survenue lors de l'authentification.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur de connexion Google.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden p-6 md:p-12"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 md:top-8 md:right-8 p-2 text-gray-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="space-y-8 md:space-y-12">
          <div className="text-center space-y-3 md:space-y-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#e50914]/10 rounded-2xl flex items-center justify-center mx-auto border border-[#e50914]/20">
               <Shield size={24} className="text-[#e50914] md:hidden" />
               <Shield size={32} className="text-[#e50914] hidden md:block" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-display font-black tracking-tighter uppercase leading-none">
                {mode === 'login' ? 'Connexion' : 'Rejoindre'} <br />
                <span className="text-[#e50914]">MENEURTV</span>
              </h2>
              <p className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                {mode === 'login' ? 'Accédez à vos contenus' : 'Créez votre compte gratuit'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-red-500 text-xs font-medium"
              >
                <AlertCircle size={16} className="shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            <div className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4 flex items-center gap-2">
                    <User size={12} /> Nom complet
                  </label>
                  <input 
                    required
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Votre nom" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-[#e50914] transition-all" 
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4 flex items-center gap-2">
                  <Mail size={12} /> Email
                </label>
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-[#e50914] transition-all" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4 flex items-center gap-2">
                  <Lock size={12} /> Mot de passe
                </label>
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-[#e50914] transition-all" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#e50914] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-[#b20710] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <> {mode === 'login' ? 'Se Connecter' : 'S\'inscrire'} <ArrowRight size={14} /> </>
              )}
            </button>
          </form>

          <div className="space-y-8">
            <div className="relative">
               <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
               <div className="relative flex justify-center text-[9px] uppercase font-black text-gray-600">
                  <span className="bg-[#0a0a0a] px-6">Ou continuer avec</span>
               </div>
            </div>

            <button 
               onClick={handleGoogleSignIn}
               disabled={loading}
               className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 hover:bg-gray-100 transition-all active:scale-95 shadow-xl disabled:opacity-50"
            >
               <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="" />
               Google
            </button>
          </div>

          <div className="text-center">
             <button 
               onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
               className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#e50914] transition-colors"
             >
               {mode === 'login' ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthModal;
