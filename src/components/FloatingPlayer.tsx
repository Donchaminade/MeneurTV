import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Maximize2, GripVertical } from 'lucide-react';
import { usePiP } from '../lib/PiPContext';
import { useUser } from '../lib/UserContext';
import VideoPlayer from './VideoPlayer';
import { cn } from '../lib/utils';

const FloatingPlayer: React.FC = () => {
  const { pip, expanded, stopPip, toggleExpanded } = usePiP();
  const { profile } = useUser();
  const navigate = useNavigate();
  const dragRef = useRef({ active: false, dx: 0, dy: 0, startX: 0, startY: 0, origX: 0, origY: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!pip) setOffset({ x: 0, y: 0 });
  }, [pip?.id]);

  const onPointerDownBar = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    dragRef.current = {
      active: true,
      dx: 0,
      dy: 0,
      startX: e.clientX,
      startY: e.clientY,
      origX: offset.x,
      origY: offset.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [offset.x, offset.y]);

  const onPointerMoveBar = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
  }, []);

  const onPointerUpBar = useCallback((e: React.PointerEvent) => {
    dragRef.current.active = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const openFullChannel = useCallback(() => {
    if (!pip) return;
    navigate(`/channel/${pip.id}`);
    stopPip();
  }, [pip, navigate, stopPip]);

  if (!pip || !profile) return null;

  const activePip = pip;

  const transformStyle: React.CSSProperties = {
    transform: `translate(${offset.x}px, ${offset.y}px)`,
  };

  const shellClass = cn(
    'fixed z-[400] flex flex-col rounded-xl overflow-hidden border border-white/15 bg-black shadow-xl',
    'right-3 md:right-6 bottom-20 md:bottom-6 max-w-[calc(100vw-1.5rem)]',
    expanded ? 'w-[420px]' : 'w-[300px]'
  );

  return (
    <div style={transformStyle} className={shellClass}>
      <div
        onPointerDown={onPointerDownBar}
        onPointerMove={onPointerMoveBar}
        onPointerUp={onPointerUpBar}
        onPointerCancel={onPointerUpBar}
        className="flex items-center gap-1 px-2 py-1.5 bg-[#141414] border-b border-white/10 cursor-grab active:cursor-grabbing select-none shrink-0"
      >
        <GripVertical size={14} className="text-gray-600 shrink-0" />
        <button
          type="button"
          onClick={openFullChannel}
          className="flex-1 min-w-0 text-left text-[9px] font-black uppercase tracking-widest text-white/90 truncate hover:text-[#e50914]"
        >
          {activePip.name}
        </button>
        <button
          type="button"
          onClick={toggleExpanded}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
          title={expanded ? 'Réduire' : 'Agrandir'}
        >
          <Maximize2 size={14} />
        </button>
        <button
          type="button"
          onClick={stopPip}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/10"
          title="Fermer"
        >
          <X size={14} />
        </button>
      </div>
      <div className="relative w-full bg-black">
        <VideoPlayer
          urls={activePip.stream_urls}
          url={activePip.stream_url}
          poster={activePip.logo}
          compact
          className="rounded-none ring-0 shadow-none"
          pipNavigateOnVideoClick={openFullChannel}
          popoutTitle={activePip.name}
        />
      </div>
    </div>
  );
};

export default FloatingPlayer;
