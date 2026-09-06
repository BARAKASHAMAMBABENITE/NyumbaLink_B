import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  MessageCircle,
  Sparkles,
  Tag,
  MapPin,
  Trash2,
  CheckCircle,
  Package,
  Layers,
  Upload,
  Camera,
  AlertCircle,
  Send,
  User,
  Phone,
  Mail,
  ShieldCheck,
  RefreshCw,
  X
} from 'lucide-react';
import { PartnerFurnitureItem, PartnerItemCategory, UserProfile, BukavuCommune } from '../types';
import {
  fetchAllPartnerFurniture,
  addPartnerFurnitureItem,
  deletePartnerFurnitureItem,
  getCachedPartnerFurniture,
  saveCachedPartnerFurniture
} from '../services/partnerFurnitureService';
import { BUKAVU_COMMUNES_WITH_NEIGHBORHOODS } from '../data/initialProperties';
import { validateFurnitureImageWithAI } from '../services/imageValidationService';
import { addInquiry } from '../services/inquiryService';

interface PartnerFurnitureModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onRequireAuth?: () => void;
}

export const PartnerFurnitureModal: React.FC<PartnerFurnitureModalProps> = ({
  isOpen,
  onClose,
  user,
  onRequireAuth
}) => {
  const [items, setItems] = useState<PartnerFurnitureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [validatingImage, setValidatingImage] = useState(false);

  // Message NyumbaLink modal state
  const [messagingItem, setMessagingItem] = useState<PartnerFurnitureItem | null>(null);
  const [senderName, setSenderName] = useState(user?.fullname || '');
  const [senderPhone, setSenderPhone] = useState(user?.phone || '');
  const [senderEmail, setSenderEmail] = useState(user?.email || '');
  const [senderMessage, setSenderMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Add Item Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<PartnerItemCategory>('canape');
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [formCondition, setFormCondition] = useState<'neuf' | 'tres_bon_etat' | 'bon_etat'>('tres_bon_etat');
  const [formCommune, setFormCommune] = useState<BukavuCommune>('Ibanda');
  const [formNeighborhood, setFormNeighborhood] = useState<string>('Nguba');
  const [formDescription, setFormDescription] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formPhone, setFormPhone] = useState(user?.phone || '+243986760178');
  const [formPartnerName, setFormPartnerName] = useState(user?.fullname || 'Partenaire NyumbaLink');
  const [formError, setFormError] = useState<string | null>(null);
  const [isCertifiedFurniture, setIsCertifiedFurniture] = useState<boolean>(true);

  // Categories list
  const categoriesConfig: { id: string; label: string; icon: string }[] = [
    { id: 'tous', label: 'Tous les Biens', icon: '✨' },
    { id: 'canape', label: 'Canapés & Salons', icon: '🛋️' },
    { id: 'table', label: 'Tables & Bureaux', icon: '🪑' },
    { id: 'armoire', label: 'Armoires & Penderies', icon: '🚪' },
    { id: 'etagere', label: 'Étagères & Rangements', icon: '📚' },
    { id: 'chaise', label: 'Chaises & Fauteuils', icon: '🪑' },
    { id: 'congelateur', label: 'Congélateurs & Frigos', icon: '❄️' },
    { id: 'lit', label: 'Lits & Matelas', icon: '🛏️' },
    { id: 'electromenager', label: 'Électroménager', icon: '🔌' },
    { id: 'autre', label: 'Autres Équipements', icon: '📦' }
  ];

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAllPartnerFurniture();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (user) {
      if (!senderName) setSenderName(user.fullname);
      if (!senderPhone && user.phone) setSenderPhone(user.phone);
      if (!senderEmail && user.email) setSenderEmail(user.email);
      if (!formPartnerName) setFormPartnerName(user.fullname);
      if (user.phone) setFormPhone(user.phone);
    }
  }, [user]);

  // Keep official neighborhoods synchronized with selected Commune
  useEffect(() => {
    const availableHoods = BUKAVU_COMMUNES_WITH_NEIGHBORHOODS[formCommune] || [];
    if (availableHoods.length > 0 && !availableHoods.includes(formNeighborhood)) {
      setFormNeighborhood(availableHoods[0]);
    }
  }, [formCommune]);

  // Handle image upload with AI verification
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setFormError(null);
    setValidatingImage(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.startsWith('image/')) {
        setFormError('Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP).');
        setValidatingImage(false);
        continue;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        if (reader.result) {
          const base64 = reader.result as string;

          try {
            const val = await validateFurnitureImageWithAI(base64);
            if (!val.isFurniture && !val.isRealEstate) {
              setFormError(val.reason || "Photo refusée : Cette image ne représente pas un meuble ou équipement de maison.");
              setValidatingImage(false);
              return;
            }
          } catch (err) {
            console.warn('AI validation check bypassed:', err);
          }

          setFormImages((prev) => [...prev, base64]);
          setValidatingImage(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle.trim()) {
      setFormError("Veuillez saisir le titre ou nom de l'équipement.");
      return;
    }
    if (!formPrice || Number(formPrice) <= 0) {
      setFormError("Veuillez indiquer un prix valide en USD.");
      return;
    }

    if (!isCertifiedFurniture) {
      setFormError("Veuillez certifier que l'article correspond bien à un meuble ou équipement de maison.");
      return;
    }

    const defaultImagesMap: Record<PartnerItemCategory, string> = {
      canape: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
      table: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
      armoire: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
      etagere: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80',
      chaise: 'https://images.unsplash.com/photo-1580481077189-63e527027d7d?auto=format&fit=crop&w=800&q=80',
      congelateur: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
      refrigerateur: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
      lit: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
      electromenager: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
      autre: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'
    };

    const finalImages = formImages.length > 0 ? formImages : [defaultImagesMap[formCategory] || defaultImagesMap.canape];

    setSubmitting(true);
    try {
      const newItem = await addPartnerFurnitureItem({
        title: formTitle.trim(),
        category: formCategory,
        price: Number(formPrice),
        condition: formCondition,
        description: formDescription.trim() || `Équipement de qualité disponible à ${formNeighborhood}, Bukavu.`,
        commune: formCommune,
        neighborhood: formNeighborhood,
        images: finalImages,
        partnerId: user?.uid || 'partner-ben',
        partnerName: formPartnerName.trim() || user?.fullname || 'Partenaire NyumbaLink',
        partnerPhone: formPhone.trim() || '+243986760178',
        partnerEmail: user?.email || '',
        isAvailable: true
      });

      setItems((prev) => [newItem, ...prev]);
      setShowAddForm(false);
      setFormTitle('');
      setFormPrice('');
      setFormDescription('');
      setFormImages([]);
      setToastMessage('Votre équipement a été publié avec succès dans Partenaires Mobilier & Équipements !');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setFormError("Erreur lors de la publication de l'équipement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      setItems((prev) => prev.filter((i) => i.id !== id));
      const local = getCachedPartnerFurniture().filter((i) => i.id !== id);
      saveCachedPartnerFurniture(local);
      await deletePartnerFurnitureItem(id);

      setToastMessage('Équipement supprimé avec succès.');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting furniture:', err);
      setToastMessage('Équipement retiré de la liste.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Handle NyumbaLink internal message submit
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messagingItem) return;

    if (!senderName.trim() || !senderPhone.trim()) {
      alert('Veuillez renseigner votre nom et votre numéro de téléphone.');
      return;
    }

    setSendingMessage(true);
    try {
      await addInquiry({
        propertyId: messagingItem.id,
        propertyTitle: `[Mobilier] ${messagingItem.title}`,
        propertyNeighborhood: `${messagingItem.neighborhood}, ${messagingItem.commune}`,
        propertyCommune: messagingItem.commune,
        propertyPrice: messagingItem.price,
        propertyImage: messagingItem.images[0],
        propertyOwnerId: messagingItem.partnerId,
        recipientId: messagingItem.partnerId,
        propertyOwnerName: messagingItem.partnerName,
        propertyOwnerPhone: messagingItem.partnerPhone,
        propertyOwnerEmail: messagingItem.partnerEmail,
        senderUid: user?.uid,
        senderName: senderName.trim(),
        senderPhone: senderPhone.trim(),
        senderEmail: senderEmail.trim() || undefined,
        message: senderMessage.trim() || `Bonjour ${messagingItem.partnerName}, je suis intéressé par votre article "${messagingItem.title}" (${messagingItem.price}$) disponible à ${messagingItem.neighborhood}. Pouvons-nous échanger ?`,
        channel: 'direct'
      });

      setMessagingItem(null);
      setSenderMessage('');
      setToastMessage(`Votre message a été transmis directement à ${messagingItem.partnerName} sur NyumbaLink !`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Erreur lors de l’envoi du message. Veuillez réessayer ou contacter directement via WhatsApp.');
    } finally {
      setSendingMessage(false);
    }
  };

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    const matchCategory = selectedCategory === 'tous' || item.category === selectedCategory;
    const matchQuery =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.commune.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-[#181818] rounded-3xl border border-slate-200 dark:border-[#2e2e2e] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-[#2a2a2a] flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF385C]/10 dark:bg-[#FF385C]/20 flex items-center justify-center text-xl">
              🛋️
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Partenaires Mobilier & Équipements
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Consultez et contactez les partenaires pour vos meubles et équipements à Bukavu
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                if (!user && onRequireAuth) {
                  onRequireAuth();
                  return;
                }
                setShowAddForm(!showAddForm);
              }}
              className="flex items-center space-x-1.5 px-3.5 sm:px-4 py-2 bg-[#FF385C] hover:bg-[#e00b41] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'Fermer le formulaire' : 'Publier un Équipement'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 text-center flex items-center justify-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Add Form Drawer */}
        {showAddForm && (
          <div className="p-5 bg-slate-50 dark:bg-[#202020] border-b border-slate-200 dark:border-[#333] max-h-[70vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Package className="w-4 h-4 text-[#FF385C]" />
                <span>Publier un nouveau meuble ou équipement à Bukavu</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Visible par tous les clients et bailleurs
              </span>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Nom / Titre du bien
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Canapé d'angle en cuir, Table 6 chaises, Congélateur 200L..."
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#151515] border border-slate-200 dark:border-[#333] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Catégorie
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as PartnerItemCategory)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#151515] border border-slate-200 dark:border-[#333] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                  >
                    <option value="canape">🛋️ Canapé / Salon</option>
                    <option value="table">🪑 Table / Bureau</option>
                    <option value="armoire">🚪 Armoire / Penderie</option>
                    <option value="etagere">📚 Étagère / Rangement</option>
                    <option value="chaise">🪑 Chaises / Tabourets</option>
                    <option value="congelateur">❄️ Congélateur / Frigo</option>
                    <option value="lit">🛏️ Lit / Matelas</option>
                    <option value="electromenager">🔌 Électroménager</option>
                    <option value="autre">📦 Autre Équipement</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Prix ($ USD)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Ex: 150"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-white dark:bg-[#151515] border border-slate-200 dark:border-[#333] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    État du bien
                  </label>
                  <select
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#151515] border border-slate-200 dark:border-[#333] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                  >
                    <option value="neuf">✨ Neuf (Jamais utilisé)</option>
                    <option value="tres_bon_etat">👍 Très bon état</option>
                    <option value="bon_etat">👌 Bon état (Occasion)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Commune (Bukavu)
                  </label>
                  <select
                    value={formCommune}
                    onChange={(e) => setFormCommune(e.target.value as BukavuCommune)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#151515] border border-slate-200 dark:border-[#333] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                  >
                    <option value="Ibanda">Ibanda</option>
                    <option value="Kadutu">Kadutu</option>
                    <option value="Bagira">Bagira</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Quartier (Officiel)
                  </label>
                  <select
                    value={formNeighborhood}
                    onChange={(e) => setFormNeighborhood(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#151515] border border-slate-200 dark:border-[#333] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                  >
                    {(BUKAVU_COMMUNES_WITH_NEIGHBORHOODS[formCommune] || []).map((hood) => (
                      <option key={hood} value={hood}>
                        {hood}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Nom du Vendeur / Partenaire
                  </label>
                  <input
                    type="text"
                    value={formPartnerName}
                    onChange={(e) => setFormPartnerName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#151515] border border-slate-200 dark:border-[#333] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Téléphone / WhatsApp du Partenaire
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+243986760178"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#151515] border border-slate-200 dark:border-[#333] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Description détaillée de l'article
                </label>
                <textarea
                  rows={2}
                  placeholder="Décrivez les dimensions, matière, couleur, marque, et points forts..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#151515] border border-slate-200 dark:border-[#333] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                />
              </div>

              {/* Photos & AI Verification */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Photos réelles du meuble / équipement
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Contrôle IA Mobilier Actif</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#FF385C]/10 hover:bg-[#FF385C]/20 text-[#FF385C] text-xs font-bold rounded-xl cursor-pointer transition border border-[#FF385C]/30">
                    <Camera className="w-4 h-4" />
                    <span>Prendre une photo (Appareil photo)</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                  </label>

                  <label className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-200 dark:bg-[#2c2c2c] hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importer depuis la galerie</span>
                    <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>

                  {validatingImage && (
                    <span className="text-xs text-[#FF385C] flex items-center space-x-1.5 animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Vérification IA de la photo...</span>
                    </span>
                  )}
                </div>

                {formImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {formImages.map((img, idx) => (
                      <div key={idx} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-slate-300 dark:border-[#444]">
                        <img src={img} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Certification Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCertifiedFurniture}
                      onChange={(e) => setIsCertifiedFurniture(e.target.checked)}
                      className="mt-0.5 rounded text-[#FF385C] focus:ring-[#FF385C]"
                    />
                    <span>
                      Je certifie que cette annonce et ces photos correspondent exclusivement à du <strong>mobilier, de l'équipement ou de l'électroménager</strong> conforme.
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-[#333]">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-[#333] text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || validatingImage}
                  className="px-5 py-2 bg-[#FF385C] hover:bg-[#e00b41] text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Publication...' : 'Publier l’Équipement'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search & Categories Bar */}
        <div className="p-4 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-[#2a2a2a] space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher canapé, table, congélateur, armoire, quartier..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#333] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#FF385C]"
              />
            </div>
          </div>

          {/* Categories Pill List */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {categoriesConfig.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-[#202020] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#333] hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="p-5 overflow-y-auto flex-1 max-h-[60vh]">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#FF385C] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-semibold">Chargement des équipements disponibles...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="text-4xl">🛋️</div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Aucun équipement ne correspond à votre recherche
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Soyez le premier à publier une table, armoire, canapé ou congélateur dans cette catégorie !
              </p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-[#FF385C] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Publier un article
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map((item) => {
                const conditionBadge =
                  item.condition === 'neuf'
                    ? { text: 'Neuf', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' }
                    : item.condition === 'tres_bon_etat'
                    ? { text: 'Très bon état', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' }
                    : { text: 'Bon état', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' };

                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#2e2e2e] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Image container */}
                      <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <img
                          src={item.images[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 flex items-center space-x-1">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase shadow-xs ${conditionBadge.color}`}>
                            {conditionBadge.text}
                          </span>
                        </div>
                        <div className="absolute top-2.5 right-2.5">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                            {item.price}$
                          </span>
                        </div>

                        {/* Bouton de suppression si l'utilisateur est le propriétaire */}
                        {user && (user.uid === item.partnerId || user.role === 'admin') && (
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, item.id)}
                            className="absolute bottom-2.5 right-2.5 p-2 bg-red-600/90 hover:bg-red-700 text-white rounded-xl shadow-md transition cursor-pointer"
                            title="Supprimer l'article"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Content details */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center space-x-1 font-semibold text-[#FF385C]">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{item.neighborhood}, {item.commune}</span>
                          </span>
                          <span>Par {item.partnerName}</span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                          {item.title}
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Footer Actions (WhatsApp & NyumbaLink Message) */}
                    <div className="p-4 pt-0 grid grid-cols-2 gap-2 mt-2">
                      <a
                        href={`https://wa.me/${item.partnerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Bonjour ${item.partnerName}, je suis intéressé par votre article "${item.title}" (${item.price}$) vu sur NyumbaLink.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          if (!user && onRequireAuth) {
                            onRequireAuth();
                            return;
                          }
                          setMessagingItem(item);
                        }}
                        className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-[#FF385C] hover:bg-[#e00b41] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Message</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Interne d'Envoi de Message NyumbaLink */}
        {messagingItem && (
          <div className="absolute inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#202020] rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-[#333] shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2a2a2a] pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FF385C]/10 flex items-center justify-center text-[#FF385C]">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Contacter {messagingItem.partnerName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMessagingItem(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendMessage} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Votre Nom complet
                  </label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-[#333] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Votre Téléphone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-[#333] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Votre Message
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={senderMessage}
                    onChange={(e) => setSenderMessage(e.target.value)}
                    placeholder={`Bonjour, je suis intéressé par votre article "${messagingItem.title}" (${messagingItem.price}$). Est-il toujours disponible ?`}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-[#333] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMessagingItem(null)}
                    className="px-4 py-2 border border-slate-200 dark:border-[#333] text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={sendingMessage}
                    className="px-5 py-2 bg-[#FF385C] hover:bg-[#e00b41] text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {sendingMessage ? 'Envoi...' : 'Envoyer le message'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};