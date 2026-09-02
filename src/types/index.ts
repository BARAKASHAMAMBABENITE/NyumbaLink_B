export type UserRole = 'client' | 'agent' | 'bailleur' | 'admin';

export type AgentSubscriptionPlan = '1_month' | '3_months' | '1_year';

export interface UserProfile {
  uid: string;
  fullname: string;
  email: string;
  role: UserRole;
  phone?: string;
  agencyName?: string;
  avatarUrl?: string;
  createdAt: string;
  subscriptionPlan?: AgentSubscriptionPlan;
  subscriptionAmount?: number; // 10, 25, 100
  subscriptionStartedAt?: string;
  agentExpiresAt?: string; // ISO date string of expiration
  isVerifiedAgent?: boolean;
  verifiedDate?: string;
  canPublish?: boolean; // Client granted direct publishing access
  isPartner?: boolean; // Partner status badge on profile
  partnerCategory?: string; // e.g., 'Déménagement', 'Matériaux', 'Rénovation', 'Nettoyage'
  partnerApprovedDate?: string;
}

export interface AgentPlanDefinition {
  id: AgentSubscriptionPlan;
  label: string;
  durationDays: number;
  priceUSD: number;
  badgeText: string;
  description: string;
}

export const AGENT_SUBSCRIPTION_PLANS: AgentPlanDefinition[] = [
  {
    id: '1_month',
    label: '1 Mois',
    durationDays: 30,
    priceUSD: 10,
    badgeText: 'Essentiel',
    description: 'Accès complet publication et gestion pendant 30 jours'
  },
  {
    id: '3_months',
    label: '3 Mois',
    durationDays: 90,
    priceUSD: 25,
    badgeText: 'Populaire (Économie 5$)',
    description: 'Accès complet publication et gestion pendant 90 jours'
  },
  {
    id: '1_year',
    label: '1 An',
    durationDays: 365,
    priceUSD: 100,
    badgeText: 'Meilleur Tarif (Économie 20$)',
    description: 'Accès complet publication et gestion pendant 365 jours'
  }
];

export const isAgentSubscriptionActive = (
  agentExpiresAt?: string,
  userRole?: UserRole
): boolean => {
  if (userRole === 'admin') return true;
  if (!agentExpiresAt) return true; // Default grace period if not explicitly set
  return new Date(agentExpiresAt).getTime() > Date.now();
};

export const getDaysRemaining = (agentExpiresAt?: string): number => {
  if (!agentExpiresAt) return 0;
  const diff = new Date(agentExpiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export type BukavuCommune = 'Ibanda' | 'Kadutu' | 'Bagira';
export type PropertyCategory = 'maison' | 'parcelle' | 'appartement' | 'commercial' | 'villa';
export type TransactionType = 'vente' | 'location';
export type PropertyStatus = 'disponible' | 'loue' | 'vendu' | 'en_attente';
export type PricePeriod = 'total' | 'mois' | 'an';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  pricePeriod: PricePeriod;
  type: TransactionType;
  category: PropertyCategory;
  address: string;
  commune: BukavuCommune; // Bukavu's 3 Communes: 'Ibanda' | 'Kadutu' | 'Bagira'
  neighborhood: string; // Quartiers inside the commune (e.g., 'Nguba', 'La Botte', 'Ndendere', 'Muhungu', 'Panzi', 'Nyamugo', 'Cikonyi')
  latitude: number;
  longitude: number;
  surface: number; // in m²
  bedrooms?: number;
  bathrooms?: number;
  features: string[]; // e.g., ['Eau 24h/24', 'Électricité SNEL', 'Vue sur le Lac Kivu', 'Clôturé', 'Garage', 'Jardin']
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

export interface FavoriteItem {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: string;
}

export interface FilterOptions {
  searchQuery: string;
  commune: BukavuCommune | 'tous';
  category: PropertyCategory | 'tous';
  type: TransactionType | 'tous';
  neighborhood: string;
  minPrice: number | '';
  maxPrice: number | '';
  minBedrooms: number | '';
  minBathrooms: number | '';
  features: string[];
  sortBy: 'recent' | 'price_asc' | 'price_desc' | 'popular';
}

export interface SystemStats {
  totalProperties: number;
  totalUsers: number;
  totalAgents: number;
  totalClients: number;
  totalForSale: number;
  totalForRent: number;
  totalValueUSD: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedProperties?: Property[];
}

export interface PartnerB2B {
  id: string;
  name: string;
  category: 'déménagement' | 'matériaux' | 'rénovation' | 'nettoyage' | 'autre';
  description: string;
  phone: string;
  whatsapp: string;
  address: string;
  commune: string;
  logoUrl?: string;
  rating: number;
  isVerifiedPartner?: boolean;
}

export type PartnerItemCategory =
  | 'table'
  | 'armoire'
  | 'etagere'
  | 'canape'
  | 'chaise'
  | 'congelateur'
  | 'refrigerateur'
  | 'lit'
  | 'electromenager'
  | 'autre';

export interface PartnerFurnitureItem {
  id: string;
  title: string;
  category: PartnerItemCategory;
  price: number; // in USD
  condition: 'neuf' | 'tres_bon_etat' | 'bon_etat';
  description: string;
  commune: BukavuCommune;
  neighborhood: string;
  images: string[];
  partnerId: string;
  partnerName: string;
  partnerPhone: string;
  partnerEmail?: string;
  isAvailable: boolean;
  createdAt: string;
}
