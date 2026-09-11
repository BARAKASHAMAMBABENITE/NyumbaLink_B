import React from 'react';
import {
  Heart,
  Bed,
  Bath,
  Maximize2,
  MapPin,
  Eye,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Zap,
  Share2,
  Building2,
  AlertOctagon,
  Lock
} from 'lucide-react';
import { Property, UserProfile } from '../types';

interface PropertyCardProps {
  property: Property;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  onOpenContactModal: (property: Property) => void;
  onOpenShareModal?: (property: Property) => void;
  onSelectNeighborhood?: (neighborhood: string) => void;
  user?: UserProfile | null;
  onDeleteProperty?: (id: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  isFavorite,
  onToggleFavorite,
  onSelectProperty,
  onOpenContactModal,
  onOpenShareModal,
  onSelectNeighborhood,
  user,
  onDeleteProperty
}) => {
  const isOccupied = property.status === 'loue' || property.status === 'vendu';

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat) {
      case 'villa':
        return 'bg-rose-50 text-[#FF385C] dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'maison':
        return 'bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-slate-100 border-slate-300 dark:border-white/10';
      case 'appartement':
        return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'parcelle':
        return 'bg-slate-50 text-slate-900 dark:bg-white/10 dark:text-slate-100 border-slate-300 dark:border-white/10';
      default:
        return 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  return (
    <article
      id={`property-card-${property.id}`}
      className={`group bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200/90 dark:border-[#2a2a2a] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden relative ${
        isOccupied ? 'opacity-90' : ''
      }`}
    >
      {/* Top Badges (Verification, Status & VIP) */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5 items-center">
        {isOccupied && property.status !== 'loue' && (
          <div className="bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center space-x-1 uppercase tracking-wider">
            <AlertOctagon className="w-3 h-3" />
            <span>{property.status === 'loue' ? 'Déjà Loué' : 'Déjà Vendu'}</span>
          </div>
        )}

        {property.isBoosted && !isOccupied && (
          <div className="bg-amber-500 text-slate-950 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center space-x-1 uppercase tracking-wider">
            <Zap className="w-3 h-3 fill-slate-950" />
            <span>VIP</span>
          </div>
        )}

        {(property.isVerified || property.ownerRole === 'agent') && (
          <div className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-full shadow-sm flex items-center space-x-1 border border-white/10">
            <CheckCircle2 className="w-3 h-3 text-[#FF385C]" />
            <span>{property.isVerified ? 'Titre Vérifié' : 'Agent Agréé'}</span>
          </div>
        )}

        {property.featured && !property.isBoosted && !isOccupied && (
          <div className="bg-slate-900/80 backdrop-blur-md text-[#FF385C] text-[10px] font-semibold px-2.5 py-1 rounded-full border border-[#FF385C]/30 shadow-sm flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-[#FF385C] fill-[#FF385C]" />
            <span>Coup de cœur</span>
          </div>
        )}
      </div>

      {/* Image Container with Fixed 16:9 Aspect Video Ratio */}
      <div
        className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-[#151515] flex items-center justify-center cursor-pointer"
        onClick={() => onSelectProperty(property)}
      >
        {property.images && property.images.length > 0 && property.images[0] ? (
          <img
            src={property.images[0]}
            alt={property.title}
            loading="lazy"
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out ${
              isOccupied ? 'grayscale-[35%]' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#181818] dark:to-[#222222] text-slate-500">
            <Building2 className="w-8 h-8 text-[#FF385C]/70 mb-1" />
            <span className="text-[11px] font-medium uppercase tracking-wider">
              {property.category} • Bukavu
            </span>
          </div>
        )}

        {/* Center overlay banner when already taken */}
        {isOccupied && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-15">
            <div className="bg-rose-600/95 text-white px-3.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>{property.status === 'loue' ? 'Déjà Loué' : 'Déjà Vendu'}</span>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70" />

        {/* Favorite & Share Floating Actions */}
        <div className="absolute top-3 right-3 z-20 flex items-center space-x-1.5">
          {onOpenShareModal && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenShareModal(property);
              }}
              className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 hover:bg-white text-slate-800 dark:text-white shadow-sm backdrop-blur-sm flex items-center justify-center transition-all cursor-pointer"
              title="Partager l'annonce"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(property.id);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isFavorite
                ? 'bg-[#FF385C] text-white shadow-md scale-105'
                : 'bg-white/90 dark:bg-slate-900/90 hover:bg-white text-slate-800 dark:text-white shadow-sm backdrop-blur-sm'
            }`}
            title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart
              className={`w-4 h-4 ${
                isFavorite ? 'fill-white text-[#FF385C]' : 'text-slate-700 dark:text-white'
              }`}
            />
          </button>
        </div>

        {/* Bottom Metadata Badges */}
        <div className="absolute bottom-2.5 left-3 z-10 flex items-center space-x-2">
          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase border backdrop-blur-sm ${getCategoryBadgeColor(
              property.category
            )}`}
          >
            {property.category}
          </span>
          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider shadow-xs ${
              isOccupied
                ? 'bg-rose-600 text-white'
                : property.type === 'vente'
                ? 'bg-[#FF385C] text-white'
                : 'bg-slate-900 text-white'
            }`}
          >
            {isOccupied
              ? property.status === 'loue'
                ? 'Loué'
                : 'Vendu'
              : property.type === 'vente'
              ? 'À Vendre'
              : 'À Louer'}
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Price & Neighborhood */}
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline space-x-1">
              <span
                className={`text-xl sm:text-2xl font-bold tracking-tight ${
                  isOccupied
                    ? 'text-slate-400 line-through'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                ${property.price.toLocaleString()}
              </span>
              {property.type === 'location' && (
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">/ mois</span>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectNeighborhood) {
                  onSelectNeighborhood(property.neighborhood);
                }
              }}
              className="text-[11px] font-medium text-[#FF385C] bg-[#FF385C]/10 hover:bg-[#FF385C]/15 border border-[#FF385C]/20 px-2.5 py-0.5 rounded-full flex items-center space-x-1 transition cursor-pointer whitespace-nowrap"
              title={`Filtrer par quartier ${property.neighborhood}`}
            >
              <MapPin className="w-3 h-3 text-[#FF385C]" />
              <span>{property.neighborhood}</span>
            </button>
          </div>

          {/* Title */}
          <h3
            onClick={() => onSelectProperty(property)}
            className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#FF385C] transition line-clamp-2 cursor-pointer leading-snug tracking-tight"
          >
            {property.title}
          </h3>

          {/* Address & Commune */}
          <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center space-x-1 truncate font-medium">
            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate">
              {property.address || `${property.neighborhood}, ${property.commune}, Bukavu`}
            </span>
          </p>

          {/* Description Snippet */}
          {property.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed pt-0.5">
              {property.description}
            </p>
          )}
        </div>

        {/* Specifications row (Bedrooms, Bathrooms, Surface only for parcelle) */}
        <div className="pt-2 border-t border-slate-100 dark:border-[#282828] flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <div className="flex items-center space-x-3">
            {property.bedrooms !== undefined && property.category !== 'parcelle' && (
              <div
                className="flex items-center space-x-1"
                title={
                  property.type === 'vente'
                    ? `${property.bedrooms} pièces`
                    : `${property.bedrooms} chambres`
                }
              >
                <Bed className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span>
                  {property.bedrooms} {property.type === 'vente' ? 'pièces' : 'ch.'}
                </span>
              </div>
            )}
            {property.bathrooms !== undefined && (
              <div className="flex items-center space-x-1" title={`${property.bathrooms} salles de bain`}>
                <Bath className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span>{property.bathrooms} sdb.</span>
              </div>
            )}
            {property.category === 'parcelle' && property.surface !== undefined && property.surface > 0 && (
              <div className="flex items-center space-x-1" title={`Superficie ${property.surface} m²`}>
                <Maximize2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span>{property.surface} m²</span>
              </div>
            )}
          </div>

          {/* Action trigger */}
          <div className="flex items-center space-x-1.5">
            {!isOccupied && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenContactModal(property);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#FF385C] hover:bg-[#FF385C]/10 transition cursor-pointer"
              >
                Contacter
              </button>
            )}

            <button
              type="button"
              onClick={() => onSelectProperty(property)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-[#FF385C] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
              title="Voir la fiche"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

