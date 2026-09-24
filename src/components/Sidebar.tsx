import React, { useEffect, useState } from 'react';
import {
  Home,
  Building2,
  MapPin,
  Heart,
  Settings,
  LayoutDashboard,
  PlusCircle,
  X,
  Sparkles,
  ShieldCheck,
  Crown,
  User,
  MessageSquare,
  Bell,
  ChevronRight,
  FileText,
  Sofa
} from 'lucide-react';
import { UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { UserAvatar } from './UserAvatar';
import { BrandLogo } from './BrandLogo';
import { getContractNotifications } from '../services/contractService';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: UserProfile | null;
  favoritesCount: number;
  unreadNewPropertiesCount: number;
  unreadMessagesCount: number;
  openAddPropertyModal: () => void;
  openAuthModal: () => void;
  openOnboarding?: () => void;
  openPartnerModal?: () => void;
  openPartnerFurnitureModal?: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentTab,
  setCurrentTab,
  user,
  favoritesCount,
  unreadNewPropertiesCount,
  unreadMessagesCount,
  openAddPropertyModal,
  openAuthModal,
  openOnboarding,
  openPartnerModal,
  openPartnerFurnitureModal,
  onLogout
}) => {
  const { language } = useLanguage();
  const [contractAlertsCount, setContractAlertsCount] = useState(0);

  useEffect(() => {
    void getContractNotifications(user).then((summary) => setContractAlertsCount(summary.unreadAlerts));
  }, [user]);

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onClose();
    }
  };

  const getDashboardInfo = () => {
    if (!user) {
      return {
        label: language === 'en' ? 'Dashboard' : language === 'sw' ? 'Dashibodi' : 'Tableau de Bord',
        subtext: language === 'en' ? 'Sign in to access' : language === 'sw' ? 'Ingia ili kufikia' : 'Connexion requise',
        icon: LayoutDashboard,
        badge: null
      };
    }
    if (user.role === 'admin') {
      return {
        label: language === 'en' ? 'Admin Dashboard' : language === 'sw' ? 'Dashibodi ya Msimamizi' : 'Tableau Admin',
        subtext: language === 'en' ? 'System & Users' : language === 'sw' ? 'Mfumo na Watumiaji' : 'Gestion globale & Utilisateurs',
        icon: ShieldCheck,
        badge: null
      };
    }
    if (user.role === 'agent') {
      return {
        label: language === 'en' ? 'Agent Dashboard' : language === 'sw' ? 'Dashibodi ya Wakala' : 'Tableau Agent',
        subtext: language === 'en' ? 'My properties & stats' : language === 'sw' ? 'Nyumba na takwimu zangu' : 'Mes annonces & statistiques',
        icon: Crown,
        badge: null
      };
    }
    return {
      label: language === 'en' ? 'Client Dashboard' : language === 'sw' ? 'Dashibodi ya Mteja' : 'Mon Espace Client',
      subtext: language === 'en' ? 'Favorites & inquiries' : language === 'sw' ? 'Vipendwa na maombi' : 'Favoris & demandes de visites',
      icon: User,
      badge: null
    };
  };

  const dashboardInfo = getDashboardInfo();

  return (
    <>
      {isOpen && (
        <div
          id="sidebar-overlay"
          onClick={onClose}
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar fixée pour empêcher le défilement global */}
      <aside
        id="app-sidebar"
        className={`fixed md:sticky top-0 left-0 h-screen z-50 md:z-30 w-72 sm:w-80 md:w-64 lg:w-72 bg-white dark:bg-[#181818] border-r border-[#ebebeb] dark:border-[#2b2b2b] shadow-2xl md:shadow-none flex flex-col shrink-0 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 sm:p-5 border-b border-[#ebebeb] dark:border-[#2b2b2b] flex items-center justify-between shrink-0">
          <div
            onClick={() => handleNavClick('home')}
            className="cursor-pointer group"
          >
            <BrandLogo size="md" />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
            title="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentTab === 'home'
                ? 'bg-[#FF385C] text-white shadow-sm'
                : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Home className={`w-4 h-4 ${currentTab === 'home' ? 'text-white' : 'text-[#FF385C]'}`} />
              <span>{language === 'en' ? 'Home' : language === 'sw' ? 'Nyumbani' : 'Accueil'}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('listings')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentTab === 'listings'
                ? 'bg-[#FF385C] text-white shadow-sm'
                : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Building2 className={`w-4 h-4 ${currentTab === 'listings' ? 'text-white' : 'text-[#FF385C]'}`} />
              <span>{language === 'en' ? 'Listings' : language === 'sw' ? 'Mali' : 'Annonces'}</span>
            </div>
            {unreadNewPropertiesCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-black bg-emerald-500 text-white rounded-full animate-pulse">
                +{unreadNewPropertiesCount}
              </span>
            )}
          </button>
          

          <button
            type="button"
            onClick={() => handleNavClick('map')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentTab === 'map'
                ? 'bg-[#FF385C] text-white shadow-sm'
                : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-3">
              <MapPin className={`w-4 h-4 ${currentTab === 'map' ? 'text-white' : 'text-[#FF385C]'}`} />
              <span>{language === 'en' ? 'Map' : language === 'sw' ? 'Ramani' : 'Carte interactive'}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('favorites')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentTab === 'favorites'
                ? 'bg-[#FF385C] text-white shadow-sm'
                : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Heart className={`w-4 h-4 ${currentTab === 'favorites' ? 'text-white' : 'text-[#FF385C]'}`} />
              <span>{language === 'en' ? 'Favorites' : language === 'sw' ? 'Vipendwa' : 'Favoris'}</span>
            </div>
            {favoritesCount > 0 && (
              <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${currentTab === 'favorites' ? 'bg-white text-[#FF385C]' : 'bg-[#FF385C]/10 text-[#FF385C]'}`}>
                {favoritesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-[#FF385C] text-white shadow-sm'
                : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-3">
              <dashboardInfo.icon className={`w-4 h-4 ${currentTab === 'dashboard' ? 'text-white' : 'text-[#FF385C]'}`} />
              <div className="text-left">
                <div>{dashboardInfo.label}</div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('contracts')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentTab === 'contracts'
                ? 'bg-[#FF385C] text-white shadow-sm'
                : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-3">
              <FileText className={`w-4 h-4 ${currentTab === 'contracts' ? 'text-white' : 'text-[#FF385C]'}`} />
              <span>{language === 'en' ? 'Contracts & Leases' : language === 'sw' ? 'Mikataba' : 'Contrats & Baux'}</span>
            </div>
            {contractAlertsCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-black bg-amber-500 text-white rounded-full animate-bounce">
                {contractAlertsCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              if (openPartnerFurnitureModal) openPartnerFurnitureModal();
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                onClose();
              }
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <Sofa className="w-4 h-4 text-[#FF385C]" />
              <span>Mobilier & Équipements</span>
            </div>
          </button>
          {/* Bouton Mobilier & Équipements */}
          <button
            type="button"
            onClick={() => {
              if (openPartnerFurnitureModal) openPartnerFurnitureModal();
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                onClose();
              }
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <Sofa className="w-4 h-4 text-[#FF385C]" />
              <span>Mobilier & Équipements</span>
            </div>
          </button>

          {/* Bouton Devenir Partenaire Habitat */}
          <button
            type="button"
            onClick={() => {
              if (openPartnerModal) openPartnerModal();
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                onClose();
              }
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <Building2 className="w-4 h-4 text-[#FF385C]" />
              <span>Devenir Partenaire</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentTab === 'settings'
                ? 'bg-[#FF385C] text-white shadow-sm'
                : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Settings className={`w-4 h-4 ${currentTab === 'settings' ? 'text-white' : 'text-[#FF385C]'}`} />
              <span>{language === 'en' ? 'Settings' : language === 'sw' ? 'Mipangilio' : 'Paramètres'}</span>
            </div>
          </button>

          <div className="pt-3 mt-3 border-t border-[#ebebeb] dark:border-[#2b2b2b]">
            {user ? (
              <button
                type="button"
                onClick={openAddPropertyModal}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-[#FF385C] hover:bg-[#E00B3D] text-white rounded-xl text-xs font-black transition shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publier une annonce</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openAuthModal}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-[#FF385C] hover:bg-[#E00B3D] text-white rounded-xl text-xs font-black transition shadow-sm cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Connexion / Inscription</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};