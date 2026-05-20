import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';
import * as dashjs from 'dashjs';
import { resolvePlaybackUrlCandidates } from '../lib/streamUtils';
import {
  Settings,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Loader2,
  PictureInPicture,
  SquareArrowOutUpRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface VideoPlayerProps {
  /** Plusieurs URLs pour la même chaîne (repli si un flux est mort ou bloqué). */
  urls?: string[];
  /** URL unique ; préférez `urls` si plusieurs flux sont connus. */
  url?: string;
  poster?: string;
  autoPlay?: boolean;
  /** Lecteur compact (mini fenêtre) */
  compact?: boolean;
  className?: string;
  /** Mini-lecteur : clic sur la vidéo = retour page chaîne */
  pipNavigateOnVideoClick?: () => void;
  /** PiP natif navigateur (fenêtre au-dessus du bureau) — Chrome / Edge / Safari récents */
  showNativePipButton?: boolean;
  /** Titre affiché dans la fenêtre flottante / PiP */
  popoutTitle?: string;
  /** Ouvre une petite fenêtre navigateur (lecture par-dessus d’autres apps si le navigateur le permet) */
  allowPopout?: boolean;
}

/** Manifeste MPEG-DASH (ex. Canal+ / TF1 sur iptv-org). */
function isDashManifestUrl(url: string): boolean {
  const path = (url.split('?')[0] ?? '').toLowerCase();
  return path.endsWith('.mpd');
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  urls,
  url,
  poster,
  autoPlay = true,
  compact = false,
  className,
  pipNavigateOnVideoClick,
  showNativePipButton = true,
  popoutTitle,
  allowPopout = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1); // 0 to 2 (2 is 200%)
  const [isMuted, setIsMuted] = useState(false);
  const [quality, setQuality] = useState<string>('Auto');
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [hlsInstance, setHlsInstance] = useState<Hls | null>(null);
  const [isNativePip, setIsNativePip] = useState(false);

  const canUseNativePip =
    typeof document !== 'undefined' &&
    'pictureInPictureEnabled' in document &&
    document.pictureInPictureEnabled;

  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const rawCandidateUrls = useMemo(() => {
    const fromProp = urls?.filter((u) => typeof u === 'string' && u.trim().length > 0) ?? [];
    if (fromProp.length > 0) return fromProp;
    const u = url?.trim();
    return u ? [u] : [];
  }, [urls, url]);

  const resolvedPlaybackUrls = useMemo(
    () => resolvePlaybackUrlCandidates(rawCandidateUrls),
    [rawCandidateUrls]
  );

  const [streamAttemptIndex, setStreamAttemptIndex] = useState(0);
  const streamsTotalRef = useRef(0);
  streamsTotalRef.current = resolvedPlaybackUrls.length;

  const tryNextStreamRef = useRef<() => void>(() => {});
  tryNextStreamRef.current = () => {
    setStreamAttemptIndex((i) => {
      if (i + 1 < streamsTotalRef.current) return i + 1;
      setError(
        streamsTotalRef.current <= 1
          ? 'Ce flux ne peut pas être lu ici : il est souvent chiffré (DRM / Widevine), réservé à une zone géographique, ou refusé par le navigateur (sans en-têtes CORS). La source ne propose parfois qu’une seule URL ; dans ce cas aucune lecture n’est possible dans MeneurTV sans droits et serveur de licences adaptés.'
          : 'Aucun des flux disponibles n’a pu être lu.'
      );
      return i;
    });
  };

  const playbackUrlsKey = resolvedPlaybackUrls.join('\n');
  useEffect(() => {
    setStreamAttemptIndex(0);
  }, [playbackUrlsKey]);

  const playUrl = resolvedPlaybackUrls[streamAttemptIndex] ?? '';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!playUrl) {
      setError('Aucune URL de flux.');
      setIsLoading(false);
      return;
    }
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    // Initialize Web Audio API for volume boost
    if (!audioContextRef.current) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        const gain = ctx.createGain();
        const source = ctx.createMediaElementSource(video);
        
        source.connect(gain);
        gain.connect(ctx.destination);
        
        audioContextRef.current = ctx;
        gainNodeRef.current = gain;
        sourceRef.current = source;
      } catch (e) {
        console.warn("Web Audio API not supported for volume boost", e);
      }
    }

    let hls: Hls | null = null;
    let dashPlayer: { reset: () => void; on: (ev: string, cb: (...args: unknown[]) => void) => void } | null = null;
    setError(null);
    setIsLoading(true);
    setHlsInstance(null);
    setAvailableQualities(['Auto']);
    setQuality('Auto');

    const handleLevelLoaded = (_: any, data: any) => {
      if (hls) {
        const levels = hls.levels;
        const qualities = levels.map((l, i) => `${l.height}p`);
        setAvailableQualities(['Auto', ...qualities]);
      }
    };

    let networkFatalRetries = 0;

    const handleError = (_: any, data: any) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            if (networkFatalRetries < 2) {
              networkFatalRetries += 1;
              hls?.startLoad();
            } else {
              hls?.destroy();
              hls = null;
              tryNextStreamRef.current();
            }
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.error('Erreur média HLS, tentative de récupération…');
            hls?.recoverMediaError();
            break;
          default:
            console.error('Erreur HLS fatale, essai du flux suivant si disponible');
            hls?.destroy();
            hls = null;
            tryNextStreamRef.current();
            break;
        }
      }
    };

    let loadingCleared = false;
    const tryClearLoading = () => {
      if (loadingCleared) return;
      loadingCleared = true;
      setIsLoading(false);
    };

    let nativeErr: (() => void) | undefined;
    let nativeLoaded: (() => void) | undefined;

    const onCanPlay = () => tryClearLoading();
    video.addEventListener('canplay', onCanPlay, { once: true });

    if (isDashManifestUrl(playUrl)) {
      if (!dashjs.supportsMediaSource()) {
        tryNextStreamRef.current();
        setIsLoading(false);
      } else {
        try {
          const player = dashjs.MediaPlayer().create();
          dashPlayer = player;
          player.initialize(video, playUrl, autoPlay);
          const ev = dashjs.MediaPlayer.events;
          player.on(ev.STREAM_INITIALIZED, () => {
            if (autoPlay) video.play().catch(console.error);
            tryClearLoading();
          });
          player.on(ev.ERROR, () => {
            tryClearLoading();
            try {
              dashPlayer?.reset();
            } catch {
              /* ignore */
            }
            tryNextStreamRef.current();
          });
        } catch (e) {
          console.error('[MeneurTV] dash.js', e);
          tryNextStreamRef.current();
          setIsLoading(false);
        }
      }
    } else if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        // Qualité la plus basse en premier = premier segment plus léger, démarrage plus rapide
        startLevel: 0,
        capLevelToPlayerSize: true,
        maxBufferLength: 20,
        maxMaxBufferLength: 90,
        backBufferLength: 45,
        startFragPrefetch: true,
        manifestLoadingMaxRetry: 6,
        levelLoadingMaxRetry: 6,
        fragLoadingMaxRetry: 6,
        levelLoadingTimeOut: 20000,
        fragLoadingTimeOut: 20000,
      });
      hls.loadSource(playUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) video.play().catch(console.error);
      });
      hls.on(Hls.Events.FRAG_BUFFERED, (_, data) => {
        if (data.frag?.type === 'main') tryClearLoading();
      });
      hls.on(Hls.Events.ERROR, handleError);
      hls.on(Hls.Events.LEVEL_LOADED, handleLevelLoaded);
      setHlsInstance(hls);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      nativeErr = () => tryNextStreamRef.current();
      nativeLoaded = () => {
        tryClearLoading();
        if (autoPlay) video.play().catch(console.error);
      };
      video.src = playUrl;
      video.addEventListener('error', nativeErr);
      video.addEventListener('loadedmetadata', nativeLoaded, { once: true });
    }

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onVolumeChange = () => setIsMuted(video.muted);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('volumechange', onVolumeChange);

    return () => {
      loadingCleared = true;
      video.removeEventListener('canplay', onCanPlay);
      if (dashPlayer) {
        try {
          dashPlayer.reset();
        } catch (e) {
          console.warn('[MeneurTV] dash reset', e);
        }
        dashPlayer = null;
      }
      if (hls) {
        hls.destroy();
      }
      if (nativeErr) video.removeEventListener('error', nativeErr);
      if (nativeLoaded) video.removeEventListener('loadedmetadata', nativeLoaded);
      video.removeAttribute('src');
      try {
        video.load();
      } catch {
        /* ignore */
      }
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('volumechange', onVolumeChange);
    };
  }, [playUrl, autoPlay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onEnter = () => setIsNativePip(true);
    const onLeave = () => setIsNativePip(false);
    video.addEventListener('enterpictureinpicture', onEnter);
    video.addEventListener('leavepictureinpicture', onLeave);
    return () => {
      video.removeEventListener('enterpictureinpicture', onEnter);
      video.removeEventListener('leavepictureinpicture', onLeave);
    };
  }, [playUrl]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      
      if (isFull && (screen.orientation as any)?.lock) {
        try {
          (screen.orientation as any).lock('landscape').catch((err: any) => {
            console.warn("Orientation lock failed:", err);
          });
        } catch (e) {
          console.warn("Orientation lock not supported", e);
        }
      } else if (!isFull && (screen.orientation as any)?.unlock) {
        try {
          (screen.orientation as any).unlock();
        } catch (e) {
          // Ignore unlock errors
        }
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
        videoRef.current.play().catch(console.error);
      }
    }
  };

  const onVideoSurfaceClick = () => {
    if (pipNavigateOnVideoClick) {
      pipNavigateOnVideoClick();
      return;
    }
    togglePlay();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = val;
    }
    
    if (videoRef.current) {
      // Keep internal video volume at 1 if we are boosting, or sync if we are below 1
      videoRef.current.volume = val > 1 ? 1 : val;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMute = !isMuted;
      videoRef.current.muted = newMute;
      setIsMuted(newMute);
      if (newMute) {
         if (gainNodeRef.current) gainNodeRef.current.gain.value = 0;
      } else {
         if (gainNodeRef.current) gainNodeRef.current.gain.value = volume;
      }
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  const openPopoutWindow = useCallback(() => {
    const LS_PIP_LAUNCH = 'meneurtv_pip_launch';
    const stored = resolvedPlaybackUrls.length > 0 ? resolvedPlaybackUrls : rawCandidateUrls;
    if (stored.length === 0) return;
    try {
      localStorage.setItem(
        LS_PIP_LAUNCH,
        JSON.stringify({
          urls: stored,
          url: stored[0],
          poster,
          name: popoutTitle ?? undefined,
          ts: Date.now(),
        })
      );
    } catch (e) {
      console.warn('[MeneurTV] Impossible de préparer la fenêtre flottante.', e);
      return;
    }
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    const pipUrl = `${window.location.origin}${base}/pip-player`;
    const w = Math.min(560, Math.round(window.screen.availWidth * 0.45));
    const h = Math.min(320, Math.round(window.screen.availHeight * 0.38));
    const left = Math.max(0, window.screenX + window.outerWidth - w - 16);
    const top = Math.max(0, window.screenY + 72);
    const features = `width=${w},height=${h},left=${left},top=${top},popup=yes,noopener,noreferrer`;
    const win = window.open(pipUrl, 'meneurtvPip', features);
    if (!win) {
      window.alert(
        'Autorise les fenêtres popup pour ce site afin d’ouvrir le lecteur dans une fenêtre séparée (visible en changeant d’onglet ou d’appli).'
      );
    }
  }, [resolvedPlaybackUrls, rawCandidateUrls, poster, popoutTitle]);

  const toggleNativePip = async () => {
    const v = videoRef.current;
    if (!v || !canUseNativePip) return;
    try {
      if (document.pictureInPictureElement === v) {
        await document.exitPictureInPicture();
      } else {
        await v.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('[MeneurTV] PiP système indisponible (essayez sans extension ou autre navigateur).', e);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isSettingsOpen) setShowControls(false);
    }, 3000);
  };

  const changeQuality = (index: number) => {
    if (hlsInstance) {
      hlsInstance.currentLevel = index - 1; // -1 for Auto
      setQuality(index === 0 ? 'Auto' : availableQualities[index]);
      setIsSettingsOpen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={cn(
        'relative w-full aspect-video bg-black rounded-xl overflow-hidden group shadow-2xl transition-all',
        isFullscreen ? 'rounded-none' : 'ring-1 ring-white/10',
        className
      )}
    >
      <video
        ref={videoRef}
        poster={poster}
        onClick={onVideoSurfaceClick}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
        preload="auto"
        disablePictureInPicture={false}
      />

      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30 p-8 text-center">
          <div className="w-16 h-16 bg-[#e50914]/20 rounded-full flex items-center justify-center mb-4">
            <VolumeX className="w-8 h-8 text-[#e50914]" />
          </div>
          <h3 className="text-lg font-black uppercase tracking-tight mb-2">Erreur de lecture</h3>
          <p className="text-gray-400 text-sm max-w-md leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 bg-[#e50914] text-white px-6 py-2 rounded font-black text-[10px] uppercase tracking-widest shadow-xl"
          >
            Réessayer
          </button>
        </div>
      ) : isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-30">
          <Loader2 className="w-12 h-12 text-[#e50914] animate-spin mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Chargement du flux...</p>
        </div>
      )}

      {/* Persistent Live Indicator */}
      <div className={cn('absolute top-6 left-6 z-20 pointer-events-none select-none', compact && 'top-3 left-3')}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            'flex items-center gap-2 bg-[#e50914] text-white px-3 py-1.5 rounded shadow-2xl overflow-hidden relative overflow-hidden',
            compact && 'px-2 py-1'
          )}
        >
           <motion.div 
             animate={{ opacity: [1, 0.4, 1] }}
             transition={{ duration: 1.5, repeat: Infinity }}
             className="w-1.5 h-1.5 bg-white rounded-full" 
           />
           <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none pt-0.5">En Direct</span>
        </motion.div>
      </div>

      {/* Custom Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"
          >
            {/* Top Bar - Only shadow/gradient background if needed, but we keep it empty if only Live was there */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-auto">
               {/* Elements here will stay below the persistent live indicator if in the same area */}
            </div>

            {/* Bottom Controls */}
            <div
              className={cn(
                'absolute bottom-0 left-0 w-full flex items-center justify-between pointer-events-auto',
                compact ? 'p-3 pb-4' : 'p-6 pb-8 md:pb-6'
              )}
            >
              <div className="flex items-center gap-6">
                <button 
                  onClick={togglePlay}
                  className="text-white hover:text-[#e50914] transition-all hover:scale-110 active:scale-95"
                >
                  {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
                </button>

                <div 
                  className="flex items-center gap-3 group/volume"
                  onMouseEnter={() => setIsVolumeHovered(true)}
                  onMouseLeave={() => setIsVolumeHovered(false)}
                >
                  <button 
                    onClick={toggleMute}
                    className="text-white hover:text-[#e50914] transition-colors"
                  >
                    {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                  </button>
                  
                  <div className={cn(
                    "flex items-center gap-3 transition-all duration-300 overflow-hidden",
                    isVolumeHovered ? "w-32 opacity-100" : "w-0 opacity-0"
                  )}>
                    <input 
                      type="range"
                      min="0"
                      max="2"
                      step="0.05"
                      value={volume}
                      onChange={handleVolumeChange}
                      aria-label="Volume"
                      title="Volume"
                      className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#e50914]"
                    />
                    <span className={cn(
                      "text-[9px] font-black w-8",
                      volume > 1 ? "text-[#e50914]" : "text-white"
                    )}>
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className={cn('flex items-center', compact ? 'gap-3' : 'gap-6')}>
                {/* Quality Selector */}
                {availableQualities.length > 1 && (
                  <div className="relative">
                    <button 
                      onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                      className={cn(
                        "flex items-center gap-2 text-white hover:text-[#e50914] transition-colors",
                        isSettingsOpen && "text-[#e50914]"
                      )}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">{quality}</span>
                      <Settings size={20} />
                    </button>

                    <AnimatePresence>
                      {isSettingsOpen && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute bottom-full right-0 mb-4 w-40 bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                        >
                          <div className="px-4 py-3 border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-gray-500">Qualité du flux</div>
                          {availableQualities.map((q, i) => (
                            <button
                              key={q}
                              onClick={() => changeQuality(i)}
                              className={cn(
                                "w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-white/5 transition-colors",
                                quality === q ? "text-[#e50914] bg-[#e50914]/5" : "text-gray-300"
                              )}
                            >
                              {q}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {allowPopout && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPopoutWindow();
                    }}
                    className={cn(
                      'text-white hover:text-[#e50914] transition-colors touch-manipulation',
                      compact && 'p-1'
                    )}
                    title="Fenêtre flottante (autre fenêtre navigateur, pratique sur mobile et multi-onglets)"
                  >
                    <SquareArrowOutUpRight size={compact ? 20 : 22} />
                  </button>
                )}

                {showNativePipButton && canUseNativePip && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void toggleNativePip();
                    }}
                    className={cn(
                      'text-white hover:text-[#e50914] transition-colors touch-manipulation',
                      isNativePip && 'text-[#e50914]',
                      compact && 'p-1'
                    )}
                    title={isNativePip ? 'Quitter le PiP bureau' : 'PiP bureau (lecture au-dessus des fenêtres)'}
                  >
                    <PictureInPicture size={compact ? 20 : 22} />
                  </button>
                )}

                <button 
                  onClick={toggleFullscreen}
                  className="text-white hover:text-[#e50914] transition-colors"
                >
                  {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoPlayer;
