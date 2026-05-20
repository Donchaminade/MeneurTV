import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export interface PipChannelPayload {
  id: string;
  name: string;
  stream_url: string;
  /** Toutes les URLs candidates (repli dans le lecteur). */
  stream_urls?: string[];
  logo?: string;
}

interface PiPContextValue {
  pip: PipChannelPayload | null;
  expanded: boolean;
  startPip: (channel: PipChannelPayload) => void;
  stopPip: () => void;
  toggleExpanded: () => void;
}

const PiPContext = createContext<PiPContextValue | undefined>(undefined);

export const PiPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pip, setPip] = useState<PipChannelPayload | null>(null);
  const [expanded, setExpanded] = useState(false);

  const startPip = useCallback((channel: PipChannelPayload) => {
    const primary = channel.stream_urls?.[0] ?? channel.stream_url;
    if (!primary) return;
    const list =
      channel.stream_urls && channel.stream_urls.length > 0
        ? channel.stream_urls
        : [channel.stream_url];
    setPip({
      id: channel.id,
      name: channel.name,
      stream_url: primary,
      stream_urls: list,
      logo: channel.logo,
    });
    setExpanded(false);
  }, []);

  const stopPip = useCallback(() => {
    setPip(null);
    setExpanded(false);
  }, []);

  const toggleExpanded = useCallback(() => {
    setExpanded((e) => !e);
  }, []);

  const value = useMemo(
    () => ({ pip, expanded, startPip, stopPip, toggleExpanded }),
    [pip, expanded, startPip, stopPip, toggleExpanded]
  );

  return <PiPContext.Provider value={value}>{children}</PiPContext.Provider>;
};

export function usePiP() {
  const ctx = useContext(PiPContext);
  if (!ctx) throw new Error('usePiP must be used within PiPProvider');
  return ctx;
}
