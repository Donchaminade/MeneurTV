export interface Channel {
  id: string;
  name: string;
  alt_names: string[];
  network: string | null;
  owners: string[];
  country: string;
  languages: string[];
  categories: string[];
  is_nsfw: boolean;
  launched: string | null;
  closed: string | null;
  replaced_by: string | null;
  website: string | null;
  logo?: string;
  /** Premier flux (rétrocompat). */
  stream_url?: string;
  /** Toutes les URLs listées sur iptv-org pour cette chaîne (essais successifs côté lecteur). */
  stream_urls?: string[];
}

export interface Stream {
  channel: string;
  url: string;
  quality?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Language {
  name: string;
  code: string;
}

/** Depuis avril 2025, les langues ne sont plus sur `channels` mais sur les flux (`feeds.json`). */
export interface Feed {
  channel: string;
  id: string;
  languages?: string[];
}

const BASE_URL = 'https://iptv-org.github.io/api';

function mergeLanguagesByChannel(feeds: Feed[]): Map<string, string[]> {
  const byChannel = new Map<string, Set<string>>();
  for (const f of feeds) {
    if (!f.channel || !Array.isArray(f.languages) || f.languages.length === 0) continue;
    const key = f.channel.toLowerCase();
    let set = byChannel.get(key);
    if (!set) {
      set = new Set();
      byChannel.set(key, set);
    }
    for (const code of f.languages) {
      if (code) set.add(code);
    }
  }
  const out = new Map<string, string[]>();
  for (const [k, set] of byChannel) {
    out.set(k, [...set].sort());
  }
  return out;
}

class IPTVService {
  private channels: Channel[] = [];
  private streams: Stream[] = [];
  private logos: any[] = [];
  private categories: Category[] = [];
  private languages: Language[] = [];
  private countries: any[] = [];

  private isLoaded = false;
  private enrichedChannels: Channel[] = [];

  async loadData() {
    if (this.isLoaded) return;

    try {
      console.log("Fetching IPTV data...");
      
      const fetchJson = async (url: string) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
        return response.json();
      };

      const [channels, streams, logos, categories, languages, countries, feeds] = await Promise.all([
        fetchJson(`${BASE_URL}/channels.json`),
        fetchJson(`${BASE_URL}/streams.json`),
        fetchJson(`${BASE_URL}/logos.json`),
        fetchJson(`${BASE_URL}/categories.json`),
        fetchJson(`${BASE_URL}/languages.json`),
        fetchJson(`${BASE_URL}/countries.json`),
        fetchJson(`${BASE_URL}/feeds.json`) as Promise<Feed[]>,
      ]);

      this.channels = channels;
      this.streams = streams;
      this.logos = logos;
      this.categories = categories;
      this.languages = languages;
      this.countries = countries;

      const langsByChannel = mergeLanguagesByChannel(feeds);

      const streamsByChannel = new Map<string, string[]>();
      for (const s of this.streams) {
        if (!s.channel || !s.url) continue;
        const key = s.channel.toLowerCase();
        const list = streamsByChannel.get(key) ?? [];
        if (!list.includes(s.url)) list.push(s.url);
        streamsByChannel.set(key, list);
      }

      const extraStreamsUrl = import.meta.env.VITE_EXTRA_STREAMS_URL as string | undefined;
      if (extraStreamsUrl?.trim()) {
        try {
          const extra = await fetchJson(extraStreamsUrl.trim());
          if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
            for (const [chId, val] of Object.entries(extra as Record<string, unknown>)) {
              const key = chId.toLowerCase();
              const urlsToAdd: string[] = [];
              if (typeof val === 'string' && val.trim()) urlsToAdd.push(val.trim());
              else if (Array.isArray(val)) {
                for (const u of val) {
                  if (typeof u === 'string' && u.trim()) urlsToAdd.push(u.trim());
                }
              }
              if (urlsToAdd.length === 0) continue;
              const list = streamsByChannel.get(key) ?? [];
              for (const u of urlsToAdd) {
                if (!list.includes(u)) list.push(u);
              }
              streamsByChannel.set(key, list);
            }
          }
        } catch (e) {
          console.warn('[MeneurTV] VITE_EXTRA_STREAMS_URL : fusion impossible', e);
        }
      }

      const collectStreamUrls = (c: Channel): string[] => {
        const idLower = c.id.toLowerCase();
        const nameLower = c.name.toLowerCase();
        const idBase = idLower.split('.')[0];
        const seen = new Set<string>();
        const out: string[] = [];
        for (const key of [idLower, nameLower, idBase]) {
          const list = streamsByChannel.get(key);
          if (!list) continue;
          for (const u of list) {
            if (seen.has(u)) continue;
            seen.add(u);
            out.push(u);
          }
        }
        return out;
      };

      const logoMap = new Map<string, string>();
      this.logos.forEach(l => {
        if (l.channel) {
          const key = l.channel.toLowerCase();
          if (!logoMap.has(key)) {
            logoMap.set(key, l.url);
          }
        }
      });

      this.enrichedChannels = this.channels
        .filter(c => !c.is_nsfw)
        .map(c => {
          const idLower = c.id.toLowerCase();
          const nameLower = c.name.toLowerCase();

          const streamUrls = collectStreamUrls(c);
          const streamUrl = streamUrls[0];

          const feedLangs = langsByChannel.get(idLower) ?? [];
          const legacy = Array.isArray(c.languages) ? c.languages : [];
          const mergedLangs = [...new Set([...legacy, ...feedLangs])].sort();

          return {
            ...c,
            languages: mergedLangs,
            stream_urls: streamUrls,
            stream_url: streamUrl,
            logo: logoMap.get(idLower) || logoMap.get(nameLower)
          };
        })
        .filter(c => (c.stream_urls?.length ?? 0) > 0);

      this.isLoaded = true;
      console.log(`IPTV data loaded: ${this.enrichedChannels.length} enriched channels`);
    } catch (error) {
      console.error("Failed to load IPTV data:", error);
      this.isLoaded = true;
    }
  }

  getEnrichedChannels(): Channel[] {
    return this.enrichedChannels;
  }

  getCategories() {
    return this.categories;
  }

  getLanguages() {
    return this.languages;
  }

  getCountries() {
    return this.countries;
  }
}

export const iptvService = new IPTVService();
