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
    property.surface ? `${property.surface} m²` : ''
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
  const [terrace, setTerrace] = useState<number | ''>(property.terrace ?? '');
  
  // Nouveaux champs : Frais de commission et de visite (texte libre ou prix)
  const [commissionFee, setCommissionFee] = useState<string>(property.commissionFee || '');
  const [visitFee, setVisitFee] = useState<string>(property.visitFee || '');

  const [features, setFeatures] = useState<string[]>(property.features || []);
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
      setParcelDimensions(property.surface ? `${property.surface} m²` : '');
      setAddress(property.address);
      setLatitude(property.latitude || -2.5080);
      setLongitude(property.longitude || 28.8600);
      setSurface(property.surface || '');
      setLivingRooms(property.livingRooms ?? '');
      setBedrooms(property.bedrooms ?? '');
      setBathrooms(property.bathrooms ?? '');
      setKitchens(property.kitchens ?? '');
      setToilets(property.toilets ?? '');
      setTerrace(property.terrace ?? '');
      setCommissionFee(property.commissionFee || '');
      setVisitFee(property.visitFee || '');
      setFeatures(property.features || []);
      setImages(property.images || []);
    }
  }, [property]);

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
    'Eau (Regideso / Forage 24h/24)',
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
        address: address || `Quartier ${neighborhood}, Commune de ${commune}, Bukavu`,
        neighborhood,
        latitude,
        longitude,
        surface: category === 'parcelle' ? (surface ? Number(surface) : undefined) : undefined,
        livingRooms: category === 'parcelle' ? undefined : (livingRooms !== '' ? Number(livingRooms) : undefined),
        bedrooms: category === 'parcelle' ? undefined : (bedrooms !== '' ? Number(bedrooms) : undefined),
        bathrooms: category === 'parcelle' ? undefined : (bathrooms !== '' ? Number(bathrooms) : undefined),
        kitchens: category === 'parcelle' ? undefined : (kitchens !== '' ? Number(kitchens) : undefined),
        toilets: category === 'parcelle' ? undefined : (toilets !== '' ? Number(toilets) : undefined),
        terrace: category === 'parcelle' ? undefined : (terrace !== '' ? Number(terrace) : undefined),
        commissionFee,
        visitFee,
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
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2e2e2e] mb-5">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Modifier le bien</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Mettez à jour les informations du bien</p>
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
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-hidden"
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
                <option value="disponible"> Disponible</option>
                <option value="loue"> Loué</option>
                <option value="vendu"> Vendu</option>
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
                onChange={(e) => handleNeighborhoodChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-800 dark:text-[#f7f7f7]"
              >
                {currentNeighborhoods.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Prix & Pièces (Salon, Cuisine, SDB, Toilette, Terrasse) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">Prix ($ USD)</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-sm font-bold text-slate-900 dark:text-white"
              />
            </div>

            {category === 'parcelle' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">Dimensions / Surface (m²)</label>
                <input
                  type="text"
                  value={parcelDimensions}
                  onChange={(e) => {
                    setParcelDimensions(e.target.value);
                    const match = e.target.value.match(/(\d+)/);
                    if (match) setSurface(Number(match[1]));
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Salons</label>
                  <input type="number" placeholder="Ex: 1" value={livingRooms} onChange={(e) => setLivingRooms(e.target.value ? Number(e.target.value) : '')} className="w-full p-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Chambres</label>
                  <input type="number" placeholder="Ex: 2" value={bedrooms} onChange={(e) => setBedrooms(e.target.value ? Number(e.target.value) : '')} className="w-full p-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Cuisines</label>
                  <input type="number" placeholder="Ex: 1" value={kitchens} onChange={(e) => setKitchens(e.target.value ? Number(e.target.value) : '')} className="w-full p-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Terrasses</label>
                  <input type="number" placeholder="Ex: 1" value={terrace} onChange={(e) => setTerrace(e.target.value ? Number(e.target.value) : '')} className="w-full p-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">S. Bains</label>
                  <input type="number" placeholder="Ex: 1" value={bathrooms} onChange={(e) => setBathrooms(e.target.value ? Number(e.target.value) : '')} className="w-full p-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Toilettes</label>
                  <input type="number" placeholder="Ex: 1" value={toilets} onChange={(e) => setToilets(e.target.value ? Number(e.target.value) : '')} className="w-full p-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white" />
                </div>
              </div>
            )}
          </div>

          {/* Nouveaux champs : Frais de commission et de visite (Prix en $, FC ou texte libre ex: "Demi du mois") */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">Frais de Commission</label>
              <input
                type="text"
                placeholder="Ex: 50$ ou Demi du mois"
                value={commissionFee}
                onChange={(e) => setCommissionFee(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">Frais de Visite</label>
              <input
                type="text"
                placeholder="Ex: 5$ ou 10000 FC"
                value={visitFee}
                onChange={(e) => setVisitFee(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Équipements & Prestations (avec Eau incluse) */}
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-left border transition flex items-center space-x-2 ${
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