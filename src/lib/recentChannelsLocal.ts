const STORAGE_KEY = 'meneurtv_recent_channels_v1';
const MAX = 15;

export interface RecentChannelEntry {
  id: string;
  name: string;
  logo?: string;
  at: number;
}

function readRaw(): RecentChannelEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is RecentChannelEntry =>
        x &&
        typeof x === 'object' &&
        typeof (x as RecentChannelEntry).id === 'string' &&
        typeof (x as RecentChannelEntry).name === 'string' &&
        typeof (x as RecentChannelEntry).at === 'number'
    );
  } catch {
    return [];
  }
}

function write(list: RecentChannelEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* quota / private mode */
  }
}

export function getRecentChannels(): RecentChannelEntry[] {
  return readRaw();
}

export function recordRecentChannel(entry: Omit<RecentChannelEntry, 'at'>): void {
  const at = Date.now();
  const prev = readRaw().filter((e) => e.id !== entry.id);
  write([{ ...entry, at }, ...prev].slice(0, MAX));
}
