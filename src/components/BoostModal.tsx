import React, { useState } from 'react';
import { X, Zap, Sparkles, Check, Smartphone, Flame, Star, ShieldAlert, Copy, Clock, Send, MessageCircle, PhoneCall, ArrowLeft } from 'lucide-react';
import { Property } from '../types';
import { addInquiry } from '../services/inquiryService';

export const OFFICIAL_MERCHANT_NUMBERS = {
  mpesa: { name: 'M-Pesa (Vodacom)', number: '+243 986 760 178', holder: 'NyumbaLink / Vodacom' },
  airtel: { name: 'Airtel Money', number: '+243 837 311 568', holder: 'NyumbaLink / Airtel' }
};

interface BoostModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  onBoostSuccess?: (propertyId: string, durationDays: number, planName: string) => void;
}

export const BOOST_PACKAGES = [
  {
    id: 'flash',
    name: 'Flash Boost 7 Jours',
    days: 7,
    priceUSD: 5,
    badge: 'Standard',
    icon: Flame,
    description: 'Place votre annonce en tête des résultats de recherche pendant 1 semaine à Bukavu.',
    perks: [
      'Badge VIP & Sponsorisé',
      'Priorité d’affichage dans sa commune',
      'Compteur de vues accéléré'
    ]
  },
  {
    id: 'toppage',
    name: 'Top Page 15 Jours',
    days: 15,
    priceUSD: 12,
    badge: 'Recommandé',
    isPopular: true,
    icon: Sparkles,
    description: 'En vedette sur la page d’accueil et mise en avant avec marqueur spécial sur la carte.',
    perks: [
      'Position #1 sur la Page d’Accueil',
      'Marqueur surbrillant sur la carte de Bukavu',
      'Badge « Coup de Cœur Sponsorisé »',
      'Inclus dans les résultats de recherche ciblés'
    ]
  },
  {
    id: 'vipgold',
    name: 'VIP Gold Master 30 Jours',
    days: 30,
    priceUSD: 20,
    badge: 'Exclusif',
    icon: Star,
    description: 'Domination complète : présence permanente en tête de liste, carte et notifications.',
    perks: [
      'Toutes les options Top Page pendant 1 mois',
      'Diffusion directe aux abonnés WhatsApp NyumbaLink',
      'Notification envoyée aux chercheurs actifs',
      'Rapport d’audience hebdomadaire'
    ]
  }
];

export const BoostModal: React.FC<BoostModalProps> = ({
  isOpen,
  onClose,
  property,
  onBoostSuccess
}) => {
  const [selectedPkg, setSelectedPkg] = useState(BOOST_PACKAGES[1]);
  const [paymentStep, setPaymentStep] = useState<'packages' | 'payment' | 'success'>('packages');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'airtel'>('mpesa');
  const [phone, setPhone] = useState('+243 ');
  const [transactionRef, setTransactionRef] = useState('');
  const [copiedNum, setCopiedNum] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !property) return null;

  const merchant = OFFICIAL_MERCHANT_NUMBERS[paymentMethod];

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(merchant.number.replace(/\s+/g, ''));
    setCopiedNum(true);
    setTimeout(() => setCopiedNum(false), 2000);
  };

  const handleSelectPackage = (pkg: typeof BOOST_PACKAGES[0]) => {
    setSelectedPkg(pkg);
    setPaymentStep('payment');
  };

  const handlePayBoost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionRef.trim()) return;

    setIsProcessing(true);

    // Record boost inquiry notification for admin
    addInquiry({
      propertyId: property.id,
      propertyTitle: `DEMANDE DE BOOST: ${property.title} (${selectedPkg.name} - $${selectedPkg.priceUSD})`,
      propertyNeighborhood: property.neighborhood,
      senderName: property.agentName || 'Propriétaire/Agent',
      senderPhone: phone || property.agentPhone || '+243 986 760 178',
      message: `Demande de boost d'annonce soumise ! Offre: ${selectedPkg.name} ($${selectedPkg.priceUSD} pour ${selectedPkg.days} jours). Référence SMS reçue: ${transactionRef}. Expéditeur: ${phone}`,
      channel: 'direct'
    });

    setTimeout(() => {
      setIsProcessing(false);
      setPaymentStep('success');
      if (onBoostSuccess) {
        onBoostSuccess(property.id, selectedPkg.days, selectedPkg.name);
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-hidden">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header (Pinned Top) */}
        <div className="sticky top-0 z-30 flex items-center space-x-3 p-4 sm:p-5 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 shrink-0 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Booster l'Annonce</h3>
            <p className="text-xs text-stone-400 truncate max-w-xs sm:max-w-sm">{property.title}</p>
          </div>
        </div>

        {/* Content (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {paymentStep === 'packages' && (
            <div className="space-y-6">
              <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl flex items-center space-x-3 text-xs text-stone-300">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                <span>
                  Les annonces boostées reçoivent en moyenne <strong className="text-amber-400">5x plus de contacts WhatsApp</strong> et d'appels directs à Bukavu.
                </span>
              </div>

              <div className="space-y-4">
                {BOOST_PACKAGES.map((pkg) => {
                  const Icon = pkg.icon;

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => handleSelectPackage(pkg)}
                      className={`relative p-5 rounded-2xl border cursor-pointer transition-all ${
                        pkg.isPopular
                          ? 'bg-gradient-to-r from-amber-950/30 via-stone-900 to-stone-900 border-amber-500/60 shadow-lg shadow-amber-500/10'
                          : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      {pkg.isPopular && (
                        <div className="absolute -top-3 right-4 bg-amber-500 text-stone-950 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                          {pkg.badge}
                        </div>
                      )}

                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2.5 rounded-xl ${pkg.isPopular ? 'bg-amber-500/20 text-amber-400' : 'bg-stone-800 text-stone-400'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{pkg.name}</h4>
                            <p className="text-xs text-stone-400 mt-0.5">{pkg.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-extrabold text-amber-400">${pkg.priceUSD}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-stone-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-300">
                        {pkg.perks.map((perk, i) => (
                          <div key={i} className="flex items-center space-x-1.5">
                            <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{perk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs transition cursor-pointer border border-stone-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}

          {paymentStep === 'payment' && (
            <div className="space-y-6">
              <button
                onClick={() => setPaymentStep('packages')}
                className="text-xs text-stone-400 hover:text-white flex items-center space-x-1"
              >
                ← Choisir un autre pack
              </button>

              <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-amber-400 font-semibold">Booster pour {selectedPkg.days} jours</div>
                  <div className="text-sm font-bold text-white">{selectedPkg.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-amber-400">${selectedPkg.priceUSD}</div>
                </div>
              </div>

              <form onSubmit={handlePayBoost} className="space-y-4">
                {/* Step 1: Direct Discussion with Admin */}
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span>Étape 1 : Discutez d'abord avec l'Administrateur</span>
                  </div>
                  <p className="text-[11px] text-stone-300 leading-relaxed">
                    Avant de payer, vous pouvez échanger avec l'Admin au <strong>+243 986 760 178</strong> sur le boost de votre annonce <strong>"{property.title}"</strong>.
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <a
                      href={`https://wa.me/243986760178?text=${encodeURIComponent(`Bonjour Admin NyumbaLink, je souhaite booster mon annonce "${property.title}" (Pack ${selectedPkg.name} - $${selectedPkg.priceUSD}).`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-xs"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Discuter et Confirmer sur WhatsApp</span>
                    </a>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-2">
                    Étape 2 : Choix du réseau Mobile Money
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'mpesa', name: 'M-Pesa (Vodacom)' },
                      { id: 'airtel', name: 'Airtel Money' }
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id as any)}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                          paymentMethod === pm.id
                            ? 'border-amber-500 bg-amber-950/30 text-white border-2'
                            : 'border-stone-800 bg-stone-950 text-stone-400 hover:border-stone-700'
                        }`}
                      >
                        {pm.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Official Receiver Number */}
                <div className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-stone-400">
                    <span>Compte récepteur officiel ({merchant.name}) :</span>
                    <button
                      type="button"
                      onClick={handleCopyNumber}
                      className="text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1"
                    >
                      {copiedNum ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedNum ? 'Copié !' : 'Copier numéro'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 bg-stone-900 rounded-lg border border-stone-800 flex justify-between items-center">
                    <span className="font-mono font-bold text-white text-sm">{merchant.number}</span>
                    <span className="text-[10px] text-stone-400">{merchant.holder}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Numéro d'expédition Mobile Money
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+243 986 760 178"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500 mb-3"
                  />

                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Référence du SMS de paiement (Code de transaction)
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="Ex: MP240813.1234.H000001"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isProcessing || !transactionRef.trim()}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-stone-950/30 border-t-stone-950 rounded-full animate-spin" />
                        <span>Transmission...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Soumettre & Booster</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTransactionRef('');
                      setPaymentStep('packages');
                    }}
                    className="py-3 px-4 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white font-semibold rounded-xl text-xs transition border border-stone-800 cursor-pointer"
                  >
                    Annuler le paiement
                  </button>
                </div>
              </form>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto animate-bounce">
                <Clock className="w-8 h-8" />
              </div>

              <h3 className="text-2xl font-bold text-white">Demande Transmise à l'Admin !</h3>
              <p className="text-xs text-stone-300 max-w-md mx-auto leading-relaxed">
                Votre référence de paiement <strong className="font-mono text-amber-400">{transactionRef}</strong> a été directement enregistrée dans votre panneau d'administration. L'équipe NyumbaLink confirme l'entrée de <strong>${selectedPkg.priceUSD}</strong> sur le {merchant.number} pour booster <strong className="text-white">"{property.title}"</strong>.
              </p>

              <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-400 space-y-2 text-left max-w-md mx-auto">
                <div className="flex justify-between">
                  <span>Pack sélectionné :</span>
                  <span className="font-bold text-amber-400">{selectedPkg.name} (${selectedPkg.priceUSD})</span>
                </div>
                <div className="flex justify-between">
                  <span>Durée :</span>
                  <span className="font-bold text-white">{selectedPkg.days} Jours</span>
                </div>
                <div className="flex justify-between">
                  <span>Code SMS :</span>
                  <span className="font-mono text-stone-300">{transactionRef}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full max-w-md py-3 bg-stone-800 hover:bg-stone-700 text-white font-bold rounded-xl text-sm transition-colors"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
