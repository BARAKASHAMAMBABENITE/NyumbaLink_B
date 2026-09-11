import React, { useState } from 'react';
import {
  LayoutGrid,
  List as ListIcon,
  Map as MapIcon,
  SlidersHorizontal,
  Building2
} from 'lucide-react';
import { Property, FilterOptions } from '../types';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyFilter } from '../components/PropertyFilter';
import { PropertyMap } from '../components/PropertyMap';
import { filterPropertiesList } from '../services/propertyService';
import { formatAvailablePropertiesCount } from '../utils/text';

interface ListingsViewProps {
  properties: Property[];
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  onOpenContactModal: (property: Property) => void;
  onOpenShareModal?: (property: Property) => void;
  filterOptions: FilterOptions;
  setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptions>>;
  onSelectNeighborhood?: (neighborhood: string) => void;
}

export const ListingsView: React.FC<ListingsViewProps> = ({
  properties,
  favoriteIds,
  onToggleFavorite,
  onSelectProperty,
  onOpenContactModal,
  onOpenShareModal,
  filterOptions,
  setFilterOptions,
  onSelectNeighborhood
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'split'>('grid');

  const filteredProperties = filterPropertiesList(properties, filterOptions);

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-slate-200/80 dark:border-[#2e2e2e] shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Annonces Immobilières à Bukavu
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {formatAvailablePropertiesCount(filteredProperties.length)}
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-[#252525] p-1 rounded-xl border border-slate-200 dark:border-[#333] self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-[#FF385C] text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Grille</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[#FF385C] text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ListIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Liste</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'split'
                ? 'bg-[#FF385C] text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Carte + Grille</span>
          </button>
        </div>
      </div>

      {/* Filter Component */}
      <PropertyFilter
        filterOptions={filterOptions}
        setFilterOptions={setFilterOptions}
        totalResults={filteredProperties.length}
      />

      {/* Main Listings Body */}
      {filteredProperties.length === 0 ? (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-12 text-center border border-slate-200 dark:border-[#2e2e2e] space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#262626] text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Aucun bien ne correspond à ces filtres à Bukavu
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Essayez d'élargir votre recherche, de changer de quartier ou de réinitialiser le budget.
          </p>
          <button
            onClick={() =>
              setFilterOptions({
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
              })
            }
            className="bg-[#FF385C] text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:opacity-90 transition cursor-pointer"
          >
            Effacer tous les filtres
          </button>
        </div>
      ) : viewMode === 'split' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map Column */}
          <div className="lg:col-span-6 sticky top-20 z-10">
            <PropertyMap
              properties={filteredProperties}
              onSelectProperty={onSelectProperty}
              height="600px"
            />
          </div>

          {/* Cards Column */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProperties.map((prop) => (
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
        </div>
      ) : (
        <div
          className={`grid gap-6 ${
            viewMode === 'list'
              ? 'grid-cols-1'
              : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {filteredProperties.map((prop) => (
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
    </div>
  );
};
