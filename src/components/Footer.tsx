import React from 'react';
import { MapPin, Mail, Phone, ShieldCheck, Heart, MessageSquare, Linkedin, Twitter, Settings } from 'lucide-react';
import { BUKAVU_COMMUNES, BUKAVU_COMMUNES_WITH_NEIGHBORHOODS } from '../data/initialProperties';
import { useLanguage } from '../context/LanguageContext';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  setCurrentTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentTab }) => {
  const { language } = useLanguage();

  const handleNav = (tab: string) => {
    setCurrentTab(tab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#121212] text-[#b0b0b0] pt-14 pb-8 border-t border-[#242424]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BrandLogo size="md" textColor="text-white" />
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              {language === 'en'
                ? "The premier real estate platform in Bukavu. We facilitate buying, selling, and renting across the 3 communes of Bukavu (Ibanda, Kadutu, Bagira)."
                : "La plateforme immobilière de référence à Bukavu. Nous facilitons l'achat, la vente et la location dans les 3 communes de Bukavu (Ibanda, Kadutu, Bagira)."}
            </p>
          </div>

          {/* Bukavu Communes & Quartiers */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-[#242424] pb-2">
              {language === 'en' ? 'Communes of Bukavu' : 'Communes de Bukavu'}
            </h3>
            <div className="space-y-3 text-xs text-stone-300">
              {BUKAVU_COMMUNES.map((commune) => (
                <div key={commune} className="space-y-0.5">
                  <p className="font-bold text-[#FF385C] text-xs">{commune}</p>
                  <p className="text-stone-300 text-[11px] leading-relaxed">
                    {BUKAVU_COMMUNES_WITH_NEIGHBORHOODS[commune].join(', ')}, etc.
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-[#242424] pb-2">
              {language === 'en' ? 'Quick Navigation' : 'Navigation Rapide'}
            </h3>
            <ul className="space-y-2 text-xs text-[#b0b0b0]">
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('home')}
                  className="hover:text-[#FF385C] text-left transition font-medium cursor-pointer"
                >
                  {language === 'en' ? 'Home' : 'Accueil'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('listings')}
                  className="hover:text-[#FF385C] text-left transition font-medium cursor-pointer"
                >
                  {language === 'en' ? 'All Listings' : 'Toutes les Annonces'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('map')}
                  className="hover:text-[#FF385C] text-left transition font-medium cursor-pointer"
                >
                  {language === 'en' ? 'Interactive Properties Map' : 'Carte Interactive des Propriétés'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('favorites')}
                  className="hover:text-[#FF385C] text-left transition font-medium cursor-pointer"
                >
                  {language === 'en' ? 'My Favorites' : 'Mes Favoris'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('settings')}
                  className="hover:text-[#FF385C] text-left transition font-bold text-[#FF385C] flex items-center space-x-1.5 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Settings & Trash' : 'Paramètres & Corbeille'}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info Bukavu */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-[#242424] pb-2">
              {language === 'en' ? 'Direct Contact (Bukavu)' : 'Contact & Siège (Bukavu)'}
            </h3>
            <ul className="space-y-3 text-xs text-[#b0b0b0]">
              <li className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-[#FF385C] shrink-0 mt-0.5" />
                <span className="leading-relaxed text-[#d0d0d0]">
                  Avenue Mahenge, Commune d'Ibanda, Bukavu (RDC)
                </span>
              </li>
              
              {/* Ben Baraka Shamamba & David Makindu in same unified card */}
              <li className="space-y-3 bg-[#1a1a1a] p-3.5 rounded-xl border border-[#2e2e2e]">
                {/* Ben Baraka Shamamba */}
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white">Ben Baraka Shamamba</p>
                  <p className="text-[11px] text-stone-300">benbarakashamamba@gmail.com</p>
                  <p className="text-[11px] text-stone-300">+243 986 760 178</p>
                </div>

                <div className="border-t border-[#2e2e2e]"></div>

                {/* David Makindu */}
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white">David Makindu</p>
                  <p className="text-[11px] text-stone-300">davidmakindu9@gmail.com</p>
                  <p className="text-[11px] text-stone-300">+243 993 853 036</p>
                </div>
              </li>
            </ul>

            {/* Social Media & WhatsApp direct buttons */}
            <div className="pt-4 mt-3 border-t border-[#242424]">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                {language === 'en' ? 'Direct Links' : 'Réseaux & Échanges Directs'}
              </p>
              <div className="flex items-center space-x-2.5">
                <a
                  href="https://www.linkedin.com/in/b%C3%A9nite-baraka-shamamba-b76554331"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Profil LinkedIn"
                  title="LinkedIn - Ben BARAKA SHAMAMBA"
                  className="w-9 h-9 rounded-xl bg-[#1e1e1e] hover:bg-[#0077B5] text-stone-300 hover:text-white border border-[#2e2e2e] hover:border-[#0077B5] flex items-center justify-center transition-all duration-200"
                >
                  <Linkedin className="w-4 h-4" />
                </a>

                <a
                  href="https://x.com/BBarakashamamba"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Profil X (Twitter)"
                  title="X (Twitter) - @BBarakashamamba"
                  className="w-9 h-9 rounded-xl bg-[#1e1e1e] hover:bg-black text-stone-300 hover:text-white border border-[#2e2e2e] hover:border-white/30 flex items-center justify-center transition-all duration-200"
                >
                  <Twitter className="w-4 h-4" />
                </a>

                <a
                  href="https://wa.me/243993853036?text=Bonjour%20NyumbaLink%2C%20je%20souhaite%20des%20informations"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp NyumbaLink"
                  title="WhatsApp David Makindu (+243 993 853 036)"
                  className="px-3 h-9 rounded-xl bg-[#1e1e1e] hover:bg-[#25D366] text-stone-300 hover:text-white border border-[#2e2e2e] hover:border-[#25D366] flex items-center space-x-1.5 transition-all duration-200 text-xs font-bold"
                >
                  <MessageSquare className="w-4 h-4 text-[#25D366] group-hover:text-white" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-[#242424] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400">
          <p>© {new Date().getFullYear()} NyumbaLink Bukavu. {language === 'en' ? 'All rights reserved.' : 'Tous droits réservés.'}</p>
          <div className="mt-2 sm:mt-0 flex items-center space-x-3">
            <span className="flex items-center">
              <span>{language === 'en' ? 'Crafted for Bukavu' : 'Conçu pour la ville de Bukavu'}</span>
              <Heart className="w-3.5 h-3.5 ml-1 text-[#FF385C] fill-[#FF385C]" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};


