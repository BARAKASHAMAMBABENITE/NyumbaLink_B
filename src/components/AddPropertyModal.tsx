import React, { useState, useRef } from 'react';
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
  ShieldAlert,
  Upload
} from 'lucide-react';
import { Property, PropertyCategory, TransactionType, UserProfile, BukavuCommune } from '../types';
import {
  BUKAVU_COMMUNES,
  BUKAVU_COMMUNES_WITH_NEIGHBORHOODS,
  BUKAVU_NEIGHBORHOOD_COORDINATES,
  BUKAVU_COMMUNE_CENTERS
} from '../data/initialProperties';
import { PropertyMap } from './PropertyMap';
import { uploadImageToCloudinary } from '../services/cloudinaryService';
import { validatePropertyImageWithAI } from '../services/imageValidationService';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProperty: (newProp: Omit<Property, 'id' | 'viewsCount' | 'createdAt'>) => Promise<void>;
  user: UserProfile | null;
  userPropertiesCount?: number;
}

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({
  isOpen,
  onClose,
  onAddProperty,
  user,
  userPropertiesCount = 0
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [pricePeriod, setPricePeriod] = useState<'total' | 'mois'>('mois');
  const [type, setType] = useState<TransactionType>('location');
  const [category, setCategory] = useState<PropertyCategory>('maison');
  const [commune, setCommune] = useState<BukavuCommune>('Ibanda');
  const [neighborhood, setNeighborhood] = useState(BUKAVU_COMMUNES_WITH_NEIGHBORHOODS['Ibanda'][0]);
  const [parcelDimensions, setParcelDimensions] = useState('20m x 25m (500 m²)');
  const [address, setAddress] = useState(`Quartier ${BUKAVU_COMMUNES_WITH_NEIGHBORHOODS['Ibanda'][0]}, Commune d'Ibanda, Bukavu`);
  const [latitude, setLatitude] = useState<number>(-2.5150);
  const [longitude, setLongitude] = useState<number>(28.8680);
  const [surface, setSurface] = useState<number | ''>('');
  const [bedrooms, setBedrooms] = useState<number | ''>(3);
  const [bathrooms, setBathrooms] = useState<number | ''>(2);
  const [features, setFeatures] = useState<string[]>([
    'Eau 24h/24',
    'Électricité',
    'Clôturé'
  ]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // Image Upload & AI Validation State
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'validating' | 'uploading' | 'error' | 'success'>('idle');
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageSuccessMsg, setImageSuccessMsg] = useState<string | null>(null);

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
              "Photo refusée : Cette image ne représente pas un bien immobilier réel. Seules les photos d'habitations ou de parcelles à Bukavu sont acceptées."
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
        console.error('Error processing image:', err);
      }
    }

    setUploadingImage(false);
    if (acceptedCount > 0 && rejectedCount === 0) {
      setImageSuccessMsg(
        acceptedCount > 1
          ? `${acceptedCount} photos vérifiées et acceptées avec succès !`
          : `1 photo vérifiée et acceptée avec succès !`
      );
      setUploadStatus('success');
    } else if (acceptedCount > 0 && rejectedCount > 0) {
      const acceptedTxt = acceptedCount > 1 ? `${acceptedCount} photos acceptées` : `1 photo acceptée`;
      const rejectedTxt = rejectedCount > 1 ? `${rejectedCount} images rejetées (non conformes)` : `1 image rejetée (non conforme)`;
      setImageSuccessMsg(`${acceptedTxt}. (${rejectedTxt}).`);
      setUploadStatus('idle');
    } else if (rejectedCount > 0 && acceptedCount === 0) {
      setUploadStatus('error');
    } else {
      setUploadStatus('idle');
    }

    if (e.target) e.target.value = '';
  };

  const availableFeatures = [
    'Vue sur le Lac Kivu',
    'Eau 24h/24',
    'Électricité',
    'Clôturé',
    'Garage',
    'Jardin',
    'Groupe Électrogène',
    'Sécurité 24h/24',
    'Meublé'
  ];

  const handleToggleFeature = (feat: string) => {
    setFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const handleAddImageUrl = async () => {
    const url = imageUrlInput.trim();
    if (!url) return;

    setUploadingImage(true);
    setImageError(null);
    setImageSuccessMsg(null);
    setUploadStatus('validating');

    try {
      const validation = await validatePropertyImageWithAI(url);
      if (!validation.isRealEstate) {
        setImageError(
          validation.reason ||
            "Photo refusée : Cette image ne représente pas un bien immobilier (maison, parcelle, appartement)."
        );
        setUploadStatus('error');
        setUploadingImage(false);
        return;
      }

      setImages((prev) => [...prev, url]);
      setImageSuccessMsg("Photo immobilière vérifiée et acceptée avec succès !");
      setUploadStatus('success');
      setImageUrlInput('');
    } catch (err: any) {
      console.warn('URL validation error:', err);
      setImageError("Impossible de vérifier cette image. Assurez-vous d'utiliser une URL d'image valide et accessible.");
      setUploadStatus('error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImageError(null);

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
      setImageError("Veuillez ajouter au moins une photo valide de votre bien immobilier pour publier l'annonce.");
      setUploadStatus('error');
      return;
    }

    if (!title || !price) return;

    setSubmitting(true);
    try {
      await onAddProperty({
        title,
        description:
          description ||
          (category === 'parcelle'
            ? `Parcelle (${parcelDimensions || 'dimensions standard'}) disponible en vente dans le quartier ${finalNeighborhood}, Commune de ${commune} à Bukavu.`
            : `Magnifique ${category} disponible en ${type} dans le quartier ${finalNeighborhood}, Commune de ${commune} à Bukavu. Ce bien dispose d'un emplacement privilégié.`),
        price: Number(price),
        pricePeriod: (type === 'vente' || category === 'parcelle') ? 'total' : 'mois',
        type: category === 'parcelle' ? 'vente' : type,
        category,
        commune,
        address: address || `Quartier ${finalNeighborhood}, Commune de ${commune}, Bukavu`,
        neighborhood: finalNeighborhood,
        latitude,
        longitude,
        surface: category === 'parcelle' ? (surface ? Number(surface) : 500) : undefined,
        bedrooms: category === 'parcelle' ? undefined : (bedrooms !== '' ? Number(bedrooms) : undefined),
        bathrooms: category === 'parcelle' ? undefined : (bathrooms !== '' ? Number(bathrooms) : undefined),
        features: category === 'parcelle' ? [] : features,
        images,
        ownerId: user?.uid || 'agent-001',
        ownerName: user?.fullname || 'Agent Immobilier NyumbaLink',
        ownerPhone: user?.phone && user.phone.trim() !== '' ? user.phone : '+243986760178',
        ownerEmail: user?.email,
        ownerRole: user?.role || 'agent',
        ownerExpiresAt: user?.agentExpiresAt,
        status: 'disponible',
        featured: false
      });

      onClose();
    } catch (err) {
      console.error('Error publishing property:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1e1e1e] text-[#222222] dark:text-[#f7f7f7] rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#ebebeb] dark:border-[#2e2e2e] p-6 relative">
        <div className="flex items-center space-x-3 mb-6 border-b border-[#ebebeb] dark:border-[#2e2e2e] pb-4">
          <div className="w-10 h-10 rounded-xl bg-[#FF385C] text-white flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Publier un bien
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Remplissez les détails du bien à Bukavu
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
              Titre de l'Annonce
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Villa 4 Chambres avec Vue Lac Kivu"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#181818] focus:ring-2 focus:ring-[#FF385C] outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
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
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#181818] outline-hidden"
              >
                <option value="location">À Louer</option>
                <option value="vente">À Vendre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
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
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#181818] outline-hidden"
              >
                <option value="maison">Maison</option>
                <option value="parcelle">Parcelle</option>
                <option value="appartement">Appartement</option>
                <option value="villa">Villa</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1 flex items-center">
                <Compass className="w-3.5 h-3.5 text-[#FF385C] mr-1" />
                Commune
              </label>
              <select
                value={commune}
                onChange={(e) => handleCommuneChange(e.target.value as BukavuCommune)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#181818] outline-hidden"
              >
                <option value="Ibanda">Ibanda</option>
                <option value="Kadutu">Kadutu</option>
                <option value="Bagira">Bagira</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                Quartier (Bukavu)
              </label>
              <select
                value={neighborhood}
                onChange={(e) => handleNeighborhoodChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#181818] outline-hidden"
              >
                {currentNeighborhoods.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#181818] outline-hidden"
                />
                {type === 'location' && category !== 'parcelle' ? (
                  <span className="px-3 py-2.5 bg-slate-100 dark:bg-[#222] border border-slate-200 dark:border-[#333] rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    $ / mois
                  </span>
                ) : (
                  <span className="px-3 py-2.5 bg-slate-100 dark:bg-[#222] border border-slate-200 dark:border-[#333] rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    $ USD
                  </span>
                )}
              </div>
            </div>

            {category === 'parcelle' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#181818] outline-hidden"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                  {type === 'vente'
                    ? 'Nombre de pièces'
                    : category === 'commercial'
                    ? 'Nombre de bureaux / pièces'
                    : 'Nombre de chambres'}
                </label>
                <input
                  type="number"
                  placeholder={
                    type === 'vente'
                      ? 'Ex: 6 pièces'
                      : category === 'commercial'
                      ? 'Ex: 4 bureaux'
                      : 'Ex: 3 chambres'
                  }
                  value={bedrooms}
                  onChange={(e) =>
                    setBedrooms(e.target.value ? Number(e.target.value) : '')
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#181818] outline-hidden"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
              Adresse à Bukavu
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#181818] mb-3 outline-hidden"
            />

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-[#FF385C]" />
                Point GPS ({latitude.toFixed(3)}, {longitude.toFixed(3)})
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Cliquez sur la carte pour ajuster
              </span>
            </div>

            <PropertyMap
              properties={[]}
              pickerMode={true}
              onPickCoordinates={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
              height="200px"
              centerCoordinates={[latitude, longitude]}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
              Description du Bien
            </label>

            <textarea
              rows={3}
              placeholder="Atouts du bien, accès, environnement..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#181818] focus:ring-2 focus:ring-[#FF385C] outline-hidden"
            />
          </div>

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

          <div className="bg-slate-50/80 dark:bg-[#121212] p-4 rounded-2xl border border-slate-200/80 dark:border-[#2e2e2e] space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-800 dark:text-[#f7f7f7] uppercase tracking-wider flex items-center">
                <ImageIcon className="w-4 h-4 text-[#FF385C] mr-1.5" />
                Photos du Bien
              </label>
            </div>

            {imageError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl space-y-1 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in">
                <div className="flex items-start space-x-2.5">
                  <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
                  <div className="flex-1">
                    <span className="font-bold block">Refus de conformité immobilière :</span>
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
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploadingImage}
                className="flex items-center justify-center space-x-2.5 bg-white dark:bg-[#1e1e1e] hover:bg-[#FF385C]/5 border-2 border-dashed border-[#FF385C]/40 hover:border-[#FF385C] py-3 px-4 rounded-xl text-xs font-bold text-slate-800 dark:text-[#f7f7f7] transition shadow-xs group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center group-hover:scale-110 transition">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">Importer depuis la Galerie</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium">Sélectionnez des photos du bien</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploadingImage}
                className="flex items-center justify-center space-x-2.5 bg-slate-900 hover:bg-black text-white py-3 px-4 rounded-xl text-xs font-bold transition shadow-xs group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#FF385C] text-white flex items-center justify-center group-hover:scale-110 transition">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold text-white">Prendre une Photo</span>
                  <span className="block text-[10px] text-slate-300 font-medium">Capture directe appareil</span>
                </div>
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
              <div>
                <span className="block text-[11px] font-bold text-slate-600 dark:text-[#b0b0b0] uppercase mb-2">
                  Photos ajoutées ({images.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative h-24 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-[#2e2e2e] group shadow-xs bg-slate-100 dark:bg-[#1e1e1e]"
                    >
                      <img
                        src={imgUrl}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                      />
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-slate-900/80 text-white text-[9px] font-extrabold rounded">
                        {idx === 0 ? 'Principale' : `#${idx + 1}`}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-lg opacity-90 sm:opacity-0 group-hover:opacity-100 transition shadow-md cursor-pointer"
                        title="Supprimer cette photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#ebebeb] dark:border-[#2e2e2e] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#717171] hover:text-[#222222] dark:hover:text-[#f7f7f7] hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-[#FF385C] to-[#E61E4D] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Publier l'annonce  </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};