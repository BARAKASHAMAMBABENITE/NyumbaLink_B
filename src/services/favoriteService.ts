import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

const FAV_STORAGE_KEY = 'nyumbalink_favorites';

const LEGACY_MOCK_IDS = new Set([
  'prop-001', 'prop-002', 'prop-003', 'prop-004', 'prop-005',
  'prop-006', 'prop-007', 'prop-008', 'prop-009', 'prop-010'
]);

const cleanIds = (ids: string[]): string[] => {
  if (!Array.isArray(ids)) return [];
  return ids.filter(
    (id) => typeof id === 'string' && id && !LEGACY_MOCK_IDS.has(id) && !id.startsWith('prop-00')
  );
};

const getLocalFavIds = (): string[] => {
  try {
    const raw = localStorage.getItem(FAV_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const cleaned = cleanIds(parsed);
    if (cleaned.length !== parsed.length) {
      saveLocalFavIds(cleaned);
    }
    return cleaned;
  } catch (e) {
    return [];
  }
};

const saveLocalFavIds = (ids: string[]): void => {
  try {
    const cleaned = cleanIds(ids);
    localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(cleaned));
  } catch (e) {
    console.warn('LocalStorage favorite save error:', e);
  }
};

export const getUserFavoritePropertyIds = async (userId: string): Promise<string[]> => {
  if (!userId) return getLocalFavIds();

  try {
    const colRef = collection(db, 'favorites');
    const q = query(colRef, where('userId', '==', userId));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const favIds: string[] = [];
      snap.forEach((d) => {
        const pId = d.data().propertyId;
        if (pId && !LEGACY_MOCK_IDS.has(pId) && !pId.startsWith('prop-00')) {
          favIds.push(pId);
        } else {
          // Delete legacy mock favorite doc
          deleteDoc(doc(db, 'favorites', d.id)).catch(() => {});
        }
      });
      saveLocalFavIds(favIds);
      return favIds;
    }
  } catch (err) {
    console.warn('Firestore fetch favorites failed:', err);
  }

  return getLocalFavIds();
};

export const syncFavoritesWithExistingProperties = (existingPropertyIds: string[]): string[] => {
  const current = getLocalFavIds();
  const valid = current.filter((id) => existingPropertyIds.includes(id));
  if (valid.length !== current.length) {
    saveLocalFavIds(valid);
  }
  return valid;
};

export const toggleFavoriteStatus = async (
  userId: string,
  propertyId: string
): Promise<boolean> => {
  if (LEGACY_MOCK_IDS.has(propertyId) || propertyId.startsWith('prop-00')) {
    return false;
  }

  const currentLocal = getLocalFavIds();
  const isAlreadyFav = currentLocal.includes(propertyId);
  const updated = isAlreadyFav
    ? currentLocal.filter((id) => id !== propertyId)
    : [...currentLocal, propertyId];

  saveLocalFavIds(updated);

  if (userId) {
    try {
      const docId = `${userId}_${propertyId}`;
      const docRef = doc(db, 'favorites', docId);

      if (isAlreadyFav) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, {
          id: docId,
          userId,
          propertyId,
          createdAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('Firestore toggle favorite error:', e);
    }
  }

  return !isAlreadyFav; // Returns new favorite status
};
