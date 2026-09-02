import React, { useState, useMemo } from 'react';
import { Property, FilterOptions, BukavuCommune } from '../types';
import { PropertyMap } from '../components/PropertyMap';
import { PropertyCard } from '../components/PropertyCard';
import {
  BUKAVU_COMMUNES,
  BUKAVU_COMMUNES_WITH_NEIGHBORHOODS,
  BUKAVU_NEIGHBORHOOD_COORDINATES
} from '../data/initialProperties';
import { filterPropertiesList } from '../services/propertyService';
import { MapPin, Compass, Search, X, Check, Navigation2 } from 'lucide-react';
import { formatMarkersCount } from '../utils/text';

interface MapViewProps {
  properties: Property[];
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  onOpenContactModal: (property: Property) => void;
  onOpenShareModal?: (property: Property) => void;
  filterOptions: FilterOptions;
  setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptions>>;
}

export const MapView: React.FC<MapViewProps> = ({
  properties,
  favoriteIds,
  onToggleFavorite,
  onSelectProperty,
  onOpenContactModal,
  onOpenShareModal,
  filterOptions,
  setFilterOptions
}) => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedCoordinates, setSearchedCoordinates] = useState<[number, number] | undefined>(undefined);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredProperties = filterPropertiesList(properties, filterOptions);

  // All Bukavu Neighborhoods list with parent commune
  const allBukavuPlaces = useMemo(() => {
    const list: { name: string; commune: BukavuCommune; coords?: [number, number] }[] = [];
    (Object.keys(BUKAVU_COMMUNES_WITH_NEIGHBORHOODS) as BukavuCommune[]).forEach((commune) => {
      BUKAVU_COMMUNES_WITH_NEIGHBORHOODS[commune].forEach((hood) => {
        list.push({
          name: hood,
          commune,
          coords: BUKAVU_NEIGHBORHOOD_COORDINATES[hood]
        });
      });
    });
    return list;
  }, []);

  // Filter suggestions based on query
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allBukavuPlaces.filter(
      (p) => p.name.toLowerCase().includes(q) || p.commune.toLowerCase().includes(q)
    );
  }, [searchQuery, allBukavuPlaces]);

  const handleSelectPlace = (place: { name: string; commune: BukavuCommune; coords?: [number, number] }) => {
    setSearchQuery(place.name);
    setShowSuggestions(false);
    if (place.coords) {
      setSearchedCoordinates(place.coords);
    }
    setFilterOptions((prev) => ({
      ...prev,
      commune: place.commune,
      neighborhood: place.name
    }));
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchedCoordinates(undefined);
    setShowSuggestions(false);
    setFilterOptions((prev) => ({
      ...prev,
      neighborhood: 'tous'
    }));
  };

  // Neighborhood options for active commune
  const activeNeighborhoods = useMemo(() => {
    if (!filterOptions.commune || filterOptions.commune === 'tous') {
      return [];
    }
    return BUKAVU_COMMUNES_WITH_NEIGHBORHOODS[filterOptions.commune as BukavuCommune] || [];
  }, [filterOptions.commune]);

  return (
    <div className="space-y-4 pb-12">
      {/* Header Bar with Search & Filters */}
      <div className="bg-white dark:bg-[#1e1e1e] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#2e2e2e] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-[#FF385C]" />
              <span>Carte Géographique de Bukavu</span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Recherchez un quartier de Bukavu ou filtrez par commune (Ibanda, Kadutu, Bagira)
            </p>
          </div>

          {/* Search bar with Search Icon */}
          <div className="relative w-full md:w-80">
            <div className="relative flex items-center">
              <div className="absolute left-3 pointer-events-none text-slate-400 dark:text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Rechercher un quartier (ex: Nguba, Nyawera...)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF385C]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#2e2e2e] rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto">
                {suggestions.map((place) => (
                  <button
                    key={`${place.commune}-${place.name}`}
                    type="button"
                    onClick={() => handleSelectPlace(place)}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-[#252525] flex items-center justify-between text-xs border-b border-slate-100 dark:border-[#252525] last:border-0 cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <Navigation2 className="w-3.5 h-3.5 text-[#FF385C]" />
                      <span className="font-bold text-slate-900 dark:text-white">{place.name}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-[#2e2e2e] px-2 py-0.5 rounded-full">
                      {place.commune}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Commune & Neighborhood Selectors */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#252525]">
          <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300 text-xs font-bold shrink-0">
            <Compass className="w-3.5 h-3.5 text-[#FF385C]" />
            <span>Communes de Bukavu :</span>
          </div>
          <button
            onClick={() => {
              setFilterOptions((prev) => ({ ...prev, commune: 'tous', neighborhood: 'tous' }));
              setSearchedCoordinates(undefined);
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
              !filterOptions.commune || filterOptions.commune === 'tous'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-[#282828] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#333]'
            }`}
          >
            Toutes ({properties.length})
          </button>
          {BUKAVU_COMMUNES.map((commune) => {
            const count = properties.filter((p) => p.commune === commune).length;
            const isSelected = filterOptions.commune === commune;
            return (
              <button
                key={commune}
                onClick={() => {
                  setFilterOptions((prev) => ({ ...prev, commune: commune, neighborhood: 'tous' }));
                  setSearchedCoordinates(undefined);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#FF385C] text-white'
                    : 'bg-slate-100 dark:bg-[#282828] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#333]'
                }`}
              >
                {commune} ({count})
              </button>
            );
          })}

          {/* Neighborhood filter dropdown if a commune is selected */}
          {activeNeighborhoods.length > 0 && (
            <div className="flex items-center space-x-2 ml-auto">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Quartier :</span>
              <select
                value={filterOptions.neighborhood || 'tous'}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilterOptions((prev) => ({ ...prev, neighborhood: val }));
                  if (val !== 'tous' && BUKAVU_NEIGHBORHOOD_COORDINATES[val]) {
                    setSearchedCoordinates(BUKAVU_NEIGHBORHOOD_COORDINATES[val]);
                  }
                }}
                className="px-3 py-1 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#FF385C]"
              >
                <option value="tous">Tous les quartiers ({activeNeighborhoods.length})</option>
                {activeNeighborhoods.map((hood) => (
                  <option key={hood} value={hood}>
                    {hood}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Map + Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Full Interactive Map */}
        <div className="lg:col-span-8 rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1e1e1e]">
          <PropertyMap
            properties={filteredProperties}
            selectedProperty={selectedProperty}
            centerCoordinates={searchedCoordinates}
            onSelectProperty={(p) => {
              setSelectedProperty(p);
            }}
            height="620px"
          />
        </div>

        {/* Selected / List Sidebar */}
        <div className="lg:col-span-4 space-y-4 max-h-[620px] overflow-y-auto pr-1">
          <div className="bg-white dark:bg-[#1e1e1e] p-3.5 rounded-xl border border-slate-200 dark:border-[#2e2e2e] flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>{formatMarkersCount(filteredProperties.length)}</span>
            {selectedProperty && (
              <button
                onClick={() => setSelectedProperty(null)}
                className="text-[#FF385C] hover:underline cursor-pointer"
              >
                Désélectionner
              </button>
            )}
          </div>

          {selectedProperty ? (
            <div className="space-y-2 animate-in fade-in">
              <span className="text-xs font-bold text-[#FF385C] uppercase tracking-wider block px-1">
                Bien Sélectionné sur la carte :
              </span>
              <PropertyCard
                property={selectedProperty}
                isFavorite={favoriteIds.includes(selectedProperty.id)}
                onToggleFavorite={onToggleFavorite}
                onSelectProperty={onSelectProperty}
                onOpenContactModal={onOpenContactModal}
                onOpenShareModal={onOpenShareModal}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProperties.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProperty(p)}
                  className="bg-white dark:bg-[#1e1e1e] p-3 rounded-xl border border-slate-200 dark:border-[#2e2e2e] hover:border-[#FF385C] cursor-pointer transition shadow-2xs flex items-center space-x-3"
                >
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                  />
                  <div className="overflow-hidden text-xs">
                    <span className="text-[10px] font-bold text-[#FF385C] uppercase">
                      📍 Quartier {p.neighborhood}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{p.title}</h4>
                    <p className="font-extrabold text-slate-900 dark:text-white mt-1">
                      ${p.price.toLocaleString()} {p.pricePeriod === 'mois' ? '/mois' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
