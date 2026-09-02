import React from 'react';
import { ArrowRight, X, Sparkles, ShieldCheck, MapPin, Building2, User } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import handoverBgImage from '../assets/images/african_handover_keys_1788217554486.jpg';

interface OnboardingSplashScreenProps {
  isOpen: boolean;
  onGetStarted: () => void;
  onClose?: () => void;
  noticeMessage?: string;
}

export const OnboardingSplashScreen: React.FC<OnboardingSplashScreenProps> = ({
  isOpen,
  onGetStarted,
  onClose,
  noticeMessage
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="onboarding-splash-screen"
      className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-950 text-white overflow-y-auto animate-in fade-in duration-300"
    >
      {/* Immersive Real Estate Background Image with High-End Dark Gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <img
          src={handoverBgImage}
          alt="Remise des clés d'une maison à Bukavu"
          className="w-full h-full object-cover object-center scale-105 filter brightness-75 contrast-105"
        />
        {/* Layered cinematic gradient overlays for optimal text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950/95" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 pt-6 sm:pt-8 flex items-center justify-between">
        {/* Brand Logo with Crisp White Text */}
        <div className="group transition-transform duration-200 hover:scale-102">
          <BrandLogo size="md" textColor="text-white" />
        </div>
      </header>

      {/* Center / Content Card */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-6 sm:px-8 py-8 flex flex-col items-center text-center my-auto">
        {/* Optional Auth Context Notice */}
        {noticeMessage && (
          <div className="mb-4 inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#FF385C]/20 border border-[#FF385C]/40 text-[#FF385C] text-xs font-bold animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{noticeMessage}</span>
          </div>
        )}

        {/* Slogan punchy and elegant */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight mb-4 drop-shadow-md">
          Bienvenue sur{' '}
          <span className="bg-gradient-to-r from-[#FF385C] to-[#FF6584] bg-clip-text text-transparent">
            NyumbaLink
          </span>
        </h1>

        {/* Short Subtitle */}
        <p className="text-sm sm:text-base text-slate-200 font-medium max-w-lg mb-6 leading-relaxed drop-shadow-sm">
          La plateforme immobilière de référence à Bukavu : maisons, appartements, villas et parcelles vérifiés à Ibanda, Kadutu et Bagira.
        </p>

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-lg mb-8 text-left">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
            <ShieldCheck className="w-5 h-5 text-[#FF385C] mx-auto mb-1" />
            <p className="text-[11px] font-bold text-white">100% Sécurisé</p>
            <p className="text-[9px] text-slate-300">Annonces & baux vérifiés</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
            <Building2 className="w-5 h-5 text-[#FF385C] mx-auto mb-1" />
            <p className="text-[11px] font-bold text-white">Direct Propriétaire</p>
            <p className="text-[9px] text-slate-300">Sans intermédiaires occultes</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
            <MapPin className="w-5 h-5 text-[#FF385C] mx-auto mb-1" />
            <p className="text-[11px] font-bold text-white">Tout Bukavu</p>
            <p className="text-[9px] text-slate-300">Ibanda, Kadutu, Bagira</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-md space-y-3">
          <button
            type="button"
            id="onboarding-get-started-btn"
            onClick={onGetStarted}
            className="w-full group relative flex items-center justify-center space-x-3 bg-gradient-to-r from-[#FF385C] via-[#E00B41] to-[#D70466] hover:brightness-105 active:scale-98 text-white py-4 px-6 rounded-2xl text-base font-bold transition-all shadow-xl shadow-[#FF385C]/35 cursor-pointer"
          >
            <User className="w-5 h-5" />
            <span>Se connecter / S'inscrire</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-6 text-center text-[11px] text-slate-400">
        © {new Date().getFullYear()} NyumbaLink Immobilier RDC • Bukavu, Sud-Kivu
      </footer>
    </div>
  );
};
