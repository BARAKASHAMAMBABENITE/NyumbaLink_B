import React, { useState } from 'react';
import { Building2, Send, CheckCircle2 } from 'lucide-react';
import { addInquiry } from '../services/inquiryService';
import { toggleRegisteredUserPartner } from '../services/activityService';
import { UserProfile } from '../types';

interface PartnerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile | null;
  onPartnerRegistered?: (updatedUser: UserProfile) => void;
}

export const PartnerRegistrationModal: React.FC<PartnerRegistrationModalProps> = ({
  isOpen,
  onClose,
  user,
  onPartnerRegistered
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.fullname || '',
    category: 'déménagement',
    description: '',
    phone: user?.phone || '',
    address: '',
    commune: 'Ibanda'
  });

  if (!isOpen) return null;

  const categoryLabels: Record<string, string> = {
    'déménagement': 'Déménagement & Transport',
    'matériaux': 'Quincaillerie & Matériaux',
    'rénovation': 'Peinture & Rénovation',
    'nettoyage': 'Nettoyage & Entretien',
    'autre': 'Service Habitat'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const catLabel = categoryLabels[formData.category] || 'Partenaire Habitat';
    try {
      addInquiry({
        propertyId: 'partner-request',
        propertyTitle: `Candidature Partenaire : ${formData.name}`,
        propertyNeighborhood: formData.commune,
        senderName: formData.name,
        senderPhone: formData.phone,
        message: `Demande de partenariat (${catLabel}) à Bukavu. Adresse : ${formData.address}, Commune : ${formData.commune}. Description : ${formData.description}`,
        channel: 'direct'
      });

      if (user) {
        const updatedUser: UserProfile = {
          ...user,
          isPartner: true,
          partnerCategory: catLabel,
          partnerApprovedDate: new Date().toISOString()
        };
        localStorage.setItem('nyumba_user', JSON.stringify(updatedUser));
        toggleRegisteredUserPartner(user.uid, true, catLabel);
        if (onPartnerRegistered) {
          onPartnerRegistered(updatedUser);
        }
      }
    } catch (err) {
      console.error('Failed to log partner inquiry:', err);
    }
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1a] border border-slate-200/90 dark:border-[#2e2e2e] rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 bg-slate-50/80 dark:bg-[#151515] border-b border-slate-200 dark:border-[#2e2e2e]">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Devenir Partenaire
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Proposez vos services aux acheteurs et locataires à Bukavu
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                  Nom de l'Entreprise ou Professionnel
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Kivu Express Déménagement"
                  className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl p-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#FF385C]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                    Catégorie de Service
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl p-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                  >
                    <option value="déménagement">Déménagement & Transport</option>
                    <option value="matériaux">Quincaillerie & Matériaux</option>
                    <option value="rénovation">Peinture & Rénovation</option>
                    <option value="nettoyage">Nettoyage & Entretien</option>
                    <option value="autre">Autre Service Habitat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                    Commune Principale
                  </label>
                  <select
                    value={formData.commune}
                    onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl p-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#FF385C]"
                  >
                    <option value="Ibanda">Ibanda</option>
                    <option value="Kadutu">Kadutu</option>
                    <option value="Bagira">Bagira</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                  Description de vos prestations
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Présentez vos services, vos tarifs indicatifs ou vos garanties pour les clients de NyumbaLink..."
                  className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl p-3 text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#FF385C] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                    Téléphone Direct (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+243 970 000 000"
                    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl p-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#FF385C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                    Adresse / Siège à Bukavu
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Ex: Place Ndendere, N° 14"
                    className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl p-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#FF385C]"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-[#252525] dark:hover:bg-[#303030] text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 px-4 bg-[#FF385C] hover:bg-[#E00B41] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-md shadow-[#FF385C]/20 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Soumettre ma candidature</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6 space-y-4">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto animate-bounce" />
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                Candidature Transmise avec Succès !
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                Merci. Votre demande de partenariat a bien été enregistrée. L'équipe NyumbaLink examinera vos coordonnées et vous contactera au <strong>{formData.phone}</strong> pour l'activation.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl hover:opacity-90 transition cursor-pointer"
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
