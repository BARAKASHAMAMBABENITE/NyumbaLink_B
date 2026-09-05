import React, { useState } from 'react';
import {
  Property,
  UserProfile
} from '../types';
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  MessageSquare,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  Sparkles,
  Building2,
  Calendar,
  Edit3,
  Award,
  Trash2,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Lock,
  Eye
} from 'lucide-react';
import { PropertyMap } from '../components/PropertyMap';
import { PropertyCard } from '../components/PropertyCard';
import { UserAvatar } from '../components/UserAvatar';

interface PropertyDetailViewProps {
  property: Property;
  allProperties: Property[];
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onBack: () => void;
  onSelectProperty: (property: Property) => void;
  onOpenContactModal: (property: Property) => void;
  onOpenShareModal?: (property: Property) => void;
  onOpenBoostModal?: (property: Property) => void;
  user?: UserProfile | null;
  onOpenEditModal?: (property: Property) => void;
  onDeleteProperty?: (id: string) => void;
  onSelectNeighborhood?: (neighborhood: string) => void;
}

export const PropertyDetailView: React.FC<PropertyDetailViewProps> = ({
  property,
  allProperties,
  isFavorite,
  onToggleFavorite,
  onBack,
  onSelectProperty,
  onOpenContactModal,
  onOpenShareModal,
  onOpenBoostModal,
  user,
  onOpenEditModal,
  onDeleteProperty,
  onSelectNeighborhood
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [routeInfo, setRouteInfo] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Strict RBAC: Admin can manage all properties, Agent can only manage THEIR OWN property
  const isOwner = Boolean(
    user && (
      (property.ownerId && property.ownerId === user.uid) ||
      (property.ownerEmail && user.email && property.ownerEmail.toLowerCase() === user.email.toLowerCase())
    )
  );

  const canManageProperty = user?.role === 'admin' || (user?.role === 'agent' && isOwner);
  const isOccupied = property.status === 'loue' || property.status === 'vendu';

  const relatedProperties = allProperties
    .filter((p) => p.id !== property.id && p.neighborhood === property.neighborhood)
    .slice(0, 3);

  const handleShare = () => {
    if (onOpenShareModal) {
      onOpenShareModal(property);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Calculate distance from Place Mulamba, Bukavu (-2.5020, 28.8630)
  const calculateRouteFromCenter = () => {
    const lat1 = -2.5020;
    const lon1 = 28.8630;
    const lat2 = property.latitude;
    const lon2 = property.longitude;

    // Approx distance in KM
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = (R * c).toFixed(1);

    const estMinutes = Math.round(Number(dist) * 4 + 5);

    setRouteInfo(
      `Trajet depuis Place Mulamba (Centre-Ville Bukavu) : environ ${dist} km (${estMinutes} min en véhicule)`
    );
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#2e2e2e] px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux annonces</span>
        </button>

        <div className="flex items-center space-x-2">
          {canManageProperty && (
            <div className="flex items-center space-x-1.5">
              {onOpenEditModal && (
                <button
                  onClick={() => onOpenEditModal(property)}
                  className="flex items-center space-x-1.5 bg-[#FF385C] hover:opacity-95 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  title="Modifier les informations du bien"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Modifier</span>
                </button>
              )}

              {onDeleteProperty && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  title="Supprimer ce bien immobilier"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer</span>
                </button>
              )}
            </div>
          )}

          <button
            onClick={handleShare}
            className="flex items-center space-x-1.5 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#2e2e2e] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <Share2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Partager</span>
          </button>

          <button
            onClick={() => onToggleFavorite(property.id)}
            className={`p-2 rounded-xl border transition cursor-pointer shadow-xs ${
              isFavorite
                ? 'bg-rose-500 text-white border-rose-500'
                : 'bg-white dark:bg-[#1e1e1e] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#2e2e2e] hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-white' : ''}`} />
          </button>
        </div>
      </div>

      {/* Already Taken Banner (Loué / Vendu) */}
      {isOccupied && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 rounded-2xl p-4 sm:p-5 flex items-start sm:items-center space-x-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                {property.status === 'loue' ? 'DÉJÀ LOUÉ' : 'DÉJÀ VENDU'}
              </span>
              <h3 className="text-sm sm:text-base font-black text-rose-900 dark:text-rose-100">
                Cette propriété n'est plus disponible
              </h3>
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
              Ce bien a déjà été conclu ({property.status === 'loue' ? 'bail de location signé' : 'vente conclue'}). Aucun nouveau client ne peut réserver ou louer ce bien actuellement.
            </p>
          </div>
        </div>
      )}

      {/* Main Image Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Main Big Photo */}
        <div className="lg:col-span-9 h-[420px] rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#181818] border border-slate-200 dark:border-[#2e2e2e] shadow-sm relative flex items-center justify-center">
          {property.images && property.images.length > 0 && property.images[selectedImageIndex] ? (
            <img
              src={property.images[selectedImageIndex]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-[#181818] text-[#717171]">
              <Building2 className="w-16 h-16 text-[#FF385C]/60 mb-2" />
              <span className="text-sm font-bold uppercase tracking-wider">{property.category} • Bukavu</span>
            </div>
          )}

          <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
            <span className="bg-[#FF385C] text-white text-xs font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider shadow-sm">
              {property.category}
            </span>
            <span className="bg-[#222222]/90 backdrop-blur-md text-white text-xs font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider">
              {property.type === 'vente' ? 'À VENDRE' : 'À LOUER'}
            </span>
          </div>
        </div>

        {/* Thumbnail Selector Column */}
        <div className="lg:col-span-3 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto max-h-[420px]">
          {(property.images || []).map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImageIndex(idx)}
              className={`relative h-24 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                selectedImageIndex === idx
                  ? 'border-[#FF385C] ring-2 ring-[#FF385C]/30'
                  : 'border-[#ebebeb] opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`Photo ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Title & Key Specs Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column Details */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-[#ebebeb] dark:border-[#2e2e2e] shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <button
                  onClick={() => onSelectNeighborhood?.(property.neighborhood)}
                  className="text-xs font-bold text-[#FF385C] bg-[#FF385C]/10 hover:bg-[#FF385C]/20 px-2.5 py-1 rounded-lg border border-[#FF385C]/20 uppercase tracking-wider transition cursor-pointer flex items-center space-x-1 inline-flex"
                  title={`Voir le quartier ${property.neighborhood} sur la carte interactive`}
                >
                  <MapPin className="w-3.5 h-3.5 text-[#FF385C]" />
                  <span>Quartier {property.neighborhood}, Bukavu</span>
                </button>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] dark:text-[#f7f7f7] mt-2 leading-tight">
                  {property.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#717171] dark:text-[#b0b0b0]">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-[#717171] shrink-0" />
                    <span>{property.address}</span>
                  </span>
                </div>
              </div>

              <div className="text-left lg:text-right">
                <p className="text-3xl font-extrabold text-[#222222] dark:text-[#f7f7f7]">
                  ${property.price?.toLocaleString()}
                </p>
                {property.type === 'location' && (
                  <p className="text-xs font-bold text-[#717171] dark:text-[#b0b0b0]">par mois</p>
                )}
              </div>
            </div>

            {/* Attributes Grid */}
            <div className="flex items-center justify-around gap-3 p-4 bg-[#f7f7f7] dark:bg-[#121212] rounded-xl border border-[#ebebeb] dark:border-[#2e2e2e] text-center">
              {property.category !== 'parcelle' && property.bedrooms !== undefined && (
                <div>
                  <Bed className="w-5 h-5 text-[#FF385C] mx-auto mb-1" />
                  <span className="block text-xs font-bold text-[#222222] dark:text-[#f7f7f7]">
                    {property.bedrooms} {property.type === 'vente' ? 'Pièces' : property.category === 'commercial' ? 'Bureaux' : 'Chambres'}
                  </span>
                </div>
              )}
              {property.category !== 'parcelle' && property.bathrooms !== undefined && (
                <div>
                  <Bath className="w-5 h-5 text-[#FF385C] mx-auto mb-1" />
                  <span className="block text-xs font-bold text-[#222222] dark:text-[#f7f7f7]">
                    {property.bathrooms} Salles de bain
                  </span>
                </div>
              )}
              {property.category === 'parcelle' && property.surface !== undefined && property.surface > 0 && (
                <div>
                  <Maximize2 className="w-5 h-5 text-[#FF385C] mx-auto mb-1" />
                  <span className="block text-xs font-bold text-[#222222] dark:text-[#f7f7f7]">
                    Superficie / Mesure : {property.surface} m²
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-[#fcfcfc] dark:bg-[#141414] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#2e2e2e]">
              <h3 className="text-sm font-bold text-[#222222] dark:text-[#f7f7f7] uppercase tracking-wider mb-2">
                Description Détaillée du Bien
              </h3>
              <p className="text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium">
                {property.description?.trim() || `Ce bien immobilier de catégorie ${property.category} est situé dans le quartier sécurisé de ${property.neighborhood}, Commune de ${property.commune} à Bukavu.`}
              </p>
            </div>

            {/* Features List */}
            <div>
              <h3 className="text-sm font-bold text-[#222222] dark:text-[#f7f7f7] uppercase tracking-wider mb-3">
                Équipements & Prestations
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(property.features || []).map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 bg-[#f7f7f7] dark:bg-[#121212] p-2.5 rounded-xl border border-[#ebebeb] dark:border-[#2e2e2e] text-xs font-semibold text-[#222222] dark:text-[#f7f7f7]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#FF385C] shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Location Map & Itinerary Guide */}
          <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-slate-200/80 dark:border-[#2e2e2e] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Localisation à Bukavu ({property.neighborhood})
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Visualisez l'environnement sur la carte OpenStreetMap
                </p>
              </div>

              <button
                onClick={calculateRouteFromCenter}
                className="bg-[#FF385C]/10 hover:bg-[#FF385C]/20 text-[#FF385C] border border-[#FF385C]/30 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
              >
                <Navigation className="w-4 h-4 text-[#FF385C]" />
                <span>Simuler l'Itinéraire</span>
              </button>
            </div>

            {routeInfo && (
              <div className="bg-[#FF385C]/10 border border-[#FF385C]/30 p-3 rounded-xl text-xs font-bold text-[#FF385C] flex items-center space-x-2 animate-in fade-in">
                <Navigation className="w-4 h-4 text-[#FF385C] shrink-0" />
                <span>{routeInfo}</span>
              </div>
            )}

            <PropertyMap
              properties={[property]}
              selectedProperty={property}
              height="320px"
            />
          </div>
        </div>

        {/* Right Column Agent Card */}
        <div className="lg:col-span-4 space-y-6 sticky top-20">
          <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-[#ebebeb] dark:border-[#2e2e2e] shadow-md space-y-5">
            <div className="flex items-center space-x-3 pb-4 border-b border-[#ebebeb] dark:border-[#2e2e2e]">
              <UserAvatar
                fullname={property.ownerName}
                role="agent"
                size="md"
              />
              <div>
                <span className="text-[10px] font-bold text-[#FF385C] bg-[#FF385C]/10 px-2 py-0.5 rounded uppercase">
                  Agent Certifié NyumbaLink
                </span>
                <h4 className="text-sm font-bold text-[#222222] dark:text-[#f7f7f7] mt-1">
                  {property.ownerName}
                </h4>
                <p className="text-xs text-[#717171] dark:text-[#b0b0b0]">+243986760178</p>
              </div>
            </div>

            {isOccupied ? (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-4 rounded-xl space-y-2 text-center">
                <div className="flex items-center justify-center space-x-1.5 text-rose-700 dark:text-rose-300 font-bold text-xs">
                  <Lock className="w-4 h-4 text-rose-600" />
                  <span>Bien Non Disponible</span>
                </div>
                <p className="text-[11px] text-rose-600 dark:text-rose-400">
                  Ce bien est déjà {property.status === 'loue' ? 'loué' : 'vendu'}. Les prises de contact et réservations sont suspendues pour les nouveaux clients.
                </p>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => onOpenContactModal(property)}
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 rounded-xl text-xs transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Contacter l'Agent</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1e1e1e] max-w-md w-full rounded-2xl p-6 border border-slate-200 dark:border-[#2e2e2e] shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Supprimer cette annonce ?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Êtes-vous sûr de vouloir supprimer définitivement le bien{' '}
                <strong className="text-slate-900 dark:text-white">"{property.title}"</strong> situé à{' '}
                <strong className="text-slate-900 dark:text-white">{property.neighborhood}, Bukavu</strong> ?
              </p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                Cette action est irréversible et retirera le bien de la carte et du catalogue.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#282828] dark:hover:bg-[#333] text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  if (onDeleteProperty) {
                    onDeleteProperty(property.id);
                  }
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmer la suppression</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Related Properties */}
      {relatedProperties.length > 0 && (
        <section className="pt-8 border-t border-slate-200 dark:border-white/10 space-y-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Autres biens similaires à {property.neighborhood}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProperties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                isFavorite={isFavorite}
                onToggleFavorite={onToggleFavorite}
                onSelectProperty={onSelectProperty}
                onOpenContactModal={onOpenContactModal}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};