import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  Property,
  UserRole,
  PropertyStatus,
  AgentSubscriptionPlan,
  AGENT_SUBSCRIPTION_PLANS,
  isAgentSubscriptionActive,
  getDaysRemaining
} from '../types';
import { isPropertyActiveAndVisible } from '../services/propertyService';
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
  TrendingUp,
  DollarSign,
  Heart,
  User,
  Sparkles,
  Wifi,
  Globe,
  Clock,
  Laptop,
  Smartphone,
  Search,
  Filter,
  UserCheck,
  UserPlus,
  Activity,
  ArrowUpRight,
  MapPin,
  Crown,
  Calendar,
  AlertTriangle,
  Award,
  Phone,
  Compass,
  Home,
  Camera,
  MessageCircle,
  ExternalLink,
  Send
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
  toggleRegisteredUserCanPublish,
  toggleRegisteredUserPartner,
  deleteRegisteredUser,
  resetToVerifiedAdminsOnly,
  RegisteredUser,
  ActiveSession,
  VisitorLog
} from '../services/activityService';
import {
  updateAgentSubscriptionInFirestore,
  updateUserRoleInFirestore,
  updateUserProfileInFirestore
} from '../services/authService';
import { AgentSubscriptionModal } from '../components/AgentSubscriptionModal';
import { UserAvatar } from '../components/UserAvatar';
import { PhoneNotificationBanner } from '../components/PhoneNotificationBanner';
import { getUserInquiries, InquiryMessage } from '../services/inquiryService';

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
  type DashboardTab =
    | 'my_listings'
    | 'client_favorites'
    | 'client_inquiries'
    | 'client_upgrade'
    | 'client_stats'
    | 'agent_inquiries'
    | 'agent_stats'
    | 'admin_users'
    | 'admin_connected'
    | 'admin_visitors'
    | 'admin_stats';

  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    if (user?.role === 'client') {
      return user?.canPublish ? 'my_listings' : 'client_favorites';
    }
    if (user?.role === 'agent' || user?.role === 'admin' || user?.role === 'bailleur') return 'my_listings';
    return 'client_favorites';
  });

  // Keep activeTab aligned when user role changes
  useEffect(() => {
    if (user?.role === 'client' && !user?.canPublish && (activeTab === 'my_listings' || activeTab.startsWith('admin_') || activeTab === 'agent_stats')) {
      setActiveTab('client_favorites');
    } else if ((user?.role === 'agent' || user?.role === 'bailleur') && (activeTab.startsWith('client_') || activeTab.startsWith('admin_'))) {
      setActiveTab('my_listings');
    }
  }, [user?.role, user?.canPublish]);

  // Real-time inquiries
  const [inquiries, setInquiries] = useState<InquiryMessage[]>(() => getUserInquiries(user));

  // Real-time tracking data from activityService
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);

  // Search, Filter and Modal states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('tous');
  const [visitorTypeFilter, setVisitorTypeFilter] = useState<string>('tous');
  const [inspectedSession, setInspectedSession] = useState<ActiveSession | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState<string | null>(null);

  // Real Estate Property Filters
  const [propSearchQuery, setPropSearchQuery] = useState('');
  const [propStatusFilter, setPropStatusFilter] = useState<string>('tous');
  const [propCommuneFilter, setPropCommuneFilter] = useState<string>('tous');
  const [propTypeFilter, setPropTypeFilter] = useState<string>('tous');

  // Agent Subscription Modal State
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [subscriptionTargetUser, setSubscriptionTargetUser] = useState<RegisteredUser | UserProfile | null>(null);
  const [showQuickCharts, setShowQuickCharts] = useState(true);

  // Load activity & user tracking data
  const refreshData = (isManual: boolean = false) => {
    setIsRefreshing(true);
    setRegisteredUsers(getRegisteredUsers());
    setActiveSessions(getActiveSessions());
    setVisitorLogs(getVisitorLogs());

    if (isManual) {
      setRefreshToast(`Données actualisées avec succès à ${new Date().toLocaleTimeString('fr-FR')}`);
      setTimeout(() => {
        setRefreshToast(null);
      }, 3500);
    }

    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  useEffect(() => {
    refreshData(false);
    const interval = setInterval(() => {
      refreshData(false);
    }, 6000); // refresh silently in background every 6 seconds
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = (uid: string, newStatus: 'active' | 'suspended' | 'pending') => {
    const updated = updateRegisteredUserStatus(uid, newStatus);
    setRegisteredUsers(updated);
  };

  const handleRoleChange = (uid: string, newRole: UserRole) => {
    if (newRole === 'agent') {
      const target = registeredUsers.find((u) => u.uid === uid);
      if (target) {
        setSubscriptionTargetUser(target);
        setSubscriptionModalOpen(true);
        return;
      }
    }
    const updated = updateRegisteredUserRole(uid, newRole);
    setRegisteredUsers(updated);
    updateUserRoleInFirestore(uid, newRole);

    if (user && user.uid === uid && setUser) {
      setUser({
        ...user,
        role: newRole
      });
    }
  };

  const handleOpenSubscriptionModal = (target: RegisteredUser | UserProfile) => {
    setSubscriptionTargetUser(target);
    setSubscriptionModalOpen(true);
  };

  const handleConfirmSubscription = async (
    plan: AgentSubscriptionPlan,
    priceUSD: number,
    agentExpiresAt: string,
    agencyName: string
  ) => {
    if (!subscriptionTargetUser) return;
    const uid = subscriptionTargetUser.uid;

    // 1. Update local state
    const updated = updateRegisteredUserRoleAndSubscription(uid, 'agent', {
      plan,
      priceUSD,
      agentExpiresAt,
      agencyName
    });
    setRegisteredUsers(updated);

    // 2. Update Firestore
    await updateAgentSubscriptionInFirestore(uid, plan, priceUSD, agentExpiresAt, agencyName);

    if (user && user.uid === uid && setUser) {
      setUser({
        ...user,
        role: 'agent',
        subscriptionPlan: plan,
        subscriptionAmount: priceUSD,
        subscriptionStartedAt: new Date().toISOString(),
        agentExpiresAt,
        agencyName: agencyName || user.agencyName || 'Agence Immobilière Agréée'
      });
    }

    const planDef = AGENT_SUBSCRIPTION_PLANS.find((p) => p.id === plan);
    setRefreshToast(
      `Forfait Agent (${planDef?.label || plan} - ${priceUSD}$) activé avec succès pour ${subscriptionTargetUser.fullname} ! Valide jusqu'au ${new Date(agentExpiresAt).toLocaleDateString('fr-FR')}`
    );
  };

  const handleDeleteUser = (u: RegisteredUser) => {
    if (u.role === 'admin' || u.email.toLowerCase() === 'benbarakashamamba@gmail.com' || u.email.toLowerCase() === 'davidmakindu9@gmail.com') {
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

  const handlePurgeUsers = () => {
    if (window.confirm('Voulez-vous nettoyer la base et ne conserver strictement que votre compte administrateur officiel ?')) {
      const updated = resetToVerifiedAdminsOnly();
      setRegisteredUsers(updated);
      setActiveSessions([]);
      setVisitorLogs([]);
      setRefreshToast('Base nettoyée : votre compte administrateur est conservé.');
      setTimeout(() => setRefreshToast(null), 3500);
    }
  };

  // Recharts Chart Data
  const categoryData = [
    { name: 'Maison', count: properties.filter((p) => p.category === 'maison').length },
    { name: 'Parcelle', count: properties.filter((p) => p.category === 'parcelle').length },
    { name: 'Appartement', count: properties.filter((p) => p.category === 'appartement').length },
    { name: 'Villa', count: properties.filter((p) => p.category === 'villa').length },
    { name: 'Commercial', count: properties.filter((p) => p.category === 'commercial').length }
  ];

  const transactionData = [
    { name: 'À Louer', count: properties.filter((p) => p.type === 'location').length },
    { name: 'À Vendre', count: properties.filter((p) => p.type === 'vente').length }
  ];

  // Commune Distribution
  const communeDistributionData = [
    {
      commune: 'Ibanda',
      biens: properties.filter((p) => p.commune === 'Ibanda').length,
      locations: properties.filter((p) => p.commune === 'Ibanda' && p.type === 'location').length,
      ventes: properties.filter((p) => p.commune === 'Ibanda' && p.type === 'vente').length
    },
    {
      commune: 'Kadutu',
      biens: properties.filter((p) => p.commune === 'Kadutu').length,
      locations: properties.filter((p) => p.commune === 'Kadutu' && p.type === 'location').length,
      ventes: properties.filter((p) => p.commune === 'Kadutu' && p.type === 'vente').length
    },
    {
      commune: 'Bagira',
      biens: properties.filter((p) => p.commune === 'Bagira').length,
      locations: properties.filter((p) => p.commune === 'Bagira' && p.type === 'location').length,
      ventes: properties.filter((p) => p.commune === 'Bagira' && p.type === 'vente').length
    }
  ];

  // Financial Value by Commune (Volume des loyers mensuels en USD)
  const financialCommuneData = [
    {
      commune: 'Ibanda',
      loyersTotal: properties
        .filter((p) => p.commune === 'Ibanda' && p.type === 'location')
        .reduce((sum, p) => sum + (p.price || 0), 0),
      ventesTotal: properties
        .filter((p) => p.commune === 'Ibanda' && p.type === 'vente')
        .reduce((sum, p) => sum + (p.price || 0), 0)
    },
    {
      commune: 'Kadutu',
      loyersTotal: properties
        .filter((p) => p.commune === 'Kadutu' && p.type === 'location')
        .reduce((sum, p) => sum + (p.price || 0), 0),
      ventesTotal: properties
        .filter((p) => p.commune === 'Kadutu' && p.type === 'vente')
        .reduce((sum, p) => sum + (p.price || 0), 0)
    },
    {
      commune: 'Bagira',
      loyersTotal: properties
        .filter((p) => p.commune === 'Bagira' && p.type === 'location')
        .reduce((sum, p) => sum + (p.price || 0), 0),
      ventesTotal: properties
        .filter((p) => p.commune === 'Bagira' && p.type === 'vente')
        .reduce((sum, p) => sum + (p.price || 0), 0)
    }
  ];

  const trafficTrendData = [
    { date: 'J-6', visiteurs: 1, connexions: 1, inscriptions: 1 },
    { date: 'J-5', visiteurs: 2, connexions: 1, inscriptions: 1 },
    { date: 'J-4', visiteurs: 3, connexions: 2, inscriptions: 1 },
    { date: 'J-3', visiteurs: 2, connexions: 1, inscriptions: 1 },
    { date: 'J-2', visiteurs: 4, connexions: 2, inscriptions: 1 },
    { date: 'Hier', visiteurs: Math.max(1, visitorLogs.length), connexions: Math.max(1, activeSessions.length), inscriptions: registeredUsers.length },
    { date: 'Aujourd\'hui', visiteurs: Math.max(1, visitorLogs.length), connexions: Math.max(1, activeSessions.length), inscriptions: registeredUsers.length }
  ];

  const neighborhoodTrafficData = [
    { name: 'Nguba', visits: 145 },
    { name: 'La Botte', visits: 112 },
    { name: 'Muhungu', visits: 98 },
    { name: 'Nyawera', visits: 76 },
    { name: 'Nyamugo', visits: 54 },
    { name: 'Panzi', visits: 41 }
  ];

  const COLORS = ['#FF385C', '#222222', '#008489', '#FC642D', '#717171', '#8b5cf6'];

  const myProperties = user?.role === 'admin'
    ? properties
    : properties.filter((p) => p.ownerId === user?.uid || (Boolean(user?.email) && p.ownerEmail === user?.email));

  const favoriteProperties = properties.filter((p) => favoriteIds.includes(p.id));

  const clientInquiries = inquiries.filter((inq) =>
    (user && inq.senderUid === user.uid) ||
    (user?.email && inq.senderEmail && inq.senderEmail.toLowerCase() === user.email.toLowerCase()) ||
    (user?.phone && inq.senderPhone && inq.senderPhone === user.phone)
  );

  const agentInquiries = inquiries.filter((inq) =>
    user?.role === 'admin' ||
    (user && inq.propertyOwnerId === user.uid) ||
    (user?.email && inq.propertyOwnerEmail && inq.propertyOwnerEmail.toLowerCase() === user.email.toLowerCase())
  );

  // Filtered lists
  const filteredProperties = myProperties.filter((p) => {
    const query = propSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.title.toLowerCase().includes(query) ||
      p.neighborhood.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query);
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

  const handleUpdateAvatar = async (newAvatarUrl: string) => {
    if (!user) return;
    const updatedUser: UserProfile = {
      ...user,
      avatarUrl: newAvatarUrl
    };
    if (setUser) {
      setUser(updatedUser);
    }
    try {
      await updateUserProfileInFirestore(user.uid, { avatarUrl: newAvatarUrl });
    } catch (err) {
      console.warn('Could not sync avatar to Firestore:', err);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Refresh Toast Banner (Strictly Admin only) */}
      {user?.role === 'admin' && refreshToast && (
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
              {user?.role === 'agent' && (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#FF385C]/10 text-[#FF385C] border border-[#FF385C]/20 uppercase tracking-wider flex items-center space-x-1">
                  <Crown className="w-3 h-3 text-[#FF385C]" />
                  <span>Agent Immobilier</span>
                </span>
              )}
              {user?.role === 'bailleur' && (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700 uppercase tracking-wider flex items-center space-x-1">
                  <Home className="w-3 h-3 text-amber-600" />
                  <span>Bailleur</span>
                </span>
              )}
              {user?.role === 'admin' && (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#222222] dark:bg-white text-white dark:text-[#222222] uppercase tracking-wider flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-[#FF385C]" />
                  <span>Administrateur</span>
                </span>
              )}
              {user?.isPartner && (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 uppercase tracking-wider flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Partenaire Agréé{user.partnerCategory ? ` • ${user.partnerCategory}` : ''}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[#717171] dark:text-[#b0b0b0] mt-0.5">{user?.email}</p>
            {user?.agencyName && (
              <p className="text-[11px] font-bold text-[#FF385C] flex items-center space-x-1 mt-0.5">
                <Building2 className="w-3 h-3" />
                <span>{user.agencyName}</span>
              </p>
            )}
            <p className="text-[11px] text-[#FF385C] font-semibold flex items-center space-x-1 mt-1">
              <Camera className="w-3 h-3" />
              <span>Cliquez sur l'avatar pour changer votre photo</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCurrentTab('map')}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-[#282828] dark:hover:bg-[#333] text-slate-800 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap border border-slate-200 dark:border-[#383838]"
          >
            <MapPin className="w-4 h-4 text-[#FF385C]" />
            <span>Carte Bukavu</span>
          </button>

          {user?.role === 'client' && (
            <button
              onClick={() => handleOpenSubscriptionModal(user)}
              className="bg-slate-900 hover:bg-black text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Devenir Agent</span>
            </button>
          )}

          {(user?.role === 'agent' || user?.role === 'admin' || user?.role === 'bailleur' || user?.canPublish) && (
            <button
              onClick={onOpenAddPropertyModal}
              className="bg-gradient-to-r from-[#FF385C] to-[#E00B41] hover:opacity-95 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center space-x-1.5 shrink-0 cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publier</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Phone Notification Quick Settings Banner */}
      <PhoneNotificationBanner />

      {/* Agent Active Subscription Status Card */}
      {user?.role === 'agent' && (
        <div className="p-4 sm:p-5 rounded-2xl border bg-slate-50 dark:bg-[#121212] border-slate-200 dark:border-[#2e2e2e] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#222222] dark:bg-white text-white dark:text-[#222222] flex items-center justify-center shrink-0 shadow-sm">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Abonnement Agent Immobilier Agréé
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FF385C] text-white">
                  {user.subscriptionPlan === '1_month'
                    ? 'Formule 1 Mois (10$)'
                    : user.subscriptionPlan === '1_year'
                    ? 'Formule 1 An (100$)'
                    : 'Formule 3 Mois (25$)'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {user.agentExpiresAt ? (
                  <>
                    Validité jusqu'au{' '}
                    <strong className="text-slate-900 dark:text-white">
                      {new Date(user.agentExpiresAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </strong>{' '}
                    ({getDaysRemaining(user.agentExpiresAt)} jours restants)
                  </>
                ) : (
                  'Accès publication et gestion actif à Bukavu'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              onClick={() => handleOpenSubscriptionModal(user)}
              className="bg-[#222222] hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-[#222222] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF385C]" />
              <span>Prolonger mon Abonnement</span>
            </button>
          </div>
        </div>
      )}

      {/* Client Informational Callout */}
      {user?.role === 'client' && (
        <div className="p-4 sm:p-5 rounded-2xl border bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-900/50 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                Vous êtes en compte Client / Chercheur de logement
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-400 mt-0.5 leading-relaxed">
                Pour publier vos biens immobiliers et éviter les arnaques à Bukavu, souscrivez à un forfait Agent agréé (10$/mois, 25$/3mois, 100$/an).
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenSubscriptionModal(user)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer self-start sm:self-auto shadow-xs flex items-center space-x-1.5"
          >
            <Crown className="w-3.5 h-3.5 text-amber-200" />
            <span>Voir les Tarifs & Devenir Agent</span>
          </button>
        </div>
      )}

      {/* Overview Stats Cards - Tailored by User Role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {user?.role === 'admin' ? (
          <>
            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-slate-200/80 dark:border-[#2e2e2e] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Parc Immobilier
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {properties.length}
                </h3>
                <span className="text-[11px] text-[#FF385C] font-semibold">
                  Biens à Bukavu
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-slate-200/80 dark:border-[#2e2e2e] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Comptes Enregistrés
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {registeredUsers.length}
                </h3>
                <span className="text-[11px] text-[#008489] dark:text-[#20a3a8] font-semibold">
                  {registeredUsers.filter((u) => u.role === 'agent').length} agents agréés
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#008489]/10 text-[#008489] flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-slate-200/80 dark:border-[#2e2e2e] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Demandes de Visite
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {inquiries.length}
                </h3>
                <span className="text-[11px] text-[#FF385C] font-semibold">
                  Sollicitations clients
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-slate-200/80 dark:border-[#2e2e2e] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Sessions en Direct
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 flex items-center space-x-2">
                  <span>{activeSessions.length}</span>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </h3>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                  Utilisateurs connectés
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Wifi className="w-6 h-6" />
              </div>
            </div>
          </>
        ) : user?.role === 'agent' ? (
          <>
            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-slate-200/80 dark:border-[#2e2e2e] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Portefeuille Annonces
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {myProperties.length}
                </h3>
                <span className="text-[11px] text-[#FF385C] font-semibold">
                  {myProperties.filter((p) => p.type === 'location').length} loc. • {myProperties.filter((p) => p.type === 'vente').length} ventes
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-slate-200/80 dark:border-[#2e2e2e] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Demandes de Visite
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {agentInquiries.length}
                </h3>
                <span className="text-[11px] text-[#008489] dark:text-[#20a3a8] font-semibold">
                  {agentInquiries.filter((i) => !i.agentReply).length} sans réponse
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#008489]/10 text-[#008489] flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-slate-200/80 dark:border-[#2e2e2e] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Biens Disponibles
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {myProperties.filter((p) => p.status === 'disponible').length}
                </h3>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                  Prêts à visiter
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                <Home className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-slate-200/80 dark:border-[#2e2e2e] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Agrément Agent
                </p>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                  {isAgentSubscriptionActive(user) ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Actif ({getDaysRemaining(user.agentExpiresAt!)}j)
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400">Expiré</span>
                  )}
                </h3>
                <span className="text-[11px] text-[#FF385C] font-semibold">
                  Agent Agréé Bukavu
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Crown className="w-6 h-6" />
              </div>
            </div>
          </>
        ) : (
          /* Client Role Stats */
          <>
            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-slate-200/80 dark:border-[#2e2e2e] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Biens Sauvegardés
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {favoriteProperties.length}
                </h3>
                <span className="text-[11px] text-[#FF385C] font-semibold">
                  Vos favoris à Bukavu
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center">
                <Heart className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-slate-200/80 dark:border-[#2e2e2e] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Demandes de Visite
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {clientInquiries.length}
                </h3>
                <span className="text-[11px] text-[#008489] dark:text-[#20a3a8] font-semibold">
                  Sollicitations transmises
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#008489]/10 text-[#008489] flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-slate-200/80 dark:border-[#2e2e2e] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Marché Disponible
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {properties.filter((p) => p.status === 'disponible').length}
                </h3>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                  Biens prêts à visiter
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-slate-200/80 dark:border-[#2e2e2e] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Statut Compte
                </p>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  Client Chercheur
                </h3>
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                  Recherche & contact directs
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Persistent Interactive Graphs & Analytics Overview for Bukavu */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-slate-200 dark:border-[#2e2e2e] p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2a2a2a] mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Aperçu Graphique du Marché (Bukavu)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Statistiques en temps réel sur les {properties.length} biens répertoriés
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowQuickCharts((prev) => !prev)}
            className="text-xs font-bold text-[#FF385C] hover:underline cursor-pointer flex items-center space-x-1"
          >
            <span>{showQuickCharts ? 'Masquer' : 'Afficher les graphiques'}</span>
          </button>
        </div>

        {showQuickCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* Chart 1: Commune Distribution */}
            <div className="bg-slate-50 dark:bg-[#151515] p-4 rounded-xl border border-slate-100 dark:border-[#2a2a2a] flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#FF385C]" />
                  <span>Diagramme par Commune (Locations vs Ventes)</span>
                </h4>
                <div className="w-full h-56 min-h-[220px]">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={communeDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="commune" stroke="#888888" fontSize={11} />
                      <YAxis stroke="#888888" fontSize={11} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="locations" fill="#FF385C" name="Locations" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="ventes" fill="#008489" name="Ventes" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Visual Strip Diagram for Communes */}
              <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-[#282828] space-y-2">
                {communeDistributionData.map((cd) => {
                  const total = cd.biens || (cd.locations + cd.ventes);
                  const pct = properties.length > 0 ? Math.round((total / properties.length) * 100) : 0;
                  return (
                    <div key={cd.commune} className="text-[11px]">
                      <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                        <span>{cd.commune}</span>
                        <span>{total} biens ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-[#282828] h-2 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${total > 0 ? (cd.locations / total) * 100 : 0}%` }}
                          className="bg-[#FF385C] h-full"
                          title={`Locations: ${cd.locations}`}
                        />
                        <div
                          style={{ width: `${total > 0 ? (cd.ventes / total) * 100 : 0}%` }}
                          className="bg-[#008489] h-full"
                          title={`Ventes: ${cd.ventes}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Category Distribution */}
            <div className="bg-slate-50 dark:bg-[#151515] p-4 rounded-xl border border-slate-100 dark:border-[#2a2a2a] flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#008489]" />
                  <span>Répartition par Type de Bien (Catégories)</span>
                </h4>
                <div className="w-full h-56 min-h-[220px]">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={`quick-cat-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Visual Strip Diagram for Categories */}
              <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-[#282828] grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categoryData.map((cat, idx) => {
                  const pct = properties.length > 0 ? Math.round((cat.count / properties.length) * 100) : 0;
                  return (
                    <div key={cat.name} className="p-2 rounded-lg bg-white dark:bg-[#202020] border border-slate-100 dark:border-[#2a2a2a] text-[11px]">
                      <div className="flex items-center space-x-1.5 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{cat.name}</span>
                      </div>
                      <div className="text-xs font-black text-slate-900 dark:text-white">
                        {cat.count} <span className="text-[10px] font-normal text-slate-500">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Role-Based Main Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-[#2e2e2e] flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm font-bold overflow-x-auto no-scrollbar pb-1">
        {user?.role === 'admin' ? (
          <>
            <button
              onClick={() => setActiveTab('my_listings')}
              className={`pb-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeTab === 'my_listings'
                  ? 'border-[#FF385C] text-[#FF385C]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Toutes les Annonces ({properties.length})
            </button>

            <button
              onClick={() => setActiveTab('admin_users')}
              className={`pb-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'admin_users'
                  ? 'border-[#FF385C] text-[#FF385C]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Utilisateurs Inscrits ({registeredUsers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('admin_connected')}
              className={`pb-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'admin_connected'
                  ? 'border-[#FF385C] text-[#FF385C]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wifi className="w-4 h-4 text-[#FF385C]" />
              <span>Utilisateurs Connectés ({activeSessions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('admin_visitors')}
              className={`pb-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'admin_visitors'
                  ? 'border-[#FF385C] text-[#FF385C]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Visiteurs de l'App</span>
            </button>

            <button
              onClick={() => setActiveTab('admin_stats')}
              className={`pb-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'admin_stats'
                  ? 'border-[#FF385C] text-[#FF385C]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Statistiques & Analytics</span>
            </button>
          </>
        ) : user?.role === 'agent' ? (
          <>
            <button
              onClick={() => setActiveTab('my_listings')}
              className={`pb-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'my_listings'
                  ? 'border-[#FF385C] text-[#FF385C]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Mes Annonces Publiées ({myProperties.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('agent_inquiries')}
              className={`pb-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'agent_inquiries'
                  ? 'border-[#FF385C] text-[#FF385C]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Demandes de Visite Reçues ({agentInquiries.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('agent_stats')}
              className={`pb-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'agent_stats'
                  ? 'border-[#FF385C] text-[#FF385C]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Performances</span>
            </button>
          </>
        ) : (
          /* Client Navigation Tabs */
          <>
            {(user?.canPublish || myProperties.length > 0) && (
              <button
                onClick={() => setActiveTab('my_listings')}
                className={`pb-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'my_listings'
                    ? 'border-[#FF385C] text-[#FF385C]'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Mes Annonces Publiées ({myProperties.length})</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('client_favorites')}
              className={`pb-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'client_favorites'
                  ? 'border-[#FF385C] text-[#FF385C]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Mes Favoris Sauvegardés</span>
            </button>

            <button
              onClick={() => setActiveTab('client_inquiries')}
              className={`pb-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'client_inquiries'
                  ? 'border-[#FF385C] text-[#FF385C]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Mes Demandes de Visite ({clientInquiries.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('client_stats')}
              className={`pb-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'client_stats'
                  ? 'border-[#FF385C] text-[#FF385C]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Tendances du Marché</span>
            </button>

            <button
              onClick={() => setActiveTab('client_upgrade')}
              className={`pb-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'client_upgrade'
                  ? 'border-[#FF385C] text-[#FF385C]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-500" />
              <span>Devenir Agent Immobilier Agréé</span>
            </button>
          </>
        )}
      </div>

      {/* Tab 1: Property Listings Table */}
      {activeTab === 'my_listings' && (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs overflow-hidden">
          {/* Real Estate Wireframe Header */}
          <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-[#151515] border-b border-slate-200 dark:border-[#2e2e2e] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-[#FF385C]" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {user?.role === 'admin' ? 'Toutes les Annonces de Bukavu' : 'Portefeuille Immobilier'}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#282828] text-slate-700 dark:text-slate-300">
                  {filteredProperties.length} / {myProperties.length}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Gestion des mandats de vente, location et parcelles
              </p>
            </div>

            {(user?.role === 'agent' || user?.role === 'admin' || user?.role === 'bailleur' || user?.canPublish) && (
              <button
                onClick={onOpenAddPropertyModal}
                className="bg-[#FF385C] hover:bg-[#E00B41] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publier</span>
              </button>
            )}
          </div>

          {/* Wireframe Real Estate Filter Bar */}
          <div className="p-3 bg-white dark:bg-[#1c1c1c] border-b border-slate-200 dark:border-[#2a2a2a] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Rechercher par titre, quartier..."
                value={propSearchQuery}
                onChange={(e) => setPropSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-[#383838] rounded-lg pl-8 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:border-[#FF385C]"
              />
            </div>

            <div>
              <select
                value={propStatusFilter}
                onChange={(e) => setPropStatusFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-[#383838] rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="tous">Tous les statuts</option>
                <option value="disponible">🟢 Disponible</option>
                <option value="loue">🔵 Déjà Loué</option>
                <option value="vendu">🟣 Déjà Vendu</option>
                <option value="en_attente">🟡 En attente</option>
              </select>
            </div>

            <div>
              <select
                value={propCommuneFilter}
                onChange={(e) => setPropCommuneFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-[#383838] rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="tous">Toutes les communes</option>
                <option value="Ibanda">Ibanda</option>
                <option value="Kadutu">Kadutu</option>
                <option value="Bagira">Bagira</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={propTypeFilter}
                onChange={(e) => setPropTypeFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-[#383838] rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="tous">Toutes transactions</option>
                <option value="location">Location</option>
                <option value="vente">Vente</option>
              </select>

              {(propSearchQuery || propStatusFilter !== 'tous' || propCommuneFilter !== 'tous' || propTypeFilter !== 'tous') && (
                <button
                  onClick={() => {
                    setPropSearchQuery('');
                    setPropStatusFilter('tous');
                    setPropCommuneFilter('tous');
                    setPropTypeFilter('tous');
                  }}
                  className="px-2.5 py-2 text-xs font-bold text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition whitespace-nowrap cursor-pointer"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredProperties.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Building2 className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Aucune annonce trouvée
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Modifiez vos critères de recherche ou ajoutez un nouveau bien immobilier.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-[#161616] text-slate-900 dark:text-slate-100 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Bien Immobilier</th>
                    <th className="p-3">Localisation</th>
                    <th className="p-3">Tarif ($ USD)</th>
                    <th className="p-3">Transaction</th>
                    <th className="p-3">Statut</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#2e2e2e]">
                  {filteredProperties.map((prop) => {
                    const isVisible = isPropertyActiveAndVisible(prop);
                    const isOwner = Boolean(
                      user && (
                        (prop.ownerId && prop.ownerId === user.uid) ||
                        (prop.ownerEmail && user.email && prop.ownerEmail.toLowerCase() === user.email.toLowerCase())
                      )
                    );
                    const canManage = user?.role === 'admin' || (user?.role === 'agent' && isOwner);

                    return (
                      <tr key={prop.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition">
                        <td className="p-3">
                          <div className="flex items-center space-x-3">
                            <img
                              src={prop.images[0]}
                              alt={prop.title}
                              className="w-11 h-11 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-[#333]"
                            />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white max-w-xs truncate">
                                {prop.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-semibold text-[#FF385C]">
                                  {prop.category.toUpperCase()}
                                </span>
                                {!isVisible && (
                                  <span className="bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                                    Forfait Expiré
                                  </span>
                                )}
                                {(prop.status === 'loue' || prop.status === 'vendu') && (
                                  <span className="bg-slate-800 text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                                    {prop.status === 'loue' ? 'Déjà Loué' : 'Déjà Vendu'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1 text-slate-800 dark:text-slate-200 font-semibold">
                            <MapPin className="w-3 h-3 text-[#FF385C] shrink-0" />
                            <span>{prop.neighborhood}, {prop.commune}</span>
                          </div>
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          ${prop.price.toLocaleString()} {prop.pricePeriod === 'mois' ? '/mois' : ''}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded uppercase font-bold text-[10px] ${
                            prop.type === 'vente'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                          }`}>
                            {prop.type === 'vente' ? 'Vente' : 'Location'}
                          </span>
                        </td>
                        <td className="p-3">
                          {canManage ? (
                            <select
                              value={prop.status}
                              onChange={(e) =>
                                onUpdatePropertyStatus(prop.id, e.target.value as PropertyStatus)
                              }
                              className={`border text-[11px] font-bold rounded-lg px-2 py-1 cursor-pointer ${
                                prop.status === 'disponible'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                  : prop.status === 'loue'
                                  ? 'bg-slate-100 dark:bg-[#282828] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                                  : 'bg-rose-50 dark:bg-[#2e1f22] text-rose-700 dark:text-rose-300 border-rose-300'
                              }`}
                            >
                              <option value="disponible">🟢 Disponible</option>
                              <option value="loue">🔵 Déjà Loué</option>
                              <option value="vendu">🟣 Déjà Vendu</option>
                              <option value="en_attente">🟡 En attente</option>
                            </select>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 capitalize">
                              {prop.status}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => onSelectProperty(prop)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg cursor-pointer"
                            title="Voir la fiche"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canManage && onOpenEditModal && (
                            <button
                              onClick={() => onOpenEditModal(prop)}
                              className="p-1.5 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg cursor-pointer"
                              title="Modifier l'annonce"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canManage && (
                            <button
                              onClick={() => onDeleteProperty(prop.id)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab: Client Favorites (Mes Favoris Sauvegardés) */}
      {activeTab === 'client_favorites' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
              <Heart className="w-5 h-5 text-[#FF385C]" />
              <span>Mes Biens Coups de Cœur & Favoris</span>
            </h3>
          </div>

          {favoriteProperties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {favoriteProperties.map((prop) => (
                <div
                  key={prop.id}
                  className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs overflow-hidden flex flex-col hover:shadow-md transition group"
                >
                  <div className="relative aspect-16/10 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={prop.images[0]}
                      alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      {prop.category} • {prop.type === 'vente' ? 'Vente' : 'Location'}
                    </div>
                    <div className="absolute top-3 right-3 bg-white/95 dark:bg-[#1e1e1e]/95 text-slate-900 dark:text-white px-2.5 py-1 rounded-lg text-xs font-extrabold shadow-sm">
                      ${prop.price.toLocaleString()} {prop.pricePeriod === 'mois' ? '/mois' : ''}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <p className="text-xs font-bold text-[#FF385C] flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{prop.neighborhood}</span>
                      </p>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1 line-clamp-2">
                        {prop.title}
                      </h4>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-[#2e2e2e] flex items-center gap-2">
                      <button
                        onClick={() => onSelectProperty(prop)}
                        className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Voir détails</span>
                      </button>
                      <button
                        onClick={() => {
                          const phone = prop.agentPhone || '+243986760178';
                          const cleanPhone = phone.replace(/[^0-9]/g, '');
                          window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Bonjour, je suis intéressé par votre annonce sur NyumbaLink: ${prop.title}`)}`, '_blank');
                        }}
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl transition cursor-pointer"
                        title="Contacter par WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1e1e1e] p-12 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] text-center space-y-4">
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 text-[#FF385C] rounded-full flex items-center justify-center mx-auto">
                <Heart className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Aucun bien en favori pour le moment
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Cliquez sur l'icône cœur présente sur les annonces pour sauvegarder vos logements préférés et les retrouver facilement ici.
                </p>
              </div>
              <button
                onClick={() => setCurrentTab('listings')}
                className="px-5 py-2.5 bg-[#FF385C] hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Explorer les Annonces à Bukavu
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Client Inquiries (Mes Demandes & Visites) */}
      {activeTab === 'client_inquiries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-[#008489]" />
              <span>Mes Demandes de Visite & Prises de Contact</span>
            </h3>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {clientInquiries.length} demande(s)
            </span>
          </div>

          {clientInquiries.length > 0 ? (
            <div className="space-y-3">
              {clientInquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-slate-200 dark:border-[#2e2e2e] p-4 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#2e2e2e] pb-3">
                    <div className="flex items-center space-x-3">
                      {inq.propertyImage && (
                        <img
                          src={inq.propertyImage}
                          alt={inq.propertyTitle}
                          className="w-12 h-12 rounded-xl object-cover shrink-0"
                        />
                      )}
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {inq.propertyTitle}
                        </h4>
                        <p className="text-xs text-[#FF385C] font-semibold flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{inq.propertyNeighborhood}</span>
                          {inq.propertyPrice && (
                            <span className="text-slate-900 dark:text-white font-bold ml-2">
                              • ${inq.propertyPrice.toLocaleString()}/mois
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {new Date(inq.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      {inq.agentReply ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Réponse reçue</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>En attente de l'agent</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-[#161616] p-3 rounded-xl space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Votre Message :
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 mt-0.5">{inq.message}</p>
                    </div>

                    {inq.visitDate && (
                      <div className="flex items-center space-x-2 text-xs font-bold text-[#FF385C]">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          Visite souhaitée : {inq.visitDate} {inq.visitTime ? `à ${inq.visitTime}` : ''}
                        </span>
                      </div>
                    )}

                    {inq.agentReply && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-lg">
                        <span className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-300 flex items-center space-x-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Réponse de {inq.agentReply.agentName || 'l\'Agent'} :</span>
                        </span>
                        <p className="text-emerald-900 dark:text-emerald-100 font-medium mt-1">
                          {inq.agentReply.text}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-1">
                    {inq.propertyOwnerPhone && (
                      <button
                        onClick={() => {
                          const cleanPhone = inq.propertyOwnerPhone!.replace(/[^0-9]/g, '');
                          window.open(`https://wa.me/${cleanPhone}`, '_blank');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Contacter sur WhatsApp</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1e1e1e] p-12 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] text-center space-y-4">
              <div className="w-16 h-16 bg-[#FF385C]/10 dark:bg-[#FF385C]/20 text-[#FF385C] rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Aucune demande de visite envoyée
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Lorsque vous sollicitez une visite sur une annonce ou contactez un agent, le suivi de votre demande apparaîtra ici.
                </p>
              </div>
              <button
                onClick={() => setCurrentTab('listings')}
                className="px-5 py-2.5 bg-[#FF385C] hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Parcourir les Logements à Bukavu
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Client Upgrade (Devenir Agent Agréé) */}
      {activeTab === 'client_upgrade' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-transparent p-6 rounded-2xl border border-amber-200 dark:border-amber-900/50">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-amber-500/20 text-amber-800 dark:text-amber-300 rounded-full text-xs font-black uppercase">
                <Crown className="w-3.5 h-3.5" />
                <span>Programme Partenaire Professionnel</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Devenez Agent Immobilier Agréé NyumbaLink à Bukavu
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Publiez vos maisons, appartements et parcelles sans limite. Bénéficiez d'un badge vérifié, recevez des clients qualifiés directement sur votre WhatsApp et optimisez vos transactions en toute sécurité.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {AGENT_SUBSCRIPTION_PLANS.map((plan) => {
              const isPopular = plan.id === '3_months';
              const features = [
                'Publication illimitée d\'annonces',
                'Badge Agent Vérifié à Bukavu',
                'Bouton WhatsApp direct sur vos biens',
                'Statistiques et gestion de contacts'
              ];
              return (
                <div
                  key={plan.id}
                  className={`bg-white dark:bg-[#1e1e1e] rounded-2xl border p-6 flex flex-col justify-between space-y-5 shadow-xs relative ${
                    isPopular
                      ? 'border-amber-500 ring-2 ring-amber-500/30'
                      : 'border-slate-200 dark:border-[#2e2e2e]'
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-3 py-0.5 rounded-full shadow-xs">
                      {plan.badgeText}
                    </span>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white">{plan.label}</h4>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">${plan.priceUSD}</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">/ {plan.label}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{plan.description}</p>

                    <ul className="space-y-2 pt-3 border-t border-slate-100 dark:border-[#2e2e2e] text-xs">
                      {features.map((feat, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleOpenSubscriptionModal(user || { uid: 'guest', fullname: 'Client', email: '', role: 'client', createdAt: new Date().toISOString() })}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-xs flex items-center justify-center space-x-1.5 ${
                      isPopular
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                        : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900'
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Activer ce forfait</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Agent Inquiries Received (Demandes de Visite Reçues) */}
      {activeTab === 'agent_inquiries' && user?.role === 'agent' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-[#008489]" />
              <span>Demandes de Visite & Contacts Clients Reçus</span>
            </h3>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {agentInquiries.length} demande(s) au total
            </span>
          </div>

          {agentInquiries.length > 0 ? (
            <div className="space-y-3">
              {agentInquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-slate-200 dark:border-[#2e2e2e] p-4 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#2e2e2e] pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[#FF385C] text-white font-bold flex items-center justify-center text-sm shrink-0">
                        {inq.senderName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {inq.senderName}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center space-x-1.5">
                          <Phone className="w-3 h-3 text-[#FF385C]" />
                          <span>{inq.senderPhone}</span>
                          {inq.senderEmail && <span>• {inq.senderEmail}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {new Date(inq.createdAt).toLocaleDateString('fr-FR')} à {new Date(inq.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-[#161616] p-3 rounded-xl space-y-1.5 text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">
                      Annonce concernée : <span className="text-[#FF385C]">{inq.propertyTitle}</span>
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 mt-1">{inq.message}</p>
                    {inq.visitDate && (
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Visite sollicitée pour le {inq.visitDate} {inq.visitTime ? `à ${inq.visitTime}` : ''}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <button
                      onClick={() => {
                        const cleanPhone = inq.senderPhone.replace(/[^0-9]/g, '');
                        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Bonjour ${inq.senderName}, je suis l'agent pour le bien "${inq.propertyTitle}" sur NyumbaLink.`)}`, '_blank');
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Répondre sur WhatsApp</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1e1e1e] p-12 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Aucune demande de visite en attente
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Dès qu'un client réserve une visite ou vous envoie un message sur l'une de vos annonces, vous le retrouverez instantanément ici.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Admin Registered Users Table (Utilisateurs Inscrits) */}
      {activeTab === 'admin_users' && user?.role === 'admin' && (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs overflow-hidden space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-[#121212] border-b border-slate-200 dark:border-[#2e2e2e] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-[#FF385C]" />
                <span>Utilisateurs Inscrits sur NyumbaLink</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Gestion complète des comptes inscrits à Bukavu (Clients, Agents & Administrateurs)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePurgeUsers}
                title="Conserver uniquement les 2 comptes Administrateurs officiels"
                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold hover:bg-rose-100 transition cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Purger faux comptes</span>
              </button>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher nom, email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white dark:bg-[#282828] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#FF385C] outline-hidden text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-white dark:bg-[#282828] border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
              >
                <option value="tous">Tous les rôles</option>
                <option value="client">Clients</option>
                <option value="agent">Agents Immobiliers</option>
                <option value="bailleur">Bailleurs / Propriétaires</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-[#161616] text-slate-900 dark:text-slate-100 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Utilisateur</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Localisation</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Rôle</th>
                  <th className="p-3">Forfait & Abonnement Agent</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2e2e2e]">
                {filteredUsers.map((u) => {
                  const isAgent = u.role === 'agent';
                  const daysRemaining = u.agentExpiresAt ? getDaysRemaining(u.agentExpiresAt) : null;
                  const isSubActive = isAgent ? isAgentSubscriptionActive(u) : false;

                  return (
                    <tr key={u.uid} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition">
                      <td className="p-3">
                        <div className="flex items-center space-x-2.5">
                          <UserAvatar
                            avatarUrl={u.avatarUrl}
                            fullname={u.fullname}
                            email={u.email}
                            role={u.role}
                            size="sm"
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5 flex-wrap">
                              <span>{u.fullname}</span>
                              {u.isPartner && (
                                <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-extrabold px-1.5 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-700 inline-flex items-center space-x-0.5">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>Partenaire</span>
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400">{u.email}</p>
                            {u.agencyName && (
                              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded font-bold text-slate-600 dark:text-slate-300 block w-max mt-0.5">
                                {u.agencyName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{u.phone || 'N/A'}</td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{u.city || 'Bukavu'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] uppercase ${
                            u.status === 'active'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                              : u.status === 'suspended'
                              ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400'
                              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {u.status === 'active' ? 'Actif' : u.status === 'suspended' ? 'Suspendu' : 'En attente'}
                        </span>
                      </td>
                      <td className="p-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                          className="bg-slate-100 dark:bg-[#282828] border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-100"
                        >
                          <option value="client">Client</option>
                          <option value="agent">Agent Immobilier</option>
                          <option value="bailleur">Bailleur / Propriétaire</option>
                          <option value="admin">Administrateur</option>
                        </select>
                      </td>
                      <td className="p-3">
                        {u.role === 'admin' ? (
                          <span className="px-2 py-1 rounded-md text-[10px] font-black bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center space-x-1 w-max">
                            <ShieldCheck className="w-3 h-3 text-rose-600" />
                            <span>Accès Total Admin</span>
                          </span>
                        ) : isAgent ? (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center space-x-1 ${
                                  isSubActive
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                                    : 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                                }`}
                              >
                                <Crown className="w-3 h-3 shrink-0" />
                                <span>
                                  {u.subscriptionPlan === '1_month'
                                    ? '1 Mois (10$)'
                                    : u.subscriptionPlan === '1_year'
                                    ? '1 An (100$)'
                                    : '3 Mois (25$)'}
                                </span>
                              </span>

                              <button
                                onClick={() => handleOpenSubscriptionModal(u)}
                                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-bold rounded-md transition cursor-pointer"
                                title="Modifier ou renouveler le forfait"
                              >
                                Modifier
                              </button>
                            </div>

                            {u.agentExpiresAt && (
                              <p className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                                <Calendar className="w-3 h-3 text-[#FF385C]" />
                                <span>
                                  {isSubActive ? (
                                    <>
                                      Exp: {new Date(u.agentExpiresAt).toLocaleDateString('fr-FR')} (
                                      <strong className="text-slate-900 dark:text-white">
                                        {daysRemaining}j restants
                                      </strong>
                                      )
                                    </>
                                  ) : (
                                    <strong className="text-rose-600 dark:text-rose-400">
                                      Forfait Expiré
                                    </strong>
                                  )}
                                </span>
                              </p>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenSubscriptionModal(u)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-[#FF385C]/10 text-[#FF385C] hover:bg-[#FF385C] hover:text-white border border-[#FF385C]/30 transition flex items-center space-x-1 cursor-pointer"
                          >
                            <Crown className="w-3 h-3" />
                            <span>Attribuer Forfait Agent</span>
                          </button>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => {
                            const nextPartner = !u.isPartner;
                            const updated = toggleRegisteredUserPartner(u.uid, nextPartner);
                            setRegisteredUsers(updated);
                            if (user && user.uid === u.uid && setUser) {
                              const updatedUser = {
                                ...user,
                                isPartner: nextPartner,
                                partnerApprovedDate: nextPartner ? new Date().toISOString() : undefined
                              };
                              setUser(updatedUser);
                              localStorage.setItem('nyumba_user', JSON.stringify(updatedUser));
                            }
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                            u.isPartner
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                          title={u.isPartner ? 'Retirer le statut Partenaire' : 'Valider comme Partenaire agréé'}
                        >
                          {u.isPartner ? '✓ Partenaire Agréé' : '+ Partenaire'}
                        </button>

                        {u.role !== 'admin' && (
                          <button
                            onClick={() => {
                              const updated = toggleRegisteredUserCanPublish(u.uid);
                              setRegisteredUsers(updated);
                              if (user && user.uid === u.uid && setUser) {
                                setUser({ ...user, canPublish: !user.canPublish });
                              }
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              u.canPublish
                                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                            title="Autoriser ou révoquer le droit de publication d'annonces pour ce compte"
                          >
                            {u.canPublish ? '✓ Droit Publication' : '+ Droit Publication'}
                          </button>
                        )}

                        {u.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(u.uid, 'suspended')}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            title="Suspendre le compte"
                          >
                            Suspendre
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(u.uid, 'active')}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            title="Activer le compte"
                          >
                            Activer
                          </button>
                        )}

                        {u.role !== 'admin' && u.email.toLowerCase() !== 'benbarakashamamba@gmail.com' && u.email.toLowerCase() !== 'davidmakindu9@gmail.com' && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            title="Supprimer définitivement ce compte"
                          >
                            Supprimer
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Admin Connected Users (Utilisateurs Connectés en Temps Réel) */}
      {activeTab === 'admin_connected' && user?.role === 'admin' && (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs overflow-hidden space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-[#121212] border-b border-slate-200 dark:border-[#2e2e2e] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>Utilisateurs Connectés en Direct ({activeSessions.length})</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Affiche les utilisateurs actuellement en ligne, leur appareil, contact téléphonique, page consultée et heure de connexion
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-[#161616] text-slate-900 dark:text-slate-100 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Utilisateur</th>
                  <th className="p-3">Rôle</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Page Actuelle</th>
                  <th className="p-3">Appareil Utilisé</th>
                  <th className="p-3">Heure Connexion</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2e2e2e]">
                {activeSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition">
                    <td className="p-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-[#222222] text-white dark:bg-white dark:text-[#222222] font-bold flex items-center justify-center text-xs">
                            {session.fullname.charAt(0).toUpperCase()}
                          </div>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#1e1e1e]"></span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{session.fullname}</p>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400">{session.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          session.role === 'admin'
                            ? 'bg-[#FF385C]/15 text-[#FF385C]'
                            : session.role === 'agent'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                            : 'bg-black/5 text-[#222222] dark:bg-white/10 dark:text-white'
                        }`}
                      >
                        {session.role === 'agent' ? 'Agent' : session.role === 'admin' ? 'Admin' : 'Client'}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-[#FF385C] shrink-0" />
                        <span>{session.phone || '+243990000000'}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                        <span>En Ligne</span>
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-[#FF385C]">
                      {session.currentPage}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center space-x-1.5">
                        {session.device.includes('Smartphone') || session.device.includes('Mobile') ? (
                          <Smartphone className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                        ) : (
                          <Laptop className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                        )}
                        <span className="truncate max-w-[170px]">{session.device}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {new Date(session.connectedAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setInspectedSession(session)}
                        className="px-2.5 py-1 bg-[#FF385C]/10 hover:bg-[#FF385C]/20 text-[#FF385C] dark:text-[#FF385C] text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ml-auto"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspecter</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Admin Visitors & Traffic (Utilisateurs qui ont visité l'application) */}
      {activeTab === 'admin_visitors' && user?.role === 'admin' && (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs overflow-hidden space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-[#121212] border-b border-slate-200 dark:border-[#2e2e2e] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <Globe className="w-4 h-4 text-[#FF385C]" />
                <span>Journal des Visites de l'Application</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Historique des parcours de navigation des visiteurs et membres sur la plateforme NyumbaLink
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Filtrer type :</span>
              <select
                value={visitorTypeFilter}
                onChange={(e) => setVisitorTypeFilter(e.target.value)}
                className="bg-white dark:bg-[#282828] border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
              >
                <option value="tous">Tous les visiteurs</option>
                <option value="guest">Invités Anonymes</option>
                <option value="client">Clients</option>
                <option value="agent">Agents</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-[#161616] text-slate-900 dark:text-slate-100 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Visiteur / Utilisateur</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Page Consultée</th>
                  <th className="p-3">Provenance / Source</th>
                  <th className="p-3">Appareil Utilisé</th>
                  <th className="p-3">Horodatage</th>
                  <th className="p-3">Durée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2e2e2e]">
                {filteredVisitors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition">
                    <td className="p-3">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{v.userFullname}</p>
                        {v.userEmail ? (
                          <span className="text-[10px] text-slate-600 dark:text-slate-400">{v.userEmail}</span>
                        ) : (
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 italic">Visiteur sans compte</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded uppercase font-bold text-[9px] ${
                          v.visitorType === 'guest'
                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : v.visitorType === 'admin'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                            : 'bg-[#FF385C]/10 text-[#FF385C]'
                        }`}
                      >
                        {v.visitorType}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                      {v.pageVisited}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-medium">
                        {v.referral}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center space-x-1.5">
                        {v.device.includes('Mobile') || v.device.includes('Smartphone') || v.device.includes('Tecno') || v.device.includes('Galaxy') || v.device.includes('Infinix') ? (
                          <Smartphone className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                        ) : (
                          <Laptop className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                        )}
                        <span className="truncate max-w-[160px]">{v.device}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {new Date(v.timestamp).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 font-bold">
                      {v.durationMinutes} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Admin Analytics & Graphs */}
      {activeTab === 'admin_stats' && user?.role === 'admin' && (
        <div className="space-y-6">
          {/* Summary KPIs Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Volume Locatif Mensuel</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                ${properties.filter((p) => p.type === 'location').reduce((sum, p) => sum + (p.price || 0), 0).toLocaleString()}
                <span className="text-xs font-normal text-slate-500 ml-1">USD / mois</span>
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                Sur {properties.filter((p) => p.type === 'location').length} biens en location
              </p>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valeur Patrimoine en Vente</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                ${properties.filter((p) => p.type === 'vente').reduce((sum, p) => sum + (p.price || 0), 0).toLocaleString()}
                <span className="text-xs font-normal text-slate-500 ml-1">USD</span>
              </h3>
              <p className="text-[11px] text-[#FF385C] font-semibold mt-1">
                Sur {properties.filter((p) => p.type === 'vente').length} parcelles/maisons en vente
              </p>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Demandes & Messages Clients</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {inquiries.length}
                <span className="text-xs font-normal text-slate-500 ml-1">demandes</span>
              </h3>
              <p className="text-[11px] text-[#008489] font-semibold mt-1">
                Taux de réponse : {inquiries.length > 0 ? Math.round((inquiries.filter((i) => i.agentReply).length / inquiries.length) * 100) : 100}%
              </p>
            </div>
          </div>

          {/* Traffic Trend Area Chart */}
          <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-[#FF385C]" />
                  <span>Évolution du Trafic Utilisateur & Inscriptions</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Activité sur la plateforme NyumbaLink Bukavu sur 7 jours
                </p>
              </div>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficTrendData}>
                  <defs>
                    <linearGradient id="colorVisiteurs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF385C" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#FF385C" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorConnexions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#008489" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#008489" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="date" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="visiteurs" stroke="#FF385C" fillOpacity={1} fill="url(#colorVisiteurs)" name="Visiteurs" />
                  <Area type="monotone" dataKey="connexions" stroke="#008489" fillOpacity={1} fill="url(#colorConnexions)" name="Connexions Actives" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Commune Distribution Bar Chart */}
            <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#FF385C]" />
                <span>Répartition des Annonces par Commune (Ibanda, Kadutu, Bagira)</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={communeDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="commune" stroke="#888888" fontSize={11} />
                    <YAxis stroke="#888888" fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="locations" fill="#FF385C" name="Locations" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ventes" fill="#008489" name="Ventes" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Financial Volume by Commune */}
            <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>Volume Financier Mensuel des Loyers ($ USD) par Commune</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialCommuneData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="commune" stroke="#888888" fontSize={11} />
                    <YAxis stroke="#888888" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="loyersTotal" fill="#10b981" radius={[8, 8, 0, 0]} name="Loyers Mensuels ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Pie Chart */}
            <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Répartition des Biens par Catégorie
              </h3>
              <div className="h-64">
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

            {/* Neighborhood Popularity Bar Chart */}
            <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Quartiers de Bukavu les Plus Consultés
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={neighborhoodTrafficData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                    <YAxis stroke="#888888" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="visits" fill="#FF385C" radius={[8, 8, 0, 0]} name="Visites Estimées" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Agent / Bailleur Analytics & Performance */}
      {activeTab === 'agent_stats' && (user?.role === 'agent' || user?.role === 'bailleur' || user?.role === 'admin') && (
        <div className="space-y-6">
          {/* Agent KPIs Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mes Biens Gérés</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {myProperties.length}
                <span className="text-xs font-normal text-slate-500 ml-1">annonces</span>
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                {myProperties.filter((p) => p.status === 'disponible').length} actuellement disponibles
              </p>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valeur Locative Mensuelle</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                ${myProperties.filter((p) => p.type === 'location').reduce((sum, p) => sum + (p.price || 0), 0).toLocaleString()}
                <span className="text-xs font-normal text-slate-500 ml-1">USD / mois</span>
              </h3>
              <p className="text-[11px] text-[#FF385C] font-semibold mt-1">
                Génération de loyers potentiels
              </p>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Demandes de Visite Reçues</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {agentInquiries.length}
                <span className="text-xs font-normal text-slate-500 ml-1">prospects</span>
              </h3>
              <p className="text-[11px] text-[#008489] font-semibold mt-1">
                {agentInquiries.filter((i) => !i.agentReply).length} en attente de réponse
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Agent Properties by Category */}
            <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-[#FF385C]" />
                <span>Répartition de Mon Portefeuille par Catégorie</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Maison', count: myProperties.filter((p) => p.category === 'maison').length },
                        { name: 'Parcelle', count: myProperties.filter((p) => p.category === 'parcelle').length },
                        { name: 'Appartement', count: myProperties.filter((p) => p.category === 'appartement').length },
                        { name: 'Villa', count: myProperties.filter((p) => p.category === 'villa').length },
                        { name: 'Commercial', count: myProperties.filter((p) => p.category === 'commercial').length }
                      ].filter((d) => d.count > 0)}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-agent-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Agent Properties by Operation Type */}
            <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <Activity className="w-4 h-4 text-[#008489]" />
                <span>Répartition par Type (Location vs Vente)</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { type: 'Location', total: myProperties.filter((p) => p.type === 'location').length },
                      { type: 'Vente', total: myProperties.filter((p) => p.type === 'vente').length }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="type" stroke="#888888" fontSize={11} />
                    <YAxis stroke="#888888" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#FF385C" radius={[8, 8, 0, 0]} name="Nombre de biens" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Client Market Analytics & Real Estate Graphs */}
      {activeTab === 'client_stats' && (
        <div className="space-y-6">
          {/* Client Overview KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marché Total Bukavu</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {properties.length}
                <span className="text-xs font-normal text-slate-500 ml-1">biens répertoriés</span>
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                {properties.filter((p) => p.status === 'disponible').length} disponibles immédiatement
              </p>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loyer Moyen Estimé</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                ${properties.filter((p) => p.type === 'location').length > 0
                  ? Math.round(properties.filter((p) => p.type === 'location').reduce((s, p) => s + (p.price || 0), 0) / properties.filter((p) => p.type === 'location').length)
                  : 0}
                <span className="text-xs font-normal text-slate-500 ml-1">USD / mois</span>
              </h3>
              <p className="text-[11px] text-[#FF385C] font-semibold mt-1">
                À Ibanda, Kadutu et Bagira
              </p>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quartiers Couverts</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {new Set(properties.map((p) => p.neighborhood)).size}
                <span className="text-xs font-normal text-slate-500 ml-1">zones actives</span>
              </h3>
              <p className="text-[11px] text-[#008489] font-semibold mt-1">
                Nguba, La Botte, Muhungu, Nyawera...
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market by Commune */}
            <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#FF385C]" />
                <span>Offre Immobilière par Commune à Bukavu</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={communeDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="commune" stroke="#888888" fontSize={11} />
                    <YAxis stroke="#888888" fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="locations" fill="#FF385C" name="Locations" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ventes" fill="#008489" name="Ventes" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Market by Category */}
            <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-[#FF385C]" />
                <span>Types de Biens Disponibles sur le Marché</span>
              </h3>
              <div className="h-64">
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
                        <Cell key={`cell-client-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Popular Neighborhoods */}
          <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Attractivité et Popularité des Quartiers de Bukavu</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={neighborhoodTrafficData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="visits" fill="#FF385C" radius={[8, 8, 0, 0]} name="Recherches & Intérêts" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      {/* Inspection Modal for Active Session */}
      {inspectedSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#2e2e2e] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2e2e2e] pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center font-bold text-lg">
                  <Wifi className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Détails de Session en Direct</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Informations de l'utilisateur connecté sur NyumbaLink</p>
                </div>
              </div>
              <button
                onClick={() => setInspectedSession(null)}
                className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg cursor-pointer transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-slate-50 dark:bg-[#121212] p-4 rounded-xl border border-slate-100 dark:border-[#2e2e2e] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-full bg-[#FF385C] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                    {inspectedSession.fullname.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{inspectedSession.fullname}</h4>
                    <p className="text-slate-600 dark:text-slate-400">{inspectedSession.email}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-[10px] uppercase flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <span>En Ligne</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-[#121212] rounded-xl border border-slate-100 dark:border-[#2e2e2e]">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Rôle Utilisateur</span>
                  <span className="font-extrabold text-[#FF385C] text-xs mt-1 block uppercase">
                    {inspectedSession.role === 'admin' ? 'Administrateur' : inspectedSession.role === 'agent' ? 'Agent Immobilier' : 'Client'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#121212] rounded-xl border border-slate-100 dark:border-[#2e2e2e]">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Numéro de Téléphone</span>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <Phone className="w-3.5 h-3.5 text-[#FF385C] shrink-0" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {inspectedSession.phone || '+243990000000'}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#121212] rounded-xl border border-slate-100 dark:border-[#2e2e2e]">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Page Consultée</span>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <Compass className="w-3.5 h-3.5 text-[#FF385C] shrink-0" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                      {inspectedSession.currentPage}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#121212] rounded-xl border border-slate-100 dark:border-[#2e2e2e]">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Appareil Utilisé</span>
                  <div className="flex items-center space-x-1.5 mt-1">
                    {inspectedSession.device.includes('Smartphone') || inspectedSession.device.includes('Mobile') ? (
                      <Smartphone className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                    ) : (
                      <Laptop className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                    )}
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
                      {inspectedSession.device}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#121212] rounded-xl border border-slate-100 dark:border-[#2e2e2e] flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-[#FF385C]" />
                  <span className="font-medium">Heure de Connexion :</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {new Date(inspectedSession.connectedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-[#2e2e2e]">
              <button
                onClick={() => setInspectedSession(null)}
                className="px-5 py-2.5 bg-[#FF385C] hover:opacity-90 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent Subscription Modal */}
      <AgentSubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={() => {
          setSubscriptionModalOpen(false);
          setSubscriptionTargetUser(null);
        }}
        targetUser={subscriptionTargetUser}
        isAdminMode={user?.role === 'admin'}
        onConfirmSubscription={handleConfirmSubscription}
      />
    </div>
  );
};
