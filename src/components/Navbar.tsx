import React, { useEffect, useRef, useState } from 'react';
import {
  Building2,
  Menu,
  User,
  PlusCircle,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Bell,
  MessageSquare,
  ChevronDown,
  Mail,
  Phone,
} from 'lucide-react';

import { UserProfile, UserRole } from '../types';
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
  onToggleSidebar,
}) => {
  const { theme, setTheme } = useTheme();
  const { language } = useLanguage();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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
        role,
      });
    }

    setUserDropdownOpen(false);
  };

  const isAdmin =
    user?.role === 'admin' ||
    user?.email?.toLowerCase() === 'benbarakashamamba@gmail.com' ||
    user?.email?.toLowerCase() === 'davidmakindu9@gmail.com';

  const effectiveMessagesCount =
    unreadMessagesCount || unreadNotificationsCount || 0;

  const handleOpenMessages =
    openMessagesModal || openNotificationsModal;

  /*
   * Sécurisation du nom utilisateur.
   * fullname peut être absent avec certains comptes Firebase.
   */
  const displayName =
    user?.fullname?.trim()
      ? user.fullname.trim().split(' ')[0]
      : user?.email?.split('@')[0] ||
        (language === 'en' ? 'Profile' : language === 'sw' ? 'Wasifu' : 'Profil');

  /*
   * Libellé du thème sans template literal.
   * Cela évite les erreurs de parsing Babel dans JSX.
   */
  const themeTitle =
    theme === 'light'
      ? 'Thème : Clair'
      : theme === 'dark'
        ? 'Thème : Sombre'
        : 'Thème : Système';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#181818]/95 backdrop-blur-md border-b border-[#ebebeb] dark:border-[#2e2e2e] shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 h-16 min-w-0">

          {/* =====================================================
              GAUCHE : MENU + LOGO
          ===================================================== */}

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">

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

            <div
              onClick={() => setCurrentTab('home')}
              className="md:hidden cursor-pointer group shrink-0"
            >
              <BrandLogo size="md" />
            </div>
          </div>

          {/* =====================================================
              DROITE : ACTIONS
          ===================================================== */}

          <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">

            {/* Publier */}
            {(user?.role === 'agent' ||
              user?.role === 'bailleur' ||
              user?.role === 'admin') && (
              <button
                type="button"
                onClick={openAddPropertyModal}
                className="hidden sm:flex items-center space-x-1.5 bg-gradient-to-r from-[#FF385C] to-[#E00B41] hover:opacity-95 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />

                <span>
                  {language === 'en'
                    ? 'Post Listing'
                    : language === 'sw' ? 'Chapisha Tangazo' : 'Publier'}
                </span>
              </button>
            )}

            {/* Nouveaux biens */}
            {openNewPropertiesModal && (
              <button
                type="button"
                onClick={openNewPropertiesModal}
                className="relative p-2 rounded-xl bg-slate-100 dark:bg-[#252525] hover:bg-[#FF385C]/10 border border-slate-200 dark:border-[#333] text-[#222222] dark:text-[#f7f7f7] transition cursor-pointer max-[420px]:hidden"
                title="Nouveaux Biens Publiés à Bukavu"
              >
                <Bell className="w-4 h-4 text-[#FF385C]" />

                {unreadNewPropertiesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-xs">
                    {unreadNewPropertiesCount > 9
                      ? '9+'
                      : unreadNewPropertiesCount}
                  </span>
                )}
              </button>
            )}

            {/* Messages */}
            {handleOpenMessages && (
              <button
                type="button"
                onClick={handleOpenMessages}
                className="relative p-2 rounded-xl bg-slate-100 dark:bg-[#252525] hover:bg-[#FF385C]/10 border border-slate-200 dark:border-[#333] text-[#222222] dark:text-[#f7f7f7] transition cursor-pointer"
                title={
                  user?.role === 'client'
                    ? 'Mes Messages & Demandes'
                    : 'Messagerie Clients'
                }
              >
                <MessageSquare className="w-4 h-4 text-[#FF385C]" />

                {effectiveMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FF385C] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {effectiveMessagesCount > 9
                      ? '9+'
                      : effectiveMessagesCount}
                  </span>
                )}
              </button>
            )}

            {/* =================================================
                THÈME
            ================================================= */}

            <button
              type="button"
              onClick={() => {
                if (theme === 'light') {
                  setTheme('dark');
                } else if (theme === 'dark') {
                  setTheme('system');
                } else {
                  setTheme('light');
                }
              }}
              title={themeTitle}
              className="p-2 rounded-xl bg-slate-100 dark:bg-[#252525] hover:bg-black/5 dark:hover:bg-white/10 border border-slate-200 dark:border-[#333] text-[#222222] dark:text-[#f7f7f7] transition cursor-pointer"
            >
              {theme === 'light' && (
                <Sun className="w-4 h-4 text-[#FF385C]" />
              )}

              {theme === 'dark' && (
                <Moon className="w-4 h-4 text-[#FF385C]" />
              )}

              {theme === 'system' && (
                <Monitor className="w-4 h-4 text-[#FF385C]" />
              )}
            </button>

            {/* =================================================
                PROFIL
            ================================================= */}

            <div
              className="relative"
              ref={dropdownRef}
            >
              <button
                type="button"
                id="user-profile-nav-button"
                onClick={() =>
                  setUserDropdownOpen(
                    (previous) => !previous
                  )
                }
                className="flex items-center space-x-1 sm:space-x-2 px-1 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#333] hover:bg-slate-100 dark:hover:bg-white/5 transition bg-white dark:bg-[#222] cursor-pointer shadow-xs shrink-0"
                title={
                  user
                    ? 'Mon Profil Utilisateur'
                    : 'Profil & Connexion'
                }
              >

                {/* Avatar */}
                {user ? (
                  <UserAvatar
                    avatarUrl={user.avatarUrl}
                    fullname={user.fullname || 'Utilisateur'}
                    email={user.email || ''}
                    role={user.role}
                    size="sm"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                )}

                {/* Nom et rôle */}
                <div className="text-left hidden sm:block">

                  <p className="text-xs font-bold text-[#222222] dark:text-[#f7f7f7] leading-tight truncate max-w-[95px]">
                    {displayName}
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
                      {language === 'en'
                        ? 'Sign In'
                        : 'Connexion'}
                    </span>
                  )}
                </div>

                <ChevronDown
                  className={`hidden sm:block ${
                    userDropdownOpen
                      ? 'w-3.5 h-3.5 text-slate-600 dark:text-slate-400 transition-transform duration-200 rotate-180'
                      : 'w-3.5 h-3.5 text-slate-600 dark:text-slate-400 transition-transform duration-200'
                  }`}
                />
              </button>

              {/* =================================================
                  MENU PROFIL
              ================================================= */}

              {userDropdownOpen && (
                <div
                  id="user-profile-dropdown-panel"
                  className="absolute right-0 top-12 w-72 sm:w-80 bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#333] p-4 z-50"
                >

                  {/* UTILISATEUR CONNECTÉ */}
                  {user ? (
                    <div className="space-y-4">

                      {/* En-tête */}
                      <div className="flex items-center space-x-3.5 pb-3 border-b border-slate-100 dark:border-[#2e2e2e]">

                        <UserAvatar
                          avatarUrl={user.avatarUrl}
                          fullname={user.fullname || 'Utilisateur'}
                          email={user.email || ''}
                          role={user.role}
                          size="md"
                        />

                        <div className="min-w-0 flex-1">

                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                            {user.fullname ||
                              user.email?.split('@')[0] ||
                              'Utilisateur'}
                          </h4>

                          <span
                            className={
                              user.role === 'admin'
                                ? 'inline-block mt-0.5 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                : user.role === 'agent'
                                ? 'inline-block mt-0.5 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-[#FF385C] text-white'
                                : user.role === 'bailleur'
                                ? 'inline-block mt-0.5 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200'
                                : 'inline-block mt-0.5 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }
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

                      {/* Informations */}
                      <div className="space-y-2 bg-slate-50 dark:bg-[#161616] p-3 rounded-xl border border-slate-100 dark:border-[#2a2a2a] text-xs">

                        <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">

                          <Mail className="w-3.5 h-3.5 text-[#FF385C] shrink-0" />

                          <span className="truncate">
                            {user.email ||
                              'Email non disponible'}
                          </span>

                        </div>

                        {user.phone && (
                          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">

                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />

                            <span className="font-semibold">
                              {user.phone}
                            </span>

                          </div>
                        )}

                        {user.agencyName && (
                          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">

                            <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />

                            <span className="font-bold truncate">
                              {user.agencyName}
                            </span>

                          </div>
                        )}

                      </div>

                      {/* Supervision Admin */}
                      {isAdmin && (
                        <div className="pt-1">

                          <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Supervision Rôle (Admin) :
                          </p>

                          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-[#141414] p-1 rounded-xl">

                            <button
                              type="button"
                              onClick={() =>
                                handleSwitchDemoRole('client')
                              }
                              className={
                                user.role === 'client'
                                  ? 'py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer text-center bg-[#FF385C] text-white'
                                  : 'py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer text-center text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5'
                              }
                            >
                              Client
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleSwitchDemoRole('agent')
                              }
                              className={
                                user.role === 'agent'
                                  ? 'py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer text-center bg-[#FF385C] text-white'
                                  : 'py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer text-center text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5'
                              }
                            >
                              Agent
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleSwitchDemoRole('admin')
                              }
                              className={
                                user.role === 'admin'
                                  ? 'py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer text-center bg-[#FF385C] text-white'
                                  : 'py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer text-center text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5'
                              }
                            >
                              Admin
                            </button>

                          </div>
                        </div>
                      )}

                      {/* Déconnexion */}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await logoutUser();
                            setUser(null);
                            setUserDropdownOpen(false);
                          } catch (error) {
                            console.error(
                              'Erreur lors de la déconnexion :',
                              error
                            );
                          }
                        }}
                        className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                      >
                        <LogOut className="w-4 h-4" />

                        <span>
                          {language === 'en'
                            ? 'Sign Out'
                            : language === 'sw' ? 'Toka' : 'Se Déconnecter'}
                        </span>
                      </button>

                    </div>
                  ) : (

                    /* UTILISATEUR NON CONNECTÉ */

                    <div className="space-y-3">

                      <div className="text-center py-2">

                        <div className="w-12 h-12 rounded-full bg-[#FF385C]/10 text-[#FF385C] mx-auto flex items-center justify-center mb-2">
                          <User className="w-6 h-6" />
                        </div>

                        <h4 className="text-xs font-black text-slate-900 dark:text-white">
                          {language === 'en'
                            ? 'Guest Account'
                            : language === 'sw' ? 'Akaunti ya Mgeni' : 'Compte Invité'}
                        </h4>

                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {language === 'en'
                            ? 'Connect to manage listings and save favorites.'
                            : language === 'sw' ? 'Ingia ili udhibiti matangazo na uhifadhi vipendwa.' : 'Connectez-vous pour gérer vos biens et retrouver vos favoris.'}
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

                        <span>
                          {language === 'en'
                            ? 'Sign In / Register'
                            : language === 'sw' ? 'Ingia / Jisajili' : "Se Connecter / S'inscrire"}
                        </span>
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