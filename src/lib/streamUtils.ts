/**
 * Transforme une URL de lecture (ex. proxy CORS côté serveur que vous hébergez).
 * Définir dans `.env` : VITE_STREAM_PROXY_TEMPLATE=https://votre-proxy.example/?target={url}
 * Le proxy doit relayer les segments (HLS/DASH) avec les en-têtes CORS adaptés.
 * Contourner DRM ou géo-blocs sans droits reste illégal : ce mécanisme sert surtout au CORS technique.
 */
export function applyStreamProxyTemplate(rawUrl: string): string {
  const template = import.meta.env.VITE_STREAM_PROXY_TEMPLATE as string | undefined;
  if (!template || !rawUrl) return rawUrl;
  if (!template.includes('{url}')) return rawUrl;
  return template.split('{url}').join(encodeURIComponent(rawUrl));
}

/** URLs uniques conservant l’ordre (plusieurs entrées iptv-org pour une même chaîne). */
export function uniqueUrlsPreserveOrder(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    const t = (u ?? '').trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/** 0 = HLS en premier (souvent plus tolérant que DASH dans le navigateur). */
function playbackFormatRank(url: string): number {
  const path = (url.split('?')[0] ?? '').toLowerCase();
  if (path.includes('.m3u8') || path.endsWith('m3u8')) return 0;
  if (path.endsWith('.mpd')) return 1;
  return 2;
}

/** Trie en préservant l’ordre relatif à l’intérieur d’un même format (tri stable). */
export function sortUrlsForPlaybackOrder(urls: string[]): string[] {
  return [...urls]
    .map((u, index) => ({ u, index }))
    .sort((a, b) => {
      const ra = playbackFormatRank(a.u);
      const rb = playbackFormatRank(b.u);
      if (ra !== rb) return ra - rb;
      return a.index - b.index;
    })
    .map((x) => x.u);
}

export function resolvePlaybackUrlCandidates(rawUrls: string[]): string[] {
  const unique = uniqueUrlsPreserveOrder(rawUrls);
  const proxied = unique.map(applyStreamProxyTemplate);
  return sortUrlsForPlaybackOrder(proxied);
}
