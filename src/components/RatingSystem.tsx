import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, setDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Star, StarOff, Loader2 } from 'lucide-react';
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

const RatingSystem: React.FC<RatingSystemProps> = ({ channelId }) => {
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    const ratingsRef = collection(db, 'ratings');
    const q = query(ratingsRef, where('channelId', '==', channelId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRatings = snapshot.docs.map(doc => doc.data() as RatingData);
      setRatings(fetchedRatings);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'ratings');
    });

    return unsubscribe;
  }, [channelId]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (u) {
        const myRating = ratings.find(r => r.userId === u.uid);
        if (myRating) setUserRating(myRating.rating);
      } else {
        setUserRating(null);
      }
    });
    return unsubscribe;
  }, [ratings]);

  const handleRate = async (value: number) => {
    if (!auth.currentUser) {
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 3000);
      return;
    }

    setSubmitting(true);
    const ratingId = `${auth.currentUser.uid}_${channelId}`;
    try {
      await setDoc(doc(db, 'ratings', ratingId), {
        channelId,
        userId: auth.currentUser.uid,
        rating: value,
        timestamp: serverTimestamp(),
      });
      setUserRating(value);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `ratings/${ratingId}`);
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = ratings.length > 0
    ? (ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1)
    : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 group/stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              disabled={submitting}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              onClick={() => handleRate(star)}
              className="relative transition-all hover:scale-125 active:scale-90 disabled:opacity-50"
            >
              <Star
                size={22}
                className={cn(
                  "transition-all duration-300",
                  (hoverRating || userRating || 0) >= star
                    ? "fill-[#e50914] text-[#e50914] drop-shadow-[0_0_8px_rgba(229,9,20,0.4)]"
                    : "text-white/20 hover:text-white/40"
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
        {showLoginPrompt && (
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-[9px] font-black uppercase tracking-widest text-[#e50914]"
          >
            Connectez-vous pour noter
          </motion.p>
        )}
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
