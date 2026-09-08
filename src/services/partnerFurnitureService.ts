import { PartnerFurnitureItem, BukavuCommune } from '../types';
import { db } from '../config/firebase';
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'nyumbalink_partner_furniture';

export const INITIAL_PARTNER_FURNITURE: PartnerFurnitureItem[] = [];

export function getCachedPartnerFurniture(): PartnerFurnitureItem[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading cached partner furniture:', err);
  }
  
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_PARTNER_FURNITURE));
  } catch {
    // ignore
  }
  return INITIAL_PARTNER_FURNITURE;
}

export function saveCachedPartnerFurniture(items: PartnerFurnitureItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Error saving cached partner furniture:', err);
  }
}

export async function fetchAllPartnerFurniture(): Promise<PartnerFurnitureItem[]> {
  try {
    const colRef = collection(db, 'partner_furniture');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items: PartnerFurnitureItem[] = snapshot.docs.map((d) => ({
        ...(d.data() as PartnerFurnitureItem),
        id: d.id
      }));
      saveCachedPartnerFurniture(items);
      return items;
    }
  } catch (err) {
    console.warn('Firestore partner_furniture fetch error, using local cache:', err);
  }
  return getCachedPartnerFurniture();
}

export async function addPartnerFurnitureItem(
  item: Omit<PartnerFurnitureItem, 'id' | 'createdAt'>
): Promise<PartnerFurnitureItem> {
  const newItem: PartnerFurnitureItem = {
    ...item,
    id: `furn-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    createdAt: new Date().toISOString()
  };

  const current = getCachedPartnerFurniture();
  const updated = [newItem, ...current];
  saveCachedPartnerFurniture(updated);

  try {
    const docRef = doc(db, 'partner_furniture', newItem.id);
    await setDoc(docRef, newItem);
  } catch (err) {
    console.warn('Firestore write for partner furniture failed:', err);
  }

  return newItem;
}

export async function deletePartnerFurnitureItem(id: string): Promise<void> {
  const current = getCachedPartnerFurniture();
  const updated = current.filter((item) => item.id !== id);
  saveCachedPartnerFurniture(updated);

  try {
    const docRef = doc(db, 'partner_furniture', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore delete for partner furniture failed:', err);
  }
}

export async function updatePartnerFurnitureItem(
  id: string,
  data: Partial<PartnerFurnitureItem>
): Promise<void> {
  const current = getCachedPartnerFurniture();
  const updated = current.map((item) => (item.id === id ? { ...item, ...data } : item));
  saveCachedPartnerFurniture(updated);

  try {
    const docRef = doc(db, 'partner_furniture', id);
    await updateDoc(docRef, data);
  } catch (err) {
    console.warn('Firestore update for partner furniture failed:', err);
  }
}