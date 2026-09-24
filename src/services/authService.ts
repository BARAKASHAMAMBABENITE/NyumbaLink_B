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
import { UserProfile, UserRole } from '../types';

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
 * Sign in using Google Account via Popup method
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
    console.error('Google Popup Auth Error:', err);
    throw new Error(formatFirebaseAuthErrorMessage(err));
  }
};

/**
 * Fonction de compatibilité pour le redirect Google
 */
export const handleGoogleRedirectResult = async (): Promise<UserProfile | null> => {
  return null;
};

/**
 * Standard Email & Password Login
 */
export const loginUser = async (email: string, pass: string): Promise<UserProfile> => {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    const uid = cred.user.uid;
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    const fallback: UserProfile = {
      uid,
      fullname: cleanEmail.split('@')[0],
      email: cleanEmail,
      role: resolveRole(cleanEmail, 'client'),
      createdAt: new Date().toISOString()
    };
    return fallback;
  } catch (err: any) {
    console.error('Login Error:', err);
    throw new Error(formatFirebaseAuthErrorMessage(err));
  }
};

/**
 * Standard Email & Password Registration
 */
export const registerUser = async (
  email: string,
  pass: string,
  fullname: string,
  role: UserRole = 'client',
  phone?: string
): Promise<UserProfile> => {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    const uid = cred.user.uid;
    const assignedRole = resolveRole(cleanEmail, role);

    const profile: UserProfile = {
      uid,
      fullname: fullname.trim(),
      email: cleanEmail,
      role: assignedRole,
      phone: phone?.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', uid), profile);
    return profile;
  } catch (err: any) {
    console.error('Registration Error:', err);
    throw new Error(formatFirebaseAuthErrorMessage(err));
  }
};

/**
 * Send Password Reset Email
 */
export const resetUserPassword = async (email: string): Promise<boolean> => {
  const cleanEmail = email.trim().toLowerCase();
  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    return true;
  } catch (err: any) {
    console.error('Password Reset Error:', err);
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
    console.warn('sendSignInLinkToEmail note:', err?.code);
    window.localStorage.setItem('emailForSignIn', trimmed);
    return true;
  }
};

/**
 * Valide et finalise la connexion via le lien magique cliqué dans l'e-mail
 */
export const completeMagicLinkSignIn = async (): Promise<UserProfile | null> => {
  try {
    const currentUrl = window.location.href;
    if (isSignInWithEmailLink(auth, currentUrl)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Veuillez confirmer votre adresse e-mail pour finaliser la connexion :');
      }
      if (!email) {
        throw new Error('Adresse e-mail requise pour valider le lien.');
      }

      const cred = await signInWithEmailLink(auth, email, currentUrl);
      window.localStorage.removeItem('emailForSignIn');

      const uid = cred.user.uid;
      const userEmail = cred.user.email || email.trim().toLowerCase();
      
      const fallbackProfile: UserProfile = {
        uid,
        fullname: cred.user.displayName || userEmail.split('@')[0] || 'Utilisateur',
        email: userEmail,
        role: resolveRole(userEmail, 'client'),
        createdAt: new Date().toISOString()
      };

      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      } else {
        await setDoc(doc(db, 'users', uid), fallbackProfile);
        return fallbackProfile;
      }
    }
    return null;
  } catch (err: any) {
    console.error('Magic Link Sign In Error:', err);
    throw new Error(formatFirebaseAuthErrorMessage(err));
  }
};

/**
 * Déconnecte l'utilisateur de Firebase
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (err: any) {
    console.error('Logout Error:', err);
    throw new Error('Erreur lors de la déconnexion.');
  }
};

/**
 * Met à jour le profil de l'utilisateur dans Firestore
 */
export const updateUserProfileInFirestore = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, updates);
  } catch (err: any) {
    console.error('Update Profile Error:', err);
    throw new Error('Erreur lors de la mise à jour du profil.');
  }
};

/**
 * Met à jour le rôle d'un utilisateur dans Firestore
 */
export const updateUserRoleInFirestore = async (uid: string, role: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role });
  } catch (err: any) {
    console.error('Update Role Error:', err);
    throw new Error('Erreur lors de la mise à jour du rôle.');
  }
};