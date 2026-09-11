import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  PlusCircle,
  Trash2,
  Download,
  Check,
  Building2,
  Clock,
  RefreshCw,
  MessageCircle,
  Calendar,
  Edit2,
  Phone,
  Mail,
  Home
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { UserProfile, Property } from '../types';
import {
  RentalContract,
  getUserContracts,
  createContract,
  createContractRequest,
  deleteContract,
  getDaysRemaining
} from '../services/contractService';

interface ContractsViewProps {
  user: UserProfile | null;
  properties: Property[];
}

type FilterTab = 'all' | 'active' | 'expiring' | 'expired';

export const ContractsView: React.FC<ContractsViewProps> = ({ user, properties = [] }) => {
  const safeProperties = properties || [];
  const defaultProp = safeProperties[0];

  const filterUserContracts = (allContracts: RentalContract[], currentUser: UserProfile | null, propertiesList: Property[]) => {
    if (!currentUser) return [];
    if (currentUser.role === 'bailleur' || currentUser.role === 'agent') {
      const agentPropIds = propertiesList.filter(p => p.ownerId === currentUser.uid).map(p => p.id);
      return allContracts.filter(c => agentPropIds.includes(c.propertyId) || c.landlordId === currentUser.uid);
    }
    return allContracts.filter(c => c.tenantId === currentUser.uid);
  };

  const [contracts, setContracts] = useState<RentalContract[]>([]);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [newContractModalOpen, setNewContractModalOpen] = useState(false);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [selectedContractForSheet, setSelectedContractForSheet] = useState<RentalContract | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedPropertyId, setSelectedPropertyId] = useState(defaultProp?.id || '');
  const [formRentUSD, setFormRentUSD] = useState<number | ''>(defaultProp?.price || 220);
  const [formTenantName, setFormTenantName] = useState(user?.fullname || '');
  const [formTenantPhone, setFormTenantPhone] = useState(user?.phone || '');
  const [formTenantAddress, setFormTenantAddress] = useState('Bukavu, RDC');
  
  const [formLandlordName, setFormLandlordName] = useState(defaultProp?.ownerName || (user?.role === 'bailleur' || user?.role === 'agent' ? user?.fullname : '') || '');
  const [formLandlordPhone, setFormLandlordPhone] = useState(defaultProp?.ownerPhone || (user?.role === 'bailleur' || user?.role === 'agent' ? user?.phone : '') || '');
  const [formLandlordEmail, setFormLandlordEmail] = useState(defaultProp?.ownerEmail || (defaultProp?.ownerId === user?.uid ? user?.email : '') || '');

  const [formDurationMonths, setFormDurationMonths] = useState<number>(12);
  const [formStartDate, setFormStartDate] = useState<string>(todayStr);

  const calculateEndDate = (startDateStr: string, months: number): string => {
    try {
      const start = new Date(startDateStr);
      if (!isNaN(start.getTime())) {
        start.setMonth(start.getMonth() + Number(months));
        return start.toISOString().split('T')[0];
      }
    } catch (e) {
      // Ignorer
    }
    return startDateStr;
  };

  const [formEndDate, setFormEndDate] = useState<string>(calculateEndDate(todayStr, 12));

  useEffect(() => {
    void getUserContracts(user).then((all) => setContracts(filterUserContracts(all || [], user, safeProperties)));
  }, [user, safeProperties]);

  const formatDateToFrench = (dateStr: string): string => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getLandlordEmailForContract = (contract: RentalContract): string => {
    const prop = safeProperties.find(p => p.id === contract.propertyId);
    const propertyData = prop as any;

    const isGenericNyumbaLinkEmail = (value: unknown): boolean => {
      const email = String(value || '').trim().toLowerCase();
      return !email || email === 'contact@nyumbalink.com';
    };

    const propertyEmails = [
      propertyData?.ownerEmail,
      propertyData?.owner?.email,
      propertyData?.landlordEmail,
      propertyData?.landlord?.email,
      propertyData?.email
    ];

    const propertyEmail = propertyEmails.find(
      (email) => !isGenericNyumbaLinkEmail(email)
    );

    if (propertyEmail) {
      return String(propertyEmail).trim();
    }

    if (prop?.ownerId === user?.uid && !isGenericNyumbaLinkEmail(user?.email)) {
      return String(user?.email).trim();
    }

    if (contract.landlordId === user?.uid && !isGenericNyumbaLinkEmail(user?.email)) {
      return String(user?.email).trim();
    }

    const contractEmail = (contract as any).landlordEmail;
    if (!isGenericNyumbaLinkEmail(contractEmail)) {
      return String(contractEmail).trim();
    }

    return '';
  };

  useEffect(() => {
    if (selectedPropertyId) {
      const prop = safeProperties.find(p => p.id === selectedPropertyId);
      if (prop) {
        setFormRentUSD(prop.price);
        setFormLandlordName(prop.ownerName || '');
        setFormLandlordPhone(prop.ownerPhone || '');
        setFormLandlordEmail(prop.ownerEmail || (prop.ownerId === user?.uid ? user?.email : '') || '');
      }
    }
  }, [selectedPropertyId, safeProperties]);

  const handleStartDateChange = (newStart: string) => {
    setFormStartDate(newStart);
    setFormEndDate(calculateEndDate(newStart, formDurationMonths));
  };

  const handleDurationChange = (months: number) => {
    setFormDurationMonths(months);
    setFormEndDate(calculateEndDate(formStartDate, months));
  };

  const refreshContracts = () => {
    try {
      void getUserContracts(user).then((all) => setContracts(filterUserContracts(all || [], user, safeProperties)));
    } catch (e) {
      setContracts([]);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openCreateModal = () => {
    setEditingContractId(null);
    const initialProp = defaultProp;
    setSelectedPropertyId(initialProp?.id || '');
    setFormTenantName(user?.fullname || '');
    setFormTenantPhone(user?.phone || '');
    
    setFormLandlordName(initialProp?.ownerName || '');
    setFormLandlordPhone(initialProp?.ownerPhone || '');
    setFormLandlordEmail(initialProp?.ownerEmail || (initialProp?.ownerId === user?.uid ? user?.email : '') || '');

    setFormStartDate(todayStr);
    setFormDurationMonths(12);
    setFormEndDate(calculateEndDate(todayStr, 12));
    setNewContractModalOpen(true);
  };

  const openEditModal = (contract: RentalContract) => {
    setEditingContractId(contract.id);
    setSelectedPropertyId(contract.propertyId);
    setFormTenantName(contract.tenantName);
    setFormTenantPhone(contract.tenantPhone.replace(`${formTenantAddress} - Tél: `, ''));
    setFormLandlordName(contract.landlordName);
    setFormLandlordPhone(contract.landlordPhone);
    setFormLandlordEmail((contract as any).landlordEmail || '');
    setFormRentUSD(contract.monthlyRent);
    setFormStartDate(contract.startDate);
    setFormEndDate(contract.endDate);
    setNewContractModalOpen(true);
  };

  const handleCreateOrUpdateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    const prop = safeProperties.find((p) => p.id === selectedPropertyId);

    try {
      if (editingContractId) {
        await deleteContract(editingContractId);
      }

      const createdContract = await createContract({
        propertyId: prop?.id || `prop-${Date.now()}`,
        propertyTitle: prop?.title || 'Bien Immobilier Bukavu',
        propertyNeighborhood: prop?.neighborhood || 'Ibanda',
        propertyCommune: prop?.commune || 'Ibanda',
        tenantId: user?.uid || 'client-1',
        tenantName: formTenantName,
        tenantPhone: `${formTenantAddress} - Tél: ${formTenantPhone}`,
        landlordId: prop?.ownerId || user?.uid || 'landlord-1',
        landlordName: formLandlordName || prop?.ownerName || 'Propriétaire',
        landlordPhone: formLandlordPhone || prop?.ownerPhone || '',
        landlordEmail: (() => {
          const candidate = prop?.ownerEmail || (prop?.ownerId === user?.uid ? user?.email : '') || formLandlordEmail || '';
          return candidate && candidate.trim().toLowerCase() !== 'contact@nyumbalink.com'
            ? candidate.trim()
            : '';
        })(),
        startDate: formStartDate,
        endDate: formEndDate,
        monthlyRent: Number(formRentUSD) || 220,
        depositAmount: (Number(formRentUSD) || 220) * 2,
        status: 'pending'
      } as RentalContract);

      if (!editingContractId) {
        await createContractRequest(createdContract);
      }

      setNewContractModalOpen(false);
      refreshContracts();
      showToast(editingContractId ? 'Contrat modifié avec succès !' : 'Contrat créé avec succès !');
    } catch (err) {
      showToast('Erreur lors de l’enregistrement du contrat.');
    }
  };

  const handleDownloadPdf = async () => {
    if (!sheetRef.current) {
      showToast('Erreur : Document introuvable.');
      return;
    }

    try {
      const canvas = await html2canvas(sheetRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        onclone: (clonedDoc) => {
          const unsupportedColorRegex = /(?:oklch|oklab|color)\([^)]+\)/gi;

          const sanitizeValue = (value: string): string => {
            if (!value) return value;
            return value.replace(unsupportedColorRegex, '#6b7280');
          };

          // Nettoyage des feuilles de style globales du document cloné
          try {
            Array.from(clonedDoc.styleSheets).forEach((sheet) => {
              try {
                const rules = Array.from(sheet.cssRules || []);
                rules.forEach((rule) => {
                  const cssRule = rule as CSSRule & { style?: CSSStyleDeclaration };
                  if (cssRule.style) {
                    for (let i = 0; i < cssRule.style.length; i++) {
                      const propName = cssRule.style.item(i);
                      const propVal = cssRule.style.getPropertyValue(propName);
                      if (unsupportedColorRegex.test(propVal)) {
                        cssRule.style.setProperty(propName, sanitizeValue(propVal));
                      }
                    }
                  }
                });
              } catch {
                // Ignore cross-origin stylesheet errors
              }
            });
          } catch {
            // Ignore
          }

          // Nettoyage de tous les éléments ayant un style en ligne
          clonedDoc.querySelectorAll<HTMLElement>('*').forEach((el) => {
            const inlineStyle = el.getAttribute('style');
            if (inlineStyle && unsupportedColorRegex.test(inlineStyle)) {
              el.setAttribute('style', sanitizeValue(inlineStyle));
            }
          });
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(
        `Attestation_Bail_${selectedContractForSheet?.id || 'NyumbaLink'}.pdf`
      );

      showToast('PDF téléchargé avec succès.');
    } catch (err) {
      console.error('Erreur PDF:', err);
      showToast('Erreur lors de la génération du PDF.');
    }
  };

  const safeContracts = contracts || [];
  const totalCount = safeContracts.length;
  
  const activeCount = safeContracts.filter((c) => {
    const days = typeof getDaysRemaining === 'function' ? getDaysRemaining(c.endDate) : 60;
    return c.status === 'active' || days > 30;
  }).length;

  const expiringCount = safeContracts.filter((c) => {
    const days = typeof getDaysRemaining === 'function' ? getDaysRemaining(c.endDate) : 60;
    return days >= 0 && days <= 30;
  }).length;

  const expiredCount = safeContracts.filter((c) => {
    const days = typeof getDaysRemaining === 'function' ? getDaysRemaining(c.endDate) : 60;
    return c.status === 'expired' || days < 0;
  }).length;

  const filteredContracts = safeContracts.filter((c) => {
    const days = typeof getDaysRemaining === 'function' ? getDaysRemaining(c.endDate) : 60;
    if (activeTab === 'active') return c.status === 'active' || days > 30;
    if (activeTab === 'expiring') return days >= 0 && days <= 30;
    if (activeTab === 'expired') return c.status === 'expired' || days < 0;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 font-sans text-gray-900">
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-gray-900 text-white text-xs font-bold rounded-2xl shadow-xl flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contrats de Location</h1>
          <p className="text-xs text-gray-500 mt-1">
            Gestion sécurisée et formalisation des baux.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-2xl text-xs font-bold transition shadow-md cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nouveau Contrat de Bail</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => setActiveTab('all')} className={`cursor-pointer p-5 rounded-3xl shadow-sm flex flex-col justify-between space-y-4 transition ${activeTab === 'all' ? 'bg-[#FF385C] text-white' : 'bg-white border border-gray-200'}`}>
          <div className="flex justify-between items-center"><span className="text-xs font-bold uppercase">Total</span><FileText className="w-5 h-5" /></div>
          <span className="text-3xl font-black">{totalCount}</span>
        </div>
        <div onClick={() => setActiveTab('active')} className={`cursor-pointer p-5 rounded-3xl shadow-sm flex flex-col justify-between space-y-4 transition ${activeTab === 'active' ? 'bg-[#FF385C] text-white' : 'bg-white border border-gray-200'}`}>
          <div className="flex justify-between items-center"><span className="text-xs font-bold uppercase">Actifs</span><Check className="w-5 h-5" /></div>
          <span className="text-3xl font-black">{activeCount}</span>
        </div>
        <div onClick={() => setActiveTab('expiring')} className={`cursor-pointer p-5 rounded-3xl shadow-sm flex flex-col justify-between space-y-4 transition ${activeTab === 'expiring' ? 'bg-[#FF385C] text-white' : 'bg-white border border-gray-200'}`}>
          <div className="flex justify-between items-center"><span className="text-xs font-bold uppercase">Échéance &le; 30J</span><Clock className="w-5 h-5" /></div>
          <span className="text-3xl font-black">{expiringCount}</span>
        </div>
        <div onClick={() => setActiveTab('expired')} className={`cursor-pointer p-5 rounded-3xl shadow-sm flex flex-col justify-between space-y-4 transition ${activeTab === 'expired' ? 'bg-[#FF385C] text-white' : 'bg-white border border-gray-200'}`}>
          <div className="flex justify-between items-center"><span className="text-xs font-bold uppercase">Expirés</span><RefreshCw className="w-5 h-5" /></div>
          <span className="text-3xl font-black">{expiredCount}</span>
        </div>
      </div>

      {filteredContracts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 p-8">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold">Aucun contrat trouvé</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContracts.map((contract) => (
            <div key={contract.id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold"><Building2 className="w-5 h-5" /></div>
                  <div>
                    <h3 className="font-bold">{contract.propertyTitle}</h3>
                    <p className="text-xs text-gray-500">Quartier {contract.propertyNeighborhood}, {contract.propertyCommune}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold">
                  {contract.status === 'pending' ? 'En attente' : 'Actif'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="font-bold text-gray-400">LOYER</p>
                  <p className="font-bold">{contract.monthlyRent} $ / mois</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="font-bold text-gray-400">PÉRIODE</p>
                  <p className="font-bold">Du {formatDateToFrench(contract.startDate)} au {formatDateToFrench(contract.endDate)}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <div className="flex space-x-2">
                  <button onClick={() => showToast('Discussion ouverte')} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><MessageCircle className="w-4 h-4" /></button>
                  <button onClick={() => setSelectedContractForSheet(contract)} className="flex items-center space-x-1 px-3 py-2 bg-gray-100 rounded-xl font-bold text-xs"><FileText className="w-4 h-4 text-[#FF385C]" /><span>Fiche & Attestation</span></button>
                </div>
                <div className="flex items-center space-x-1">
                  <button onClick={() => openEditModal(contract)} title="Modifier le contrat" className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={async () => { await deleteContract(contract.id); refreshContracts(); showToast('Supprimé'); }} title="Supprimer" className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale Création / Édition */}
      {newContractModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base">{editingContractId ? 'Modifier le Contrat' : 'Rédiger un Contrat de Bail'}</h3>
            </div>

            <form onSubmit={handleCreateOrUpdateContract} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 flex items-center space-x-1">
                  <Home className="w-3.5 h-3.5 text-[#FF385C]" />
                  <span>Bien immobilier sélectionné</span>
                </label>
                <select value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)} className="w-full p-3 rounded-xl border bg-gray-50 font-bold">
                  {safeProperties.map(p => <option key={p.id} value={p.id}>{p.title} (${p.price})</option>)}
                </select>
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <p className="font-black uppercase text-gray-700 text-[11px] border-b pb-1">Informations du Locataire</p>
                <div>
                  <label className="block font-bold mb-1">Nom du Locataire</label>
                  <input type="text" value={formTenantName} onChange={e => setFormTenantName(e.target.value)} className="w-full p-2.5 rounded-xl border bg-white" required />
                </div>
                <div>
                  <label className="block font-bold mb-1">Téléphone / Contact</label>
                  <input type="text" value={formTenantPhone} onChange={e => setFormTenantPhone(e.target.value)} className="w-full p-2.5 rounded-xl border bg-white" required />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Loyer (USD)</label>
                <input type="number" value={formRentUSD} onChange={e => setFormRentUSD(Number(e.target.value))} className="w-full p-3 rounded-xl border bg-gray-50" required />
              </div>

              <div>
                <label className="block font-bold mb-1">Délai / Durée du bail</label>
                <select 
                  value={formDurationMonths} 
                  onChange={e => handleDurationChange(Number(e.target.value))} 
                  className="w-full p-3 rounded-xl border bg-gray-50 font-bold text-rose-600"
                >
                  <option value={1}>1 Mois (Court terme)</option>
                  <option value={3}>3 Mois (Trimestriel)</option>
                  <option value={6}>6 Mois (Semestriel)</option>
                  <option value={12}>1 An (12 Mois - Standard)</option>
                  <option value={24}>2 Ans (24 Mois)</option>
                  <option value={36}>3 Ans (36 Mois)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                <div>
                  <label className="block font-bold mb-1 text-gray-700 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-[#FF385C]" />
                    <span>Date de début</span>
                  </label>
                  <input 
                    type="date" 
                    value={formStartDate} 
                    onChange={e => handleStartDateChange(e.target.value)} 
                    className="w-full p-2.5 rounded-xl border bg-white font-medium" 
                    required 
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-gray-700 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Date de fin</span>
                  </label>
                  <input 
                    type="date" 
                    value={formEndDate} 
                    disabled 
                    className="w-full p-2.5 rounded-xl border bg-gray-100 text-gray-600 font-bold cursor-not-allowed" 
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setNewContractModalOpen(false)} className="px-4 py-2 rounded-xl border font-bold">Annuler</button>
                <button type="submit" className="px-5 py-2 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-xl font-bold shadow-md">
                  {editingContractId ? 'Sauvegarder les modifications' : 'Soumettre et Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale Fiche & Attestation */}
      {selectedContractForSheet && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-8">
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh]">
              <div ref={sheetRef} className="bg-white text-gray-900 p-4 sm:p-8 rounded-2xl border border-gray-200 space-y-6">
                
                {/* EN-TÊTE NYUMBALINK */}
                <div className="text-center space-y-1.5 border-b border-gray-200 pb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FF385C] text-white shadow-md mb-1">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-[#FF385C]">NyumbaLink</h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">PLATEFORME IMMOBILIÈRE • BUKAVU, RDC</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-gray-50 rounded-xl space-y-1 border border-gray-100">
                    <span className="font-bold text-gray-400">BIEN IMMOBILIER</span>
                    <p className="font-bold text-sm">{selectedContractForSheet.propertyTitle}</p>
                    <p className="text-gray-600">Quartier {selectedContractForSheet.propertyNeighborhood}, {selectedContractForSheet.propertyCommune}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl space-y-1 border border-gray-100">
                    <span className="font-bold text-gray-400">CONDITIONS FINANCIÈRES</span>
                    <p className="font-bold text-emerald-600 text-sm">{selectedContractForSheet.monthlyRent} USD / mois</p>
                    <p className="text-gray-600">Caution de garantie : {selectedContractForSheet.depositAmount} USD</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-gray-50 rounded-xl space-y-1 border border-gray-100">
                    <span className="font-bold text-gray-400">LOCATAIRE</span>
                    <p className="font-bold text-sm">{selectedContractForSheet.tenantName}</p>
                    <p className="text-gray-600">{selectedContractForSheet.tenantPhone}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl space-y-1 border border-gray-100">
                    <span className="font-bold text-gray-400">PROPRIÉTAIRE DU BIEN</span>
                    <p className="font-bold text-sm">{selectedContractForSheet.landlordName}</p>
                    {selectedContractForSheet.landlordPhone && (
                      <p className="text-gray-600 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{selectedContractForSheet.landlordPhone}</span>
                      </p>
                    )}
                    {getLandlordEmailForContract(selectedContractForSheet) && (
                      <p className="text-gray-600 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span>{getLandlordEmailForContract(selectedContractForSheet)}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* PARTIE INFOS FINALES (LOCATAIRE, PROPRIÉTAIRE & REPRÉSENTANTS) */}
                <div className="pt-6 border-t border-gray-200 space-y-6 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    {/* Bloc Locataire */}
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1 text-center">
                      <p className="font-bold text-sm">{selectedContractForSheet.tenantName}</p>
                      <p className="text-gray-600">{selectedContractForSheet.tenantPhone}</p>
                      <div className="pt-6">
                        <div className="border-b border-dashed border-gray-300 w-3/4 mx-auto"></div>
                      </div>
                    </div>

                    {/* Bloc Propriétaire */}
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1 text-center">
                      <p className="font-bold text-sm">{selectedContractForSheet.landlordName}</p>
                      <p className="text-gray-600">{selectedContractForSheet.landlordPhone || 'Non spécifié'}</p>
                      {getLandlordEmailForContract(selectedContractForSheet) && (
                        <p className="text-gray-600">{getLandlordEmailForContract(selectedContractForSheet)}</p>
                      )}
                      <div className="pt-6">
                        <div className="border-b border-dashed border-gray-300 w-3/4 mx-auto"></div>
                      </div>
                    </div>
                  </div>

                  {/* Bloc Représentants NyumbaLink */}
                  <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                      <div className="space-y-1">
                        <p className="font-bold text-gray-800">BARAKA SHAMAMBA Bénite</p>
                        <p className="text-gray-600">+243 986 760 178</p>
                        <div className="pt-2 border-b border-dashed border-gray-300 w-3/4 mx-auto"></div>
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-gray-800">DAVID MAKINDU Carmelo</p>
                        <p className="text-gray-600">+243 993 853 036</p>
                        <div className="pt-2 border-b border-dashed border-gray-300 w-3/4 mx-auto"></div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center pt-2 text-[10px] text-gray-400">
                    Fait à Bukavu, le {formatDateToFrench(todayStr)} • Document certifié par NyumbaLink
                  </div>
                </div>

              </div>
            </div>

            {/* Boutons d'action de la modale */}
            <div className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
              <button
                onClick={() => setSelectedContractForSheet(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-300 transition"
              >
                Fermer
              </button>
              <button
                onClick={handleDownloadPdf}
                className="flex items-center space-x-2 px-5 py-2 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-xl text-xs font-bold transition shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger le PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};