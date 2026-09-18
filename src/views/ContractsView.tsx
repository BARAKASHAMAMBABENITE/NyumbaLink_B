import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  PlusCircle,
  Trash2,
  Check,
  Building2,
  Clock,
  RefreshCw,
  MessageCircle,
  Edit2,
  Home,
  X,
  User,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  Download
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
  getDaysRemaining,
  confirmContract
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
    if (currentUser.role === 'admin') return allContracts;
    if (currentUser.role === 'bailleur' || currentUser.role === 'agent') {
      const myPropertyIds = propertiesList.filter(p => p.ownerId === currentUser.uid).map(p => p.id);
      return allContracts.filter(c => myPropertyIds.includes(c.propertyId) || c.landlordId === currentUser.uid);
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
  
  const [formLandlordName, setFormLandlordName] = useState(defaultProp?.ownerName || '');
  const [formLandlordPhone, setFormLandlordPhone] = useState(defaultProp?.ownerPhone || '');
  const [formLandlordEmail, setFormLandlordEmail] = useState(defaultProp?.ownerEmail || '');

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
  }, [selectedPropertyId, safeProperties, user]);

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

  const handleConfirmContractAction = async (contract: RentalContract) => {
    try {
      await confirmContract(contract.id, user?.fullname || 'Propriétaire', user?.uid);
      refreshContracts();
      showToast('Contrat confirmé et activé avec succès !');
    } catch (err) {
      showToast('Erreur lors de la confirmation du contrat.');
    }
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
        windowWidth: 794
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

      pdf.save(`Attestation_Bail_${selectedContractForSheet?.id || 'NyumbaLink'}.pdf`);
      showToast('PDF téléchargé avec succès.');
    } catch (err) {
      console.error('Erreur PDF:', err);
      showToast('Erreur lors de la génération du PDF.');
    }
  };

  const safeContracts = contracts || [];
  const totalCount = safeContracts.length;
  
  const activeCount = safeContracts.filter((c) => {
    const days = getDaysRemaining(c.endDate);
    return c.status === 'active' || days > 30;
  }).length;

  const expiringCount = safeContracts.filter((c) => {
    const days = getDaysRemaining(c.endDate);
    return days >= 0 && days <= 30;
  }).length;

  const expiredCount = safeContracts.filter((c) => {
    const days = getDaysRemaining(c.endDate);
    return c.status === 'expired' || days < 0;
  }).length;

  // Filtrage et Tri automatique : Les contrats 'pending' (en attente) s'affichent en premier, puis les actifs/autres.
  const filteredContracts = safeContracts
    .filter((c) => {
      const days = getDaysRemaining(c.endDate);
      if (activeTab === 'active') return c.status === 'active' || days > 30;
      if (activeTab === 'expiring') return days >= 0 && days <= 30;
      if (activeTab === 'expired') return c.status === 'expired' || days < 0;
      return true;
    })
    .sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return 0;
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
            Gestion sécurisée et formalisation des baux sur NyumbaLink.
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

      {/* Cartes métriques */}
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
          {filteredContracts.map((contract) => {
            const isOwner = (user?.role === 'bailleur' || user?.role === 'agent' || user?.role === 'admin') && (contract.landlordId === user?.uid || safeProperties.some(p => p.id === contract.propertyId && p.ownerId === user?.uid) || user?.role === 'admin');

            return (
              <div key={contract.id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold"><Building2 className="w-5 h-5 text-[#FF385C]" /></div>
                    <div>
                      <h3 className="font-bold">{contract.propertyTitle}</h3>
                      <p className="text-xs text-gray-500">Quartier {contract.propertyNeighborhood}, {contract.propertyCommune}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {contract.status === 'pending' && isOwner ? (
                      <button
                        onClick={() => handleConfirmContractAction(contract)}
                        className="flex items-center space-x-1 px-4 py-1.5 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-full text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirmer</span>
                      </button>
                    ) : (
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${contract.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                        {contract.status === 'pending' ? 'En attente de confirmation' : 'Contrat Actif'}
                      </span>
                    )}
                  </div>
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
                    <button onClick={() => setSelectedContractForSheet(contract)} className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-xs transition cursor-pointer">
                      <FileText className="w-4 h-4 text-[#FF385C]" />
                      <span>Consulter le contrat</span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button onClick={() => openEditModal(contract)} title="Modifier le contrat" className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={async () => { await deleteContract(contract.id); refreshContracts(); showToast('Supprimé'); }} title="Supprimer" className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale de création / édition de contrat */}
      {newContractModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base">{editingContractId ? 'Modifier le Contrat' : 'Rédiger un Contrat de Bail'}</h3>
              <button onClick={() => setNewContractModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
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
                  <label className="block font-bold mb-1">Nom complet</label>
                  <input type="text" value={formTenantName} onChange={e => setFormTenantName(e.target.value)} required className="w-full p-2.5 rounded-xl border bg-white" />
                </div>
                <div>
                  <label className="block font-bold mb-1">Téléphone</label>
                  <input type="text" value={formTenantPhone} onChange={e => setFormTenantPhone(e.target.value)} required className="w-full p-2.5 rounded-xl border bg-white" />
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <p className="font-black uppercase text-gray-700 text-[11px] border-b pb-1">Informations du Propriétaire</p>
                <div>
                  <label className="block font-bold mb-1">Nom du propriétaire</label>
                  <input type="text" value={formLandlordName} onChange={e => setFormLandlordName(e.target.value)} required className="w-full p-2.5 rounded-xl border bg-white" />
                </div>
                <div>
                  <label className="block font-bold mb-1">Téléphone</label>
                  <input type="text" value={formLandlordPhone} onChange={e => setFormLandlordPhone(e.target.value)} required className="w-full p-2.5 rounded-xl border bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Loyer mensuel ($)</label>
                  <input type="number" value={formRentUSD} onChange={e => setFormRentUSD(Number(e.target.value))} required className="w-full p-2.5 rounded-xl border bg-white font-bold" />
                </div>
                <div>
                  <label className="block font-bold mb-1">Durée (mois)</label>
                  <select value={formDurationMonths} onChange={e => handleDurationChange(Number(e.target.value))} className="w-full p-2.5 rounded-xl border bg-white font-bold">
                    <option value={3}>3 mois</option>
                    <option value={6}>6 mois</option>
                    <option value={12}>1 an (12 mois)</option>
                    <option value={24}>2 ans (24 mois)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Date de début</label>
                  <input type="date" value={formStartDate} onChange={e => handleStartDateChange(e.target.value)} required className="w-full p-2.5 rounded-xl border bg-white" />
                </div>
                <div>
                  <label className="block font-bold mb-1">Date de fin (automatique)</label>
                  <input type="date" value={formEndDate} readOnly className="w-full p-2.5 rounded-xl border bg-gray-100 text-gray-500 font-bold" />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button type="button" onClick={() => setNewContractModalOpen(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition">Annuler</button>
                <button type="submit" className="px-5 py-2 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-xl font-bold transition shadow-md">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale d'affichage de la fiche de contrat (Pour génération PDF) */}
      {selectedContractForSheet && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#FF385C]" />
                <h3 className="font-bold text-base">Attestation de Bail - NyumbaLink</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={handleDownloadPdf} className="flex items-center space-x-1 px-4 py-2 bg-[#FF385C] text-white rounded-xl font-bold text-xs shadow-md hover:bg-[#E00B41] transition">
                  <Download className="w-4 h-4" />
                  <span>Télécharger PDF</span>
                </button>
                <button onClick={() => setSelectedContractForSheet(null)} className="p-1.5 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Contenu de la Fiche imprimable en PDF */}
            <div ref={sheetRef} className="p-8 bg-white text-gray-900 space-y-6 text-xs border rounded-2xl">
              <div className="text-center space-y-1 border-b pb-4">
                <h2 className="text-lg font-black uppercase text-[#FF385C]">NyumbaLink - Contrat de Location</h2>
                <p className="text-gray-500">République Démocratique du Congo, Bukavu</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="font-black text-gray-400 uppercase">Propriétaire</p>
                  <p className="font-bold text-sm">{selectedContractForSheet.landlordName}</p>
                  <p className="text-gray-600">Tél : {selectedContractForSheet.landlordPhone}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-black text-gray-400 uppercase">Locataire</p>
                  <p className="font-bold text-sm">{selectedContractForSheet.tenantName}</p>
                  <p className="text-gray-600">Tél : {selectedContractForSheet.tenantPhone}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                <p className="font-black text-gray-400 uppercase">Désignation du Bien</p>
                <p className="font-bold text-sm">{selectedContractForSheet.propertyTitle}</p>
                <p className="text-gray-600">Quartier {selectedContractForSheet.propertyNeighborhood}, Commune de {selectedContractForSheet.propertyCommune}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-xl">
                  <p className="font-black text-gray-400 uppercase">Loyer Mensuel</p>
                  <p className="font-black text-base text-[#FF385C]">{selectedContractForSheet.monthlyRent} USD</p>
                </div>
                <div className="p-3 border rounded-xl">
                  <p className="font-black text-gray-400 uppercase">Garantie / Caution</p>
                  <p className="font-black text-base text-gray-800">{selectedContractForSheet.depositAmount} USD</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-black text-gray-400 uppercase">Période du Bail</p>
                <p className="font-bold">Du {formatDateToFrench(selectedContractForSheet.startDate)} au {formatDateToFrench(selectedContractForSheet.endDate)}</p>
              </div>

              <div className="pt-12 grid grid-cols-2 text-center font-bold">
                <div>
                  <p className="mb-12">Le Propriétaire</p>
                  <p className="border-t pt-2 border-gray-400 w-3/4 mx-auto">{selectedContractForSheet.landlordName}</p>
                </div>
                <div>
                  <p className="mb-12">Le Locataire</p>
                  <p className="border-t pt-2 border-gray-400 w-3/4 mx-auto">{selectedContractForSheet.tenantName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};