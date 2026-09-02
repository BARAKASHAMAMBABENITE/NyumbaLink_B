import React, { useState, useEffect, useRef } from 'react';
import { Camera, Loader2, Image as ImageIcon, Trash2, Upload, Check } from 'lucide-react';

interface UserAvatarProps {
  avatarUrl?: string;
  fullname?: string;
  email?: string;
  role?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  editable?: boolean;
  onAvatarChange?: (newAvatarUrl: string) => void;
}

/**
 * Optimizes and crops user photo to a lightweight 300x300 JPEG Data URL
 */
export const compressAvatarImage = (file: File, maxSize = 300): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const width = img.width;
        const height = img.height;

        // Crop to centered square
        const minDim = Math.min(width, height);
        const startX = (width - minDim) / 2;
        const startY = (height - minDim) / 2;

        canvas.width = maxSize;
        canvas.height = maxSize;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, maxSize, maxSize);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(event.target?.result as string);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  fullname = '',
  email = '',
  role,
  size = 'md',
  className = '',
  editable = false,
  onAvatarChange
}) => {
  const [imageError, setImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset image error whenever avatarUrl changes
  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const getInitial = (): string => {
    if (fullname && fullname.trim().length > 0) {
      return fullname.trim().charAt(0).toUpperCase();
    }
    if (email && email.trim().length > 0) {
      return email.trim().charAt(0).toUpperCase();
    }
    return 'U';
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-24 h-24 text-3xl'
  };

  const getRoleBg = () => {
    if (role === 'admin') return 'bg-[#222222] text-[#FF385C] border border-[#FF385C]/30';
    if (role === 'agent') return 'bg-gradient-to-br from-[#FF385C] to-[#E00B41] text-white';
    if (role === 'bailleur') return 'bg-gradient-to-br from-amber-500 to-amber-700 text-white';
    return 'bg-[#FF385C] text-white';
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).');
      return;
    }

    try {
      setIsUploading(true);
      const compressedDataUrl = await compressAvatarImage(file, 300);
      if (onAvatarChange) {
        onAvatarChange(compressedDataUrl);
      }
      setShowModal(false);
    } catch (err) {
      console.error('Erreur lors du traitement de la photo:', err);
      alert('Une erreur est survenue lors du chargement de l\'image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleApplyUrl = () => {
    if (!customUrlInput.trim()) return;
    if (onAvatarChange) {
      onAvatarChange(customUrlInput.trim());
    }
    setCustomUrlInput('');
    setShowModal(false);
  };

  const handleRemoveAvatar = () => {
    if (onAvatarChange) {
      onAvatarChange('');
    }
    setShowModal(false);
  };

  const hasValidImage = typeof avatarUrl === 'string' && avatarUrl.trim().length > 0 && !imageError;

  return (
    <>
      <div className={`relative inline-block shrink-0 ${className}`}>
        <div
          onClick={() => {
            if (editable) setShowModal(true);
          }}
          className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center font-extrabold select-none shadow-xs transition ${
            editable ? 'cursor-pointer hover:ring-2 hover:ring-[#FF385C] hover:ring-offset-2' : ''
          } ${hasValidImage ? 'bg-stone-100 dark:bg-stone-800' : getRoleBg()}`}
          title={editable ? 'Cliquez pour modifier votre photo de profil' : fullname}
        >
          {hasValidImage ? (
            <img
              src={avatarUrl}
              alt={fullname || 'Avatar'}
              referrerPolicy="no-referrer"
              loading="eager"
              onError={() => {
                console.warn('Image profil impossible à charger, affichage de l\'initiale:', avatarUrl);
                setImageError(true);
              }}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span>{getInitial()}</span>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full z-10">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
          )}
        </div>

        {editable && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="absolute -bottom-1 -right-1 p-1.5 bg-white dark:bg-stone-900 text-[#222222] dark:text-white border border-stone-200 dark:border-stone-700 hover:text-[#FF385C] rounded-full shadow-md cursor-pointer transition transform hover:scale-110"
            title="Modifier la photo de profil"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Profile Photo Change Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#ebebeb] dark:border-[#2e2e2e] space-y-5">
            <div className="text-center space-y-2">
              <div className="mx-auto flex justify-center">
                <div
                  className={`w-20 h-20 rounded-full overflow-hidden flex items-center justify-center font-extrabold text-3xl shadow-md ${
                    hasValidImage ? 'bg-stone-100 dark:bg-stone-800' : getRoleBg()
                  }`}
                >
                  {hasValidImage ? (
                    <img
                      src={avatarUrl}
                      alt={fullname}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span>{getInitial()}</span>
                  )}
                </div>
              </div>
              <h3 className="text-base font-bold text-[#222222] dark:text-white">
                Photo de profil
              </h3>
              <p className="text-xs text-[#717171] dark:text-[#b0b0b0]">
                Personnalisez votre photo visible sur NyumbaLink Bukavu
              </p>
            </div>

            <div className="space-y-3">
              {/* Option 1: File Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full py-2.5 px-4 bg-[#FF385C] hover:bg-[#E00B41] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-sm shadow-[#FF385C]/20"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>Choisir une photo de mon appareil</span>
              </button>

              {/* Option 2: Image URL */}
              <div className="space-y-1.5 pt-2 border-t border-[#ebebeb] dark:border-[#2e2e2e]">
                <label className="block text-[11px] font-semibold text-[#717171] dark:text-[#b0b0b0]">
                  Ou coller une URL d'image (Web) :
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-[#f7f7f7] dark:bg-[#121212] border border-[#ebebeb] dark:border-[#2e2e2e] rounded-xl px-3 py-2 text-xs text-[#222222] dark:text-white focus:outline-none focus:border-[#FF385C]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    disabled={!customUrlInput.trim()}
                    className="p-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold rounded-xl text-xs hover:opacity-90 disabled:opacity-40 transition cursor-pointer"
                    title="Appliquer l'URL"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Option 3: Remove avatar if exists */}
              {hasValidImage && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="w-full py-2 px-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer la photo (garder la lettre)</span>
                </button>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full py-2 bg-stone-100 dark:bg-[#282828] hover:bg-stone-200 dark:hover:bg-[#333333] text-[#222222] dark:text-[#f7f7f7] font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
