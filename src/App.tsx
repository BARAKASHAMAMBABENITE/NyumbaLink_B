/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { ListingsView } from './views/ListingsView';
import { PropertyDetailView } from './views/PropertyDetailView';
import { MapView } from './views/MapView';
import { FavoritesView } from './views/FavoritesView';
import { DashboardView } from './views/DashboardView';
import { SettingsView } from './views/SettingsView';
import { ContractsView } from './views/ContractsView';
import { AuthModal } from './views/AuthModal';
import { AddPropertyModal } from './components/AddPropertyModal';
import { EditPropertyModal } from './components/EditPropertyModal';
import { ContactModal } from './components/ContactModal';
import { InquiryNotificationsModal } from './components/InquiryNotificationsModal';
import { NewPropertiesModal } from './components/NewPropertiesModal';
import { BoostModal } from './components/BoostModal';
import { ShareModal } from './components/ShareModal';
import { PartnerRegistrationModal } from './components/PartnerRegistrationModal';
import { PartnerFurnitureModal } from './components/PartnerFurnitureModal';
import { AgentSubscriptionModal } from './components/AgentSubscriptionModal';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { OnboardingSplashScreen } from './views/OnboardingSplashScreen';
import { getUserInquiries } from './services/inquiryService';
import { getContractNotifications } from './services/contractService';
import { notifyNewPropertyPublished } from './services/notificationService';

import {
  Property,
  UserProfile,
  FilterOptions,
  PropertyStatus,
  isAgentSubscriptionActive
} from './types';
import {
  getAllProperties,
  addPropertyToStore,
  updatePropertyInStore,
  deletePropertyFromStore,
  incrementPropertyViews
} from './services/propertyService';
import {
  getUserFavoritePropertyIds,
  toggleFavoriteStatus,
  syncFavoritesWithExistingProperties
} from './services/favoriteService';
import { recordPageVisit, recordUserLoginSession } from './services/activityService';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config/firebase';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Active User session
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('nyumbalink_active_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email && !parsed.email.includes('demo') && !parsed.email.includes('bahati') && !parsed.email.includes('mufasa')) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error restoring saved user session:', e);
    }
    return null;
  });
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Filter State
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchQuery: '',
    category: 'tous',
    type: 'tous',
    neighborhood: 'tous',
    minPrice: '',
    maxPrice: '',
    minBedrooms: '',
    minBathrooms: '',
    features: [],
    sortBy: 'recent'
  });

  // Modal States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | undefined>(undefined);
  const [addPropertyModalOpen, setAddPropertyModalOpen] = useState(false);
  const [agentSubscriptionModalOpen, setAgentSubscriptionModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [contactModalProperty, setContactModalProperty] = useState<Property | null>(null);
  const [messagesModalOpen, setMessagesModalOpen] = useState(false);
  const [newPropertiesModalOpen, setNewPropertiesModalOpen] = useState(false);
  const [lastSeenPropertiesTime, setLastSeenPropertiesTime] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nyumbalink_last_prop_view_time');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  
  // Monetization & Trust Modals State
  const [boostProperty, setBoostProperty] = useState<Property | null>(null);
  const [shareProperty, setShareProperty] = useState<Property | null>(null);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [partnerFurnitureModalOpen, setPartnerFurnitureModalOpen] = useState(false);

  // Onboarding Splash Screen state (shown on initial launch before login)
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('nyumbalink_onboarded');
    } catch {
      return false;
    }
  });

  const handleFinishOnboarding = (redirectToLogin: boolean) => {
    try {
      localStorage.setItem('nyumbalink_onboarded', 'true');
    } catch {
      // ignore
    }
    setOnboardingOpen(false);
    if (redirectToLogin) {
      setAuthModalOpen(true);
    }
  };

  // User-isolated unread message inquiries count + contract expiry alerts
  const unreadMessagesCount = getUserInquiries(user).filter((i) => !i.isRead).length;
  const contractNotifications = getContractNotifications(user);
  const totalNotificationsCount = unreadMessagesCount + contractNotifications.totalAlerts;

  // New properties alert count (properties created after lastSeenPropertiesTime)
  const unreadNewPropertiesCount = properties.filter((p) => {
    if (!lastSeenPropertiesTime) return false;
    const propTime = new Date(p.createdAt || 0).getTime();
    return propTime > lastSeenPropertiesTime;
  }).length;

  const handleMarkAllPropertiesViewed = () => {
    const now = Date.now();
    setLastSeenPropertiesTime(now);
    try {
      localStorage.setItem('nyumbalink_last_prop_view_time', now.toString());
    } catch (e) {
      console.warn('Could not save last viewed property time:', e);
    }
  };

  const triggerAuthNotice = (message: string) => {
    setAuthNotice(message);
    setOnboardingOpen(true);
  };

  const handleOpenAuthModal = (customMessage?: string) => {
    setAuthNotice(customMessage || undefined);
    setOnboardingOpen(true);
  };

  const handleSetCurrentTab = (tab: string) => {
    if (!user && (tab === 'favorites' || tab === 'dashboard')) {
      triggerAuthNotice(
        tab === 'favorites'
          ? 'Veuillez vous connecter pour consulter vos favoris ! 😊'
          : 'Veuillez vous connecter pour accéder au tableau de bord ! 😊'
      );
      return;
    }
    setCurrentTab(tab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenContactModal = (p: Property) => {
    if (!user) {
      triggerAuthNotice('Veuillez vous connecter pour contacter un agent ou programmer une visite ! 😊');
      return;
    }
    setContactModalProperty(p);
  };

  const handleOpenAddPropertyModal = () => {
    if (!user) {
      triggerAuthNotice('Veuillez vous connecter pour publier une annonce sur NyumbaLink ! 😊');
      return;
    }

    // Strict RBAC: Clients cannot publish directly
    if (user.role === 'client') {
      setAgentSubscriptionModalOpen(true);
      return;
    }

    // Agents must have an active subscription
    if (user.role === 'agent' && !isAgentSubscriptionActive(user)) {
      setAgentSubscriptionModalOpen(true);
      return;
    }

    setAddPropertyModalOpen(true);
  };

  const handleOpenMessagesModal = () => {
    if (!user) {
      triggerAuthNotice('Veuillez vous connecter pour voir vos messages et demandes ! 😊');
      return;
    }
    setMessagesModalOpen(true);
  };

  // Sync user changes to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('nyumbalink_active_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('nyumbalink_active_user');
      }
    } catch (e) {
      console.warn('Could not save user to localStorage:', e);
    }
  }, [user]);

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            if (firebaseUser.photoURL && !data.avatarUrl) {
              data.avatarUrl = firebaseUser.photoURL;
            }
            setUser(data);
            return;
          }
        } catch (err) {
          console.warn('Error fetching Firestore user profile on auth state change:', err);
        }

        setUser({
          uid: firebaseUser.uid,
          fullname: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Utilisateur NyumbaLink',
          email: firebaseUser.email || '',
          role:
            firebaseUser.email?.toLowerCase() === 'benbarakashamamba@gmail.com' ||
            firebaseUser.email?.toLowerCase() === 'davidmakindu9@gmail.com'
              ? 'admin'
              : 'client',
          avatarUrl: firebaseUser.photoURL || undefined,
          createdAt: new Date().toISOString()
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      const propList = await getAllProperties();
      setProperties(propList);

      const favs = await getUserFavoritePropertyIds(user?.uid || '');
      const validFavs = favs.filter((id) => propList.some((p) => p.id === id));
      syncFavoritesWithExistingProperties(propList.map((p) => p.id));
      setFavoriteIds(validFavs);

      // Check if URL has direct property link ?property=ID or #property=ID
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const propId = params.get('property') || (window.location.hash.includes('property=') ? window.location.hash.split('property=')[1]?.split('&')[0] : null);
        if (propId) {
          const target = propList.find((p) => p.id === propId);
          if (target) {
            const newViews = (target.viewsCount || 0) + 1;
            const updated = { ...target, viewsCount: newViews };
            setSelectedProperty(updated);
            setProperties((prev) =>
              prev.map((p) => (p.id === propId ? updated : p))
            );
            incrementPropertyViews(propId);
            setCurrentTab('property-detail');
          }
        }
      }
    };

    loadData();

    // Track activity for admin analytics
    recordPageVisit(currentTab, user);
    if (user) {
      recordUserLoginSession(user, currentTab);
    }
  }, [user, currentTab]);

  // Toggle Favorites (Instant Optimistic UI update)
  const handleToggleFavorite = async (propertyId: string) => {
    if (!user) {
      triggerAuthNotice('Veuillez vous connecter pour ajouter des propriétés à vos favoris ! 😊');
      return;
    }

    const wasFavorite = favoriteIds.includes(propertyId);
    // Instant UI update
    setFavoriteIds((prev) =>
      wasFavorite ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
    );

    // Save in background
    try {
      await toggleFavoriteStatus(user.uid, propertyId);
    } catch (err) {
      console.warn('Error toggling favorite in background:', err);
      // Revert if error
      setFavoriteIds((prev) =>
        wasFavorite ? [...prev, propertyId] : prev.filter((id) => id !== propertyId)
      );
    }
  };

  // Open Details View
  const handleSelectProperty = (property: Property) => {
    const newViews = (property.viewsCount || 0) + 1;
    const propertyWithView = { ...property, viewsCount: newViews };
    setSelectedProperty(propertyWithView);
    setProperties((prev) =>
      prev.map((p) => (p.id === property.id ? propertyWithView : p))
    );
    incrementPropertyViews(property.id);
    setCurrentTab('property-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add Property (Agent/Admin)
  const handleAddProperty = async (
    newProp: Omit<Property, 'id' | 'viewsCount' | 'createdAt'>
  ) => {
    const created = await addPropertyToStore(newProp);
    setProperties((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
    setSelectedProperty(created);
    setCurrentTab('home');

    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const el = document.getElementById('featured-listings');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }

    // Trigger native mobile push notification
    try {
      notifyNewPropertyPublished(created);
    } catch (e) {
      console.warn('Failed to dispatch new property notification:', e);
    }
  };

  // Update Property Details
  const handleUpdateProperty = async (id: string, updates: Partial<Property>) => {
    const updated = await updatePropertyInStore(id, updates);
    if (updated) {
      setProperties((prev) => prev.map((p) => (p.id === id ? updated : p)));
      if (selectedProperty?.id === id) {
        setSelectedProperty(updated);
      }
    }
  };

  // Update Status
  const handleUpdatePropertyStatus = async (id: string, status: PropertyStatus) => {
    const updated = await updatePropertyInStore(id, { status });
    if (updated) {
      setProperties((prev) => prev.map((p) => (p.id === id ? updated : p)));
      if (selectedProperty?.id === id) {
        setSelectedProperty(updated);
      }
    }
  };

  // Delete Property (Agent / Admin)
  const handleDeleteProperty = async (id: string) => {
    await deletePropertyFromStore(id);
    setProperties((prev) => prev.filter((p) => p.id !== id));
    if (selectedProperty?.id === id) {
      setSelectedProperty(null);
      setCurrentTab('listings');
    }
  };

  // Select neighborhood and view on map
  const handleSelectNeighborhood = (neighborhood: string) => {
    setFilterOptions((prev) => ({ ...prev, neighborhood }));
    setCurrentTab('map');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f7f7f7] dark:bg-[#121212] text-[#222222] dark:text-[#f7f7f7] selection:bg-[#FF385C] selection:text-white transition-colors">
      {/* Onboarding / Splash Screen Component (displays on initial arrival before auth) */}
      <OnboardingSplashScreen
        isOpen={onboardingOpen}
        onGetStarted={() => handleFinishOnboarding(true)}
        onExploreAsGuest={() => handleFinishOnboarding(false)}
      />

      {/* Sidebar: Visible docked on PC/tablet (md:), drawer overlay on mobile */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentTab={currentTab}
        setCurrentTab={handleSetCurrentTab}
        user={user}
        favoritesCount={favoriteIds.length}
        unreadNewPropertiesCount={unreadNewPropertiesCount}
        unreadMessagesCount={unreadMessagesCount}
        openAddPropertyModal={handleOpenAddPropertyModal}
        openAuthModal={() => handleOpenAuthModal()}
        openOnboarding={() => setOnboardingOpen(true)}
        openPartnerModal={() => setPartnerModalOpen(true)}
        openPartnerFurnitureModal={() => setPartnerFurnitureModalOpen(true)}
        onLogout={() => {
          setUser(null);
        }}
      />

      {/* Main Content Area (Navbar, View Router, Footer) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Navbar */}
        <Navbar
          currentTab={currentTab}
          setCurrentTab={handleSetCurrentTab}
          user={user}
          setUser={setUser}
          favoritesCount={favoriteIds.length}
          openAuthModal={() => handleOpenAuthModal()}
          openAddPropertyModal={handleOpenAddPropertyModal}
          filterOptions={filterOptions}
          setFilterOptions={setFilterOptions}
          openMessagesModal={handleOpenMessagesModal}
          unreadMessagesCount={totalNotificationsCount}
          openNewPropertiesModal={() => setNewPropertiesModalOpen(true)}
          unreadNewPropertiesCount={unreadNewPropertiesCount}
          openPartnerFurnitureModal={() => setPartnerFurnitureModalOpen(true)}
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        {/* Main Content Router */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'listings' ? (
          <ListingsView
            properties={properties}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            onSelectProperty={handleSelectProperty}
            onOpenContactModal={handleOpenContactModal}
            onOpenShareModal={(p) => setShareProperty(p)}
            filterOptions={filterOptions}
            setFilterOptions={setFilterOptions}
            onSelectNeighborhood={handleSelectNeighborhood}
          />
        ) : currentTab === 'property-detail' && selectedProperty ? (
          <PropertyDetailView
            property={selectedProperty}
            allProperties={properties}
            isFavorite={favoriteIds.includes(selectedProperty.id)}
            onToggleFavorite={handleToggleFavorite}
            onBack={() => setCurrentTab('listings')}
            onSelectProperty={handleSelectProperty}
            onOpenContactModal={handleOpenContactModal}
            onOpenShareModal={(p) => setShareProperty(p)}
            onOpenBoostModal={(p) => setBoostProperty(p)}
            user={user}
            onOpenEditModal={(p) => setEditingProperty(p)}
            onDeleteProperty={handleDeleteProperty}
            onSelectNeighborhood={handleSelectNeighborhood}
          />
        ) : currentTab === 'map' ? (
          <MapView
            properties={properties}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            onSelectProperty={handleSelectProperty}
            onOpenContactModal={handleOpenContactModal}
            onOpenShareModal={(p) => setShareProperty(p)}
            filterOptions={filterOptions}
            setFilterOptions={setFilterOptions}
          />
        ) : currentTab === 'favorites' ? (
          <FavoritesView
            properties={properties}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            onSelectProperty={handleSelectProperty}
            onOpenContactModal={handleOpenContactModal}
            onOpenShareModal={(p) => setShareProperty(p)}
            setCurrentTab={handleSetCurrentTab}
          />
        ) : currentTab === 'dashboard' ? (
          <DashboardView
            user={user}
            setUser={setUser}
            properties={properties}
            favoriteIds={favoriteIds}
            onOpenAddPropertyModal={handleOpenAddPropertyModal}
            onOpenEditModal={(p) => setEditingProperty(p)}
            onOpenBoostModal={(p) => setBoostProperty(p)}
            onUpdatePropertyStatus={handleUpdatePropertyStatus}
            onDeleteProperty={handleDeleteProperty}
            onSelectProperty={handleSelectProperty}
            setCurrentTab={handleSetCurrentTab}
          />
        ) : currentTab === 'contracts' ? (
          <ContractsView
            user={user}
            properties={properties}
            onSelectProperty={handleSelectProperty}
            openAuthModal={() => handleOpenAuthModal()}
          />
        ) : currentTab === 'settings' ? (
          <SettingsView
            user={user}
            setUser={setUser}
            onNavigateToListings={() => setCurrentTab('listings')}
            onOpenAuthModal={() => setAuthModalOpen(true)}
          />
        ) : (
          /* Default Fallback to Home View */
          <HomeView
            properties={properties}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            onSelectProperty={handleSelectProperty}
            onOpenContactModal={handleOpenContactModal}
            onOpenShareModal={(p) => setShareProperty(p)}
            onOpenPartnerModal={() => setPartnerModalOpen(true)}
            onOpenPartnerFurnitureModal={() => setPartnerFurnitureModalOpen(true)}
            setCurrentTab={handleSetCurrentTab}
            setFilterOptions={setFilterOptions}
            openAddPropertyModal={handleOpenAddPropertyModal}
            onSelectNeighborhood={handleSelectNeighborhood}
            user={user}
          />
        )}
      </main>

        {/* Footer */}
        <Footer setCurrentTab={handleSetCurrentTab} />
      </div>

      {/* Modals */}
      {/* 0. Écran de Bienvenue NyumbaLink */}
      <OnboardingSplashScreen
        isOpen={onboardingOpen}
        onGetStarted={() => {
          handleFinishOnboarding(true);
        }}
        onClose={() => {
          handleFinishOnboarding(false);
          setAuthNotice(undefined);
        }}
        noticeMessage={authNotice}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthNotice(undefined);
        }}
        setUser={setUser}
        noticeMessage={authNotice}
      />

      <AddPropertyModal
        isOpen={addPropertyModalOpen}
        onClose={() => setAddPropertyModalOpen(false)}
        onAddProperty={handleAddProperty}
        user={user}
      />

      <EditPropertyModal
        isOpen={!!editingProperty}
        property={editingProperty}
        onClose={() => setEditingProperty(null)}
        onUpdateProperty={handleUpdateProperty}
        user={user}
      />

      {contactModalProperty && (
        <ContactModal
          property={contactModalProperty}
          isOpen={!!contactModalProperty}
          onClose={() => setContactModalProperty(null)}
          user={user}
        />
      )}

      <InquiryNotificationsModal
        isOpen={messagesModalOpen}
        onClose={() => setMessagesModalOpen(false)}
        user={user}
        onNavigateToContracts={() => handleSetCurrentTab('contracts')}
      />

      <NewPropertiesModal
        isOpen={newPropertiesModalOpen}
        onClose={() => setNewPropertiesModalOpen(false)}
        properties={properties}
        onSelectProperty={handleSelectProperty}
        onMarkAllAsViewed={handleMarkAllPropertiesViewed}
      />

      {boostProperty && (
        <BoostModal
          isOpen={!!boostProperty}
          onClose={() => setBoostProperty(null)}
          property={boostProperty}
          onBoostSuccess={(propertyId, packageId) => {
            handleUpdateProperty(propertyId, { isBoosted: true });
          }}
        />
      )}

      {shareProperty && (
        <ShareModal
          isOpen={!!shareProperty}
          onClose={() => setShareProperty(null)}
          property={shareProperty}
        />
      )}

      <PartnerRegistrationModal
        isOpen={partnerModalOpen}
        onClose={() => setPartnerModalOpen(false)}
        user={user}
        onPartnerRegistered={(updated) => setUser(updated)}
      />

      <PartnerFurnitureModal
        isOpen={partnerFurnitureModalOpen}
        onClose={() => setPartnerFurnitureModalOpen(false)}
        user={user}
        onRequireAuth={() => handleOpenAuthModal()}
      />

      <AgentSubscriptionModal
        isOpen={agentSubscriptionModalOpen}
        onClose={() => setAgentSubscriptionModalOpen(false)}
        targetUser={user}
        isAdminMode={false}
      />

      {/* Progressive Web App Install Banner & Service Worker Controller */}
      <PWAInstallPrompt />
    </div>
  );
}
