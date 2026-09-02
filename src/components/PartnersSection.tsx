import React from 'react';
import { Sofa, ArrowRight } from 'lucide-react';
import { PartnerB2B } from '../types';

export const LOCAL_PARTNERS: PartnerB2B[] = [];

interface PartnersSectionProps {
  onOpenPartnerModal?: () => void;
  onOpenFurnitureModal?: () => void;
}

export const PartnersSection: React.FC<PartnersSectionProps> = ({
  onOpenFurnitureModal
}) => {
  if (!onOpenFurnitureModal) return null;

  return (
    <section className="py-8 sm:py-10 bg-slate-50 dark:bg-[#151515] border-y border-slate-200/80 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#2e2e2e] rounded-2xl shadow-xs">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center shrink-0">
              <Sofa className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                Mobilier & Équipements de Logement
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Découvrez les meubles, électroménagers et équipements disponibles à Bukavu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenFurnitureModal}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 py-2.5 px-5 bg-[#FF385C] hover:bg-[#e00b41] text-white rounded-xl font-bold text-xs sm:text-sm transition shadow-xs shrink-0 cursor-pointer"
          >
            <Sofa className="w-4 h-4" />
            <span>Voir le Mobilier & Équipements</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

