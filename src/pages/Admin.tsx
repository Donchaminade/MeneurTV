import React, { useEffect, useState, useMemo } from 'react';
import { db, handleFirestoreError, OperationType, signIn, signInWithEmailAndPassword, auth } from '../lib/firebase';
import { collection, query, getDocs, orderBy, limit, Timestamp, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Users, Tv, Eye, TrendingUp, Calendar, AlertCircle, Star, Settings, Smartphone, CreditCard, MessageSquare, BarChart3, Shield, Search, Activity, Trash2, Clock } from 'lucide-react';
import { iptvService, Channel } from '../lib/iptvApi';
import { useUser } from '../lib/UserContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ViewDoc {
  channelId: string;
  userId: string;
  timestamp: Timestamp;
}

const Admin: React.FC = () => {
  const { user: currentUser, profile: currentProfile } = useUser();
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'channels' | 'audit' | 'settings'>('stats');
  const [views, setViews] = useState<ViewDoc[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [searchMember, setSearchMember] = useState('');
  const [searchChannel, setSearchChannel] = useState('');
  const [searchAudit, setSearchAudit] = useState('');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    donationFlooz: '',
    donationTMoney: '',
    donationVisa: '',
    supportMessage: ''
  });

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
    if (!currentProfile?.isAdmin) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        await iptvService.loadData();
        setChannels(iptvService.getEnrichedChannels());

        const viewsSnap = await getDocs(query(collection(db, 'views'), orderBy('timestamp', 'desc'), limit(1000)));
        const usersSnap = await getDocs(collection(db, 'users'));
        
        setViews(viewsSnap.docs.map(d => d.data() as ViewDoc));
        setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const settingsDoc = await getDoc(doc(db, 'settings', 'donation'));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data() as any);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'admin/data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentProfile]);

  const handleToggleAdmin = async (userId: string, currentStatus: boolean, email: string) => {
    // Prevent self-demotion
    if (userId === currentUser?.uid) {
      alert("Vous ne pouvez pas retirer vos propres droits d'administrateur.");
      return;
    }

    // Safety check for super admin
    if (email === 'chaminade.dondah.adjolou@gmail.com') {
      alert("Impossible de modifier les droits du Super Admin.");
      return;
    }

    if (!confirm(`Voulez-vous ${currentStatus ? 'retirer' : 'donner'} les droits administrateur à ${email} ?`)) return;

    try {
      await setDoc(doc(db, 'users', userId), { isAdmin: !currentStatus }, { merge: true });
      if (!currentStatus) {
        await setDoc(doc(db, 'admins', userId), { email });
      }
      setUsers(users.map(u => u.id === userId ? { ...u, isAdmin: !currentStatus } : u));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'donation'), {
        ...settings,
        updatedAt: serverTimestamp()
      });
      alert('Paramètres mis à jour !');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'settings/donation');
    }
  };

  const stats = useMemo(() => {
    if (loading || !currentProfile?.isAdmin) return null;

    const channelCounts: Record<string, number> = {};
    views.forEach(v => {
      channelCounts[v.channelId] = (channelCounts[v.channelId] || 0) + 1;
    });

    const topChannels = Object.entries(channelCounts)
      .map(([id, count]) => ({
        name: channels.find(c => c.id === id)?.name || id,
        views: count
      }))
      .sort((a,b) => b.views - a.views)
      .slice(0, 10);

    const viewsByDay: Record<string, number> = {};
    views.forEach(v => {
      const date = v.timestamp.toDate().toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
      viewsByDay[date] = (viewsByDay[date] || 0) + 1;
    });

    const evolutionData = Object.entries(viewsByDay)
      .map(([date, count]) => ({ date, views: count }))
      .reverse();

    return { topChannels, evolutionData };
  }, [views, channels, loading, currentProfile]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.email.toLowerCase().includes(searchMember.toLowerCase()) || 
      (u.displayName && u.displayName.toLowerCase().includes(searchMember.toLowerCase()))
    );
  }, [users, searchMember]);

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
              <p className="text-gray-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]">Accès Hautement Sécurisé</p>
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
                <div className="relative group">
                   <input 
                     type="email" 
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     placeholder="admin@streampro.tv" 
                     className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-[#e50914] transition-all placeholder:text-gray-700" 
                   />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4 flex items-center gap-2">
                   <Shield size={12} /> Mot de passe
                </label>
                <div className="relative group">
                   <input 
                     type="password" 
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     placeholder="••••••••••••" 
                     className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-[#e50914] transition-all placeholder:text-gray-700" 
                   />
                </div>
             </div>
             <button 
               type="submit" 
               disabled={loginLoading}
               className="group w-full bg-[#e50914] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-[#b20710] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
             >
               {loginLoading ? 'Validation...' : 'Authentification'} <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse group-hover:scale-150 transition-transform" />
             </button>
          </form>

          <div className="space-y-8 relative z-10">
            <div className="relative">
               <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
               <div className="relative flex justify-center text-[9px] uppercase font-black text-gray-600">
                  <span className="bg-[#0b0b0b] px-6 py-1 border border-white/5 rounded-full">Méthode Alternative</span>
               </div>
            </div>

            <button 
               onClick={() => signIn()}
               className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 hover:bg-gray-100 transition-all active:scale-95 shadow-2xl"
            >
               <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="" />
               Continuer avec Google
            </button>
          </div>

          <div className="text-center relative z-10">
             <p className="text-[8px] text-gray-700 font-black uppercase tracking-[0.5em]">
                MENEURTV SECURITY PROTOCOL
             </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 pb-20">
      {/* Admin Sidebar */}
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
                  Vous avez les droits de gestion complets. Soyez prudent avec les rôles utilisateurs.
               </p>
            </div>
         </div>
      </aside>

      {/* Main Admin Content */}
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
                <StatCard icon={<Users size={20} />} label="Total Users" value={users.length} color="text-[#e50914]" />
                <StatCard icon={<Eye size={20} />} label="Total Vues" value={views.length} color="text-blue-500" />
                <StatCard icon={<Tv size={20} />} label="Chaînes" value={channels.length} color="text-green-500" />
                <StatCard icon={<TrendingUp size={20} />} label="Conversion" value="94%" color="text-orange-500" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Charts implementation here (Same as before but integrated) */}
                 <div className="glass p-8 rounded-3xl border-white/5 space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
                       <Calendar size={14} /> Trafic Semaine
                    </h3>
                    <div className="h-[250px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={stats?.evolutionData}>
                             <defs>
                                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#e50914" stopOpacity={0.3}/>
                                   <stop offset="95%" stopColor="#e50914" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                             <XAxis dataKey="date" stroke="#444" fontSize={9} fontWeight="bold" />
                             <YAxis stroke="#444" fontSize={9} fontWeight="bold" />
                             <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '12px' }} />
                             <Area type="monotone" dataKey="views" stroke="#e50914" fillOpacity={1} fill="url(#colorViews)" strokeWidth={3} />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="glass p-8 rounded-3xl border-white/5 space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
                       <Star size={14} /> Top 10 Chaînes
                    </h3>
                    <div className="h-[250px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats?.topChannels} layout="vertical">
                             <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                             <XAxis type="number" hide />
                             <YAxis dataKey="name" type="category" stroke="#fff" fontSize={8} width={80} axisLine={false} tickLine={false} />
                             <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '12px' }} />
                             <Bar dataKey="views" fill="#e50914" radius={[0, 4, 4, 0]} barSize={10} />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </div>

              <div className="glass rounded-3xl border-white/5 overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Activités Récentes</h3>
                  <button 
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
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-8 py-5 text-sm font-bold text-white">
                            {channels.find(c => c.id === view.channelId)?.name || view.channelId}
                          </td>
                          <td className="px-8 py-5 text-gray-500 font-mono text-[9px] uppercase tracking-wider">
                            {view.userId}
                          </td>
                          <td className="px-8 py-5 text-gray-400 text-xs font-display">
                            {view.timestamp.toDate().toLocaleTimeString('fr-FR')}
                          </td>
                          <td className="px-8 py-5">
                            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-widest">Lecture</span>
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
                     <h2 className="text-2xl font-black uppercase tracking-tight font-display">Gestion des Utilisateurs</h2>
                     <p className="text-gray-500 text-sm font-medium">{users.length} membres enregistrés sur la plateforme.</p>
                  </div>
                  <div className="relative">
                     <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                     <input 
                        type="text" 
                        value={searchMember}
                        onChange={(e) => setSearchMember(e.target.value)}
                        placeholder="Chercher un membre..."
                        className="bg-white/5 border border-white/10 rounded-xl py-3 px-12 text-sm focus:outline-none focus:border-[#e50914] w-[300px]" 
                     />
                  </div>
               </div>

               <div className="glass rounded-3xl border-white/5 overflow-hidden">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="text-gray-500 text-[10px] font-black uppercase tracking-widest bg-white/[0.02]">
                           <th className="px-8 py-5">Avatar</th>
                           <th className="px-8 py-5">Utilisateur</th>
                           <th className="px-8 py-5">Email</th>
                           <th className="px-8 py-5">Favoris</th>
                           <th className="px-8 py-5">Rôle</th>
                           <th className="px-8 py-5">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {filteredUsers.map((u) => (
                           <tr key={u.id} className="hover:bg-white/[0.01] transition-colors group">
                              <td className="px-8 py-5">
                                 <div className="w-10 h-10 bg-[#e50914] rounded-full flex items-center justify-center text-white font-black text-sm uppercase">
                                    {(u.displayName || u.email || '?')[0]}
                                 </div>
                              </td>
                              <td className="px-8 py-5 text-sm font-bold text-white">
                                 {u.displayName || 'Utilisateur'}
                              </td>
                              <td className="px-8 py-5 text-gray-400 text-xs">
                                 {u.email}
                              </td>
                              <td className="px-8 py-5 text-gray-400 text-xs font-black">
                                 {u.favorites?.length || 0}
                              </td>
                              <td className="px-8 py-5">
                                 {u.isAdmin ? (
                                    <span className="px-3 py-1 rounded-lg bg-[#e50914]/10 text-[#e50914] text-[9px] font-black uppercase tracking-widest border border-[#e50914]/20">ADMIN</span>
                                 ) : (
                                    <span className="px-3 py-1 rounded-lg bg-white/5 text-gray-500 text-[9px] font-black uppercase tracking-widest border border-white/10">USER</span>
                                 )}
                              </td>
                              <td className="px-8 py-5">
                                 <button 
                                    onClick={() => handleToggleAdmin(u.id, u.isAdmin, u.email)}
                                    className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                                    title={u.isAdmin ? "Retirer admin" : "Nommer admin"}
                                 >
                                    <Shield size={16} className={u.isAdmin ? 'text-[#e50914]' : ''} />
                                 </button>
                              </td>
                           </tr>
                        ))}
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
                     <h2 className="text-2xl font-black uppercase tracking-tight font-display">Toutes les Chaînes</h2>
                     <p className="text-gray-500 text-sm font-medium">{channels.length} sources actives sur la plateforme.</p>
                  </div>
                  <div className="relative">
                     <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                     <input 
                        type="text" 
                        value={searchChannel}
                        onChange={(e) => setSearchChannel(e.target.value)}
                        placeholder="Filtrer les chaînes..."
                        className="bg-white/5 border border-white/10 rounded-xl py-3 px-12 text-sm focus:outline-none focus:border-[#e50914] w-[300px]" 
                     />
                  </div>
               </div>

               <div className="glass rounded-3xl border-white/5 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="text-gray-500 text-[10px] font-black uppercase tracking-widest bg-white/[0.02]">
                             <th className="px-8 py-5">Logo</th>
                             <th className="px-8 py-5">Nom</th>
                             <th className="px-8 py-5">Catégorie</th>
                             <th className="px-8 py-5">Pays</th>
                             <th className="px-8 py-5">Status</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {channels.filter(c => c.name.toLowerCase().includes(searchChannel.toLowerCase())).slice(0, 50).map((c) => (
                             <tr key={c.id} className="hover:bg-white/[0.01] transition-colors">
                                <td className="px-8 py-4">
                                   <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center p-2 border border-white/5">
                                      {c.logo ? <img src={c.logo} className="w-full h-full object-contain" alt="" /> : <Tv className="text-white/10" />}
                                   </div>
                                </td>
                                <td className="px-8 py-4 text-xs font-bold text-white uppercase tracking-wider">
                                   {c.name}
                                </td>
                                <td className="px-8 py-4">
                                   <span className="px-2 py-0.5 rounded-md bg-white/5 text-gray-400 text-[9px] font-black uppercase tracking-widest">
                                      {c.category}
                                   </span>
                                </td>
                                <td className="px-8 py-4 text-gray-500 text-[10px] font-bold uppercase">
                                   {c.country || 'INT'}
                                </td>
                                <td className="px-8 py-4">
                                   <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                      <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">ONLINE</span>
                                   </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
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
                     <h2 className="text-2xl font-black uppercase tracking-tight font-display">Journal des Activités</h2>
                     <p className="text-gray-500 text-sm font-medium">Suivi en temps réel des actions effectuées sur la plateforme.</p>
                  </div>
                  <div className="relative">
                     <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                     <input 
                        type="text" 
                        value={searchAudit}
                        onChange={(e) => setSearchAudit(e.target.value)}
                        placeholder="Filtrer l'historique..."
                        className="bg-white/5 border border-white/10 rounded-xl py-3 px-12 text-sm focus:outline-none focus:border-[#e50914] w-[300px]" 
                     />
                  </div>
               </div>

               <div className="glass rounded-3xl border-white/5 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="text-gray-500 text-[10px] font-black uppercase tracking-widest bg-white/[0.02]">
                             <th className="px-8 py-5">Action</th>
                             <th className="px-8 py-5">Cible</th>
                             <th className="px-8 py-5">Utilisateur</th>
                             <th className="px-8 py-5">Horodatage</th>
                             <th className="px-8 py-5">Détails</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {views.map((view, i) => (
                             <tr key={i} className="hover:bg-white/[0.01] transition-colors group">
                                <td className="px-8 py-5">
                                   <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">PLAY_STREAM</span>
                                   </div>
                                </td>
                                <td className="px-8 py-5">
                                   <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-black rounded p-1 border border-white/5">
                                         <img 
                                           src={channels.find(c => c.id === view.channelId)?.logo || ""} 
                                           className="w-full h-full object-contain" 
                                           alt="" 
                                           onError={(e) => (e.currentTarget.style.display = 'none')}
                                         />
                                      </div>
                                      <span className="text-xs font-bold">{channels.find(c => c.id === view.channelId)?.name || view.channelId}</span>
                                   </div>
                                </td>
                                <td className="px-8 py-5 text-gray-400 font-mono text-[9px] uppercase">
                                   {view.userId.slice(0, 16)}...
                                </td>
                                <td className="px-8 py-5">
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-white">{view.timestamp.toDate().toLocaleDateString('fr-FR')}</span>
                                      <span className="text-[10px] text-gray-600 font-medium">{view.timestamp.toDate().toLocaleTimeString('fr-FR')}</span>
                                   </div>
                                </td>
                                <td className="px-8 py-5">
                                   <button className="text-[9px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors">
                                      Inspecter
                                   </button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
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
                  <h2 className="text-2xl font-black uppercase tracking-tight font-display">Paramètres de la Plateforme</h2>
                  <p className="text-gray-500 text-sm font-medium">Configurez les options de donation et les messages globaux.</p>
               </div>

               <div className="glass p-10 rounded-[40px] border-white/5 space-y-10">
                  <form onSubmit={handleSettingsUpdate} className="space-y-8 font-display">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                              <Smartphone size={12} className="text-[#e50914]" /> FLOOZ
                           </label>
                           <input 
                              type="text" 
                              value={settings.donationFlooz}
                              onChange={(e) => setSettings({...settings, donationFlooz: e.target.value})}
                              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-[#e50914] text-sm"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                              <Smartphone size={12} className="text-[#e50914]" /> TMONEY
                           </label>
                           <input 
                              type="text" 
                              value={settings.donationTMoney}
                              onChange={(e) => setSettings({...settings, donationTMoney: e.target.value})}
                              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-[#e50914] text-sm"
                           />
                        </div>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                           <CreditCard size={12} className="text-[#e50914]" /> VISA / BANQUE
                        </label>
                        <input 
                           type="text" 
                           value={settings.donationVisa}
                           onChange={(e) => setSettings({...settings, donationVisa: e.target.value})}
                           className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-[#e50914] text-sm"
                        />
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                           <MessageSquare size={12} className="text-[#e50914]" /> Message de Soutien
                        </label>
                        <textarea 
                           value={settings.supportMessage}
                           onChange={(e) => setSettings({...settings, supportMessage: e.target.value})}
                           className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-[#e50914] text-sm min-h-[140px]"
                        />
                     </div>

                     <div className="pt-6">
                        <button type="submit" className="w-full md:w-auto bg-[#e50914] text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-[#b20710] transition-all">
                           Enregistrer Configuration
                        </button>
                     </div>
                  </form>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const SidebarLink: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
   <button 
      onClick={onClick}
      className={cn(
         "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all",
         active ? "bg-[#e50914] text-white shadow-2xl scale-[1.02]" : "text-gray-500 hover:bg-white/5 hover:text-white"
      )}
   >
      {icon}
      {label}
   </button>
);

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({ icon, label, value, color }) => (
   <div className="glass p-8 rounded-3xl border-white/5 space-y-6 admin-glow">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5", color)}>
         {icon}
      </div>
      <div>
         <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{label}</p>
         <p className="text-3xl font-display font-black tracking-tight">{value}</p>
      </div>
   </div>
);


export default Admin;
