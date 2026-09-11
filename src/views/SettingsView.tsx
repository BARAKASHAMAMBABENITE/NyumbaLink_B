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

      {/* VIEW 1: OVERVIEW GRID OF ALL TABS (When no specific tab is open) */}
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
        /* VIEW 2: SINGLE ACTIVE TAB (The only tab active, all others hidden) */
        <div className="bg-white dark:bg-[#1a1a1a] p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-[#2e2e2e] shadow-xs">
          {/* Top Bar with Back Button to return to all tabs */}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 bg-white dark:bg-[#1e1e1e] rounded-xl border border-slate-200 dark:border-[#333]">
                      <p className="font-bold text-slate-900 dark:text-white text-xs">Ben Baraka Shamamba</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">benbarakashamamba@gmail.com</p>
                      <p className="text-xs font-bold text-[#FF385C] mt-1">+243 986 760 178</p>
                    </div>
                    <div className="p-3.5 bg-white dark:bg-[#1e1e1e] rounded-xl border border-slate-200 dark:border-[#333]">
                      <p className="font-bold text-slate-900 dark:text-white text-xs">David Makindu</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">davidmakindu9@gmail.com</p>
                      <p className="text-xs font-bold text-[#FF385C] mt-1">+243 993 853 036</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === 'en'
                      ? 'You can also switch to the "Support & Direct Help" tab to submit a written feedback or bug report.'
                      : "Vous pouvez également utiliser l'onglet « Assistance & Contact Direct » pour envoyer un message ou un signalement directement depuis l'application."}
                  </p>
                </div>

                {/* 6. Privacy Policy */}
                <div className="p-5 bg-slate-50 dark:bg-[#252525] rounded-2xl border border-slate-200 dark:border-[#333] space-y-2">
                  <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
                    <Lock className="w-4 h-4 text-[#FF385C]" />
                    <h3>
                      {language === 'en'
                        ? '6. Privacy & Personal Data Protection'
                        : '6. Confidentialité & Protection des Données'}
                    </h3>
                  </div>
                  <p>
                    {language === 'en'
                      ? 'Your contact information (phone number, email) submitted for visit inquiries is used exclusively to facilitate your real estate communication in Bukavu. NyumbaLink never sells or shares your personal data with third-party advertisers.'
                      : "Les coordonnées (téléphone, e-mail) transmises lors des demandes de visite sont utilisées exclusivement pour faciliter vos échanges immobiliers à Bukavu. NyumbaLink ne vend et ne cède jamais vos informations à des tiers publicitaires."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. ASSISTANCE & CONTACT DIRECT */}
          {selectedTab === 'support' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'en' ? 'Support & Direct Help' : 'Assistance & Contact Direct'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'en'
                    ? 'Get assistance, report an issue, or send suggestions to the team'
                    : "Obtenez de l'aide immédiate, signalez un problème ou envoyez une suggestion à l'équipe"}
                </p>
              </div>

              {/* Direct Contact in a single unified card */}
              <div className="p-5 bg-slate-50 dark:bg-[#252525] rounded-2xl border border-slate-200 dark:border-[#333] space-y-4 max-w-md">
                {/* Ben Baraka Shamamba */}
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Ben Baraka Shamamba</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">benbarakashamamba@gmail.com</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-bold text-[#FF385C]">+243 986 760 178</p>
                </div>

                <div className="border-t border-slate-200 dark:border-[#333]"></div>

                {/* David Makindu */}
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">David Makindu</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">davidmakindu9@gmail.com</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-bold text-[#FF385C]">+243 993 853 036</p>
                </div>
              </div>

              {/* Form Feedback */}
              <form onSubmit={handleSendFeedback} className="space-y-3 pt-2 max-w-xl">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'en'
                    ? 'Send a message or question to the team'
                    : "Envoyer un message ou une question à l'équipe"}
                </h4>

                {feedbackSent && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {language === 'en'
                        ? 'Thank you! Your message has been received.'
                        : 'Merci ! Votre message a été bien transmis.'}
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  <select
                    value={feedbackCategory}
                    onChange={(e) => setFeedbackCategory(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#333] rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="suggestion">
                      {language === 'en' ? 'Improvement Suggestion' : "Suggestion d'amélioration"}
                    </option>
                    <option value="question">
                      {language === 'en' ? 'General Question / Help' : "Question générale / Besoin d'aide"}
                    </option>
                    <option value="bug">
                      {language === 'en' ? 'Report a Technical Bug' : 'Signaler un problème technique'}
                    </option>
                    <option value="signalement">
                      {language === 'en' ? 'Report a Suspicious Listing' : 'Signaler une annonce suspecte'}
                    </option>
                  </select>
                </div>

                <textarea
                  rows={3}
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'Describe your question or situation here...'
                      : 'Décrivez votre situation ou votre question ici...'
                  }
                  className="w-full p-3 bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#333] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                  required
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#FF385C] hover:bg-[#E61E4D] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Submit Message' : 'Envoyer le message'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 4. CORBEILLE DES ÉLÉMENTS SUPPRIMÉS */}
          {selectedTab === 'trash' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {language === 'en' ? 'Deleted Items / Trash' : 'Corbeille des Éléments Supprimés'}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {language === 'en'
                      ? 'Restore or permanently delete removed properties. Auto-deleted after 60 days.'
                      : 'Restaurez ou supprimez définitivement vos annonces. Suppression automatique après 60 jours.'}
                  </p>
                </div>
                {trashItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleEmptyAllTrash}
                    className="self-start sm:self-auto px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold hover:bg-rose-100 transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Empty Entire Trash' : 'Vider toute la corbeille'}</span>
                  </button>
                )}
              </div>

              {/* 60-Day Policy Information Banner */}
              <div className="p-4 bg-white dark:bg-[#1a1a1a] border border-slate-200/90 dark:border-[#2e2e2e] rounded-2xl flex items-start space-x-3.5 shadow-xs">
                <Clock className="w-5 h-5 text-[#FF385C] shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {language === 'en'
                      ? 'Retention Policy: 60-Day Automatic Cleanup'
                      : 'Règle de conservation : Nettoyage automatique après 60 jours'}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                    {language === 'en'
                      ? 'All deleted listings are kept in this trash bin for a maximum of 60 days. You can choose to restore them anytime or permanently destroy them immediately. After 60 days, un-restored items are automatically and permanently purged.'
                      : 'Toutes les annonces supprimées restent dans cette corbeille pendant 60 jours maximum. Vous pouvez choisir de les restaurer à tout moment ou de les effacer définitivement. Après 60 jours, les éléments non restaurés sont définitivement et automatiquement détruits.'}
                  </p>
                </div>
              </div>

              {trashActionNotice && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center space-x-2 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{trashActionNotice}</span>
                </div>
              )}

              {trashItems.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 dark:bg-[#252525] rounded-2xl border border-slate-200 dark:border-[#333] space-y-3">
                  <Trash2 className="w-10 h-10 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                    {language === 'en' ? 'Trash is empty' : 'La corbeille est vide'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                    {language === 'en'
                      ? 'No properties in trash. Deleted items will be held here for 60 days before permanent deletion.'
                      : "Aucune annonce n'est actuellement dans la corbeille. Les annonces supprimées y séjournent pendant 60 jours avant leur destruction définitive."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Bulk Actions Bar */}
                  <div className="p-3 bg-slate-100 dark:bg-[#202020] rounded-xl border border-slate-200 dark:border-[#333] flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleSelectAllTrash}
                      className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-[#FF385C] transition cursor-pointer"
                    >
                      {selectedTrashIds.length === trashItems.length ? (
                        <CheckSquare className="w-4 h-4 text-[#FF385C]" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                      <span>
                        {selectedTrashIds.length === trashItems.length
                          ? language === 'en'
                            ? 'Deselect all'
                            : 'Tout désélectionner'
                          : language === 'en'
                          ? `Select all (${trashItems.length})`
                          : `Tout sélectionner (${trashItems.length})`}
                      </span>
                    </button>

                    {selectedTrashIds.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">
                          {selectedTrashIds.length} {language === 'en' ? 'selected' : 'sélectionné(s)'}
                        </span>
                        <button
                          type="button"
                          onClick={handleBatchRestore}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? 'Restore Selected' : 'Restaurer la sélection'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleBatchPermanentDelete}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? 'Delete Selected' : 'Supprimer définitivement'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* List of trash items */}
                  <div className="space-y-3">
                    {trashItems.map((item) => {
                      const daysRemaining = getDaysRemainingInTrash(item.deletedAt);
                      const isSelected = selectedTrashIds.includes(item.property.id);

                      return (
                        <div
                          key={item.property.id}
                          className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#FF385C]/5 border-[#FF385C]/40 dark:bg-[#FF385C]/10 dark:border-[#FF385C]/50'
                              : 'bg-slate-50 dark:bg-[#252525] border-slate-200 dark:border-[#333]'
                          }`}
                        >
                          <div className="flex items-start space-x-3 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleSelectTrash(item.property.id)}
                              className="mt-0.5 text-slate-400 hover:text-[#FF385C] transition cursor-pointer shrink-0"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#FF385C]" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>

                            <div className="space-y-1.5 min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {item.property.title}
                              </h4>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                {item.property.commune} ({item.property.neighborhood}) • ${item.property.price}
                              </p>

                              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                  {language === 'en' ? 'Deleted on ' : 'Supprimé le '}
                                  {new Date(item.deletedAt).toLocaleDateString()}
                                </span>

                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {language === 'en'
                                      ? `Auto purge in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`
                                      : `Suppression auto dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleRestore(item.property.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                              title={language === 'en' ? 'Restore this listing' : 'Restaurer cette annonce'}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>{language === 'en' ? 'Restore' : 'Restaurer'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePermanentDelete(item.property.id, item.property.title)}
                              className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                              title={language === 'en' ? 'Permanently destroy' : 'Supprimer définitivement'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{language === 'en' ? 'Delete forever' : 'Supprimer définitivement'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. LANGUE D'AFFICHAGE */}
          {selectedTab === 'language' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'en' ? 'Application Display Language' : language === 'sw' ? 'Lugha ya Maonyesho ya Programu' : "Langue d'Affichage de l'Application"}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {language === 'en'
                    ? 'Choose your preferred language to browse NyumbaLink'
                    : language === 'sw' ? 'Chagua lugha unayopendelea kutumia NyumbaLink' : 'Choisissez votre langue préférée pour naviguer sur NyumbaLink'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                <button
                  type="button"
                  onClick={() => setLanguage('fr')}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    language === 'fr'
                      ? 'bg-[#FF385C]/10 border-[#FF385C] text-[#FF385C]'
                      : 'bg-slate-50 dark:bg-[#252525] border-slate-200 dark:border-[#333] text-slate-800 dark:text-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-sm font-black block">Français (FR)</span>
                    <span className="text-xs opacity-75">Langue officielle par défaut</span>
                  </div>
                  {language === 'fr' && <CheckCircle2 className="w-5 h-5 text-[#FF385C]" />}
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    language === 'en'
                      ? 'bg-[#FF385C]/10 border-[#FF385C] text-[#FF385C]'
                      : 'bg-slate-50 dark:bg-[#252525] border-slate-200 dark:border-[#333] text-slate-800 dark:text-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-sm font-black block">English (EN)</span>
                    <span className="text-xs opacity-75">English interface mode</span>
                  </div>
                  {language === 'en' && <CheckCircle2 className="w-5 h-5 text-[#FF385C]" />}
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage('sw')}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    language === 'sw'
                      ? 'bg-[#FF385C]/10 border-[#FF385C] text-[#FF385C]'
                      : 'bg-slate-50 dark:bg-[#252525] border-slate-200 dark:border-[#333] text-slate-800 dark:text-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-sm font-black block">Kiswahili (SW)</span>
                    <span className="text-xs opacity-75">Lugha ya Kiswahili</span>
                  </div>
                  {language === 'sw' && <CheckCircle2 className="w-5 h-5 text-[#FF385C]" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
