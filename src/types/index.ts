export type TransactionType = 'location' | 'vente';
export type PropertyCategory = 'maison' | 'parcelle' | 'appartement' | 'villa' | 'commercial';
export type PricePeriod = 'mois' | 'total' | 'an';
export type PropertyStatus = 'disponible' | 'loue' | 'vendu';
export type UserRole = 'client' | 'agent' | 'admin' | 'partner';
export type BukavuCommune = 'Ibanda' | 'Kadutu' | 'Bagira';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  pricePeriod: PricePeriod;
  type: TransactionType;
  category: PropertyCategory;
  address: string;
  commune: BukavuCommune; 
  neighborhood: string; 
  latitude: number;
  longitude: number;
  surface: number; // in m²
  bedrooms?: number;
  bathrooms?: number;
  kitchens?: number;
  toilets?: number;
  livingRooms?: number;
  features: string[]; 
  images: string[];
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
  ownerRole?: UserRole;
  ownerExpiresAt?: string;
  status: PropertyStatus;
  featured?: boolean;
  viewsCount?: number;
  createdAt: string;
  updatedAt?: string;
  isVerified?: boolean;
  verifiedAt?: string;
  isBoosted?: boolean;
  boostedUntil?: string;
  boostPlan?: 'standard' | 'top_page' | 'vip_gold';
}

export interface UserProfile {
  uid: string;
  email: string;
  fullname: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  agentExpiresAt?: string;
}

export interface AgentSubscriptionPlan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  features: string[];
}

export const AGENT_SUBSCRIPTION_PLANS: AgentSubscriptionPlan[] = [
  {
    id: 'standard',
    name: 'Plan Standard',
    price: 15,
    durationDays: 30,
    features: ['Publication illimitée', 'Support standard']
  },
  {
    id: 'top_page',
    name: 'Plan Top Page',
    price: 30,
    durationDays: 30,
    features: ['Mise en avant des biens', 'Badge agent certifié', 'Support prioritaire']
  },
  {
    id: 'vip_gold',
    name: 'Plan VIP Gold',
    price: 50,
    durationDays: 30,
    features: ['Visibilité maximale VIP', 'Statistiques avancées', 'Support 7j/7']
  }
];

export const isAgentSubscriptionActive = (user?: UserProfile | null): boolean => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (!user.agentExpiresAt) return false;
  return new Date(user.agentExpiresAt).getTime() > Date.now();
};