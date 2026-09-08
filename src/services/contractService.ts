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
  startDate: string;
  endDate: string;
  monthlyRent: number;
  depositAmount: number;
  status: ContractStatus;
  createdAt: string;
}

const STORAGE_KEY = 'nyumbalink_rental_contracts_v2';

export const getUserContracts = (user: any): RentalContract[] => {
  if (!user) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const all: RentalContract[] = JSON.parse(raw);
    if (user.role === 'admin' || user.email === 'benite.baraka@nyumbalink.cd') return all;
    return all.filter(c => c.tenantId === user.uid || c.tenantName === user.fullname || c.landlordId === user.uid);
  } catch (e) {
    console.error('Erreur chargement contrats:', e);
    return [];
  }
};

export const createContract = (contractData: Omit<RentalContract, 'id' | 'createdAt'>): RentalContract => {
  const raw = localStorage.getItem(STORAGE_KEY);
  const all: RentalContract[] = raw ? JSON.parse(raw) : [];
  
  const newContract: RentalContract = {
    ...contractData,
    id: 'cnt-' + Date.now(),
    status: 'pending',
    createdAt: new Date().toISOString().split('T')[0]
  };

  all.unshift(newContract);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return newContract;
};

export const deleteContract = (contractId: string) => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  const all: RentalContract[] = JSON.parse(raw);
  const filtered = all.filter(c => c.id !== contractId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const getDaysRemaining = (endDateStr: string): number => {
  const end = new Date(endDateStr).getTime();
  const now = new Date().getTime();
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
};

export const getContractNotifications = (user: any): number => {
  const contracts = getUserContracts(user);
  if (!user) return 0;
  return contracts.filter(c => c.status === 'pending').length;
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