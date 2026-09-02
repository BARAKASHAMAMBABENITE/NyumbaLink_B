import React, { createContext, useContext, useState } from 'react';

export type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  fr: {
    home: 'Accueil',
    listings: 'Annonces',
    map: 'Carte Interactive',
    favorites: 'Favoris',
    dashboard: 'Tableau de Bord',
    settings: 'Paramètres',
    login: 'Se Connecter',
    logout: 'Se Déconnecter',
    publish: 'Publier une Annonce',
    allCommunes: 'Toutes les 3 communes',
    searchPlaceholder: 'Rechercher maison, quartier, commune...',
    trash: 'Corbeille des Supprimés',
    assistance: 'Assistance & Retours',
    privacy: 'Confidentialité & CGU',
    userProfile: 'Profil Utilisateur',
    languageSetting: "Langue d'Affichage",
    updates: 'Mises à Jour & Annonces',
    heroTitlePrefix: 'Trouvez votre bien d\'exception à ',
    heroSubtitle: 'Maisons familiales, parcelles titrées et appartements de standing à travers les trois communes d\'Ibanda, Kadutu et Bagira.',
    communeLabel: 'Commune',
    categoryLabel: 'Type de bien',
    transactionLabel: 'Transaction',
    streetNeighborhoodLabel: 'Rue ou Quartier',
    searchButton: 'Trouver mon Bien',
    allTypes: 'Tous les types',
    forSale: 'À Vendre',
    forRent: 'À Louer',
    saleAndRent: 'Vente & Location',
    house: 'Maison',
    plot: 'Parcelle / Terrain',
    apartment: 'Appartement',
    villa: 'Villa VIP',
    commercial: 'Local Commercial',
    featuredProperties: 'Biens en Vedette à Bukavu',
    featuredSubtitle: 'Sélection rigoureuse des meilleures opportunités immobilières de la ville',
    recentListings: 'Dernières Annonces Récentes',
    recentSubtitle: 'Mises en ligne quotidiennes avec coordonnées directes des baux et propriétaires',
    viewAll: 'Voir toutes les annonces',
    exploreByCategory: 'Explorer par Catégorie',
    the3Communes: 'Les 3 Communes de Bukavu',
    myFavoritesTitle: 'Mes Propriétés Favorites',
    noFavorites: 'Aucun favori pour le moment',
    exploreListings: 'Explorer les annonces',
    saveProfile: 'Enregistrer les modifications',
    emptyTrashBtn: 'Vider la corbeille',
    restoreBtn: 'Restaurer',
    deletePermanentlyBtn: 'Supprimer définitivement',
    sendFeedback: 'Envoyer le retour',
    feedbackSentSuccess: "Merci ! Votre message a été transmis à l'équipe.",
    appVersion: 'Version 1.2.0',
    appUpToDate: 'À jour'
  },
  en: {
    home: 'Home',
    listings: 'Listings',
    map: 'Interactive Map',
    favorites: 'Favorites',
    dashboard: 'Dashboard',
    settings: 'Settings',
    login: 'Sign In',
    logout: 'Sign Out',
    publish: 'Post a Listing',
    allCommunes: 'All 3 Communes',
    searchPlaceholder: 'Search house, neighborhood, commune...',
    trash: 'Deleted Items / Trash',
    assistance: 'Support & Feedback',
    privacy: 'Privacy & Terms',
    userProfile: 'User Profile',
    languageSetting: 'Display Language',
    updates: 'Updates & Announcements',
    heroTitlePrefix: 'Find your dream property in ',
    heroSubtitle: 'Family houses, titled plots and high-end apartments across the three communes of Ibanda, Kadutu and Bagira.',
    communeLabel: 'Commune',
    categoryLabel: 'Property Type',
    transactionLabel: 'Transaction',
    streetNeighborhoodLabel: 'Street or Neighborhood',
    searchButton: 'Search Properties',
    allTypes: 'All Types',
    forSale: 'For Sale',
    forRent: 'For Rent',
    saleAndRent: 'Sale & Rent',
    house: 'House',
    plot: 'Plot / Land',
    apartment: 'Apartment',
    villa: 'VIP Villa',
    commercial: 'Commercial Space',
    featuredProperties: 'Featured Properties in Bukavu',
    featuredSubtitle: 'Carefully curated selection of the best real estate opportunities in town',
    recentListings: 'Recent Listings',
    recentSubtitle: 'Daily updates with direct contact to owners and verified agents',
    viewAll: 'View all listings',
    exploreByCategory: 'Browse by Category',
    the3Communes: 'The 3 Communes of Bukavu',
    myFavoritesTitle: 'My Favorite Properties',
    noFavorites: 'No favorites saved yet',
    exploreListings: 'Browse Listings',
    saveProfile: 'Save Changes',
    emptyTrashBtn: 'Empty Trash',
    restoreBtn: 'Restore',
    deletePermanentlyBtn: 'Delete permanently',
    sendFeedback: 'Send Feedback',
    feedbackSentSuccess: 'Thank you! Your feedback has been received.',
    appVersion: 'Version 1.2.0',
    appUpToDate: 'Up to date'
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'fr',
  setLanguage: () => {},
  t: (key, defaultText) => defaultText || key
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('nyumbalink_lang') as Language;
      return saved === 'en' || saved === 'fr' ? saved : 'fr';
    } catch {
      return 'fr';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('nyumbalink_lang', lang);
    } catch (e) {
      console.warn('Failed to save language preference:', e);
    }
  };

  const t = (key: string, defaultText?: string): string => {
    return translations[language]?.[key] || defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

