import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  MessageCircle,
  MapPin,
  Trash2,
  CheckCircle,
  Camera,
  AlertCircle,
  Send,
  X,
  Image as ImageIcon
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
  const [roleAlertMessage, setRoleAlertMessage] = useState<string | null>(null);
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

  useEffect(() => {
    const availableHoods = BUKAVU_COMMUNES_WITH_NEIGHBORHOODS[formCommune] || [];
    if (availableHoods.length > 0 && !availableHoods.includes(formNeighborhood)) {
      setFormNeighborhood(availableHoods[0]);
    }
  }, [formCommune]);

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
      setToastMessage('Votre équipement a été publié avec succès !');
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

    if (!user || (user.role !== 'admin' && user.uid !== items.find(i => i.id === id)?.partnerId)) {
      setRoleAlertMessage("Action non autorisée : Seul l'administrateur ou le propriétaire de l'annonce peut supprimer cet équipement.");
      return;
    }

    try {
      setItems((prev) => prev.filter((i) => i.id !== id));
      const local = getCachedPartnerFurniture().filter((i) => i.id !== id);
      saveCachedPartnerFurniture(local);
      await deletePartnerFurnitureItem(id);

      setToastMessage('Équipement supprimé avec succès.');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting furniture:', err);
      setToastMessage('Erreur lors de la suppression.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

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
        message: senderMessage.trim() || `Bonjour agent, je suis ${senderName.trim()} et je souhaite me renseigner sur le bien "${messagingItem.title}" (${messagingItem.price}$) disponible à ${messagingItem.neighborhood}.`,
        channel: 'direct'
      });

      setMessagingItem(null);
      setSenderMessage('');
      setToastMessage(`Votre message a été transmis directement à ${messagingItem.partnerName} !`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Erreur lors de l’envoi du message.');
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
        
        {/* Header Principal */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-[#2a2a2a] flex items-center justify-between bg-slate-50/50 dark:bg-white/5 shrink-0">
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
            {!showAddForm && (
              <button
                type="button"
                onClick={() => {
                  if (!user && onRequireAuth) {
                    onRequireAuth();
                    return;
                  }
                  if (user && user.role !== 'agent' && user.role !== 'partner' && user.role !== 'admin') {
                    setRoleAlertMessage("Réservé aux Agents et Partenaires : Seuls les comptes Agents, Partenaires ou Administrateurs peuvent publier des équipements.");
                    return;
                  }
                  setShowAddForm(true);
                }}
                className="flex items-center space-x-1.5 px-3.5 sm:px-4 py-2 bg-[#FF385C] hover:bg-[#e00b41] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Publier un Équipement</span>
              </button>
            )}
          </div>
        </div>

        {/* Role Alert Modal */}
        {roleAlertMessage && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#202020] rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-[#333] shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto text-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Avertissement</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{roleAlertMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setRoleAlertMessage(null)}
                className="w-full py-2.5 bg-[#FF385C] hover:bg-[#e00b41] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 text-center flex items-center justify-center space-x-2 shrink-0">
            <CheckCircle className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Formulaire d'Ajout Intégré */}
        {showAddForm && (
          <div className="bg-white dark:bg-[#1e1e1e] border-b border-slate-200 dark:border-[#333] p-6 space-y-4 shrink-0 max-h-[80vh] overflow-y-auto">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Publier un nouvel équipement ou meuble
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Partagez vos équipements et meubles avec la communauté de Bukavu
              </p>
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 text-xs rounded-xl font-medium flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateItem} id="add-furniture-form" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Titre de l'article *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ex: Canapé 3 places en cuir / Frigo Samsung"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#282828] border border-slate-200 dark:border-[#383838] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Catégorie *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as PartnerItemCategory)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#282828] border border-slate-200 dark:border-[#383838] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                  >
                    {categoriesConfig.filter(c => c.id !== 'tous').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Prix ($ USD) *</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ex: 150"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#282828] border border-slate-200 dark:border-[#383838] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">État de l'article</label>
                  <select
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#282828] border border-slate-200 dark:border-[#383838] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                  >
                    <option value="neuf">Neuf</option>
                    <option value="tres_bon_etat">Très bon état</option>
                    <option value="bon_etat">Bon état</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Commune</label>
                  <select
                    value={formCommune}
                    onChange={(e) => setFormCommune(e.target.value as BukavuCommune)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#282828] border border-slate-200 dark:border-[#383838] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                  >
                    {Object.keys(BUKAVU_COMMUNES_WITH_NEIGHBORHOODS).map((commune) => (
                      <option key={commune} value={commune}>{commune}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Quartier / Avenue</label>
                  <select
                    value={formNeighborhood}
                    onChange={(e) => setFormNeighborhood(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#282828] border border-slate-200 dark:border-[#383838] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                  >
                    {(BUKAVU_COMMUNES_WITH_NEIGHBORHOODS[formCommune] || []).map((hood) => (
                      <option key={hood} value={hood}>{hood}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Nom du Vendeur / Partenaire</label>
                  <input
                    type="text"
                    value={formPartnerName}
                    onChange={(e) => setFormPartnerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#282828] border border-slate-200 dark:border-[#383838] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Téléphone / WhatsApp du partenaire</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+243..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#282828] border border-slate-200 dark:border-[#383838] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Description détaillée de l'article</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Décrivez les dimensions, état, couleur, marque, et points forts..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#282828] border border-slate-200 dark:border-[#383838] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                />
              </div>

              {/* Upload Photos Section */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Photos réelles du meuble / équipement</label>
                <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                  <label className="flex items-center space-x-1.5 px-3 py-2 bg-[#FF385C]/10 hover:bg-[#FF385C]/20 text-[#FF385C] text-xs font-bold rounded-xl cursor-pointer transition">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{validatingImage ? 'Vérification IA...' : 'Prendre une photo (Appareil photo)'}</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                  </label>

                  <label className="flex items-center space-x-1.5 px-3 py-2 bg-slate-200 dark:bg-[#2a2a2a] hover:bg-slate-300 dark:hover:bg-[#333] text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer transition">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Importer depuis la galerie</span>
                    <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                {/* Aperçu des photos */}
                {formImages.length > 0 && (
                  <div className="flex items-center space-x-2 pt-1 overflow-x-auto">
                    {formImages.map((img, idx) => (
                      <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-[#333] shrink-0">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormImages(formImages.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-0.5 bg-black/60 text-white rounded-full hover:bg-red-600 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Case de certification */}
              <div className="flex items-start space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="certify-furniture"
                  checked={isCertifiedFurniture}
                  onChange={(e) => setIsCertifiedFurniture(e.target.checked)}
                  className="mt-0.5 rounded text-[#FF385C] focus:ring-[#FF385C]"
                />
                <label htmlFor="certify-furniture" className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight cursor-pointer">
                  Je certifie que cette annonce et ces photos correspondent exclusivement à du mobilier, de l'équipement ou de l'électroménager conforme.
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-[#2a2a2a] hover:bg-slate-300 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || validatingImage}
                  className="px-5 py-2 bg-[#FF385C] hover:bg-[#e00b41] text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Publication en cours...' : "Publier l'annonce"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search & Categories Bar */}
        <div className="p-4 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-[#2a2a2a] space-y-3 shrink-0">
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

        {/* Items Grid & Content Area */}
        <div className="p-5 overflow-y-auto flex-1 min-h-[350px]">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#FF385C] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-semibold">Chargement des équipements disponibles...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="text-4xl">🛋️</div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Aucun équipement trouvé</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">Essayez de modifier vos critères de recherche ou publiez le premier article de cette catégorie.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-200 dark:border-[#333] overflow-hidden shadow-xs hover:shadow-md transition flex flex-col">
                  <div className="relative h-40 bg-slate-100 dark:bg-[#2c2c2c]">
                    <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold rounded-lg">
                      {item.price} $
                    </span>
                    {(user?.role === 'admin' || user?.uid === item.partnerId) && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, item.id)}
                        className="absolute top-2.5 right-2.5 p-1.5 bg-red-600/90 text-white rounded-lg hover:bg-red-700 transition cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-[#FF385C] shrink-0" />
                        <span className="truncate">{item.neighborhood}, {item.commune}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMessagingItem(item)}
                      className="w-full py-2 bg-[#FF385C]/10 hover:bg-[#FF385C]/20 text-[#FF385C] text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Contacter le Partenaire</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bouton Annuler ajouté à la fin, après les équipements publiés */}
          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-[#2a2a2a] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-200 dark:bg-[#2a2a2a] hover:bg-slate-300 dark:hover:bg-[#333] text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </div>

        {/* Modal de contact direct partenaire */}
        {messagingItem && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#202020] rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-[#333] shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Contacter le partenaire</h4>
                <button
                  type="button"
                  onClick={() => setMessagingItem(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center space-x-3">
                <img src={messagingItem.images[0]} alt="" className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">{messagingItem.title}</h5>
                  <p className="text-[11px] text-[#FF385C] font-semibold">{messagingItem.price} $ • {messagingItem.partnerName}</p>
                </div>
              </div>

              <form onSubmit={handleSendMessage} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Votre Nom *</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#2c2c2c] border border-slate-200 dark:border-[#333] rounded-xl text-xs text-slate-900 dark:text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Votre Téléphone *</label>
                  <input
                    type="text"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#2c2c2c] border border-slate-200 dark:border-[#333] rounded-xl text-xs text-slate-900 dark:text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Votre Message</label>
                  <textarea
                    rows={3}
                    value={senderMessage}
                    onChange={(e) => setSenderMessage(e.target.value)}
                    placeholder="Je suis intéressé par cet article..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#2c2c2c] border border-slate-200 dark:border-[#333] rounded-xl text-xs text-slate-900 dark:text-white mt-1"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sendingMessage}
                  className="w-full py-2.5 bg-[#FF385C] hover:bg-[#e00b41] text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingMessage ? 'Envoi en cours...' : 'Envoyer le message'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};