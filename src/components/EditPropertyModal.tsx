import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  Building2,
  DollarSign,
  Loader2,
  Compass,
  Camera,
  UploadCloud,
  AlertTriangle,
  Upload,
  Edit3,
  ShieldAlert
} from 'lucide-react';
import { Property, PropertyCategory, TransactionType, UserProfile, BukavuCommune, PropertyStatus } from '../types';
import { BUKAVU_COMMUNES_WITH_NEIGHBORHOODS, BUKAVU_NEIGHBORHOOD_COORDINATES, BUKAVU_COMMUNE_CENTERS } from '../data/initialProperties';
import { PropertyMap } from './PropertyMap';
import { uploadImageToCloudinary } from '../services/cloudinaryService';
import { validatePropertyImageWithAI } from '../services/imageValidationService';

interface EditPropertyModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProperty: (id: string, updates: Partial<Property>) => Promise<void>;
  user: UserProfile | null;
}

export const EditPropertyModal: React.FC<EditPropertyModalProps> = ({
  property,
  isOpen,
  onClose,
  onUpdateProperty,
  user
}) => {
  if (!isOpen || !property) return null;

  const [title, setTitle] = useState(property.title);
  const [description, setDescription] = useState(property.description);
  const [price, setPrice] = useState<number | ''>(property.price);
  const [pricePeriod, setPricePeriod] = useState<'total' | 'mois'>(property.pricePeriod || 'mois');
  const [type, setType] = useState(property.type);
  const [status, setStatus] = useState(property.status || 'disponible');
  const [category, setCategory] = useState(property.category);
  const [commune, setCommune] = useState<BukavuCommune>(property.commune || 'Ibanda');
  const [neighborhood, setNeighborhood] = useState(property.neighborhood || BUKAVU_COMMUNES_WITH_NEIGHBORHOODS['Ibanda'][0]);
  const [parcelDimensions, setParcelDimensions] = useState(
    property.surface ? `${property.surface} m²` : '20m x 25m (500 m²)'
  );
  const [address, setAddress] = useState(property.address);
  const [latitude, setLatitude] = useState(property.latitude || -2.5080);
  const [longitude, setLongitude] = useState(property.longitude || 28.8600);
  const [surface, setSurface] = useState<number | ''>(property.surface || '');
  const [livingRooms, setLivingRooms] = useState<number | ''>(property.livingRooms ?? '');
  const [bedrooms, setBedrooms] = useState<number | ''>(property.bedrooms ?? '');
  const [bathrooms, setBathrooms] = useState<number | ''>(property.bathrooms ?? '');
  const [kitchens, setKitchens] = useState<number | ''>(property.kitchens ?? '');
  const [toilets, setToilets] = useState<number | ''>(property.toilets ?? '');
  const [features, setFeatures] = useState<string[]>(property.features || []);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [images, setImages] = useState<string[]>(property.images || []);

  useEffect(() => {
    if (property) {
      setTitle(property.title);
      setDescription(property.description);
      setPrice(property.price);
      setPricePeriod(property.pricePeriod || 'mois');
      setType(property.type);
      setStatus(property.status || 'disponible');
      setCategory(property.category);
      const propertyCommune = property.commune || 'Ibanda';
      setCommune(propertyCommune);
      const validQuartiers = BUKAVU_COMMUNES_WITH_NEIGHBORHOODS[propertyCommune] || [];
      const validQuartier = validQuartiers.includes(property.neighborhood) ? property.neighborhood : validQuartiers[0] || 'Nguba';
      setNeighborhood(validQuartier);
      setParcelDimensions(property.surface ? `${property.surface} m²` : '20m x 25m (500 m²)');
      setAddress(property.address);
      setLatitude(property.latitude || -2.5080);
      setLongitude(property.longitude || 28.8600);
      setSurface(property.surface || '');
      setLivingRooms(property.livingRooms ?? '');
      setBedrooms(property.bedrooms ?? '');
      setBathrooms(property.bathrooms ?? '');
      setKitchens(property.kitchens ?? '');
      setToilets(property.toilets ?? '');
      setFeatures(property.features || []);
      setImages(property.images || []);
    }
  }, [property]);

  // Image Upload & AI Validation State
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'validating' | 'uploading' | 'error' | 'success'>('idle');
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageSuccessMsg, setImageSuccessMsg] = useState<string | null>(null);
  const [pendingRejectedFiles, setPendingRejectedFiles] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);

  const currentNeighborhoods = BUKAVU_COMMUNES_WITH_NEIGHBORHOODS[commune] || [];

  const handleCommuneChange = (newCommune: BukavuCommune) => {
    setCommune(newCommune);
    const firstQuartier = BUKAVU_COMMUNES_WITH_NEIGHBORHOODS[newCommune]?.[0] || 'Nguba';
    setNeighborhood(firstQuartier);
    setAddress(`Quartier ${firstQuartier}, Commune de ${newCommune}, Bukavu`);
    const coords = BUKAVU_NEIGHBORHOOD_COORDINATES[firstQuartier] || BUKAVU_COMMUNE_CENTERS[newCommune] || [-2.5080, 28.8600];
    setLatitude(coords[0]);
    setLongitude(coords[1]);
  };

  const handleNeighborhoodChange = (newNeighborhood: string) => {
    setNeighborhood(newNeighborhood);
    setAddress(`Quartier ${newNeighborhood}, Commune de ${commune}, Bukavu`);
    const coords = BUKAVU_NEIGHBORHOOD_COORDINATES[newNeighborhood] || BUKAVU_COMMUNE_CENTERS[commune] || [-2.5080, 28.8600];
    setLatitude(coords[0]);
    setLongitude(coords[1]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setImageError(null);
    setImageSuccessMsg(null);
    setUploadStatus('validating');

    let acceptedCount = 0;
    let rejectedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        setUploadStatus('validating');
        const validation = await validatePropertyImageWithAI(file);

        if (!validation.isRealEstate) {
          rejectedCount++;
          setImageError(
            validation.reason ||
              "Photo refusée : Cette image ne représente pas un bien immobilier (maison, appartement, pièce ou parcelle)."
          );
          setUploadStatus('error');
          continue;
        }

        setUploadStatus('uploading');
        const cloudinaryRes = await uploadImageToCloudinary(file);
        if (cloudinaryRes?.url) {
          setImages((prev) => [...prev, cloudinaryRes.url]);
          acceptedCount++;
        } else {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) {
              setImages((prev) => [...prev, reader.result as string]);
            }
          };
          reader.readAsDataURL(file);
          acceptedCount++;
        }
      } catch (err) {
        console.error('Error uploading image:', err);
      }
    }

    setPendingRejectedFiles([]);
    setUploadingImage(false);
    if (acceptedCount > 0 && rejectedCount === 0) {
      setImageSuccessMsg(
        acceptedCount > 1
          ? `${acceptedCount} photos immobilières acceptées avec succès !`
          : `1 photo immobilière acceptée avec succès !`
      );
      setUploadStatus('success');
    } else if (acceptedCount > 0 && rejectedCount > 0) {
      const acceptedTxt = acceptedCount > 1 ? `${acceptedCount} photos acceptées` : `1 photo acceptée`;
      const rejectedTxt = rejectedCount > 1 ? `${rejectedCount} rejetées` : `1 rejetée`;
      setImageSuccessMsg(`${acceptedTxt} (${rejectedTxt}).`);
      setUploadStatus('idle');
    } else if (rejectedCount > 0 && acceptedCount === 0) {
      setUploadStatus('error');
    } else {
      setUploadStatus('idle');
    }

    if (e.target) e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const availableFeatures = [
    'Vue Panoramique Lac Kivu',
    'Eau 24h/24 (Regideso + Tank)',
    'Électricité (SNEL + Panneaux/Groupe)',
    'Clôturé & Sécurisé',
    'Garage / Parking',
    'Jardin',
    'Accès Véhicule Facile'
  ];

  const handleToggleFeature = (feat: string) => {
    setFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price) return;

    const validCommunes: BukavuCommune[] = ['Ibanda', 'Kadutu', 'Bagira'];
    if (!validCommunes.includes(commune)) {
      setImageError("Le bien immobilier doit obligatoirement être situé dans l'une des 3 communes de Bukavu (Ibanda, Kadutu ou Bagira).");
      setUploadStatus('error');
      return;
    }

    const finalNeighborhood = (neighborhood || '').trim();
    if (!finalNeighborhood) {
      setImageError("Veuillez sélectionner un quartier officiel de Bukavu.");
      setUploadStatus('error');
      return;
    }

    if (images.length === 0) {
      setImageError("Veuillez conserver ou ajouter au moins une photo valide du bien immobilier.");
      setUploadStatus('error');
      return;
    }

    setSubmitting(true);

    try {
      await onUpdateProperty(property.id, {
        title,
        description,
        price: Number(price),
        pricePeriod: (type === 'vente' || category === 'parcelle') ? 'total' : pricePeriod,
        type: category === 'parcelle' ? 'vente' : type,
        status,
        category,
        commune,
        address: address || `Quartier ${finalNeighborhood}, Commune de ${commune}, Bukavu`,
        neighborhood: finalNeighborhood,
        latitude,
        longitude,
        surface: category === 'parcelle' ? (surface ? Number(surface) : 500) : undefined,
        livingRooms: category === 'parcelle' ? undefined : (livingRooms !== '' ? Number(livingRooms) : undefined),
        bedrooms: category === 'parcelle' ? undefined : (bedrooms !== '' ? Number(bedrooms) : undefined),
        bathrooms: category === 'parcelle' ? undefined : (bathrooms !== '' ? Number(bathrooms) : undefined),
        kitchens: category === 'parcelle' ? undefined : (kitchens !== '' ? Number(kitchens) : undefined),
        toilets: category === 'parcelle' ? undefined : (toilets !== '' ? Number(toilets) : undefined),
        features: category === 'parcelle' ? [] : features,
        images: images.length > 0 ? images : property.images
      });

      onClose();
    } catch (err) {
      alert("Erreur lors de la modification de l'annonce.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#181818] w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-[#2e2e2e] p-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2e2e2e] mb-5">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Modifier le bien
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mettez à jour les informations du bien
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
              Titre de l'Annonce
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#181818] outline-hidden"
            />
          </div>

          {/* Type & Category & Status & Commune & Neighborhood */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#f7f7f7] uppercase tracking-wider mb-1">
                Transaction
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const newType = e.target.value as TransactionType;
                  setType(newType);
                  if (newType === 'vente' || category === 'parcelle') {
                    setPricePeriod('total');
                  } else {
                    setPricePeriod('mois');
                  }
                }}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-800 dark:text-[#f7f7f7]"
              >
                <option value="location">À Louer</option>
                <option value="vente">À Vendre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#f7f7f7] uppercase tracking-wider mb-1">
                Disponibilité / Statut
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PropertyStatus)}
                className={`w-full px-3 py-2.5 border rounded-xl text-xs font-bold ${
                  status === 'disponible'
                    ? 'bg-slate-100 dark:bg-[#252525] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 text-rose-700 dark:text-rose-300'
                }`}
              >
                <option value="disponible">✅ Disponible (En ligne)</option>
                <option value="loue">🔴 Déjà Loué (Indisponible)</option>
                <option value="vendu">🔴 Déjà Vendu (Indisponible)</option>
                <option value="en_attente">⏳ En attente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#f7f7f7] uppercase tracking-wider mb-1">
                Catégorie
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const newCat = e.target.value as PropertyCategory;
                  setCategory(newCat);
                  if (newCat === 'parcelle') {
                    setType('vente');
                    setPricePeriod('total');
                  }
                }}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-800 dark:text-[#f7f7f7]"
              >
                <option value="maison">Maison</option>
                <option value="parcelle">Parcelle</option>
                <option value="appartement">Appartement</option>
                <option value="villa">Villa</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#f7f7f7] uppercase tracking-wider mb-1 flex items-center">
                <Compass className="w-3.5 h-3.5 text-[#FF385C] mr-1" />
                Commune
              </label>
              <select
                value={commune}
                onChange={(e) => handleCommuneChange(e.target.value as BukavuCommune)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-800 dark:text-[#f7f7f7]"
              >
                <option value="Ibanda">Ibanda</option>
                <option value="Kadutu">Kadutu</option>
                <option value="Bagira">Bagira</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#f7f7f7] uppercase tracking-wider mb-1">
                Quartier (Bukavu)
              </label>
              <select
                value={neighborhood}
                onChange={(e) => handleNeighborhoodChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-800 dark:text-[#f7f7f7] outline-hidden"
              >
                {currentNeighborhoods.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price & Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#f7f7f7] uppercase tracking-wider mb-1">
                {type === 'vente' || category === 'parcelle'
                  ? 'Prix de Vente ($ USD)'
                  : 'Prix du Loyer ($ USD / mois)'}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  required
                  placeholder={type === 'vente' || category === 'parcelle' ? 'Ex: 25000' : 'Ex: 250'}
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value ? Number(e.target.value) : '')
                  }
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-sm font-extrabold text-slate-900 dark:text-white outline-hidden"
                />
                {type === 'location' && category !== 'parcelle' ? (
                  <span className="px-3.5 py-2.5 bg-slate-100 dark:bg-[#222] border border-slate-200 dark:border-[#333] rounded-xl text-xs font-bold text-slate-700 dark:text-[#f7f7f7] whitespace-nowrap">
                    $ / mois
                  </span>
                ) : (
                  <span className="px-3.5 py-2.5 bg-slate-100 dark:bg-[#222] border border-slate-200 dark:border-[#333] rounded-xl text-xs font-bold text-slate-700 dark:text-[#f7f7f7] whitespace-nowrap">
                    $ USD
                  </span>
                )}
              </div>
            </div>

            {category === 'parcelle' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#f7f7f7] uppercase tracking-wider mb-1">
                  Mesure / Dimensions de la parcelle
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 20m x 25m (500 m²)"
                  value={parcelDimensions}
                  onChange={(e) => {
                    setParcelDimensions(e.target.value);
                    const match = e.target.value.match(/(\d+)\s*m²/);
                    if (match) {
                      setSurface(Number(match[1]));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-[#f7f7f7] outline-hidden"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#f7f7f7] uppercase tracking-wider mb-1">
                    Salons
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 1"
                    value={livingRooms}
                    onChange={(e) => setLivingRooms(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-800 dark:text-[#f7f7f7] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#f7f7f7] uppercase tracking-wider mb-1">
                    Chambres
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 3"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-800 dark:text-[#f7f7f7] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#f7f7f7] uppercase tracking-wider mb-1">
                    Cuisines
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 1"
                    value={kitchens}
                    onChange={(e) => setKitchens(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-800 dark:text-[#f7f7f7] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#f7f7f7] uppercase tracking-wider mb-1">
                    S. de bains
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 1"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-800 dark:text-[#f7f7f7] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#f7f7f7] uppercase tracking-wider mb-1">
                    Toilettes
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 2"
                    value={toilets}
                    onChange={(e) => setToilets(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-800 dark:text-[#f7f7f7] outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Address & GPS Location Picker Map */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-[#f7f7f7] uppercase tracking-wider">
                Adresse & Position GPS (Bukavu)
              </label>
              <span className="text-[11px] text-[#FF385C] font-semibold flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                Lat: {latitude.toFixed(4)}, Lon: {longitude.toFixed(4)}
              </span>
            </div>

            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold mb-2"
            />

            <p className="text-[11px] text-slate-500 mb-2">
              📍 Cliquez sur la carte ci-dessous pour repositionner le marqueur de la propriété :
            </p>

            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-[#2e2e2e]">
              <PropertyMap
                properties={[]}
                pickerMode={true}
                centerCoordinates={[latitude, longitude]}
                height="220px"
                onPickCoordinates={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
              />
            </div>
          </div>

          {/* Description textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-[#f7f7f7] uppercase tracking-wider mb-1">
              Description Détaillée
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-medium text-slate-800 dark:text-[#f7f7f7]"
            />
          </div>

          {/* Feature Checkboxes (Hidden for Parcelle) */}
          {category !== 'parcelle' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#f7f7f7] uppercase tracking-wider mb-2">
                Équipements & Atouts
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableFeatures.map((feat) => {
                  const checked = features.includes(feat);
                  return (
                    <button
                      key={feat}
                      type="button"
                      onClick={() => handleToggleFeature(feat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-left border transition flex items-center space-x-2 ${
                        checked
                          ? 'bg-[#FF385C]/15 text-[#FF385C] border-[#FF385C]'
                          : 'bg-slate-50 dark:bg-[#121212] text-slate-600 dark:text-[#f7f7f7] border-slate-200 dark:border-[#2e2e2e] hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          checked ? 'bg-[#FF385C] border-[#FF385C] text-white' : 'border-slate-300 dark:border-[#2e2e2e]'
                        }`}
                      >
                        {checked && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <span>{feat}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Image Management */}
          <div className="bg-slate-50/80 dark:bg-[#121212] p-4 rounded-2xl border border-slate-200/80 dark:border-[#2e2e2e] space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-[#f7f7f7] uppercase tracking-wider">
                Photos de la Propriété ({images.length})
              </label>
            </div>

            {imageError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl space-y-2 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in">
                <div className="flex items-start space-x-2.5">
                  <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
                  <div className="flex-1">
                    <span className="font-bold block">Avis de vérification visuelle :</span>
                    <span className="font-medium text-[11px] leading-relaxed">{imageError}</span>
                  </div>
                </div>
              </div>
            )}

            {imageSuccessMsg && !imageError && (
              <div className="p-2.5 bg-slate-100 dark:bg-[#252525] border border-slate-200 dark:border-[#383838] rounded-xl flex items-center space-x-2 text-slate-800 dark:text-slate-200 text-xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#FF385C]" />
                <span className="font-semibold text-[11px]">{imageSuccessMsg}</span>
              </div>
            )}

            <input
              type="file"
              ref={galleryInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              multiple
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploadingImage}
                className="border-2 border-dashed border-[#FF385C]/40 hover:border-[#FF385C] bg-[#FF385C]/5 hover:bg-[#FF385C]/10 p-3 rounded-xl transition flex flex-col items-center justify-center text-center cursor-pointer min-h-[80px]"
              >
                <UploadCloud className="w-5 h-5 text-[#FF385C] mb-1" />
                <span className="text-xs font-bold text-[#FF385C]">
                  Ajouter des Photos (Galerie)
                </span>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploadingImage}
                className="border-2 border-dashed border-slate-300 dark:border-[#2e2e2e] hover:border-slate-400 bg-white dark:bg-[#1e1e1e] p-3 rounded-xl transition flex flex-col items-center justify-center text-center cursor-pointer min-h-[80px]"
              >
                <Camera className="w-5 h-5 text-slate-600 dark:text-[#f7f7f7] mb-1" />
                <span className="text-xs font-bold text-slate-700 dark:text-[#f7f7f7]">
                  Prendre une photo
                </span>
              </button>
            </div>

            {uploadingImage && (
              <div className="p-3 bg-[#FF385C]/10 border border-[#FF385C]/30 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-[#FF385C]">
                  <span className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#FF385C]" />
                    <span>{uploadStatus === 'validating' ? 'Optimisation et validation de la photo...' : 'Téléversement de la photo...'}</span>
                  </span>
                </div>
              </div>
            )}

            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                {images.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-[#2e2e2e] group bg-slate-100 dark:bg-[#1e1e1e]"
                  >
                    <img
                      src={url}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full shadow-md opacity-90 hover:opacity-100 transition cursor-pointer"
                      title="Supprimer la photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-[#2e2e2e]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="px-5 py-2.5 rounded-xl bg-[#FF385C] hover:bg-[#e03150] text-white text-xs font-bold shadow-lg shadow-[#FF385C]/20 transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};