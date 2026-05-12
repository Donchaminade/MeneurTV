const GUEST_KEY = 'meneurtv_ratings_guest';
const USER_PREFIX = 'meneurtv_ratings_';

function storageKey(uid: string | null): string {
  return uid ? `${USER_PREFIX}${uid}` : GUEST_KEY;
}

/** Carte channelId → note 1–5 pour ce navigateur (connecté ou invité). */
export function readRatingsMap(uid: string | null): Record<string, number> {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return {};
    const p = JSON.parse(raw) as unknown;
    if (typeof p !== 'object' || p === null) return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(p as Record<string, unknown>)) {
      const n = typeof v === 'number' ? v : Number(v);
      if (typeof k === 'string' && Number.isFinite(n) && n >= 1 && n <= 5) out[k] = Math.round(n);
    }
    return out;
  } catch {
    return {};
  }
}

export function writeUserRating(uid: string | null, channelId: string, rating: number): void {
  const r = Math.min(5, Math.max(1, Math.round(rating)));
  const map = readRatingsMap(uid);
  map[channelId] = r;
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(map));
  } catch {
    /* quota */
  }
}
