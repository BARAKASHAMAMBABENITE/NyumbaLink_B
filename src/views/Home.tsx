import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Building2,
  ArrowRight
} from 'lucide-react';
import { Property, FilterOptions, BukavuCommune, PropertyCategory, TransactionType, UserProfile } from '../types';
import { PropertyCard } from '../components/PropertyCard';
import { PartnersSection } from '../components/PartnersSection';
import africanHandoverBgImage from '../assets/images/african_handover_keys_1788217554486.jpg';

export interface HomeProps {
  properties: Property[];
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  onOpenContactModal: (property: Property) => void;
  onOpenShareModal?: (property: Property) => void;
  onOpenPartnerModal?: () => void;
  onOpenPartnerFurnitureModal?: () => void;
  setCurrentTab: (tab: string) => void;
  setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptions>>;
  openAddPropertyModal: () => void;
  onSelectNeighborhood?: (neighborhood: string) => void;
  user?: UserProfile | null;
}

export const Home: React.FC<HomeProps> = ({
  properties,
  favoriteIds,
  onToggleFavorite,
  onSelectProperty,
  onOpenContactModal,
  onOpenShareModal,
  onOpenPartnerModal,
  onOpenPartnerFurnitureModal,
  setCurrentTab,
  setFilterOptions,
  openAddPropertyModal,
  onSelectNeighborhood,
  user
}) => {
  // Search state
  const [quickCommune, setQuickCommune] = useState<BukavuCommune | 'tous'>('tous');
  const [quickQuery, setQuickQuery] = useState('');

  // Grid quick filter
  const [gridFilter, setGridFilter] = useState<'tous' | 'location' | 'vente' | 'parcelle' | 'villa'>('tous');

  // Filtered properties for the showcase section (max 6)
  const displayedProperties = useMemo(() => {
    let list = properties;
    if (gridFilter === 'location') {
      list = list.filter((p) => p.type === 'location');
    } else if (gridFilter === 'vente') {
      list = list.filter((p) => p.type === 'vente' && p.category !== 'parcelle');
    } else if (gridFilter === 'parcelle') {
      list = list.filter((p) => p.category === 'parcelle');
    } else if (gridFilter === 'villa') {
      list = list.filter((p) => p.category === 'villa');
    }

    return [...list]
      .sort((a, b) => {
        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      })
      .slice(0, 6);
  }, [properties, gridFilter]);

  const handleExecuteSearch = () => {
    setFilterOptions((prev) => ({
      ...prev,
      commune: quickCommune,
      searchQuery: quickQuery,
      neighborhood: 'tous'
    }));
    setCurrentTab('listings');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-8 sm:space-y-12 pb-12 font-sans antialiased text-slate-900 dark:text-slate-100">
      {/* 1. HERO SECTION : ÉPURÉE & IMMERSIVE SANS RECHERCHE DEDANS */}
      <section
        id="hero-section"
        className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-white/10 text-white min-h-[280px] sm:min-h-[320px] flex flex-col justify-center"
      >
        {/* Background Image with Clean Cinematic Vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src={africanHandoverBgImage}
            alt="Remise des clés d'une maison à Bukavu"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
        </div>

        {/* Hero Title and Subtitle */}
        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 py-10 sm:py-14 w-full text-center space-y-3">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Trouvez votre bien à <span className="text-[#FF385C]">Bukavu</span>
          </h1>
          <p className="text-xs sm:text-base text-slate-200 font-medium max-w-lg mx-auto leading-relaxed">
            Locations résidentielles, ventes et parcelles à Ibanda, Kadutu et Bagira.
          </p>
        </div>
      </section>

      {/* 1.5. BARRE DE RECHERCHE DÉDIÉE (EN BAS DE L'IMAGE D'ACCUEIL) */}
      <section id="search-section" className="max-w-4xl mx-auto px-4 sm:px-6 w-full -mt-4 sm:-mt-6 relative z-20">
        <div className="bg-white dark:bg-[#1a1a1a] p-2.5 sm:p-3 rounded-2xl sm:rounded-full shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center gap-2.5">
          {/* Input Quartier ou mot clé */}
          <div className="flex-1 w-full flex items-center space-x-2.5 px-3.5 py-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Quartier, rue ou mot-clé (ex: Nguba, Muhungu, Labotte)..."
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExecuteSearch()}
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          {/* Séparateur sur grand écran */}
          <div className="hidden sm:block w-px h-7 bg-slate-200 dark:bg-white/10" />

          {/* Commune selector */}
          <div className="w-full sm:w-auto px-3.5 py-1 flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-[#FF385C] shrink-0" />
            <select
              value={quickCommune}
              onChange={(e) => setQuickCommune(e.target.value as any)}
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer py-1"
            >
              <option value="tous" className="bg-white dark:bg-[#242424] text-slate-900 dark:text-white">Toutes communes</option>
              <option value="Ibanda" className="bg-white dark:bg-[#242424] text-slate-900 dark:text-white">Ibanda</option>
              <option value="Kadutu" className="bg-white dark:bg-[#242424] text-slate-900 dark:text-white">Kadutu</option>
              <option value="Bagira" className="bg-white dark:bg-[#242424] text-slate-900 dark:text-white">Bagira</option>
            </select>
          </div>

          {/* Bouton de recherche en bas de l'image */}
          <button
            type="button"
            id="home-execute-search-btn"
            onClick={handleExecuteSearch}
            className="w-full sm:w-auto px-7 py-3 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-2 shadow-md hover:shadow-lg cursor-pointer shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>Rechercher</span>
          </button>
        </div>
      </section>

      {/* 2. GRILLE DE TOUS LES BIENS (IMMÉDIATEMENT APRÈS LE BLOC D'ACCUEIL) */}
      <section id="featured-listings" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-4 sm:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Dernières opportunités
            </h2>
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
            {(
              [
                { id: 'tous', label: 'Tous' },
                { id: 'location', label: 'Locations' },
                { id: 'vente', label: 'Ventes' },
                { id: 'parcelle', label: 'Parcelles' },
                { id: 'villa', label: 'Villas' }
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setGridFilter(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  gridFilter === tab.id
                    ? 'bg-white dark:bg-[#1f1f1f] text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-12 text-center border border-slate-200/80 dark:border-white/5 space-y-4">
            <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Aucune propriété disponible</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Soyez le premier à ajouter une annonce.</p>
            </div>
            <button
              type="button"
              onClick={openAddPropertyModal}
              className="bg-[#FF385C] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#E00B41] transition cursor-pointer"
            >
              Publier un bien
            </button>
          </div>
        ) : displayedProperties.length === 0 ? (
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-8 text-center border border-slate-200/80 dark:border-white/5">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Aucun bien pour ce filtre.</p>
            <button
              type="button"
              onClick={() => setGridFilter('tous')}
              className="text-xs font-semibold text-[#FF385C] mt-2 hover:underline cursor-pointer"
            >
              Afficher tout
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {displayedProperties.map((prop) => (
              <PropertyCard
                key={prop.id}
                property={prop}
                isFavorite={favoriteIds.includes(prop.id)}
                onToggleFavorite={onToggleFavorite}
                onSelectProperty={onSelectProperty}
                onOpenContactModal={onOpenContactModal}
                onOpenShareModal={onOpenShareModal}
                onSelectNeighborhood={onSelectNeighborhood}
              />
            ))}
          </div>
        )}

        {properties.length > 6 && (
          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => setCurrentTab('listings')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <span>Voir tout le catalogue ({properties.length} annonces)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* PARTENAIRES B2B SECTION */}
      <PartnersSection
        onOpenPartnerModal={onOpenPartnerModal}
        onOpenFurnitureModal={onOpenPartnerFurnitureModal}
      />
    </div>
  );
};

export const HomeView = Home;
export const LandingPage = Home;
export default Home;
