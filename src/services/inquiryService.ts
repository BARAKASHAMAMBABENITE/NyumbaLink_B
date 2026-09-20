import { UserProfile } from '../types';
import { notifyNewInquiryReceived, notifyInquiryReply } from './notificationService';
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  getDoc,
  arrayUnion
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
  isPartnerRequest?: boolean;
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

const cleanInquiry = (inquiry: InquiryMessage): Record<string, any> => {
  return JSON.parse(JSON.stringify(inquiry));
};

export const migrateLocalInquiriesToFirestore = async (user: UserProfile | null): Promise<void> => {
  if (!user) return;
  const localItems = getLocalInquiries().filter((item) =>
    item.senderUid === user.uid || item.propertyOwnerId === user.uid || item.propertyOwnerId === 'admin-global'
  );
  await Promise.all(localItems.map(async (item) => {
    try {
      await setDoc(doc(db, INQUIRIES_COLLECTION, item.id), cleanInquiry(item), { merge: true });
    } catch (err) {
      console.warn('Could not migrate local inquiry:', item.id, err);
    }
  }));
};

export const getUserInquiries = async (user: UserProfile | null): Promise<InquiryMessage[]> => {
  if (!user) return [];

  try {
    const q = query(collection(db, INQUIRIES_COLLECTION));
    const snapshot = await getDocs(q);
    let items: InquiryMessage[] = [];

    if (!snapshot.empty) {
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as InquiryMessage;
        items.push({ ...data, id: docSnap.id });
      });
    } else {
      items = getLocalInquiries();
    }

    // Filtrer pour l'utilisateur connecté
    const filtered = items.filter((item) => {
      if (item.deletedFor?.includes(user.uid)) return false;
      if (user.role === 'admin' || user.isPartner) return true;
      if (user.role === 'agent') {
        return item.propertyOwnerId === user.uid || item.recipientId === user.uid || item.senderUid === user.uid;
      }
      return item.senderUid === user.uid || item.propertyOwnerId === user.uid;
    });

    return filtered.map((item) => getInquiryVisibility(item, user.uid));
  } catch (err) {
    console.warn('Firestore fetch failed, falling back to local storage:', err);
    const local = getLocalInquiries();
    return local.map((item) => getInquiryVisibility(item, user.uid));
  }
};

export const markInquiryAsRead = async (id: string, userUid: string): Promise<void> => {
  try {
    const docRef = doc(db, INQUIRIES_COLLECTION, id);
    await updateDoc(docRef, {
      readBy: arrayUnion(userUid),
      isRead: true
    });
  } catch (err) {
    console.warn('Firestore update failed, updating locally:', err);
    const items = getLocalInquiries();
    const updated = items.map((i) => {
      if (i.id === id) {
        const readBy = i.readBy || [];
        if (!readBy.includes(userUid)) readBy.push(userUid);
        return { ...i, isRead: true, readBy };
      }
      return i;
    });
    saveLocalInquiries(updated);
  }
};

export const deleteInquiry = async (id: string, userUid: string): Promise<void> => {
  try {
    const docRef = doc(db, INQUIRIES_COLLECTION, id);
    await updateDoc(docRef, {
      deletedFor: arrayUnion(userUid)
    });
  } catch (err) {
    console.warn('Firestore delete failed, updating locally:', err);
    const items = getLocalInquiries();
    const updated = items.map((i) => {
      if (i.id === id) {
        const deletedFor = i.deletedFor || [];
        if (!deletedFor.includes(userUid)) deletedFor.includes(userUid) || deletedFor.push(userUid);
        return { ...i, deletedFor };
      }
      return i;
    });
    saveLocalInquiries(updated);
  }
};

export const replyToInquiry = async (
  id: string,
  replyText: string,
  agentName: string,
  agentUid?: string
): Promise<void> => {
  const replyData = {
    text: replyText,
    repliedAt: new Date().toISOString(),
    agentName,
    agentUid
  };

  try {
    const docRef = doc(db, INQUIRIES_COLLECTION, id);
    await updateDoc(docRef, { agentReply: replyData });
    
    // Notification optionnelle
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as InquiryMessage;
      if (data.senderUid) {
        await notifyInquiryReply(data.senderUid, data.propertyTitle, replyText);
      }
    }
  } catch (err) {
    console.warn('Firestore reply failed, updating locally:', err);
    const items = getLocalInquiries();
    const updated = items.map((i) => {
      if (i.id === id) {
        return { ...i, agentReply: replyData };
      }
      return i;
    });
    saveLocalInquiries(updated);
  }
};