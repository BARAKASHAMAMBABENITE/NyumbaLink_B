import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Mail,
  Trash2,
  CheckCheck,
  ExternalLink,
  MapPin,
  Clock,
  Send,
  Calendar,
  Check,
  Copy,
  CornerDownRight,
  Building2,
  FileText,
  AlertTriangle,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import {
  InquiryMessage,
  getUserInquiries,
  markInquiryAsRead,
  deleteInquiry,
  replyToInquiry
} from '../services/inquiryService';
import {
  RentalContract,
  getUserContracts,
  getContractNotifications,
  getDaysRemaining
} from '../services/contractService';
import { UserProfile } from '../types';

interface InquiryNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile | null;
  onNavigateToContracts?: () => void;
}

export const InquiryNotificationsModal: React.FC<InquiryNotificationsModalProps> = ({
  isOpen,
  onClose,
  user,
  onNavigateToContracts
}) => {
  const [activeCategory, setActiveCategory] = useState<'messages' | 'contracts'>('messages');
  const [inquiries, setInquiries] = useState<InquiryMessage[]>([]);
  const [contractAlerts, setContractAlerts] = useState<{
    pending: { contract: RentalContract; role: 'tenant' | 'landlord' | 'admin'; message: string }[];
    confirmed: { contract: RentalContract; role: 'tenant' | 'landlord' | 'admin'; message: string }[];
    expired: { contract: RentalContract; role: 'tenant' | 'landlord' | 'admin'; message: string }[];
    expiringSoon: { contract: RentalContract; role: 'tenant' | 'landlord' | 'admin'; message: string }[];
    totalAlerts: number;
  }>({ pending: [], confirmed: [], expired: [], expiringSoon: [], totalAlerts: 0 });

  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'replied'>('all');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) {
      setInquiries([]);
      setContractAlerts({ pending: [], confirmed: [], expired: [], expiringSoon: [], totalAlerts: 0 });
      return;
    }

    const [loaded, alerts] = await Promise.all([
      getUserInquiries(user),
      getContractNotifications(user)
    ]);

    setInquiries(Array.isArray(loaded) ? loaded : []);
    setContractAlerts(alerts ?? { pending: [], confirmed: [], expired: [], expiringSoon: [], totalAlerts: 0 });
  };

  useEffect(() => {
    if (isOpen) {
      void loadData();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const unreadMessagesCount = Array.isArray(inquiries) ? inquiries.filter((i) => !i.isRead).length : 0;
  const totalContractAlerts = contractAlerts.totalAlerts;

  const filteredInquiries = inquiries.filter((item) => {
    if (filterTab === 'unread') return !item.isRead;
    if (filterTab === 'replied') return Boolean(item.agentReply);
    return true;
  });

  const handleMarkAsRead = async (id: string) => {
    if (!user?.uid) return;
    await markInquiryAsRead(id, user.uid);
    await loadData();
  };

  // Marque tous les messages non lus comme lus sans nécessiter de nouvel export
  const handleMarkAllMessagesAsRead = async () => {
    if (!user?.uid) return;
    const unreadItems = inquiries.filter((i) => !i.isRead);
    if (unreadItems.length === 0) return;
    await Promise.all(unreadItems.map((item) => markInquiryAsRead(item.id, user.uid)));
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (!user?.uid) return;
    await deleteInquiry(id, user.uid);
    await loadData();
  };

  const handleSendReply = async (id: string) => {
    if (!replyText.trim()) return;
    const authorName = user?.fullname || (user?.role === 'agent' ? 'Agent NyumbaLink' : 'Support NyumbaLink');
    await replyToInquiry(id, replyText, authorName, user?.uid);
    await loadData();
    setReplyingToId(null);
    setReplyText('');
  };

  const isClientView = user?.role === 'client';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 dark:border-white/10 relative max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                  Centre de Notifications & Messages
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isClientView
                  ? 'Échanges directs et alertes d\'échéances de baux'
                  : 'Demandes de visites, messages et suivis de vos contrats'}
              </p>
            </div>
          </div>

          {/* Bouton fermer (croix d'en-tête bien visible) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer les notifications"
            className="shrink-0 w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-800 dark:text-gray-100 flex items-center justify-center transition cursor-pointer border border-gray-200/80 dark:border-white/10"
          >
            <span className="text-xl leading-none font-bold">×</span>
          </button>
        </div>

        {/* Category Switcher: Messages vs Contract Alerts */}
        <div className="grid grid-cols-2 gap-2 my-3 p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5">
          <button
            type="button"
            onClick={() => setActiveCategory('messages')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeCategory === 'messages'
                ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Messages & Visites</span>
            {unreadMessagesCount > 0 && (
              <span className="bg-[#FF385C] text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('contracts')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeCategory === 'contracts'
                ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Alertes & Échéances de Location</span>
            {totalContractAlerts > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {totalContractAlerts}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: MESSAGES */}
        {activeCategory === 'messages' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Filter Tabs & Bouton Tout marquer comme vu */}
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-white/10 gap-2 flex-wrap">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    filterTab === 'all'
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Tous ({inquiries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('unread')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    filterTab === 'unread'
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Non lus ({inquiries.filter((i) => !i.isRead).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('replied')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    filterTab === 'replied'
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Avec réponses ({inquiries.filter((i) => Boolean(i.agentReply)).length})
                </button>
              </div>

              {unreadMessagesCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllMessagesAsRead}
                  className="text-xs font-bold text-[#FF385C] hover:bg-[#FF385C]/10 px-2.5 py-1 rounded-xl flex items-center space-x-1 transition cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Tout marquer comme vu</span>
                </button>
              )}
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {filteredInquiries.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="font-bold text-sm">
                    {filterTab === 'unread'
                      ? 'Aucun message non lu.'
                      : isClientView
                      ? 'Vous n\'avez encore envoyé aucune demande.'
                      : 'Aucun message reçu pour le moment.'}
                  </p>
                  <p className="text-xs mt-1">
                    {isClientView
                      ? 'Vos demandes de contact ou de visite pour les biens apparaîtront ici.'
                      : 'Les messages des clients intéressés par vos biens apparaîtront ici.'}
                  </p>
                </div>
              ) : (
                filteredInquiries.map((item) => {
                  const isPartnerRequest =
                    item.propertyId === 'partner-request' ||
                    item.propertyId === 'b2b-partner-request' ||
                    (item.propertyTitle || '').toLowerCase().includes('partenaire');
                  const clientName = item.senderName === 'Client WhatsApp' ? 'Client' : item.senderName;
                  const appointmentDetails = item.visitDate
                    ? ` le ${item.visitDate}${item.visitTime ? ` à ${item.visitTime}` : ''}`
                    : item.visitTime
                    ? ` à ${item.visitTime}`
                    : '';

                  let digits = (item.senderPhone || '').replace(/\D/g, '');
                  if (digits.startsWith('0')) {
                    digits = '243' + digits.substring(1);
                  } else if (!digits.startsWith('243') && digits.length === 9) {
                    digits = '243' + digits;
                  }
                  const cleanDigits = digits;
                  const agentDigits = (item.propertyOwnerPhone || '').replace(/\D/g, '');
                  const whatsappDigits = isClientView ? agentDigits : cleanDigits;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isPartnerRequest
                          ? 'bg-amber-500/5 border-amber-500/20'
                          : !item.isRead
                          ? 'bg-[#FF385C]/5 border-[#FF385C]/20'
                          : 'bg-gray-50 dark:bg-[#161616] border-gray-100 dark:border-white/5'
                      }`}
                    >
                      {/* Header info */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                              {isClientView ? `Demande pour l'Agent` : clientName}
                            </span>
                            {isPartnerRequest ? (
                              <span className="bg-amber-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <Building2 className="w-3 h-3" />
                                <span>Partenaire</span>
                              </span>
                            ) : !item.isRead ? (
                              <span className="bg-[#FF385C] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                                Nouveau
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[11px] font-semibold text-[#FF385C] flex items-center space-x-1 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>{item.propertyTitle || 'Bien immobilier'} ({item.propertyNeighborhood || 'Bukavu'})</span>
                          </p>
                        </div>

                        <span className="text-[10px] text-gray-400 flex items-center shrink-0">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Visit Date Info */}
                      {(item.visitDate || item.visitTime) && (
                        <div className="mb-2 p-2.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs flex items-center space-x-2 text-gray-900 dark:text-white">
                          <Calendar className="w-4 h-4 text-[#FF385C] shrink-0" />
                          <span className="font-bold text-[11px]">
                            Rendez-vous : {item.visitDate || 'À convenir'} {item.visitTime ? `à ${item.visitTime}` : ''}
                          </span>
                        </div>
                      )}

                      {/* Message Body */}
                      <div className="bg-white dark:bg-[#202020] p-3 rounded-xl border border-gray-100 dark:border-white/5 text-xs text-gray-800 dark:text-gray-200">
                        <span className="text-[10px] font-bold text-gray-400 block mb-1">
                          {isClientView ? 'Votre message :' : `Message de ${clientName} :`}
                        </span>
                        <p className="italic leading-relaxed">"{item.message}"</p>
                      </div>

                      {/* Agent Reply */}
                      {item.agentReply && (
                        <div className="mt-2.5 p-3 bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-300 font-bold text-[11px]">
                            <span className="flex items-center space-x-1">
                              <CornerDownRight className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Réponse officielle : {item.agentReply.agentName}</span>
                            </span>
                            <span className="text-[9px] font-normal opacity-80">
                              {new Date(item.agentReply.repliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-emerald-950 dark:text-emerald-100 font-medium pl-4">
                            {item.agentReply.text}
                          </p>
                        </div>
                      )}

                      {/* Reply Editor for Agent */}
                      {!isClientView && replyingToId === item.id && (
                        <div className="mt-3 p-3 bg-white dark:bg-[#202020] border border-[#FF385C]/40 rounded-xl space-y-2 animate-in fade-in">
                          <label className="block text-xs font-bold text-gray-900 dark:text-white">
                            Rédiger une réponse directe pour le client :
                          </label>
                          <textarea
                            rows={2}
                            placeholder="EX: Bonjour, votre visite est bien confirmée pour Samedi 14h00."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full p-2.5 text-xs bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FF385C]"
                          />
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => setReplyingToId(null)}
                              className="px-3 py-1 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold cursor-pointer"
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendReply(item.id)}
                              className="bg-[#FF385C] hover:bg-[#E00B41] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center space-x-1 cursor-pointer shadow-xs"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Envoyer la Réponse</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-2 border-t border-gray-100 dark:border-white/10">
                        <div className="flex items-center space-x-2">
                          <a
                            href={whatsappDigits ? `https://api.whatsapp.com/send?phone=${whatsappDigits}&text=${encodeURIComponent(
                              isClientView
                                ? `Bonjour, je fais suite à ma demande sur NyumbaLink pour : ${item.propertyTitle}`
                                : (item.agentReply ? item.agentReply.text : `Bonjour ${item.senderName}, je fais suite à votre demande sur NyumbaLink pour : ${item.propertyTitle}`)
                            )}` : '#'}
                            aria-disabled={!whatsappDigits}
                            onClick={(event) => {
                              if (!whatsappDigits) event.preventDefault();
                            }}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-white text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 transition shadow-xs ${whatsappDigits ? 'bg-[#25D366] hover:bg-[#20bd5a] cursor-pointer' : 'bg-slate-400 cursor-not-allowed'}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{isClientView ? 'Discuter sur WhatsApp' : 'Répondre sur WhatsApp'}</span>
                            <ExternalLink className="w-3 h-3 ml-0.5" />
                          </a>

                          {!isClientView && replyingToId !== item.id && (
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingToId(item.id);
                                setReplyText(
                                  `Bonjour cher ${clientName}, merci pour votre intérêt, votre rendez-vous pour ${item.propertyTitle} a été validé${appointmentDetails}.`
                                );
                              }}
                              className="bg-[#FF385C]/10 text-[#FF385C] hover:bg-[#FF385C]/20 text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 cursor-pointer transition"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Répondre dans l'App</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center space-x-1">
                          {!item.isRead && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsRead(item.id)}
                              className="text-xs font-bold text-[#FF385C] hover:bg-[#FF385C]/10 p-1.5 rounded-xl flex items-center space-x-1 transition cursor-pointer"
                              title="Marquer comme lu"
                            >
                              <CheckCheck className="w-4 h-4" />
                              <span className="hidden sm:inline">Lu</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-xl flex items-center space-x-1 transition cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CONTRACT ALERTS */}
        {activeCategory === 'contracts' && (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto py-2 space-y-3">
              {contractAlerts.totalAlerts === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="font-bold text-sm">
                    Aucune alerte de contrat active
                  </p>
                  <p className="text-xs mt-1 max-w-sm mx-auto">
                    Les demandes de confirmation et les alertes d'échéances apparaîtront ici.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 1. Pending contract requests */}
                  {(contractAlerts.pending || []).map((alert) => {
                    const isLandlord = alert.role === 'landlord' || alert.role === 'admin';

                    return (
                      <div
                        key={`alert-pending-${alert.contract.id}`}
                        className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-2.5 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-600 text-white">
                            Confirmation requise
                          </span>
                          <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                            En attente
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                            {alert.contract.propertyTitle} ({alert.contract.propertyNeighborhood})
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                            {alert.message}
                          </p>
                        </div>

                        {isLandlord ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-emerald-600">
                              À gérer dans vos contrats
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs font-semibold text-blue-800 dark:text-blue-200">
                            Vous recevrez une notification dès que le propriétaire aura confirmé.
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {/* 2. Confirmed contracts */}
                  {(contractAlerts.confirmed || []).map((alert) => (
                    <div
                      key={`alert-confirmed-${alert.contract.id}`}
                      className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
                          Contrat conclu
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                          Confirmation
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                          {alert.contract.propertyTitle} ({alert.contract.propertyNeighborhood})
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* 3. Expired contracts */}
                  {(contractAlerts.expired || []).map((alert, idx) => {
                    return (
                      <div
                        key={`alert-exp-${idx}`}
                        className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 space-y-2.5 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
                            Délai Terminé / Expiré
                          </span>
                          <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                            Échéance passée
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                            {alert.contract.propertyTitle} ({alert.contract.propertyNeighborhood})
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                            {alert.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* 4. Expiring soon contracts */}
                  {(contractAlerts.expiringSoon || []).map((alert, idx) => {
                    return (
                      <div
                        key={`alert-soon-${idx}`}
                        className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2.5 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-600 text-white">
                            Échéance Proche
                          </span>
                          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                            Bientôt expiré
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                            {alert.contract.propertyTitle} ({alert.contract.propertyNeighborhood})
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                            {alert.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer avec bouton Fermer haute lisibilité en thème clair et sombre */}
        <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="notification-close-button px-5 py-2.5 rounded-xl text-xs font-bold text-gray-900 dark:text-white transition cursor-pointer shadow-xs bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 border border-gray-300/70 dark:border-white/10"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};