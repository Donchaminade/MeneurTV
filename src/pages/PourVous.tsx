import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Play, Sparkles, Tv, Shuffle, History, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { iptvService, type Channel } from '../lib/iptvApi';
import {
  POUR_VOUS_SECTIONS,
  buildPourVousRows,
  applyPourVousClientFilters,
  pickSpotlightChannels,
  pourVousCuratedPool,
  type PourVousClientFilters,
} from '../lib/pourVousCurated';
import { useUser } from '../lib/UserContext';
import { getFavoriteIdsForDisplay } from '../lib/favoritesLocal';
import { getRecentChannels, type RecentChannelEntry } from '../lib/recentChannelsLocal';
import PourVousRowScroll from '../components/PourVousRowScroll';

const selectFieldClass =
  'w-full rounded-lg py-2.5 pl-3 pr-3 text-xs font-bold appearance-none focus:outline-none focus:border-[#e50914] ' +
  'border border-white/10 bg-[#141414] text-white [color-scheme:dark]';

const PourVous: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, user, toggleFavorite } = useUser();

  const [country, setCountry] = useState('all');
  const [frenchOnly, setFrenchOnly] = useState(false);
  const [logoOnly, setLogoOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [heroSeed, setHeroSeed] = useState(() => Math.floor(Date.now() / 60000));

  const [subsectionBySection, setSubsectionBySection] = useState<Record<string, string>>(() =>
    Object.fromEntries(POUR_VOUS_SECTIONS.map((s) => [s.id, 'all']))
  );

  const favoriteIds = useMemo(() => {
    if (!user) return [];
    return getFavoriteIdsForDisplay(user.uid, profile?.favorites);
  }, [user, profile?.favorites]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await iptvService.loadData();
      if (!cancelled) {
        setChannels(iptvService.getEnrichedChannels());
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const snapshotSubsAll = useMemo(
    () => Object.fromEntries(POUR_VOUS_SECTIONS.map((s) => [s.id, 'all'] as const)),
    []
  );

  const countryOptions = useMemo(() => {
    const pool = pourVousCuratedPool(channels, snapshotSubsAll);
    const set = new Set(pool.map((c) => c.country).filter(Boolean) as string[]);
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [channels, snapshotSubsAll]);

  const clientFilters: PourVousClientFilters = useMemo(
    () => ({
      country,
      frenchOnly,
      logoOnly,
      favoritesOnly,
      favoriteIds,
    }),
    [country, frenchOnly, logoOnly, favoritesOnly, favoriteIds]
  );

  const rows = useMemo(() => {
    const raw = buildPourVousRows(channels, subsectionBySection);
    return raw.map(({ section, channels: list }) => ({
      section,
      channels: applyPourVousClientFilters(list, clientFilters),
    }));
  }, [channels, subsectionBySection, clientFilters]);

  const filterDepsKey = useMemo(
    () =>
      JSON.stringify({
        subsectionBySection,
        country,
        frenchOnly,
        logoOnly,
        favoritesOnly,
        favCount: favoriteIds.length,
      }),
    [subsectionBySection, country, frenchOnly, logoOnly, favoritesOnly, favoriteIds.length]
  );

  const spotlightPool = useMemo(() => {
    const map = new Map<string, Channel>();
    for (const r of rows) {
      for (const ch of r.channels) map.set(ch.id, ch);
    }
    return [...map.values()];
  }, [rows]);

  const spotlight = useMemo(
    () => pickSpotlightChannels(spotlightPool, 3, heroSeed),
    [spotlightPool, heroSeed]
  );

  const recentResolved = useMemo(() => {
    const entries = getRecentChannels();
    const out: { entry: RecentChannelEntry; channel: Channel }[] = [];
    for (const e of entries) {
      const ch = channels.find((c) => c.id === e.id);
      if (ch) out.push({ entry: e, channel: ch });
    }
    return out.slice(0, 12);
  }, [channels]);

  const totalMatches = useMemo(() => rows.reduce((n, r) => n + r.channels.length, 0), [rows]);

  const inPourVousSelection = useCallback(
    (ch: Channel) => spotlightPool.some((x) => x.id === ch.id),
    [spotlightPool]
  );

  const favInSelectionCount = useMemo(
    () => spotlightPool.filter((c) => favoriteIds.includes(c.id)).length,
    [spotlightPool, favoriteIds]
  );

  if (loading) {
    return (
      <div className="space-y-12">
        <div className="h-32 w-full max-w-2xl bg-white/5 animate-pulse rounded-2xl" />
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <div className="h-7 w-56 bg-white/5 animate-pulse rounded" />
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="h-44 w-36 shrink-0 bg-white/5 animate-pulse rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-8">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#e50914]/30 bg-[#e50914]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#e50914]">
          <Sparkles size={14} aria-hidden />
          Sélection
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight uppercase">
          Pour <span className="text-[#e50914]">Vous</span>
        </h1>

        <div
          role="note"
          className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-gray-400 leading-relaxed max-w-3xl"
        >
          <Info size={18} className="shrink-0 text-[#e50914]/80 mt-0.5" aria-hidden />
          <p>
            Contenu indicatif basé sur le catalogue{' '}
            <span className="text-white/80 font-semibold">iptv-org</span> : les chaînes listées et les flux peuvent
            changer sans préavis. Aucune garantie d’émission ou de langue sur le flux ; les filtres langue / logo
            s’appuient sur les métadonnées connues.
          </p>
        </div>

        <p className="max-w-2xl text-sm sm:text-base text-gray-400 leading-relaxed">
          Films, sport, séries et animés — avec sous-types, filtres et raccourcis vers vos dernières consultations.
        </p>

        <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
          <span className="text-[#e50914]/90">{totalMatches}</span>
          {` chaîne${totalMatches !== 1 ? 's' : ''} affichée${totalMatches !== 1 ? 's' : ''}`}
          {user && favInSelectionCount > 0 && (
            <span className="ml-2 text-gray-400">
              • <span className="text-white/80">{favInSelectionCount}</span> en favoris (sélection actuelle)
            </span>
          )}
        </div>

        <div className="flex flex-col xl:flex-row xl:items-end gap-4 p-4 rounded-2xl border border-white/10 bg-[#0c0c0c]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
            <label className="flex flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-gray-500">
              Pays
              <select
                className={selectFieldClass}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="all">Tous</option>
                {countryOptions.map((code) => (
                  <option key={code} value={code} className="bg-[#141414] text-white">
                    {code}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none mt-5 sm:mt-7">
              <input
                type="checkbox"
                checked={frenchOnly}
                onChange={(e) => setFrenchOnly(e.target.checked)}
                className="rounded border-white/20 bg-[#141414] text-[#e50914] focus:ring-[#e50914]"
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Langue fra</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none mt-5 sm:mt-7">
              <input
                type="checkbox"
                checked={logoOnly}
                onChange={(e) => setLogoOnly(e.target.checked)}
                className="rounded border-white/20 bg-[#141414] text-[#e50914] focus:ring-[#e50914]"
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Avec logo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none mt-5 sm:mt-7">
              <input
                type="checkbox"
                checked={favoritesOnly}
                onChange={(e) => setFavoritesOnly(e.target.checked)}
                disabled={!user}
                className="rounded border-white/20 bg-[#141414] text-[#e50914] focus:ring-[#e50914] disabled:opacity-40"
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Mes favoris</span>
            </label>
          </div>
          <button
            type="button"
            onClick={() => setHeroSeed((s) => s + 1)}
            className="inline-flex items-center justify-center gap-2 self-start xl:self-auto px-4 py-2.5 rounded-lg border border-white/15 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white hover:border-[#e50914]/50 transition-colors"
          >
            <Shuffle size={16} className="text-[#e50914]" aria-hidden />
            Nouvelle « À la une »
          </button>
        </div>

        {totalMatches === 0 && (
          <p className="text-sm text-amber-200/90 border border-amber-500/30 bg-amber-500/10 rounded-xl px-4 py-3 max-w-2xl">
            Aucune chaîne ne correspond à ces critères. Réinitialisez les filtres ou changez de sous-type.
          </p>
        )}
      </header>

      {spotlight.length > 0 && (
        <section className="space-y-4" aria-labelledby="pourvous-spotlight">
          <div className="flex items-center justify-between gap-4">
            <h2 id="pourvous-spotlight" className="text-lg font-display font-black uppercase tracking-tight">
              À la <span className="text-[#e50914]">une</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {spotlight.map((channel) => (
              <Link
                key={channel.id}
                to={`/channel/${encodeURIComponent(channel.id)}`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#e50914]/15 to-[#0f0f0f] p-1 hover:border-[#e50914]/40 transition-colors"
              >
                <div className="flex items-center gap-4 rounded-xl bg-black/40 p-4">
                  <div className="h-16 w-24 shrink-0 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                    {channel.logo ? (
                      <img src={channel.logo} alt="" className="max-h-full max-w-full object-contain p-2" />
                    ) : (
                      <Tv size={28} className="text-gray-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black uppercase tracking-tight truncate">{channel.name}</p>
                    <p className="text-[10px] font-bold text-gray-500 mt-1">{channel.country}</p>
                  </div>
                  <Play size={22} className="text-white shrink-0 opacity-60 group-hover:opacity-100" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {recentResolved.length > 0 && (
        <section className="space-y-4" aria-labelledby="pourvous-recent">
          <div className="flex items-center gap-2">
            <History size={18} className="text-[#e50914]" aria-hidden />
            <h2 id="pourvous-recent" className="text-lg font-display font-black uppercase tracking-tight">
              Reprendre
            </h2>
          </div>
          <PourVousRowScroll sectionId="recent" depsKey={filterDepsKey} className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar snap-x">
            {recentResolved.map(({ entry, channel }) => (
              <Link
                key={entry.id + entry.at}
                to={`/channel/${encodeURIComponent(channel.id)}`}
                className={`group snap-start shrink-0 w-[44vw] max-w-[200px] rounded-xl border bg-[#0f0f0f] overflow-hidden transition-all hover:border-[#e50914]/40 ${
                  inPourVousSelection(channel) ? 'border-[#e50914]/50 ring-1 ring-[#e50914]/30' : 'border-white/10'
                }`}
              >
                <div className="aspect-video flex items-center justify-center p-4 bg-white/[0.04]">
                  {channel.logo ? (
                    <img src={channel.logo} alt="" className="max-h-full max-w-full object-contain" loading="lazy" />
                  ) : (
                    <Tv size={32} className="text-gray-700" />
                  )}
                </div>
                <div className="p-2.5 border-t border-white/5">
                  <p className="text-[11px] font-black truncate">{channel.name}</p>
                  <p className="text-[9px] text-gray-600 mt-0.5">Récent</p>
                </div>
              </Link>
            ))}
          </PourVousRowScroll>
        </section>
      )}

      <div className="space-y-16">
        {rows.map(({ section, channels: list }, idx) => (
          <motion.section
            key={section.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.32 }}
            className="space-y-4"
            aria-labelledby={`pourvous-${section.id}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h2 id={`pourvous-${section.id}`} className="text-xl sm:text-2xl font-display font-black uppercase tracking-tight">
                  {section.title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">{section.subtitle}</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 shrink-0">
                {list.length} chaîne{list.length !== 1 ? 's' : ''}
              </span>
            </div>

            {section.subsections && section.subsections.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSubsectionBySection((m) => ({ ...m, [section.id]: 'all' }))}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors ${
                    (subsectionBySection[section.id] ?? 'all') === 'all'
                      ? 'bg-[#e50914] border-[#e50914] text-white'
                      : 'bg-transparent border-white/10 text-gray-400 hover:border-white/25'
                  }`}
                >
                  Tout
                </button>
                {section.subsections.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSubsectionBySection((m) => ({ ...m, [section.id]: sub.id }))}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors ${
                      subsectionBySection[section.id] === sub.id
                        ? 'bg-[#e50914] border-[#e50914] text-white'
                        : 'bg-transparent border-white/10 text-gray-400 hover:border-white/25'
                    }`}
                  >
                    {sub.title}
                  </button>
                ))}
              </div>
            )}

            {list.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Aucune chaîne dans cette catégorie avec les filtres actuels.</p>
            ) : (
              <PourVousRowScroll
                sectionId={section.id}
                depsKey={`${filterDepsKey}-${subsectionBySection[section.id] ?? 'all'}`}
                className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 hide-scrollbar snap-x snap-mandatory"
              >
                {list.map((channel) => {
                  const isFav = favoriteIds.includes(channel.id);
                  return (
                    <Link
                      key={channel.id}
                      to={`/channel/${encodeURIComponent(channel.id)}`}
                      className={`group snap-start shrink-0 w-[42vw] max-w-[200px] sm:max-w-[220px] rounded-xl overflow-hidden border transition-all hover:shadow-xl hover:shadow-black/40 ${
                        isFav
                          ? 'border-[#e50914]/45 ring-1 ring-[#e50914]/25 bg-[#0f0f0f]'
                          : 'border-white/5 bg-[#0f0f0f] hover:border-[#e50914]/40'
                      }`}
                    >
                      <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
                        {channel.logo ? (
                          <img
                            src={channel.logo}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            width={440}
                            height={248}
                            className="w-full h-full object-contain p-5 group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tv size={36} className="text-gray-700" />
                          </div>
                        )}
                        {isFav && (
                          <span className="absolute top-2 left-2 z-10 rounded bg-[#e50914] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-white shadow">
                            Fav
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(channel.id);
                          }}
                          aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/60 border border-white/10 text-white/50 hover:text-[#e50914] transition-colors"
                        >
                          <Heart size={16} className={isFav ? 'fill-[#e50914] text-[#e50914]' : ''} />
                        </button>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-black shadow-lg scale-90 group-hover:scale-100 transition-transform">
                            <Play size={18} fill="black" className="ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3 border-t border-white/5">
                        <div className="font-black text-xs truncate tracking-tight">{channel.name}</div>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest truncate">
                            {channel.country}
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-[#e50914]/90 shrink-0">
                            {section.title}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </PourVousRowScroll>
            )}
          </motion.section>
        ))}
      </div>
    </div>
  );
};

export default PourVous;
