import React, { useState } from 'react';
import { Property, BukavuCommune } from '../types';
import { PhoneNotificationBanner } from './PhoneNotificationBanner';
import {
  Bell,
  Sparkles,
  MapPin,
  Eye,
  CheckCheck,
  Building2,
  Home,
  DollarSign,
  Calendar,
  Layers
} from 'lucide-react';

interface NewPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  onSelectProperty: (property: Property) => void;
  onMarkAllAsViewed: () => void;
}

export const NewPropertiesModal: React.FC<NewPropertiesModalProps> = ({
  isOpen,
  onClose,
  properties,
  onSelectProperty,
  onMarkAllAsViewed
}) => {
  const [selectedCommune, setSelectedCommune] = useState<BukavuCommune | 'tous'>('tous');
  const [selectedCategory, setSelectedCategory] = useState<string>('tous');

  if (!isOpen) return null;

  // Sort properties by creation date descending
  const sortedProperties = [...properties].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filteredProperties = sortedProperties.filter((prop) => {
    const matchesCommune = selectedCommune === 'tous' || prop.commune === selectedCommune;
    const matchesCategory = selectedCategory === 'tous' || prop.category === selectedCategory;
    return matchesCommune && matchesCategory;
  });

  const handlePropertyClick = (prop: Property) => {
    onSelectProperty(prop);
    onClose();
  };

  const formatPublishDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Publié il y a quelques minutes';
    } else if (diffHours < 24) {
      return `Publié il y a ${diffHours}h`;
    } else if (diffDays === 1) {
      return 'Publié hier';
    } else if (diffDays < 7) {
      return `Publié il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#ebebeb] dark:border-[#2e2e2e] relative max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#ebebeb] dark:border-[#2e2e2e]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-extrabold text-[#222222] dark:text-[#f7f7f7]">
                  Nouveaux Biens Publiés
                </h3>
                <span className="bg-[#FF385C] text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{properties.length} {properties.length > 1 ? 'Annonces' : 'Annonce'}</span>
                </span>
              </div>
              <p className="text-xs text-[#717171] dark:text-[#b0b0b0]">
                Découvrez les dernières opportunités immobilières publiées à Bukavu
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Phone Notification Quick Action Banner */}
        <PhoneNotificationBanner />

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-3 border-b border-[#ebebeb] dark:border-[#2e2e2e]">
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5">
            {(['tous', 'Ibanda', 'Kadutu', 'Bagira'] as const).map((commune) => (
              <button
                key={commune}
                onClick={() => setSelectedCommune(commune)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
                  selectedCommune === commune
                    ? 'bg-[#222222] text-white dark:bg-white dark:text-[#222222]'
                    : 'bg-stone-100 dark:bg-[#282828] text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                {commune === 'tous' ? 'Toutes les Communes' : `Commune de ${commune}`}
              </button>
            ))}
          </div>

          <button
            onClick={onMarkAllAsViewed}
            className="text-[11px] font-bold text-[#FF385C] hover:underline flex items-center space-x-1 shrink-0 cursor-pointer ml-auto"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Tout marquer comme vu</span>
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3.5">
          {filteredProperties.length === 0 ? (
            <div className="text-center py-12 text-[#717171] dark:text-[#b0b0b0]">
              <Home className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
              <p className="font-bold text-sm">Aucun bien ne correspond aux filtres sélectionnés.</p>
              <p className="text-xs mt-1">Consultez d'autres communes ou catégories.</p>
            </div>
          ) : (
            filteredProperties.map((prop) => (
              <div
                key={prop.id}
                onClick={() => handlePropertyClick(prop)}
                className="group p-3 sm:p-3.5 rounded-xl border border-[#ebebeb] dark:border-[#2e2e2e] bg-stone-50/70 hover:bg-white dark:bg-[#151515] dark:hover:bg-[#222222] transition shadow-xs hover:shadow-md cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5"
              >
                <div className="flex items-start sm:items-center space-x-3.5 overflow-hidden w-full sm:w-auto">
                  <div className="relative shrink-0">
                    <img
                      src={prop.images[0]}
                      alt={prop.title}
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover"
                    />
                    <span className="absolute top-1 left-1 bg-[#FF385C] text-white text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md shadow-xs">
                      {prop.type === 'vente' ? 'Vente' : 'Location'}
                    </span>
                  </div>

                  <div className="overflow-hidden min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-0.5">
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#FF385C]/10 text-[#FF385C]">
                        {prop.category}
                      </span>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatPublishDate(prop.createdAt)}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-[#222222] dark:text-[#f7f7f7] group-hover:text-[#FF385C] transition truncate">
                      {prop.title}
                    </h4>

                    <div className="flex items-center space-x-2 text-[11px] text-stone-500 dark:text-stone-400 mt-1 truncate">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-[#FF385C] shrink-0" />
                        <span>{prop.commune} • {prop.neighborhood}</span>
                      </span>
                      {prop.category === 'parcelle' && prop.surface && (
                        <span>• {prop.surface} m²</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#ebebeb] dark:border-[#2e2e2e] gap-2">
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-semibold text-stone-400 dark:text-stone-500">
                      Prix demandé
                    </p>
                    <p className="text-sm sm:text-base font-black text-[#222222] dark:text-[#f7f7f7]">
                      ${prop.price.toLocaleString()}
                      {prop.pricePeriod === 'mois' && <span className="text-xs font-normal text-stone-500"> /mois</span>}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="bg-[#222222] group-hover:bg-[#FF385C] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Voir l'annonce</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#ebebeb] dark:border-[#2e2e2e] flex items-center justify-between">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Bukavu : Ibanda, Kadutu, Bagira
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-stone-100 dark:bg-[#282828] hover:bg-stone-200 dark:hover:bg-[#333333] text-[#222222] dark:text-[#f7f7f7] font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
