import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Settings, Maximize, Minimize, Volume2, VolumeX, Play, Pause, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface VideoPlayerProps {
  url: string;
  poster?: string;
  autoPlay?: boolean;
  /** Lecteur compact (mini fenêtre) */
  compact?: boolean;
  className?: string;
  /** Mini-lecteur : clic sur la vidéo = retour page chaîne */
  pipNavigateOnVideoClick?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  poster,
  autoPlay = true,
  compact = false,
  className,
  pipNavigateOnVideoClick,
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

  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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
    setError(null);
    setIsLoading(true);

    const handleLevelLoaded = (_: any, data: any) => {
      if (hls) {
        const levels = hls.levels;
        const qualities = levels.map((l, i) => `${l.height}p`);
        setAvailableQualities(['Auto', ...qualities]);
      }
    };

    const handleError = (_: any, data: any) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.error("Fatal network error encountered, trying to recover");
            hls?.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.error("Fatal media error encountered, trying to recover");
            hls?.recoverMediaError();
            break;
          default:
            console.error("Fatal error, cannot recover");
            setError("Impossible de charger le flux vidéo.");
            hls?.destroy();
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

    const onCanPlay = () => tryClearLoading();
    video.addEventListener('canplay', onCanPlay, { once: true });

    if (Hls.isSupported()) {
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
      hls.loadSource(url);
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
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        tryClearLoading();
        if (autoPlay) video.play().catch(console.error);
      });
      video.addEventListener('error', () => {
        setError("Erreur de lecture vidéo.");
      });
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
      if (hls) {
        hls.destroy();
      }
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('volumechange', onVolumeChange);
    };
  }, [url, autoPlay]);

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
      />

      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30 p-8 text-center">
          <div className="w-16 h-16 bg-[#e50914]/20 rounded-full flex items-center justify-center mb-4">
            <VolumeX className="w-8 h-8 text-[#e50914]" />
          </div>
          <h3 className="text-lg font-black uppercase tracking-tight mb-2">Erreur de lecture</h3>
          <p className="text-gray-400 text-sm max-w-xs">{error}</p>
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

              <div className="flex items-center gap-6">
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
