import React from 'react';
import { Search, Filter, RotateCcw, Compass } from 'lucide-react';
import { FilterOptions, PropertyCategory, TransactionType, BukavuCommune } from '../types';
import { BUKAVU_COMMUNES_WITH_NEIGHBORHOODS, BUKAVU_NEIGHBORHOODS } from '../data/initialProperties';
import { formatFoundPropertiesCount } from '../utils/text';
import { useLanguage } from '../context/LanguageContext';

interface PropertyFilterProps {
  filterOptions: FilterOptions;
  setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptions>>;
  totalResults: number;
}

export const PropertyFilter: React.FC<PropertyFilterProps> = ({
  filterOptions,
  setFilterOptions,
  totalResults
}) => {
  const { language } = useLanguage();
  const isSwahili = language === 'sw';
  const categories: { id: PropertyCategory | 'tous'; label: string }[] = [
    { id: 'tous', label: isSwahili ? 'Aina zote' : language === 'en' ? 'All categories' : 'Toutes les catégories' },
    { id: 'maison', label: isSwahili ? 'Nyumba' : language === 'en' ? 'House' : 'Maison' },
    { id: 'parcelle', label: isSwahili ? 'Kiwanja' : language === 'en' ? 'Plot' : 'Parcelle' },
    { id: 'appartement', label: isSwahili ? 'Apartimenti' : language === 'en' ? 'Apartment' : 'Appartement' },
    { id: 'villa', label: isSwahili ? 'Vila' : language === 'en' ? 'Villa' : 'Villa' },
    { id: 'commercial', label: isSwahili ? 'Biashara' : language === 'en' ? 'Commercial' : 'Commercial' }
  ];

  const transactionTypes: { id: TransactionType | 'tous'; label: string }[] = [
    { id: 'tous', label: isSwahili ? 'Zote' : language === 'en' ? 'All' : 'Tous' },
    { id: 'vente', label: isSwahili ? 'Inauzwa' : language === 'en' ? 'For Sale' : 'À Vendre' },
    { id: 'location', label: isSwahili ? 'Inapangishwa' : language === 'en' ? 'For Rent' : 'À Louer' }
  ];

  const popularFeatures = [
    'Vue sur le Lac Kivu',
    'Eau 24h/24',
    'Électricité',
    'Clôturé',
    'Garage',
    'Jardin'
  ];

  // Available neighborhoods based on selected commune
  const selectedCommune = filterOptions.commune || 'tous';
  const availableNeighborhoods =
    selectedCommune !== 'tous'
      ? BUKAVU_COMMUNES_WITH_NEIGHBORHOODS[selectedCommune] || []
      : BUKAVU_NEIGHBORHOODS;

  const handleFeatureToggle = (feature: string) => {
    setFilterOptions((prev) => {
      const exists = prev.features.includes(feature);
      const updated = exists
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature];
      return { ...prev, features: updated };
    });
  };

  const handleReset = () => {
    setFilterOptions({
      searchQuery: '',
      category: 'tous',
      type: 'tous',
      commune: 'tous',
      neighborhood: 'tous',
      minPrice: '',
      maxPrice: '',
      minBedrooms: '',
      minBathrooms: '',
      features: [],
      sortBy: 'recent'
    });
  };

  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-slate-200 dark:border-[#2e2e2e] p-5 shadow-xs mb-8 space-y-5 transition-colors">
      {/* Search Input & Main Category Pills */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            placeholder={isSwahili ? 'Mtaa au jirani huko Bukavu...' : language === 'en' ? 'Street or neighborhood in Bukavu...' : 'Rue, quartier à Bukavu (ex: Nguba, Muhungu, Panzi, La Botte...)'}
            value={filterOptions.searchQuery}
            onChange={(e) =>
              setFilterOptions((prev) => ({ ...prev, searchQuery: e.target.value }))
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2e2e2e] bg-slate-50 dark:bg-[#121212] focus:bg-white dark:focus:bg-[#1e1e1e] focus:outline-hidden focus:ring-2 focus:ring-[#FF385C] text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition"
          />
        </div>

        {/* Transaction Type Buttons */}
        <div className="flex items-center bg-slate-50 dark:bg-[#121212] p-1 rounded-xl border border-slate-200 dark:border-[#2e2e2e] shrink-0">
          {transactionTypes.map((t) => (
            <button
              key={t.id}
              onClick={() =>
                setFilterOptions((prev) => ({ ...prev, type: t.id }))
              }
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                filterOptions.type === t.id
                  ? 'bg-[#FF385C] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-200 dark:border-[#2e2e2e]">
        {/* Commune Select */}
        <div>
          <label className="block text-[11px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-1 flex items-center">
            <Compass className="w-3 h-3 text-[#FF385C] mr-1" />
            {isSwahili ? 'Manispaa (Bukavu)' : language === 'en' ? 'Commune (Bukavu)' : 'Commune (Bukavu)'}
          </label>
          <select
            value={filterOptions.commune || 'tous'}
            onChange={(e) =>
              setFilterOptions((prev) => ({
                ...prev,
                commune: e.target.value as BukavuCommune | 'tous',
                neighborhood: 'tous' // reset neighborhood on commune change
              }))
            }
            className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF385C]"
          >
            <option value="tous">{isSwahili ? 'Manispaa zote' : language === 'en' ? 'All Communes' : 'Toutes les Communes'}</option>
            <option value="Ibanda">{isSwahili ? 'Manispaa ya Ibanda' : language === 'en' ? 'Ibanda Commune' : "Commune d'Ibanda"}</option>
            <option value="Kadutu">{isSwahili ? 'Manispaa ya Kadutu' : language === 'en' ? 'Kadutu Commune' : "Commune de Kadutu"}</option>
            <option value="Bagira">{isSwahili ? 'Manispaa ya Bagira' : language === 'en' ? 'Bagira Commune' : "Commune de Bagira"}</option>
          </select>
        </div>

        {/* Neighborhood Select */}
        <div>
          <label className="block text-[11px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            {isSwahili ? 'Jirani' : language === 'en' ? 'Neighborhood' : 'Quartier'}
          </label>
          <select
            value={filterOptions.neighborhood}
            onChange={(e) =>
              setFilterOptions((prev) => ({ ...prev, neighborhood: e.target.value }))
            }
            className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF385C]"
          >
            <option value="tous">{isSwahili ? 'Jirani zote' : language === 'en' ? 'All neighborhoods' : 'Tous les quartiers'}</option>
            {availableNeighborhoods.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>

        {/* Category Select */}
        <div>
          <label className="block text-[11px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            {isSwahili ? 'Aina' : language === 'en' ? 'Category' : 'Catégorie'}
          </label>
          <select
            value={filterOptions.category}
            onChange={(e) =>
              setFilterOptions((prev) => ({
                ...prev,
                category: e.target.value as PropertyCategory | 'tous'
              }))
            }
            className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF385C]"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Min / Max Price in USD */}
        <div>
          <label className="block text-[11px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            {isSwahili ? 'Bajeti ya juu ($ USD)' : language === 'en' ? 'Max Budget ($ USD)' : 'Budget Max ($ USD)'}
          </label>
          <div className="flex items-center space-x-1.5">
            <input
              type="number"
              placeholder={isSwahili ? 'Chini $' : 'Min $'}
              value={filterOptions.minPrice}
              onChange={(e) =>
                setFilterOptions((prev) => ({
                  ...prev,
                  minPrice: e.target.value ? Number(e.target.value) : ''
                }))
              }
              className="w-1/2 px-2 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
            />
            <span className="text-slate-500 dark:text-slate-400 text-xs">-</span>
            <input
              type="number"
              placeholder={isSwahili ? 'Juu $' : 'Max $'}
              value={filterOptions.maxPrice}
              onChange={(e) =>
                setFilterOptions((prev) => ({
                  ...prev,
                  maxPrice: e.target.value ? Number(e.target.value) : ''
                }))
              }
              className="w-1/2 px-2 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-[11px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            {isSwahili ? 'Panga kwa' : language === 'en' ? 'Sort by' : 'Trier par'}
          </label>
          <select
            value={filterOptions.sortBy}
            onChange={(e) =>
              setFilterOptions((prev) => ({
                ...prev,
                sortBy: e.target.value as any
              }))
            }
            className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF385C]"
          >
            <option value="recent">{isSwahili ? 'Mpya zaidi' : language === 'en' ? 'Most recent' : 'Plus récentes'}</option>
            <option value="price_asc">{isSwahili ? 'Bei inayopanda ($)' : language === 'en' ? 'Price ascending ($)' : 'Prix croissant ($)'}</option>
            <option value="price_desc">{isSwahili ? 'Bei inayoshuka ($)' : language === 'en' ? 'Price descending ($)' : 'Prix décroissant ($)'}</option>
            <option value="popular">{isSwahili ? 'Maarufu zaidi (Mionekano)' : language === 'en' ? 'Most popular (Views)' : 'Plus populaires (Vues)'}</option>
          </select>
        </div>
      </div>

      {/* Feature Chips */}
      <div className="pt-2 border-t border-slate-200 dark:border-[#2e2e2e] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-2 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1 text-[#FF385C]" />
            {isSwahili ? 'Vifaa :' : language === 'en' ? 'Features:' : 'Équipements :'}
          </span>
          {popularFeatures.map((feat) => {
            const isSelected = filterOptions.features.includes(feat);
            return (
              <button
                key={feat}
                onClick={() => handleFeatureToggle(feat)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition border ${
                  isSelected
                    ? 'bg-[#FF385C]/15 text-[#FF385C] border-[#FF385C]'
                    : 'bg-slate-50 dark:bg-[#121212] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-[#2e2e2e] hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {feat}
              </button>
            );
          })}
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-[#121212] px-3 py-1 rounded-lg border border-slate-200 dark:border-[#2e2e2e]">
            {formatFoundPropertiesCount(totalResults)}
          </span>

          <button
            onClick={handleReset}
            className="text-slate-600 hover:text-[#FF385C] dark:text-slate-400 dark:hover:text-[#FF385C] font-semibold flex items-center space-x-1 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>
        </div>
      </div>
    </div>
  );
};

