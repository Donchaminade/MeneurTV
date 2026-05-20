import type { Channel } from './iptvApi';

export interface PourVousSubsection {
  id: string;
  title: string;
  keywords: string[];
}

export interface PourVousSection {
  id: string;
  title: string;
  subtitle: string;
  keywords: string[];
  subsections?: PourVousSubsection[];
}

/**
 * Sélection éditoriale francophone — recoupe l’offre iptv-org disponible dans l’app.
 * Les sous-filtres affinent sans exclure le reste du catalogue quand « Tout » est actif.
 */
export const POUR_VOUS_SECTIONS: PourVousSection[] = [
  {
    id: 'films',
    title: 'Films & cinéma',
    subtitle: 'Canal+, Ciné+, Arte, Paramount, TCM, OCS…',
    keywords: [
      'canal+',
      'canalplus',
      'ciné+',
      'cine+',
      'cine plus',
      'arte',
      'paramount',
      'tcm',
      'ocs',
      'cinemax',
      'cinéma',
      'cinema',
      '13ème rue',
      '13eme rue',
      'serie club',
    ],
    subsections: [
      {
        id: 'bouquet',
        title: 'Bouquets FR',
        keywords: ['canal+', 'canalplus', 'ciné+', 'cine+', 'cine plus', 'ocs', '13ème rue', '13eme rue', 'serie club', 'arte'],
      },
      {
        id: 'international',
        title: 'Ciné US / UK',
        keywords: ['paramount', 'tcm', 'cinemax', 'hbo', 'hbo max', 'cinéma', 'cinema'],
      },
    ],
  },
  {
    id: 'sport',
    title: 'Foot & sport',
    subtitle:
      'TF1 · M6 · Canal+ (FR) · L’Équipe · beIN · Canal+ Sport · RMC Sport · DAZN · Eurosport (présence selon flux iptv-org)',
    keywords: [
      'bein',
      'bein sport',
      'bein sports',
      'beinsportsxtra',
      'canal+ sport',
      'canalplus sport',
      'canalplus.fr',
      'rmc sport',
      'eurosport',
      'eurosport 1',
      'eurosport 2',
      'l’équipe',
      "l'équipe",
      'lequipe',
      'equipe 21',
      'sport en france',
      'infosport+',
      'infosport plus',
      'foot+',
      'foot plus',
      'ligue 1',
      'ligue1',
      'dazn',
      'dazn combat',
      'rugby',
      'formula',
      'grand prix',
      'moto gp',
      'motogp',
      'tf1',
      'tf1+',
      'tf1.fr',
      'm6',
      'm6.fr',
      'france 2',
      'france2',
      'france 3',
      'france3',
    ],
    subsections: [
      {
        id: 'foot',
        title: 'Foot',
        keywords: [
          'bein',
          'bein sport',
          'bein sports',
          'beinsportsxtra',
          'canal+ sport',
          'canalplus sport',
          'canalplus.fr',
          'rmc sport',
          'eurosport',
          'eurosport 1',
          'eurosport 2',
          'l’équipe',
          "l'équipe",
          'lequipe',
          'equipe 21',
          'foot+',
          'foot plus',
          'ligue 1',
          'ligue1',
          'dazn',
          'dazn combat',
          'sport en france',
          'infosport+',
          'infosport plus',
        ],
      },
      {
        id: 'fff_multiplex',
        title: 'FFF & généralistes',
        keywords: [
          'tf1',
          'tf1+',
          'tf1.fr',
          'm6',
          'm6.fr',
          'france 2',
          'france2',
          'france 3',
          'france3',
          'canalplus.fr',
          'w9',
        ],
      },
      {
        id: 'rugby',
        title: 'Rugby',
        keywords: ['rugby', 'top 14', 'top14', 'h cup', 'european rugby'],
      },
      {
        id: 'auto',
        title: 'F1 & auto',
        keywords: ['formula', 'f1', 'grand prix', 'moto gp', 'motogp', 'automoto', 'auto moto', 'wec', 'nascar'],
      },
    ],
  },
  {
    id: 'series',
    title: 'Séries',
    subtitle: 'TF1, France Télévisions, M6, Canal+ Séries, plateformes en VF…',
    keywords: [
      'arte',
      'france 2',
      'france2',
      'france 3',
      'france3',
      'france 4',
      'france4',
      'france 5',
      'france5',
      'tf1',
      'tf1+',
      'm6',
      'w9',
      '6ter',
      'canal+ series',
      'canalplus series',
      'canal+ séries',
      'canalplus séries',
      'netflix',
      'prime video',
      'amazon prime',
      'disney+',
      'disney plus',
      'apple tv',
      'paramount+',
      'hbo max',
      'hbo',
    ],
    subsections: [
      {
        id: 'tnt',
        title: 'TNT & généralistes',
        keywords: [
          'arte',
          'france 2',
          'france2',
          'france 3',
          'france3',
          'france 4',
          'france4',
          'france 5',
          'france5',
          'tf1',
          'tf1+',
          'm6',
          'w9',
          '6ter',
        ],
      },
      {
        id: 'streaming',
        title: 'Streaming',
        keywords: [
          'netflix',
          'prime video',
          'amazon prime',
          'disney+',
          'disney plus',
          'apple tv',
          'paramount+',
          'hbo max',
          'hbo',
          'canal+ series',
          'canalplus series',
          'canal+ séries',
          'canalplus séries',
        ],
      },
    ],
  },
  {
    id: 'anime',
    title: 'Animés & jeunesse',
    subtitle: 'Crunchyroll, ADN, Disney, Télétoon, Mangas…',
    keywords: [
      'crunchyroll',
      'animation digital',
      'adn',
      'j-one',
      'mangas',
      'manga',
      'teletoon',
      'télétoon',
      'gulli',
      'disney channel',
      'disney junior',
      'nickelodeon',
      'cartoon network',
      'boing',
      'toonami',
      'anime',
    ],
    subsections: [
      {
        id: 'anime',
        title: 'Animé',
        keywords: ['crunchyroll', 'animation digital', 'adn', 'j-one', 'mangas', 'manga', 'toonami', 'anime'],
      },
      {
        id: 'kids',
        title: 'Jeunesse',
        keywords: [
          'gulli',
          'disney channel',
          'disney junior',
          'nickelodeon',
          'cartoon network',
          'boing',
          'teletoon',
          'télétoon',
        ],
      },
    ],
  },
];

function channelHaystack(c: Channel): string {
  const parts = [c.name, c.id, ...(c.alt_names ?? [])];
  return parts.join(' ').toLowerCase();
}

export function matchPourVousKeywords(ch: Channel, keywords: string[]): boolean {
  const hay = channelHaystack(ch);
  return keywords.some((kw) => hay.includes(kw.toLowerCase()));
}

function dedupeSort(list: Channel[]): Channel[] {
  const seen = new Set<string>();
  const out: Channel[] = [];
  for (const ch of list) {
    if (seen.has(ch.id)) continue;
    seen.add(ch.id);
    out.push(ch);
  }
  out.sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  return out;
}

export function channelsForSection(
  allChannels: Channel[],
  section: PourVousSection,
  subsectionId: string
): Channel[] {
  if (subsectionId !== 'all' && section.subsections?.length) {
    const sub = section.subsections.find((s) => s.id === subsectionId);
    if (sub) {
      return dedupeSort(allChannels.filter((c) => matchPourVousKeywords(c, sub.keywords)));
    }
  }

  if (subsectionId === 'all' && section.subsections?.length) {
    const seen = new Set<string>();
    const out: Channel[] = [];
    for (const ch of allChannels) {
      if (seen.has(ch.id)) continue;
      const inSection = matchPourVousKeywords(ch, section.keywords);
      const inAnySub = section.subsections.some((sub) => matchPourVousKeywords(ch, sub.keywords));
      if (inSection || inAnySub) {
        seen.add(ch.id);
        out.push(ch);
      }
    }
    return dedupeSort(out);
  }

  return dedupeSort(allChannels.filter((c) => matchPourVousKeywords(c, section.keywords)));
}

export type PourVousClientFilters = {
  country: string;
  frenchOnly: boolean;
  logoOnly: boolean;
  favoritesOnly: boolean;
  favoriteIds: string[];
};

export function applyPourVousClientFilters(list: Channel[], f: PourVousClientFilters): Channel[] {
  return list.filter((c) => {
    if (f.country !== 'all' && c.country !== f.country) return false;
    if (f.frenchOnly && !(c.languages ?? []).includes('fra')) return false;
    if (f.logoOnly && !c.logo) return false;
    if (f.favoritesOnly && !f.favoriteIds.includes(c.id)) return false;
    return true;
  });
}

export function buildPourVousRows(
  channels: Channel[],
  subsectionBySectionId: Record<string, string>
): { section: PourVousSection; channels: Channel[] }[] {
  return POUR_VOUS_SECTIONS.map((section) => ({
    section,
    channels: channelsForSection(channels, section, subsectionBySectionId[section.id] ?? 'all'),
  }));
}

export function pourVousCuratedPool(
  channels: Channel[],
  subsectionBySectionId: Record<string, string>
): Channel[] {
  const map = new Map<string, Channel>();
  for (const section of POUR_VOUS_SECTIONS) {
    const id = subsectionBySectionId[section.id] ?? 'all';
    for (const ch of channelsForSection(channels, section, id)) {
      map.set(ch.id, ch);
    }
  }
  return [...map.values()];
}

/** Mélange déterministe (seed) pour la zone « À la une ». */
export function pickSpotlightChannels(pool: Channel[], count: number, seed: number): Channel[] {
  if (pool.length <= count) return pool;
  const arr = [...pool];
  let s = Math.abs(seed) % 2147483647 || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 48271) % 2147483647;
    const j = s % (i + 1);
    const t = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = t;
  }
  return arr.slice(0, count);
}
