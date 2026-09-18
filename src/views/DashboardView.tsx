import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  Property,
  UserRole,
  PropertyStatus,
  AgentSubscriptionPlan,
  AGENT_SUBSCRIPTION_PLANS,
  getDaysRemaining
} from '../types';
import {
  Building2,
  Users,
  ShieldCheck,
  PlusCircle,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Wifi,
  Globe,
  Smartphone,
  Laptop,
  Search,
  Crown,
  Camera,
  MapPin,
  Sparkles,
  Home,
  FileText,
  DollarSign,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  getRegisteredUsers,
  getActiveSessions,
  getVisitorLogs,
  updateRegisteredUserStatus,
  updateRegisteredUserRole,
  updateRegisteredUserRoleAndSubscription,
  deleteRegisteredUser,
  RegisteredUser,
  ActiveSession,
  VisitorLog
} from '../services/activityService';
import {
  updateAgentSubscriptionInFirestore,
  updateUserRoleInFirestore,
  updateUserProfileInFirestore
} from '../services/authService';
import { UserAvatar } from '../components/UserAvatar';
import { PhoneNotificationBanner } from '../components/PhoneNotificationBanner';
import { getUserInquiries, InquiryMessage } from '../services/inquiryService';
import { getUserContracts, RentalContract } from '../services/contractService';

interface DashboardViewProps {
  user: UserProfile | null;
  setUser?: (user: UserProfile | null) => void;
  properties: Property[];
  favoriteIds: string[];
  onOpenAddPropertyModal: () => void;
  onOpenEditModal?: (property: Property) => void;
  onOpenBoostModal?: (property: Property) => void;
  onUpdatePropertyStatus: (id: string, status: PropertyStatus) => void;
  onDeleteProperty: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  setCurrentTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  setUser,
  properties,
  favoriteIds,
  onOpenAddPropertyModal,
  onOpenEditModal,
  onOpenBoostModal,
  onUpdatePropertyStatus,
  onDeleteProperty,
  onSelectProperty,
  setCurrentTab
}) => {
  const isAdmin = user?.role === 'admin';
  const isAgent = user?.role === 'agent' || user?.role === 'bailleur' || user?.isPartner;

  type DashboardTab =
    | 'overview'
    | 'my_listings'
    | 'agent_clients'
    | 'agent_contracts'
    | 'client_favorites'
    | 'client_inquiries'
    | 'admin_users'
    | 'admin_connected'
    | 'admin_visitors';

  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    if (isAdmin || isAgent) return 'overview';
    return 'client_favorites';
  });

  const [inquiries, setInquiries] = useState<InquiryMessage[]>([]);
  const [contracts, setContracts] = useState<RentalContract[]>([]);

  useEffect(() => {
    if (user) {
      void getUserInquiries(user).then(setInquiries);
      void getUserContracts(user).then(setContracts);
    }
  }, [user]);

  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('tous');
  const [visitorTypeFilter, setVisitorTypeFilter] = useState<string>('tous');
  const [refreshToast, setRefreshToast] = useState<string | null>(null);

  const [propSearchQuery, setPropSearchQuery] = useState('');
  const [propStatusFilter, setPropStatusFilter] = useState<string>('tous');
  const [propCommuneFilter, setPropCommuneFilter] = useState<string>('tous');
  const [propTypeFilter, setPropTypeFilter] = useState<string>('tous');

  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [subscriptionTargetUser, setSubscriptionTargetUser] = useState<RegisteredUser | UserProfile | null>(null);

  // Charger et synchroniser les données d'activité pour l'Admin
  const loadActivityData = () => {
    if (isAdmin) {
      let users = getRegisteredUsers();
      let sessions = getActiveSessions();
      let visitors = getVisitorLogs();

      // S'assurer que l'utilisateur connecté actuel est bien enregistré et visible dans les listes admin
      if (user && user.uid) {
        const existsInUsers = users.some(u => u.uid === user.uid);
        if (!existsInUsers) {
          const newUserEntry: RegisteredUser = {
            uid: user.uid,
            fullname: user.fullname || 'Utilisateur',
            email: user.email || '',
            role: user.role || 'client',
            phone: user.phone || '',
            authProvider: user.email?.includes('gmail.com') ? 'google' : 'email',
            isPartner: user.isPartner || false,
            status: 'active'
          };
          users = [newUserEntry, ...users];
        }

        const existsInSessions = sessions.some(s => s.userId === user.uid || s.userName === user.fullname);
        if (!existsInSessions) {
          const newSession: ActiveSession = {
            userId: user.uid,
            userName: user.fullname || 'Administrateur',
            role: user.role || 'admin',
            phone: user.phone || '',
            currentPage: 'Tableau de bord',
            deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
            deviceInfo: navigator.userAgent.includes('Chrome') ? 'Google Chrome Web' : 'Navigateur Web',
            loginTime: Date.now()
          };
          sessions = [newSession, ...sessions];
        }
      }

      if (visitors.length === 0) {
        visitors = [
          {
            visitorName: user?.fullname || 'Administrateur',
            visitorType: user?.role || 'admin',
            action: 'Connexion au tableau de bord',
            page: 'Dashboard',
            location: 'Bukavu, RDC',
            timestamp: Date.now()
          }
        ];
      }

      setRegisteredUsers(users);
      setActiveSessions(sessions);
      setVisitorLogs(visitors);
    }
  };

  useEffect(() => {
    loadActivityData();
    const interval = setInterval(() => loadActivityData(), 4000);
    return () => clearInterval(interval);
  }, [isAdmin, user]);

  const handleRoleChange = (uid: string, newRole: UserRole) => {
    const updated = updateRegisteredUserRole(uid, newRole);
    setRegisteredUsers(updated);
    updateUserRoleInFirestore(uid, newRole);
    setRefreshToast('Rôle mis à jour avec succès');
    setTimeout(() => setRefreshToast(null), 3000);
  };

  const handleTogglePartner = (uid: string) => {
    const target = registeredUsers.find(u => u.uid === uid);
    if (!target) return;
    const newPartnerState = !target.isPartner;
    const updated = registeredUsers.map(u => u.uid === uid ? { ...u, isPartner: newPartnerState } : u);
    setRegisteredUsers(updated);
    try {
      localStorage.setItem('nyumbalink_registered_users_v2', JSON.stringify(updated));
    } catch {}
    updateUserProfileInFirestore(uid, { isPartner: newPartnerState });
    setRefreshToast(newPartnerState ? 'Utilisateur désigné comme Partenaire Agréé' : 'Statut Partenaire retiré');
    setTimeout(() => setRefreshToast(null), 3000);
  };

  const handleDeleteUser = (u: RegisteredUser) => {
    if (u.role === 'admin' || u.email.toLowerCase() === 'benbarakashamamba@gmail.com') {
      alert('Impossible de supprimer un compte Administrateur principal.');
      return;
    }
    if (window.confirm(`Voulez-vous vraiment supprimer le compte de ${u.fullname} (${u.email}) ?`)) {
      const updated = deleteRegisteredUser(u.uid);
      setRegisteredUsers(updated);
      setRefreshToast(`Le compte de ${u.fullname} a été supprimé.`);
      setTimeout(() => setRefreshToast(null), 3000);
    }
  };

  // Filtrage des biens pour l'agent/partenaire ou admin
  const myProperties = isAdmin
    ? properties
    : properties.filter((p) => p.ownerId === user?.uid);

  const agentInquiries = inquiries.filter((inq) =>
    isAdmin || (user && inq.propertyOwnerId === user.uid)
  );

  const agentContracts = contracts.filter((c) =>
    isAdmin || (user && c.landlordId === user.uid)
  );

  const filteredProperties = myProperties.filter((p) => {
    const query = propSearchQuery.toLowerCase().trim();
    const matchesSearch = !query || p.title.toLowerCase().includes(query) || p.neighborhood.toLowerCase().includes(query);
    const matchesStatus = propStatusFilter === 'tous' || p.status === propStatusFilter;
    const matchesCommune = propCommuneFilter === 'tous' || p.commune === propCommuneFilter;
    const matchesType = propTypeFilter === 'tous' || p.type === propTypeFilter;
    return matchesSearch && matchesStatus && matchesCommune && matchesType;
  });

  const filteredUsers = registeredUsers.filter((u) => {
    const matchesSearch = u.fullname.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                          (u.phone && u.phone.includes(userSearchQuery));
    const matchesRole = roleFilter === 'tous' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredVisitors = visitorLogs.filter((v) => {
    return visitorTypeFilter === 'tous' || v.visitorType === visitorTypeFilter;
  });

  // Recharts Data pour l'évolution & statistiques
  const categoryData = [
    { name: 'Maison', count: properties.filter((p) => p.category === 'maison').length },
    { name: 'Parcelle', count: properties.filter((p) => p.category === 'parcelle').length },
    { name: 'Appartement', count: properties.filter((p) => p.category === 'appartement').length },
    { name: 'Villa', count: properties.filter((p) => p.category === 'villa').length },
    { name: 'Commercial', count: properties.filter((p) => p.category === 'commercial').length }
  ];

  const communeDistributionData = [
    { commune: 'Ibanda', biens: properties.filter((p) => p.commune === 'Ibanda').length },
    { commune: 'Kadutu', biens: properties.filter((p) => p.commune === 'Kadutu').length },
    { commune: 'Bagira', biens: properties.filter((p) => p.commune === 'Bagira').length }
  ];

  const financialCommuneData = [
    {
      commune: 'Ibanda',
      loyersTotal: properties.filter((p) => p.commune === 'Ibanda' && p.type === 'location').reduce((sum, p) => sum + (p.price || 0), 0)
    },
    {
      commune: 'Kadutu',
      loyersTotal: properties.filter((p) => p.commune === 'Kadutu' && p.type === 'location').reduce((sum, p) => sum + (p.price || 0), 0)
    },
    {
      commune: 'Bagira',
      loyersTotal: properties.filter((p) => p.commune === 'Bagira' && p.type === 'location').reduce((sum, p) => sum + (p.price || 0), 0)
    }
  ];

  const COLORS = ['#FF385C', '#222222', '#008489', '#717171', '#b0b0b0'];

  const handleUpdateAvatar = async (newAvatarUrl: string) => {
    if (!user) return;
    const updatedUser: UserProfile = { ...user, avatarUrl: newAvatarUrl };
    if (setUser) setUser(updatedUser);
    try {
      await updateUserProfileInFirestore(user.uid, { avatarUrl: newAvatarUrl });
    } catch (err) {
      console.warn('Could not sync avatar:', err);
    }
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      {refreshToast && (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-xl font-bold text-xs shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#FF385C]" />
            <span>{refreshToast}</span>
          </div>
          <button onClick={() => setRefreshToast(null)} className="text-white/80 hover:text-white cursor-pointer">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Profil */}
      <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-[#ebebeb] dark:border-[#2e2e2e] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <UserAvatar
            avatarUrl={user?.avatarUrl}
            fullname={user?.fullname}
            email={user?.email}
            role={user?.role}
            size="lg"
            editable={true}
            onAvatarChange={handleUpdateAvatar}
          />
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h1 className="text-2xl font-bold text-[#222222] dark:text-[#f7f7f7]">
                {user?.fullname || 'Utilisateur NyumbaLink'}
              </h1>
              {isAgent && (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#FF385C]/10 text-[#FF385C] border border-[#FF385C]/20 uppercase tracking-wider flex items-center space-x-1">
                  <Crown className="w-3 h-3 text-[#FF385C]" />
                  <span>Agent / Partenaire Agréé</span>
                </span>
              )}
              {isAdmin && (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#222222] dark:bg-white text-white dark:text-[#222222] uppercase tracking-wider flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-[#FF385C]" />
                  <span>Administrateur</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[#717171] dark:text-[#b0b0b0] mt-0.5">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTab('map')}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-[#282828] text-slate-800 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-[#FF385C]" />
            <span>Carte Bukavu</span>
          </button>
          {(isAgent || isAdmin) && (
            <button
              onClick={onOpenAddPropertyModal}
              className="bg-gradient-to-r from-[#FF385C] to-[#E00B41] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publier un Bien</span>
            </button>
          )}
        </div>
      </div>

      <PhoneNotificationBanner />

      {/* Onglets de Navigation du Dashboard */}
      <div className="flex overflow-x-auto space-x-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'overview' ? 'bg-[#FF385C] text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Vue d'ensemble & Évolution</span>
        </button>

        <button
          onClick={() => setActiveTab('my_listings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'my_listings' ? 'bg-[#FF385C] text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>{isAdmin ? 'Tous les Biens' : 'Mes Biens Immobiliers'}</span>
          <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">{myProperties.length}</span>
        </button>

        {(isAgent || isAdmin) && (
          <>
            <button
              onClick={() => setActiveTab('agent_clients')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'agent_clients' ? 'bg-[#FF385C] text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Mes Clients & Demandes</span>
              <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">{agentInquiries.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('agent_contracts')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'agent_contracts' ? 'bg-[#FF385C] text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Mes Contrats de Bail</span>
              <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">{agentContracts.length}</span>
            </button>
          </>
        )}

        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('admin_users')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'admin_users' ? 'bg-[#FF385C] text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Utilisateurs & Inscriptions</span>
              <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">{registeredUsers.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('admin_connected')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'admin_connected' ? 'bg-[#FF385C] text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Utilisateurs Connectés</span>
              <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">{activeSessions.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('admin_visitors')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'admin_visitors' ? 'bg-[#FF385C] text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Visiteurs de l'App</span>
              <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">{visitorLogs.length}</span>
            </button>
          </>
        )}
      </div>

      {/* CONTENU ONGLET: VUE D'ENSEMBLE & GRAPHIQUES */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Cartes métriques rapides */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{isAdmin ? 'Total Biens Plateforme' : 'Mes Biens Immobiliers'}</p>
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{myProperties.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{isAdmin ? 'Total Demandes / Clients' : 'Mes Clients & Demandes'}</p>
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{agentInquiries.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#008489]/10 text-[#008489] flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contrats de Bail</p>
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{agentContracts.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
            </div>

            {isAdmin && (
              <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Utilisateurs Enregistrés</p>
                  <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{registeredUsers.length}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            )}
          </div>

          {/* GRAPHIQUES RECHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Répartition des Biens par Catégorie */}
            <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-3xl border border-gray-200 dark:border-gray-800 space-y-4 shadow-xs">
              <h3 className="text-sm font-black uppercase text-gray-800 dark:text-gray-200">Répartition des Biens par Catégorie</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Répartition géographique par Commune */}
            <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-3xl border border-gray-200 dark:border-gray-800 space-y-4 shadow-xs">
              <h3 className="text-sm font-black uppercase text-gray-800 dark:text-gray-200">Volume des Biens par Commune (Bukavu)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={communeDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="commune" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="biens" fill="#FF385C" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Volume Financier des Loyers par Commune */}
            <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-3xl border border-gray-200 dark:border-gray-800 space-y-4 shadow-xs lg:col-span-2">
              <h3 className="text-sm font-black uppercase text-gray-800 dark:text-gray-200">Volume Financier Mensuel des Loyers ($ / Mois)</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={financialCommuneData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="commune" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="loyersTotal" stroke="#FF385C" fill="#FF385C" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENU ONGLET: MES / TOUS LES BIENS */}
      {activeTab === 'my_listings' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un bien..."
                value={propSearchQuery}
                onChange={e => setPropSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-white dark:bg-[#1a1a1a] text-xs font-medium"
              />
            </div>
            {(isAgent || isAdmin) && (
              <button
                onClick={onOpenAddPropertyModal}
                className="bg-[#FF385C] hover:bg-[#E00B41] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Ajouter un Bien</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white dark:bg-[#1e1e1e] rounded-3xl border border-dashed p-8">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Aucun bien immobilier trouvé</p>
              </div>
            ) : (
              filteredProperties.map(property => (
                <div key={property.id} className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs space-y-3 pb-4">
                  <div className="relative h-48 bg-gray-100">
                    <img src={property.imageUrl} alt={property.title} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 px-3 py-1 bg-black/70 text-white text-[10px] font-black uppercase rounded-full">
                      {property.type}
                    </span>
                  </div>
                  <div className="px-4 space-y-1">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">{property.title}</h3>
                    <p className="text-xs text-gray-500">{property.neighborhood}, {property.commune}</p>
                    <p className="text-sm font-extrabold text-[#FF385C]">{property.price} $ {property.type === 'location' ? '/ mois' : ''}</p>
                  </div>
                  <div className="px-4 pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
                    <button onClick={() => onSelectProperty(property)} className="text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-[#FF385C] flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>Voir</span>
                    </button>
                    {onOpenEditModal && (
                      <button onClick={() => onOpenEditModal(property)} className="text-xs font-bold text-indigo-600 hover:underline flex items-center space-x-1">
                        <Edit className="w-4 h-4" />
                        <span>Modifier</span>
                      </button>
                    )}
                    <button onClick={() => onDeleteProperty(property.id)} className="text-xs font-bold text-rose-600 hover:underline flex items-center space-x-1">
                      <Trash2 className="w-4 h-4" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CONTENU ONGLET: MES CLIENTS & DEMANDES */}
      {(isAgent || isAdmin) && activeTab === 'agent_clients' && (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Clients & Demandes de Visite</h3>
            <p className="text-xs text-gray-500">Liste des clients ayant contacté pour vos biens immobiliers.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase font-black">
                <tr>
                  <th className="p-3">Client</th>
                  <th className="p-3">Téléphone</th>
                  <th className="p-3">Bien concerné</th>
                  <th className="p-3">Date RDV</th>
                  <th className="p-3">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {agentInquiries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">Aucune demande client pour le moment.</td>
                  </tr>
                ) : (
                  agentInquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-gray-50/50">
                      <td className="p-3 font-bold text-gray-900 dark:text-white">{inq.senderName}</td>
                      <td className="p-3 text-gray-600">{inq.senderPhone || 'Non renseigné'}</td>
                      <td className="p-3 font-semibold text-[#FF385C]">{inq.propertyTitle}</td>
                      <td className="p-3 text-gray-600">{inq.visitDate ? `${inq.visitDate} à ${inq.visitTime || ''}` : 'À convenir'}</td>
                      <td className="p-3 text-gray-600 italic">"{inq.message}"</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENU ONGLET: MES CONTRATS DE BAIL */}
      {(isAgent || isAdmin) && activeTab === 'agent_contracts' && (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Contrats de Location (Baux)</h3>
            <p className="text-xs text-gray-500">Suivi des baux signés avec vos locataires.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase font-black">
                <tr>
                  <th className="p-3">Bien Immobilier</th>
                  <th className="p-3">Locataire</th>
                  <th className="p-3">Loyer Mensuel</th>
                  <th className="p-3">Période</th>
                  <th className="p-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {agentContracts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">Aucun contrat enregistré.</td>
                  </tr>
                ) : (
                  agentContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50/50">
                      <td className="p-3 font-bold text-gray-900 dark:text-white">{contract.propertyTitle}</td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">{contract.tenantName} ({contract.tenantPhone})</td>
                      <td className="p-3 font-extrabold text-[#FF385C]">{contract.monthlyRent} $ / mois</td>
                      <td className="p-3 text-gray-600">Du {contract.startDate} au {contract.endDate}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          contract.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {contract.status === 'active' ? 'Actif' : 'En attente'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENU ONGLET ADMIN : UTILISATEURS & INSCRIPTIONS */}
      {isAdmin && activeTab === 'admin_users' && (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4 items-center border-b pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Gestion des Utilisateurs & Inscriptions</h3>
              <p className="text-xs text-gray-500">Visualisez les inscrits, leurs rôles et accordez les statuts d'agent ou partenaire.</p>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Rechercher..."
                value={userSearchQuery}
                onChange={e => setUserSearchQuery(e.target.value)}
                className="px-3 py-2 rounded-xl border text-xs bg-gray-50 dark:bg-gray-900 w-full sm:w-64"
              />
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border text-xs bg-gray-50 dark:bg-gray-900"
              >
                <option value="tous">Tous les rôles</option>
                <option value="client">Client</option>
                <option value="bailleur">Bailleur</option>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase font-black">
                <tr>
                  <th className="p-3">Utilisateur</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Connexion / Source</th>
                  <th className="p-3">Rôle Actuel</th>
                  <th className="p-3">Partenaire</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">Aucun utilisateur enregistré trouvé.</td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isGoogleUser = u.authProvider === 'google' || u.email.includes('gmail.com');
                    return (
                      <tr key={u.uid} className="hover:bg-gray-50/50">
                        <td className="p-3 flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center font-bold">
                            {u.fullname ? u.fullname.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{u.fullname}</p>
                            <p className="text-gray-500 text-[11px]">{u.email}</p>
                          </div>
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{u.phone || 'Non renseigné'}</td>
                        <td className="p-3">
                          {isGoogleUser ? (
                            <span className="px-2.5 py-1 bg-red-50 text-red-600 font-bold rounded-lg text-[10px] border border-red-200">
                              Google Auth
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 font-bold rounded-lg text-[10px]">
                              Email / Mot de passe
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-bold uppercase text-[#FF385C]">{u.role}</td>
                        <td className="p-3">
                          <button
                            onClick={() => handleTogglePartner(u.uid)}
                            className={`px-3 py-1 rounded-full font-bold text-[10px] transition cursor-pointer ${
                              u.isPartner ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {u.isPartner ? 'Partenaire Agréé' : 'Non Partenaire'}
                          </button>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                            className="p-1.5 rounded-lg border text-[11px] font-bold bg-white dark:bg-gray-900"
                          >
                            <option value="client">Client</option>
                            <option value="bailleur">Bailleur</option>
                            <option value="agent">Agent</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENU ONGLET ADMIN : UTILISATEURS CONNECTÉS */}
      {isAdmin && activeTab === 'admin_connected' && (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Sessions & Utilisateurs Actuellement Connectés</h3>
            <p className="text-xs text-gray-500">Suivi en temps réel des utilisateurs connectés sur l'application NyumbaLink.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase font-black">
                <tr>
                  <th className="p-3">Utilisateur</th>
                  <th className="p-3">Rôle</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Page Actuelle</th>
                  <th className="p-3">Appareil Utilisé</th>
                  <th className="p-3">Heure Connexion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {activeSessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">Aucune session active détectée pour le moment.</td>
                  </tr>
                ) : (
                  activeSessions.map((session, index) => (
                    <tr key={index} className="hover:bg-gray-50/50">
                      <td className="p-3 font-bold text-gray-900 dark:text-white">{session.userName}</td>
                      <td className="p-3 uppercase font-bold text-[#FF385C]">{session.role}</td>
                      <td className="p-3 text-gray-600">{session.phone || 'Non renseigné'}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          En ligne
                        </span>
                      </td>
                      <td className="p-3 text-gray-600 font-medium">{session.currentPage || 'Accueil'}</td>
                      <td className="p-3 text-gray-600 flex items-center space-x-1">
                        {session.deviceType === 'mobile' ? <Smartphone className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
                        <span>{session.deviceInfo || 'Navigateur Web'}</span>
                      </td>
                      <td className="p-3 text-gray-500">{new Date(session.loginTime).toLocaleTimeString('fr-FR')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENU ONGLET ADMIN : VISITEURS DE L'APP */}
      {isAdmin && activeTab === 'admin_visitors' && (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Visiteurs & Trafic de l'Application</h3>
              <p className="text-xs text-gray-500">Historique des visites et connexions sur les biens et pages.</p>
            </div>
            <select
              value={visitorTypeFilter}
              onChange={e => setVisitorTypeFilter(e.target.value)}
              className="p-2 rounded-xl border text-xs bg-gray-50 dark:bg-gray-900 font-bold"
            >
              <option value="tous">Tous les types de visiteurs</option>
              <option value="client">Clients / Chercheurs</option>
              <option value="guest">Visiteurs Anonymes</option>
              <option value="agent">Agents / Bailleurs</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase font-black">
                <tr>
                  <th className="p-3">Visiteur</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Page / Action</th>
                  <th className="p-3">Localisation / IP</th>
                  <th className="p-3">Date & Heure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredVisitors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                      Aucun journal de visiteur disponible pour le moment.
                    </td>
                  </tr>
                ) : (
                  filteredVisitors.map((visitor, index) => (
                    <tr key={index} className="hover:bg-gray-50/50">
                      <td className="p-3 font-bold text-gray-900 dark:text-white">{visitor.visitorName || 'Visiteur Anonyme'}</td>
                      <td className="p-3 uppercase font-bold text-[#FF385C]">{visitor.visitorType || 'Guest'}</td>
                      <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">{visitor.action || visitor.page || 'Navigation'}</td>
                      <td className="p-3 text-gray-500">{visitor.location || 'Bukavu, RDC'}</td>
                      <td className="p-3 text-gray-500">{new Date(visitor.timestamp || Date.now()).toLocaleString('fr-FR')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};