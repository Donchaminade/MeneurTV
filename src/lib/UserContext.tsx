import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { resolveFavoriteIds, writeStoredFavorites } from './favoritesLocal';

interface UserProfile {
  email: string;
  favorites: string[];
  isAdmin: boolean;
  /** false = compte désactivé par un admin */
  isActive?: boolean;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  isProfileComplete?: boolean;
  createdAt: any;
}

interface UserContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  toggleFavorite: (channelId: string) => Promise<void>;
  logView: (channelId: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  authModal: {
    isOpen: boolean;
    mode: 'login' | 'signup';
    open: (mode?: 'login' | 'signup') => void;
    close: () => void;
  };
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState<{isOpen: boolean, mode: 'login' | 'signup'}>({
    isOpen: false,
    mode: 'login'
  });

  // Bootstrap admin email
  const ADMIN_EMAIL = 'chaminade.dondah.adjolou@gmail.com';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const adminDocRef = doc(db, 'admins', user.uid);

    const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const raw = docSnap.data() as UserProfile;
        const cloudFav = Array.isArray(raw.favorites) ? raw.favorites : [];
        const data: UserProfile = {
          ...raw,
          favorites: resolveFavoriteIds(user.uid, cloudFav),
        };
        if (data.isActive === false) {
          try {
            sessionStorage.setItem('meneurtv_account_disabled', '1');
            await signOut(auth);
          } catch {
            /* ignore */
          }
          setLoading(false);
          return;
        }
        setProfile(data);

        if (data.isAdmin === true && user.email) {
          try {
            await setDoc(adminDocRef, { email: user.email }, { merge: true });
          } catch {
            /* alignement admins/ optionnel si règles pas encore déployées */
          }
        }

        // Check if user should be admin but isn't marked yet in Firestore (for local state)
        if (user.email === ADMIN_EMAIL && !data.isAdmin) {
            // Note: Rules allow update only for current fields or admin. 
            // We should ideally have a way to promote. 
        }
      } else {
        const isInitialAdmin = user.email === ADMIN_EMAIL;
        
        // Create initial profile
        const newProfile: UserProfile = {
          email: user.email || '',
          favorites: [],
          isAdmin: isInitialAdmin,
          isActive: true,
          createdAt: serverTimestamp(),
        };
        
        try {
          await setDoc(userDocRef, newProfile);
          if (isInitialAdmin) {
            await setDoc(adminDocRef, { email: user.email });
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
        }
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const toggleFavorite = async (channelId: string) => {
    if (!user) return;
    const uid = user.uid;
    const current = resolveFavoriteIds(uid, profile?.favorites);
    const newFavorites = current.includes(channelId)
      ? current.filter((id) => id !== channelId)
      : [...current, channelId];

    writeStoredFavorites(uid, newFavorites);
    setProfile((prev) => (prev ? { ...prev, favorites: newFavorites } : prev));

    try {
      await setDoc(doc(db, 'users', uid), { favorites: newFavorites }, { merge: true });
    } catch (error) {
      console.warn('[MeneurTV] Favoris enregistrés localement ; échec sync Firestore.', error);
    }
  };

  const logView = async (channelId: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'views'), {
        channelId,
        userId: user.uid,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'views');
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), data, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModal({ isOpen: true, mode });
  };

  const closeAuthModal = () => {
    setAuthModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      toggleFavorite, 
      logView, 
      updateProfile,
      authModal: {
        ...authModal,
        open: openAuthModal,
        close: closeAuthModal
      }
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) throw new Error('useUser must be used within a UserProvider');
  return context;
};
