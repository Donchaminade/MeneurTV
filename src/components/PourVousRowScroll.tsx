import React, { useCallback, useEffect, useRef } from 'react';

const scrollKey = (sectionId: string) => `meneurtv_pourvous_scroll_${sectionId}`;

type Props = {
  sectionId: string;
  depsKey: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Mémorise le défilement horizontal (session) pour retrouver la position en revenant d’une fiche chaîne.
 */
export default function PourVousRowScroll({ sectionId, depsKey, className, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<number | null>(null);

  const restore = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    try {
      const raw = sessionStorage.getItem(scrollKey(sectionId));
      if (raw == null) return;
      const left = Number.parseInt(raw, 10);
      if (!Number.isFinite(left) || left < 0) return;
      requestAnimationFrame(() => {
        el.scrollLeft = Math.min(left, el.scrollWidth - el.clientWidth);
      });
    } catch {
      /* ignore */
    }
  }, [sectionId]);

  useEffect(() => {
    restore();
  }, [sectionId, depsKey, restore]);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (saveTimer.current != null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        sessionStorage.setItem(scrollKey(sectionId), String(Math.round(el.scrollLeft)));
      } catch {
        /* ignore */
      }
      saveTimer.current = null;
    }, 120);
  }, [sectionId]);

  useEffect(() => {
    return () => {
      if (saveTimer.current != null) window.clearTimeout(saveTimer.current);
    };
  }, []);

  return (
    <div ref={ref} onScroll={onScroll} className={className}>
      {children}
    </div>
  );
}
