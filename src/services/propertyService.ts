import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Property, FilterOptions, BukavuCommune } from '../types';
import { BUKAVU_COMMUNES_WITH_NEIGHBORHOODS } from '../data/initialProperties';

const LOCAL_STORAGE_KEY = 'nyumbalink_properties';

const sanitizeBukavuLocation = (commune?: string, neighborhood?: string): { commune: BukavuCommune; neighborhood: string } => {
  let validCommune: BukavuCommune = 'Ibanda';
  if (commune === 'Kadutu' || commune === 'Bagira' || commune === 'Ibanda') {
    validCommune = commune;
  }
  const validQuartiers = BUKAVU_COMMUNES_WITH_NEIGHBORHOODS[validCommune] || [];
  let validNeighborhood = validQuartiers[0] || 'Nguba';
  if (neighborhood && neighborhood.trim()) {
    validNeighborhood = neighborhood.trim();
  }
  return { commune: validCommune, neighborhood: validNeighborhood };
};

const LEGACY_MOCK_IDS = new Set([
  'prop-001', 'prop-002', 'prop-003', 'prop-004', 'prop-005',
  'prop-006', 'prop-007', 'prop-008', 'prop-009', 'prop-010'
]);

const isRealUserProperty = (p: Property): boolean => {
  if (!p || !p.id) return false;
  if (LEGACY_MOCK_IDS.has(p.id)) return false;
  if (p.id.startsWith('prop-00') || p.id.startsWith('prop-01')) return false;
  return true;
};

// Nettoyage strict : supprime complètement les clés undefined ou non désirées selon la catégorie
export const sanitizePropertySpecs = (p: Property): Property => {
  if (!p) return p;
  const sanitized: any = { ...p };
  
  if (sanitized.category !== 'parcelle') {
    delete sanitized.surface;
  } else {
    delete sanitized.bedrooms;
    delete sanitized.bathrooms;
  }

  // Suppression de TOUTES les valeurs undefined pour éviter l'erreur Firestore
  Object.keys(sanitized).forEach((key) => {
    if (sanitized[key] === undefined || sanitized[key] === null) {
      delete sanitized[key];
    }
  });

  return sanitized as Property;
};

const getLocalProperties = (): Property[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(isRealUserProperty).map(sanitizePropertySpecs);
        if (cleaned.length !== parsed.length) {
          saveLocalProperties(cleaned);
        }
        return cleaned;
      }
    }
  } catch (e) {
    console.warn('LocalStorage parse error:', e);
  }
  return [];
};

const saveLocalProperties = (list: Property[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
};

export const getAllProperties = async (): Promise<Property[]> => {
  const localList = getLocalProperties();
  try {
    const colRef = collection(db, 'properties');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const remoteList: Property[] = [];
      snap.forEach((d) => {
        const item = { id: d.id, ...d.data() } as Property;
        if (isRealUserProperty(item)) {
          remoteList.push(sanitizePropertySpecs(item));
        }
      });
      const map = new Map<string, Property>();
      localList.forEach((p) => {
        if (isRealUserProperty(p)) map.set(p.id, sanitizePropertySpecs(p));
      });
      remoteList.forEach((p) => map.set(p.id, sanitizePropertySpecs(p)));

      const merged = Array.from(map.values())
        .map(sanitizePropertySpecs)
        .sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      saveLocalProperties(merged);
      return merged;
    } else {
      return localList;
    }
  } catch (err) {
    console.warn('Firestore fetch failed, falling back to local properties:', err);
    return localList;
  }
};

export const getPropertyById = async (id: string): Promise<Property | null> => {
  if (LEGACY_MOCK_IDS.has(id)) return null;
  try {
    const dRef = doc(db, 'properties', id);
    const snap = await getDoc(dRef);
    if (snap.exists()) {
      const item = { id: snap.id, ...snap.data() } as Property;
      if (isRealUserProperty(item)) return item;
    }
  } catch (err) {
    console.warn('Firestore single get failed:', err);
  }
  const local = getLocalProperties();
  return local.find((p) => p.id === id) || null;
};

export const addPropertyToStore = async (newProp: Omit<Property, 'id' | 'viewsCount' | 'createdAt'>): Promise<Property> => {
  const generatedId = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const { commune, neighborhood } = sanitizeBukavuLocation(newProp.commune, newProp.neighborhood);

  const rawProperty: Property = {
    ...newProp,
    commune,
    neighborhood,
    id: generatedId,
    viewsCount: 1,
    createdAt: new Date().toISOString()
  };

  const fullProperty = sanitizePropertySpecs(rawProperty);

  try {
    await setDoc(doc(db, 'properties', generatedId), fullProperty);
  } catch (e) {
    console.warn('Firestore setDoc warning, adding to local cache:', e);
  }

  const currentLocal = getLocalProperties();
  const updated = [fullProperty, ...currentLocal];
  saveLocalProperties(updated);

  return fullProperty;
};

export const updatePropertyInStore = async (id: string, updates: Partial<Property>): Promise<Property | null> => {
  const currentLocal = getLocalProperties();
  const index = currentLocal.findIndex((p) => p.id === id);
  if (index === -1) return null;

  let sanitizedUpdates: any = { ...updates };
  if (updates.commune || updates.neighborhood) {
    const currentItem = currentLocal[index];
    const { commune, neighborhood } = sanitizeBukavuLocation(
      updates.commune || currentItem.commune,
      updates.neighborhood || currentItem.neighborhood
    );
    sanitizedUpdates.commune = commune;
    sanitizedUpdates.neighborhood = neighborhood;
  }

  Object.keys(sanitizedUpdates).forEach((key) => {
    if (sanitizedUpdates[key] === undefined || sanitizedUpdates[key] === null) {
      delete sanitizedUpdates[key];
    }
  });

  const updatedItem: Property = sanitizePropertySpecs({
    ...currentLocal[index],
    ...sanitizedUpdates,
    updatedAt: new Date().toISOString()
  });

  try {
    await updateDoc(doc(db, 'properties', id), sanitizedUpdates);
  } catch (e) {
    console.warn('Firestore updateDoc warning:', e);
  }

  currentLocal[index] = updatedItem;
  saveLocalProperties(currentLocal);

  return updatedItem;
};

export const incrementPropertyViews = async (id: string): Promise<number> => {
  const currentLocal = getLocalProperties();
  const index = currentLocal.findIndex((p) => p.id === id);
  let newViews = 1;

  if (index !== -1) {
    newViews = (currentLocal[index].viewsCount || 0) + 1;
    currentLocal[index] = {
      ...currentLocal[index],
      viewsCount: newViews
    };
    saveLocalProperties(currentLocal);
  }

  try {
    const dRef = doc(db, 'properties', id);
    await updateDoc(dRef, {
      viewsCount: increment(1)
    });
  } catch (e) {
    console.warn('Firestore increment views warning:', e);
  }

  return newViews;
};

const TRASH_STORAGE_KEY = 'nyumbalink_trash_properties';
const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

export interface TrashPropertyItem {
  property: Property;
  deletedAt: string;
}

export const getDaysRemainingInTrash = (deletedAt: string): number => {
  if (!deletedAt) return 60;
  const elapsedMs = Date.now() - new Date(deletedAt).getTime();
  const remainingDays = 60 - Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  return Math.max(0, remainingDays);
};

export const getTrashProperties = (): TrashPropertyItem[] => {
  try {
    const raw = localStorage.getItem(TRASH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const now = Date.now();
        const valid = parsed.filter((item: TrashPropertyItem) => {
          if (!item.deletedAt) return false;
          const age = now - new Date(item.deletedAt).getTime();
          return age < SIXTY_DAYS_MS;
        });
        if (valid.length !== parsed.length) {
          saveTrashProperties(valid);
        }
        return valid;
      }
    }
  } catch (e) {
    console.warn('Error reading trash properties:', e);
  }
  return [];
};

export const saveTrashProperties = (items: TrashPropertyItem[]): void => {
  try {
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Error saving trash properties:', e);
  }
};

export const deletePropertyFromStore = async (id: string): Promise<boolean> => {
  const currentLocal = getLocalProperties();
  const target = currentLocal.find((p) => p.id === id);

  if (target) {
    const currentTrash = getTrashProperties();
    const updatedTrash = [{ property: target, deletedAt: new Date().toISOString() }, ...currentTrash];
    saveTrashProperties(updatedTrash);
  }

  try {
    await deleteDoc(doc(db, 'properties', id));
  } catch (e) {
    console.warn('Firestore deleteDoc warning:', e);
  }

  const filtered = currentLocal.filter((p) => p.id !== id);
  saveLocalProperties(filtered);

  return true;
};

export const restorePropertyFromTrash = async (id: string): Promise<Property | null> => {
  const currentTrash = getTrashProperties();
  const itemToRestore = currentTrash.find((t) => t.property.id === id);
  if (!itemToRestore) return null;

  const restoredProperty = itemToRestore.property;
  try {
    await setDoc(doc(db, 'properties', restoredProperty.id), restoredProperty);
  } catch (e) {
    console.warn('Firestore restore warning:', e);
  }

  const currentLocal = getLocalProperties();
  saveLocalProperties([restoredProperty, ...currentLocal]);

  const updatedTrash = currentTrash.filter((t) => t.property.id !== id);
  saveTrashProperties(updatedTrash);

  return restoredProperty;
};

export const restoreMultipleFromTrash = async (ids: string[]): Promise<number> => {
  const idSet = new Set(ids);
  const currentTrash = getTrashProperties();
  const toRestore = currentTrash.filter((t) => idSet.has(t.property.id));
  if (toRestore.length === 0) return 0;

  for (const item of toRestore) {
    try {
      await setDoc(doc(db, 'properties', item.property.id), item.property);
    } catch (e) {
      console.warn('Firestore restore multiple error:', e);
    }
  }

  const restoredProperties = toRestore.map((t) => t.property);
  const currentLocal = getLocalProperties();
  saveLocalProperties([...restoredProperties, ...currentLocal]);

  const remainingTrash = currentTrash.filter((t) => !idSet.has(t.property.id));
  saveTrashProperties(remainingTrash);

  return toRestore.length;
};

export const permanentlyDeleteFromTrash = (id: string): boolean => {
  const currentTrash = getTrashProperties();
  const updated = currentTrash.filter((t) => t.property.id !== id);
  saveTrashProperties(updated);
  return true;
};

export const deleteMultiplePermanentlyFromTrash = (ids: string[]): number => {
  const idSet = new Set(ids);
  const currentTrash = getTrashProperties();
  const remaining = currentTrash.filter((t) => !idSet.has(t.property.id));
  saveTrashProperties(remaining);
  return currentTrash.length - remaining.length;
};

export const emptyTrash = (): boolean => {
  saveTrashProperties([]);
  return true;
};

export const isPropertyActiveAndVisible = (property: Property): boolean => {
  if (!property) return false;

  if (
    property.ownerRole === 'admin' ||
    property.ownerEmail === 'benbarakashamamba@gmail.com'
  ) {
    return true;
  }

  if (property.ownerExpiresAt) {
    const expiresTimestamp = new Date(property.ownerExpiresAt).getTime();
    if (!isNaN(expiresTimestamp) && expiresTimestamp <= Date.now()) {
      return false;
    }
  }

  try {
    const raw = localStorage.getItem('nyumba_registered_users');
    if (raw) {
      const users = JSON.parse(raw);
      if (Array.isArray(users)) {
        const owner = users.find(
          (u: any) =>
            u.uid === property.ownerId ||
            (u.email && property.ownerEmail && u.email.toLowerCase() === property.ownerEmail.toLowerCase())
        );

        if (owner) {
          if (owner.status === 'suspended') return false;
          if (owner.role === 'agent' && owner.agentExpiresAt) {
            const exp = new Date(owner.agentExpiresAt).getTime();
            if (!isNaN(exp) && exp <= Date.now()) {
              return false;
            }
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }

  return true;
};

export const filterPropertiesList = (
  properties: Property[],
  options: FilterOptions,
  includeExpired: boolean = false
): Property[] => {
  return properties.filter((p) => {
    if (!includeExpired && !isPropertyActiveAndVisible(p)) {
      return false;
    }

    if (options.searchQuery.trim()) {
      const q = options.searchQuery.toLowerCase().trim();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchAddress = p.address.toLowerCase().includes(q);
      const matchQuartier = p.neighborhood.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAddress && !matchQuartier && !matchCat) {
        return false;
      }
    }

    if (options.commune && options.commune !== 'tous') {
      if (p.commune && p.commune.toLowerCase() !== options.commune.toLowerCase()) {
        return false;
      }
    }

    if (options.category !== 'tous' && p.category !== options.category) {
      return false;
    }

    if (options.type !== 'tous' && p.type !== options.type) {
      return false;
    }

    if (options.neighborhood && options.neighborhood !== 'tous') {
      if (p.neighborhood.toLowerCase() !== options.neighborhood.toLowerCase()) {
        return false;
      }
    }

    if (typeof options.minPrice === 'number' && p.price < options.minPrice) {
      return false;
    }
    if (typeof options.maxPrice === 'number' && p.price > options.maxPrice) {
      return false;
    }

    if (typeof options.minBedrooms === 'number' && p.bedrooms) {
      if (p.bedrooms < options.minBedrooms) return false;
    }

    if (typeof options.minBathrooms === 'number' && p.bathrooms) {
      if (p.bathrooms < options.minBathrooms) return false;
    }

    if (options.features.length > 0) {
      const hasAllFeatures = options.features.every((f) =>
        p.features.some((pf) => pf.toLowerCase().includes(f.toLowerCase()))
      );
      if (!hasAllFeatures) return false;
    }

    return true;
  }).sort((a, b) => {
    if (options.sortBy === 'price_asc') return a.price - b.price;
    if (options.sortBy === 'price_desc') return b.price - a.price;
    if (options.sortBy === 'popular') return (b.viewsCount || 0) - (a.viewsCount || 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};