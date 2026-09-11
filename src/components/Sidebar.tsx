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

  // Role-specific dashboard label & badge
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
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div
          id="sidebar-overlay"
          onClick={onClose}
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar: Visible docked on PC and tablet (md:), slide-out drawer on mobile */}
      <aside
        id="app-sidebar"
        className={`fixed md:sticky top-0 left-0 bottom-0 md:bottom-auto h-screen z-50 md:z-30 w-72 sm:w-80 md:w-64 lg:w-72 bg-white dark:bg-[#181818] border-r border-[#ebebeb] dark:border-[#2b2b2b] shadow-2xl md:shadow-none flex flex-col shrink-0 transform transition-transform duration-300 ease-in-out md:translate-x-0 overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 sm:p-5 border-b border-[#ebebeb] dark:border-[#2b2b2b] flex items-center justify-between">
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

        {/* Sidebar Nav Links */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {/* 1. Accueil */}
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
            <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${currentTab === 'home' ? 'text-white' : ''}`} />
          </button>

          {/* 2. Annonces */}
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
              <span>{language === 'en' ? 'Listings' : language === 'sw' ? 'Matangazo' : 'Toutes les Annonces'}</span>
            </div>
            {unreadNewPropertiesCount > 0 ? (
              <span className="flex items-center space-x-0.5 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{unreadNewPropertiesCount}</span>
              </span>
            ) : (
              <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${currentTab === 'listings' ? 'text-white' : ''}`} />
            )}
          </button>

          {/* 3. Carte Interactive */}
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
              <span>{language === 'en' ? 'Interactive Map' : language === 'sw' ? 'Ramani ya Maingiliano' : 'Carte Interactive'}</span>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${currentTab === 'map' ? 'text-white' : ''}`} />
          </button>

          {/* 4. Favoris */}
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
              <span>{language === 'en' ? 'Favorites' : language === 'sw' ? 'Vipendwa' : 'Mes Favoris'}</span>
            </div>
            {favoritesCount > 0 ? (
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  currentTab === 'favorites'
                    ? 'bg-white text-[#FF385C]'
                    : 'bg-[#FF385C] text-white'
                }`}
              >
                {favoritesCount}
              </span>
            ) : (
              <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${currentTab === 'favorites' ? 'text-white' : ''}`} />
            )}
          </button>

          {/* Contrats de Location */}
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
              <span>{language === 'en' ? 'Rental Contracts' : language === 'sw' ? 'Mikataba ya Upangishaji' : 'Contrats de Location'}</span>
            </div>
            {contractAlertsCount > 0 ? (
              <span className="flex items-center space-x-1 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-xs">
                <span>{contractAlertsCount}</span>
              </span>
            ) : (
              <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${currentTab === 'contracts' ? 'text-white' : ''}`} />
            )}
          </button>

          {/* Espace Partenaires & Mobilier */}
          {openPartnerModal && (
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  onClose();
                }
                openPartnerModal();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
            >
              <div className="flex items-center space-x-3">
                <Building2 className="w-4 h-4 text-[#FF385C]" />
                <span>{language === 'en' ? 'Become Partner' : 'Devenir Partenaire'}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            </button>
          )}

          {/* Mobilier & Équipements */}
          {openPartnerFurnitureModal && (
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  onClose();
                }
                openPartnerFurnitureModal();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
            >
              <div className="flex items-center space-x-3">
                <Sofa className="w-4 h-4 text-[#FF385C]" />
                <span>{language === 'en' ? 'Furniture & Gear' : 'Mobilier & Partenaires'}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            </button>
          )}

          {/* 5. TABLEAU DE BORD */}
          <button
            type="button"
            onClick={() => {
              if (!user) {
                openAuthModal();
                onClose();
              } else {
                handleNavClick('dashboard');
              }
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-[#FF385C] text-white shadow-sm'
                : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-3">
              <LayoutDashboard className={`w-4 h-4 ${currentTab === 'dashboard' ? 'text-white' : 'text-[#FF385C]'}`} />
              <span>{language === 'en' ? 'Dashboard' : 'Tableau de bord'}</span>
            </div>
            {dashboardInfo.badge ? (
              <span
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                  currentTab === 'dashboard'
                    ? 'bg-white text-[#FF385C]'
                    : 'bg-[#FF385C]/15 text-[#FF385C]'
                }`}
              >
                {dashboardInfo.badge}
              </span>
            ) : (
              <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${currentTab === 'dashboard' ? 'text-white' : ''}`} />
            )}
          </button>

          {/* 6. Paramètres */}
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
              <span>{language === 'en' ? 'Settings & Trash' : 'Paramètres & Corbeille'}</span>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${currentTab === 'settings' ? 'text-white' : ''}`} />
          </button>

          {/* Quick Publish Action inside Sidebar */}
          {(user?.role === 'agent' || user?.role === 'bailleur' || user?.role === 'admin' || user?.canPublish) && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openAddPropertyModal();
                }}
                className="w-full py-2.5 bg-gradient-to-r from-[#FF385C] to-[#E00B41] hover:opacity-95 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{language === 'en' ? 'Publish' : 'Publier un bien'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3.5 border-t border-[#ebebeb] dark:border-[#2b2b2b] bg-slate-50/50 dark:bg-[#161616]/50">
          <p className="text-[10px] text-center text-slate-500 dark:text-slate-400 font-medium">
            NyumbaLink • Bukavu (Ibanda, Kadutu, Bagira)
          </p>
        </div>
      </aside>
    </>
  );
};
