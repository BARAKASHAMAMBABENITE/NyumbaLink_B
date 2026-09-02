import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Menu,
  Heart,
  User,
  PlusCircle,
  Sparkles,
  LogOut,
  Sun,
  Moon,
  Monitor,
  ShieldCheck,
  Crown,
  Home,
  Bell,
  MessageSquare,
  ChevronDown,
  Mail,
  Phone
} from 'lucide-react';
import { UserProfile, UserRole, FilterOptions } from '../types';
import { logoutUser } from '../services/authService';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { UserAvatar } from './UserAvatar';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  favoritesCount: number;
  openAuthModal: () => void;
  openAddPropertyModal: () => void;
  filterOptions?: FilterOptions;
  setFilterOptions?: React.Dispatch<React.SetStateAction<FilterOptions>>;
  openMessagesModal?: () => void;
  unreadMessagesCount?: number;
  openNewPropertiesModal?: () => void;
  unreadNewPropertiesCount?: number;
  openNotificationsModal?: () => void;
  unreadNotificationsCount?: number;
  openPartnerFurnitureModal?: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  user,
  setUser,
  favoritesCount,
  openAuthModal,
  openAddPropertyModal,
  openMessagesModal,
  unreadMessagesCount = 0,
  openNewPropertiesModal,
  unreadNewPropertiesCount = 0,
  openNotificationsModal,
  unreadNotificationsCount = 0,
  openPartnerFurnitureModal,
  onToggleSidebar
}) => {
  const { theme, setTheme } = useTheme();
  const { language } = useLanguage();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dismiss dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [userDropdownOpen]);

  const handleSwitchDemoRole = (role: UserRole) => {
    if (user) {
      setUser({
        ...user,
        role
      });
    }
    setUserDropdownOpen(false);
  };

  const isAdmin =
    user?.role === 'admin' ||
    user?.email?.toLowerCase() === 'benbarakashamamba@gmail.com' ||
    user?.email?.toLowerCase() === 'davidmakindu9@gmail.com';

  const effectiveMessagesCount = unreadMessagesCount || unreadNotificationsCount || 0;
  const handleOpenMessages = openMessagesModal || openNotificationsModal;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#181818]/95 backdrop-blur-md border-b border-[#ebebeb] dark:border-[#2e2e2e] shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Sidebar Toggle Button + Logo (Mobile only, on md: sidebar is docked) */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Mobile Sidebar Toggle Button */}
            {onToggleSidebar && (
              <button
                type="button"
                id="sidebar-toggle-btn"
                onClick={onToggleSidebar}
                className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-[#252525] hover:bg-[#FF385C]/10 text-slate-800 dark:text-slate-100 hover:text-[#FF385C] border border-slate-200 dark:border-[#333] transition cursor-pointer flex items-center justify-center shadow-xs"
                title="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Logo on mobile only (desktop/tablet has it in the docked sidebar) */}
            <div
              onClick={() => setCurrentTab('home')}
              className="md:hidden cursor-pointer group shrink-0"
            >
              <BrandLogo size="md" />
            </div>
          </div>

          {/* Center Quick Navigation Shortcuts (Optional Desktop) */}
          <nav className="hidden lg:flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentTab('home')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                currentTab === 'home'
                  ? 'bg-[#FF385C] text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              {language === 'en' ? 'Home' : 'Accueil'}
            </button>
            <button
              onClick={() => setCurrentTab('listings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                currentTab === 'listings'
                  ? 'bg-[#FF385C] text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <span>{language === 'en' ? 'Listings' : 'Annonces'}</span>
              {unreadNewPropertiesCount > 0 && (
                <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                  {unreadNewPropertiesCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setCurrentTab('map')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                currentTab === 'map'
                  ? 'bg-[#FF385C] text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              {language === 'en' ? 'Map' : 'Carte'}
            </button>
            <button
              onClick={() => setCurrentTab('favorites')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                currentTab === 'favorites'
                  ? 'bg-[#FF385C] text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <span>{language === 'en' ? 'Favorites' : 'Favoris'}</span>
              {favoritesCount > 0 && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                    currentTab === 'favorites' ? 'bg-white text-[#FF385C]' : 'bg-[#FF385C] text-white'
                  }`}
                >
                  {favoritesCount}
                </span>
              )}
            </button>

            {openPartnerFurnitureModal && (
              <button
                onClick={openPartnerFurnitureModal}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 bg-amber-500/10 dark:bg-amber-400/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/30"
                title="Mobilier & Équipements de nos Partenaires"
              >
                <span>🛋️</span>
                <span>{language === 'en' ? 'Furniture & Gear' : 'Mobilier Partenaires'}</span>
              </button>
            )}
          </nav>

          {/* Right Controls: Publier + Notification + Messages + Thème + PROFIL */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Quick Add Property Button */}
            {(user?.role === 'agent' || user?.role === 'bailleur' || user?.role === 'admin') && (
              <button
                onClick={openAddPropertyModal}
                className="hidden sm:flex items-center space-x-1.5 bg-gradient-to-r from-[#FF385C] to-[#E00B41] hover:opacity-95 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{language === 'en' ? 'Post Listing' : 'Publier'}</span>
              </button>
            )}

            {/* 1. New Properties Notification Bell */}
            {openNewPropertiesModal && (
              <button
                onClick={openNewPropertiesModal}
                className="relative p-2 rounded-xl bg-slate-100 dark:bg-[#252525] hover:bg-[#FF385C]/10 border border-slate-200 dark:border-[#333] text-[#222222] dark:text-[#f7f7f7] transition cursor-pointer"
                title="Nouveaux Biens Publiés à Bukavu"
              >
                <Bell className="w-4 h-4 text-[#FF385C]" />
                {unreadNewPropertiesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-xs">
                    {unreadNewPropertiesCount > 9 ? '9+' : unreadNewPropertiesCount}
                  </span>
                )}
              </button>
            )}

            {/* 2. Messaging / Chat Icon */}
            {handleOpenMessages && (
              <button
                onClick={handleOpenMessages}
                className="relative p-2 rounded-xl bg-slate-100 dark:bg-[#252525] hover:bg-[#FF385C]/10 border border-slate-200 dark:border-[#333] text-[#222222] dark:text-[#f7f7f7] transition cursor-pointer"
                title={user?.role === 'client' ? 'Mes Messages & Demandes' : 'Messagerie Clients'}
              >
                <MessageSquare className="w-4 h-4 text-[#FF385C]" />
                {effectiveMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FF385C] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {effectiveMessagesCount > 9 ? '9+' : effectiveMessagesCount}
                  </span>
                )}
              </button>
            )}

            {/* 3. Theme Toggle Button */}
            <button
              onClick={() => {
                const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
                setTheme(next);
              }}
              title={`Thème : ${theme === 'light' ? 'Clair' : theme === 'dark' ? 'Sombre' : 'Système'}`}
              className="p-2 rounded-xl bg-slate-100 dark:bg-[#252525] hover:bg-black/5 dark:hover:bg-white/10 border border-slate-200 dark:border-[#333] text-[#222222] dark:text-[#f7f7f7] transition cursor-pointer"
            >
              {theme === 'light' && <Sun className="w-4 h-4 text-[#FF385C]" />}
              {theme === 'dark' && <Moon className="w-4 h-4 text-[#FF385C]" />}
              {theme === 'system' && <Monitor className="w-4 h-4 text-[#FF385C]" />}
            </button>

            {/* 4. PROFIL BUTTON & IDENTIFICATIONS DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                id="user-profile-nav-button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#333] hover:bg-slate-100 dark:hover:bg-white/5 transition bg-white dark:bg-[#222] cursor-pointer shadow-xs"
                title={user ? 'Mon Profil Utilisateur' : 'Profil & Connexion'}
              >
                {user ? (
                  <UserAvatar
                    avatarUrl={user.avatarUrl}
                    fullname={user.fullname}
                    email={user.email}
                    role={user.role}
                    size="sm"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                )}

                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-[#222222] dark:text-[#f7f7f7] leading-tight truncate max-w-[95px]">
                    {user ? user.fullname.split(' ')[0] : (language === 'en' ? 'Profile' : 'Profil')}
                  </p>
                  {user ? (
                    <span className="text-[9px] font-extrabold text-[#FF385C] uppercase tracking-wider block">
                      {user.role === 'admin'
                        ? 'Admin'
                        : user.role === 'agent'
                        ? 'Agent'
                        : user.role === 'bailleur'
                        ? 'Bailleur'
                        : 'Client'}
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-[#FF385C] block">
                      {language === 'en' ? 'Sign In' : 'Connexion'}
                    </span>
                  )}
                </div>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-600 dark:text-slate-400 transition-transform duration-200 ${
                    userDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* STRICT IDENTIFICATION DROPDOWN */}
              {userDropdownOpen && (
                <div
                  id="user-profile-dropdown-panel"
                  className="absolute right-0 top-12 w-72 sm:w-80 bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#333] p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  {user ? (
                    <div className="space-y-4">
                      {/* Identification Header */}
                      <div className="flex items-center space-x-3.5 pb-3 border-b border-slate-100 dark:border-[#2e2e2e]">
                        <UserAvatar
                          avatarUrl={user.avatarUrl}
                          fullname={user.fullname}
                          email={user.email}
                          role={user.role}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                            {user.fullname}
                          </h4>
                          <span
                            className={`inline-block mt-0.5 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              user.role === 'admin'
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                : user.role === 'agent'
                                ? 'bg-[#FF385C] text-white'
                                : user.role === 'bailleur'
                                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {user.role === 'admin'
                              ? 'Administrateur'
                              : user.role === 'agent'
                              ? 'Agent Immobilier Agréé'
                              : user.role === 'bailleur'
                              ? 'Bailleur / Propriétaire'
                              : 'Compte Client'}
                          </span>
                        </div>
                      </div>

                      {/* Detailed Identification Coordinates */}
                      <div className="space-y-2 bg-slate-50 dark:bg-[#161616] p-3 rounded-xl border border-slate-100 dark:border-[#2a2a2a] text-xs">
                        <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-[#FF385C] shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-semibold">{user.phone}</span>
                          </div>
                        )}
                        {user.agencyName && (
                          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                            <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="font-bold truncate">{user.agencyName}</span>
                          </div>
                        )}
                      </div>

                      {/* Admin Demo Role Switcher */}
                      {isAdmin && (
                        <div className="pt-1">
                          <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Supervision Rôle (Admin) :
                          </p>
                          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-[#141414] p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => handleSwitchDemoRole('client')}
                              className={`py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer text-center ${
                                user.role === 'client'
                                  ? 'bg-[#FF385C] text-white'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5'
                              }`}
                            >
                              Client
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSwitchDemoRole('agent')}
                              className={`py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer text-center ${
                                user.role === 'agent'
                                  ? 'bg-[#FF385C] text-white'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5'
                              }`}
                            >
                              Agent
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSwitchDemoRole('admin')}
                              className={`py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer text-center ${
                                user.role === 'admin'
                                  ? 'bg-[#FF385C] text-white'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5'
                              }`}
                            >
                              Admin
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Disconnect Button */}
                      <button
                        type="button"
                        onClick={async () => {
                          await logoutUser();
                          setUser(null);
                          setUserDropdownOpen(false);
                        }}
                        className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{language === 'en' ? 'Sign Out' : 'Se Déconnecter'}</span>
                      </button>
                    </div>
                  ) : (
                    /* Guest Identification & Sign In */
                    <div className="space-y-3">
                      <div className="text-center py-2">
                        <div className="w-12 h-12 rounded-full bg-[#FF385C]/10 text-[#FF385C] mx-auto flex items-center justify-center mb-2">
                          <User className="w-6 h-6" />
                        </div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">
                          {language === 'en' ? 'Guest Account' : 'Compte Invité'}
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {language === 'en'
                            ? 'Connect to manage listings and save favorites.'
                            : 'Connectez-vous pour gérer vos biens et retrouver vos favoris.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          openAuthModal();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full py-2.5 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <User className="w-4 h-4" />
                        <span>{language === 'en' ? 'Sign In / Register' : 'Se Connecter / S\'inscrire'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
