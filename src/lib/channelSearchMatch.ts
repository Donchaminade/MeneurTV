import type { Channel } from './iptvApi';

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '');
}

/** Chaque mot (séparateur : espaces) doit être une sous-chaîne du texte agrégé (ex. anim → Animation). */
export function channelMatchesSmartQuery(channel: Channel, raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return true;
  const hay = stripDiacritics(
    [channel.name, channel.id, ...(channel.categories ?? []), channel.country ?? '']
      .join(' ')
      .toLowerCase()
  );
  const tokens = stripDiacritics(trimmed.toLowerCase())
    .split(/\s+/)
    .filter(Boolean);
  return tokens.every((t) => hay.includes(t));
}
