import React, { useState, useEffect } from 'react';
import { BellRing, Smartphone, AlertCircle, X } from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  testNativeNotification
} from '../services/notificationService';

interface PhoneNotificationBannerProps {
  compact?: boolean;
}

const DISMISS_BANNER_KEY = 'nyumbalink_notif_banner_dismissed';

export const PhoneNotificationBanner: React.FC<PhoneNotificationBannerProps> = ({ compact = false }) => {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [loading, setLoading] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(DISMISS_BANNER_KEY) === 'true';
    }
    return false;
  });

  const checkStatus = () => {
    if (!isNotificationSupported()) {
      setPermission('unsupported');
      return;
    }
    setPermission(getNotificationPermission());
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DISMISS_BANNER_KEY, 'true');
    }
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      const granted = await requestNotificationPermission();
      checkStatus();
      if (granted) {
        // Automatically send a welcome confirmation notification
        const testOk = await testNativeNotification();
        if (testOk) {
          setTestSuccess(true);
          setTimeout(() => setTestSuccess(false), 4000);
        }
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setLoading(true);
    try {
      const success = await testNativeNotification();
      if (success) {
        setTestSuccess(true);
        setTimeout(() => setTestSuccess(false), 4000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (dismissed || permission === 'unsupported') {
    return null;
  }

  // Already granted
  if (permission === 'granted') {
    return (
      <div className="bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/20 rounded-xl px-3 py-2 flex items-center justify-between gap-2 my-2 text-xs">
        <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300">
          <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-[11px] font-semibold">
            {testSuccess ? (
              <span className="font-bold text-emerald-700 dark:text-emerald-200">
                🚀 Notification envoyée dans la barre de votre téléphone !
              </span>
            ) : (
              'Notifications actives dans la barre de votre téléphone'
            )}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            type="button"
            onClick={handleTestNotification}
            disabled={loading}
            className="text-[10px] font-bold px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Envoi...' : 'Tester'}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            title="Masquer"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Denied - completely hidden
  if (permission === 'denied') {
    return null;
  }

  // Default (not yet prompted or asked)
  return (
    <div className="bg-linear-to-r from-[#FF385C]/10 via-[#FF385C]/5 to-transparent border border-[#FF385C]/20 rounded-xl p-3 my-2 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 relative">
      <div className="flex items-center space-x-2.5 pr-6 sm:pr-0">
        <div className="w-8 h-8 rounded-lg bg-[#FF385C] text-white flex items-center justify-center shrink-0 shadow-xs">
          <BellRing className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <h4 className="font-extrabold text-[#222222] dark:text-white text-xs">
            Recevoir les alertes sur votre téléphone
          </h4>
          <p className="text-[11px] text-[#717171] dark:text-[#b0b0b0]">
            Soyez notifié(e) dans la barre de votre téléphone pour les messages et nouveaux biens.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 w-full sm:w-auto">
        <button
          type="button"
          onClick={handleEnableNotifications}
          disabled={loading}
          className="w-full sm:w-auto px-3.5 py-1.5 bg-[#FF385C] hover:bg-[#e00b41] text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer shrink-0 flex items-center justify-center space-x-1.5 disabled:opacity-50"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{loading ? 'Activation...' : 'Activer'}</span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          title="Fermer"
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
