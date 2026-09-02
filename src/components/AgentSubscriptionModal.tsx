import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  DollarSign,
  Building2,
  Crown,
  Clock,
  Send,
  MessageCircle,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import {
  AgentSubscriptionPlan,
  AGENT_SUBSCRIPTION_PLANS,
  UserProfile,
  UserRole
} from '../types';
import { RegisteredUser } from '../services/activityService';

interface AgentSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: RegisteredUser | UserProfile | null;
  isAdminMode?: boolean;
  onConfirmSubscription?: (
    plan: AgentSubscriptionPlan,
    priceUSD: number,
    agentExpiresAt: string,
    agencyName: string
  ) => void;
}

export const AgentSubscriptionModal: React.FC<AgentSubscriptionModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  isAdminMode = false,
  onConfirmSubscription
}) => {
  if (!isOpen) return null;

  const [selectedPlanId, setSelectedPlanId] = useState<AgentSubscriptionPlan>('1_month');
  const [agencyName, setAgencyName] = useState(
    targetUser?.agencyName || (targetUser?.fullname ? `Agence ${targetUser.fullname}` : 'Agence Immobilière Agréée')
  );
  const [submitting, setSubmitting] = useState(false);

  const selectedPlan = AGENT_SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) || AGENT_SUBSCRIPTION_PLANS[0];

  // Calculate expiration date from today based on durationDays
  const calculateExpirationDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  };

  const calculatedExpiresAt = calculateExpirationDate(selectedPlan.durationDays);

  const formattedExpiration = calculatedExpiresAt.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onConfirmSubscription) return;
    setSubmitting(true);
    try {
      onConfirmSubscription(
        selectedPlan.id,
        selectedPlan.priceUSD,
        calculatedExpiresAt.toISOString(),
        agencyName.trim()
      );
      onClose();
    } catch (err) {
      console.error('Error setting agent subscription:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Bonjour Administration NyumbaLink Bukavu, je souhaite souscrire à l'abonnement Agent Immobilier pour mon compte ${targetUser?.email || ''} (Formule : ${selectedPlan.label} - ${selectedPlan.priceUSD}$). Merci de m'indiquer la procédure de paiement Airtel Money / M-Pesa.`
    );
    window.open(`https://wa.me/243986760178?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#1e1e1e] rounded-3xl shadow-2xl border border-[#ebebeb] dark:border-[#2e2e2e] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#222222] via-[#2d2d2d] to-[#1a1a1a] p-6 text-white relative">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FF385C] flex items-center justify-center text-white shadow-lg shadow-[#FF385C]/30">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">
                {isAdminMode ? 'Activation / Renouvellement Abonnement Agent' : 'Devenir Agent Immobilier Agréé'}
              </h2>
              <p className="text-xs text-white/80 mt-0.5">
                {isAdminMode
                  ? `Gestion du forfait pour ${targetUser?.fullname || targetUser?.email || 'l’utilisateur'}`
                  : 'Publication sécurisée, catalogue vérifié et visibilité maximale à Bukavu'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {/* User target summary if in admin mode */}
          {isAdminMode && targetUser && (
            <div className="p-3.5 bg-[#f7f7f7] dark:bg-[#121212] rounded-2xl border border-[#ebebeb] dark:border-[#2e2e2e] flex items-center justify-between">
              <div>
                <p className="text-xs text-[#717171] dark:text-[#b0b0b0]">Bénéficiaire du compte :</p>
                <p className="text-sm font-bold text-[#222222] dark:text-[#f7f7f7]">{targetUser.fullname}</p>
                <p className="text-xs text-[#717171] dark:text-[#b0b0b0]">{targetUser.email}</p>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FF385C]/10 text-[#FF385C] border border-[#FF385C]/20 uppercase">
                  {targetUser.role === 'agent' ? 'Agent Immobilier' : targetUser.role === 'bailleur' ? 'Bailleur' : targetUser.role === 'admin' ? 'Administrateur' : 'Client'}
                </span>
              </div>
            </div>
          )}

          {/* Client Explanation banner if not admin */}
          {!isAdminMode && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                <strong className="block font-bold mb-0.5">Publication réservée aux professionnels accrédités :</strong>
                Afin de garantir la sécurité des transactions et d'éviter les fausses annonces à Bukavu, seuls les agents ayant souscrit à un forfait agréé peuvent publier des biens.
              </div>
            </div>
          )}

          {/* Plans Selection Cards */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#717171] dark:text-[#b0b0b0] mb-3">
              Choisissez la formule d'abonnement :
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {AGENT_SUBSCRIPTION_PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#FF385C] bg-[#FF385C]/5 dark:bg-[#FF385C]/10 ring-2 ring-[#FF385C]/20 shadow-md scale-[1.02]'
                        : 'border-[#ebebeb] dark:border-[#2e2e2e] bg-white dark:bg-[#1e1e1e] hover:border-slate-300'
                    }`}
                  >
                    {plan.id === '3_months' && (
                      <span className="absolute -top-2.5 right-3 bg-[#FF385C] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                        Populaire
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-black text-[#222222] dark:text-[#f7f7f7]">
                          {plan.label}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-[#FF385C] bg-[#FF385C]'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>

                      <div className="my-2">
                        <span className="text-2xl font-black text-[#222222] dark:text-[#f7f7f7]">
                          ${plan.priceUSD}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#717171] dark:text-[#b0b0b0] leading-snug">
                        {plan.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#ebebeb] dark:border-[#2e2e2e] flex items-center space-x-1 text-[10px] font-bold text-[#FF385C]">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Validité {plan.durationDays} jours</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expiration Preview Card */}
          <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#161616] dark:to-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#717171] dark:text-[#b0b0b0] flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-[#FF385C]" />
                <span>Période de validité accordée :</span>
              </span>
              <strong className="font-extrabold text-[#222222] dark:text-[#f7f7f7]">
                {selectedPlan.durationDays} jours ({selectedPlan.label})
              </strong>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#717171] dark:text-[#b0b0b0] flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-[#FF385C]" />
                <span>Date d'expiration calculée :</span>
              </span>
              <strong className="font-extrabold text-slate-900 dark:text-white">
                {formattedExpiration}
              </strong>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[#717171] dark:text-[#b0b0b0] flex items-center space-x-1.5">
                <DollarSign className="w-4 h-4 text-[#FF385C]" />
                <span>Tarif officiel de l'abonnement :</span>
              </span>
              <strong className="text-base font-black text-[#FF385C]">
                ${selectedPlan.priceUSD} USD
              </strong>
            </div>
          </div>

          {/* Agency Name Input (for Admin setup) */}
          {isAdminMode && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#717171] dark:text-[#b0b0b0] mb-1.5">
                Nom commercial de l'Agence Immobilière :
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[#717171] absolute left-3 top-3" />
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="Ex: Kivu Immo Service, Mufasa Agency..."
                  className="w-full pl-9 pr-4 py-2.5 bg-[#f7f7f7] dark:bg-[#121212] border border-[#ebebeb] dark:border-[#2e2e2e] rounded-xl text-xs font-semibold text-[#222222] dark:text-[#f7f7f7] focus:outline-none focus:border-[#FF385C]"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-[#ebebeb] dark:border-[#2e2e2e] flex flex-col sm:flex-row items-center gap-3">
            {isAdminMode ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#ebebeb] dark:border-[#2e2e2e] text-xs font-bold text-[#717171] hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleAdminSubmit}
                  disabled={submitting}
                  className="w-full sm:flex-1 bg-gradient-to-r from-[#FF385C] to-[#E00B41] hover:opacity-95 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-md hover:shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  <span>
                    {submitting
                      ? 'Activation en cours...'
                      : `Valider le Forfait (${selectedPlan.label} - ${selectedPlan.priceUSD}$)`}
                  </span>
                </button>
              </>
            ) : (
              <div className="w-full flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-[#ebebeb] dark:border-[#2e2e2e] text-xs font-bold text-[#717171] hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppContact}
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs hover:shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer flex-1"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Souscrire via WhatsApp (${selectedPlan.priceUSD} USD - {selectedPlan.label})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
