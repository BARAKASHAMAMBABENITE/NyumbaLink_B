import { UserProfile, UserRole, AgentSubscriptionPlan } from '../types';
import { ADMIN_EMAIL, ADMIN_EMAILS } from './authService';

export interface VisitorLog {
  id: string;
  visitorType: UserRole | 'guest';
  userFullname?: string;
  userEmail?: string;
  ipAddress: string;
  location: string;
  device: string;
  pageVisited: string;
  timestamp: string;
  durationMinutes: number;
  referral: string;
}

export interface ActiveSession {
  id: string;
  uid: string;
  fullname: string;
  email: string;
  role: UserRole;
  phone?: string;
  connectedAt: string;
  lastActiveAt: string;
  device: string;
  currentPage: string;
  isOnline: boolean;
}

export interface RegisteredUser {
  uid: string;
  fullname: string;
  email: string;
  role: UserRole;
  phone?: string;
  agencyName?: string;
  createdAt: string;
  status: 'active' | 'suspended' | 'pending';
  lastLoginAt: string;
  totalVisits: number;
  city: string;
  subscriptionPlan?: AgentSubscriptionPlan;
  subscriptionAmount?: number;
  subscriptionStartedAt?: string;
  agentExpiresAt?: string;
  canPublish?: boolean;
  isPartner?: boolean;
  partnerCategory?: string;
  partnerApprovedDate?: string;
}

// Initial registered users list containing strictly the single verified Administrator (Ben Baraka Shamamba)
const INITIAL_REGISTERED_USERS: RegisteredUser[] = [
  {
    uid: 'admin-benbaraka-001',
    fullname: 'Ben Baraka Shamamba',
    email: 'benbarakashamamba@gmail.com',
    role: 'admin',
    phone: '+243986760178',
    createdAt: new Date().toISOString(),
    status: 'active',
    lastLoginAt: new Date().toISOString(),
    totalVisits: 1,
    city: 'Bukavu (Ibanda)'
  }
];

const INITIAL_ACTIVE_SESSIONS: ActiveSession[] = [];

const INITIAL_VISITOR_LOGS: VisitorLog[] = [];

const USERS_STORAGE_KEY = 'nyumba_registered_users_v3';
const SESSIONS_STORAGE_KEY = 'nyumba_active_sessions_v3';
const LOGS_STORAGE_KEY = 'nyumba_visitor_logs_v3';

export const getRegisteredUsers = (): RegisteredUser[] => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (stored) {
    try {
      const parsed: RegisteredUser[] = JSON.parse(stored);
      // Clean any legacy demo accounts or bot entries
      const filtered = parsed.filter(u => 
        u.email &&
        !u.email.includes('mufasa') && 
        !u.email.includes('bahati') && 
        !u.email.includes('neema') && 
        !u.email.includes('cikuru') && 
        !u.email.includes('bishweka') &&
        !u.email.includes('clarisse.kivu') &&
        !u.email.includes('demo') &&
        !u.email.includes('test') &&
        !u.email.includes('davidmakindu')
      );
      // Always ensure the main admin is present
      const hasBen = filtered.some(u => u.email.toLowerCase() === 'benbarakashamamba@gmail.com');
      let result = [...filtered];
      if (!hasBen) result.unshift(INITIAL_REGISTERED_USERS[0]);

      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(result));
      return result;
    } catch (e) {
      console.warn('Error parsing stored registered users:', e);
    }
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_REGISTERED_USERS));
  return INITIAL_REGISTERED_USERS;
};

export const getActiveSessions = (): ActiveSession[] => {
  const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
  if (stored) {
    try {
      const parsed: ActiveSession[] = JSON.parse(stored);
      return parsed.filter(s => 
        !s.email.includes('mufasa') && 
        !s.email.includes('bahati') && 
        !s.email.includes('neema') && 
        !s.email.includes('bishweka') &&
        !s.email.includes('davidmakindu')
      );
    } catch (e) {
      console.warn('Error parsing stored active sessions:', e);
    }
  }
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(INITIAL_ACTIVE_SESSIONS));
  return INITIAL_ACTIVE_SESSIONS;
};

export const getVisitorLogs = (): VisitorLog[] => {
  const stored = localStorage.getItem(LOGS_STORAGE_KEY);
  if (stored) {
    try {
      const parsed: VisitorLog[] = JSON.parse(stored);
      return parsed.filter(v => 
        !v.userEmail?.includes('mufasa') && 
        !v.userEmail?.includes('bahati') && 
        !v.userEmail?.includes('neema')
      );
    } catch (e) {
      console.warn('Error parsing stored visitor logs:', e);
    }
  }
  localStorage.setItem('nyumba_visitor_logs', JSON.stringify(INITIAL_VISITOR_LOGS));
  return INITIAL_VISITOR_LOGS;
};

export const recordPageVisit = (
  pageName: string,
  user?: UserProfile | null
): void => {
  if (!user) return; // Only log real authenticated user activities

  const logs = getVisitorLogs();
  const newLog: VisitorLog = {
    id: `vis-${Date.now()}`,
    visitorType: user.role,
    userFullname: user.fullname,
    userEmail: user.email,
    ipAddress: '197.243.10.15',
    location: 'Bukavu, Commune d\'Ibanda',
    device: navigator.userAgent.includes('Mobile') ? 'Smartphone (Navigateur Mobile)' : 'Ordinateur (Navigateur Web)',
    pageVisited: pageName,
    timestamp: new Date().toISOString(),
    durationMinutes: 1,
    referral: 'Session Utilisateur'
  };

  const updatedLogs = [newLog, ...logs.slice(0, 49)];
  localStorage.setItem('nyumba_visitor_logs', JSON.stringify(updatedLogs));
};

export const recordUserLoginSession = (user: UserProfile, pageName: string = 'Page d\'accueil'): void => {
  const sessions = getActiveSessions();
  const registered = getRegisteredUsers();

  // Update or add active session
  const existingIdx = sessions.findIndex((s) => s.uid === user.uid || s.email.toLowerCase() === user.email.toLowerCase());
  const updatedSession: ActiveSession = {
    id: `session-${user.uid}`,
    uid: user.uid,
    fullname: user.fullname,
    email: user.email,
    role: user.role,
    phone: user.phone || '+243986760178',
    connectedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    device: navigator.userAgent.includes('Mobile') ? 'Smartphone (Navigateur Mobile)' : 'Ordinateur (Navigateur Web)',
    currentPage: pageName,
    isOnline: true
  };

  let newSessions: ActiveSession[];
  if (existingIdx >= 0) {
    newSessions = [...sessions];
    newSessions[existingIdx] = updatedSession;
  } else {
    newSessions = [updatedSession, ...sessions];
  }
  localStorage.setItem('nyumba_active_sessions', JSON.stringify(newSessions));

  // Update registered user visits and last login
  const regIdx = registered.findIndex((r) => r.uid === user.uid || r.email.toLowerCase() === user.email.toLowerCase());
  if (regIdx >= 0) {
    registered[regIdx].lastLoginAt = new Date().toISOString();
    registered[regIdx].totalVisits = (registered[regIdx].totalVisits || 1) + 1;
    localStorage.setItem('nyumba_registered_users', JSON.stringify(registered));
  } else {
    const newRegUser: RegisteredUser = {
      uid: user.uid,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      createdAt: user.createdAt || new Date().toISOString(),
      status: 'active',
      lastLoginAt: new Date().toISOString(),
      totalVisits: 1,
      city: 'Bukavu'
    };
    localStorage.setItem('nyumba_registered_users', JSON.stringify([newRegUser, ...registered]));
  }
};

export const updateRegisteredUserStatus = (uid: string, status: 'active' | 'suspended' | 'pending'): RegisteredUser[] => {
  const users = getRegisteredUsers();
  const updated = users.map((u) => (u.uid === uid ? { ...u, status } : u));
  localStorage.setItem('nyumba_registered_users', JSON.stringify(updated));
  return updated;
};

export const updateRegisteredUserRole = (uid: string, role: UserRole): RegisteredUser[] => {
  const users = getRegisteredUsers();
  const updated = users.map((u) => (u.uid === uid ? { ...u, role } : u));
  localStorage.setItem('nyumba_registered_users', JSON.stringify(updated));
  return updated;
};

export const toggleRegisteredUserCanPublish = (uid: string): RegisteredUser[] => {
  const users = getRegisteredUsers();
  const updated = users.map((u) => (u.uid === uid ? { ...u, canPublish: !u.canPublish } : u));
  localStorage.setItem('nyumba_registered_users', JSON.stringify(updated));
  return updated;
};

export const toggleRegisteredUserPartner = (uid: string, isPartner?: boolean, category?: string): RegisteredUser[] => {
  const users = getRegisteredUsers();
  const updated = users.map((u) => {
    if (u.uid === uid) {
      const nextStatus = isPartner !== undefined ? isPartner : !u.isPartner;
      return {
        ...u,
        isPartner: nextStatus,
        partnerCategory: category || u.partnerCategory || 'Services Immobiliers & Habitat',
        partnerApprovedDate: nextStatus ? (u.partnerApprovedDate || new Date().toISOString()) : undefined
      };
    }
    return u;
  });
  localStorage.setItem('nyumba_registered_users', JSON.stringify(updated));
  return updated;
};

export const updateRegisteredUserRoleAndSubscription = (
  uid: string,
  role: UserRole,
  subscription?: {
    plan: AgentSubscriptionPlan;
    priceUSD: number;
    agentExpiresAt: string;
    agencyName?: string;
  }
): RegisteredUser[] => {
  const users = getRegisteredUsers();
  const updated = users.map((u) => {
    if (u.uid === uid) {
      if (role === 'agent' && subscription) {
        return {
          ...u,
          role,
          agencyName: subscription.agencyName || u.agencyName || 'Agence Immobilière Agréée',
          subscriptionPlan: subscription.plan,
          subscriptionAmount: subscription.priceUSD,
          subscriptionStartedAt: new Date().toISOString(),
          agentExpiresAt: subscription.agentExpiresAt
        };
      }
      return {
        ...u,
        role,
        subscriptionPlan: role === 'agent' ? u.subscriptionPlan : undefined,
        agentExpiresAt: role === 'agent' ? u.agentExpiresAt : undefined
      };
    }
    return u;
  });
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteRegisteredUser = (uid: string): RegisteredUser[] => {
  const users = getRegisteredUsers();
  const updated = users.filter((u) => u.uid !== uid);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const resetToVerifiedAdminsOnly = (): RegisteredUser[] => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_REGISTERED_USERS));
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify([]));
  localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify([]));
  return INITIAL_REGISTERED_USERS;
};
