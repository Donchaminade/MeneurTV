import React, { useEffect, useState, useMemo, useRef } from 'react';
import { FirebaseError } from 'firebase/app';
import { db, handleFirestoreError, OperationType, signIn, signInWithEmailAndPassword, auth, adminCreateAuthUser } from '../lib/firebase';
import {
  collection,
  query,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  Tv,
  Eye,
  TrendingUp,
  Calendar,
  Star,
  Settings,
  Smartphone,
  CreditCard,
  MessageSquare,
  BarChart3,
  Shield,
  Search,
  Activity,
  Ban,
  UserCheck,
  Info,
  X,
  Heart,
  UserPlus,
} from 'lucide-react';
import { iptvService, Channel } from '../lib/iptvApi';
import { useUser } from '../lib/UserContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const SUPER_ADMIN_EMAIL = 'chaminade.dondah.adjolou@gmail.com';
const MAX_CHANNELS_TABLE = 200;

interface ViewDoc {
  channelId: string;
  userId: string;
  timestamp: Timestamp;
}

interface RatingDoc {
  channelId: string;
  userId: string;
  rating: number;
  timestamp?: Timestamp;
}

interface DonationSettingsForm {
  donationFlooz: string;
  donationYas: string;
  donationBank: string;
  supportMessage: string;
}

interface ChannelAdminRow extends Channel {
  viewCount: number;
  uniqueViewers: number;
  avgRating: number;
  ratingCount: number;
  categoryLabel: string;
}

const Admin: React.FC = () => {
  const { user: currentUser, profile: currentProfile } = useUser();
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'channels' | 'audit' | 'settings'>('stats');
  const [views, setViews] = useState<ViewDoc[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [ratings, setRatings] = useState<RatingDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [searchMember, setSearchMember] = useState('');
  const [searchChannel, setSearchChannel] = useState('');
  const [searchAudit, setSearchAudit] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [settings, setSettings] = useState<DonationSettingsForm>({
    donationFlooz: '',
    donationYas: '',
    donationBank: '',
    supportMessage: '',
  });

  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [detailChannelId, setDetailChannelId] = useState<string | null>(null);

  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addMemberPassword, setAddMemberPassword] = useState('');
  const [addMemberPasswordConfirm, setAddMemberPasswordConfirm] = useState('');
  const [addMemberRole, setAddMemberRole] = useState<'user' | 'admin'>('user');
  const [addMemberBusy, setAddMemberBusy] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [addMemberSuccess, setAddMemberSuccess] = useState<string | null>(null);

  /** Évite le clignotement : ne pas remettre loading=true à chaque re-exécution de l’effet. */
  const adminFetchOverlayDoneRef = useRef(false);
  const adminFetchKeyRef = useRef<string>('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setLoginError(err.message || 'Identifiants invalides.');
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
    const isAdmin = currentProfile?.isAdmin === true;
    if (!currentUser?.uid || !isAdmin) {
      adminFetchOverlayDoneRef.current = false;
      adminFetchKeyRef.current = '';
      setLoading(false);
      return;
    }

    const fetchKey = `${currentUser.uid}:admin`;
    if (adminFetchKeyRef.current !== fetchKey) {
      adminFetchKeyRef.current = fetchKey;
      adminFetchOverlayDoneRef.current = false;
    }

    let cancelled = false;

    const fetchData = async () => {
      const showOverlay = !adminFetchOverlayDoneRef.current;
      if (showOverlay) setLoading(true);

      try {
        await iptvService.loadData();
        if (cancelled) return;
        setChannels(iptvService.getEnrichedChannels());

        const viewsSnap = await getDocs(
          query(collection(db, 'views'), orderBy('timestamp', 'desc'), limit(2500))
        );
        if (cancelled) return;
        setViews(viewsSnap.docs.map((d) => d.data() as ViewDoc));

        const usersSnap = await getDocs(collection(db, 'users'));
        if (cancelled) return;
        setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        const ratingsSnap = await getDocs(collection(db, 'ratings'));
        if (cancelled) return;
        setRatings(ratingsSnap.docs.map((d) => d.data() as RatingDoc));

        const settingsDoc = await getDoc(doc(db, 'settings', 'donation'));
        if (cancelled) return;
        if (settingsDoc.exists()) {
          const d = settingsDoc.data() as Record<string, unknown>;
          setSettings({
            donationFlooz: String(d.donationFlooz ?? ''),
            donationYas: String(d.donationYas ?? d.donationTMoney ?? ''),
            donationBank: String(d.donationBank ?? d.donationVisa ?? ''),
            supportMessage: String(d.supportMessage ?? ''),
          });
        }
        adminFetchOverlayDoneRef.current = true;
      } catch (error) {
        if (!cancelled) handleFirestoreError(error, OperationType.GET, 'admin/data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.uid, currentProfile?.isAdmin]);

  const handleToggleAdmin = async (userId: string, currentStatus: boolean, emailAddr: string) => {
    if (userId === currentUser?.uid) {
      alert("Vous ne pouvez pas retirer vos propres droits d'administrateur.");
      return;
    }
    if (emailAddr === SUPER_ADMIN_EMAIL) {
      alert('Impossible de modifier les droits du Super Admin.');
      return;
    }
    if (!confirm(`Voulez-vous ${currentStatus ? 'retirer' : 'donner'} les droits administrateur à ${emailAddr} ?`))
      return;

    try {
      await setDoc(doc(db, 'users', userId), { isAdmin: !currentStatus }, { merge: true });
      if (!currentStatus) {
        await setDoc(doc(db, 'admins', userId), { email: emailAddr });
      }
      setUsers(users.map((u) => (u.id === userId ? { ...u, isAdmin: !currentStatus } : u)));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const addMemberAuthErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Cet email est déjà utilisé.';
      case 'auth/invalid-email':
        return 'Adresse email invalide.';
      case 'auth/weak-password':
        return 'Mot de passe trop faible (minimum 6 caractères).';
      case 'auth/operation-not-allowed':
        return 'La connexion email/mot de passe n’est pas activée dans Firebase Authentication.';
      default:
        return 'Impossible de créer le compte. Réessayez ou vérifiez la console Firebase.';
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMemberError(null);
    setAddMemberSuccess(null);
    const emailTrim = addMemberEmail.trim().toLowerCase();
    if (!emailTrim || !addMemberPassword) {
      setAddMemberError('Renseignez l’email et le mot de passe.');
      return;
    }
    if (addMemberPassword.length < 6) {
      setAddMemberError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (addMemberPassword !== addMemberPasswordConfirm) {
      setAddMemberError('Les mots de passe ne correspondent pas.');
      return;
    }
    setAddMemberBusy(true);
    try {
      const cred = await adminCreateAuthUser(emailTrim, addMemberPassword);
      const uid = cred.user.uid;
      const isAdminRole = addMemberRole === 'admin';
      await setDoc(doc(db, 'users', uid), {
        email: emailTrim,
        favorites: [],
        isAdmin: isAdminRole,
        isActive: true,
        isProfileComplete: false,
        createdAt: serverTimestamp(),
      });
      if (isAdminRole) {
        await setDoc(doc(db, 'admins', uid), { email: emailTrim });
      }
      setUsers((prev) => [
        {
          id: uid,
          email: emailTrim,
          favorites: [],
          isAdmin: isAdminRole,
          isActive: true,
          isProfileComplete: false,
          createdAt: Timestamp.now(),
        },
        ...prev,
      ]);
      setAddMemberEmail('');
      setAddMemberPassword('');
      setAddMemberPasswordConfirm('');
      setAddMemberRole('user');
      setAddMemberSuccess(`Compte créé pour ${emailTrim}.`);
    } catch (err) {
      if (err instanceof FirebaseError && err.code.startsWith('auth/')) {
        setAddMemberError(addMemberAuthErrorMessage(err.code));
      } else {
        setAddMemberError(
          err instanceof Error ? err.message : 'Erreur lors de l’enregistrement du profil (le compte Auth peut avoir été créé quand même).'
        );
      }
    } finally {
      setAddMemberBusy(false);
    }
  };

  const handleToggleUserActive = async (userId: string, emailAddr: string, makeActive: boolean) => {
    if (userId === currentUser?.uid) {
      alert('Vous ne pouvez pas désactiver votre propre compte depuis le tableau de bord.');
      return;
    }
    if (emailAddr === SUPER_ADMIN_EMAIL && !makeActive) {
      alert('Impossible de désactiver le compte Super Admin.');
      return;
    }
    if (
      !confirm(
        makeActive
          ? `Réactiver l'accès pour ${emailAddr} ?`
          : `Désactiver l'accès pour ${emailAddr} ? L'utilisateur sera déconnecté et ne pourra plus utiliser l'application.`
      )
    )
      return;

    try {
      await setDoc(doc(db, 'users', userId), { isActive: makeActive }, { merge: true });
      setUsers(users.map((u) => (u.id === userId ? { ...u, isActive: makeActive } : u)));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'donation'), {
        donationFlooz: settings.donationFlooz,
        donationYas: settings.donationYas,
        donationBank: settings.donationBank,
        supportMessage: settings.supportMessage,
        updatedAt: serverTimestamp(),
      });
      alert('Paramètres mis à jour !');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'settings/donation');
    }
  };

  const ratingAggByChannel = useMemo(() => {
    const m: Record<string, { sum: number; count: number }> = {};
    ratings.forEach((r) => {
      if (!r.channelId) return;
      if (!m[r.channelId]) m[r.channelId] = { sum: 0, count: 0 };
      m[r.channelId].sum += r.rating;
      m[r.channelId].count += 1;
    });
    return m;
  }, [ratings]);

  const channelsWithStats: ChannelAdminRow[] = useMemo(() => {
    return channels.map((c) => {
      const agg = ratingAggByChannel[c.id];
      const viewsList = views.filter((v) => v.channelId === c.id);
      const uniqueViewers = new Set(viewsList.map((v) => v.userId)).size;
      return {
        ...c,
        viewCount: viewsList.length,
        uniqueViewers,
        avgRating: agg && agg.count > 0 ? agg.sum / agg.count : 0,
        ratingCount: agg?.count ?? 0,
        categoryLabel: c.categories?.[0] ?? '—',
      };
    });
  }, [channels, views, ratingAggByChannel]);

  const channelsSorted = useMemo(() => {
    const q = searchChannel.trim().toLowerCase();
    const filtered = q
      ? channelsWithStats.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.id.toLowerCase().includes(q) ||
            c.categoryLabel.toLowerCase().includes(q)
        )
      : [...channelsWithStats];

    filtered.sort((a, b) => {
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      if (b.ratingCount !== a.ratingCount) return b.ratingCount - a.ratingCount;
      if (b.viewCount !== a.viewCount) return b.viewCount - a.viewCount;
      return a.name.localeCompare(b.name);
    });
    return filtered.slice(0, MAX_CHANNELS_TABLE);
  }, [channelsWithStats, searchChannel]);

  const stats = useMemo(() => {
    if (loading) return null;

    const channelCounts: Record<string, number> = {};
    views.forEach((v) => {
      channelCounts[v.channelId] = (channelCounts[v.channelId] || 0) + 1;
    });

    const topChannels = Object.entries(channelCounts)
      .map(([id, count]) => ({
        name: channels.find((c) => c.id === id)?.name || id,
        views: count,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    const viewsByDay: Record<string, number> = {};
    views.forEach((v) => {
      const date = v.timestamp.toDate().toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
      viewsByDay[date] = (viewsByDay[date] || 0) + 1;
    });

    const evolutionData = Object.entries(viewsByDay)
      .map(([date, count]) => ({ date, views: count }))
      .reverse();

    const now = Date.now();
    const dayMs = 86400000;
    const viewsLast7d = views.filter((v) => now - v.timestamp.toMillis() < 7 * dayMs).length;
    const viewsLast24h = views.filter((v) => now - v.timestamp.toMillis() < dayMs).length;

    const uniqueViewers = new Set(views.map((v) => v.userId)).size;
    const activeAccounts = users.filter((u) => u.isActive !== false).length;
    const disabledAccounts = users.length - activeAccounts;

    const sumRat = ratings.reduce((a, r) => a + r.rating, 0);
    const avgGlobal = ratings.length > 0 ? sumRat / ratings.length : 0;

    const favTotal = users.reduce((acc, u) => acc + (u.favorites?.length || 0), 0);
    const profilesComplete = users.filter((u) => u.isProfileComplete).length;

    const topRated = [...channelsWithStats]
      .filter((c) => c.ratingCount > 0)
      .sort((a, b) => b.avgRating - a.avgRating || b.ratingCount - a.ratingCount)[0];

    const ratingDistribution = [1, 2, 3, 4, 5].map((star) => ({
      name: `${star}★`,
      value: ratings.filter((r) => r.rating === star).length,
    }));

    return {
      topChannels,
      evolutionData,
      viewsLast7d,
      viewsLast24h,
      uniqueViewers,
      activeAccounts,
      disabledAccounts,
      avgGlobal,
      favTotal,
      profilesComplete,
      topRatedName: topRated?.name ?? '—',
      topRatedAvg: topRated ? topRated.avgRating.toFixed(1) : '—',
      ratingDistribution,
    };
  }, [views, channels, loading, users, ratings, channelsWithStats]);

  const filteredUsers = useMemo(() => {
    const q = searchMember.toLowerCase();
    return users.filter(
      (u) =>
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.displayName && u.displayName.toLowerCase().includes(q)) ||
        u.id.toLowerCase().includes(q)
    );
  }, [users, searchMember]);

  const filteredAudit = useMemo(() => {
    const q = searchAudit.toLowerCase();
    if (!q) return views;
    return views.filter(
      (v) =>
        v.userId.toLowerCase().includes(q) ||
        v.channelId.toLowerCase().includes(q) ||
        (channels.find((c) => c.id === v.channelId)?.name || '').toLowerCase().includes(q)
    );
  }, [views, searchAudit, channels]);

  const detailUser = detailUserId ? users.find((u) => u.id === detailUserId) : null;
  const detailChannelRow = detailChannelId ? channelsWithStats.find((c) => c.id === detailChannelId) : null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e50914]"></div>
        <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Chargement sécurisé...</p>
      </div>
    );
  }

  if (!currentProfile?.isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass rounded-[40px] border-white/5 p-8 md:p-12 space-y-8 md:space-y-12 relative overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#e50914]/10 rounded-full blur-[100px]" />

          <div className="text-center space-y-3 md:space-y-4 relative z-10">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-[#e50914]/10 rounded-3xl flex items-center justify-center mx-auto border border-[#e50914]/20 shadow-2xl">
              <Shield size={32} className="text-[#e50914] md:hidden" />
              <Shield size={40} className="text-[#e50914] hidden md:block" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter uppercase leading-none">
                ADMIN <br />
                <span className="text-[#e50914]">TERMINAL</span>
              </h1>
              <p className="text-gray-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]">
                Accès Hautement Sécurisé
              </p>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-6 relative z-10">
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                {loginError}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4 flex items-center gap-2">
                <Users size={12} /> Identifiant Admin
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@streampro.tv"
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-[#e50914] transition-all placeholder:text-gray-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4 flex items-center gap-2">
                <Shield size={12} /> Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-[#e50914] transition-all placeholder:text-gray-700"
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="group w-full bg-[#e50914] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-[#b20710] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loginLoading ? 'Validation...' : 'Authentification'}{' '}
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse group-hover:scale-150 transition-transform" />
            </button>
          </form>

          <div className="space-y-8 relative z-10">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-[9px] uppercase font-black text-gray-600">
                <span className="bg-[#0b0b0b] px-6 py-1 border border-white/5 rounded-full">Méthode Alternative</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => signIn()}
              className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 hover:bg-gray-100 transition-all active:scale-95 shadow-2xl"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                className="w-5 h-5"
                alt=""
              />
              Continuer avec Google
            </button>
          </div>

          <div className="text-center relative z-10">
            <p className="text-[8px] text-gray-700 font-black uppercase tracking-[0.5em]">MENEURTV SECURITY PROTOCOL</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const PIE_COLORS = ['#3f3f46', '#52525b', '#71717a', '#a1a1aa', '#e50914'];

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 pb-20">
      <aside className="lg:w-72 flex-shrink-0">
        <div className="lg:sticky lg:top-28 space-y-6 lg:space-y-8">
          <div className="px-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#e50914] mb-1">Système</h2>
            <p className="text-xl font-display font-black tracking-tight uppercase">Dashboard</p>
          </div>

          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 hide-scrollbar px-4 lg:px-0">
            <SidebarLink
              active={activeTab === 'stats'}
              onClick={() => setActiveTab('stats')}
              icon={<BarChart3 size={18} />}
              label="Statistiques"
            />
            <SidebarLink
              active={activeTab === 'users'}
              onClick={() => setActiveTab('users')}
              icon={<Users size={18} />}
              label="Utilisateurs"
            />
            <SidebarLink
              active={activeTab === 'channels'}
              onClick={() => setActiveTab('channels')}
              icon={<Tv size={18} />}
              label="Chaînes TV"
            />
            <SidebarLink
              active={activeTab === 'audit'}
              onClick={() => setActiveTab('audit')}
              icon={<Activity size={18} />}
              label="Audit Activité"
            />
            <SidebarLink
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              icon={<Settings size={18} />}
              label="Configuration"
            />
          </nav>

          <div className="hidden lg:block p-6 bg-[#e50914]/5 border border-[#e50914]/10 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-[#e50914]">
              <Shield size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Accès Admin</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
              Gestion des comptes, chaînes, notes et activité de la plateforme.
            </p>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Users size={20} />} label="Utilisateurs" value={users.length} color="text-[#e50914]" />
                <StatCard
                  icon={<UserCheck size={20} />}
                  label="Comptes actifs"
                  value={stats?.activeAccounts ?? 0}
                  color="text-green-500"
                />
                <StatCard
                  icon={<Ban size={20} />}
                  label="Comptes désactivés"
                  value={stats?.disabledAccounts ?? 0}
                  color="text-orange-500"
                />
                <StatCard icon={<Eye size={20} />} label="Vues (échantillon)" value={views.length} color="text-blue-500" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  icon={<TrendingUp size={20} />}
                  label="Vues 24h"
                  value={stats?.viewsLast24h ?? 0}
                  color="text-cyan-500"
                />
                <StatCard
                  icon={<Calendar size={20} />}
                  label="Vues 7 jours"
                  value={stats?.viewsLast7d ?? 0}
                  color="text-violet-500"
                />
                <StatCard
                  icon={<Users size={20} />}
                  label="Spectateurs uniques"
                  value={stats?.uniqueViewers ?? 0}
                  color="text-pink-500"
                />
                <StatCard icon={<Tv size={20} />} label="Chaînes stream" value={channels.length} color="text-green-500" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Star size={20} />} label="Avis enregistrés" value={ratings.length} color="text-yellow-500" />
                <StatCard
                  icon={<Star size={20} />}
                  label="Note moy. globale"
                  value={ratings.length && stats ? stats.avgGlobal.toFixed(2) : '—'}
                  color="text-amber-400"
                />
                <StatCard
                  icon={<Heart size={20} />}
                  label="Favoris (total)"
                  value={stats?.favTotal ?? 0}
                  color="text-red-400"
                />
                <StatCard
                  icon={<Shield size={20} />}
                  label="Profils complets"
                  value={stats?.profilesComplete ?? 0}
                  color="text-emerald-500"
                />
              </div>

              <div className="glass p-6 rounded-3xl border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Chaîne la mieux notée</p>
                <p className="text-lg font-display font-black text-white">
                  {stats?.topRatedName}{' '}
                  <span className="text-[#e50914] text-sm">({stats?.topRatedAvg} / 5)</span>
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="glass p-8 rounded-3xl border-white/5 space-y-8 lg:col-span-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
                    <Calendar size={14} /> Trafic (dates de l’échantillon)
                  </h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats?.evolutionData}>
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#e50914" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#e50914" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                        <XAxis dataKey="date" stroke="#444" fontSize={9} fontWeight="bold" />
                        <YAxis stroke="#444" fontSize={9} fontWeight="bold" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0a0a0a',
                            border: '1px solid #222',
                            borderRadius: '12px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="views"
                          stroke="#e50914"
                          fillOpacity={1}
                          fill="url(#colorViews)"
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass p-8 rounded-3xl border-white/5 space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Répartition des notes
                  </h3>
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats?.ratingDistribution ?? []}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {stats?.ratingDistribution?.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0a0a0a',
                            border: '1px solid #222',
                            borderRadius: '12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass p-8 rounded-3xl border-white/5 space-y-8">
                  <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
                    <Star size={14} /> Top 10 chaînes (vues)
                  </h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.topChannels} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name"
                          type="category"
                          stroke="#fff"
                          fontSize={8}
                          width={90}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0a0a0a',
                            border: '1px solid #222',
                            borderRadius: '12px',
                          }}
                        />
                        <Bar dataKey="views" fill="#e50914" radius={[0, 4, 4, 0]} barSize={10} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass p-8 rounded-3xl border-white/5 space-y-8">
                  <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
                    <TrendingUp size={14} /> Vues cumulées (top 10)
                  </h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats?.topChannels}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                        <XAxis dataKey="name" stroke="#444" fontSize={8} angle={-25} textAnchor="end" height={70} />
                        <YAxis stroke="#444" fontSize={9} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0a0a0a',
                            border: '1px solid #222',
                            borderRadius: '12px',
                          }}
                        />
                        <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="glass rounded-3xl border-white/5 overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Activités récentes</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('audit')}
                    className="text-[9px] font-black uppercase tracking-widest text-[#e50914] hover:underline"
                  >
                    Voir tout le journal →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-gray-500 text-[10px] font-black uppercase tracking-widest bg-white/[0.02]">
                        <th className="px-8 py-5">Chaîne</th>
                        <th className="px-8 py-5">Utilisateur (UID)</th>
                        <th className="px-8 py-5">Heure</th>
                        <th className="px-8 py-5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {views.slice(0, 8).map((view, i) => (
                        <tr key={`${view.userId}-${view.channelId}-${i}`} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-8 py-5 text-sm font-bold text-white">
                            {channels.find((c) => c.id === view.channelId)?.name || view.channelId}
                          </td>
                          <td className="px-8 py-5 text-gray-500 font-mono text-[9px] uppercase tracking-wider">
                            {view.userId}
                          </td>
                          <td className="px-8 py-5 text-gray-400 text-xs font-display">
                            {view.timestamp.toDate().toLocaleTimeString('fr-FR')}
                          </td>
                          <td className="px-8 py-5">
                            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-widest">
                              Lecture
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black uppercase tracking-tight font-display">Utilisateurs</h2>
                  <p className="text-gray-500 text-sm font-medium">
                    {users.length} comptes — désactivez un membre pour lui couper l’accès à l’app.
                  </p>
                </div>
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    type="text"
                    value={searchMember}
                    onChange={(e) => setSearchMember(e.target.value)}
                    placeholder="Rechercher…"
                    className="bg-white/5 border border-white/10 rounded-xl py-3 px-12 text-sm focus:outline-none focus:border-[#e50914] w-full max-w-[300px]"
                  />
                </div>
              </div>

              <div className="glass rounded-3xl border border-white/10 p-6 md:p-8 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <UserPlus size={16} className="text-[#e50914]" />
                  Ajouter un membre
                </h3>
                <form onSubmit={handleAddMember} className="grid gap-4 md:grid-cols-2 lg:grid-cols-12 items-end">
                  <div className="md:col-span-2 lg:col-span-4 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email</label>
                    <input
                      type="email"
                      autoComplete="off"
                      value={addMemberEmail}
                      onChange={(e) => setAddMemberEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#e50914]"
                      placeholder="membre@exemple.com"
                    />
                  </div>
                  <div className="lg:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Mot de passe</label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={addMemberPassword}
                      onChange={(e) => setAddMemberPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#e50914]"
                      placeholder="••••••"
                    />
                  </div>
                  <div className="lg:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Confirmer</label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={addMemberPasswordConfirm}
                      onChange={(e) => setAddMemberPasswordConfirm(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#e50914]"
                      placeholder="••••••"
                    />
                  </div>
                  <div className="lg:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Rôle</label>
                    <select
                      value={addMemberRole}
                      onChange={(e) => setAddMemberRole(e.target.value as 'user' | 'admin')}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#e50914] text-white"
                    >
                      <option value="user">Utilisateur</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 lg:col-span-2">
                    <button
                      type="submit"
                      disabled={addMemberBusy}
                      className="w-full py-3 rounded-xl bg-[#e50914] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#c40810] disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {addMemberBusy ? 'Création…' : 'Créer le compte'}
                    </button>
                  </div>
                </form>
                {addMemberError && <p className="text-sm text-red-400 font-medium">{addMemberError}</p>}
                {addMemberSuccess && <p className="text-sm text-green-400 font-medium">{addMemberSuccess}</p>}
              </div>

              <div className="glass rounded-3xl border-white/5 overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                  <thead>
                    <tr className="text-gray-500 text-[10px] font-black uppercase tracking-widest bg-white/[0.02]">
                      <th className="px-6 py-4">Membre</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Statut</th>
                      <th className="px-6 py-4">Fav.</th>
                      <th className="px-6 py-4">Rôle</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((u) => {
                      const active = u.isActive !== false;
                      return (
                        <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#e50914] rounded-full flex items-center justify-center text-white font-black text-sm uppercase shrink-0">
                                {(u.displayName || u.email || '?')[0]}
                              </div>
                              <span className="text-sm font-bold text-white">{u.displayName || '—'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-xs max-w-[200px] truncate">{u.email}</td>
                          <td className="px-6 py-4">
                            {active ? (
                              <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-500 text-[9px] font-black uppercase border border-green-500/20">
                                Actif
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-lg bg-red-500/10 text-red-400 text-[9px] font-black uppercase border border-red-500/20">
                                Désactivé
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-xs font-black">{u.favorites?.length || 0}</td>
                          <td className="px-6 py-4">
                            {u.isAdmin ? (
                              <span className="px-2 py-1 rounded-lg bg-[#e50914]/10 text-[#e50914] text-[9px] font-black uppercase border border-[#e50914]/20">
                                Admin
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-lg bg-white/5 text-gray-500 text-[9px] font-black uppercase border border-white/10">
                                User
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setDetailUserId(u.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/10"
                              >
                                <Info size={14} /> Détail
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleUserActive(u.id, u.email, !active)}
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest',
                                  active
                                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
                                    : 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                                )}
                              >
                                {active ? (
                                  <>
                                    <Ban size={14} /> Désactiver
                                  </>
                                ) : (
                                  <>
                                    <UserCheck size={14} /> Réactiver
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleAdmin(u.id, u.isAdmin, u.email)}
                                className="p-2 bg-white/5 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/10"
                                title={u.isAdmin ? 'Retirer admin' : 'Nommer admin'}
                              >
                                <Shield size={16} className={u.isAdmin ? 'text-[#e50914]' : ''} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'channels' && (
            <motion.div
              key="channels"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black uppercase tracking-tight font-display">Chaînes & notations</h2>
                  <p className="text-gray-500 text-sm font-medium">
                    Tri par note moyenne puis nombre d’avis (max. {MAX_CHANNELS_TABLE} lignes — affinez la recherche).
                  </p>
                </div>
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    type="text"
                    value={searchChannel}
                    onChange={(e) => setSearchChannel(e.target.value)}
                    placeholder="Filtrer nom, id, catégorie…"
                    className="bg-white/5 border border-white/10 rounded-xl py-3 px-12 text-sm focus:outline-none focus:border-[#e50914] w-full max-w-[300px]"
                  />
                </div>
              </div>

              <div className="glass rounded-3xl border-white/5 overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[960px]">
                  <thead>
                    <tr className="text-gray-500 text-[10px] font-black uppercase tracking-widest bg-white/[0.02]">
                      <th className="px-6 py-4">#</th>
                      <th className="px-6 py-4">Chaîne</th>
                      <th className="px-6 py-4">Note moy.</th>
                      <th className="px-6 py-4">Avis</th>
                      <th className="px-6 py-4">Vues</th>
                      <th className="px-6 py-4">Spectateurs</th>
                      <th className="px-6 py-4">Catégorie</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {channelsSorted.map((c, idx) => (
                      <tr key={c.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-3 text-gray-600 text-xs font-mono">{idx + 1}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center p-1 border border-white/5 shrink-0">
                              {c.logo ? (
                                <img src={c.logo} className="w-full h-full object-contain" alt="" />
                              ) : (
                                <Tv className="text-white/10 w-4 h-4" />
                              )}
                            </div>
                            <span className="text-xs font-bold text-white uppercase tracking-wider truncate max-w-[220px]">
                              {c.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm font-black text-[#e50914]">
                          {c.ratingCount ? c.avgRating.toFixed(2) : '—'}
                        </td>
                        <td className="px-6 py-3 text-gray-400 text-xs font-bold">{c.ratingCount}</td>
                        <td className="px-6 py-3 text-gray-300 text-xs font-bold">{c.viewCount}</td>
                        <td className="px-6 py-3 text-gray-400 text-xs">{c.uniqueViewers}</td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-0.5 rounded-md bg-white/5 text-gray-400 text-[9px] font-black uppercase tracking-widest">
                            {c.categoryLabel}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setDetailChannelId(c.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/10"
                          >
                            <Info size={14} /> Détail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'audit' && (
            <motion.div
              key="audit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black uppercase tracking-tight font-display">Journal des activités</h2>
                  <p className="text-gray-500 text-sm font-medium">
                    Chaque ligne = une lecture enregistrée (collection <code className="text-gray-600">views</code>).
                  </p>
                </div>
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    type="text"
                    value={searchAudit}
                    onChange={(e) => setSearchAudit(e.target.value)}
                    placeholder="UID, chaîne, nom…"
                    className="bg-white/5 border border-white/10 rounded-xl py-3 px-12 text-sm focus:outline-none focus:border-[#e50914] w-full max-w-[300px]"
                  />
                </div>
              </div>

              <div className="glass rounded-3xl border-white/5 overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead>
                    <tr className="text-gray-500 text-[10px] font-black uppercase tracking-widest bg-white/[0.02]">
                      <th className="px-6 py-4">Événement</th>
                      <th className="px-6 py-4">Chaîne</th>
                      <th className="px-6 py-4">Utilisateur</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredAudit.map((view, i) => (
                      <tr key={`${view.userId}-${view.channelId}-${i}`} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">LECTURE</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold">
                              {channels.find((c) => c.id === view.channelId)?.name || view.channelId}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-400 font-mono text-[9px]">{view.userId}</td>
                        <td className="px-6 py-4 text-xs text-gray-400">
                          {view.timestamp.toDate().toLocaleString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl space-y-12"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-black uppercase tracking-tight font-display">Soutien manuel</h2>
                <p className="text-gray-500 text-sm font-medium">
                  Flooz, Yas et coordonnées bancaires affichées sur le profil et la page Don.
                </p>
              </div>

              <div className="glass p-10 rounded-[40px] border-white/5 space-y-10">
                <form onSubmit={handleSettingsUpdate} className="space-y-8 font-display">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                        <Smartphone size={12} className="text-[#e50914]" /> Flooz (code / numéro)
                      </label>
                      <input
                        type="text"
                        value={settings.donationFlooz}
                        onChange={(e) => setSettings({ ...settings, donationFlooz: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-[#e50914] text-sm"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                        <Smartphone size={12} className="text-[#e50914]" /> Yas (code / numéro)
                      </label>
                      <input
                        type="text"
                        value={settings.donationYas}
                        onChange={(e) => setSettings({ ...settings, donationYas: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-[#e50914] text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                      <CreditCard size={12} className="text-[#e50914]" /> Compte bancaire (RIB / IBAN / libellé)
                    </label>
                    <textarea
                      value={settings.donationBank}
                      onChange={(e) => setSettings({ ...settings, donationBank: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-[#e50914] text-sm min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                      <MessageSquare size={12} className="text-[#e50914]" /> Message de soutien
                    </label>
                    <textarea
                      value={settings.supportMessage}
                      onChange={(e) => setSettings({ ...settings, supportMessage: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-[#e50914] text-sm min-h-[140px]"
                    />
                  </div>

                  <div className="pt-6">
                    <button
                      type="submit"
                      className="w-full md:w-auto bg-[#e50914] text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-[#b20710] transition-all"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {detailUserId && detailUser && (
          <UserDetailModal
            user={detailUser}
            channels={channels}
            views={views}
            onClose={() => setDetailUserId(null)}
          />
        )}
        {detailChannelId && detailChannelRow && (
          <ChannelDetailModal
            row={detailChannelRow}
            ratings={ratings.filter((r) => r.channelId === detailChannelId)}
            onClose={() => setDetailChannelId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

function UserDetailModal({
  user,
  channels,
  views,
  onClose,
}: {
  user: any;
  channels: Channel[];
  views: ViewDoc[];
  onClose: () => void;
}) {
  const userViews = useMemo(
    () => views.filter((v) => v.userId === user.id).slice(0, 80),
    [views, user.id]
  );
  const favNames = ((user.favorites || []) as string[]).map(
    (fid) => channels.find((c) => c.id === fid)?.name || fid
  );
  let created = '—';
  try {
    if (user.createdAt?.toDate) created = user.createdAt.toDate().toLocaleString('fr-FR');
  } catch {
    /* ignore */
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ scale: 0.96, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#0a0a0a] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-lg font-black uppercase tracking-tight font-display">Détail utilisateur</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/10"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Email</p>
              <p className="font-bold text-white break-all">{user.email}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">UID</p>
              <p className="font-mono text-gray-400 break-all text-[10px]">{user.id}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Nom affiché</p>
              <p className="font-bold">{user.displayName || '—'}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Téléphone</p>
              <p className="font-bold">{user.phoneNumber || '—'}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Membre depuis</p>
              <p className="font-bold">{created}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Accès</p>
              <p className="font-bold">{user.isActive === false ? 'Désactivé' : 'Actif'}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Profil complet</p>
              <p className="font-bold">{user.isProfileComplete ? 'Oui' : 'Non'}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Admin</p>
              <p className="font-bold">{user.isAdmin ? 'Oui' : 'Non'}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#e50914] mb-2">Favoris</p>
            {favNames.length ? (
              <ul className="list-disc list-inside text-gray-300 space-y-1 text-xs">
                {favNames.map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-xs">Aucun favori</p>
            )}
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#e50914] mb-2">
              Activité récente (lectures enregistrées, max. 80)
            </p>
            <div className="rounded-xl border border-white/10 overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left text-[10px]">
                <thead className="bg-white/[0.03] text-gray-500 font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-3 py-2">Chaîne</th>
                    <th className="px-3 py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {userViews.map((v, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-white font-bold">
                        {channels.find((c) => c.id === v.channelId)?.name || v.channelId}
                      </td>
                      <td className="px-3 py-2 text-gray-500">{v.timestamp.toDate().toLocaleString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!userViews.length && <p className="p-4 text-gray-500 text-xs">Aucune vue enregistrée.</p>}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ChannelDetailModal({
  row,
  ratings: channelRatings,
  onClose,
}: {
  row: ChannelAdminRow;
  ratings: RatingDoc[];
  onClose: () => void;
}) {
  const dist = [1, 2, 3, 4, 5].map((s) => ({
    stars: s,
    count: channelRatings.filter((r) => r.rating === s).length,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ scale: 0.96, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#0a0a0a] border border-white/10 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-lg font-black uppercase tracking-tight font-display truncate pr-4">{row.name}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/10 shrink-0"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          <p className="text-[10px] font-mono text-gray-500 break-all">ID : {row.id}</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Vues (échantillon)</p>
              <p className="text-2xl font-black text-white">{row.viewCount}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Spectateurs uniques</p>
              <p className="text-2xl font-black text-[#e50914]">{row.uniqueViewers}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Note moyenne</p>
              <p className="text-2xl font-black text-white">{row.ratingCount ? row.avgRating.toFixed(2) : '—'}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Nombre d’avis</p>
              <p className="text-2xl font-black text-white">{row.ratingCount}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Les « vues » correspondent aux enregistrements de lecture (pas de clic séparé). Limite d’historique côté admin
            : 2500 entrées récentes.
          </p>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Répartition des notes</p>
            <div className="space-y-2">
              {dist.map((d) => (
                <div key={d.stars} className="flex items-center gap-3 text-xs">
                  <span className="w-8 font-black text-[#e50914]">{d.stars}★</span>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#e50914] rounded-full"
                      style={{
                        width: `${channelRatings.length ? (d.count / channelRatings.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-gray-400 w-8 text-right">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const SidebarLink: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({
  active,
  onClick,
  icon,
  label,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all',
      active
        ? 'bg-[#e50914] text-white shadow-2xl scale-[1.02]'
        : 'text-gray-500 hover:bg-white/5 hover:text-white'
    )}
  >
    {icon}
    {label}
  </button>
);

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({
  icon,
  label,
  value,
  color,
}) => (
  <div className="glass p-8 rounded-3xl border-white/5 space-y-6 admin-glow">
    <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5', color)}>{icon}</div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-display font-black tracking-tight">{value}</p>
    </div>
  </div>
);

export default Admin;
