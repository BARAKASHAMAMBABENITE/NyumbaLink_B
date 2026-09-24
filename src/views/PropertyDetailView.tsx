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
  CheckCircle2,
  Navigation,
  Building2,
  Calendar,
  Edit3,
  Trash2,
  AlertOctagon,
  Lock,
  X
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
  onOpenContactModal: (property: Property, recipient?: { name: string; email?: string; userId?: string; phone?: string }) => void;
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
  const [routeUrl, setRouteUrl] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // État unique pour la modale de contact / demande / RDV avec la programmation de visite
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [clientMessage, setClientMessage] = useState(
    `Bonjour, je souhaite poser une demande / fixer un RDV concernant votre bien "${property.title}" situé à ${property.neighborhood}.`
  );
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

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

  const handleOpenOwnerContact = () => {
    setContactModalOpen(true);
  };

  const handleWhatsAppRedirect = () => {
    const ownerPhone = property.ownerPhone || '+243986760178';
    const cleanPhone = ownerPhone.replace(/[^0-9+]/g, '');
    let fullMessage = clientMessage;
    if (visitDate && visitTime) {
      fullMessage += ` [Souhaite programmer une visite le ${visitDate} à ${visitTime}]`;
    }
    const encodedMessage = encodeURIComponent(fullMessage);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        setContactModalOpen(false);
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const calculateRouteFromCenter = () => {
    if (!navigator.geolocation) {
      setRouteInfo('La localisation GPS n’est pas disponible sur cet appareil.');
      setRouteUrl(null);
      return;
    }

    setRouteInfo('Recherche de votre position GPS...');
    setRouteUrl(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat1 = coords.latitude;
        const lon1 = coords.longitude;
        const lat2 = property.latitude;
        const lon2 = property.longitude;
        const earthRadiusKm = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const distanceKm = earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceDisplay = distanceKm.toFixed(1);
        const estimatedMinutes = Math.max(1, Math.round(distanceKm * 4 + 5));

        setRouteInfo(
          `Depuis votre position : environ ${distanceDisplay} km du bien (${estimatedMinutes} min en véhicule).`
        );
        setRouteUrl(
          `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${lat1},${lon1}`)}&destination=${encodeURIComponent(`${lat2},${lon2}`)}&travelmode=driving`
        );
      },
      () => {
        setRouteInfo('Autorisez la localisation GPS pour calculer l’itinéraire depuis votre position.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
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

        <div className="hidden sm:flex items-center space-x-2">
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

      {/* Already Taken Banner */}
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
      <div className="w-full h-[420px] rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#181818] border border-slate-200 dark:border-[#2e2e2e] shadow-sm relative flex items-center justify-center">
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

      {/* Mobile action bar */}
      <div className="flex sm:hidden items-center justify-between bg-white dark:bg-[#1e1e1e] p-3 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] shadow-xs">
        <div className="flex items-center space-x-2">
          {canManageProperty && (
            <>
              {onOpenEditModal && (
                <button
                  onClick={() => onOpenEditModal(property)}
                  className="p-2 bg-[#FF385C] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  title="Modifier"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              {onDeleteProperty && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
          <button
            onClick={handleShare}
            className="p-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-[#2e2e2e] text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer"
            title="Partager"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => onToggleFavorite(property.id)}
          className={`p-2 rounded-xl border transition cursor-pointer ${
            isFavorite
              ? 'bg-rose-500 text-white border-rose-500'
              : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#2e2e2e]'
          }`}
          title="Favoris"
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-white' : ''}`} />
        </button>
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#f7f7f7] dark:bg-[#121212] rounded-xl border border-[#ebebeb] dark:border-[#2e2e2e]">
              {property.category !== 'parcelle' && property.bedrooms !== undefined && property.bedrooms !== null && (
                <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-white dark:bg-[#181818] border border-slate-200/60 dark:border-[#282828]">
                  <Bed className="w-5 h-5 text-[#FF385C] shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Chambres</span>
                    <span className="text-xs font-bold text-[#222222] dark:text-[#f7f7f7]">
                      {property.bedrooms} {property.bedrooms > 1 ? 'chambres' : 'chambre'}
                    </span>
                  </div>
                </div>
              )}

              {property.category !== 'parcelle' && (property as any).livingRooms !== undefined && (property as any).livingRooms !== null && (
                <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-white dark:bg-[#181818] border border-slate-200/60 dark:border-[#282828]">
                  <Building2 className="w-5 h-5 text-[#FF385C] shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Salons</span>
                    <span className="text-xs font-bold text-[#222222] dark:text-[#f7f7f7]">
                      {(property as any).livingRooms} {(property as any).livingRooms > 1 ? 'salons' : 'salon'}
                    </span>
                  </div>
                </div>
              )}

              {property.category !== 'parcelle' && property.kitchens !== undefined && property.kitchens !== null && (
                <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-white dark:bg-[#181818] border border-slate-200/60 dark:border-[#282828]">
                  <Building2 className="w-5 h-5 text-[#FF385C] shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Cuisines</span>
                    <span className="text-xs font-bold text-[#222222] dark:text-[#f7f7f7]">
                      {property.kitchens} {property.kitchens > 1 ? 'cuisines' : 'cuisine'}
                    </span>
                  </div>
                </div>
              )}

              {property.category !== 'parcelle' && (property.bathrooms !== undefined && property.bathrooms !== null || (property as any).toilets !== undefined && (property as any).toilets !== null) && (
                <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-white dark:bg-[#181818] border border-slate-200/60 dark:border-[#282828]">
                  <Bath className="w-5 h-5 text-[#FF385C] shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Toilettes / SdB</span>
                    <span className="text-xs font-bold text-[#222222] dark:text-[#f7f7f7]">
                      {(property.bathrooms ?? 0) + ((property as any).toilets ?? 0)} {(property.bathrooms ?? 0) + ((property as any).toilets ?? 0) > 1 ? 'toilettes' : 'toilette'}
                    </span>
                  </div>
                </div>
              )}

              {property.category === 'parcelle' && property.surface !== undefined && property.surface > 0 && (
                <div className="col-span-2 sm:col-span-4 flex items-center space-x-2.5 p-3 rounded-xl bg-white dark:bg-[#181818] border border-slate-200/60 dark:border-[#282828]">
                  <Maximize2 className="w-5 h-5 text-[#FF385C] shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Superficie</span>
                    <span className="text-xs font-bold text-[#222222] dark:text-[#f7f7f7]">
                      {property.surface} m²
                    </span>
                  </div>
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
              <div className="bg-[#FF385C]/10 border border-[#FF385C]/30 p-3 rounded-xl text-xs font-bold text-[#FF385C] flex flex-wrap items-center gap-2 animate-in fade-in">
                <Navigation className="w-4 h-4 text-[#FF385C] shrink-0" />
                <span className="flex-1 min-w-[180px]">{routeInfo}</span>
                {routeUrl && (
                  <a
                    href={routeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 bg-[#FF385C] text-white px-3 py-1.5 rounded-lg hover:bg-[#E00B41] transition"
                  >
                    Ouvrir l’itinéraire
                  </a>
                )}
              </div>
            )}

            <PropertyMap
              properties={[property]}
              selectedProperty={property}
              height="320px"
            />
          </div>

          {/* Related Properties Section using PropertyCard */}
          {relatedProperties.length > 0 && (
            <div className="space-y-4 pt-4">
              <h3 className="text-base font-extrabold text-[#222222] dark:text-white">
                Biens similaires dans le quartier {property.neighborhood}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedProperties.map((relProp) => (
                  <PropertyCard
                    key={relProp.id}
                    property={relProp}
                    isFavorite={false}
                    onToggleFavorite={onToggleFavorite}
                    onSelect={onSelectProperty}
                    user={user}
                  />
                ))}
              </div>
            </div>
          )}
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
                <p className="text-xs text-[#717171] dark:text-[#b0b0b0]">{property.ownerPhone || '+243986760178'}</p>
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
                  onClick={handleOpenOwnerContact}
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 rounded-xl text-xs transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Contacter l'Agent / Propriétaire</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALE UNIQUE DE CONTACT AVEC PROGRAMMATION DE VISITE */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1e1e1e] max-w-md w-full rounded-3xl p-6 border border-slate-200 dark:border-[#2e2e2e] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Contact & Programmation de Visite
                  </h3>
                  <p className="text-[11px] text-[#FF385C] font-semibold">
                    Destinataire : {property.ownerName || 'Propriétaire'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {sendSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-900 dark:text-white">Demande / RDV envoyé avec succès !</p>
                <p className="text-xs text-slate-500">Nous vous contacterons rapidement.</p>
              </div>
            ) : (
              <form onSubmit={handleSendRequest} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Entrez votre nom complet"
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#FF385C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Numéro WhatsApp <span className="text-[10px] font-normal text-slate-400">(optionnel)</span>
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Ex: +243..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#FF385C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Email <span className="text-[10px] font-normal text-slate-400">(optionnel)</span>
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="Ex: exemple@domaine.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#FF385C]"
                  />
                </div>

                {/* Section Programmer une visite */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <Calendar className="w-3.5 h-3.5 text-[#FF385C]" />
                    <span>Programmer une visite (optionnel)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">Date souhaitée</label>
                      <input
                        type="date"
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#FF385C]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">Heure souhaitée</label>
                      <input
                        type="time"
                        value={visitTime}
                        onChange={(e) => setVisitTime(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#FF385C]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Message
                  </label>
                  <textarea
                    rows={3}
                    value={clientMessage}
                    onChange={(e) => setClientMessage(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#FF385C]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleWhatsAppRedirect}
                    className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="flex-1 bg-[#FF385C] hover:opacity-95 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {isSending ? 'Envoi...' : 'Envoyer la demande'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};