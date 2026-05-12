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
  stream_url?: string;
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

      // Pre-enrich channels
      const streamMap = new Map<string, string>();
      this.streams.forEach(s => {
        if (s.channel) {
          const key = s.channel.toLowerCase();
          if (!streamMap.has(key)) {
            streamMap.set(key, s.url);
          }
        }
      });

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
          const idBase = idLower.split('.')[0];

          const streamUrl = streamMap.get(idLower) || 
                           streamMap.get(nameLower) ||
                           streamMap.get(idBase);
          
          const feedLangs = langsByChannel.get(idLower) ?? [];
          const legacy = Array.isArray(c.languages) ? c.languages : [];
          const mergedLangs = [...new Set([...legacy, ...feedLangs])].sort();

          return {
            ...c,
            languages: mergedLangs,
            stream_url: streamUrl,
            logo: logoMap.get(idLower) || logoMap.get(nameLower)
          };
        })
        .filter(c => !!c.stream_url);

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
