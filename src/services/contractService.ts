import { InquiryMessage, addInquiry, getUserInquiries, updateContractInquiryStatus } from './inquiryService';
import { collection, deleteDoc, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export type ContractStatus = 'pending' | 'active' | 'expired' | 'terminated';

export interface RentalContract {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyNeighborhood: string;
  propertyCommune: string;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  landlordId: string;
  landlordName: string;
  landlordPhone: string;
  landlordEmail?: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  depositAmount: number;
  status: ContractStatus;
  createdAt: string;
}

const STORAGE_KEY = 'nyumbalink_rental_contracts_v2';
const CONTRACTS_COLLECTION = 'contracts';
const READ_ALERTS_STORAGE_PREFIX = 'nyumbalink_read_contract_alerts_';

type ContractAlertKind = 'pending' | 'confirmed' | 'expired' | 'expiringSoon';

const getReadContractAlerts = (userUid: string): Set<string> => {
  try {
    const raw = localStorage.getItem(`${READ_ALERTS_STORAGE_PREFIX}${userUid}`);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

export const markContractAlertAsRead = (
  userUid: string,
  kind: ContractAlertKind,
  contractId: string,
  isRead = true
): void => {
  const readAlerts = getReadContractAlerts(userUid);
  const alertKey = `${kind}:${contractId}`;
  if (isRead) {
    readAlerts.add(alertKey);
  } else {
    readAlerts.delete(alertKey);
  }
  try {
    localStorage.setItem(`${READ_ALERTS_STORAGE_PREFIX}${userUid}`, JSON.stringify(Array.from(readAlerts)));
  } catch (err) {
    console.warn('Could not save contract alert read state:', err);
  }
};

const getLocalContracts = (user: any): RentalContract[] => {
  if (!user) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const all: RentalContract[] = JSON.parse(raw);
    if (user.role === 'admin' || user.email === 'benite.baraka@nyumbalink.cd') return all;
    return all.filter(c => c.tenantId === user.uid || c.landlordId === user.uid);
  } catch (e) {
    console.error('Erreur chargement contrats:', e);
    return [];
  }
};

export const migrateLocalContractsToFirestore = async (user: any): Promise<void> => {
  if (!user || user.role === 'admin') return;
  const localContracts = getLocalContracts(user).filter((contract) => contract.tenantId === user.uid);
  await Promise.all(localContracts.map(async (contract) => {
    try {
      await setDoc(doc(db, CONTRACTS_COLLECTION, contract.id), contract, { merge: true });
    } catch (err) {
      console.warn('Could not migrate local contract:', contract.id, err);
    }
  }));
};

export const getUserContracts = async (user: any): Promise<RentalContract[]> => {
  if (!user) return [];
  try {
    if (user.role === 'admin') {
      const snapshot = await getDocs(collection(db, CONTRACTS_COLLECTION));
      return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as RentalContract));
    }
    const tenantQuery = query(collection(db, CONTRACTS_COLLECTION), where('tenantId', '==', user.uid));
    const landlordQuery = query(collection(db, CONTRACTS_COLLECTION), where('landlordId', '==', user.uid));
    const [tenantSnapshot, landlordSnapshot] = await Promise.all([getDocs(tenantQuery), getDocs(landlordQuery)]);
    const merged = new Map<string, RentalContract>();
    [...tenantSnapshot.docs, ...landlordSnapshot.docs].forEach((item) => {
      merged.set(item.id, { id: item.id, ...item.data() } as RentalContract);
    });
    if (merged.size > 0) return Array.from(merged.values());
  } catch (err) {
    console.warn('Firestore contracts fetch failed, using local cache:', err);
  }
  return getLocalContracts(user);
};

export const createContract = async (contractData: Omit<RentalContract, 'id' | 'createdAt'>): Promise<RentalContract> => {
  const newContract: RentalContract = {
    ...contractData,
    id: 'cnt-' + Date.now(),
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, CONTRACTS_COLLECTION, newContract.id), newContract);
  return newContract;
};

export const createContractRequest = async (contract: RentalContract): Promise<InquiryMessage> => {
  return addInquiry({
    propertyId: contract.propertyId,
    propertyTitle: contract.propertyTitle,
    propertyNeighborhood: contract.propertyNeighborhood,
    propertyCommune: contract.propertyCommune,
    propertyOwnerId: contract.landlordId,
    propertyOwnerName: contract.landlordName,
    propertyOwnerPhone: contract.landlordPhone,
    propertyOwnerEmail: contract.landlordEmail,
    senderUid: contract.tenantId,
    senderName: contract.tenantName || 'Locataire NyumbaLink',
    senderPhone: contract.tenantPhone || '',
    message: `Demande de confirmation du contrat de bail pour ${contract.propertyTitle}. Loyer : ${contract.monthlyRent} USD/mois, du ${contract.startDate} au ${contract.endDate}.`,
    channel: 'direct',
    contractId: contract.id,
    contractStatus: 'pending'
  });
};

export const confirmContract = async (
  contractId: string,
  confirmerName: string,
  confirmerUid?: string
): Promise<RentalContract | null> => {
  const snapshot = await getDocs(query(collection(db, CONTRACTS_COLLECTION), where('__name__', '==', contractId)));
  const contract = snapshot.empty ? null : ({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as RentalContract);
  if (!contract || contract.status !== 'pending') return contract;

  const updatedContract = { ...contract, status: 'active' as ContractStatus };
  await updateDoc(doc(db, CONTRACTS_COLLECTION, contractId), { status: 'active' });

  await updateContractInquiryStatus(contractId, 'active', {
    text: `Contrat confirmé par ${confirmerName}. Le bail est maintenant conclu et actif.`,
    repliedAt: new Date().toISOString(),
    agentName: confirmerName,
    agentUid: confirmerUid
  });

  return updatedContract;
};

export const deleteContract = async (contractId: string): Promise<void> => {
  await deleteDoc(doc(db, CONTRACTS_COLLECTION, contractId));
};

export const getDaysRemaining = (endDateStr: string): number => {
  const end = new Date(endDateStr || '').getTime();
  const now = new Date().getTime();
  if (Number.isNaN(end)) return -1;
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
};

export interface ContractNotificationSummary {
  pending: { contract: RentalContract; role: 'tenant' | 'landlord' | 'admin'; message: string; isRead: boolean }[];
  confirmed: { contract: RentalContract; role: 'tenant' | 'landlord' | 'admin'; message: string; isRead: boolean }[];
  expired: { contract: RentalContract; role: 'tenant' | 'landlord' | 'admin'; message: string; isRead: boolean }[];
  expiringSoon: { contract: RentalContract; role: 'tenant' | 'landlord' | 'admin'; message: string; isRead: boolean }[];
  totalAlerts: number;
  unreadAlerts: number;
}

export const getContractNotifications = async (user: any): Promise<ContractNotificationSummary> => {
  const loadedContracts = await getUserContracts(user);
  if (!user) return { pending: [], confirmed: [], expired: [], expiringSoon: [], totalAlerts: 0, unreadAlerts: 0 };

  const contracts = Array.from(
    new Map(
      loadedContracts
        .filter((contract) => user.role === 'admin' || contract.tenantId === user.uid || contract.landlordId === user.uid)
        .map((contract) => [
        `${contract.propertyId}:${contract.tenantId}:${contract.landlordId}:${contract.startDate}:${contract.endDate}`,
        contract
        ])
    ).values()
  );

  const pending: ContractNotificationSummary['pending'] = [];
  const confirmed: ContractNotificationSummary['confirmed'] = [];
  const expired: ContractNotificationSummary['expired'] = [];
  const expiringSoon: ContractNotificationSummary['expiringSoon'] = [];
  const readAlerts = getReadContractAlerts(user.uid);
  const contractInquiries = await getUserInquiries(user, true);
  const confirmedInquiryIds = new Set(
    contractInquiries
      .filter((inquiry) => inquiry.contractId && inquiry.contractStatus === 'active' && inquiry.agentReply)
      .map((inquiry) => inquiry.contractId)
  );

  contracts.forEach((contract) => {
    const days = getDaysRemaining(contract.endDate);
    const role = user.role === 'admin'
      ? 'admin'
      : contract.tenantId === user.uid
        ? 'tenant'
        : 'landlord';

    if (contract.status === 'pending') {
      pending.push({
        contract,
        role,
        message: role === 'landlord'
          ? `Le locataire ${contract.tenantName} attend votre confirmation pour ce contrat.`
          : 'Votre demande de contrat est en attente de confirmation par le propriétaire.',
        isRead: readAlerts.has(`pending:${contract.id}`)
      });
    } else if (contract.status === 'active' && confirmedInquiryIds.has(contract.id)) {
      confirmed.push({
        contract,
        role,
        message: role === 'landlord' || role === 'admin'
          ? `Vous avez confirmé le contrat ${contract.propertyTitle}.`
          : `Bonjour, votre contrat ${contract.propertyTitle} a été conclu par le propriétaire.`,
        isRead: readAlerts.has(`confirmed:${contract.id}`)
      });
    } else if (contract.status === 'expired' || days < 0) {
      expired.push({
        contract,
        role,
        message: `Le contrat de ${contract.propertyTitle} est arrivé à échéance.`,
        isRead: readAlerts.has(`expired:${contract.id}`)
      });
    } else if (contract.status === 'active' && days <= 30) {
      expiringSoon.push({
        contract,
        role,
        message: `Le contrat de ${contract.propertyTitle} arrive à échéance dans ${days} jour(s).`,
        isRead: readAlerts.has(`expiringSoon:${contract.id}`)
      });
    }
  });

  return {
    pending,
    confirmed,
    expired,
    expiringSoon,
    totalAlerts: pending.length + confirmed.length + expired.length + expiringSoon.length,
    unreadAlerts: [...pending, ...confirmed, ...expired, ...expiringSoon].filter((alert) => !alert.isRead).length
  };
};

export const getContractStatusDetails = (status: ContractStatus, endDateStr: string) => {
  const days = getDaysRemaining(endDateStr);
  if (status === 'pending') {
    return { label: 'En attente signature', color: 'blue', description: 'Demande transmise au propriétaire' };
  }
  if (status === 'active') {
    return { label: 'Contrat Actif', color: 'emerald', description: `${days} jours restants` };
  }
  return { label: 'Clôturé / Expiré', color: 'gray', description: 'Contrat non actif' };
};