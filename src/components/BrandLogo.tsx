import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  textColor?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> =  ({
  size = 'md',
  showText = true,
  className = '',
  textColor
}) => {
  const iconSizeClasses =
    size === 'sm'
      ? 'w-8 h-8 rounded-xl shadow-xs'
      : size === 'lg'
      ? 'w-12 h-12 rounded-2xl shadow-lg'
      : 'w-10 h-10 rounded-xl shadow-sm';

  const textClasses =
    size === 'sm'
      ? 'text-base font-extrabold tracking-tight'
      : size === 'lg'
      ? 'text-2xl font-black tracking-tight'
      : 'text-xl font-black tracking-tight';

  const resolvedTextColor = textColor || 'text-slate-900 dark:text-white';

  return (
    <div className={`flex items-center space-x-2.5 ${className}`}>
      {/* Modern Architectural Vector Logo Icon */}
      <div
        className={`${iconSizeClasses} relative shrink-0 bg-gradient-to-br from-[#FF385C] via-[#E00B41] to-[#B0042D] flex items-center justify-center text-white border border-white/20 overflow-hidden group-hover:scale-105 transition-transform duration-200`}
      >
        {/* Modern House + Link SVG Icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-7 h-7' : 'w-6 h-6'}
        >
          {/* Subtle architectural grid */}
          <path
            d="M3 10L12 3L21 10"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 10V19C6 19.5523 6.44772 20 7 20H17C17.5523 20 18 19.5523 18 19V10"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.85"
          />
          {/* The "Link" node bridging the architecture */}
          <circle cx="12" cy="14" r="2.2" fill="white" />
          <path
            d="M9.5 14H14.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M12 11.8V16.2"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showText && (
        <span className={`${textClasses} font-sans leading-none block select-none ${resolvedTextColor}`}>
          Nyumba<span className="text-[#FF385C]">Link</span>
        </span>
      )}
    </div>
  );
};

