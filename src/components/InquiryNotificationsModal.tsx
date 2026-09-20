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
  AlertCircle,
  ArrowRight,
  UserCheck
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
  createContract,
  deleteContract,
  getDaysRemaining
} from '../services/contractService';
import { UserProfile, UserRole } from '../types';
import { updateRegisteredUserRole } from '../services/activityService';
import { updateUserRoleInFirestore } from '../services/authService';

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    const safeAlerts = alerts ?? { pending: [], confirmed: [], expired: [], expiringSoon: [], totalAlerts: 0 };

    const isContractForCurrentUser = (contract: RentalContract) => {
      if (!user?.uid) return false;
      if (user.role === 'client') return contract.tenantId === user.uid;
      if (user.role === 'bailleur') return contract.landlordId === user.uid;
      return contract.landlordId === user.uid || contract.tenantId === user.uid;
    };

    const filterAlerts = (items: typeof safeAlerts.pending) =>
      (items || []).filter(alert => isContractForCurrentUser(alert.contract));

    const removeDuplicates = (items: typeof safeAlerts.pending) => {
      const seen = new Set();
      return items.filter(item => {
        if (seen.has(item.contract.id)) return false;
        seen.add(item.contract.id);
        return true;
      });
    };

    const pending = removeDuplicates(filterAlerts(safeAlerts.pending));
    const confirmed = removeDuplicates(filterAlerts(safeAlerts.confirmed));
    const expired = removeDuplicates(filterAlerts(safeAlerts.expired));
    const expiringSoon = removeDuplicates(filterAlerts(safeAlerts.expiringSoon));

    setContractAlerts({
      pending,
      confirmed,
      expired,
      expiringSoon,
      totalAlerts: pending.length + confirmed.length + expired.length + expiringSoon.length
    });
  };

  useEffect(() => {
    if (isOpen) {
      void loadData();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleConfirmContract = async (contract: RentalContract) => {
    if (user?.role !== 'bailleur' || user.uid !== contract.landlordId) return;
    try {
      await deleteContract(contract.id);
      await createContract({ ...contract, status: 'active' } as RentalContract);
      await loadData();
      showToast('Contrat confirmé avec succès !');
    } catch (error) {
      console.error('Erreur confirmation contrat :', error);
    }
  };

  const handleConsultContract = () => {
    onClose();
    onNavigateToContracts?.();
  };

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
    showToast('Réponse envoyée avec succès !');
  };

  const handlePromoteToAgent = async (senderUid: string, senderName: string) => {
    if (!senderUid) {
      showToast('Identifiant utilisateur introuvable.');
      return;
    }
    try {
      updateRegisteredUserRole(senderUid, 'agent' as UserRole);
      await updateUserRoleInFirestore(senderUid, 'agent' as UserRole);
      showToast(`${senderName} a été promu Agent avec succès !`);
    } catch (e) {
      showToast('Erreur lors de la promotion en agent.');
    }
  };

  const isClientView = user?.role === 'client';
  const isAdminOrAgent = user?.role === 'admin' || user?.role === 'agent' || user?.isPartner;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 font-sans">
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-3 bg-gray-900 text-white text-xs font-bold rounded-xl shadow-xl flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 dark:border-white/10 relative max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                Centre de Notifications & Messages
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isClientView ? 'Échanges directs et alertes d\'échéances de baux' : 'Demandes de visites, messages et suivis de vos contrats'}
              </p>
            </div>
          </div>
        </div>

        {/* Category Switcher */}
        <div className="grid grid-cols-2 gap-2 my-3 p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5">
          <button
            type="button"
            onClick={() => setActiveCategory('messages')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeCategory === 'messages' ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-white shadow-xs' : 'text-gray-500'
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
              activeCategory === 'contracts' ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-white shadow-xs' : 'text-gray-500'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Alertes & Échéances</span>
            {totalContractAlerts > 0 && (
              <span className="bg-[#FF385C] text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {totalContractAlerts}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: MESSAGES */}
        {activeCategory === 'messages' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-white/10 gap-2 flex-wrap">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${filterTab === 'all' ? 'bg-[#FF385C] text-white' : 'text-gray-500'}`}
                >
                  Tous ({inquiries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('unread')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${filterTab === 'unread' ? 'bg-[#FF385C] text-white' : 'text-gray-500'}`}
                >
                  Non lus ({inquiries.filter((i) => !i.isRead).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('replied')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${filterTab === 'replied' ? 'bg-[#FF385C] text-white' : 'text-gray-500'}`}
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

            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {filteredInquiries.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="font-bold text-sm">Aucun message pour le moment.</p>
                </div>
              ) : (
                filteredInquiries.map((item) => {
                  const isPartnerRequest =
                    item.propertyId === 'partner-request' ||
                    item.propertyId === 'b2b-partner-request' ||
                    (item.propertyTitle || '').toLowerCase().includes('partenaire');
                  const clientName = item.senderName === 'Client WhatsApp' ? 'Client' : item.senderName;

                  // Extraction stricte et propre du numéro du client
                  let rawPhone = (item.senderPhone || '').replace(/\D/g, '');
                  if (rawPhone.startsWith('0')) {
                    rawPhone = '243' + rawPhone.substring(1);
                  } else if (!rawPhone.startsWith('243') && rawPhone.length === 9) {
                    rawPhone = '243' + rawPhone;
                  }
                  const clientPhone = rawPhone; // Sera vide si aucun numéro n'a été fourni

                  const ADMIN_DEFAULT_PHONE = '243986760178';
                  const agentDigits = (item.propertyOwnerPhone || '').replace(/\D/g, '');

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
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                              {isClientView ? `Demande pour l'Agent` : clientName}
                            </span>
                            {isPartnerRequest ? (
                              <span className="bg-amber-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <Building2 className="w-3 h-3" />
                                <span>Partenaire / Agent</span>
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

                      <div className="bg-white dark:bg-[#202020] p-3 rounded-xl border border-gray-100 dark:border-white/5 text-xs text-gray-800 dark:text-gray-200">
                        <span className="text-[10px] font-bold text-gray-400 block mb-1">
                          {isClientView ? 'Votre message :' : `Message de ${clientName} :`}
                        </span>
                        <p className="italic leading-relaxed">"{item.message}"</p>
                      </div>

                      {item.agentReply && (
                        <div className="mt-2.5 p-3 bg-[#FF385C]/10 dark:bg-[#FF385C]/20 border border-[#FF385C]/20 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between text-gray-900 dark:text-white font-bold text-[11px]">
                            <span className="flex items-center space-x-1">
                              <CornerDownRight className="w-3.5 h-3.5 text-[#FF385C]" />
                              <span>Réponse officielle : {item.agentReply.agentName}</span>
                            </span>
                          </div>
                          <p className="text-gray-800 dark:text-gray-200 font-medium pl-4">
                            {item.agentReply.text}
                          </p>
                        </div>
                      )}

                      {/* Champ de réponse dans l'application si activé */}
                      {replyingToId === item.id && (
                        <div className="mt-3 p-3 bg-white dark:bg-[#252525] rounded-xl border border-gray-200 dark:border-white/10 space-y-2">
                          <textarea
                            rows={2}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Écrivez votre réponse ici..."
                            className="w-full p-2 text-xs rounded-lg border bg-gray-50 dark:bg-[#1a1a1a] dark:text-white"
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => setReplyingToId(null)}
                              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-xs font-bold rounded-lg"
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendReply(item.id)}
                              className="px-3 py-1 bg-[#FF385C] text-white text-xs font-bold rounded-lg flex items-center space-x-1"
                            >
                              <Send className="w-3 h-3" />
                              <span>Envoyer</span>
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-2 border-t border-gray-100 dark:border-white/10">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                          {/* Bouton Répondre dans l'app */}
                          {isAdminOrAgent && (
                            <button
                              type="button"
                              onClick={() => setReplyingToId(item.id)}
                              className="bg-gray-900 hover:bg-black text-white text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 transition cursor-pointer shadow-xs"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-[#FF385C]" />
                              <span>Répondre dans l'app</span>
                            </button>
                          )}

                          {/* Bouton WhatsApp avec gestion étanche des numéros manquants */}
                          {isClientView ? (
                            <a
                              href={`https://api.whatsapp.com/send?phone=${agentDigits || ADMIN_DEFAULT_PHONE}&text=${encodeURIComponent(
                                `Bonjour, je fais suite à ma demande sur NyumbaLink pour : ${item.propertyTitle}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-[#25D366] hover:bg-[#20bd5a] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 transition shadow-xs cursor-pointer"
                            >
                              <span>WhatsApp</span>
                              <ExternalLink className="w-3 h-3 ml-0.5" />
                            </a>
                          ) : isPartnerRequest ? (
                            <a
                              href={`https://api.whatsapp.com/send?phone=${ADMIN_DEFAULT_PHONE}&text=${encodeURIComponent(
                                `Bonjour ${item.senderName}, je fais suite à votre demande de partenariat sur NyumbaLink.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-[#25D366] hover:bg-[#20bd5a] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 transition shadow-xs cursor-pointer"
                            >
                              <span>WhatsApp</span>
                              <ExternalLink className="w-3 h-3 ml-0.5" />
                            </a>
                          ) : (
                            /* Vue Admin ou Agent consultant la demande d'un client */
                            clientPhone ? (
                              <a
                                href={`https://api.whatsapp.com/send?phone=${clientPhone}&text=${encodeURIComponent(
                                  `Bonjour ${item.senderName}, je fais suite à votre message sur NyumbaLink.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-[#25D366] hover:bg-[#20bd5a] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 transition shadow-xs cursor-pointer"
                              >
                                <span>WhatsApp Client</span>
                                <ExternalLink className="w-3 h-3 ml-0.5" />
                              </a>
                            ) : (
                              <span className="bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-slate-500 text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-not-allowed">
                                Numéro non enregistré
                              </span>
                            )
                          )}

                          {/* Bouton "Ajouter Agent" si c'est une demande de partenariat/agent par un admin */}
                          {user?.role === 'admin' && isPartnerRequest && item.senderUid && (
                            <button
                              type="button"
                              onClick={() => handlePromoteToAgent(item.senderUid, item.senderName)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-xl flex items-center space-x-1 transition shadow-xs cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Ajouter Agent</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center space-x-1">
                          {!item.isRead && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsRead(item.id)}
                              className="text-xs font-bold text-[#FF385C] hover:bg-[#FF385C]/10 p-1.5 rounded-xl transition cursor-pointer"
                              title="Marquer comme lu"
                            >
                              <CheckCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="text-xs font-bold text-rose-600 hover:bg-rose-50 p-1.5 rounded-xl transition cursor-pointer"
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
                  <p className="font-bold text-sm">Aucune alerte de contrat active</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(contractAlerts.pending || []).map((alert) => (
                    <div key={`alert-pending-${alert.contract.id}`} className="p-4 rounded-2xl bg-[#FF385C]/5 border border-[#FF385C]/20 space-y-2.5 shadow-xs">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#FF385C] text-white">
                          Confirmation requise
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{alert.contract.propertyTitle}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{alert.message}</p>
                      </div>
                      <div className="pt-2 flex justify-end gap-2">
                        {user?.role === 'bailleur' && user.uid === alert.contract.landlordId && (
                          <button
                            type="button"
                            onClick={() => handleConfirmContract(alert.contract)}
                            className="bg-emerald-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirmer</span>
                          </button>
                        )}
                        {onNavigateToContracts && (
                          <button
                            type="button"
                            onClick={handleConsultContract}
                            className="bg-[#FF385C] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5"
                          >
                            <span>Consulter</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {(contractAlerts.confirmed || []).map((alert) => (
                    <div key={`alert-confirmed-${alert.contract.id}`} className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2.5">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">Contrat conclu</span>
                      <p className="text-xs text-gray-600">{alert.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-900 dark:text-white transition cursor-pointer shadow-xs bg-gray-100 hover:bg-gray-200 dark:bg-white/10"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};