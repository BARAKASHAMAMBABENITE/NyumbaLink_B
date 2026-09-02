import { Property, BukavuCommune } from '../types';

export const BUKAVU_COMMUNES: BukavuCommune[] = ['Ibanda', 'Kadutu', 'Bagira'];

export const BUKAVU_COMMUNES_WITH_NEIGHBORHOODS: Record<BukavuCommune, string[]> = {
  Ibanda: ['Ndendere', 'Nyalukemba', 'Panzi', 'Nguba', 'La Botte', 'Nyawera', 'Muhungu', 'Mukukwe', 'Major Vangu', 'Ruzizi'],
  Kadutu: ['Nkafu', 'Nyakaliba', 'Kasali', 'Mosala', 'Nyamugo', 'Cimpunda', 'Kajangu', 'Buholo', 'Tubimbi', 'Camp TV'],
  Bagira: ['Kasha', 'Lumumba', 'Nyakavogo', 'Mulambula', 'Cikonyi', 'Ciriri', 'Fariala', 'Bwindi']
};

export const ALL_BUKAVU_NEIGHBORHOODS: string[] = Object.values(BUKAVU_COMMUNES_WITH_NEIGHBORHOODS).flat();
export const BUKAVU_NEIGHBORHOODS = ALL_BUKAVU_NEIGHBORHOODS;

export const BUKAVU_NEIGHBORHOOD_COORDINATES: Record<string, [number, number]> = {
  // Ibanda
  'Ndendere': [-2.5080, 28.8600],
  'Nyalukemba': [-2.5120, 28.8640],
  'Panzi': [-2.5380, 28.8650],
  'Nguba': [-2.5150, 28.8680],
  'La Botte': [-2.4980, 28.8590],
  'Nyawera': [-2.5020, 28.8550],
  'Muhungu': [-2.5200, 28.8520],
  'Mukukwe': [-2.5050, 28.8480],
  'Major Vangu': [-2.5280, 28.8580],
  'Ruzizi': [-2.5040, 28.8710],
  // Kadutu
  'Nkafu': [-2.4860, 28.8480],
  'Nyakaliba': [-2.4940, 28.8320],
  'Kasali': [-2.4960, 28.8380],
  'Mosala': [-2.4890, 28.8450],
  'Nyamugo': [-2.4920, 28.8420],
  'Cimpunda': [-2.4850, 28.8350],
  'Kajangu': [-2.4880, 28.8390],
  'Buholo': [-2.4830, 28.8470],
  'Tubimbi': [-2.4910, 28.8340],
  'Camp TV': [-2.4870, 28.8430],
  // Bagira
  'Kasha': [-2.4580, 28.8150],
  'Lumumba': [-2.4620, 28.8220],
  'Nyakavogo': [-2.4650, 28.8180],
  'Mulambula': [-2.4680, 28.8300],
  'Cikonyi': [-2.4720, 28.8250],
  'Ciriri': [-2.4780, 28.8100],
  'Fariala': [-2.4660, 28.8120],
  'Bwindi': [-2.4590, 28.8280]
};

export const BUKAVU_COMMUNE_CENTERS: Record<BukavuCommune, [number, number]> = {
  Ibanda: [-2.5080, 28.8600],
  Kadutu: [-2.4920, 28.8400],
  Bagira: [-2.4650, 28.8200]
};

export const INITIAL_PROPERTIES: Property[] = [];
