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
  Calendar
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { UserProfile, Property } from '../types';
import {
  RentalContract,
  getUserContracts,
  createContract,
  deleteContract,
  getDaysRemaining
} from '../services/contractService';

interface ContractsViewProps {
  user: UserProfile | null;
  properties: Property[];
}

type FilterTab = 'all' | 'active' | 'expiring' | 'expired';

export const ContractsView: React.FC<ContractsViewProps> = ({ user, properties = [] }) => {
  const [contracts, setContracts] = useState<RentalContract[]>(() => {
    try {
      const all = getUserContracts(user) || [];
      if (!user) return [];
      const safeProperties = properties || [];
      if (user.role === 'landlord' || user.role === 'agent') {
        const agentPropIds = safeProperties.filter(p => p.ownerId === user.uid).map(p => p.id);
        return all.filter(c => agentPropIds.includes(c.propertyId) || c.landlordId === user.uid);
      }
      return all.filter(c => c.tenantId === user.uid);
    } catch (e) {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [newContractModalOpen, setNewContractModalOpen] = useState(false);
  const [selectedContractForSheet, setSelectedContractForSheet] = useState<RentalContract | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const safeProperties = properties || [];
  const defaultProp = safeProperties[0];
  const [selectedPropertyId, setSelectedPropertyId] = useState(defaultProp?.id || '');
  const [formRentUSD, setFormRentUSD] = useState<number | ''>(defaultProp?.price || 220);
  const [formTenantName, setFormTenantName] = useState(user?.fullname || '');
  const [formTenantPhone, setFormTenantPhone] = useState(user?.phone || '+243');
  const [formTenantAddress, setFormTenantAddress] = useState('Bukavu, RDC');
  
  // Nouveaux états pour la gestion dynamique des dates de bail (fixé au 07/09/2026 par défaut)
  const [formDurationMonths, setFormDurationMonths] = useState<number>(12); // Par défaut 1 an (12 mois)
  const [formStartDate, setFormStartDate] = useState<string>('2026-09-07');
  const [formEndDate, setFormEndDate] = useState<string>('2027-09-07');

  useEffect(() => {
    if (selectedPropertyId) {
      const prop = safeProperties.find(p => p.id === selectedPropertyId);
      if (prop) {
        setFormRentUSD(prop.price);
      }
    }
  }, [selectedPropertyId, safeProperties]);

  // Fonction pour recalculer automatiquement la date de fin en fonction de la date de début et du délai en mois choisi
  const calculateEndDate = (startDateStr: string, months: number) => {
    try {
      const start = new Date(startDateStr);
      if (!isNaN(start.getTime())) {
        start.setMonth(start.getMonth() + Number(months));
        return start.toISOString().split('T')[0];
      }
    } catch (e) {
      // Ignorer l'erreur
    }
    return startDateStr;
  };

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
      const all = getUserContracts(user) || [];
      const currentProperties = properties || [];
      if (!user) {
        setContracts(all);
        return;
      }
      if (user.role === 'landlord' || user.role === 'agent') {
        const agentPropIds = currentProperties.filter(p => p.ownerId === user.uid).map(p => p.id);
        setContracts(all.filter(c => agentPropIds.includes(c.propertyId) || c.landlordId === user.uid));
      } else {
        setContracts(all.filter(c => c.tenantId === user.uid));
      }
    } catch (e) {
      setContracts([]);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateContractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentProperties = properties || [];
    const prop = currentProperties.find((p) => p.id === selectedPropertyId);

    try {
      createContract({
        propertyId: prop?.id || `prop-${Date.now()}`,
        propertyTitle: prop?.title || 'Bien Immobilier Bukavu',
        propertyNeighborhood: prop?.neighborhood || 'Ibanda',
        propertyCommune: prop?.commune || 'Ibanda',
        tenantId: user?.uid || 'client-1',
        tenantName: formTenantName,
        tenantPhone: `${formTenantAddress} - Tél: ${formTenantPhone}`,
        landlordId: prop?.ownerId || 'landlord-1',
        landlordName: prop?.ownerName || 'Propriétaire NyumbaLink',
        landlordPhone: prop?.ownerPhone || '+243998123456',
        startDate: formStartDate,
        endDate: formEndDate,
        monthlyRent: Number(formRentUSD) || 220,
        depositAmount: (Number(formRentUSD) || 220) * 2,
        status: 'pending'
      });

      setNewContractModalOpen(false);
      refreshContracts();
      showToast('Contrat créé avec succès !');
    } catch (err) {
      showToast('Erreur lors de la création du contrat.');
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
        backgroundColor: '#ffffff'
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

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Fiche_Bail_NyumbaLink_${selectedContractForSheet?.id || 'officiel'}.pdf`);
      showToast('PDF téléchargé avec succès.');
    } catch (err) {
      console.error('Erreur PDF:', err);
      showToast('Erreur lors du téléchargement du PDF.');
    }
  };

  const safeContracts = contracts || [];
  const totalCount = safeContracts.length;
  const activeCount = safeContracts.filter((c) => c.status === 'active' || (getDaysRemaining ? getDaysRemaining(c.endDate) > 30 : true)).length;
  const expiringCount = safeContracts.filter((c) => {
    const days = getDaysRemaining ? getDaysRemaining(c.endDate) : 60;
    return days >= 0 && days <= 30;
  }).length;
  const expiredCount = safeContracts.filter((c) => {
    const days = getDaysRemaining ? getDaysRemaining(c.endDate) : 60;
    return c.status === 'expired' || days < 0;
  }).length;

  const filteredContracts = safeContracts.filter((c) => {
    const days = getDaysRemaining ? getDaysRemaining(c.endDate) : 60;
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
          onClick={() => setNewContractModalOpen(true)}
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
                  <p className="font-bold">Du {contract.startDate} au {contract.endDate}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <div className="flex space-x-2">
                  <button onClick={() => showToast('Discussion ouverte')} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><MessageCircle className="w-4 h-4" /></button>
                  <button onClick={() => setSelectedContractForSheet(contract)} className="flex items-center space-x-1 px-3 py-2 bg-gray-100 rounded-xl font-bold text-xs"><FileText className="w-4 h-4 text-[#FF385C]" /><span>Fiche & Attestation</span></button>
                </div>
                <button onClick={() => { deleteContract(contract.id); refreshContracts(); showToast('Supprimé'); }} className="p-2 text-gray-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale Nouveau Contrat avec Choix du Délai, Date de Signature et Calcul Automatique de la Fin */}
      {newContractModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base">Rédiger un Contrat de Bail</h3>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full">
                Bail officiel NyumbaLink
              </span>
            </div>

            <form onSubmit={handleCreateContractSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Bien immobilier</label>
                <select value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)} className="w-full p-3 rounded-xl border bg-gray-50">
                  {safeProperties.map(p => <option key={p.id} value={p.id}>{p.title} (${p.price})</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Nom du Locataire</label>
                <input type="text" value={formTenantName} onChange={e => setFormTenantName(e.target.value)} className="w-full p-3 rounded-xl border bg-gray-50" required />
              </div>

              <div>
                <label className="block font-bold mb-1">Téléphone / Contact</label>
                <input type="text" value={formTenantPhone} onChange={e => setFormTenantPhone(e.target.value)} className="w-full p-3 rounded-xl border bg-gray-50" required />
              </div>

              <div>
                <label className="block font-bold mb-1">Loyer (USD)</label>
                <input type="number" value={formRentUSD} onChange={e => setFormRentUSD(Number(e.target.value))} className="w-full p-3 rounded-xl border bg-gray-50" required />
              </div>

              {/* Sélection du délai / durée du bail */}
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

              {/* Date de signature / début et date de fin calculée */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                <div>
                  <label className="block font-bold mb-1 text-gray-700 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-[#FF385C]" />
                    <span>Date de signature (Début)</span>
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
                    <span>Date de fin (Automatique)</span>
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
                <button type="submit" className="px-5 py-2 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-xl font-bold shadow-md">Soumettre et Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale Fiche & Attestation */}
      {selectedContractForSheet && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-8">
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              <div ref={sheetRef} className="bg-white text-black p-8 rounded-2xl border border-gray-300 space-y-6">
                <div className="text-center space-y-1 border-b border-gray-200 pb-4">
                  <h2 className="text-xl font-black text-rose-600">NyumbaLink</h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">RÉPUBLIQUE DÉMOCRATIQUE DU CONGO • BUKAVU</p>
                  <span className="inline-block px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold">ATTESTATION DE LOCATION OFFICIELLE</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-gray-50 rounded-xl space-y-1 border border-gray-100">
                    <span className="font-bold text-gray-400">BIEN</span>
                    <p className="font-bold">{selectedContractForSheet.propertyTitle}</p>
                    <p className="text-gray-600">Quartier {selectedContractForSheet.propertyNeighborhood}, {selectedContractForSheet.propertyCommune}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl space-y-1 border border-gray-100">
                    <span className="font-bold text-gray-400">CONDITIONS</span>
                    <p className="font-bold text-emerald-600">{selectedContractForSheet.monthlyRent} USD / mois</p>
                    <p className="text-gray-600">Caution : {selectedContractForSheet.depositAmount} USD</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-gray-50 rounded-xl space-y-1 border border-gray-100">
                    <span className="font-bold text-gray-400">LOCATAIRE</span>
                    <p className="font-bold">{selectedContractForSheet.tenantName}</p>
                    <p className="text-gray-600">{selectedContractForSheet.tenantPhone}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl space-y-1 border border-gray-100">
                    <span className="font-bold text-gray-400">PROPRIÉTAIRE</span>
                    <p className="font-bold">{selectedContractForSheet.landlordName}</p>
                    <p className="text-gray-600">{selectedContractForSheet.landlordPhone}</p>
                  </div>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl text-xs border border-rose-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-rose-600">PÉRIODE DE LOCATION : </span>
                    <span>Du {selectedContractForSheet.startDate} au {selectedContractForSheet.endDate}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-white text-rose-600 rounded-md border border-rose-200">
                    Signé le {selectedContractForSheet.startDate}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[10px]">
                  <div className="p-3 border border-gray-200 rounded-xl space-y-1">
                    <p className="font-bold uppercase text-gray-500">1. Client / Locataire</p>
                    <p className="font-bold text-black mt-1">{selectedContractForSheet.tenantName}</p>
                  </div>
                  <div className="p-3 border border-gray-200 rounded-xl space-y-1">
                    <p className="font-bold uppercase text-gray-500">2. Propriétaire du Bien</p>
                    <p className="font-bold text-black mt-1">{selectedContractForSheet.landlordName}</p>
                  </div>
                  <div className="p-3 border border-rose-200 bg-rose-50 rounded-xl space-y-1">
                    <p className="font-bold uppercase text-rose-600">3. Pour NyumbaLink</p>
                    <p className="font-bold text-black mt-1">BARAKA SHAMAMBA Bénite<br />DAVID MAKINDU Shilla</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button onClick={() => setSelectedContractForSheet(null)} className="px-4 py-2 bg-gray-200 rounded-xl text-xs font-bold text-gray-700">Fermer</button>
              <button onClick={handleDownloadPdf} className="flex items-center space-x-2 px-6 py-2.5 bg-[#FF385C] text-white rounded-xl text-xs font-bold shadow-md"><Download className="w-4 h-4" /><span>Télécharger en PDF</span></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};