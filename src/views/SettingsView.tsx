import React, { useState, useEffect } from 'react';
import {
  User,
  Trash2,
  HelpCircle,
  Shield,
  Globe,
  CheckCircle2,
  Send,
  RotateCcw,
  ChevronRight,
  Settings,
  ArrowLeft,
  Search,
  Calendar,
  PlusCircle,
  AlertTriangle,
  PhoneCall,
  Lock,
  Compass,
  Clock,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  getTrashProperties,
  restorePropertyFromTrash,
  permanentlyDeleteFromTrash,
  emptyTrash,
  getDaysRemainingInTrash,
  restoreMultipleFromTrash,
  deleteMultiplePermanentlyFromTrash,
  TrashPropertyItem
} from '../services/propertyService';
import { useLanguage } from '../context/LanguageContext';

type SettingsTabId = 'profile' | 'trash' | 'privacy' | 'support' | 'language';

interface SettingsViewProps {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  onNavigateToListings: () => void;
  onOpenAuthModal: () => void;
  initialTab?: SettingsTabId | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  setUser,
  onNavigateToListings,
  onOpenAuthModal,
  initialTab = null
}) => {
  const { language, setLanguage } = useLanguage();
  const [selectedTab, setSelectedTab] = useState<SettingsTabId | null>(initialTab);

  // Profile Edit State
  const [fullname, setFullname] = useState(user?.fullname || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Trash State & Batch Selection
  const [trashItems, setTrashItems] = useState<TrashPropertyItem[]>([]);
  const [selectedTrashIds, setSelectedTrashIds] = useState<string[]>([]);
  const [trashActionNotice, setTrashActionNotice] = useState<string | null>(null);

  // Support / Feedback State
  const [feedbackCategory, setFeedbackCategory] = useState('suggestion');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    setTrashItems(user ? getTrashProperties(user.uid) : []);
    setSelectedTrashIds([]);
  }, [user]);

  useEffect(() => {
    if (user) {
      setFullname(user.fullname);
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuthModal();
      return;
    }
    const updated: UserProfile = {
      ...user,
      fullname: fullname.trim() || user.fullname,
      phone: phone.trim() || user.phone
    };
    setUser(updated);
    try {
      localStorage.setItem('nyumbalink_active_user', JSON.stringify(updated));
    } catch (err) {
      console.warn('Error saving user profile locally:', err);
    }
    setProfileSuccessMsg(
      language === 'en' ? 'Profile updated successfully.' : 'Profil mis à jour avec succès.'
    );
    setTimeout(() => setProfileSuccessMsg(null), 3000);
  };

  const handleToggleSelectTrash = (id: string) => {
    setSelectedTrashIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllTrash = () => {
    if (selectedTrashIds.length === trashItems.length) {
      setSelectedTrashIds([]);
    } else {
      setSelectedTrashIds(trashItems.map((item) => item.property.id));
    }
  };

  const handleRestore = async (id: string) => {
    if (!user) return;
    const restored = await restorePropertyFromTrash(id, user.uid);
    if (restored) {
      setTrashItems(getTrashProperties(user.uid));
      setSelectedTrashIds((prev) => prev.filter((itemId) => itemId !== id));
      setTrashActionNotice(
        language === 'en'
          ? `Listing "${restored.title}" was successfully restored.`
          : `L'annonce "${restored.title}" a été restaurée avec succès.`
      );
      setTimeout(() => setTrashActionNotice(null), 3500);
    }
  };

  const handleBatchRestore = async () => {
    if (selectedTrashIds.length === 0) return;
    if (!user) return;
    const count = await restoreMultipleFromTrash(selectedTrashIds, user.uid);
    setTrashItems(getTrashProperties(user.uid));
    setSelectedTrashIds([]);
    setTrashActionNotice(
      language === 'en'
        ? `${count} listing(s) successfully restored.`
        : `${count} annonce(s) restaurée(s) avec succès.`
    );
    setTimeout(() => setTrashActionNotice(null), 3500);
  };

  const handleBatchPermanentDelete = () => {
    if (selectedTrashIds.length === 0) return;
    if (!user) return;
    const count = deleteMultiplePermanentlyFromTrash(selectedTrashIds, user.uid);
    setTrashItems(getTrashProperties(user.uid));
    setSelectedTrashIds([]);
    setTrashActionNotice(
      language === 'en'
        ? `${count} listing(s) permanently deleted.`
        : `${count} annonce(s) supprimée(s) définitivement.`
    );
    setTimeout(() => setTrashActionNotice(null), 3500);
  };

  const handlePermanentDelete = (id: string, _title: string) => {
    if (!user) return;
    permanentlyDeleteFromTrash(id, user.uid);
    setTrashItems(getTrashProperties(user.uid));
    setSelectedTrashIds((prev) => prev.filter((itemId) => itemId !== id));
    setTrashActionNotice(
      language === 'en' ? 'Listing permanently deleted.' : 'Annonce supprimée définitivement.'
    );
    setTimeout(() => setTrashActionNotice(null), 3000);
  };

  const handleEmptyAllTrash = () => {
    if (!user) return;
    emptyTrash(user.uid);
    setTrashItems([]);
    setSelectedTrashIds([]);
    setTrashActionNotice(
      language === 'en' ? 'Trash emptied.' : 'La corbeille a été vidée.'
    );
    setTimeout(() => setTrashActionNotice(null), 3000);
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackMessage('');
      setFeedbackSent(false);
    }, 4000);
  };

  const tabsConfig: {
    id: SettingsTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    desc: string;
    badge?: number;
  }[] = [
    {
      id: 'profile',
      label: language === 'en' ? 'User Profile' : 'Profil Utilisateur',
      icon: User,
      desc: language === 'en' ? 'Personal information & account details' : 'Informations personnelles et compte'
    },
    {
      id: 'privacy',
      label: language === 'en' ? 'User Guide, Safety & Privacy' : "Guide d'Utilisation, Sécurité & Confidentialité",
      icon: Shield,
      desc:
        language === 'en'
          ? 'How to use the app, where to get help & safety rules'
          : "Comment utiliser l'app, où trouver de l'aide et règles de sécurité"
    },
    {
      id: 'support',
      label: language === 'en' ? 'Support & Direct Help' : 'Assistance & Contact Direct',
      icon: HelpCircle,
      desc: language === 'en' ? 'Reach the team, report issues or send feedback' : "Contacter l'équipe, poser une question ou envoyer un retour"
    },
    {
      id: 'trash',
      label: language === 'en' ? 'Deleted Items / Trash' : 'Corbeille des Supprimés',
      icon: Trash2,
      desc: language === 'en' ? 'Restore or permanently delete listings' : 'Restaurer ou supprimer définitivement',
      badge: trashItems.length > 0 ? trashItems.length : undefined
    },
    {
      id: 'language',
      label: language === 'en' ? 'Display Language' : language === 'sw' ? 'Lugha ya Maonyesho' : "Langue d'Affichage",
      icon: Globe,
      desc: language === 'en' ? 'English / Français / Kiswahili' : language === 'sw' ? 'Kiswahili / Français / English' : 'Français / English / Kiswahili'
    }
  ];

  const currentTabItem = tabsConfig.find((tItem) => tItem.id === selectedTab);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Main Header */}
      <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-slate-200/80 dark:border-[#2e2e2e] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center shrink-0">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'en' ? 'Application Settings' : "Paramètres de l'Application"}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {language === 'en'
                  ? 'Manage your account, guide & safety rules, assistance, and trash.'
                  : "Gérez votre profil, le guide d'utilisation, l'assistance et la corbeille NyumbaLink"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#252525] border border-slate-200 dark:border-[#333] text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>v1.2.0 • Bukavu</span>
            </span>
          </div>
        </div>
      </div>

      {/* VIEW 1: OVERVIEW GRID OF ALL TABS */}
      {selectedTab === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tabsConfig.map((tItem) => {
            const Icon = tItem.icon;
            return (
              <button
                key={tItem.id}
                type="button"
                onClick={() => setSelectedTab(tItem.id)}
                className="group p-5 bg-white dark:bg-[#1a1a1a] hover:bg-slate-50 dark:hover:bg-[#222] border border-slate-200/80 dark:border-[#2e2e2e] hover:border-[#FF385C]/50 rounded-2xl text-left transition-all duration-150 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between w-full">
                  <div className="w-11 h-11 rounded-xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center space-x-2">
                    {typeof tItem.badge === 'number' && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FF385C] text-white">
                        {tItem.badge}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#FF385C] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-[#FF385C] transition-colors">
                    {tItem.label}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {tItem.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* VIEW 2: SINGLE ACTIVE TAB */
        <div className="bg-white dark:bg-[#1a1a1a] p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-[#2e2e2e] shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#2a2a2a] mb-6">
            <button
              type="button"
              onClick={() => setSelectedTab(null)}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#252525] hover:bg-slate-200 dark:hover:bg-[#333] text-slate-800 dark:text-slate-100 text-xs font-bold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#FF385C]" />
              <span>{language === 'en' ? 'Back to Settings' : 'Retour aux Paramètres'}</span>
            </button>

            {currentTabItem && (
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                <currentTabItem.icon className="w-4 h-4 text-[#FF385C]" />
                <span className="hidden sm:inline">{currentTabItem.label}</span>
              </div>
            )}
          </div>

          {/* 1. PROFIL UTILISATEUR */}
          {selectedTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'en' ? 'User Profile' : 'Profil Utilisateur'}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {language === 'en'
                    ? 'View and update your active session information'
                    : 'Consultez et modifiez les informations associées à votre session'}
                </p>
              </div>

              {profileSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center space-x-2 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {user ? (
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        {language === 'en' ? 'Full Name' : 'Nom Complet'}
                      </label>
                      <input
                        type="text"
                        value={fullname}
                        onChange={(e) => setFullname(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#333] rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        {language === 'en' ? 'Phone Number (WhatsApp)' : 'Numéro de Téléphone (WhatsApp)'}
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+243 986 760 178"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#333] rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        {language === 'en' ? 'Email Address' : 'Adresse E-mail'}
                      </label>
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-[#202020] border border-slate-200 dark:border-[#333] rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        {language === 'en' ? 'Role & Privileges' : 'Rôle & Privilèges'}
                      </label>
                      <div className="flex items-center h-[42px] px-3.5 bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#333] rounded-xl justify-between">
                        <span className="text-xs font-black uppercase text-[#FF385C]">
                          {user.role === 'admin'
                            ? language === 'en' ? 'Administrator' : 'Administrateur Principal'
                            : user.role === 'agent'
                            ? language === 'en' ? 'Real Estate Agent' : 'Agent Immobilier'
                            : language === 'en' ? 'Client / Visitor' : 'Client Visiteur'}
                        </span>
                        {user.isPartner && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 uppercase">
                            ✓ Partenaire Agréé
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#FF385C] hover:bg-[#E61E4D] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      {language === 'en' ? 'Save Changes' : 'Enregistrer les modifications'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-8 text-center bg-slate-50 dark:bg-[#252525] rounded-2xl border border-slate-200 dark:border-[#333] space-y-3 max-w-lg mx-auto">
                  <User className="w-10 h-10 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                    {language === 'en' ? 'You are not logged in' : "Vous n'êtes pas encore connecté"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    {language === 'en'
                      ? 'Sign in to save favorites, submit listings, and manage your preferences.'
                      : 'Connectez-vous avec votre compte pour enregistrer vos annonces et synchroniser vos préférences.'}
                  </p>
                  <button
                    type="button"
                    onClick={onOpenAuthModal}
                    className="px-5 py-2.5 bg-[#FF385C] text-white rounded-xl text-xs font-bold hover:bg-[#E61E4D] transition cursor-pointer"
                  >
                    {language === 'en' ? 'Sign In / Register' : 'Se Connecter / Créer un Compte'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. GUIDE D'UTILISATION, SÉCURITÉ & CONFIDENTIALITÉ */}
          {selectedTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'en'
                    ? 'User Guide, Orientation & Safety Rules'
                    : "Guide d'Utilisation, Orientation & Règles de Sécurité"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'en'
                    ? 'Complete guide on navigating NyumbaLink Bukavu, searching properties, booking visits, posting listings and safety practices.'
                    : "Guide complet pour chercher un bien à Bukavu, planifier une visite, publier une annonce et sécuriser vos transactions."}
                </p>
              </div>

              <div className="space-y-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                {/* 1. How to search */}
                <div className="p-5 bg-slate-50 dark:bg-[#252525] rounded-2xl border border-slate-200 dark:border-[#333] space-y-2">
                  <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
                    <Search className="w-4 h-4 text-[#FF385C]" />
                    <h3>
                      {language === 'en'
                        ? '1. How to Search & Filter Properties in Bukavu'
                        : '1. Comment Rechercher & Filtrer un Bien à Bukavu'}
                    </h3>
                  </div>
                  <p>
                    {language === 'en'
                      ? 'NyumbaLink is designed specifically for Bukavu with filters tailored to local realities:'
                      : 'NyumbaLink est spécialement conçu pour la ville de Bukavu avec des filtres adaptés aux réalités locales :'}
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-1 pt-1 text-slate-700 dark:text-slate-300">
                    <li>
                      <strong className="text-slate-900 dark:text-white">
                        {language === 'en' ? 'By Commune & Neighborhood: ' : 'Par Commune & Quartier : '}
                      </strong>
                      {language === 'en'
                        ? 'Filter by Ibanda (La Botte, Ndendere, Panzi, Muhumba, Nyalukemba...), Kadutu (Cimpunda, Nkafu, Kasali, Mosala...), or Bagira (Kasha, Lumumba, Ciriri...).'
                        : 'Filtrez par Ibanda (La Botte, Ndendere, Panzi, Muhumba, Nyalukemba...), Kadutu (Cimpunda, Nkafu, Kasali, Mosala...), ou Bagira (Kasha, Lumumba, Ciriri...).'}
                    </li>
                    <li>
                      <strong className="text-slate-900 dark:text-white">
                        {language === 'en' ? 'By Transaction & Category: ' : 'Par Transaction & Catégorie : '}
                      </strong>
                      {language === 'en'
                        ? 'Choose between Rent (Location) or Sale (Vente), and select House, Apartment, Villa, Studio, Commercial, or Land.'
                        : 'Choisissez entre Location ou Vente, et sélectionnez Maison, Appartement, Villa, Studio, Local Commercial ou Terrain.'}
                    </li>
                    <li>
                      <strong className="text-slate-900 dark:text-white">
                        {language === 'en' ? 'Interactive Map: ' : 'Carte Interactive : '}
                      </strong>
                      {language === 'en'
                        ? 'Use the Map tab to view geotagged properties across Lake Kivu shores and Bukavu hills.'
                        : 'Consultez l’onglet Carte pour localiser visuellement les biens le long des rives du Lac Kivu et sur les collines de Bukavu.'}
                    </li>
                  </ul>
                </div>

                {/* 2. How to book a visit */}
                <div className="p-5 bg-slate-50 dark:bg-[#252525] rounded-2xl border border-slate-200 dark:border-[#333] space-y-2">
                  <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
                    <Calendar className="w-4 h-4 text-[#FF385C]" />
                    <h3>
                      {language === 'en'
                        ? '2. How to Schedule a Physical Visit & Contact an Agent'
                        : '2. Comment Planifier une Visite Physique & Contacter un Agent'}
                    </h3>
                  </div>
                  <p>
                    {language === 'en'
                      ? 'When you find an interesting property, open its details page to:'
                      : "Lorsque vous trouvez une annonce intéressante, ouvrez sa fiche détaillée pour :"}
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-1 pt-1 text-slate-700 dark:text-slate-300">
                    <li>
                      <strong className="text-slate-900 dark:text-white">
                        {language === 'en' ? 'Click "Schedule a Visit": ' : 'Cliquer sur « Planifier une Visite » : '}
                      </strong>
                      {language === 'en'
                        ? 'Select your preferred date, time, and note to submit an official appointment request.'
                        : "Indiquez la date, l'heure souhaitée et vos disponibilités pour envoyer une demande de rendez-vous."}
                    </li>
                    <li>
                      <strong className="text-slate-900 dark:text-white">
                        {language === 'en' ? 'Direct WhatsApp Contact: ' : 'Contact WhatsApp Direct : '}
                      </strong>
                      {language === 'en'
                        ? 'Use the instant WhatsApp button to reach the verified manager immediately.'
                        : "Utilisez le bouton WhatsApp pour joindre directement le gestionnaire de l'annonce."}
                    </li>
                  </ul>
                </div>

                {/* 3. How to post a listing */}
                <div className="p-5 bg-slate-50 dark:bg-[#252525] rounded-2xl border border-slate-200 dark:border-[#333] space-y-2">
                  <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
                    <PlusCircle className="w-4 h-4 text-[#FF385C]" />
                    <h3>
                      {language === 'en'
                        ? '3. How to Post a Property (Owners & Agents)'
                        : '3. Comment Publier une Annonce (Propriétaires & Agents)'}
                    </h3>
                  </div>
                  <p>
                    {language === 'en'
                      ? 'Click the top "+ Publish" button. Fill in the commune, neighborhood, price in USD, number of bedrooms, water/power amenities, and upload real photos.'
                      : "Cliquez sur le bouton « + Publier » dans la barre supérieure. Renseignez la commune, le quartier, le prix en USD, les commodités (eau REGIDESO, électricité SNEL/solaire) et importez des photos réelles."}
                  </p>
                </div>

                {/* 4. Safety & anti-scam */}
                <div className="p-5 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-2 text-amber-950 dark:text-amber-200">
                  <div className="flex items-center space-x-2 font-bold text-sm text-amber-900 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <h3>
                      {language === 'en'
                        ? '4. Safety & Transaction Precautions in Bukavu'
                        : '4. Règles de Sécurité & Précautions Foncières à Bukavu'}
                    </h3>
                  </div>
                  <ul className="list-disc list-inside space-y-1.5 pl-1 pt-1 text-xs">
                    <li>
                      <strong>{language === 'en' ? 'Always visit in person: ' : 'Visite physique obligatoire : '}</strong>
                      {language === 'en'
                        ? 'Never send any money or deposit without personally visiting the property and inspecting its state.'
                        : "Ne versez jamais d'argent ou d'acompte avant d'avoir visité le bien en personne et rencontré le propriétaire ou son mandataire."}
                    </li>
                    <li>
                      <strong>{language === 'en' ? 'Check property titles: ' : 'Vérification des titres : '}</strong>
                      {language === 'en'
                        ? 'For sales, request the registration certificate (certificat d’enregistrement) and verify cadastral boundaries in South Kivu.'
                        : "Pour un achat, exigez le certificat d'enregistrement et vérifiez la situation cadastrale auprès des services du Sud-Kivu."}
                    </li>
                    <li>
                      <strong>{language === 'en' ? 'Written contract: ' : 'Contrat écrit et reçu : '}</strong>
                      {language === 'en'
                        ? 'Always sign a written lease or sales agreement with clear receipts for all advance payments.'
                        : 'Exigez un contrat de bail en bonne et due forme et des quittances officielles pour toute avance de loyer.'}
                    </li>
                  </ul>
                </div>

                {/* 5. Where to get help */}
                <div className="p-5 bg-slate-50 dark:bg-[#252525] rounded-2xl border border-slate-200 dark:border-[#333] space-y-3">
                  <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
                    <PhoneCall className="w-4 h-4 text-[#FF385C]" />
                    <h3>
                      {language === 'en'
                        ? '5. Where and How to Get Help?'
                        : "5. Où et Comment Demander de l'Aide ?"}
                    </h3>
                  </div>
                  <p>
                    {language === 'en'
                      ? 'If you encounter any difficulty, need assistance verifying a listing, or want guidance for a property visit:'
                      : "Si vous rencontrez une difficulté, si vous souhaitez de l'aide pour vérifier une annonce ou être accompagné lors d'une visite :"}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 pt-1">
                    <div className="p-3.5 bg-white dark:bg-[#1e1e1e] rounded-xl border border-slate-200 dark:border-[#333]">
                      <p className="font-bold text-slate-900 dark:text-white text-xs">Ben Baraka Shamamba</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">benbarakashamamba@gmail.com</p>
                      <p className="text-xs font-bold text-[#FF385C] mt-1">+243 986 760 178</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === 'en'
                      ? 'You can also switch to the "Support & Direct Help" tab to submit a written feedback or bug report.'
                      : "Vous pouvez également utiliser l'onglet « Assistance & Contact Direct » pour envoyer un message ou un signalement directement depuis l'application."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. SUPPORT & ASSISTANCE */}
          {selectedTab === 'support' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'en' ? 'Support & Direct Help' : 'Assistance & Contact Direct'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'en'
                    ? 'Send feedback, report bugs or ask questions to the team'
                    : "Envoyez un message, signalez un bug ou posez vos questions à l'équipe"}
                </p>
              </div>

              {feedbackSent ? (
                <div className="p-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    {language === 'en' ? 'Message sent successfully!' : 'Message envoyé avec succès !'}
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    {language === 'en'
                      ? 'Thank you for reaching out. We will get back to you shortly.'
                      : "Merci pour votre message. Nous vous répondrons dans les plus brefs délais."}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendFeedback} className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {language === 'en' ? 'Category' : 'Catégorie de message'}
                    </label>
                    <select
                      value={feedbackCategory}
                      onChange={(e) => setFeedbackCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#333] rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                    >
                      <option value="suggestion">
                        {language === 'en' ? 'Suggestion / Improvement' : "Suggestion / Amélioration de l'app"}
                      </option>
                      <option value="bug">
                        {language === 'en' ? 'Report a Bug / Issue' : 'Signaler un Bug / Dysfonctionnement'}
                      </option>
                      <option value="listing">
                        {language === 'en' ? 'Help with a Listing' : 'Assistance concernant une annonce'}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {language === 'en' ? 'Your Message' : 'Votre Message'}
                    </label>
                    <textarea
                      rows={4}
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      placeholder={
                        language === 'en'
                          ? 'Describe your suggestion or issue in detail...'
                          : 'Décrivez votre demande, suggestion ou problème rencontré...'
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#333] rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                      required
                    ></textarea>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#FF385C] hover:bg-[#E61E4D] text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Send Message' : 'Envoyer le message'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 4. CORBEILLE */}
          {selectedTab === 'trash' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {language === 'en' ? 'Deleted Items / Trash' : 'Corbeille des Annonces Supprimées'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'en'
                      ? 'Items in trash are permanently deleted after 30 days.'
                      : 'Les annonces dans la corbeille sont supprimées définitivement après 30 jours.'}
                  </p>
                </div>

                {trashItems.length > 0 && (
                  <div className="flex items-center space-x-2">
                    {selectedTrashIds.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={handleBatchRestore}
                          className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-200 transition cursor-pointer"
                        >
                          {language === 'en' ? `Restore (${selectedTrashIds.length})` : `Restaurer (${selectedTrashIds.length})`}
                        </button>
                        <button
                          type="button"
                          onClick={handleBatchPermanentDelete}
                          className="px-3 py-1.5 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 rounded-lg text-xs font-bold hover:bg-rose-200 transition cursor-pointer"
                        >
                          {language === 'en' ? `Delete (${selectedTrashIds.length})` : `Supprimer (${selectedTrashIds.length})`}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={handleEmptyAllTrash}
                      className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      {language === 'en' ? 'Empty Trash' : 'Vider la corbeille'}
                    </button>
                  </div>
                )}
              </div>

              {trashActionNotice && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-800 dark:text-blue-300 font-semibold">
                  {trashActionNotice}
                </div>
              )}

              {trashItems.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-500">
                    <button
                      type="button"
                      onClick={handleSelectAllTrash}
                      className="flex items-center space-x-1.5 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {selectedTrashIds.length === trashItems.length ? (
                        <CheckSquare className="w-4 h-4 text-[#FF385C]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      <span>{language === 'en' ? 'Select All' : 'Tout sélectionner'}</span>
                    </button>
                    <span>{trashItems.length} {language === 'en' ? 'item(s)' : 'élément(s)'}</span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-[#2a2a2a] border border-slate-200 dark:border-[#333] rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-[#202020]">
                    {trashItems.map((item) => {
                      const daysLeft = getDaysRemainingInTrash(item.deletedAt);
                      const isSelected = selectedTrashIds.includes(item.property.id);

                      return (
                        <div
                          key={item.property.id}
                          className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                            isSelected ? 'bg-rose-50/30 dark:bg-[#282022]' : 'bg-white dark:bg-[#1e1e1e]'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <button
                              type="button"
                              onClick={() => handleToggleSelectTrash(item.property.id)}
                              className="mt-1 text-slate-400 hover:text-[#FF385C] cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#FF385C]" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>

                            <div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                {item.property.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {item.property.commune} • {item.property.price}$
                              </p>
                              <div className="flex items-center space-x-1.5 mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {language === 'en'
                                    ? `Permanently deleted in ${daysLeft} day(s)`
                                    : `Suppression définitive dans ${daysLeft} jour(s)`}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleRestore(item.property.id)}
                              className="px-3 py-1.5 bg-slate-100 dark:bg-[#2a2a2a] hover:bg-slate-200 dark:hover:bg-[#333] text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{language === 'en' ? 'Restore' : 'Restaurer'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePermanentDelete(item.property.id, item.property.title)}
                              className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{language === 'en' ? 'Delete' : 'Supprimer'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-slate-50 dark:bg-[#252525] rounded-2xl border border-slate-200 dark:border-[#333] space-y-3 max-w-md mx-auto">
                  <Trash2 className="w-10 h-10 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                    {language === 'en' ? 'Trash is empty' : 'Votre corbeille est vide'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'en'
                      ? 'Deleted listings will appear here before permanent deletion.'
                      : 'Les annonces supprimées apparaîtront ici avant leur suppression définitive.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 5. LANGUE D'AFFICHAGE */}
          {selectedTab === 'language' && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'en' ? 'Display Language' : language === 'sw' ? 'Lugha ya Maonyesho' : "Langue d'Affichage"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'en'
                    ? 'Select your preferred language for the application interface.'
                    : language === 'sw'
                    ? 'Chagua lugha unayopendelea kwa ajili ya kiolesura cha programu.'
                    : "Choisissez la langue de l'interface de l'application."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setLanguage('fr')}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                    language === 'fr'
                      ? 'border-[#FF385C] bg-[#FF385C]/5 dark:bg-[#FF385C]/10 text-slate-900 dark:text-white font-bold'
                      : 'border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-[#252525] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">🇫🇷 Français</span>
                    {language === 'fr' && <CheckCircle2 className="w-4 h-4 text-[#FF385C]" />}
                  </div>
                  <span className="text-[11px] text-slate-500 font-normal">Langue principale</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                    language === 'en'
                      ? 'border-[#FF385C] bg-[#FF385C]/5 dark:bg-[#FF385C]/10 text-slate-900 dark:text-white font-bold'
                      : 'border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-[#252525] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">🇬🇧 English</span>
                    {language === 'en' && <CheckCircle2 className="w-4 h-4 text-[#FF385C]" />}
                  </div>
                  <span className="text-[11px] text-slate-500 font-normal">International</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage('sw')}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                    language === 'sw'
                      ? 'border-[#FF385C] bg-[#FF385C]/5 dark:bg-[#FF385C]/10 text-slate-900 dark:text-white font-bold'
                      : 'border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-[#252525] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">🇨🇩 Kiswahili</span>
                    {language === 'sw' && <CheckCircle2 className="w-4 h-4 text-[#FF385C]" />}
                  </div>
                  <span className="text-[11px] text-slate-500 font-normal">Kikanda</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};