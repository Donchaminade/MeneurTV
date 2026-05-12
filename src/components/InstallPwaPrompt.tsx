import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Smartphone, X } from 'lucide-react';

const DISMISS_KEY = 'meneurtv-pwa-install-dismiss';
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 1400;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isDismissed(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const t = parseInt(raw, 10);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < DISMISS_MS;
}

function isIosNotStandalone(): boolean {
  if (isStandalone()) return false;
  const ua = navigator.userAgent;
  const isIOS =
    /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return isIOS;
}

const InstallPwaPrompt: React.FC = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosGuide, setIosGuide] = useState(false);
  const gotBeforeInstall = useRef(false);
  const iosTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
    setIosGuide(false);
  }, []);

  useEffect(() => {
    if (isStandalone()) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      gotBeforeInstall.current = true;
      setDeferred(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setVisible(false);
      setIosGuide(false);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    if (deferred) {
      const id = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      return () => clearTimeout(id);
    }

    iosTimerRef.current = setTimeout(() => {
      if (gotBeforeInstall.current || isDismissed() || isStandalone()) return;
      if (isIosNotStandalone()) setIosGuide(true);
    }, SHOW_DELAY_MS + 800);

    return () => {
      if (iosTimerRef.current) clearTimeout(iosTimerRef.current);
    };
  }, [deferred]);

  const handleInstall = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } finally {
      setDeferred(null);
      setVisible(false);
    }
  };

  const show = visible && deferred;
  const showIos = iosGuide && !deferred;

  if (!show && !showIos) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          className="relative max-w-md w-full bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,1)] p-8 text-center space-y-6"
        >
          <button
            type="button"
            onClick={dismiss}
            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>

          <div className="w-20 h-20 bg-[#e50914]/10 rounded-full flex items-center justify-center mx-auto border border-[#e50914]/20">
            {showIos ? (
              <Smartphone size={40} className="text-[#e50914]" />
            ) : (
              <Download size={40} className="text-[#e50914]" />
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black uppercase tracking-tighter">
              Installer <span className="text-[#e50914]">MeneurTV</span>
            </h2>
            {showIos ? (
              <p className="text-gray-400 text-sm leading-relaxed">
                Sur Safari : touchez le bouton <strong className="text-white">Partager</strong>, puis{' '}
                <strong className="text-white">Sur l&apos;écran d&apos;accueil</strong>. L&apos;app
                s&apos;ouvrira comme une application avec son icône.
              </p>
            ) : (
              <p className="text-gray-400 text-sm leading-relaxed">
                Ajoutez MeneurTV à votre écran d&apos;accueil pour un accès rapide, le plein écran et une
                expérience proche d&apos;une application native.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {!showIos && (
              <button
                type="button"
                onClick={handleInstall}
                className="flex items-center justify-center gap-3 bg-[#e50914] text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-[#b20710] transition-all shadow-2xl"
              >
                Installer l&apos;application
                <Download size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="py-4 text-gray-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all"
            >
              {showIos ? 'Plus tard' : 'Pas maintenant'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InstallPwaPrompt;
