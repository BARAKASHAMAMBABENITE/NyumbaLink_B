import { Property } from '../types';
import { InquiryMessage } from './inquiryService';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

const NOTIFICATION_PERMISSION_KEY = 'nyumbalink_notification_enabled';

/**
 * Check if the browser and device support native Web Notifications
 */
export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

/**
 * Check if Service Worker is supported
 */
export const isServiceWorkerSupported = (): boolean => {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
};

/**
 * Get current system permission state: 'granted' | 'denied' | 'default' | 'unsupported'
 */
export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

/**
 * Register Service Worker for PWA and background notifications
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isServiceWorkerSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    console.log('[NyumbaLink] Service Worker registered with scope:', registration.scope);
    return registration;
  } catch (error) {
    console.warn('[NyumbaLink] Service Worker registration failed:', error);
    return null;
  }
};

/**
 * Request notification permission from the user/phone
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    console.warn('[NyumbaLink] Notifications not supported in this browser.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    const isGranted = permission === 'granted';

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, isGranted ? 'true' : 'false');
    }

    if (isGranted) {
      await registerServiceWorker();
    }

    return isGranted;
  } catch (error) {
    console.error('[NyumbaLink] Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Send a native notification to the user's phone notification bar
 */
export const sendNativePhoneNotification = async (payload: NotificationPayload): Promise<boolean> => {
  if (!isNotificationSupported()) return false;

  // If permission is not granted, skip
  if (Notification.permission !== 'granted') {
    console.log('[NyumbaLink] Notification skipped: permission not granted.');
    return false;
  }

  const {
    title,
    body,
    icon = '/pwa-icon-192.png',
    badge = '/pwa-icon-192.png',
    url = '/',
    tag = 'nyumbalink-' + Date.now()
  } = payload;

  const options: NotificationOptions & { renotify?: boolean; vibrate?: number[] } = {
    body,
    icon,
    badge,
    tag,
    data: { url },
    renotify: true,
    // Vibration pattern for mobile phones (vibrate 200ms, pause 100ms, vibrate 200ms)
    ...(navigator.userAgent.match(/Android|iPhone|iPad/i) ? { vibrate: [200, 100, 200] } : {})
  };

  try {
    // 1. Prefer Service Worker registration (delivers directly to phone notification bar)
    if (isServiceWorkerSupported()) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(title, options as NotificationOptions);
        return true;
      }
    }

    // 2. Fallback to standard Window Notification
    new Notification(title, options as NotificationOptions);
    return true;
  } catch (error) {
    console.warn('[NyumbaLink] Error showing notification via SW, trying fallback:', error);
    try {
      new Notification(title, options as NotificationOptions);
      return true;
    } catch (fallbackErr) {
      console.error('[NyumbaLink] Failed to trigger notification:', fallbackErr);
      return false;
    }
  }
};

/**
 * Trigger native notification when a new message/inquiry is received
 */
export const notifyNewInquiryReceived = async (inquiry: InquiryMessage): Promise<void> => {
  await sendNativePhoneNotification({
    title: `📩 Nouveau message de ${inquiry.senderName}`,
    body: `Concernant : ${inquiry.propertyTitle} (${inquiry.propertyNeighborhood})\n"${inquiry.message.slice(0, 80)}${inquiry.message.length > 80 ? '...' : ''}"`,
    url: '/?tab=messages',
    tag: `inquiry-${inquiry.id}`
  });
};

/**
 * Trigger native notification when an agent replies to a client's inquiry
 */
export const notifyInquiryReply = async (inquiry: InquiryMessage): Promise<void> => {
  if (!inquiry.agentReply) return;

  await sendNativePhoneNotification({
    title: `💬 Réponse de ${inquiry.agentReply.agentName}`,
    body: `Pour : ${inquiry.propertyTitle}\n"${inquiry.agentReply.text.slice(0, 90)}${inquiry.agentReply.text.length > 90 ? '...' : ''}"`,
    url: '/?tab=messages',
    tag: `reply-${inquiry.id}`
  });
};

/**
 * Trigger native notification when a new property is published in Bukavu
 */
export const notifyNewPropertyPublished = async (property: Property): Promise<void> => {
  const periodText = property.pricePeriod === 'mois' ? '/mois' : property.pricePeriod === 'an' ? '/an' : '';
  const priceDisplay = property.price 
    ? `${property.price.toLocaleString('fr-FR')} $${periodText}`
    : 'Prix sur demande';

  await sendNativePhoneNotification({
    title: `🏠 Nouveau bien publié à ${property.commune || 'Bukavu'} !`,
    body: `${property.title}\n📍 ${property.neighborhood} • 💰 ${priceDisplay}`,
    icon: property.images?.[0] || '/pwa-icon-192.png',
    url: `/?propertyId=${property.id}`,
    tag: `prop-${property.id}`
  });
};

/**
 * Send a test notification so the user can verify their phone notification bar immediately
 */
export const testNativeNotification = async (): Promise<boolean> => {
  const granted = Notification.permission === 'granted' || (await requestNotificationPermission());
  if (!granted) return false;

  return await sendNativePhoneNotification({
    title: '🔔 NyumbaLink Bukavu - Notifications Actives !',
    body: 'Félicitations ! Vous recevrez désormais vos alertes de nouveaux biens et messages directement sur votre téléphone.',
    url: '/',
    tag: 'test-notification'
  });
};
