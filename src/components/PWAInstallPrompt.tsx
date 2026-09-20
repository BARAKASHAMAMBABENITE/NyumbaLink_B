import React, { useEffect, useState } from 'react';
import {
  Download,
  Smartphone,
  X,
  Wifi,
  WifiOff,
  CheckCircle2,
  Share,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState<boolean>(false);

  useEffect(() => {
    // 1. Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[NyumbaLink PWA] Service Worker inscrit avec succès:', reg.scope);
          })
          .catch((err) => {
            console.warn('[NyumbaLink PWA] Erreur inscription SW:', err);
          });
      });
    }

    // 2. Detect Standalone / Installed Mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };
    checkStandalone();

    // 3. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // 4. Capture beforeinstallprompt event (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user previously dismissed prompt
      const dismissed = localStorage.getItem('nyumbalink_pwa_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Detect Online / Offline state
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 6. Listen for appinstalled event
    const handleAppInstalled = () => {
      setInstalledSuccess(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('[NyumbaLink PWA] L\'utilisateur a accepté l\'installation');
        setInstalledSuccess(true);
      } else {
        console.log('[NyumbaLink PWA] L\'utilisateur a décliné l\'installation');
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else if (isIOS) {
      setShowIOSInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('nyumbalink_pwa_dismissed', 'true');
  };

  // If already running in standalone native mode, show subtle connection status badge when offline
  if (isStandalone) {
    if (!isOnline) {
      return (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 bg-amber-900/90 backdrop-blur-md text-amber-100 px-4 py-2.5 rounded-2xl shadow-xl border border-amber-700/50 flex items-center justify-between text-xs font-bold animate-in slide-in-from-bottom-2">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Mode Hors-Ligne activé • Offres immobilières en cache</span>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {/* Offline Toast Banner if connectivity is lost */}
      {!isOnline && (
        <div className="fixed top-16 left-0 right-0 z-50 bg-slate-900 text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center space-x-2 shadow-md animate-in fade-in">
          <WifiOff className="w-4 h-4 text-slate-300 shrink-0" />
          <span>Connexion interrompue • NyumbaLink fonctionne toujours en mode hors-ligne à Bukavu</span>
        </div>
      )}

      {/* Success Notification after installation */}
      {installedSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#222222] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center space-x-3 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-[#FF385C] shrink-0" />
          <span>Application NyumbaLink installée avec succès sur votre écran d'accueil !</span>
        </div>
      )}

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-[#FF385C]/10 rounded-2xl flex items-center justify-center text-[#FF385C] mx-auto mb-2">
                <Share className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                Installer sur iPhone / Safari
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Suivez ces 2 étapes simples pour ajouter NyumbaLink à votre écran d'accueil :
              </p>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl text-xs font-medium text-slate-700 border border-slate-200">
              <div className="flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-[#FF385C] text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                  1
                </span>
                <p>
                  Appuyez sur le bouton <strong>Partager</strong>{' '}
                  <Share className="w-3.5 h-3.5 inline text-[#FF385C]" /> dans la barre de votre navigateur Safari.
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-[#FF385C] text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                  2
                </span>
                <p>
                  Faites défiler vers le bas et appuyez sur{' '}
                  <strong className="text-slate-900">« Sur l'écran d'accueil »</strong> (Add to Home Screen).
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full mt-4 bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800 transition"
            >
              C'est compris !
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Floating PWA Installation Banner */}
      {(showPrompt || (isIOS && !localStorage.getItem('nyumbalink_pwa_dismissed'))) && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl border border-slate-700/80 animate-in slide-in-from-bottom-5 duration-300">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FF385C] p-0.5 shadow-md shrink-0">
              <img
                src="/pwa-icon.svg"
                alt="NyumbaLink App Icon"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>

            <div className="flex-grow pr-4">
              <div className="flex items-center space-x-1.5">
                <h4 className="text-xs font-black text-white tracking-wide">
                  NyumbaLink Bukavu
                </h4>
                <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-[#FF385C]/20 text-[#FF385C] rounded border border-[#FF385C]/30">
                  APP PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                Installez l'application mobile pour naviguer rapidement à Ibanda, Kadutu & Bagira.
              </p>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF385C] shrink-0" />
              <span>Gratuit • Mode hors-ligne</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold transition"
              >
                Plus tard
              </button>

              <button
                onClick={handleInstallClick}
                className="bg-[#FF385C] hover:opacity-90 text-white font-extrabold px-3.5 py-1.5 rounded-xl text-xs transition shadow-md flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Installer l'App</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
