/**
 * Helper to pluralize French words dynamically without clumsy "(s)"
 */
export const pluralize = (
  count: number,
  singular: string,
  plural?: string
): string => {
  if (count <= 1) {
    return `${count} ${singular}`;
  }
  return `${count} ${plural || `${singular}s`}`;
};

/**
 * Returns formatted agreement text e.g. "1 bien enregistré" vs "2 biens enregistrés"
 */
export const formatPropertyCount = (count: number): string => {
  if (count <= 1) {
    return `${count} bien`;
  }
  return `${count} biens`;
};

export const formatSavedPropertiesCount = (count: number): string => {
  if (count <= 1) {
    return `${count} bien enregistré dans votre sélection`;
  }
  return `${count} biens enregistrés dans votre sélection`;
};

export const formatAvailablePropertiesCount = (count: number): string => {
  if (count <= 1) {
    return `${count} bien disponible selon vos critères`;
  }
  return `${count} biens disponibles selon vos critères`;
};

export const formatFoundPropertiesCount = (count: number): string => {
  if (count <= 1) {
    return `${count} bien trouvé`;
  }
  return `${count} biens trouvés`;
};

export const formatMarkersCount = (count: number): string => {
  if (count <= 1) {
    return `${count} marqueur affiché`;
  }
  return `${count} marqueurs affichés`;
};

export const formatUnreadMessagesCount = (count: number): string => {
  if (count <= 1) {
    return `${count} message non lu reçu des clients`;
  }
  return `${count} messages non lus reçus des clients`;
};

export const formatAnnouncementsCount = (count: number): string => {
  if (count <= 1) {
    return `${count} annonce`;
  }
  return `${count} annonces`;
};

export const formatNewAnnouncementsCount = (count: number): string => {
  if (count <= 1) {
    return `${count} nouvelle annonce`;
  }
  return `${count} nouvelles annonces`;
};
