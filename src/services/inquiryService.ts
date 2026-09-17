import { UserProfile } from '../types';
import { notifyNewInquiryReceived, notifyInquiryReply } from './notificationService';
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';

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
  recipientId?: string;
  senderUid?: string;
  senderName: string;
  senderPhone: string;
  senderEmail?: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  readBy?: string[];
  deletedFor?: string[];
  channel: 'whatsapp' | 'direct' | 'call';
  contractId?: string;
  contractStatus?: 'pending' | 'active' | 'terminated';
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
const INQUIRIES_COLLECTION = 'inquiries';

const getInquiryVisibility = (inquiry: InquiryMessage, userUid: string): InquiryMessage => ({
  ...inquiry,
  isRead: Boolean(inquiry.readBy?.includes(userUid)),
  deletedFor: inquiry.deletedFor || []
});

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

const getLocalInquiries = (): InquiryMessage[] => {
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

const saveLocalInquiries = (items: InquiryMessage[]) => {
  try {
    localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to cache inquiries:', err);
  }
};

export const migrateLocalInquiriesToFirestore = async (user: UserProfile | null): Promise<void> => {
  if (!user) return;
  const localItems = getLocalInquiries().filter((item) =>
    item.senderUid === user.uid || item.propertyOwnerId === user.uid
  );
  await Promise.all(localItems.map(async (item) => {
    try {
      await setDoc(doc(db, INQUIRIES_COLLECTION, item.id), cleanInquiry(item), { merge: true });
    } catch (err) {
      console.warn('Could not migrate local inquiry:', item.id, err);
    }
  }));
};

const cleanInquiry = (inquiry: InquiryMessage): Record<string, unknown> => {
  const cleaned: Record<string, unknown> = { ...inquiry };
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined || cleaned[key] === null) delete cleaned[key];
  });
  return cleaned;
};

export const getInquiries = async (): Promise<InquiryMessage[]> => {
  try {
    const snapshot = await getDocs(collection(db, INQUIRIES_COLLECTION));
    if (snapshot.empty) return getLocalInquiries();
    const inquiries = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() } as InquiryMessage))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    saveLocalInquiries(inquiries);
    return inquiries;
  } catch (err) {
    console.warn('Firestore inquiries fetch failed, using local cache:', err);
    return getLocalInquiries();
  }
};

/**
 * Filter inquiries strictly based on user identity for privacy
 */
export const getUserInquiries = async (user: UserProfile | null, includeContractInquiries = false): Promise<InquiryMessage[]> => {
  if (!user) return [];

  // Super-admin or official admin email sees all for platform supervision
  const isAdmin = user.role === 'admin' || user.email?.toLowerCase() === 'benbarakashamamba@gmail.com';
  try {
    if (isAdmin) {
      const allInquiries = await getInquiries();
        return (includeContractInquiries ? allInquiries : allInquiries.filter((item) => !item.contractId))
          .filter((item) => !item.deletedFor?.includes(user.uid))
          .map((item) => getInquiryVisibility(item, user.uid));
    }

    const senderQuery = query(collection(db, INQUIRIES_COLLECTION), where('senderUid', '==', user.uid));
    const ownerQuery = query(collection(db, INQUIRIES_COLLECTION), where('propertyOwnerId', '==', user.uid));
    const [senderSnapshot, ownerSnapshot] = await Promise.all([getDocs(senderQuery), getDocs(ownerQuery)]);
    const merged = new Map<string, InquiryMessage>();
    [...senderSnapshot.docs, ...ownerSnapshot.docs].forEach((item) => {
      merged.set(item.id, { id: item.id, ...item.data() } as InquiryMessage);
    });
    if (merged.size > 0) {
      const userInquiries = Array.from(merged.values())
        .filter((item) => {
          if (!includeContractInquiries && item.contractId) return false;
          if (includeContractInquiries && item.contractId) {
            return item.senderUid === user.uid || item.propertyOwnerId === user.uid;
          }
          return true;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return userInquiries
        .filter((item) => !item.deletedFor?.includes(user.uid))
        .map((item) => getInquiryVisibility(item, user.uid));
    }
  } catch (err) {
    console.warn('Firestore user inquiries fetch failed, using local cache:', err);
  }

  const all = getLocalInquiries();

  const userEmail = user.email?.toLowerCase().trim();
  const userPhone = user.phone?.replace(/\D/g, '');
  const userUid = user.uid;

  if (user.role === 'agent' || user.role === 'bailleur') {
    return all.filter((inq) => {
      if (inq.contractId) {
        return includeContractInquiries && (inq.senderUid === userUid || inq.propertyOwnerId === userUid);
      }
      // Is property owner / assigned agent
      const isOwner = inq.propertyOwnerId === userUid ||
        (userEmail && inq.propertyOwnerEmail?.toLowerCase().trim() === userEmail) ||
        (userPhone && inq.propertyOwnerPhone?.replace(/\D/g, '') === userPhone);

      // Or is the sender of this message
      const isSender = inq.senderUid === userUid ||
        (userEmail && inq.senderEmail?.toLowerCase().trim() === userEmail) ||
        (userPhone && inq.senderPhone.replace(/\D/g, '') === userPhone);

      return isOwner || isSender;
    }).filter((inq) => !inq.deletedFor?.includes(userUid)).map((inq) => getInquiryVisibility(inq, userUid));
  }

  // Regular client: ONLY sees inquiries they initiated/sent and replies received from agent/admin
  return all.filter((inq) => {
    if (inq.contractId) {
      return includeContractInquiries && inq.senderUid === userUid;
    }
    const matchesUid = inq.senderUid && inq.senderUid === userUid;
    const matchesEmail = Boolean(userEmail && inq.senderEmail && inq.senderEmail.toLowerCase().trim() === userEmail);
    const matchesPhone = Boolean(userPhone && inq.senderPhone && inq.senderPhone.replace(/\D/g, '') === userPhone);
    return matchesUid || matchesEmail || matchesPhone;
  }).filter((inq) => !inq.deletedFor?.includes(userUid)).map((inq) => getInquiryVisibility(inq, userUid));
};

export const addInquiry = async (inquiry: Omit<InquiryMessage, 'id' | 'createdAt' | 'isRead'>): Promise<InquiryMessage> => {
  const newInquiry: InquiryMessage = {
    ...inquiry,
    id: `inq-${Date.now()}`,
    createdAt: new Date().toISOString(),
    isRead: false,
    readBy: [],
    deletedFor: []
  };
  try {
    await setDoc(doc(db, INQUIRIES_COLLECTION, newInquiry.id), cleanInquiry(newInquiry));
  } catch (err) {
    console.warn('Firestore inquiry save failed, saving locally:', err);
    saveLocalInquiries([newInquiry, ...getLocalInquiries()]);
  }

  // Notify only the property owner, never the client who just sent the request.
  try {
    const activeUser = typeof localStorage !== 'undefined'
      ? JSON.parse(localStorage.getItem('nyumbalink_active_user') || 'null') as UserProfile | null
      : null;
    if (activeUser?.uid === newInquiry.propertyOwnerId) {
      notifyNewInquiryReceived(newInquiry);
    }
  } catch (e) {
    console.warn('Could not trigger native inquiry notification:', e);
  }

  return newInquiry;
};

export const replyToInquiry = async (id: string, replyText: string, agentName = 'Agent NyumbaLink', agentUid?: string): Promise<InquiryMessage[]> => {
  let repliedItem: InquiryMessage | null = null;

  const agentReply = { text: replyText, repliedAt: new Date().toISOString(), agentName, agentUid };
  const updated = (await getInquiries()).map((item) => {
    if (item.id !== id) return item;
    const withReply = { ...item, isRead: false, agentReply };
    repliedItem = withReply;
    return withReply;
  });
  const updatedItem = repliedItem;
  if (updatedItem) {
    try {
      await updateDoc(doc(db, INQUIRIES_COLLECTION, id), {
        agentReply,
        isRead: false,
        readBy: []
      });
    } catch (error) {
      saveLocalInquiries(updated);
    }
  }

  // Notify only the client who created this inquiry.
  if (repliedItem) {
    try {
      const activeUser = typeof localStorage !== 'undefined'
        ? JSON.parse(localStorage.getItem('nyumbalink_active_user') || 'null') as UserProfile | null
        : null;
      if (activeUser?.uid === repliedItem.senderUid) {
        notifyInquiryReply(repliedItem);
      }
    } catch (e) {
      console.warn('Could not trigger native reply notification:', e);
    }
  }

  return updated;
};

export const markInquiryAsRead = async (id: string, userUid: string): Promise<InquiryMessage[]> => {
  if (!userUid) return [];
  try {
    const inquiryRef = doc(db, INQUIRIES_COLLECTION, id);
    const current = (await getDocs(query(collection(db, INQUIRIES_COLLECTION), where('__name__', '==', id)))).docs[0];
    const existing = current ? current.data() as InquiryMessage : null;
    if (!existing) return [];
    const readBy = Array.from(new Set([...(existing.readBy || []), userUid]));
    await updateDoc(inquiryRef, { readBy, isRead: false });
  } catch (error) {
    const local = getLocalInquiries();
    saveLocalInquiries(local.map((item) => item.id === id
      ? { ...item, readBy: Array.from(new Set([...(item.readBy || []), userUid])) }
      : item));
  }
  return getInquiries();
};

export const deleteInquiry = async (id: string, userUid: string): Promise<InquiryMessage[]> => {
  if (!userUid) return [];
  try {
    const inquiryRef = doc(db, INQUIRIES_COLLECTION, id);
    const snapshot = await getDocs(query(collection(db, INQUIRIES_COLLECTION), where('__name__', '==', id)));
    const existing = snapshot.docs[0]?.data() as InquiryMessage | undefined;
    if (!existing) return [];
    const deletedFor = Array.from(new Set([...(existing.deletedFor || []), userUid]));
    await updateDoc(inquiryRef, { deletedFor });
  } catch (error) {
    const local = getLocalInquiries();
    saveLocalInquiries(local.map((item) => item.id === id
      ? { ...item, deletedFor: Array.from(new Set([...(item.deletedFor || []), userUid])) }
      : item));
  }
  return getInquiries();
};

export const updateContractInquiryStatus = async (
  contractId: string,
  status: InquiryMessage['contractStatus'],
  agentReply?: InquiryMessage['agentReply']
): Promise<InquiryMessage[]> => {
  const current = await getInquiries();
  const updated = current.map((item) => item.contractId === contractId
    ? { ...item, contractStatus: status, isRead: false, ...(agentReply ? { agentReply } : {}) }
    : item);
  const updatedInquiry = updated.find((item) => item.contractId === contractId);
  if (updatedInquiry) {
    try {
      await updateDoc(doc(db, INQUIRIES_COLLECTION, updatedInquiry.id), {
        contractStatus: status,
        isRead: false,
        ...(agentReply ? { agentReply, readBy: [] } : {})
      });
    } catch (error) {
      saveLocalInquiries(updated);
    }
  }

  if (updatedInquiry?.agentReply) {
    try {
      const activeUser = typeof localStorage !== 'undefined'
        ? JSON.parse(localStorage.getItem('nyumbalink_active_user') || 'null') as UserProfile | null
        : null;
      if (activeUser?.uid === updatedInquiry.senderUid) {
        notifyInquiryReply(updatedInquiry);
      }
    } catch (error) {
      console.warn('Could not trigger contract confirmation notification:', error);
    }
  }

  return updated;
};

