import React, { useState, useEffect } from 'react';
import { Property, UserProfile } from '../types';
import { X, MessageSquare, CheckCircle2, Send, Mail, Calendar, ExternalLink, Phone, ShieldCheck } from 'lucide-react';
import { addInquiry } from '../services/inquiryService';

interface ContactModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile | null;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  property,
  isOpen,
  onClose,
  user
}) => {
  if (!isOpen) return null;

  const rawPhone = property.ownerPhone || '243986760178';
  const cleanPhone = rawPhone.replace(/\D/g, '') || '243986760178';

  const [senderName, setSenderName] = useState(user?.fullname || '');
  const [senderPhone, setSenderPhone] = useState(user?.phone || '');
  const [senderEmail, setSenderEmail] = useState(user?.email || '');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [message, setMessage] = useState(
    `Bonjour ${property.ownerName || 'Agent'}, je suis intéressé(e) par votre bien "${property.title}" situé à ${property.commune} / ${property.neighborhood}.`
  );
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      if (!senderName && user.fullname) setSenderName(user.fullname);
      if (!senderPhone && user.phone) setSenderPhone(user.phone);
      if (!senderEmail && user.email) setSenderEmail(user.email);
    }
  }, [user]);

  // Formatted WhatsApp URL using direct api.whatsapp.com endpoint
  const fullMessageWithVisit = `${message}${visitDate ? `\n- Date de visite souhaitée : ${visitDate}` : ''}${visitTime ? ` à ${visitTime}` : ''}`;
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(fullMessageWithVisit)}`;

  const handleWhatsAppClick = () => {
    // Save inquiry automatically when opening WhatsApp
    addInquiry({
      propertyId: property.id,
      propertyTitle: property.title,
      propertyNeighborhood: property.neighborhood,
      propertyCommune: property.commune,
      propertyPrice: property.price,
      propertyImage: property.images[0] || '',
      propertyOwnerId: property.ownerId,
      propertyOwnerName: property.ownerName,
      propertyOwnerPhone: property.ownerPhone,
      propertyOwnerEmail: property.ownerEmail,
      senderUid: user?.uid,
      senderName: senderName || user?.fullname || 'Client WhatsApp',
      senderPhone: senderPhone || user?.phone || '+243 986 760 178',
      senderEmail: senderEmail || user?.email || undefined,
      message: fullMessageWithVisit,
      visitDate: visitDate || undefined,
      visitTime: visitTime || undefined,
      channel: 'whatsapp'
    });
  };

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    
    addInquiry({
      propertyId: property.id,
      propertyTitle: property.title,
      propertyNeighborhood: property.neighborhood,
      propertyCommune: property.commune,
      propertyPrice: property.price,
      propertyImage: property.images[0] || '',
      propertyOwnerId: property.ownerId,
      propertyOwnerName: property.ownerName,
      propertyOwnerPhone: property.ownerPhone,
      propertyOwnerEmail: property.ownerEmail,
      senderUid: user?.uid,
      senderName: senderName || user?.fullname || 'Client NyumbaLink',
      senderPhone: senderPhone || user?.phone || '+243 986 760 178',
      senderEmail: senderEmail || user?.email || undefined,
      message: fullMessageWithVisit,
      visitDate: visitDate || undefined,
      visitTime: visitTime || undefined,
      channel: 'direct'
    });

    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-[#2e2e2e] relative max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#FF385C] text-white flex items-center justify-center font-bold shadow-md">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
              Ouvrir WhatsApp & Contacter
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Commune de {property.commune}, quartier {property.neighborhood}
            </p>
          </div>
        </div>

        {/* Property Brief Box */}
        <div className="bg-slate-50 dark:bg-[#121212] rounded-xl p-3 border border-slate-200 dark:border-[#2e2e2e] mb-5 flex items-center space-x-3">
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-16 h-16 rounded-lg object-cover shrink-0"
          />
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {property.title}
            </h4>
            <p className="text-sm font-extrabold text-[#FF385C]">
              ${property.price.toLocaleString()} {property.pricePeriod === 'mois' ? '/mois' : ''}
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Agent : {property.ownerName}
            </p>
          </div>
        </div>

        {/* Single Main WhatsApp Action Button */}
        <div className="mb-5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition shadow-md cursor-pointer"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Ouvrir WhatsApp avec l'Agent</span>
            <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
          </a>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 text-center mt-2">
            Un message pré-rédigé contenant les détails du bien sera directement prêt dans votre WhatsApp.
          </p>
        </div>

        {/* Direct Message Form Option */}
        <div className="relative border-t border-slate-200 dark:border-[#2e2e2e] pt-4">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white dark:bg-[#1e1e1e] px-3 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Ou Laissez une demande / RDV dans l'App
          </span>

          {sentSuccess ? (
            <div className="bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl p-6 text-center text-slate-900 dark:text-white space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#FF385C] mx-auto" />
              <div>
                <h4 className="font-bold text-base">Demande Transmise !</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  L'agent a bien reçu votre message et vous recontactera directement.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full bg-slate-900 hover:bg-black dark:bg-[#2e2e2e] dark:hover:bg-[#383838] text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitInquiry} className="space-y-3 mt-1">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Votre Nom Complet
                </label>
                <input
                  type="text"
                  required
                  placeholder="EX: Bén BARAKA SHAMAMBA"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#FF385C]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="EX: +243 986 760 178"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#FF385C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                    Email <span className="text-slate-500 font-normal">(Optionnel)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="benbarakashamamba@gmail.com"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#FF385C]"
                    />
                    <Mail className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Visit Schedule Options */}
              <div className="bg-slate-50 dark:bg-[#121212] p-3 rounded-xl border border-slate-200 dark:border-[#2e2e2e] space-y-2">
                <span className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-[#FF385C]" />
                  <span>Programmer une Visite (Optionnel) :</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#2e2e2e] rounded-lg text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      value={visitTime}
                      onChange={(e) => setVisitTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#2e2e2e] rounded-lg text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Message
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#2e2e2e] rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#FF385C]"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 dark:bg-[#2e2e2e] dark:hover:bg-[#383838] text-slate-800 dark:text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer border border-slate-200 dark:border-[#383838]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-[#FF385C] hover:bg-[#e00b41] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-md cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Envoyer ma Demande</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};


