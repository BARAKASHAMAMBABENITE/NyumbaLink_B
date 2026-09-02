export type ContractStatus = 'actif' | 'en_attente_confirmation' | 'demande_renouvellement' | 'expire_bientot' | 'termine' | 'resilie';

export interface RentalContract {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyCommune: string;
  propertyNeighborhood: string;
  propertyImage?: string;
  propertyCategory: string;
  // Tenant details (Client)
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  // Landlord / Agent details (Bailleur / Propriétaire / Agent)
  landlordId: string;
  landlordName: string;
  landlordEmail: string;
  landlordPhone: string;
  // Financial terms
  rentAmountUSD: number;
  depositAmountUSD?: number;
  paymentFrequency: 'mensuel' | 'trimestriel' | 'semestriel' | 'annuel';
  // Dates and duration
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD (Délai d'échéance)
  status: ContractStatus;
  notes?: string;
  inquiryId?: string;
  createdByRole?: 'client' | 'bailleur' | 'agent' | 'admin';
  renewalProposal?: {
    requestedEndDate: string;
    requestedRentUSD?: number;
    requestedAt: string;
    requestedBy: string;
  };
  confirmedAt?: string;
  confirmedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

const CONTRACTS_STORAGE_KEY = 'nyumbalink_rental_contracts_v3';

// Clean initial state: no artificial contracts. Only real user/admin contracts created through the app.
const INITIAL_CONTRACTS: RentalContract[] = [];

export const getContracts = (): RentalContract[] => {
  try {
    const raw = localStorage.getItem(CONTRACTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(INITIAL_CONTRACTS));
      return INITIAL_CONTRACTS;
    }
    return JSON.parse(raw) as RentalContract[];
  } catch (err) {
    console.warn('Could not read contracts from localStorage:', err);
    return INITIAL_CONTRACTS;
  }
};

export const saveContracts = (contracts: RentalContract[]): void => {
  try {
    localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(contracts));
  } catch (err) {
    console.warn('Could not save contracts to localStorage:', err);
  }
};

/**
 * Filter contracts strictly according to user permissions:
 * - Admin: sees all contracts
 * - Client: ONLY sees contracts where they are the tenant
 * - Bailleur / Agent: ONLY sees contracts where they are the landlord / property manager
 * - Partenaire: sees contracts where they are involved
 */
export const getUserContracts = (
  user: { uid?: string; email?: string; role?: string; phone?: string; fullname?: string; isPartner?: boolean } | null
): RentalContract[] => {
  const all = getContracts();
  if (!user) return [];
  if (user.role === 'admin' || (user.email && user.email.toLowerCase() === 'benbarakashamamba@gmail.com')) {
    return all;
  }

  const email = (user.email || '').toLowerCase().trim();
  const uid = user.uid || '';
  const phone = (user.phone || '').replace(/[^0-9]/g, '');
  const fullname = (user.fullname || '').toLowerCase().trim();

  // Client: Strictly tenant contracts
  if (user.role === 'client') {
    return all.filter((c) => {
      const matchUid = Boolean(uid) && c.tenantId === uid;
      const matchEmail = Boolean(email) && c.tenantEmail.toLowerCase().trim() === email;
      const matchPhone = Boolean(phone) && phone.length > 5 && c.tenantPhone.replace(/[^0-9]/g, '').includes(phone);
      const matchName = Boolean(fullname) && fullname.length > 2 && (c.tenantName.toLowerCase().trim() === fullname || fullname.includes(c.tenantName.toLowerCase().trim()));
      return matchUid || matchEmail || matchPhone || matchName;
    });
  }

  // Bailleur / Agent: Strictly landlord/property manager contracts
  if (user.role === 'bailleur' || user.role === 'agent') {
    return all.filter((c) => {
      const matchUid = Boolean(uid) && c.landlordId === uid;
      const matchEmail = Boolean(email) && c.landlordEmail.toLowerCase().trim() === email;
      const matchPhone = Boolean(phone) && phone.length > 5 && c.landlordPhone.replace(/[^0-9]/g, '').includes(phone);
      const matchName = Boolean(fullname) && fullname.length > 2 && (c.landlordName.toLowerCase().trim().includes(fullname) || fullname.includes(c.landlordName.toLowerCase().trim()));
      return matchUid || matchEmail || matchPhone || matchName;
    });
  }

  // Partenaire or general authenticated user: only contracts concerning them
  return all.filter((c) => {
    const isTenant = (Boolean(uid) && c.tenantId === uid) || (Boolean(email) && c.tenantEmail.toLowerCase().trim() === email);
    const isLandlord = (Boolean(uid) && c.landlordId === uid) || (Boolean(email) && c.landlordEmail.toLowerCase().trim() === email);
    return isTenant || isLandlord;
  });
};

export const createContract = (data: Omit<RentalContract, 'id' | 'createdAt'>): RentalContract => {
  const all = getContracts();
  const newContract: RentalContract = {
    ...data,
    id: `contract-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString()
  };
  const updated = [newContract, ...all];
  saveContracts(updated);
  return newContract;
};

export const updateContract = (id: string, updates: Partial<RentalContract>): RentalContract | null => {
  const all = getContracts();
  const index = all.findIndex((c) => c.id === id);
  if (index === -1) return null;

  all[index] = {
    ...all[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  saveContracts(all);
  return all[index];
};

import { addInquiry } from './inquiryService';

export const confirmContract = (id: string, confirmedByName: string): RentalContract | null => {
  const contract = updateContract(id, {
    status: 'actif',
    confirmedAt: new Date().toISOString(),
    confirmedBy: confirmedByName
  });

  if (contract) {
    // Dispatch in-app notification to the tenant
    try {
      addInquiry({
        propertyId: contract.propertyId,
        propertyTitle: contract.propertyTitle,
        propertyNeighborhood: contract.propertyNeighborhood,
        propertyCommune: contract.propertyCommune,
        propertyPrice: contract.rentAmountUSD,
        propertyImage: contract.propertyImage,
        propertyOwnerId: contract.landlordId,
        propertyOwnerName: contract.landlordName,
        propertyOwnerPhone: contract.landlordPhone,
        propertyOwnerEmail: contract.landlordEmail,
        senderUid: contract.tenantId,
        senderName: contract.tenantName,
        senderPhone: contract.tenantPhone,
        senderEmail: contract.tenantEmail,
        message: `Félicitations ! Votre contrat de bail pour "${contract.propertyTitle}" a été confirmé et signé par ${confirmedByName}. Durée du bail : du ${new Date(contract.startDate).toLocaleDateString('fr-FR')} au ${new Date(contract.endDate).toLocaleDateString('fr-FR')}.`,
        channel: 'direct',
        agentReply: {
          text: `Votre contrat de bail est désormais actif et consultable dans votre onglet Contrats de Location.`,
          repliedAt: new Date().toISOString(),
          agentName: confirmedByName
        }
      });
    } catch (e) {
      console.warn('Could not post notification:', e);
    }
  }

  return contract;
};

export const requestRenewal = (
  id: string,
  requestedEndDate: string,
  requestedRentUSD: number | undefined,
  requestedByName: string
): RentalContract | null => {
  const contract = updateContract(id, {
    status: 'demande_renouvellement',
    renewalProposal: {
      requestedEndDate,
      requestedRentUSD,
      requestedAt: new Date().toISOString(),
      requestedBy: requestedByName
    }
  });

  if (contract) {
    // Notify landlord/admin
    try {
      addInquiry({
        propertyId: contract.propertyId,
        propertyTitle: contract.propertyTitle,
        propertyNeighborhood: contract.propertyNeighborhood,
        propertyCommune: contract.propertyCommune,
        propertyPrice: requestedRentUSD || contract.rentAmountUSD,
        propertyImage: contract.propertyImage,
        propertyOwnerId: contract.landlordId,
        propertyOwnerName: contract.landlordName,
        propertyOwnerPhone: contract.landlordPhone,
        propertyOwnerEmail: contract.landlordEmail,
        senderUid: contract.tenantId,
        senderName: contract.tenantName,
        senderPhone: contract.tenantPhone,
        senderEmail: contract.tenantEmail,
        message: `Demande de renouvellement de bail : ${requestedByName} souhaite prolonger le contrat de location pour "${contract.propertyTitle}" jusqu'au ${new Date(requestedEndDate).toLocaleDateString('fr-FR')}${requestedRentUSD ? ` avec un loyer proposé de ${requestedRentUSD} $` : ''}.`,
        channel: 'direct'
      });
    } catch (e) {
      console.warn('Could not post notification:', e);
    }
  }

  return contract;
};

export const acceptRenewal = (
  id: string,
  confirmedByName: string
): RentalContract | null => {
  const all = getContracts();
  const existing = all.find((c) => c.id === id);
  if (!existing || !existing.renewalProposal) return null;

  const newEndDate = existing.renewalProposal.requestedEndDate;
  const newRent = existing.renewalProposal.requestedRentUSD || existing.rentAmountUSD;

  const contract = updateContract(id, {
    status: 'actif',
    endDate: newEndDate,
    rentAmountUSD: newRent,
    renewalProposal: undefined,
    confirmedAt: new Date().toISOString(),
    confirmedBy: confirmedByName
  });

  if (contract) {
    try {
      addInquiry({
        propertyId: contract.propertyId,
        propertyTitle: contract.propertyTitle,
        propertyNeighborhood: contract.propertyNeighborhood,
        propertyCommune: contract.propertyCommune,
        propertyPrice: contract.rentAmountUSD,
        propertyImage: contract.propertyImage,
        propertyOwnerId: contract.landlordId,
        propertyOwnerName: contract.landlordName,
        propertyOwnerPhone: contract.landlordPhone,
        propertyOwnerEmail: contract.landlordEmail,
        senderUid: contract.tenantId,
        senderName: contract.tenantName,
        senderPhone: contract.tenantPhone,
        senderEmail: contract.tenantEmail,
        message: `Bonne nouvelle ! Votre demande de prolongation de bail pour "${contract.propertyTitle}" a été acceptée par ${confirmedByName}. Nouvelle échéance fixée au ${new Date(newEndDate).toLocaleDateString('fr-FR')}.`,
        channel: 'direct',
        agentReply: {
          text: `Le bail a été prolongé jusqu'au ${new Date(newEndDate).toLocaleDateString('fr-FR')}.`,
          repliedAt: new Date().toISOString(),
          agentName: confirmedByName
        }
      });
    } catch (e) {
      console.warn('Could not post notification:', e);
    }
  }

  return contract;
};

export const rejectRenewal = (id: string, reason?: string): RentalContract | null => {
  return updateContract(id, {
    status: 'actif',
    renewalProposal: undefined
  });
};

export const terminateContract = (id: string): RentalContract | null => {
  return updateContract(id, { status: 'termine' });
};

export const deleteContract = (id: string): void => {
  const all = getContracts().filter((c) => c.id !== id);
  saveContracts(all);
};

/**
 * Calculates days remaining for a lease contract based on endDate.
 * Returns negative days if already passed.
 */
export const getDaysRemaining = (endDateStr: string): number => {
  const end = new Date(endDateStr).getTime();
  const now = Date.now();
  const diffMs = end - now;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export const getContractStatusDetails = (contract: RentalContract) => {
  const days = getDaysRemaining(contract.endDate);
  const isExpired = days < 0 || contract.status === 'termine';
  const isExpiringSoon = days >= 0 && days <= 30 && contract.status !== 'termine' && contract.status !== 'resilie';

  return {
    daysRemaining: days,
    isExpired,
    isExpiringSoon,
    label: isExpired
      ? days < 0
        ? `Délai terminé (il y a ${Math.abs(days)} jour${Math.abs(days) > 1 ? 's' : ''})`
        : 'Délai terminé'
      : isExpiringSoon
      ? `Échéance proche (${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''})`
      : `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`
  };
};

/**
 * Generates expiry notifications for both Tenant and Landlord
 */
export const getContractNotifications = (user: { uid?: string; email?: string; role?: string } | null) => {
  const userContracts = getUserContracts(user);
  const expired: { contract: RentalContract; role: 'tenant' | 'landlord' | 'admin'; message: string }[] = [];
  const expiringSoon: { contract: RentalContract; role: 'tenant' | 'landlord' | 'admin'; message: string }[] = [];

  const userEmail = (user?.email || '').toLowerCase();
  const uid = user?.uid || '';

  userContracts.forEach((c) => {
    const days = getDaysRemaining(c.endDate);
    const isTenant = (c.tenantId && c.tenantId === uid) || (Boolean(userEmail) && c.tenantEmail.toLowerCase() === userEmail);
    const isLandlord = (c.landlordId && c.landlordId === uid) || (Boolean(userEmail) && c.landlordEmail.toLowerCase() === userEmail);
    const role = isTenant ? 'tenant' : isLandlord ? 'landlord' : 'admin';

    if (days < 0 || c.status === 'termine') {
      const message =
        role === 'tenant'
          ? `Votre délai de location pour "${c.propertyTitle}" est terminé depuis le ${new Date(c.endDate).toLocaleDateString('fr-FR')}. Veuillez contacter le bailleur (${c.landlordName}, ${c.landlordPhone}) pour renouveler ou libérer les lieux.`
          : `Le délai de location pour votre bien "${c.propertyTitle}" est terminé depuis le ${new Date(c.endDate).toLocaleDateString('fr-FR')}. Locataire: ${c.tenantName} (${c.tenantPhone}). Contactez-le pour le renouvellement ou l'état des lieux.`;
      expired.push({ contract: c, role, message });
    } else if (days <= 30 && c.status === 'actif') {
      const message =
        role === 'tenant'
          ? `Attention : Il vous reste seulement ${days} jour(s) de bail pour "${c.propertyTitle}". Échéance le ${new Date(c.endDate).toLocaleDateString('fr-FR')}.`
          : `Attention : Le contrat de location de "${c.propertyTitle}" avec ${c.tenantName} arrive à échéance dans ${days} jour(s) (${new Date(c.endDate).toLocaleDateString('fr-FR')}).`;
      expiringSoon.push({ contract: c, role, message });
    }
  });

  return {
    expired,
    expiringSoon,
    totalAlerts: expired.length + expiringSoon.length
  };
};
