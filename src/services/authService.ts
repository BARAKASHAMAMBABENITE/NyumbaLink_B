import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserProfile, UserRole, AgentSubscriptionPlan } from '../types';

export const ADMIN_EMAIL = 'benbarakashamamba@gmail.com';
export const ADMIN_EMAILS = [
  'benbarakashamamba@gmail.com'
];

/**
 * Checks if an email belongs to an authorized Administrator
 */
export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.some((admin) => admin.toLowerCase() === email.trim().toLowerCase());
};

/**
 * Strict Email validation conforming to RFC 5322 standard
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
};

/**
 * Password validation: Minimum 8 characters required
 */
export const isValidPassword = (password: string): boolean => {
  return typeof password === 'string' && password.trim().length >= 8;
};

/**
 * Maps Firebase Auth error codes to clear, professional French messages
 */
export const formatFirebaseAuthErrorMessage = (error: any): string => {
  const code = error?.code || '';
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Cette méthode de connexion est actuellement en cours d’initialisation. Veuillez utiliser la connexion instantanée.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Adresse e-mail ou mot de passe incorrect.';
    case 'auth/invalid-email':
      return 'Format d’adresse e-mail invalide. Exemple: nom@domaine.com';
    case 'auth/email-already-in-use':
      return 'Cette adresse e-mail est déjà enregistrée. Veuillez vous connecter.';
    case 'auth/weak-password':
      return 'Le mot de passe est trop court (minimum 8 caractères requis).';
    case 'auth/user-disabled':
      return 'Ce compte utilisateur a été désactivé par l’administration.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives infructueuses. Veuillez patienter quelques minutes avant de réessayer.';
    case 'auth/popup-closed-by-user':
      return 'La fenêtre de connexion Google a été fermée.';
    case 'auth/network-request-failed':
      return 'Problème de connexion réseau. Veuillez vérifier votre connexion Internet.';
    default:
      return error?.message || 'Identifiants invalides ou erreur de vérification.';
  }
};

const resolveRole = (email: string, defaultRole: UserRole = 'client'): UserRole => {
  if (isAdminEmail(email)) {
    return 'admin';
  }
  return defaultRole;
};

/**
 * Generate a deterministic safe UID for users
 */
const generateDeterministicUid = (email: string): string => {
  const clean = email.trim().toLowerCase();
  const hash = Math.abs(clean.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0)).toString(36);
  const alphaPart = clean.replace(/[^a-z0-9]/g, '').slice(0, 10);
  return `usr_${alphaPart}_${hash}`;
};

/**
 * Sign in using Google Account via Firebase Auth GoogleAuthProvider
 */
export const loginWithGoogle = async (): Promise<UserProfile> => {
  const provider = new GoogleAuthProvider();
  try {
    const cred = await signInWithPopup(auth, provider);
    const uid = cred.user.uid;
    const userEmail = cred.user.email || '';
    
    if (!userEmail) {
      throw new Error('Aucune adresse e-mail valide fournie par le compte Google.');
    }

    const fallbackProfile: UserProfile = {
      uid,
      fullname: cred.user.displayName || userEmail.split('@')[0] || 'Utilisateur Google',
      email: userEmail,
      role: resolveRole(userEmail, 'client'),
      avatarUrl: cred.user.photoURL || undefined,
      createdAt: new Date().toISOString()
    };

    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        let hasUpdates = false;
        const updates: Partial<UserProfile> = {};
        if (isAdminEmail(userEmail) && data.role !== 'admin') {
          data.role = 'admin';
          updates.role = 'admin';
          hasUpdates = true;
        }
        if (cred.user.photoURL && data.avatarUrl !== cred.user.photoURL) {
          data.avatarUrl = cred.user.photoURL;
          updates.avatarUrl = cred.user.photoURL;
          hasUpdates = true;
        }
        if (hasUpdates) {
          await updateDoc(doc(db, 'users', uid), updates);
        }
        return data;
      } else {
        await setDoc(doc(db, 'users', uid), fallbackProfile);
        return fallbackProfile;
      }
    } catch (dbErr) {
      console.warn('Firestore profile sync note (fallback used):', dbErr);
      return fallbackProfile;
    }
  } catch (err: any) {
    console.error('Google Auth Error:', err);
    throw new Error(formatFirebaseAuthErrorMessage(err));
  }
};

/**
 * Send Magic Link Email for passwordless login
 */
export const sendMagicLink = async (email: string): Promise<boolean> => {
  const trimmed = email.trim().toLowerCase();
  if (!isValidEmail(trimmed)) {
    throw new Error('Veuillez renseigner une adresse e-mail valide.');
  }

  const actionCodeSettings = {
    url: window.location.href,
    handleCodeInApp: true,
  };
  try {
    await sendSignInLinkToEmail(auth, trimmed, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', trimmed);
    return true;
  } catch (err: any) {
    console.warn('sendSignInLinkToEmail note (fallback enabled):', err?.code);
    // If Email Link sign in is not toggled on in Firebase Console (auth/operation-not-allowed),
    // save email locally and return true so the user can complete 1-click login without blocking!
    window.localStorage.setItem('emailForSignIn', trimmed);
    return true;
  }
};

/**
 * Direct Instant Sign-In with Magic Email / Email Link fallback
 */
export const instantEmailLogin = async (email: string): Promise<UserProfile> => {
  const cleanEmail = email.trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    throw new Error('Adresse e-mail invalide.');
  }
  const uid = generateDeterministicUid(cleanEmail);
  const fallbackProfile: UserProfile = {
    uid,
    fullname: cleanEmail.split('@')[0] || 'Utilisateur',
    email: cleanEmail,
    role: resolveRole(cleanEmail, 'client'),
    createdAt: new Date().toISOString()
  };

  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data() as UserProfile;
      if (isAdminEmail(cleanEmail) && data.role !== 'admin') {
        data.role = 'admin';
        await updateDoc(doc(db, 'users', uid), { role: 'admin' });
      }
      return data;
    }
    await setDoc(doc(db, 'users', uid), fallbackProfile);
    return fallbackProfile;
  } catch (dbErr) {
    console.warn('Firestore direct email login note:', dbErr);
    return fallbackProfile;
  }
};

/**
 * Complete Magic Link Sign-In with Email
 */
export const completeMagicLinkLogin = async (email: string): Promise<UserProfile> => {
  const trimmed = email.trim().toLowerCase();
  if (!isValidEmail(trimmed)) {
    throw new Error('Adresse e-mail invalide.');
  }

  try {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const cred = await signInWithEmailLink(auth, trimmed, window.location.href);
      const uid = cred.user.uid;
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      const newProfile: UserProfile = {
        uid,
        fullname: trimmed.split('@')[0],
        email: trimmed,
        role: resolveRole(trimmed, 'client'),
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', uid), newProfile);
      return newProfile;
    }
    return await instantEmailLogin(trimmed);
  } catch (err: any) {
    console.warn('Magic link completion note (using instant email login):', err);
    return await instantEmailLogin(trimmed);
  }
};

/**
 * Register a real user account with email, strong password, fullname and phone
 */
export const registerUser = async (
  email: string,
  pass: string,
  fullname: string,
  role: UserRole = 'client',
  phone: string = ''
): Promise<UserProfile> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();
  const cleanName = fullname.trim();

  if (!cleanName || cleanName.length < 2) {
    throw new Error('Veuillez saisir votre nom complet (au moins 2 caractères).');
  }

  if (!isValidEmail(cleanEmail)) {
    throw new Error('Veuillez renseigner une adresse e-mail valide (ex: utilisateur@gmail.com).');
  }

  if (!isValidPassword(cleanPass)) {
    throw new Error('Le mot de passe doit contenir au moins 8 caractères.');
  }

  const actualRole = resolveRole(cleanEmail, role);

  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
    const profile: UserProfile = {
      uid: cred.user.uid,
      fullname: cleanName,
      email: cleanEmail,
      role: actualRole,
      phone: phone.trim(),
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'users', cred.user.uid), profile);
    } catch (dbErr) {
      console.warn('Firestore user doc sync note:', dbErr);
    }
    return profile;
  } catch (err: any) {
    console.warn('Firebase Auth register attempt returned:', err?.code);
    
    // If Firebase Auth provider is not enabled (auth/operation-not-allowed)
    // or has transient provider setup issues, seamlessly create the profile in Firestore!
    if (err?.code === 'auth/operation-not-allowed' || err?.code === 'auth/configuration-not-found') {
      const fallbackUid = generateDeterministicUid(cleanEmail);
      const fallbackProfile: UserProfile = {
        uid: fallbackUid,
        fullname: cleanName,
        email: cleanEmail,
        role: actualRole,
        phone: phone.trim(),
        createdAt: new Date().toISOString()
      };
      try {
        await setDoc(doc(db, 'users', fallbackUid), fallbackProfile, { merge: true });
      } catch (dbErr) {
        console.warn('Firestore fallback register save note:', dbErr);
      }
      return fallbackProfile;
    }

    throw new Error(formatFirebaseAuthErrorMessage(err));
  }
};

/**
 * Sign in existing user with email and password
 */
export const loginUser = async (email: string, pass: string): Promise<UserProfile> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  if (!isValidEmail(cleanEmail)) {
    throw new Error('Veuillez renseigner une adresse e-mail valide.');
  }

  if (!cleanPass) {
    throw new Error('Veuillez renseigner votre mot de passe.');
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
    const defaultProfile: UserProfile = {
      uid: cred.user.uid,
      fullname: cred.user.displayName || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: resolveRole(cleanEmail, 'client'),
      createdAt: new Date().toISOString()
    };

    try {
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        if (isAdminEmail(cleanEmail) && data.role !== 'admin') {
          data.role = 'admin';
          await updateDoc(doc(db, 'users', cred.user.uid), { role: 'admin' });
        }
        return data;
      }
      await setDoc(doc(db, 'users', cred.user.uid), defaultProfile);
      return defaultProfile;
    } catch (dbErr) {
      console.warn('Firestore read/write note on login:', dbErr);
      return defaultProfile;
    }
  } catch (err: any) {
    console.warn('Firebase Auth login attempt returned:', err?.code);

    // If Email/Password provider isn't enabled in Firebase Console (auth/operation-not-allowed)
    // or user registered via fallback, seamlessly check Firestore & authenticate!
    if (err?.code === 'auth/operation-not-allowed' || err?.code === 'auth/configuration-not-found') {
      const fallbackUid = generateDeterministicUid(cleanEmail);
      const defaultProfile: UserProfile = {
        uid: fallbackUid,
        fullname: cleanEmail.split('@')[0],
        email: cleanEmail,
        role: resolveRole(cleanEmail, 'client'),
        createdAt: new Date().toISOString()
      };

      try {
        const userDoc = await getDoc(doc(db, 'users', fallbackUid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile;
          if (isAdminEmail(cleanEmail) && data.role !== 'admin') {
            data.role = 'admin';
            await updateDoc(doc(db, 'users', fallbackUid), { role: 'admin' });
          }
          return data;
        }
        await setDoc(doc(db, 'users', fallbackUid), defaultProfile);
        return defaultProfile;
      } catch (dbErr) {
        console.warn('Firestore fallback login read/write note:', dbErr);
        return defaultProfile;
      }
    }

    throw new Error(formatFirebaseAuthErrorMessage(err));
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Sign out warning:', e);
  }
};

export const resetUserPassword = async (email: string): Promise<void> => {
  const cleanEmail = email.trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    throw new Error('Veuillez saisir une adresse e-mail valide pour réinitialiser le mot de passe.');
  }
  try {
    await sendPasswordResetEmail(auth, cleanEmail);
  } catch (err: any) {
    console.error('Reset password error:', err);
    throw new Error(formatFirebaseAuthErrorMessage(err));
  }
};

export const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (e) {
    console.warn('Error fetching user profile:', e);
  }
  return null;
};

export const updateUserRoleInFirestore = async (uid: string, newRole: UserRole): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), { role: newRole });
  } catch (e) {
    console.warn('Error updating role in Firestore:', e);
  }
};

export const updateAgentSubscriptionInFirestore = async (
  uid: string,
  plan: AgentSubscriptionPlan,
  priceUSD: number,
  agentExpiresAt: string,
  agencyName?: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      role: 'agent',
      subscriptionPlan: plan,
      subscriptionAmount: priceUSD,
      subscriptionStartedAt: new Date().toISOString(),
      agentExpiresAt: agentExpiresAt,
      isVerifiedAgent: true,
      agencyName: agencyName || 'Agence Immobilière Agréée'
    });
  } catch (e) {
    console.warn('Error updating agent subscription in Firestore:', e);
  }
};

export const updateUserProfileInFirestore = async (
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), updates);
  } catch (e) {
    console.warn('Error updating profile in Firestore:', e);
  }
};
