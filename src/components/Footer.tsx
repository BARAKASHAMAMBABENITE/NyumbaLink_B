import React from 'react';
import { MessageCircle, Linkedin, Twitter } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { BrandLogo } from './BrandLogo';

export const Footer: React.FC = () => {
  const { language } = useLanguage();

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-[#121212] text-[#b0b0b0] border-t border-[#242424] shadow-[0_-8px_24px_rgba(0,0,0,0.12)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-full">
        <div className="hidden">
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
                  <MessageCircle className="w-4 h-4 text-[#25D366] group-hover:text-white" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        <div className="flex h-full items-center justify-between gap-2 sm:gap-4">
          <div className="min-w-0 truncate text-[10px] text-stone-300">
            <span className="inline-block align-middle">
              <BrandLogo size="sm" textColor="text-white" />
            </span>
            <span className="hidden sm:inline sm:ml-3 text-stone-400">
              {language === 'en'
                ? 'The premier real estate platform in Bukavu.'
                : language === 'sw' ? 'Jukwaa bora la mali isiyohamishika Bukavu.'
                : 'La plateforme immobilière de référence à Bukavu.'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden lg:inline text-[10px] text-stone-400">
              {language === 'en' ? 'Direct links' : 'Réseaux sociaux'}
            </span>
            <a href="https://www.linkedin.com/in/b%C3%A9nite-baraka-shamamba-b76554331" target="_blank" rel="noopener noreferrer" aria-label="Profil LinkedIn" title="LinkedIn - Ben BARAKA SHAMAMBA" className="w-8 h-8 rounded-lg bg-[#1e1e1e] hover:bg-[#0077B5] text-stone-300 hover:text-white border border-[#2e2e2e] flex items-center justify-center transition-colors">
              <Linkedin className="w-3.5 h-3.5" />
            </a>
            <a href="https://x.com/BBarakashamamba" target="_blank" rel="noopener noreferrer" aria-label="Profil X (Twitter)" title="X (Twitter) - @BBarakashamamba" className="w-8 h-8 rounded-lg bg-[#1e1e1e] hover:bg-black text-stone-300 hover:text-white border border-[#2e2e2e] flex items-center justify-center transition-colors">
              <Twitter className="w-3.5 h-3.5" />
            </a>
            <a href="https://wa.me/243993853036?text=Bonjour%20NyumbaLink%2C%20je%20souhaite%20des%20informations" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp NyumbaLink" title="WhatsApp NyumbaLink" className="w-8 h-8 rounded-lg bg-[#1e1e1e] hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#2e2e2e] flex items-center justify-center transition-colors">
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Bottom copyright */}
      </div>
    </footer>
  );
};


