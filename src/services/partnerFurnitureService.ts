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

export const INITIAL_PARTNER_FURNITURE: PartnerFurnitureItem[] = [
  {
    id: 'furn-01',
    title: 'Salon Canapé d’Angle 6 Places en Cuir Noir',
    category: 'canape',
    price: 450,
    condition: 'tres_bon_etat',
    description: 'Magnifique salon d’angle avec coussins épais très confortables. Idéal pour équiper un salon d’appartement ou villa à Bukavu. Nettoyé et ciré.',
    commune: 'Ibanda',
    neighborhood: 'Nguba',
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'
    ],
    partnerId: 'partner-ben',
    partnerName: 'Bén BARAKA SHAMAMBA (Partenaire Mobilier)',
    partnerPhone: '+243986760178',
    partnerEmail: 'benbarakashamamba@gmail.com',
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'furn-02',
    title: 'Grande Table à Manger en Bois Massif de Cyprès + 6 Chaises',
    category: 'table',
    price: 320,
    condition: 'neuf',
    description: 'Table à manger artisanale fabriquée en bois dur local poli et verni, fournie avec ses 6 chaises assorties robustes. Finition élégante.',
    commune: 'Ibanda',
    neighborhood: 'Labotte',
    images: [
      'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80'
    ],
    partnerId: 'partner-ben',
    partnerName: 'Bén BARAKA SHAMAMBA (Partenaire Mobilier)',
    partnerPhone: '+243986760178',
    partnerEmail: 'benbarakashamamba@gmail.com',
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'furn-03',
    title: 'Armoire Penderie 3 Portes avec Grand Miroir Central',
    category: 'armoire',
    price: 240,
    condition: 'tres_bon_etat',
    description: 'Armoire moderne pour chambre à coucher avec compartiment penderie cintres et étagères intérieures de rangement. Serrure avec clés fournies.',
    commune: 'Ibanda',
    neighborhood: 'Nyawera',
    images: [
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80'
    ],
    partnerId: 'partner-ben',
    partnerName: 'Bén BARAKA SHAMAMBA (Partenaire Mobilier)',
    partnerPhone: '+243986760178',
    partnerEmail: 'benbarakashamamba@gmail.com',
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'furn-04',
    title: 'Congélateur Bahut Hisense 250 Litres Basse Consommation',
    category: 'congelateur',
    price: 290,
    condition: 'tres_bon_etat',
    description: 'Congélateur bahut haute efficacité énergétique avec compresseur tropicalisé résistant aux variations SNEL de Bukavu. Garde le froid pendant 36 heures.',
    commune: 'Ibanda',
    neighborhood: 'Muhungu',
    images: [
      'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80'
    ],
    partnerId: 'partner-ben',
    partnerName: 'Bén BARAKA SHAMAMBA (Partenaire Mobilier)',
    partnerPhone: '+243986760178',
    partnerEmail: 'benbarakashamamba@gmail.com',
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'furn-05',
    title: 'Étagère Bibliothèque Design 5 Niveaux en Métal & Bois',
    category: 'etagere',
    price: 130,
    condition: 'neuf',
    description: 'Étagère de style industriel parfaite pour le rangement de livres, dossiers ou décoration dans un salon ou bureau à Bukavu.',
    commune: 'Kadutu',
    neighborhood: 'Nyamugo',
    images: [
      'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80'
    ],
    partnerId: 'partner-ben',
    partnerName: 'Bén BARAKA SHAMAMBA (Partenaire Mobilier)',
    partnerPhone: '+243986760178',
    partnerEmail: 'benbarakashamamba@gmail.com',
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'furn-06',
    title: 'Lot de 4 Chaises Modernes Rembourrées en Velours Gris',
    category: 'chaise',
    price: 110,
    condition: 'neuf',
    description: 'Chaises de salle à manger élégantes avec pieds métalliques noirs et assise en velours ultra confortable. Très facile à nettoyer.',
    commune: 'Ibanda',
    neighborhood: 'Ndendere',
    images: [
      'https://images.unsplash.com/photo-1580481077189-63e527027d7d?auto=format&fit=crop&w=800&q=80'
    ],
    partnerId: 'partner-ben',
    partnerName: 'Bén BARAKA SHAMAMBA (Partenaire Mobilier)',
    partnerPhone: '+243986760178',
    partnerEmail: 'benbarakashamamba@gmail.com',
    isAvailable: true,
    createdAt: new Date().toISOString()
  }
];

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
  // Initialize with realistic Bukavu furniture
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
