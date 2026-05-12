const storageKey = (uid: string) => `meneurtv_favorites_${uid}`;

export function readStoredFavorites(uid: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (raw === null) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

export function writeStoredFavorites(uid: string, ids: string[]): void {
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(ids));
  } catch {
    /* quota / mode privé */
  }
}

/** Lecture seule pour l’UI (sans écrire dans localStorage). */
export function getFavoriteIdsForDisplay(uid: string, cloudFavorites: string[] | undefined): string[] {
  if (localStorage.getItem(storageKey(uid)) !== null) {
    return readStoredFavorites(uid);
  }
  return Array.isArray(cloudFavorites) ? cloudFavorites : [];
}

/** Liste affichée : local si déjà initialisé, sinon miroir du cloud (puis init local). */
export function resolveFavoriteIds(uid: string, cloudFavorites: string[] | undefined): string[] {
  const key = storageKey(uid);
  const cloud = Array.isArray(cloudFavorites) ? cloudFavorites : [];
  if (localStorage.getItem(key) !== null) {
    return readStoredFavorites(uid);
  }
  writeStoredFavorites(uid, cloud);
  return cloud;
}
