import React from 'react';
import { Property } from '../types';
import { PropertyCard } from '../components/PropertyCard';
import { Heart, Building2, Search } from 'lucide-react';
import { formatSavedPropertiesCount } from '../utils/text';

interface FavoritesViewProps {
  properties: Property[];
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  onOpenContactModal: (property: Property) => void;
  onOpenShareModal?: (property: Property) => void;
  setCurrentTab: (tab: string) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  properties,
  favoriteIds,
  onToggleFavorite,
  onSelectProperty,
  onOpenContactModal,
  onOpenShareModal,
  setCurrentTab
}) => {
  const favoriteProperties = properties.filter((p) => favoriteIds.includes(p.id));

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-slate-200/80 dark:border-[#2e2e2e] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#FF385C] font-bold text-xs uppercase tracking-wider">
            <Heart className="w-4 h-4 fill-[#FF385C]" />
            <span>Sauvegardes Personnelles</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            Mes Propriétés Favorites
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {formatSavedPropertiesCount(favoriteProperties.length)}
          </p>
        </div>

        <button
          onClick={() => setCurrentTab('listings')}
          className="bg-[#FF385C] hover:opacity-90 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Search className="w-4 h-4" />
          <span>Explorer les annonces</span>
        </button>
      </div>

      {/* Grid of Favorites */}
      {favoriteProperties.length === 0 ? (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-12 text-center border border-slate-200 dark:border-[#2e2e2e] space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/30 text-[#FF385C] flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Vous n'avez pas encore de favoris
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Parcourez les annonces immobilières à Bukavu et cliquez sur l'icône cœur pour sauvegarder vos coups de cœur.
          </p>
          <button
            onClick={() => setCurrentTab('listings')}
            className="bg-[#FF385C] text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:opacity-90 transition cursor-pointer"
          >
            Découvrir les propriétés à Bukavu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteProperties.map((prop) => (
            <PropertyCard
              key={prop.id}
              property={prop}
              isFavorite={true}
              onToggleFavorite={onToggleFavorite}
              onSelectProperty={onSelectProperty}
              onOpenContactModal={onOpenContactModal}
              onOpenShareModal={onOpenShareModal}
            />
          ))}
        </div>
      )}
    </div>
  );
};
