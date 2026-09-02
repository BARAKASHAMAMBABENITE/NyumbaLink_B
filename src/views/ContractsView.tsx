import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  MessageCircle,
  PlusCircle,
  RefreshCw,
  Trash2,
  Printer,
  ChevronRight,
  ShieldCheck,
  Building2,
  DollarSign,
  User,
  ExternalLink,
  Edit3,
  Heart,
  Download,
  Check,
  Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BrandLogo } from '../components/BrandLogo';
import { UserProfile, Property } from '../types';
import {
  RentalContract,
  ContractStatus,
  getUserContracts,
  createContract,
  confirmContract,
  requestRenewal,
  acceptRenewal,
  rejectRenewal,
  terminateContract,
  deleteContract,
  getContractStatusDetails,
  getDaysRemaining
} from '../services/contractService';
import { useLanguage } from '../context/LanguageContext';

interface ContractsViewProps {
  user: UserProfile | null;
  properties: Property[];
  favoriteIds?: string[];
  onSelectProperty?: (property: Property) => void;
  openAuthModal?: () => void;
}

export const ContractsView: React.FC<ContractsViewProps> = ({
  user,
  properties,
  favoriteIds = [],
  onSelectProperty,
  openAuthModal
}) => {
  const { language } = useLanguage();
  const [contracts, setContracts] = useState<RentalContract[]>(() => getUserContracts(user));
  const [activeFilter, setActiveFilter] = useState<'tous' | 'actifs' | 'proches' | 'termines'>('tous');

  useEffect(() => {
    setContracts(getUserContracts(user));
  }, [user]);

  // Modal states
  const [newContractModalOpen, setNewContractModalOpen] = useState(false);
  const [renewModalContract, setRenewModalContract] = useState<RentalContract | null>(null);
  const [certificateModalContract, setCertificateModalContract] = useState<RentalContract | null>(null);
  const [isEditingCertificate, setIsEditingCertificate] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Renewal form
  const [renewEndDate, setRenewEndDate] = useState('');
  const [renewRentAmount, setRenewRentAmount] = useState<number | ''>('');

  // New contract form state
  const [propertySelectionMode, setPropertySelectionMode] = useState<'catalog' | 'custom'>('catalog');
  const [customPropertyTitle, setCustomPropertyTitle] = useState('');
  const [customPropertyAddress, setCustomPropertyAddress] = useState('');
  const [customPropertyCommune, setCustomPropertyCommune] = useState('Ibanda');
  const [customPropertyNeighborhood, setCustomPropertyNeighborhood] = useState('Nguba');
  const [customPropertyCategory, setCustomPropertyCategory] = useState('maison');

  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id || '');
  const [formTenantName, setFormTenantName] = useState(user?.fullname || '');
  const [formTenantEmail, setFormTenantEmail] = useState(user?.email || '');
  const [formTenantPhone, setFormTenantPhone] = useState(user?.phone || '+243 ');
  const [formLandlordName, setFormLandlordName] = useState('Bénite BARAKA SHAMAMBA (Agent Agréé)');
  const [formLandlordEmail, setFormLandlordEmail] = useState('benite.baraka@nyumbalink.cd');
  const [formLandlordPhone, setFormLandlordPhone] = useState('+243 986 760 178');
  const [formRentUSD, setFormRentUSD] = useState<number | ''>(properties[0]?.price || 500);
  const [formDepositUSD, setFormDepositUSD] = useState<number | ''>((properties[0]?.price || 500) * 2);
  const [formStartDate, setFormStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  });
  const [formPaymentFreq, setFormPaymentFreq] = useState<'mensuel' | 'trimestriel' | 'semestriel' | 'annuel'>('mensuel');
  const [formNotes, setFormNotes] = useState('Bail résidentiel standard conforme aux usages de la ville de Bukavu avec préavis de 5 jours.');

  // Certificate Editable State
  const [certData, setCertData] = useState<{
    propertyTitle: string;
    propertyAddress: string;
    propertyCommune: string;
    propertyNeighborhood: string;
    tenantName: string;
    tenantPhone: string;
    tenantEmail: string;
    landlordName: string;
    landlordPhone: string;
    landlordEmail: string;
    rentAmountUSD: number;
    depositAmountUSD: number;
    paymentFrequency: string;
    startDate: string;
    endDate: string;
    specialClauses: string;
  } | null>(null);

  const refreshContracts = () => {
    setContracts(getUserContracts(user));
  };

  const handleOpenCertificate = (contract: RentalContract) => {
    setCertData({
      propertyTitle: contract.propertyTitle,
      propertyAddress: contract.propertyAddress,
      propertyCommune: contract.propertyCommune,
      propertyNeighborhood: contract.propertyNeighborhood,
      tenantName: contract.tenantName,
      tenantPhone: contract.tenantPhone,
      tenantEmail: contract.tenantEmail,
      landlordName: contract.landlordName,
      landlordPhone: contract.landlordPhone,
      landlordEmail: contract.landlordEmail,
      rentAmountUSD: contract.rentAmountUSD,
      depositAmountUSD: contract.depositAmountUSD || contract.rentAmountUSD * 2,
      paymentFrequency: contract.paymentFrequency,
      startDate: contract.startDate,
      endDate: contract.endDate,
      specialClauses: contract.notes || 'Paiement mensuel au plus tard le 5 de chaque mois. Préavis réciproque de 5 jours.'
    });
    setIsEditingCertificate(false);
    setCertificateModalContract(contract);
  };

  const handlePropertySelectionChange = (propId: string) => {
    setSelectedPropertyId(propId);
    const prop = properties.find((p) => p.id === propId);
    if (prop) {
      setFormLandlordName(prop.ownerName || 'Bénite BARAKA SHAMAMBA');
      setFormLandlordEmail(prop.ownerEmail || 'benite.baraka@nyumbalink.cd');
      setFormLandlordPhone(prop.ownerPhone || '+243 986 760 178');
      setFormRentUSD(prop.price);
      setFormDepositUSD(prop.price * 2);
    }
  };

  const handleInitiateForAdmiredProperty = (prop: Property) => {
    setPropertySelectionMode('catalog');
    setSelectedPropertyId(prop.id);
    setFormLandlordName(prop.ownerName || 'Bénite BARAKA SHAMAMBA');
    setFormLandlordEmail(prop.ownerEmail || 'benite.baraka@nyumbalink.cd');
    setFormLandlordPhone(prop.ownerPhone || '+243 986 760 178');
    setFormRentUSD(prop.price);
    setFormDepositUSD(prop.price * 2);
    setNewContractModalOpen(true);
  };

  // Filter calculations
  const totalCount = contracts.length;
  const activeCount = contracts.filter((c) => !getContractStatusDetails(c).isExpired).length;
  const expiringSoonCount = contracts.filter((c) => getContractStatusDetails(c).isExpiringSoon).length;
  const expiredCount = contracts.filter((c) => getContractStatusDetails(c).isExpired).length;

  const filteredContracts = contracts.filter((c) => {
    const details = getContractStatusDetails(c);
    if (activeFilter === 'actifs') return !details.isExpired;
    if (activeFilter === 'proches') return details.isExpiringSoon;
    if (activeFilter === 'termines') return details.isExpired;
    return true;
  });

  const handleCreateContractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isCustom = propertySelectionMode === 'custom';
    const prop = properties.find((p) => p.id === selectedPropertyId);

    const title = isCustom ? customPropertyTitle : prop?.title || 'Bien à Bukavu';
    const address = isCustom ? customPropertyAddress : prop?.address || `${prop?.neighborhood}, Bukavu`;
    const commune = isCustom ? customPropertyCommune : prop?.commune || 'Ibanda';
    const neighborhood = isCustom ? customPropertyNeighborhood : prop?.neighborhood || 'Nguba';
    const category = isCustom ? customPropertyCategory : prop?.category || 'maison';
    const image = isCustom ? '' : prop?.images[0] || '';

    const isClientRole = user?.role === 'client';
    const initialStatus: ContractStatus = isClientRole ? 'en_attente_confirmation' : 'actif';

    createContract({
      propertyId: prop?.id || `custom-prop-${Date.now()}`,
      propertyTitle: title,
      propertyAddress: address,
      propertyCommune: commune,
      propertyNeighborhood: neighborhood,
      propertyImage: image,
      propertyCategory: category,
      tenantId: user?.uid || `tenant-${Date.now()}`,
      tenantName: formTenantName || user?.fullname || 'Locataire',
      tenantEmail: formTenantEmail || user?.email || '',
      tenantPhone: formTenantPhone || user?.phone || '+243 986 760 178',
      landlordId: prop?.ownerId || 'agent-1',
      landlordName: formLandlordName,
      landlordEmail: formLandlordEmail,
      landlordPhone: formLandlordPhone,
      rentAmountUSD: Number(formRentUSD) || 500,
      depositAmountUSD: Number(formDepositUSD) || (Number(formRentUSD) || 500) * 2,
      paymentFrequency: formPaymentFreq,
      startDate: formStartDate,
      endDate: formEndDate,
      status: initialStatus,
      createdByRole: user?.role || 'client',
      notes: formNotes,
      confirmedAt: !isClientRole ? new Date().toISOString() : undefined,
      confirmedBy: !isClientRole ? (user?.fullname || 'Bailleur') : undefined
    });

    setNewContractModalOpen(false);
    refreshContracts();
  };

  const handleConfirmContract = (contractId: string) => {
    const confirmerName = user?.fullname || (user?.role === 'agent' ? 'Agent Agréé' : 'Bailleur');
    confirmContract(contractId, confirmerName);
    refreshContracts();
  };

  const handleOpenRenewModal = (contract: RentalContract) => {
    setRenewModalContract(contract);
    const d = new Date(contract.endDate);
    d.setMonth(d.getMonth() + 6);
    setRenewEndDate(d.toISOString().split('T')[0]);
    setRenewRentAmount(contract.rentAmountUSD);
  };

  const handleRenewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewModalContract || !renewEndDate) return;
    const requesterName = user?.fullname || 'Demandeur';
    requestRenewal(renewModalContract.id, renewEndDate, renewRentAmount ? Number(renewRentAmount) : undefined, requesterName);
    setRenewModalContract(null);
    refreshContracts();
  };

  const handleAcceptRenewal = (contractId: string) => {
    const confirmerName = user?.fullname || 'Bailleur';
    acceptRenewal(contractId, confirmerName);
    refreshContracts();
  };

  const handleRejectRenewal = (contractId: string) => {
    if (window.confirm('Refuser cette demande de renouvellement ?')) {
      rejectRenewal(contractId);
      refreshContracts();
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDelete = (contractId: string) => {
    deleteContract(contractId);
    setDeleteConfirmId(null);
    refreshContracts();
    showToast('Le contrat de location a été supprimé avec succès.');
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById('printable-lease-certificate');
    if (!element) return;

    try {
      setIsGeneratingPdf(true);
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const margin = 12;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
      
      const cleanTitle = (certData?.propertyTitle || 'Bukavu').replace(/[^a-zA-Z0-9]/g, '_');
      const refId = certificateModalContract?.id ? certificateModalContract.id.slice(-6) : Date.now().toString().slice(-6);
      pdf.save(`Contrat_Bail_NyumbaLink_${cleanTitle}_${refId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF document:', error);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const admiredProperties = properties.filter((p) => favoriteIds.includes(p.id));
  const suggestedProperties = admiredProperties.length > 0 ? admiredProperties : properties.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 font-sans text-gray-900 dark:text-gray-100 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-gray-900 text-white text-xs font-bold rounded-2xl shadow-xl border border-white/10 flex items-center space-x-2 animate-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Contrats de Location
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestion sécurisée, formalisation de bail et attestations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (properties.length > 0) {
              handlePropertySelectionChange(properties[0].id);
            }
            setNewContractModalOpen(true);
          }}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-2xl text-xs font-bold transition shadow-xs hover:shadow-md cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nouveau Contrat de Bail</span>
        </button>
      </div>

      {/* 4 HIGHLY INTERACTIVE STATS FILTER CARDS - ALL USING HARMONIOUS APP PRIMARY COLOR #FF385C */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Total Contrats */}
        <button
          type="button"
          onClick={() => setActiveFilter('tous')}
          className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl text-left transition-all duration-150 cursor-pointer border ${
            activeFilter === 'tous'
              ? 'bg-[#FF385C] text-white border-[#FF385C] shadow-md ring-2 ring-[#FF385C]/30 scale-[1.01]'
              : 'bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-white border-gray-200 dark:border-white/10 hover:border-[#FF385C]/50 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${activeFilter === 'tous' ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>
              Total Contrats
            </span>
            <FileText className={`w-4 h-4 ${activeFilter === 'tous' ? 'text-white' : 'text-[#FF385C]'}`} />
          </div>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight mt-2">
            {totalCount}
          </p>
        </button>

        {/* 2. Baux Actifs */}
        <button
          type="button"
          onClick={() => setActiveFilter('actifs')}
          className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl text-left transition-all duration-150 cursor-pointer border ${
            activeFilter === 'actifs'
              ? 'bg-[#FF385C] text-white border-[#FF385C] shadow-md ring-2 ring-[#FF385C]/30 scale-[1.01]'
              : 'bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-white border-gray-200 dark:border-white/10 hover:border-[#FF385C]/50 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${activeFilter === 'actifs' ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>
              Baux Actifs
            </span>
            <CheckCircle2 className={`w-4 h-4 ${activeFilter === 'actifs' ? 'text-white' : 'text-[#FF385C]'}`} />
          </div>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight mt-2">
            {activeCount}
          </p>
        </button>

        {/* 3. Échéance <= 30 jours */}
        <button
          type="button"
          onClick={() => setActiveFilter('proches')}
          className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl text-left transition-all duration-150 cursor-pointer border ${
            activeFilter === 'proches'
              ? 'bg-[#FF385C] text-white border-[#FF385C] shadow-md ring-2 ring-[#FF385C]/30 scale-[1.01]'
              : 'bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-white border-gray-200 dark:border-white/10 hover:border-[#FF385C]/50 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${activeFilter === 'proches' ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>
              Échéance &le; 30j
            </span>
            <Clock className={`w-4 h-4 ${activeFilter === 'proches' ? 'text-white' : 'text-[#FF385C]'}`} />
          </div>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight mt-2">
            {expiringSoonCount}
          </p>
        </button>

        {/* 4. Délais Terminés */}
        <button
          type="button"
          onClick={() => setActiveFilter('termines')}
          className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl text-left transition-all duration-150 cursor-pointer border ${
            activeFilter === 'termines'
              ? 'bg-[#FF385C] text-white border-[#FF385C] shadow-md ring-2 ring-[#FF385C]/30 scale-[1.01]'
              : 'bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-white border-gray-200 dark:border-white/10 hover:border-[#FF385C]/50 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${activeFilter === 'termines' ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>
              Délais Terminés
            </span>
            <RefreshCw className={`w-4 h-4 ${activeFilter === 'termines' ? 'text-white' : 'text-[#FF385C]'}`} />
          </div>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight mt-2">
            {expiredCount}
          </p>
        </button>
      </div>

      {/* CONTRACTS LIST OR CLEAN RECOMMENDATIONS */}
      {filteredContracts.length === 0 ? (
        <div className="space-y-6">
          <div className="text-center py-12 bg-white dark:bg-[#1c1c1c] rounded-3xl border border-gray-200 dark:border-white/10 p-8 space-y-3 shadow-xs">
            <div className="w-14 h-14 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-[#FF385C] mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Aucun contrat dans cette catégorie
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
              Dès que vous engagez un bail avec un propriétaire ou un locataire, vos fiches et délais apparaissent ici.
            </p>
            <button
              type="button"
              onClick={() => setNewContractModalOpen(true)}
              className="mt-2 inline-flex items-center space-x-2 px-5 py-2.5 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-2xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Créer un Contrat de Location</span>
            </button>
          </div>

          {/* Suggestions */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4 text-[#FF385C]" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Biens recommandés pour établir un bail
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {suggestedProperties.map((prop) => (
                <div
                  key={`suggest-${prop.id}`}
                  className="bg-white dark:bg-[#1c1c1c] rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-white/10 p-4 flex flex-col justify-between space-y-3 shadow-xs"
                >
                  <div className="flex space-x-3">
                    <img
                      src={prop.images[0]}
                      alt={prop.title}
                      className="w-16 h-16 rounded-2xl object-cover shrink-0"
                    />
                    <div className="overflow-hidden">
                      <span className="text-[10px] font-bold text-[#FF385C] uppercase block">
                        {prop.neighborhood} • ${prop.price}/mois
                      </span>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate mt-0.5">
                        {prop.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 truncate">
                        Bailleur : {prop.ownerName}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInitiateForAdmiredProperty(prop)}
                    className="w-full py-2.5 bg-gray-100 dark:bg-white/5 hover:bg-[#FF385C] hover:text-white text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Initier le bail pour ce bien
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredContracts.map((contract) => {
            const status = getContractStatusDetails(contract);
            const isTenant = user && (contract.tenantId === user.uid || (user.email && contract.tenantEmail.toLowerCase() === user.email.toLowerCase()));
            const isLandlord = user && (contract.landlordId === user.uid || (user.email && contract.landlordEmail.toLowerCase() === user.email.toLowerCase()));
            const isAdmin = user?.role === 'admin';
            const canConfirm = (isLandlord || isAdmin || user?.role === 'agent') && contract.status === 'en_attente_confirmation';
            const hasRenewalProposal = Boolean(contract.renewalProposal);

            return (
              <div
                key={contract.id}
                className={`bg-white dark:bg-[#1c1c1c] rounded-2xl sm:rounded-3xl border transition-all shadow-xs p-5 flex flex-col justify-between space-y-4 ${
                  status.isExpired
                    ? 'border-rose-300 dark:border-rose-900/60'
                    : status.isExpiringSoon
                    ? 'border-[#FF385C]/30'
                    : 'border-gray-200 dark:border-white/10'
                }`}
              >
                {/* Header: Title + Status Badge */}
                <div>
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start space-x-3 min-w-0 flex-1">
                      {contract.propertyImage ? (
                        <img
                          src={contract.propertyImage}
                          alt={contract.propertyTitle}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border border-gray-100 dark:border-white/10 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[#FF385C] shrink-0">
                          <Building2 className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              isTenant
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200'
                                : isLandlord
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {isTenant ? 'Locataire' : isLandlord ? 'Bailleur' : 'Contrat'}
                          </span>
                          <span className="text-[10px] text-gray-500 capitalize">
                            {contract.propertyCategory} • {contract.propertyCommune}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-1 leading-snug truncate">
                          {contract.propertyTitle}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {contract.propertyAddress} ({contract.propertyNeighborhood})
                        </p>
                      </div>
                    </div>

                    {/* Compact Badge Strictly Contained in the Card */}
                    <div className="shrink-0">
                      {contract.status === 'en_attente_confirmation' ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 whitespace-nowrap">
                          En attente signature
                        </span>
                      ) : contract.status === 'demande_renouvellement' ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 whitespace-nowrap">
                          Prolongation demandée
                        </span>
                      ) : status.isExpired ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 whitespace-nowrap">
                          Délai Terminé
                        </span>
                      ) : status.isExpiringSoon ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#FF385C]/15 text-[#FF385C] whitespace-nowrap">
                          Échéance &le; 30j ({status.daysRemaining}j)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 whitespace-nowrap">
                          Actif ({status.daysRemaining}j)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Lease Financial & Dates Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-3 p-3 rounded-2xl bg-gray-50 dark:bg-[#161616] text-xs border border-gray-100 dark:border-white/5">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold">Loyer Convenance</p>
                      <p className="font-bold text-gray-900 dark:text-white mt-0.5">
                        {contract.rentAmountUSD} $ / mois
                      </p>
                      {contract.depositAmountUSD && (
                        <p className="text-[10px] text-gray-500">Caution: {contract.depositAmountUSD} $</p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold">Période du Bail</p>
                      <p className="font-bold text-gray-900 dark:text-white mt-0.5">
                        Du {new Date(contract.startDate).toLocaleDateString('fr-FR')}
                      </p>
                      <p className={`text-[11px] font-bold ${status.isExpired ? 'text-rose-600 dark:text-rose-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        Au {new Date(contract.endDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  {/* Pending Confirmation Banner */}
                  {canConfirm && (
                    <div className="mt-3 p-3 bg-[#FF385C]/10 dark:bg-[#FF385C]/20 border border-[#FF385C]/30 rounded-2xl space-y-2">
                      <div className="flex items-center space-x-2 text-xs font-bold text-[#FF385C] dark:text-[#FF6584]">
                        <ShieldCheck className="w-4 h-4 text-[#FF385C] shrink-0" />
                        <span>Contrat soumis par le locataire — Signature requise</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleConfirmContract(contract.id)}
                        className="w-full py-2 bg-[#FF385C] hover:bg-[#e00b41] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirmer & Signer le Bail</span>
                      </button>
                    </div>
                  )}

                  {/* Renewal Proposal Banner */}
                  {hasRenewalProposal && (isLandlord || isAdmin || user?.role === 'agent') && (
                    <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl space-y-2">
                      <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                        Demande de prolongation jusqu'au {new Date(contract.renewalProposal!.requestedEndDate).toLocaleDateString('fr-FR')}
                      </p>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleAcceptRenewal(contract.id)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
                        >
                          Accepter
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectRenewal(contract.id)}
                          className="px-3 py-2 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 text-gray-800 dark:text-white text-xs font-bold rounded-xl transition"
                        >
                          Refuser
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Parties Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
                    <div className="p-2.5 rounded-2xl border border-gray-100 dark:border-white/5">
                      <span className="text-[10px] font-bold text-gray-500 block">Locataire</span>
                      <p className="font-bold text-gray-900 dark:text-white truncate">{contract.tenantName}</p>
                      <p className="text-[11px] text-gray-500 truncate">{contract.tenantPhone}</p>
                    </div>
                    <div className="p-2.5 rounded-2xl border border-gray-100 dark:border-white/5">
                      <span className="text-[10px] font-bold text-gray-500 block">Bailleur / Propriétaire</span>
                      <p className="font-bold text-gray-900 dark:text-white truncate">{contract.landlordName}</p>
                      <p className="text-[11px] text-gray-500 truncate">{contract.landlordPhone}</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <a
                      href={`https://wa.me/${(isTenant ? contract.landlordPhone : contract.tenantPhone).replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:opacity-80 transition cursor-pointer"
                      title="Contacter sur WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleOpenCertificate(contract)}
                      className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:text-gray-900 text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                      title="Fiche de Bail & Reçu"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Fiche & Attestation</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {status.isExpired ? (
                      <button
                        type="button"
                        onClick={() => handleOpenRenewModal(contract)}
                        className="px-3 py-2 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Renouveler</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenRenewModal(contract)}
                        className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-[#FF385C] text-xs font-bold transition cursor-pointer"
                      >
                        Prolonger
                      </button>
                    )}

                    {/* Delete button available for Admin or associated parties */}
                    {(isAdmin || isLandlord || isTenant || user?.role === 'agent' || user?.role === 'bailleur') && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(contract.id)}
                        className="p-2 text-gray-400 hover:text-rose-600 transition cursor-pointer"
                        title="Supprimer ce contrat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: NEW LEASE CONTRACT */}
      {newContractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 dark:border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-2.5 pb-4 border-b border-gray-100 dark:border-white/10">
              <div className="w-8 h-8 rounded-xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold tracking-tight text-gray-900 dark:text-white">
                Établir un Nouveau Contrat de Bail
              </h3>
            </div>

            <form onSubmit={handleCreateContractSubmit} className="space-y-4 pt-4 text-xs text-gray-800 dark:text-gray-200">
              {/* Mode Selection */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase">1. Choix du Bien</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPropertySelectionMode('catalog')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      propertySelectionMode === 'catalog'
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-gray-900 dark:border-white'
                        : 'bg-gray-50 dark:bg-[#161616] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10'
                    }`}
                  >
                    Bien du Catalogue
                  </button>
                  <button
                    type="button"
                    onClick={() => setPropertySelectionMode('custom')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      propertySelectionMode === 'custom'
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-gray-900 dark:border-white'
                        : 'bg-gray-50 dark:bg-[#161616] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10'
                    }`}
                  >
                    Bien Personnalisé
                  </button>
                </div>
              </div>

              {propertySelectionMode === 'catalog' ? (
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Sélectionner l'annonce</label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => handlePropertySelectionChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161616] font-bold text-xs"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} — {p.neighborhood} (${p.price}/mois)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2.5 p-3 rounded-2xl bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-white/10">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Titre ou désignation du bien</label>
                    <input
                      type="text"
                      required
                      value={customPropertyTitle}
                      onChange={(e) => setCustomPropertyTitle(e.target.value)}
                      placeholder="Ex: Appartement 3 chambres Nguba"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#202020] text-xs font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Commune</label>
                      <select
                        value={customPropertyCommune}
                        onChange={(e) => setCustomPropertyCommune(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#202020] text-xs"
                      >
                        <option value="Ibanda">Ibanda</option>
                        <option value="Kadutu">Kadutu</option>
                        <option value="Bagira">Bagira</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Quartier</label>
                      <input
                        type="text"
                        value={customPropertyNeighborhood}
                        onChange={(e) => setCustomPropertyNeighborhood(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#202020] text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Adresse précise</label>
                    <input
                      type="text"
                      value={customPropertyAddress}
                      onChange={(e) => setCustomPropertyAddress(e.target.value)}
                      placeholder="Ex: Av. Patrice Emery Lumumba, N° 12"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#202020] text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Tenant Details */}
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-white/10 space-y-2.5">
                <span className="text-[11px] font-bold text-gray-500 uppercase block">2. Informations Locataire</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Nom complet</label>
                    <input
                      type="text"
                      required
                      value={formTenantName}
                      onChange={(e) => setFormTenantName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#202020] text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">N° WhatsApp</label>
                    <input
                      type="text"
                      required
                      value={formTenantPhone}
                      onChange={(e) => setFormTenantPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#202020] text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Landlord Details */}
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-white/10 space-y-2.5">
                <span className="text-[11px] font-bold text-gray-500 uppercase block">3. Informations Bailleur / Propriétaire</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Nom du Bailleur</label>
                    <input
                      type="text"
                      required
                      value={formLandlordName}
                      onChange={(e) => setFormLandlordName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#202020] text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Téléphone WhatsApp Bailleur</label>
                    <input
                      type="text"
                      required
                      value={formLandlordPhone}
                      onChange={(e) => setFormLandlordPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#202020] text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Terms & Dates */}
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-white/10 space-y-2.5">
                <span className="text-[11px] font-bold text-gray-500 uppercase block">4. Conditions Financières & Période</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Loyer Mensuel ($)</label>
                    <input
                      type="number"
                      required
                      value={formRentUSD}
                      onChange={(e) => setFormRentUSD(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#202020] text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Garantie Locative / Caution ($)</label>
                    <input
                      type="number"
                      required
                      value={formDepositUSD}
                      onChange={(e) => setFormDepositUSD(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#202020] text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Date de début</label>
                    <input
                      type="date"
                      required
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#202020] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Date d'échéance</label>
                    <input
                      type="date"
                      required
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#202020] text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setNewContractModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-2xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Créer & Enregistrer le Contrat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RENEWAL REQUEST */}
      {renewModalContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-white/10">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-gray-100 dark:border-white/10">
              <RefreshCw className="w-5 h-5 text-[#FF385C]" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Prolongation / Renouvellement de Bail
              </h3>
            </div>

            <form onSubmit={handleRenewSubmit} className="space-y-4 pt-3 text-xs">
              <p className="text-gray-600 dark:text-gray-300">
                Bien : <strong>{renewModalContract.propertyTitle}</strong>
              </p>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Nouvelle date d'échéance souhaitée</label>
                <input
                  type="date"
                  required
                  value={renewEndDate}
                  onChange={(e) => setRenewEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161616] text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Loyer mensuel convenu ($ USD)</label>
                <input
                  type="number"
                  value={renewRentAmount}
                  onChange={(e) => setRenewRentAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161616] text-xs font-bold"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setRenewModalContract(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  Confirmer la Demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LEASE CERTIFICATE & ATTESTATION WITH EDITING & PRINT/PDF */}
      {certificateModalContract && certData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 dark:border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#FF385C]" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Fiche de Bail & Attestation de Location
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingCertificate(!isEditingCertificate)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-gray-800 dark:text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingCertificate ? 'Aperçu du document' : 'Modifier les détails'}</span>
              </button>
            </div>

            {/* Printable & Downloadable Document Container */}
            <div
              id="printable-lease-certificate"
              className="p-6 my-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white text-xs space-y-4 text-gray-900 shadow-xs print:border-none print:bg-white print:text-black print:p-0"
            >
              {/* Header with NyumbaLink Logo & Official Registration Info */}
              <div className="text-center pb-4 border-b border-gray-200 flex flex-col items-center">
                <div className="mb-2 flex items-center justify-center">
                  <BrandLogo size="md" showText={true} />
                </div>
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-900">
                  RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                </h4>
                <p className="text-[10px] text-gray-500 uppercase font-semibold">
                  PROVINCE DU SUD-KIVU • VILLE DE BUKAVU
                </p>
                <div className="inline-block mt-2 px-3 py-1 bg-[#FF385C]/10 rounded-full">
                  <p className="text-xs font-extrabold text-[#FF385C] uppercase tracking-wide">
                    ATTESTATION D'ENGAGEMENT LOCATIF & FICHE DE BAIL OFFICIELLE
                  </p>
                </div>
              </div>

              {isEditingCertificate ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Titre de la propriété</label>
                    <input
                      type="text"
                      value={certData.propertyTitle}
                      onChange={(e) => setCertData({ ...certData, propertyTitle: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold text-gray-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Nom du Locataire</label>
                      <input
                        type="text"
                        value={certData.tenantName}
                        onChange={(e) => setCertData({ ...certData, tenantName: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Téléphone Locataire</label>
                      <input
                        type="text"
                        value={certData.tenantPhone}
                        onChange={(e) => setCertData({ ...certData, tenantPhone: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Nom du Bailleur</label>
                      <input
                        type="text"
                        value={certData.landlordName}
                        onChange={(e) => setCertData({ ...certData, landlordName: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Téléphone Bailleur</label>
                      <input
                        type="text"
                        value={certData.landlordPhone}
                        onChange={(e) => setCertData({ ...certData, landlordPhone: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Loyer Mensuel (USD)</label>
                      <input
                        type="number"
                        value={certData.rentAmountUSD}
                        onChange={(e) => setCertData({ ...certData, rentAmountUSD: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Caution (USD)</label>
                      <input
                        type="number"
                        value={certData.depositAmountUSD}
                        onChange={(e) => setCertData({ ...certData, depositAmountUSD: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Date de début</label>
                      <input
                        type="date"
                        value={certData.startDate}
                        onChange={(e) => setCertData({ ...certData, startDate: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Date d'échéance</label>
                      <input
                        type="date"
                        value={certData.endDate}
                        onChange={(e) => setCertData({ ...certData, endDate: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Clauses & Notes</label>
                    <textarea
                      rows={2}
                      value={certData.specialClauses}
                      onChange={(e) => setCertData({ ...certData, specialClauses: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-900"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">Bien Loué</span>
                      <p className="font-bold text-gray-900">{certData.propertyTitle}</p>
                      <p className="text-[11px] text-gray-600">
                        {certData.propertyAddress}, {certData.propertyNeighborhood}, Ville de Bukavu
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">Conditions Financières</span>
                      <p className="font-bold text-gray-900">{certData.rentAmountUSD} USD / mois</p>
                      <p className="text-[11px] text-gray-600">Caution versée : {certData.depositAmountUSD} USD</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">Locataire</span>
                      <p className="font-bold text-gray-900">{certData.tenantName}</p>
                      <p className="text-[11px] text-gray-600">{certData.tenantPhone}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">Bailleur / Propriétaire</span>
                      <p className="font-bold text-gray-900">{certData.landlordName}</p>
                      <p className="text-[11px] text-gray-600">{certData.landlordPhone}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Délai de Validité du Bail</span>
                    <p className="font-bold text-[#FF385C]">
                      Du {new Date(certData.startDate).toLocaleDateString('fr-FR')} au {new Date(certData.endDate).toLocaleDateString('fr-FR')} (Préavis légal de 5 jours requis)
                    </p>
                  </div>

                  {certData.specialClauses && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">Clauses Particulières</span>
                      <p className="text-[11px] text-gray-600 italic">
                        "{certData.specialClauses}"
                      </p>
                    </div>
                  )}

                  {/* 3 DISTINCT SIGNATURE BOXES: LOCATAIRE, BAILLEUR/AGENT, ET NYUMBALINK */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-dashed border-gray-300 text-center">
                    {/* 1. Locataire */}
                    <div className="border border-gray-200 rounded-2xl p-3 bg-gray-50/70 flex flex-col justify-between min-h-[115px]">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-500">1. Signature Locataire</p>
                        <p className="text-xs font-bold text-gray-900 mt-1">{certData.tenantName}</p>
                        <p className="text-[9px] text-gray-400 italic">"Lu et approuvé, bon pour accord"</p>
                      </div>
                      <div className="pt-2 border-t border-gray-200 text-left">
                        <span className="text-[9px] text-gray-500 font-mono">Date : {new Date(certData.startDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>

                    {/* 2. Bailleur ou Agent */}
                    <div className="border border-gray-200 rounded-2xl p-3 bg-gray-50/70 flex flex-col justify-between min-h-[115px]">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-500">2. Bailleur ou Agent Agréé</p>
                        <p className="text-xs font-bold text-gray-900 mt-1">{certData.landlordName}</p>
                        <p className="text-[9px] text-gray-400 italic">"Lu et approuvé, engagement du bailleur"</p>
                      </div>
                      <div className="pt-2 border-t border-gray-200 text-left">
                        <span className="text-[9px] text-gray-500 font-mono">Date : {new Date(certData.startDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>

                    {/* 3. Pour NyumbaLink */}
                    <div className="border border-[#FF385C]/30 bg-[#FF385C]/5 rounded-2xl p-3 flex flex-col justify-between min-h-[115px]">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-[#FF385C]">3. Pour NyumbaLink</p>
                        <div className="mt-2 space-y-1 text-center">
                          <p className="text-xs font-bold text-gray-900 leading-tight">BARAKA SHAMAMBA Bénite</p>
                          <p className="text-xs font-bold text-gray-700 leading-tight">DAVID MAKINDU</p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-[#FF385C]/20 text-center">
                        <span className="text-[9px] font-mono text-[#FF385C] font-extrabold tracking-wider">CERTIFIÉ CONFORME</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls - Clean, without redundant print button */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setCertificateModalContract(null)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="button"
                disabled={isGeneratingPdf}
                onClick={handleDownloadPdf}
                className="px-5 py-2.5 bg-[#FF385C] hover:bg-[#E00B41] disabled:opacity-75 text-white rounded-2xl text-xs font-bold flex items-center space-x-2 cursor-pointer shadow-xs transition"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Génération du PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Télécharger en PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deletion Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 dark:border-white/10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900 dark:text-white">
                Supprimer ce contrat ?
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                Cette action supprimera définitivement le contrat de location de votre liste.
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractsView;
