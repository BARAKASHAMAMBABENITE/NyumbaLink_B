import { UserProfile } from '../types';
import { notifyNewInquiryReceived, notifyInquiryReply } from './notificationService';

export interface InquiryMessage {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyNeighborhood: string;
  propertyCommune?: string;
  propertyPrice?: number;
  propertyImage?: string;
  propertyOwnerId?: string;
  propertyOwnerName?: string;
  propertyOwnerPhone?: string;
  propertyOwnerEmail?: string;
  senderUid?: string;
  senderName: string;
  senderPhone: string;
  senderEmail?: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  channel: 'whatsapp' | 'direct' | 'call';
  visitDate?: string;
  visitTime?: string;
  agentReply?: {
    text: string;
    repliedAt: string;
    agentName: string;
    agentUid?: string;
  };
}

const INQUIRIES_STORAGE_KEY = 'nyumbalink_inquiries_v3';

const DEFAULT_INQUIRIES: InquiryMessage[] = [
  {
    id: 'inq-1',
    propertyId: '1',
    propertyTitle: 'Superbe Villa Moderne avec Vue Panoramique sur le Lac Kivu',
    propertyNeighborhood: 'Ibanda / Nyawera',
    propertyCommune: 'Ibanda',
    propertyPrice: 1200,
    propertyImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
    propertyOwnerId: 'agent-1',
    propertyOwnerName: 'Bénite BARAKA SHAMAMBA',
    propertyOwnerPhone: '+243 986 760 178',
    senderUid: 'demo-client-uid',
    senderName: 'Client NyumbaLink',
    senderPhone: '+243 986 760 178',
    senderEmail: 'benbarakashamamba@gmail.com',
    message: 'Bonjour Agent, je suis très intéressé par cette villa avec vue sur le Lac. Je souhaite programmer une visite ce Samedi à 14h00.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    isRead: false,
    channel: 'direct',
    visitDate: 'Samedi 15 Août 2026',
    visitTime: '14:00',
    agentReply: {
      text: 'Bonjour, votre visite est bien confirmée pour ce Samedi à 14h00. Notre agent vous accueillera à la villa.',
      repliedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      agentName: 'Bénite BARAKA (Agent Agréé)'
    }
  },
  {
    id: 'inq-2',
    propertyId: '2',
    propertyTitle: 'Parcelle Clôturée de 800m² Idéale pour Construction',
    propertyNeighborhood: 'Ibanda / Muhungu',
    propertyCommune: 'Ibanda',
    propertyPrice: 45000,
    propertyImage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    propertyOwnerId: 'agent-1',
    propertyOwnerName: 'Bénite BARAKA SHAMAMBA',
    propertyOwnerPhone: '+243 986 760 178',
    senderUid: 'patient-uid-002',
    senderName: 'Patient Mweze',
    senderPhone: '+243 998 123 456',
    senderEmail: 'patient.mweze@gmail.com',
    message: 'Bonjour, je souhaite obtenir des renseignements complémentaires sur l\'emplacement exact de cette parcelle et visiter Vendredi matin.',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    isRead: true,
    channel: 'whatsapp',
    visitDate: 'Vendredi 14 Août 2026',
    visitTime: '10:00'
  }
];

export const getInquiries = (): InquiryMessage[] => {
  try {
    const data = localStorage.getItem(INQUIRIES_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(DEFAULT_INQUIRIES));
      return DEFAULT_INQUIRIES;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load inquiries:', err);
    return DEFAULT_INQUIRIES;
  }
};

/**
 * Filter inquiries strictly based on user identity for privacy
 */
export const getUserInquiries = (user: UserProfile | null): InquiryMessage[] => {
  const all = getInquiries();
  if (!user) return [];

  // Super-admin or official admin email sees all for platform supervision
  const isAdmin = user.role === 'admin' || user.email?.toLowerCase() === 'benbarakashamamba@gmail.com';
  if (isAdmin) {
    return all;
  }

  const userEmail = user.email?.toLowerCase().trim();
  const userPhone = user.phone?.replace(/\D/g, '');
  const userUid = user.uid;

  if (user.role === 'agent' || user.role === 'bailleur') {
    return all.filter((inq) => {
      // Is property owner / assigned agent
      const isOwner = inq.propertyOwnerId === userUid ||
        (userEmail && inq.propertyOwnerEmail?.toLowerCase().trim() === userEmail) ||
        (userPhone && inq.propertyOwnerPhone?.replace(/\D/g, '') === userPhone);

      // Or is the sender of this message
      const isSender = inq.senderUid === userUid ||
        (userEmail && inq.senderEmail?.toLowerCase().trim() === userEmail) ||
        (userPhone && inq.senderPhone.replace(/\D/g, '') === userPhone);

      return isOwner || isSender;
    });
  }

  // Regular client: ONLY sees inquiries they initiated/sent and replies received from agent/admin
  return all.filter((inq) => {
    const matchesUid = inq.senderUid && inq.senderUid === userUid;
    const matchesEmail = Boolean(userEmail && inq.senderEmail && inq.senderEmail.toLowerCase().trim() === userEmail);
    const matchesPhone = Boolean(userPhone && inq.senderPhone && inq.senderPhone.replace(/\D/g, '') === userPhone);
    return matchesUid || matchesEmail || matchesPhone;
  });
};

export const addInquiry = (inquiry: Omit<InquiryMessage, 'id' | 'createdAt' | 'isRead'>): InquiryMessage => {
  const current = getInquiries();
  const newInquiry: InquiryMessage = {
    ...inquiry,
    id: `inq-${Date.now()}`,
    createdAt: new Date().toISOString(),
    isRead: false
  };
  const updated = [newInquiry, ...current];
  try {
    localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save inquiry:', err);
  }

  // Trigger native mobile notification in phone's notification bar
  try {
    notifyNewInquiryReceived(newInquiry);
  } catch (e) {
    console.warn('Could not trigger native inquiry notification:', e);
  }

  return newInquiry;
};

export const replyToInquiry = (id: string, replyText: string, agentName = 'Agent NyumbaLink', agentUid?: string): InquiryMessage[] => {
  const current = getInquiries();
  let repliedItem: InquiryMessage | null = null;

  const updated = current.map((item) => {
    if (item.id === id) {
      const withReply: InquiryMessage = {
        ...item,
        isRead: true,
        agentReply: {
          text: replyText,
          repliedAt: new Date().toISOString(),
          agentName,
          agentUid
        }
      };
      repliedItem = withReply;
      return withReply;
    }
    return item;
  });

  localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(updated));

  // Trigger native mobile notification for client
  if (repliedItem) {
    try {
      notifyInquiryReply(repliedItem);
    } catch (e) {
      console.warn('Could not trigger native reply notification:', e);
    }
  }

  return updated;
};

export const markInquiryAsRead = (id: string): InquiryMessage[] => {
  const current = getInquiries();
  const updated = current.map((i) => (i.id === id ? { ...i, isRead: true } : i));
  localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteInquiry = (id: string): InquiryMessage[] => {
  const current = getInquiries();
  const updated = current.filter((i) => i.id !== id);
  localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

