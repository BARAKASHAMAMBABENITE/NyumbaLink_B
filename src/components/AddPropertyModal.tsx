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
  ShieldAlert
} from 'lucide-react';
import { Property, PropertyCategory, TransactionType, UserProfile, BukavuCommune } from '../types';
import {
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
}

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({
  isOpen,
  onClose,
  onAddProperty,
  user
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [type, setType] = useState<TransactionType>('location');
  const [category, setCategory] = useState<PropertyCategory>('maison');
  const [commune, setCommune] = useState<BukavuCommune>('Ibanda');
  
  const [neighborhood, setNeighborhood] = useState(BUKAVU_COMMUNES_WITH_NEIGHBORHOODS['Ibanda'][0]);
  const [customNeighborhood, setCustomNeighborhood] = useState('');
  const [isCustomNeighborhood, setIsCustomNeighborhood] = useState(false);

  const [avenue, setAvenue] = useState('');
  const [customAvenue, setCustomAvenue] = useState('');
  const [isCustomAvenue, setIsCustomAvenue] = useState(false);

  const [parcelDimensions, setParcelDimensions] = useState('20m x 25m (500 m²)');
  const [address, setAddress] = useState('');
  
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerPhoneSecondary, setOwnerPhoneSecondary] = useState('');
  
  const [visitFeeFc, setVisitFeeFc] = useState<number | ''>('');
  const [bedrooms, setBedrooms] = useState<number | ''>(3);
  const [livingRooms, setLivingRooms] = useState<number | ''>(1);
  const [kitchens, setKitchens] = useState<number | ''>(1);
  const [bathrooms, setBathrooms] = useState<number | ''>(2);

  const [latitude, setLatitude] = useState<number>(-2.5150);
  const [longitude, setLongitude] = useState<number>(28.8680);
  const [userCurrentLocation, setUserCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  const [surface, setSurface] = useState<number | ''>('');
  const [features, setFeatures] = useState<string[]>([
    'Électricité',
    'Clôturé',
    'Garage',
    'Jardin'
  ]);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'validating' | 'uploading' | 'error' | 'success'>('idle');
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageSuccessMsg, setImageSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const currentNeighborhoods = BUKAVU_COMMUNES_WITH_NEIGHBORHOODS[commune] || [];

  const validateTextFormat = (text: string): boolean => {
    if (!text.trim()) return true;
    if (/\d/.test(text)) return false;

    const lower = text.toLowerCase();
    const forbiddenWords = [
      'chien', 'chat', 'vache', 'lion', 'tigre', 'singe', 'poule', 'chèvre', 'mouton', 'cheval', 'oiseau', 'poisson', 'rat', 'souris',
      'congo', 'rwanda', 'burundi', 'france', 'belgique', 'china', 'usa', 'america', 'europe', 'afrique', 'asie', 'amerique', 'kinshasa',
      'medecin', 'informatique', 'droit', 'economie', 'finance', 'ingenieur', 'pedagogie', 'technologie', 'agronomie', 'sante'
    ];

    for (const word of forbiddenWords) {
      if (lower.includes(word)) return false;
    }
    return true;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDistanceAndTime = (distKm: number) => {
    const distText = distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`;
    
    const carMinutesTotal = Math.max(2, Math.round((distKm / 25) * 60));
    const carTimeText = carMinutesTotal >= 60 
      ? `${Math.floor(carMinutesTotal / 60)}h ${carMinutesTotal % 60 > 0 ? `${carMinutesTotal % 60} min` : ''}` 
      : `${carMinutesTotal} min`;

    const walkMinutesTotal = Math.max(3, Math.round((distKm / 4.5) * 60));
    const walkTimeText = walkMinutesTotal >= 60 
      ? `${Math.floor(walkMinutesTotal / 60)}h ${walkMinutesTotal % 60 > 0 ? `${walkMinutesTotal % 60} min` : ''}` 
      : `${walkMinutesTotal} min`;

    return `Distance : ${distText} | 🚗 ${carTimeText} (véhicule) | 🚶 ${walkTimeText} (à pied)`;
  };

  const updateFullAddress = (neigh: string, comm: string, av: string) => {
    const avPart = av.trim() ? `Avenue ${av.trim()}, ` : '';
    setAddress(`${avPart}Quartier ${neigh}, Commune de ${comm}, Bukavu`);
  };

  const updateDistance = (lat: number, lng: number) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setUserCurrentLocation({ lat: userLat, lng: userLng });
          const dist = calculateDistance(userLat, userLng, lat, lng);
          setDistanceKm(dist);
        },
        () => {
          const defaultLat = -2.5080;
          const defaultLng = 28.8600;
          setUserCurrentLocation({ lat: defaultLat, lng: defaultLng });
          const dist = calculateDistance(defaultLat, defaultLng, lat, lng);
          setDistanceKm(dist);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      const defaultLat = -2.5080;
      const defaultLng = 28.8600;
      const dist = calculateDistance(defaultLat, defaultLng, lat, lng);
      setDistanceKm(dist);
    }
  };

  const handleCommuneChange = (newCommune: BukavuCommune) => {
    setCommune(newCommune);
    const firstQuartier = BUKAVU_COMMUNES_WITH_NEIGHBORHOODS[newCommune]?.[0] || 'Nguba';
    setNeighborhood(firstQuartier);
    setIsCustomNeighborhood(false);
    updateFullAddress(firstQuartier, newCommune, isCustomNeighborhood ? customAvenue : avenue);
    const coords = BUKAVU_NEIGHBORHOOD_COORDINATES[firstQuartier] || BUKAVU_COMMUNE_CENTERS[newCommune] || [-2.5080, 28.8600];
    setLatitude(coords[0]);
    setLongitude(coords[1]);
    updateDistance(coords[0], coords[1]);
  };

  const handleNeighborhoodSelectChange = (val: string) => {
    if (val === 'AUTRE') {
      setIsCustomNeighborhood(true);
      setNeighborhood('');
    } else {
      setIsCustomNeighborhood(false);
      setNeighborhood(val);
      updateFullAddress(val, commune, isCustomNeighborhood ? customAvenue : avenue);
      const coords = BUKAVU_NEIGHBORHOOD_COORDINATES[val] || BUKAVU_COMMUNE_CENTERS[commune] || [-2.5080, 28.8600];
      setLatitude(coords[0]);
      setLongitude(coords[1]);
      updateDistance(coords[0], coords[1]);
    }
  };

  const handleCustomNeighborhoodChange = (val: string) => {
    if (!validateTextFormat(val)) {
      setImageError("Format invalide : La saisie ne doit pas contenir de chiffres, noms d'animaux, de pays, de continents ou de domaines de travail.");
      return;
    }
    setImageError(null);
    setCustomNeighborhood(val);
    setNeighborhood(val);
    updateFullAddress(val, commune, avenue);
  };

  const handleAvenueSelectChange = (val: string) => {
    if (val === 'AUTRE') {
      setIsCustomAvenue(true);
      setAvenue('');
    } else {
      setIsCustomAvenue(false);
      setAvenue(val);
      updateFullAddress(isCustomNeighborhood ? customNeighborhood : neighborhood, commune, val);
    }
  };

  const handleCustomAvenueChange = (val: string) => {
    if (!validateTextFormat(val)) {
      setImageError("Format invalide : L'avenue ne doit pas contenir de chiffres, noms d'animaux, de pays, de continents ou de domaines de travail.");
      return;
    }
    setImageError(null);
    setCustomAvenue(val);
    setAvenue(val);
    updateFullAddress(isCustomNeighborhood ? customNeighborhood : neighborhood, commune, val);
  };

  const handleMapCoordinatesPick = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    updateDistance(lat, lng);
  };

  // FILTRE STRICT LOCAL : Empêche les personnes, animaux, voitures ou composants électroniques
  const checkImageIsRealEstateStrict = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Analyse basique des dimensions et des mots-clés du nom du fichier ou de l'objet
          const name = file.name.toLowerCase();
          const forbiddenKeywords = [
            'personne', 'homme', 'femme', 'enfant', 'visage', 'portrait', 'selfie', 'person', 'people', 'man', 'woman',
            'voiture', 'auto', 'vehicule', 'car', 'moto', 'bike', 'phone', 'telephone', 'pc', 'ordinateur', 'electronic',
            'chien', 'chat', 'animal', 'dog', 'cat', 'bird', 'oiseau'
          ];

          for (const word of forbiddenKeywords) {
            if (name.includes(word)) {
              resolve(false);
              return;
            }
          }

          // Analyse via le service externe s'il existe, mais avec vérification de secours
          validatePropertyImageWithAI(file).then((aiValidation) => {
            // Si le nom ou une heuristique détecte un humain / vêtement de type gilet de chantier sur un portrait serré, on bloque
            resolve(aiValidation.isRealEstate);
          }).catch(() => {
            resolve(true);
          });
        };
        img.onerror = () => resolve(false);
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
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
        
        // Vérification stricte
        const isRealEstate = await checkImageIsRealEstateStrict(file);

        if (!isRealEstate) {
          rejectedCount++;
          setImageError("Image refusée : Seules les images de parcelles, maisons, bâtiments et biens immobiliers sont acceptées. Les personnes, animaux, véhicules ou composants électroniques sont interdits.");
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
        console.error('Erreur lors du traitement de l’image:', err);
        rejectedCount++;
        setImageError("Image refusée : Impossible de valider cette image en tant que bien immobilier.");
        setUploadStatus('error');
      }
    }

    setUploadingImage(false);
    if (acceptedCount > 0 && rejectedCount === 0) {
      setImageSuccessMsg(`${acceptedCount} photo(s) immobilière(s) acceptée(s) avec succès !`);
      setUploadStatus('success');
    } else if (rejectedCount > 0) {
      setUploadStatus('error');
    }

    e.target.value = '';
  };

  const availableFeatures = [
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

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImageError(null);

    const activeNeighborhood = isCustomNeighborhood ? customNeighborhood : neighborhood;
    if (!activeNeighborhood.trim() || !validateTextFormat(activeNeighborhood)) {
      setImageError("Veuillez indiquer un quartier valide (sans chiffres ni mots interdits).");
      setUploadStatus('error');
      return;
    }

    if (images.length === 0) {
      setImageError("Image refusée : Veuillez ajouter au moins une photo valide d'un bien immobilier.");
      setUploadStatus('error');
      return;
    }

    if (!ownerPhone.trim() || !ownerName.trim()) {
      setImageError("Veuillez renseigner un nom et un numéro de téléphone professionnels.");
      setUploadStatus('error');
      return;
    }

    setSubmitting(true);
    try {
      const formattedPhones = ownerPhone.trim() + (ownerPhoneSecondary.trim() ? ` / ${ownerPhoneSecondary.trim()}` : '');

      await onAddProperty({
        title,
        description: description || `Magnifique ${category} disponible en ${type} dans le quartier ${activeNeighborhood}, Commune de ${commune} à Bukavu.`,
        price: Number(price),
        pricePeriod: type === 'vente' || category === 'parcelle' ? 'total' : 'mois',
        type: category === 'parcelle' ? 'vente' : type,
        category,
        commune,
        address: address || `Quartier ${activeNeighborhood}, Commune de ${commune}, Bukavu`,
        neighborhood: activeNeighborhood,
        latitude,
        longitude,
        surface: category === 'parcelle' ? (surface ? Number(surface) : 500) : undefined,
        bedrooms: category === 'parcelle' ? undefined : (bedrooms !== '' ? Number(bedrooms) : undefined),
        livingRooms: category === 'parcelle' ? undefined : (livingRooms !== '' ? Number(livingRooms) : undefined),
        kitchens: category === 'parcelle' ? undefined : (kitchens !== '' ? Number(kitchens) : undefined),
        bathrooms: category === 'parcelle' ? undefined : (bathrooms !== '' ? Number(bathrooms) : undefined),
        features: category === 'parcelle' ? [] : features,
        images,
        ownerId: user?.uid || 'agent-001',
        ownerName: ownerName.trim(),
        ownerPhone: formattedPhones,
        ownerEmail: ownerEmail.trim(),
        ownerRole: user?.role || 'agent',
        status: 'disponible',
        featured: false,
      } as any);

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
        <div className="flex items-center justify-between mb-6 border-b border-[#ebebeb] dark:border-[#2e2e2e] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF385C] text-white flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Publier un bien immobilier
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Informations professionnelles et géolocalisation à Bukavu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-[#121212] rounded-xl border border-slate-200 dark:border-[#2e2e2e]">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                Nom du propriétaire / Agence *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Agence Immobilière Kivu Services"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#FF385C] outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                Email professionnel *
              </label>
              <input
                type="email"
                required
                placeholder="Ex: contact@kivuimmobilier.cd"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#FF385C] outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                Numéro WhatsApp Principal *
              </label>
              <input
                type="tel"
                required
                placeholder="Ex: +243 812 345 678"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#FF385C] outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                Deuxième WhatsApp <span className="text-[10px] text-slate-400 font-normal">(Facultatif)</span>
              </label>
              <input
                type="tel"
                placeholder="Ex: +243 998 765 432"
                value={ownerPhoneSecondary}
                onChange={(e) => setOwnerPhoneSecondary(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#FF385C] outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
              Titre de l'Annonce *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Belle Maison Moderne avec Finitions de Qualité"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#181818] focus:ring-2 focus:ring-[#FF385C] outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                Transaction
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-hidden"
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
                  if (newCat === 'parcelle') setType('vente');
                }}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-hidden"
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
                Commune *
              </label>
              <select
                value={commune}
                onChange={(e) => handleCommuneChange(e.target.value as BukavuCommune)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-hidden"
              >
                <option value="Ibanda">Ibanda</option>
                <option value="Kadutu">Kadutu</option>
                <option value="Bagira">Bagira</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                Quartier *
              </label>
              <select
                value={isCustomNeighborhood ? 'AUTRE' : neighborhood}
                onChange={(e) => handleNeighborhoodSelectChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-hidden mb-2"
              >
                {currentNeighborhoods.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
                <option value="AUTRE">Autre (Saisir un autre quartier)...</option>
              </select>

              {isCustomNeighborhood && (
                <input
                  type="text"
                  required
                  placeholder="Écrivez le quartier..."
                  value={customNeighborhood}
                  onChange={(e) => handleCustomNeighborhoodChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-[#181818] border border-slate-300 dark:border-[#333] rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#FF385C] outline-hidden"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                Avenue
              </label>
              <select
                onChange={(e) => handleAvenueSelectChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-hidden mb-2"
              >
                <option value="">Sélectionner ou autre...</option>
                <option value="Lumumba">Avenue Lumumba</option>
                <option value="Kanyabayonga">Avenue Kanyabayonga</option>
                <option value="Des Cliniques">Avenue des Cliniques</option>
                <option value="AUTRE">Autre (Saisir une autre avenue)...</option>
              </select>

              {isCustomAvenue && (
                <input
                  type="text"
                  placeholder="Écrivez l'avenue..."
                  value={customAvenue}
                  onChange={(e) => handleCustomAvenueChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-[#181818] border border-slate-300 dark:border-[#333] rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#FF385C] outline-hidden"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                {type === 'vente' || category === 'parcelle' ? 'Prix de Vente ($USD) *' : 'Prix du Loyer ($ USD / mois) *'}
              </label>
              <input
                type="number"
                required
                placeholder={type === 'vente' || category === 'parcelle' ? 'Ex: 25000' : 'Ex: 250'}
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-hidden"
              />
            </div>

            {category === 'parcelle' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                  Dimensions de la parcelle
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 20m x 25m (500 m²)"
                  value={parcelDimensions}
                  onChange={(e) => setParcelDimensions(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-hidden"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                    Chambres
                  </label>
                  <input
                    type="number"
                    placeholder="3"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                    Salons
                  </label>
                  <input
                    type="number"
                    placeholder="1"
                    value={livingRooms}
                    onChange={(e) => setLivingRooms(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {category !== 'parcelle' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                  Cuisines
                </label>
                <input
                  type="number"
                  placeholder="1"
                  value={kitchens}
                  onChange={(e) => setKitchens(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                  Toilettes / Salles de bains
                </label>
                <input
                  type="number"
                  placeholder="2"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                  Frais de visite (FC)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 5000"
                  value={visitFeeFc}
                  onChange={(e) => setVisitFeeFc(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-hidden"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-[#FF385C]" />
                Localisation précise sur la Carte interactive
              </label>
              {distanceKm !== null && (
                <div className="text-xs font-bold text-[#FF385C] bg-[#FF385C]/10 px-2.5 py-1 rounded-lg">
                  {formatDistanceAndTime(distanceKm)}
                </div>
              )}
            </div>
            
            <PropertyMap
              properties={[]}
              pickerMode={true}
              onPickCoordinates={handleMapCoordinatesPick}
              height="220px"
              centerCoordinates={[latitude, longitude]}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
              Description Détaillée
            </label>
            <textarea
              rows={3}
              placeholder="Précisez les commodités, l'accès routier et les détails du bien..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-hidden"
            />
          </div>

          {category !== 'parcelle' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                Équipements & Prestations
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {availableFeatures.map((feat) => {
                  const isSelected = features.includes(feat);
                  return (
                    <button
                      key={feat}
                      type="button"
                      onClick={() => handleToggleFeature(feat)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition text-left flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#FF385C]/10 border-[#FF385C] text-[#FF385C]'
                          : 'bg-slate-50 dark:bg-[#121212] border-slate-200 dark:border-[#2e2e2e] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{feat}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#FF385C]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section Photos avec blocage strict */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Photos du Bien (Seules les parcelles, maisons et bâtiments sont acceptés) *
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((imgUrl, idx) => (
                <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-[#2e2e2e] group bg-slate-100">
                  <img src={imgUrl} alt={`Aperçu ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-lg shadow-md transition cursor-pointer"
                    title="Supprimer la photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div
                onClick={() => galleryInputRef.current?.click()}
                className="aspect-video rounded-xl border-2 border-dashed border-slate-300 dark:border-[#333] hover:border-[#FF385C] flex flex-col items-center justify-center cursor-pointer bg-slate-50 dark:bg-[#121212] transition group"
              >
                <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-[#FF385C] mb-1" />
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 text-center px-1">
                  Ajouter des photos
                </span>
              </div>
            </div>

            <input
              type="file"
              ref={galleryInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*"
              className="hidden"
            />

            {uploadingImage && (
              <div className="flex items-center space-x-2 text-xs font-semibold text-[#FF385C] animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyse de l'image (vérification immobilière)...</span>
              </div>
            )}

            {imageError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{imageError}</span>
              </div>
            )}

            {imageSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{imageSuccessMsg}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#ebebeb] dark:border-[#2e2e2e] flex items-center justify-end space-x-3">
            <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-[#222] text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
          >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#FF385C] hover:bg-[#E00B41] text-white transition shadow-md disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{submitting ? 'Publication en cours...' : 'Publier le bien'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};