import React, { useState } from 'react';
import {
  Heart,
  Bed,
  Bath,
  Maximize2,
  MapPin,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Zap,
  Share2,
  Building2,
  AlertOctagon,
  Lock,
  MessageSquare,
  Send,
  X
} from 'lucide-react';
import { Property, UserProfile } from '../types';

interface PropertyCardProps {
  property: Property;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  onOpenContactModal: (property: Property, recipient?: { name: string; email?: string; userId?: string; phone?: string }) => void;
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

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [activeRecipient, setActiveRecipient] = useState<{ name: string; email?: string; phone?: string } | null>(null);
  
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [clientMessage, setClientMessage] = useState(
    `Bonjour, je souhaite poser une demande / fixer un RDV concernant votre bien "${property.title}" situé à ${property.neighborhood}, Bukavu.`
  );
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const handleOpenCardContact = () => {
    const ownerInfo = {
      name: property.ownerName || 'Propriétaire',
      email: property.ownerEmail || '',
      phone: property.ownerPhone || '+243999999999'
    };
    setActiveRecipient(ownerInfo);
    setContactModalOpen(true);
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

  const handleWhatsAppRedirect = () => {
    const phoneNumber = activeRecipient?.phone || property.ownerPhone || '+243999999999';
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    const encodedMessage = encodeURIComponent(clientMessage);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

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
    <>
      <article
        id={`property-card-${property.id}`}
        className={`group bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200/90 dark:border-[#2a2a2a] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden relative ${
          isOccupied ? 'opacity-90' : ''
        }`}
      >
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

          {isOccupied && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-15">
              <div className="bg-rose-600/95 text-white px-3.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>{property.status === 'loue' ? 'Déjà Loué' : 'Déjà Vendu'}</span>
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70" />

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

            {onDeleteProperty && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("Voulez-vous vraiment supprimer ce bien ?")) {
                    onDeleteProperty(property.id);
                  }
                }}
                className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 hover:bg-rose-500 hover:text-white text-slate-800 dark:text-white shadow-sm backdrop-blur-sm flex items-center justify-center transition-all cursor-pointer"
                title="Supprimer l'annonce"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

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

        <div className="p-4 sm:p-5 flex-1 min-w-0 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
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
                className="max-w-full text-[11px] font-medium text-[#FF385C] bg-[#FF385C]/10 hover:bg-[#FF385C]/15 border border-[#FF385C]/20 px-2.5 py-0.5 rounded-full flex items-center space-x-1 transition cursor-pointer min-w-0"
                title={`Filtrer par quartier ${property.neighborhood}`}
              >
                <MapPin className="w-3 h-3 text-[#FF385C]" />
                <span className="truncate">{property.neighborhood}</span>
              </button>
            </div>

            <h3
              onClick={() => onSelectProperty(property)}
              className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#FF385C] transition line-clamp-2 cursor-pointer leading-snug tracking-tight"
            >
              {property.title}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center space-x-1 truncate font-medium">
              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="truncate">
                {property.address || `${property.neighborhood}, ${property.commune}, Bukavu`}
              </span>
            </p>

            {property.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed pt-0.5">
                {property.description}
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-[#282828] flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
              {property.bedrooms !== undefined && property.category !== 'parcelle' && (
                <div
                  className="flex items-center space-x-1"
                  title={`${property.bedrooms} ${property.bedrooms > 1 ? 'chambres' : 'chambre'}`}
                >
                  <Bed className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span>
                    {property.bedrooms} {property.bedrooms > 1 ? 'chambres' : 'chambre'}
                  </span>
                </div>
              )}

              {(property as any).livingRooms !== undefined && property.category !== 'parcelle' && (
                <div
                  className="flex items-center space-x-1"
                  title={`${(property as any).livingRooms} ${(property as any).livingRooms > 1 ? 'salons' : 'salon'}`}
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span>
                    {(property as any).livingRooms} {(property as any).livingRooms > 1 ? 'salons' : 'salon'}
                  </span>
                </div>
              )}

              {property.kitchens !== undefined && property.category !== 'parcelle' && (
                <div
                  className="flex items-center space-x-1"
                  title={`${property.kitchens} ${property.kitchens > 1 ? 'cuisines' : 'cuisine'}`}
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span>
                    {property.kitchens} {property.kitchens > 1 ? 'cuisines' : 'cuisine'}
                  </span>
                </div>
              )}

              {property.bathrooms !== undefined && property.category !== 'parcelle' && (
                <div
                  className="flex items-center space-x-1"
                  title={`${property.bathrooms} ${property.bathrooms > 1 ? 'toilettes' : 'toilette'}`}
                >
                  <Bath className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span>
                    {property.bathrooms} {property.bathrooms > 1 ? 'toilettes' : 'toilette'}
                  </span>
                </div>
              )}

              {property.category === 'parcelle' && property.surface !== undefined && property.surface > 0 && (
                <div className="flex items-center space-x-1" title={`Superficie ${property.surface} m²`}>
                  <Maximize2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span>{property.surface} m²</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 ml-auto">
              {!isOccupied && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCardContact();
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#FF385C] hover:bg-[#FF385C]/10 transition cursor-pointer"
                >
                  Contact
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

      {/* MODALE DE DEMANDE / RDV / CONTACT */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1e1e1e] max-w-md w-full rounded-3xl p-6 border border-slate-200 dark:border-[#2e2e2e] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Laissez une demande / RDV
                  </h3>
                  {activeRecipient && (
                    <p className="text-[11px] text-[#FF385C] font-semibold">
                      Destinataire : {activeRecipient.name}
                    </p>
                  )}
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
                    Numéro whatsApp <span className="text-[10px] font-normal text-slate-400">(optionnel)</span>
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

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Votre message (prédéfini ou personnalisable)
                  </label>
                  <textarea
                    rows={3}
                    value={clientMessage}
                    onChange={(e) => setClientMessage(e.target.value)}
                    required
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#FF385C] outline-none resize-none"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full py-3 bg-[#FF385C] hover:bg-[#FF385C]/90 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? 'Envoi en cours...' : 'Envoyer la demande / RDV'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsAppRedirect}
                    className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Contacter via WhatsApp</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};