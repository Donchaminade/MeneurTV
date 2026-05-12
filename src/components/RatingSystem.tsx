import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, where, onSnapshot, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { readRatingsMap, writeUserRating } from '../lib/ratingsLocal';
import { Star, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface RatingSystemProps {
  channelId: string;
}

interface RatingData {
  userId: string;
  rating: number;
  timestamp: any;
}

const GUEST_SYNTH = '__meneurtv_local_guest__';

function mergeWithLocal(fetched: RatingData[], channelId: string, uid: string | null): RatingData[] {
  let base = [...fetched];
  if (uid) {
    const localStar = readRatingsMap(uid)[channelId];
    const fromServer = fetched.find((r) => r.userId === uid);
    base = base.filter((r) => r.userId !== uid);
    const effective = localStar !== undefined ? localStar : fromServer?.rating;
    if (effective !== undefined) {
      base.push({
        userId: uid,
        rating: effective,
        timestamp: fromServer?.timestamp ?? null,
      });
    }
  } else {
    const guestStar = readRatingsMap(null)[channelId];
    base = base.filter((r) => r.userId !== GUEST_SYNTH);
    if (guestStar !== undefined) {
      base.push({ userId: GUEST_SYNTH, rating: guestStar, timestamp: null });
    }
  }
  return base;
}

const RatingSystem: React.FC<RatingSystemProps> = ({ channelId }) => {
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const lastFetchedRef = useRef<RatingData[]>([]);

  const applyMerge = useCallback(
    (fetched: RatingData[]) => {
      lastFetchedRef.current = fetched;
      const u = auth.currentUser?.uid ?? null;
      const merged = mergeWithLocal(fetched, channelId, u);
      setRatings(merged);
      if (u) {
        const loc = readRatingsMap(u)[channelId];
        setUserRating(
          loc !== undefined ? loc : merged.find((r) => r.userId === u)?.rating ?? null
        );
      } else {
        setUserRating(readRatingsMap(null)[channelId] ?? null);
      }
      setLoading(false);
    },
    [channelId]
  );

  useEffect(() => {
    const ratingsRef = collection(db, 'ratings');
    const q = query(ratingsRef, where('channelId', '==', channelId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map((d) => d.data() as RatingData);
        applyMerge(fetched);
      },
      (error) => {
        console.warn('[MeneurTV] Notes Firestore indisponibles, affichage local uniquement.', error);
        applyMerge(lastFetchedRef.current);
      }
    );

    return unsubscribe;
  }, [channelId, applyMerge]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key || !e.key.startsWith('meneurtv_ratings')) return;
      applyMerge(lastFetchedRef.current);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [applyMerge]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(() => {
      applyMerge(lastFetchedRef.current);
    });
    return unsub;
  }, [applyMerge]);

  const handleRate = async (value: number) => {
    const u = auth.currentUser;

    setSubmitting(true);
    if (u) {
      writeUserRating(u.uid, channelId, value);
      setUserRating(value);
      applyMerge(lastFetchedRef.current);
      const ratingId = `${u.uid}_${channelId}`;
      try {
        await setDoc(doc(db, 'ratings', ratingId), {
          channelId,
          userId: u.uid,
          rating: value,
          timestamp: serverTimestamp(),
        });
      } catch (error) {
        console.warn('[MeneurTV] Note enregistrée en local ; sync cloud impossible.', error);
      }
    } else {
      writeUserRating(null, channelId, value);
      setUserRating(value);
      applyMerge(lastFetchedRef.current);
    }
    setSubmitting(false);
  };

  const averageRating =
    ratings.length > 0
      ? (ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1)
      : null;

  return (
    <div className={cn('flex flex-col gap-3', loading && 'opacity-60 pointer-events-none')}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 group/stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={submitting}
              title={`Noter ${star} sur 5`}
              aria-label={`Noter ${star} sur 5`}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              onClick={() => void handleRate(star)}
              className="relative transition-all hover:scale-125 active:scale-90 disabled:opacity-50 touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center md:min-w-0 md:min-h-0"
            >
              <Star
                size={22}
                className={cn(
                  'transition-all duration-300',
                  (hoverRating || userRating || 0) >= star
                    ? 'fill-[#e50914] text-[#e50914] drop-shadow-[0_0_8px_rgba(229,9,20,0.4)]'
                    : 'text-white/20 hover:text-white/40'
                )}
              />
            </button>
          ))}
        </div>

        {averageRating && (
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <span className="text-2xl font-display font-black text-white">{averageRating}</span>
            <div className="flex flex-col text-[8px] font-black uppercase tracking-widest text-gray-400 leading-tight">
              <span className="text-[#e50914]">{ratings.length} AVIS</span>
              <span>UTILISATEURS</span>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {submitting && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#e50914]"
          >
            <Loader2 size={12} className="animate-spin" /> Enregistrement...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RatingSystem;
