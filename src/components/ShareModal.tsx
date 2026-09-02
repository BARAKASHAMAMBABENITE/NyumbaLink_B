import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Send,
  Linkedin,
  Twitter,
  Mail,
  QrCode,
  ExternalLink,
  Facebook
} from 'lucide-react';
import { Property } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, property }) => {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  if (!isOpen || !property) return null;

  // Real direct NyumbaLink property URL
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://nyumbalink.cd';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const propertyUrl = `${currentOrigin}${currentPath}?property=${encodeURIComponent(property.id)}`;

  const priceFormatted = property.type === 'location'
    ? `${property.price.toLocaleString()} $ / mois`
    : `${property.price.toLocaleString()} $`;

  const shareTitle = `${property.title} - NyumbaLink Bukavu (${property.commune})`;
  
  const lines: string[] = [
    `🏡 ${property.title} à Bukavu`,
    `📍 Localisation : Commune d'${property.commune}, Quartier ${property.neighborhood}`,
    `💰 Prix : ${priceFormatted}`,
    `📑 Type : ${property.type === 'vente' ? 'À Vendre' : 'À Louer'} (${property.category.toUpperCase()})`
  ];

  if (property.category === 'parcelle' && property.surface) {
    lines.push(`📐 Superficie : ${property.surface} m²`);
  }

  if (property.bedrooms && property.category !== 'parcelle') {
    lines.push(`🛏️ Chambres : ${property.bedrooms}`);
  }
  if (property.bathrooms) {
    lines.push(`🚿 Salles de bain : ${property.bathrooms}`);
  }
  if (property.features && property.features.length > 0) {
    lines.push(`✨ Atouts : ${property.features.slice(0, 4).join(', ')}`);
  }

  lines.push('');
  lines.push(`👉 Découvrez l'annonce complète sur NyumbaLink :`);
  lines.push(propertyUrl);

  const shareText = lines.join('\n');

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(propertyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Native System Share
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: propertyUrl
        });
      } catch {
        // user dismiss
      }
    } else {
      handleCopyLink();
    }
  };

  // Icon-only social platforms with direct functional web redirection
  const socialPlatforms = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      bgClass: 'bg-[#25D366] hover:bg-[#20bd5a] text-white',
      action: () => {
        const encoded = encodeURIComponent(shareText);
        window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank', 'noopener,noreferrer');
      }
    },
    {
      name: 'Facebook',
      icon: Facebook,
      bgClass: 'bg-[#1877F2] hover:bg-[#166fe5] text-white',
      action: () => {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl)}&quote=${encodeURIComponent(shareText)}`;
        window.open(fbUrl, '_blank', 'noopener,noreferrer');
      }
    },
    {
      name: 'X (Twitter)',
      icon: Twitter,
      bgClass: 'bg-black hover:bg-stone-800 text-white dark:bg-[#2a2a2a] dark:hover:bg-[#333]',
      action: () => {
        const tweetText = `🏡 ${property.title} à Bukavu (${property.commune}) - ${priceFormatted}`;
        const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(propertyUrl)}`;
        window.open(xUrl, '_blank', 'noopener,noreferrer');
      }
    },
    {
      name: 'Telegram',
      icon: Send,
      bgClass: 'bg-[#229ED9] hover:bg-[#1e8dbf] text-white',
      action: () => {
        const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(propertyUrl)}&text=${encodeURIComponent(shareText)}`;
        window.open(tgUrl, '_blank', 'noopener,noreferrer');
      }
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      bgClass: 'bg-[#0A66C2] hover:bg-[#095196] text-white',
      action: () => {
        const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(propertyUrl)}`;
        window.open(liUrl, '_blank', 'noopener,noreferrer');
      }
    },
    {
      name: 'Email',
      icon: Mail,
      bgClass: 'bg-[#EA4335] hover:bg-[#d9382b] text-white',
      action: () => {
        const subject = encodeURIComponent(`Annonce NyumbaLink Bukavu : ${property.title}`);
        const body = encodeURIComponent(shareText);
        const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
        
        try {
          // Open Gmail or default mail app
          const win = window.open(gmailUrl, '_blank', 'noopener,noreferrer');
          if (!win || win.closed || typeof win.closed === 'undefined') {
            window.location.href = mailtoUrl;
          }
        } catch {
          window.location.href = mailtoUrl;
        }
      }
    }
  ];

  // QR Code generator
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(propertyUrl)}&bgcolor=ffffff&color=222222&margin=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#1a1a1a] border border-[#ebebeb] dark:border-[#2e2e2e] text-[#222222] dark:text-[#f7f7f7] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#ebebeb] dark:border-[#2e2e2e] bg-[#fcfcfc] dark:bg-[#1e1e1e] shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#FF385C]/10 border border-[#FF385C]/30 flex items-center justify-center text-[#FF385C]">
              <Share2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#222222] dark:text-white">Partager ce bien</h3>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Property Summary Pill */}
          <div className="bg-[#f7f7f7] dark:bg-[#222222] p-2.5 rounded-xl border border-[#ebebeb] dark:border-[#333] flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase tracking-wider text-[#FF385C] block">
                {property.category} • {property.commune}
              </span>
              <h4 className="text-xs font-bold truncate text-[#222222] dark:text-[#f7f7f7]">
                {property.title}
              </h4>
            </div>
            <span className="shrink-0 text-[11px] font-black px-2 py-0.5 bg-[#FF385C]/10 text-[#FF385C] rounded-md">
              {priceFormatted}
            </span>
          </div>

          {/* Social Media Icon-Only Row / Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#717171] dark:text-[#b0b0b0]">
                Partager directement sur :
              </label>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="text-[10px] font-bold text-[#FF385C] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                  <span>Autre app</span>
                </button>
              )}
            </div>

            {/* Icon-Only Buttons Bar */}
            <div className="flex items-center justify-between gap-1.5 flex-wrap">
              {socialPlatforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.name}
                    onClick={platform.action}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-2xs hover:shadow-md hover:scale-110 active:scale-95 cursor-pointer ${platform.bgClass}`}
                    title={`Partager sur ${platform.name}`}
                    aria-label={platform.name}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                  </button>
                );
              })}

              {/* QR Code toggle (Icon-only) */}
              <button
                onClick={() => setShowQrCode(!showQrCode)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-2xs hover:shadow-md hover:scale-110 active:scale-95 cursor-pointer ${
                  showQrCode
                    ? 'bg-[#FF385C] text-white'
                    : 'bg-slate-800 hover:bg-slate-900 text-white dark:bg-[#333] dark:hover:bg-[#444]'
                }`}
                title="Afficher le QR Code"
                aria-label="QR Code"
              >
                <QrCode className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>

          {/* QR Code Modal Display if toggled */}
          {showQrCode && (
            <div className="p-3 rounded-2xl bg-white dark:bg-[#121212] border border-[#ebebeb] dark:border-[#333] flex flex-col items-center justify-center space-y-1 text-center animate-in fade-in">
              <div className="bg-white p-2 rounded-xl shadow-xs border border-slate-200">
                <img
                  src={qrCodeUrl}
                  alt="QR Code Annonce"
                  className="w-28 h-28 object-contain"
                />
              </div>
              <p className="text-[10px] font-bold text-[#717171] dark:text-[#b0b0b0]">
                Scannez pour ouvrir ce bien sur NyumbaLink
              </p>
            </div>
          )}

          {/* Direct NyumbaLink Property URL */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#717171] dark:text-[#b0b0b0]">
              Lien direct NyumbaLink :
            </label>
            <div className="flex items-center space-x-1.5">
              <input
                type="text"
                readOnly
                value={propertyUrl}
                className="flex-1 bg-[#f7f7f7] dark:bg-[#121212] border border-[#ebebeb] dark:border-[#2e2e2e] rounded-xl py-1.5 px-2.5 text-xs text-[#222222] dark:text-[#f7f7f7] font-mono focus:outline-none truncate select-all"
              />
              <button
                onClick={handleCopyLink}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all shrink-0 cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#222222] dark:bg-white text-white dark:text-[#222222] hover:opacity-90'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Pre-formatted Message with Quick Copy */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#717171] dark:text-[#b0b0b0]">
                Texte prêt à coller :
              </label>
              <button
                onClick={handleCopyText}
                className="text-[10px] text-[#FF385C] hover:underline font-bold flex items-center space-x-1 cursor-pointer"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-500">Texte copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copier tout</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              readOnly
              rows={3}
              value={shareText}
              className="w-full bg-[#f7f7f7] dark:bg-[#121212] border border-[#ebebeb] dark:border-[#2e2e2e] rounded-xl p-2 text-[11px] text-[#717171] dark:text-[#b0b0b0] font-mono focus:outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-stone-100 dark:bg-[#282828] hover:bg-stone-200 dark:hover:bg-[#333333] text-[#222222] dark:text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
