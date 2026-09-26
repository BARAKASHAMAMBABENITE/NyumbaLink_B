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
import PropertyMap from './PropertyMap';
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

  const [title, setTitle] = useState(property.title || '');
  const [description, setDescription] = useState(property.description || '');
  const [price, setPrice] = useState<number | ''>(property.price ?? '');
  const [pricePeriod, setPricePeriod] = useState<'total' | 'mois'>(property.pricePeriod || 'mois');
  const [type, setType] = useState<TransactionType>(property.type || 'location');
  const [status, setStatus] = useState<PropertyStatus>(property.status || 'disponible');
  const [category, setCategory] = useState<PropertyCategory>(property.category || 'maison');
  const [commune, setCommune] = useState<BukavuCommune>(property.commune || 'Ibanda');
  
  const [neighborhood, setNeighborhood] = useState(property.neighborhood || BUKAVU_COMMUNES_WITH_NEIGHBORHOODS['Ibanda'][0]);
  const [customNeighborhood, setCustomNeighborhood] = useState('');
  const [isCustomNeighborhood, setIsCustomNeighborhood] = useState(false);

  const [avenue, setAvenue] = useState('');
  const [customAvenue, setCustomAvenue] = useState('');
  const [isCustomAvenue, setIsCustomAvenue] = useState(false);

  const [parcelDimensions, setParcelDimensions] = useState(property.surface ? String(property.surface) : '20m x 25m');
  const [address, setAddress] = useState(property.address || '');

  const [ownerName, setOwnerName] = useState(property.ownerName || '');
  const [ownerEmail, setOwnerEmail] = useState(property.ownerEmail || '');
  const [ownerPhone, setOwnerPhone] = useState(property.ownerPhone || '');
  const [ownerPhoneSecondary, setOwnerPhoneSecondary] = useState('');

  const [visitAndCommissionFee, setVisitAndCommissionFee] = useState(property.commissionFee || '');
  const [feeCurrency, setFeeCurrency] = useState<'USD' | 'FC'>('USD');
  const [terrace, setTerrace] = useState(property.terrace !== undefined ? String(property.terrace) : '');

  const [bedrooms, setBedrooms] = useState<number | ''>(property.bedrooms ?? 3);
  const [livingRooms, setLivingRooms] = useState<number | ''>(property.livingRooms ?? 1);
  const [kitchens, setKitchens] = useState<number | ''>(property.kitchens ?? 1);
  const [bathrooms, setBathrooms] = useState<number | ''>(property.bathrooms ?? 2);
  const [toilets, setToilets] = useState<number | ''>(property.toilets ?? '');

  const [latitude, setLatitude] = useState<number>(property.latitude || -2.5150);
  const [longitude, setLongitude] = useState<number>(property.longitude || 28.8680);
  const [userCurrentLocation, setUserCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  
  const [surface, setSurface] = useState<any>(property.surface !== undefined && property.surface !== null ? property.surface : '');
  
  const [features, setFeatures] = useState<string[]>(property.features || [
    'Eau',
    'Électricité',
    'Clôturé',
    'Garage',
    'Jardin'
  ]);

  const [images, setImages] = useState<string[]>(property.images || []);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (property) {
      setTitle(property.title || '');
      setDescription(property.description || '');
      setPrice(property.price ?? '');
      setPricePeriod(property.pricePeriod || 'mois');
      setType(property.type || 'location');
      setStatus(property.status || 'disponible');
      setCategory(property.category || 'maison');
      const propertyCommune = property.commune || 'Ibanda';
      setCommune(propertyCommune);
      const validQuartiers = BUKAVU_COMMUNES_WITH_NEIGHBORHOODS[propertyCommune] || [];
      const validQuartier = validQuartiers.includes(property.neighborhood) ? property.neighborhood : validQuartiers[0] || 'Nguba';
      setNeighborhood(validQuartier);
      setAddress(property.address || '');
      setLatitude(property.latitude || -2.5150);
      setLongitude(property.longitude || 28.8680);
      setSurface(property.surface !== undefined && property.surface !== null ? property.surface : '');
      setLivingRooms(property.livingRooms ?? 1);
      setBedrooms(property.bedrooms ?? 3);
      setBathrooms(property.bathrooms ?? 2);
      setKitchens(property.kitchens ?? 1);
      setToilets(property.toilets ?? '');
      setTerrace(property.terrace !== undefined ? String(property.terrace) : '');
      setVisitAndCommissionFee(property.commissionFee || '');
      setOwnerName(property.ownerName || '');
      setOwnerEmail(property.ownerEmail || '');
      setOwnerPhone(property.ownerPhone || '');
      setFeatures(property.features || ['Eau', 'Électricité', 'Clôturé', 'Garage', 'Jardin']);
      setImages(property.images || []);
    }
  }, [property]);

  // Ajustement automatique de la hauteur du textarea pour éliminer le scroll interne
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [description]);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'validating' | 'uploading' | 'error' | 'success'>('idle');
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageSuccessMsg, setImageSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentNeighborhoods = BUKAVU_COMMUNES_WITH_NEIGHBORHOODS[commune] || [];

  const handleCommuneChange = (newCommune: BukavuCommune) => {
    setCommune(newCommune);
    const firstQuartier = BUKAVU_COMMUNES_WITH_NEIGHBORHOODS[newCommune]?.[0] || 'Nguba';
    setNeighborhood(firstQuartier);
    const coords = BUKAVU_NEIGHBORHOOD_COORDINATES[firstQuartier] || BUKAVU_COMMUNE_CENTERS[newCommune] || [-2.5150, 28.8680];
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
          setImageError(validation.reason || "Photo refusée : Cette image ne représente pas un bien immobilier.");
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

    setUploadingImage(false);
    if (acceptedCount > 0 && rejectedCount === 0) {
      setImageSuccessMsg(`${acceptedCount} photo(s) acceptée(s) avec succès !`);
      setUploadStatus('success');
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
    'Eau',
    'Électricité',
    'Clôturé',
    'Garage',
    'Jardin',
    'Vue Panoramique Lac Kivu',
    'Citerne / Forage',
    'Sécurisé 24h/24'
  ];

  const handleToggleFeature = (feat: string) => {
    setFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (price === '') return;

    setSubmitting(true);
    try {
      const finalNeighborhood = isCustomNeighborhood ? customNeighborhood : neighborhood;
      const finalAddress = address || `Quartier ${finalNeighborhood}, Commune de ${commune}, Bukavu`;

      await onUpdateProperty(property.id, {
        title,
        description,
        price: Number(price),
        pricePeriod: (type === 'vente' || category === 'parcelle') ? 'total' : pricePeriod,
        type: category === 'parcelle' ? 'vente' : type,
        status,
        category,
        commune,
        neighborhood: finalNeighborhood,
        address: finalAddress,
        latitude,
        longitude,
        surface: category === 'parcelle' ? undefined : (surface !== '' ? surface : undefined),
        livingRooms: category === 'parcelle' ? undefined : (livingRooms !== '' ? Number(livingRooms) : undefined),
        bedrooms: category === 'parcelle' ? undefined : (bedrooms !== '' ? Number(bedrooms) : undefined),
        bathrooms: category === 'parcelle' ? undefined : (bathrooms !== '' ? Number(bathrooms) : undefined),
        kitchens: category === 'parcelle' ? undefined : (kitchens !== '' ? Number(kitchens) : undefined),
        toilets: category === 'parcelle' ? undefined : (toilets !== '' ? Number(toilets) : undefined),
        terrace: terrace ? Number(terrace) : undefined,
        commissionFee: visitAndCommissionFee,
        features,
        images: images.length > 0 ? images : property.images,
        ownerName,
        ownerEmail,
        ownerPhone
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
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2e2e2e] mb-5">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Modifier le bien</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Mettez à jour les informations du bien immobilier</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-white transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Titre */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">Titre de l'Annonce</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Belle villa moderne avec vue sur le lac"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-hidden"
            />
          </div>

          {/* Description sans barre de défilement interne et avec hauteur fluide */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">Description détaillée</label>
            <textarea
              ref={textareaRef}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez les atouts du bien..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-hidden resize-none overflow-hidden"
            />
          </div>

          {/* Type, Statut, Catégorie, Commune, Quartier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">Transaction</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-800 dark:text-[#f7f7f7]"
              >
                <option value="location">À Louer</option>
                <option value="vente">À Vendre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PropertyStatus)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-800 dark:text-[#f7f7f7]"
              >
                <option value="disponible">Disponible</option>
                <option value="loue">Loué</option>
                <option value="vendu">Vendu</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PropertyCategory)}
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">Commune</label>
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">Quartier</label>
              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-800 dark:text-[#f7f7f7]"
              >
                {currentNeighborhoods.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Adresse exacte */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">Adresse précise / Référence</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Av. de la Mission, près de l'ISP"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-hidden"
            />
          </div>

          {/* Prix & Périodicité */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">Prix ($ USD)</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                placeholder="Ex: 300"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-sm font-bold text-slate-900 dark:text-white"
              />
            </div>
            {type === 'location' && category !== 'parcelle' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">Périodicité</label>
                <select
                  value={pricePeriod}
                  onChange={(e) => setPricePeriod(e.target.value as 'total' | 'mois')}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-800 dark:text-[#f7f7f7]"
                >
                  <option value="mois">Par mois</option>
                  <option value="total">Total / Autre</option>
                </select>
              </div>
            )}
          </div>

          {/* Pièces et Caractéristiques (Masqué pour la catégorie parcelle) */}
          {category !== 'parcelle' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Salons</label>
                <input type="number" value={livingRooms} onChange={(e) => setLivingRooms(e.target.value ? Number(e.target.value) : '')} className="w-full p-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Chambres</label>
                <input type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value ? Number(e.target.value) : '')} className="w-full p-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Cuisines</label>
                <input type="number" value={kitchens} onChange={(e) => setKitchens(e.target.value ? Number(e.target.value) : '')} className="w-full p-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Salles de Bains</label>
                <input type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value ? Number(e.target.value) : '')} className="w-full p-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white" />
              </div>
            </div>
          )}

          {/* Frais et propriétaire */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">Frais de commission / visite</label>
              <input
                type="text"
                value={visitAndCommissionFee}
                onChange={(e) => setVisitAndCommissionFee(e.target.value)}
                placeholder="Ex: 50$ ou Demi du mois"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">Téléphone Propriétaire / Agent</label>
              <input
                type="text"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="Ex: +243..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Gestion des Photos */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">Photos du bien</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {images.map((imgUrl, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video bg-slate-100 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e]">
                  <img src={imgUrl} alt={`Aperçu ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-slate-300 dark:border-[#2e2e2e] hover:border-[#FF385C] dark:hover:border-[#FF385C] bg-slate-50 dark:bg-[#121212] text-slate-500 hover:text-[#FF385C] transition cursor-pointer"
              >
                <UploadCloud className="w-5 h-5 mb-1" />
                <span className="text-[11px] font-semibold">Ajouter des photos</span>
              </button>
            </div>

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {uploadingImage && (
              <div className="flex items-center space-x-2 text-xs text-[#FF385C] font-medium mt-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{uploadStatus === 'validating' ? "Validation de l'image par l'IA..." : "Téléchargement en cours..."}</span>
              </div>
            )}
            {imageError && <p className="text-xs text-red-500 mt-1">{imageError}</p>}
            {imageSuccessMsg && <p className="text-xs text-emerald-500 mt-1">{imageSuccessMsg}</p>}
          </div>

          {/* Équipements & Prestations */}
          {category !== 'parcelle' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">Équipements & Prestations</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableFeatures.map((feat) => {
                  const checked = features.includes(feat);
                  return (
                    <button
                      key={feat}
                      type="button"
                      onClick={() => handleToggleFeature(feat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-left border transition flex items-center space-x-2 cursor-pointer ${
                        checked ? 'bg-[#FF385C]/15 text-[#FF385C] border-[#FF385C]' : 'bg-slate-50 dark:bg-[#121212] text-slate-600 dark:text-[#f7f7f7] border-slate-200 dark:border-[#2e2e2e]'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${checked ? 'bg-[#FF385C] border-[#FF385C] text-white' : 'border-slate-300'}`}>
                        {checked && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <span>{feat}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-[#2e2e2e]">
            <button type="button" onClick={onClose} disabled={submitting} className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Annuler</button>
            <button type="submit" disabled={submitting || uploadingImage} className="px-5 py-2.5 rounded-xl bg-[#FF385C] text-white text-xs font-bold shadow-md cursor-pointer flex items-center space-x-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{submitting ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};