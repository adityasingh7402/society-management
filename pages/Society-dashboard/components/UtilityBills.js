import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PreloaderSociety from '../../components/PreloaderSociety';
import { FileText, Plus, Edit2, Archive, Check, X, AlertCircle, Users, Home, Building, User, Receipt } from 'lucide-react';
import { usePermissions } from "../../../components/PermissionsContext";
import AccessDenied from "../widget/societyComponents/accessRestricted";

// Import the new components
import { 
  SelectionPopup, 
  BlockSelector, 
  FloorSelector, 
  BillDetailsPopup,
  PaymentEntryPopup 
} from '../../../components/Society/widgets';

export default function UtilityBills() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [billHeads, setBillHeads] = useState([]);
  const [residents, setResidents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedBillHead, setSelectedBillHead] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [structuredResidents, setStructuredResidents] = useState({});
  const [openBlocks, setOpenBlocks] = useState({});
  const [openFloors, setOpenFloors] = useState({});
  const [openFlats, setOpenFlats] = useState({});
  const [selectedResident, setSelectedResident] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedFlat, setSelectedFlat] = useState('');
  const [structureType, setStructureType] = useState('Block');
  const [billCalculation, setBillCalculation] = useState({
    baseAmount: 0,
    gstDetails: {
      cgst: 0,
      sgst: 0,
      igst: 0,
      total: 0
    },
    lateFees: 0,
    totalAmount: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    billHeadId: '',
    fromDate: '',
    toDate: '',
    subCategory: '' // Add subCategory filter
  });
  const [showCalculation, setShowCalculation] = useState(false);
  
  // Add new state for bill generation options
  const [showBillOptions, setShowBillOptions] = useState(false);
  const [billGenerationType, setBillGenerationType] = useState('individual'); // 'individual', 'block', 'floor', 'bulk'
  const [selectedBlockForBulk, setSelectedBlockForBulk] = useState('');
  const [selectedFloorForBulk, setSelectedFloorForBulk] = useState('');
  const [bulkResidents, setBulkResidents] = useState([]);
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  // Add state for bill details modal and payment modal
  const [selectedBillForView, setSelectedBillForView] = useState(null);
  const [showBillDetailsModal, setShowBillDetailsModal] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    flatNumber: '',
    blockName: '',
    floorNumber: '',
    residentId: '',
    ownerName: '',
    ownerMobile: '',
    ownerEmail: '',
    billHeadId: '',
    unitUsage: '',
    periodType: 'Monthly',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Summary state
  const [summary, setSummary] = useState({
    totalBills: 0,
    totalAmount: 0,
    pendingAmount: 0,
    paidAmount: 0,
    overdueAmount: 0,
    totalGstCollected: 0
  });

  // Add new state for additional charges
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [availableCharges, setAvailableCharges] = useState([]);

  // Add state for selected additional charge
  const [selectedAdditionalCharge, setSelectedAdditionalCharge] = useState(null);

  // Toggle functions for expanding/collapsing sections
  const toggleBlock = (blockName) => {
    setOpenBlocks(prev => ({ ...prev, [blockName]: !prev[blockName] }));
  };

  const toggleFloor = (floorKey) => {
    setOpenFloors(prev => ({ ...prev, [floorKey]: !prev[floorKey] }));
  };

  const toggleFlat = (flatKey) => {
    setOpenFlats(prev => ({ ...prev, [flatKey]: !prev[flatKey] }));
  };

  // Select resident function
  const selectResident = (resident, block, floor, flat) => {
    setSelectedResident(resident);
    setSelectedBlock(block);
    setSelectedFloor(floor);
    setSelectedFlat(flat);
    setFormData(prev => ({
      ...prev,
      residentId: resident._id,
      flatNumber: flat,
      blockName: block,
      floorNumber: floor,
      ownerName: resident.name,
      ownerMobile: resident.phone,
      ownerEmail: resident.email
    }));
  };

  // Structure residents data
  const structureResidentsData = (residentsArray) => {
    console.log('Structuring residents:', residentsArray);
    const structured = {};
    
    // Filter out residents without flatDetails
    const residentsWithFlats = residentsArray.filter(resident => 
      resident.flatDetails && resident.flatDetails.blockName && resident.flatDetails.flatNumber
    );
    
    residentsWithFlats.forEach(resident => {
      // Add null checks and handle both floorNumber and floorIndex
      const flatDetails = resident.flatDetails || {};
      const blockName = flatDetails.blockName || 'Unassigned';
      const floorNumber = flatDetails.floorIndex?.toString() || flatDetails.floorNumber?.toString() || 'Ground';
      const flatNumber = flatDetails.flatNumber || 'Unassigned';

      console.log('Processing resident:', resident.name, { blockName, floorNumber, flatNumber });

      // Create the structure if it doesn't exist
      if (!structured[blockName]) {
        structured[blockName] = {};
      }
      if (!structured[blockName][floorNumber]) {
        structured[blockName][floorNumber] = {};
      }
      if (!structured[blockName][floorNumber][flatNumber]) {
        structured[blockName][floorNumber][flatNumber] = [];
      }

      // Add the resident to the structure
      structured[blockName][floorNumber][flatNumber].push({
        _id: resident._id,
        name: resident.name,
        phone: resident.phone,
        email: resident.email,
        flatDetails: resident.flatDetails
      });
    });
    console.log('Structured data:', structured);
    return structured;
  };

  // Fetch residents
  const fetchResidents = async () => {
    try {
      const token = localStorage.getItem('Society');
      console.log('Token:', token ? 'Found' : 'Not found');

      if (!token) {
        router.push('/societyLogin');
        return;
      }

      // First get society details
      console.log('Fetching society details...');
      const societyResponse = await fetch('/api/Society-Api/get-society-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!societyResponse.ok) {
        throw new Error(`Failed to fetch society details: ${societyResponse.status}`);
      }

      const societyData = await societyResponse.json();
      console.log('Society Data:', societyData);

      if (!societyData.societyId) {
        throw new Error('Society ID not found in response');
      }

      // Then fetch residents with society ID
      console.log('Fetching residents with societyId:', societyData.societyId);
      const response = await fetch(`/api/Resident-Api/get-society-residents?societyId=${societyData.societyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch residents: ${response.status}`);
      }

      const result = await response.json();
      console.log('Residents API Response:', result);

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch residents');
      }

      // API returns { success: true, residents: [...] }
      const residentsArray = result.residents || [];
      console.log('Residents Array:', residentsArray);

      if (!Array.isArray(residentsArray)) {
        throw new Error('Residents data is not an array');
      }

      // Structure the residents data
      const structured = structureResidentsData(residentsArray);
      console.log('Final Structured Data:', structured);

      setStructuredResidents(structured);
      setResidents(residentsArray);
    } catch (error) {
      console.error('Error in fetchResidents:', error);
      setNotificationWithTimeout(error.message || 'Failed to fetch residents', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch bills
  const fetchBills = async () => {
    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      // First get society details
      const societyResponse = await fetch('/api/Society-Api/get-society-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!societyResponse.ok) {
        throw new Error(`Failed to fetch society details: ${societyResponse.status}`);
      }

      const societyData = await societyResponse.json();

      // Build query string with all filters
      const queryParams = new URLSearchParams({
        societyId: societyData._id,
        ...(filters.status && { status: filters.status }),
        ...(filters.billHeadId && { billHeadId: filters.billHeadId }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
        ...(filters.subCategory && { subCategory: filters.subCategory })
      });

      const response = await fetch(`/api/UtilityBill-Api/getBills?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bills: ${response.status}`);
      }

      const data = await response.json();

      setBills(data.bills || []);
      
      // Calculate summary from bills data
      const summaryData = {
        totalBills: data.bills.length,
        totalAmount: 0,
        pendingAmount: 0,
        paidAmount: 0,
        overdueAmount: 0,
        totalGstCollected: 0
      };

      data.bills.forEach(bill => {
        // Total Amount
        summaryData.totalAmount += bill.totalAmount || 0;

        // Paid Amount
        summaryData.paidAmount += bill.paidAmount || 0;

        // Pending Amount
        summaryData.pendingAmount += bill.remainingAmount || 0;

        // Overdue Amount (only count remaining amount if bill is overdue)
        if (bill.status === 'Overdue') {
          summaryData.overdueAmount += bill.remainingAmount || 0;
        }

        // GST Amount
        if (bill.gstDetails?.isGSTApplicable) {
          summaryData.totalGstCollected += (
            (bill.gstDetails.cgstAmount || 0) +
            (bill.gstDetails.sgstAmount || 0) +
            (bill.gstDetails.igstAmount || 0)
          );
        }
      });

      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching bills:', error);
      setNotificationWithTimeout('Failed to fetch bills', 'error');
    }
  };

  // Add subcategories for Utility bills
  const utilitySubCategories = ['Water', 'Electricity', 'Gas', 'Internet', 'Cable', 'Telephone', 'Other'];

  // Update fetchBillHeads to ensure it retrieves all necessary GST and late fee configuration data
  const fetchBillHeads = async () => {
    try {
      const token = localStorage.getItem('Society');
      console.log('Fetching bill heads...');

      if (!token) {
        router.push('/societyLogin');
        return;
      }

      // First get society details
      const societyResponse = await fetch('/api/Society-Api/get-society-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!societyResponse.ok) {
        throw new Error(`Failed to fetch society details: ${societyResponse.status}`);
      }

      const societyData = await societyResponse.json();
      console.log('Society Data for bill heads:', societyData);

      if (!societyData.societyId) {
        throw new Error('Society ID not found in response');
      }

      // Then fetch bill heads with society ID
      const response = await fetch(`/api/BillHead-Api/get-bill-heads?societyId=${societyData.societyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bill heads: ${response.status}`);
      }

      const result = await response.json();
      console.log('Bill Heads API Response:', result);

      // Filter only utility bill heads and ensure they have complete GST and late payment configs
      const utilityBillHeads = result.data.filter(bh => bh.category === 'Utility').map(bh => ({
        ...bh,
        gstConfig: bh.gstConfig || {
          isGSTApplicable: false,
          cgstPercentage: 0,
          sgstPercentage: 0,
          igstPercentage: 0
        },
        latePaymentConfig: bh.latePaymentConfig || {
          isLatePaymentChargeApplicable: false,
          gracePeriodDays: 0,
          chargeType: 'Fixed',
          chargeValue: 0,
          compoundingFrequency: 'Monthly'
        }
      }));
      
      console.log('Utility Bill Heads with complete configs:', utilityBillHeads);

      setBillHeads(utilityBillHeads);
    } catch (error) {
      console.error('Error in fetchBillHeads:', error);
      setNotificationWithTimeout(error.message || 'Failed to fetch bill heads', 'error');
    }
  };

  // Update handleBillHeadChange to properly set GST and late fee details
  const handlePeriodTypeChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      periodType: value
    }));
  };

  const handleBillHeadChange = (e) => {
    const billHeadId = e.target.value;
    const billHead = billHeads.find(bh => bh._id === billHeadId);
    
    if (!billHead) {
      setSelectedBillHead(null);
      return;
    }
    
    console.log('Selected bill head:', billHead);
    setSelectedBillHead(billHead);
    
    // Reset calculation
    setShowCalculation(false);
    
    // Update form data with bill head info
    setFormData(prev => ({
      ...prev,
      billHeadId,
      unitUsage: billHead.calculationType === 'Fixed' ? '1' : '',
      baseAmount: billHead.calculationType === 'Fixed' ? billHead.fixedAmount : 0
    }));
    
    // If it's a fixed amount bill head, automatically calculate the amount
    if (billHead.calculationType === 'Fixed') {
      setTimeout(() => calculateAmount(), 100);
    }
  };

  // Update calculateAmount function
  const calculateAmount = () => {
    if (!selectedBillHead) {
      setNotificationWithTimeout('Please select bill head', 'error');
      return;
    }
    
    if (selectedBillHead.calculationType !== 'Fixed' && !formData.unitUsage) {
      setNotificationWithTimeout('Please enter units used', 'error');
      return;
    }

    let baseAmount = 0;
    switch (selectedBillHead.calculationType) {
      case 'Fixed':
        baseAmount = selectedBillHead.fixedAmount;
        break;
      case 'PerUnit':
        baseAmount = parseFloat(formData.unitUsage) * selectedBillHead.perUnitRate;
        break;
      case 'Formula':
        try {
          const formula = selectedBillHead.formula
            .replace(/\$\{unitUsage\}/g, formData.unitUsage)
            .replace(/\$\{rate\}/g, selectedBillHead.perUnitRate);
          baseAmount = eval(formula);
        } catch (error) {
          console.error('Formula evaluation error:', error);
          setNotificationWithTimeout('Error calculating formula: ' + error.message, 'error');
          baseAmount = 0;
        }
        break;
      default:
        baseAmount = 0;
    }

    // Calculate GST
    let gstDetails = {
      isGSTApplicable: selectedBillHead.gstConfig?.isGSTApplicable || false,
      cgstPercentage: selectedBillHead.gstConfig?.cgstPercentage || 0,
      sgstPercentage: selectedBillHead.gstConfig?.sgstPercentage || 0,
      igstPercentage: selectedBillHead.gstConfig?.igstPercentage || 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      total: 0
    };

    if (gstDetails.isGSTApplicable) {
      gstDetails.cgstAmount = (baseAmount * gstDetails.cgstPercentage) / 100;
      gstDetails.sgstAmount = (baseAmount * gstDetails.sgstPercentage) / 100;
      gstDetails.igstAmount = (baseAmount * gstDetails.igstPercentage) / 100;
      gstDetails.total = gstDetails.cgstAmount + gstDetails.sgstAmount + gstDetails.igstAmount;
    }

    // Calculate total amount including additional charges
    const additionalChargesTotal = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const totalAmount = baseAmount + gstDetails.total + additionalChargesTotal;

    console.log('Calculation details:', {
      baseAmount,
      gstDetails,
      additionalCharges,
      additionalChargesTotal,
      totalAmount
    });

    setBillCalculation({
      baseAmount,
      gstDetails,
      additionalChargesTotal,
      totalAmount
    });

    setShowCalculation(true);
  };

  // Update the renderUnitsInput function
  const renderUnitsInput = () => {
    if (!selectedBillHead) return null;

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          {selectedBillHead.calculationType === 'Fixed' ? 'Fixed Amount' :
            selectedBillHead.calculationType === 'PerUnit' ? 'Units Used' :
              'Units Used (for formula calculation)'}
        </label>
        <div className="mt-1">
          {selectedBillHead.calculationType === 'Fixed' ? (
            <input
              type="text"
              className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={selectedBillHead.fixedAmount}
              disabled
            />
          ) : (
              <input
                type="number"
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.unitUsage}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    unitUsage: e.target.value
                  }));
                  setShowCalculation(false);
                }}
                required
              />
          )}
        </div>
        {selectedBillHead.calculationType === 'PerUnit' && (
          <p className="mt-1 text-sm text-gray-500">
            Rate per unit: ₹{selectedBillHead.perUnitRate}
          </p>
        )}
        {selectedBillHead.calculationType === 'Formula' && (
          <p className="mt-1 text-sm text-gray-500">
            Formula: {selectedBillHead.formula}
          </p>
        )}
      </div>
    );
  };

  // Update the renderAdditionalCharges function
  const renderAdditionalCharges = () => (
    <div className="mb-4">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Additional Charges</label>
        <select
          id="additionalChargeSelect"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          value={selectedAdditionalCharge?._id || ''}
          onChange={handleAdditionalChargeSelect}
        >
          <option value="">Select Additional Charge</option>
          {availableCharges.map((bh) => (
            <option key={bh._id} value={bh._id}>
              {bh.name} ({bh.code}) - {bh.calculationType}
            </option>
          ))}
        </select>
      </div>

      {selectedAdditionalCharge && selectedAdditionalCharge.calculationType !== 'Fixed' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            {selectedAdditionalCharge.calculationType === 'PerUnit' ? 'Units Used' : 'Units (for formula calculation)'}
          </label>
          <div className="mt-1">
            <input
              id="additionalChargeUnits"
              type="number"
              className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
              min="0"
              step="0.01"
              required
            />
          </div>
          {selectedAdditionalCharge.calculationType === 'PerUnit' && (
            <p className="mt-1 text-sm text-gray-500">
              Rate per unit: ₹{selectedAdditionalCharge.perUnitRate}
            </p>
          )}
          {selectedAdditionalCharge.calculationType === 'Formula' && (
            <p className="mt-1 text-sm text-gray-500">
              Formula: {selectedAdditionalCharge.formula}
            </p>
          )}
        </div>
      )}

      {/* Display added charges */}
      {additionalCharges.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-gray-900">Added Charges:</h4>
          {additionalCharges.map((charge, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">{charge.chargeType}</span>
                {charge.unitUsage && charge.calculationType !== 'Fixed' && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({charge.unitUsage} units)
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-medium">₹{charge.amount.toFixed(2)}</span>
                <button
                  type="button"
                  onClick={() => {
                    const newCharges = [...additionalCharges];
                    newCharges.splice(index, 1);
                    setAdditionalCharges(newCharges);
                    setShowCalculation(false);
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Update renderCalculateButton function
  const renderCalculateButton = () => {
    const shouldShowButton = selectedBillHead && (
      selectedBillHead.calculationType === 'Fixed' ||
      (formData.unitUsage && formData.unitUsage > 0)
    );

    const hasAdditionalChargeToCalculate = selectedAdditionalCharge && (
      selectedAdditionalCharge.calculationType === 'Fixed' ||
      (document.getElementById('additionalChargeUnits')?.value > 0)
    );

    if (!shouldShowButton && !hasAdditionalChargeToCalculate) return null;

    const handleCalculateClick = () => {
      // Calculate main bill amount first
      if (shouldShowButton) {
        calculateAmount();
      }

      // Only calculate additional charge if one is selected and hasn't been added yet
      if (hasAdditionalChargeToCalculate) {
        calculateAdditionalCharge();
      }
    };

    return (
      <div className="flex justify-end mb-4">
        <button
          type="button"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          onClick={handleCalculateClick}
        >
          Calculate
        </button>
      </div>
    );
  };

  // Update the renderBillDetails function
  const renderBillDetails = () => {
    if (!selectedBillHead || !showCalculation) return null;

    return (
      <div className="space-y-4 mt-4 border border-gray-200 rounded-md p-4 bg-gray-50">
        {/* Base Amount */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Base Amount:</span>
          <span className="font-medium">₹{billCalculation.baseAmount.toFixed(2)}</span>
        </div>

        {/* GST Details */}
        {selectedBillHead.gstConfig?.isGSTApplicable && (
          <div className="space-y-2 border-t pt-3">
            <div className="text-sm font-medium text-gray-700">GST Details:</div>
            {selectedBillHead.gstConfig.cgstPercentage > 0 && (
              <div className="flex justify-between items-center pl-4">
                <span className="text-gray-600">CGST ({selectedBillHead.gstConfig.cgstPercentage}%):</span>
                <span>₹{billCalculation.gstDetails.cgstAmount.toFixed(2)}</span>
              </div>
            )}
            {selectedBillHead.gstConfig.sgstPercentage > 0 && (
              <div className="flex justify-between items-center pl-4">
                <span className="text-gray-600">SGST ({selectedBillHead.gstConfig.sgstPercentage}%):</span>
                <span>₹{billCalculation.gstDetails.sgstAmount.toFixed(2)}</span>
              </div>
            )}
            {selectedBillHead.gstConfig.igstPercentage > 0 && (
              <div className="flex justify-between items-center pl-4">
                <span className="text-gray-600">IGST ({selectedBillHead.gstConfig.igstPercentage}%):</span>
                <span>₹{billCalculation.gstDetails.igstAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center font-medium border-t pt-2">
              <span>Total GST:</span>
              <span>₹{billCalculation.gstDetails.total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Additional Charges */}
        {additionalCharges.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <div className="text-sm font-medium text-gray-700">Additional Charges:</div>
            {additionalCharges.map((charge, index) => (
              <div key={index} className="flex justify-between items-center pl-4">
                <span className="text-gray-600">{charge.chargeType}:</span>
                <span>₹{charge.amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center font-medium border-t pt-2">
              <span>Total Additional Charges:</span>
              <span>₹{billCalculation.additionalChargesTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Total Amount */}
        <div className="flex justify-between items-center text-lg font-bold border-t pt-3">
          <span>Total Amount:</span>
          <span>₹{billCalculation.totalAmount.toFixed(2)}</span>
        </div>
      </div>
    );
  };

  // Add bulk generation handler
  const handleBulkGeneration = async () => {
    if (!selectedBillHead || !showCalculation) {
      setNotificationWithTimeout('Please select bill head and calculate amount first', 'error');
      return;
    }

    try {
      setIsGeneratingBulk(true);
      setBulkProgress(0);
      
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      // Get society details
      const societyResponse = await fetch('/api/Society-Api/get-society-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!societyResponse.ok) {
        throw new Error('Failed to fetch society details');
      }

      const societyData = await societyResponse.json();

      // Filter residents to only include those with flatDetails
      const residentsWithFlats = residents.filter(resident => 
        resident.flatDetails && resident.flatDetails.blockName && resident.flatDetails.flatNumber
      );
      
      // Get residents to process based on generation type
      let residentsToProcess = [];
      
      if (billGenerationType === 'bulk') {
        residentsToProcess = residentsWithFlats;
      } else if (billGenerationType === 'block') {
        residentsToProcess = residentsWithFlats.filter(r => 
          r.flatDetails?.blockName === selectedBlockForBulk
        );
      } else if (billGenerationType === 'floor') {
        residentsToProcess = residentsWithFlats.filter(r => 
          r.flatDetails?.blockName === selectedBlockForBulk && 
          (r.flatDetails?.floorIndex?.toString() === selectedFloorForBulk || 
           r.flatDetails?.floorNumber?.toString() === selectedFloorForBulk)
        );
      }
      
      if (residentsToProcess.length === 0) {
        throw new Error('No residents found to process');
      }
      
      // Log the form data before preparing bills
      console.log('Form data before bulk generation:', formData);
      
      // Prepare bills data for bulk generation
      const billsData = residentsToProcess.map(resident => {
        // Create the bill data object
        const billData = {
        societyId: societyData._id,
        billHeadId: formData.billHeadId,
        residentId: resident._id,
        flatNumber: resident.flatDetails?.flatNumber || '',
        blockName: resident.flatDetails?.blockName || '',
        floorNumber: resident.flatDetails?.floorIndex || resident.flatDetails?.floorNumber || 0,
        ownerName: resident.name || '',
        ownerMobile: resident.phone || '',
        ownerEmail: resident.email || '',
        unitUsage: formData.unitUsage,
          // Explicitly set periodType from form data
          periodType: formData.periodType,
        baseAmount: billCalculation.baseAmount,
        gstDetails: {
          isGSTApplicable: selectedBillHead.gstConfig?.isGSTApplicable || false,
          cgstAmount: billCalculation.gstDetails.cgstAmount,
          sgstAmount: billCalculation.gstDetails.sgstAmount,
          igstAmount: billCalculation.gstDetails.igstAmount,
          cgstPercentage: selectedBillHead.gstConfig?.cgstPercentage || 0,
          sgstPercentage: selectedBillHead.gstConfig?.sgstPercentage || 0,
          igstPercentage: selectedBillHead.gstConfig?.igstPercentage || 0
        },
        totalAmount: billCalculation.totalAmount,
        additionalCharges: additionalCharges.map(charge => ({
          billHeadId: charge.billHeadId || (availableCharges.find(bh => bh.name === charge.chargeType)?._id),
          chargeType: normalizeChargeType(charge.chargeType),
          amount: charge.amount,
          ledgerId: charge.ledgerId,
          unitUsage: charge.unitUsage,
          calculationType: charge.calculationType
        })),
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        billHeadDetails: {
          code: selectedBillHead.code,
          name: selectedBillHead.name
        }
        };

        // Log each bill's data for debugging
        console.log('Generated bill data for resident:', resident.name, {
          periodType: billData.periodType,
          flatNumber: billData.flatNumber
        });

        return billData;
      });
      
      // Process in batches of 20 bills at a time to avoid overwhelming the server
      const batchSize = 20;
      const totalBatches = Math.ceil(billsData.length / batchSize);
      let successCount = 0;
      let failedCount = 0;
      
      for (let i = 0; i < billsData.length; i += batchSize) {
        // Update progress
        const currentBatch = Math.floor(i / batchSize);
        const progress = Math.round((currentBatch / totalBatches) * 100);
        setBulkProgress(progress);
        
        // Get current batch
        const batchBills = billsData.slice(i, i + batchSize);
        
        // Call bulk generation API
                  try {
        const response = await fetch('/api/UtilityBill-Api/generateBulkBills', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
          body: JSON.stringify({ bills: batchBills })
          });

            const result = await response.json();

          if (!response.ok) {
              console.error('Batch error:', result.error);
              failedCount += batchBills.length;
              continue;  // Continue with next batch even if this one fails
        }
        
        successCount += result.results.success.length;
        failedCount += result.results.failed.length;

            // Log any failed bills for debugging
            if (result.results.failed.length > 0) {
              console.error('Failed bills in batch:', result.results.failed);
            }
          } catch (error) {
            console.error('Error processing batch:', error);
            failedCount += batchBills.length;
            continue;  // Continue with next batch even if this one fails
          }
      }
      
      // Final progress update
      setBulkProgress(100);
      
      // Show completion notification
      setNotificationWithTimeout(`Generated ${successCount} bills successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`, failedCount > 0 ? 'warning' : 'success');
      
      // Refresh bills list
      fetchBills();
      
      // Close form after short delay
      setTimeout(() => {
        setShowForm(false);
        setIsGeneratingBulk(false);
      }, 2000);
      
        } catch (error) {
      console.error('Error in bulk generation:', error);
      setNotificationWithTimeout(error.message || 'Failed to generate bills', 'error');
      setIsGeneratingBulk(false);
    }
  };
  
  // Update handleSubmit function
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!selectedBillHead || !showCalculation) {
      setNotificationWithTimeout('Please select bill head and calculate amount first', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      const societyResponse = await fetch('/api/Society-Api/get-society-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!societyResponse.ok) {
        throw new Error('Failed to fetch society details');
      }

      const societyData = await societyResponse.json();

      // Calculate total amount including additional charges
      const additionalChargesTotal = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
      const totalWithAdditional = billCalculation.totalAmount + additionalChargesTotal;

      // Add society _id and bill calculation details to form data
      console.log('Form Data before submission:', formData);  // Debug log
      const billData = {
        ...formData,
        societyId: societyData._id,
        baseAmount: billCalculation.baseAmount,
        periodType: formData.periodType || 'Monthly',  // Ensure periodType is set with default
        gstDetails: {
          isGSTApplicable: selectedBillHead.gstConfig?.isGSTApplicable || false,
          cgstAmount: billCalculation.gstDetails.cgstAmount,
          sgstAmount: billCalculation.gstDetails.sgstAmount,
          igstAmount: billCalculation.gstDetails.igstAmount,
          cgstPercentage: selectedBillHead.gstConfig?.cgstPercentage || 0,
          sgstPercentage: selectedBillHead.gstConfig?.sgstPercentage || 0,
          igstPercentage: selectedBillHead.gstConfig?.igstPercentage || 0
        },
        totalAmount: totalWithAdditional,
        additionalCharges: additionalCharges.map(charge => ({
          billHeadId: charge.billHeadId,
          chargeType: normalizeChargeType(charge.chargeType),
          amount: charge.amount,
          ledgerId: charge.ledgerId,
          unitUsage: charge.unitUsage,
          calculationType: charge.calculationType
        }))
      };

      console.log('Sending bill data:', billData); // Add this for debugging

      const response = await fetch('/api/UtilityBill-Api/generateBill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(billData)
      });

      const data = await response.json();

      if (response.ok) {
        setNotificationWithTimeout('Bill generated successfully', 'success');
        setShowForm(false);
        fetchBills();
      } else {
        setNotification({
          show: true,
          message: data.error || data.message || 'Failed to generate bill',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error generating bill:', error);
      setNotificationWithTimeout(error.message || 'Failed to generate bill', 'error');
    }
  };

  // Add useEffect to trigger initial data load
  useEffect(() => {
    console.log('Component mounted, fetching data...');
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchBillHeads(),
          fetchResidents(),
          fetchBills()
        ]);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchData();
  }, []);

  // Add function to fetch available additional charges
  const fetchAvailableCharges = async () => {
    try {
      const token = localStorage.getItem('Society');
      
      // First get society details
      const societyResponse = await fetch('/api/Society-Api/get-society-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!societyResponse.ok) {
        throw new Error('Failed to fetch society details');
      }

      const societyData = await societyResponse.json();
      
      // Then fetch bill heads with society ID
      const response = await fetch(`/api/BillHead-Api/get-bill-heads?societyId=${societyData.societyId}&category=Other`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter only active bill heads
        const activeCharges = (data.data || []).filter(bh => bh.status === 'Active');
        setAvailableCharges(activeCharges);
      } else {
        throw new Error('Failed to fetch bill heads');
      }
    } catch (error) {
      console.error('Error fetching additional charges:', error);
      setNotificationWithTimeout('Failed to fetch additional charges', 'error');
    }
  };

  // Add useEffect to fetch available charges
  useEffect(() => {
    fetchAvailableCharges();
  }, []);

  // Add function to handle additional charge selection
  const handleAddCharge = () => {
    setAdditionalCharges([...additionalCharges, {
      chargeType: '',
      amount: 0,
      ledgerId: '',
      description: ''
    }]);
  };

  // Add function to handle additional charge removal
  const handleRemoveCharge = (index) => {
    const newCharges = [...additionalCharges];
    newCharges.splice(index, 1);
    setAdditionalCharges(newCharges);
  };

  // Add function to update additional charge
  const handleChargeUpdate = (index, field, value) => {
    const newCharges = [...additionalCharges];
    newCharges[index][field] = value;
    
    // If chargeType is changed, update ledgerId
    if (field === 'chargeType') {
      const selectedCharge = availableCharges.find(bh => bh.name === value);
      if (selectedCharge?.accountingConfig?.incomeLedgerId) {
        newCharges[index].ledgerId = selectedCharge.accountingConfig.incomeLedgerId;
        newCharges[index].chargeType = selectedCharge.name;
      }
    }
    
    setAdditionalCharges(newCharges);
    setShowCalculation(false);
  };

  // Update handleAdditionalChargeSelect function
  const handleAdditionalChargeSelect = (e) => {
    const billHeadId = e.target.value;
    const billHead = availableCharges.find(bh => bh._id === billHeadId);
    
    // Clear selection if no bill head found
    if (!billHead) {
      setSelectedAdditionalCharge(null);
      return;
    }
    
    // Check if this charge is already added
    const isChargeAlreadyAdded = additionalCharges.some(
      charge => charge.billHeadId === billHead._id
    );

    if (isChargeAlreadyAdded) {
      setNotificationWithTimeout('This charge has already been added', 'warning');
      e.target.value = ''; // Reset dropdown
      return;
    }
    
    setSelectedAdditionalCharge(billHead);
    
    // If it's a fixed amount bill head, automatically add the charge
    if (billHead.calculationType === 'Fixed') {
      const newCharge = {
        billHeadId: billHead._id,
        chargeType: billHead.name,
        amount: billHead.fixedAmount,
        ledgerId: billHead.accountingConfig.incomeLedgerId,
        unitUsage: 1,
        calculationType: billHead.calculationType
      };
      setAdditionalCharges([...additionalCharges, newCharge]);
      setShowCalculation(false);
      setSelectedAdditionalCharge(null); // Clear selection after adding
      e.target.value = ''; // Reset dropdown
    }
  };

  const permissions = usePermissions();
  if (!permissions.includes("manage_bills") && !permissions.includes("full_access")) {
    return <AccessDenied />;
  }

  if (loading) {
    return <PreloaderSociety />;
  }

  // Add filter section to JSX before the bills list
  const renderFilters = () => (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">Filters</h3>
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700">Bill Head</label>
          <select
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            value={filters.billHeadId}
            onChange={(e) => setFilters(prev => ({ ...prev, billHeadId: e.target.value }))}
          >
            <option value="">All Bill Heads</option>
            {billHeads.map(bh => (
              <option key={bh._id} value={bh._id}>
                {bh.code} - {bh.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700">Sub Category</label>
          <select
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            value={filters.subCategory}
            onChange={(e) => setFilters(prev => ({ ...prev, subCategory: e.target.value }))}
          >
            <option value="">All Sub Categories</option>
            {utilitySubCategories.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700">From Date</label>
          <input
            type="date"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            value={filters.fromDate}
            onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700">To Date</label>
          <input
            type="date"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            value={filters.toDate}
            onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end space-x-4">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => {
            setFilters({
              status: '',
              billHeadId: '',
              fromDate: '',
              toDate: '',
              subCategory: ''
            });
            fetchBills();
          }}
        >
          Reset
        </button>
        <button
          type="button"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={fetchBills}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );

  // Update summary cards to include GST
  const renderSummaryCards = () => {
    // Format currency with Indian Rupee format
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount || 0);
    };

    return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold">Total Bills</h3>
        <p className="text-2xl">{summary.totalBills}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold">Total Amount</h3>
          <p className="text-2xl text-gray-600">{formatCurrency(summary.totalAmount)}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold">Pending Amount</h3>
          <p className="text-2xl text-yellow-600">{formatCurrency(summary.pendingAmount)}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold">Paid Amount</h3>
          <p className="text-2xl text-green-600">{formatCurrency(summary.paidAmount)}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold">Overdue Amount</h3>
          <p className="text-2xl text-red-600">{formatCurrency(summary.overdueAmount)}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold">Total GST</h3>
          <p className="text-2xl text-blue-600">{formatCurrency(summary.totalGstCollected)}</p>
      </div>
    </div>
  );
  };

  // Update the bills list to show more details
  const renderBillsList = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Number</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resident</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Head</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late Fee</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {bills.map((bill) => (
            <tr key={bill._id}>
              <td className="px-6 py-4 whitespace-nowrap">{bill.billNumber}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="font-medium">{bill.ownerName}</div>
                  <div className="text-sm text-gray-500">{bill.flatNumber}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{bill.billHeadId.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">₹{bill.baseAmount.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {bill.gstDetails && bill.gstDetails.isGSTApplicable ? (
                  <div className="text-sm">
                    <div>CGST: ₹{bill.gstDetails.cgstAmount.toFixed(2)}</div>
                    <div>SGST: ₹{bill.gstDetails.sgstAmount.toFixed(2)}</div>
                    <div>IGST: ₹{bill.gstDetails.igstAmount.toFixed(2)}</div>
                    <div className="font-medium text-blue-600 mt-1">
                      Total: ₹{(
                        (bill.gstDetails.cgstAmount || 0) + 
                        (bill.gstDetails.sgstAmount || 0) + 
                        (bill.gstDetails.igstAmount || 0)
                      ).toFixed(2)}
                    </div>
                  </div>
                ) : (
                  'N/A'
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {bill.latePaymentDetails && bill.latePaymentDetails.lateFeeAmount > 0 ?
                  <div className="text-red-600 font-medium">₹{bill.latePaymentDetails.lateFeeAmount.toFixed(2)}</div> :
                  'N/A'
                }
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-medium">₹{bill.totalAmount.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {new Date(bill.dueDate).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${bill.status === 'Paid' ? 'bg-green-100 text-green-800' :
                    bill.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                      bill.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'}`}>
                  {bill.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                  onClick={() => handleBillAction('view', bill)}
                >
                  View
                </button>
                {bill.status !== 'Paid' && (
                  <button
                    className="text-green-600 hover:text-green-900"
                    onClick={() => handleBillAction('pay', bill)}
                  >
                    Pay
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Remove the old handleRecordPayment function and update the bill actions
  const handleBillAction = (action, bill) => {
    switch (action) {
      case 'view':
    setSelectedBillForView(bill);
    setShowBillDetailsModal(true);
        break;
      case 'pay':
    setSelectedBillForPayment(bill);
    setShowPaymentModal(true);
        break;
      default:
        break;
    }
  };

  // Update PaymentModal component
  const PaymentModal = ({ bill, onClose }) => {
    if (!bill) return null;
    
    return (
      <PaymentEntryPopup
        bill={bill}
        onClose={onClose}
        onPaymentComplete={(data) => {
          setNotificationWithTimeout('Payment recorded successfully', 'success');
          fetchBills(); // Refresh bills list
          onClose();
        }}
      />
    );
  };

  // Add new function to handle bill generation type selection
  const handleBillGenerationTypeSelect = (type) => {
    setBillGenerationType(type);
    setShowBillOptions(false);
    setShowForm(true);
    
    // Reset selections
    setSelectedResident(null);
    setSelectedBlock('');
    setSelectedFloor('');
    setSelectedFlat('');
    setSelectedBlockForBulk('');
    setSelectedFloorForBulk('');
    setBulkResidents([]);
    
    // Reset form data
    setFormData({
      flatNumber: '',
      blockName: '',
      floorNumber: '',
      residentId: '',
      ownerName: '',
      ownerMobile: '',
      ownerEmail: '',
      billHeadId: '',
      unitUsage: '',
      periodType: 'Monthly',  // Initialize with default value
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  // Add function to get residents for bulk generation
  const getBulkResidents = () => {
    // Filter residents to only include those with flatDetails
    const residentsWithFlats = residents.filter(resident => 
      resident.flatDetails && resident.flatDetails.blockName && resident.flatDetails.flatNumber
    );
    
    if (billGenerationType === 'bulk') {
      // Get all residents with flat details
      return residentsWithFlats;
    } else if (billGenerationType === 'block' && selectedBlockForBulk) {
      // Get residents from selected block
      return residentsWithFlats.filter(resident => 
        resident.flatDetails?.blockName === selectedBlockForBulk
      );
    } else if (billGenerationType === 'floor' && selectedBlockForBulk && selectedFloorForBulk) {
      // Get residents from selected floor
      return residentsWithFlats.filter(resident => 
        resident.flatDetails?.blockName === selectedBlockForBulk && 
        (resident.flatDetails?.floorIndex?.toString() === selectedFloorForBulk || 
         resident.flatDetails?.floorNumber?.toString() === selectedFloorForBulk)
      );
    }
    return [];
  };

  // Update notification function to auto-dismiss
  const showNotification = (message, type) => {
    setNotification({
      show: true,
      message,
      type
    });
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotification({
        show: false,
        message: '',
        type: ''
      });
    }, 5000);
  };
  
  // Update the notification state setter calls to use the showNotification function
  const setNotificationWithTimeout = (message, type) => {
    showNotification(message, type);
  };

  // Update calculateAdditionalCharge function
  const calculateAdditionalCharge = () => {
    if (!selectedAdditionalCharge) {
      return;
    }

    // Check if this charge is already added
    const isChargeAlreadyAdded = additionalCharges.some(
      charge => charge.billHeadId === selectedAdditionalCharge._id
    );

    if (isChargeAlreadyAdded) {
      setSelectedAdditionalCharge(null);
      if (document.getElementById('additionalChargeSelect')) {
        document.getElementById('additionalChargeSelect').value = '';
      }
      return;
    }

    let amount = 0;
    
    // For fixed amount, no need to check for input
    if (selectedAdditionalCharge.calculationType === 'Fixed') {
      amount = selectedAdditionalCharge.fixedAmount;
    } else {
      // For PerUnit and Formula, check input element and value
      const inputElement = document.getElementById('additionalChargeUnits');
      if (!inputElement) {
        setNotificationWithTimeout('Units input not found', 'error');
        return;
      }

      const unitUsage = parseFloat(inputElement.value);
      if (!unitUsage || isNaN(unitUsage)) {
        setNotificationWithTimeout('Please enter valid units', 'error');
        return;
      }

      switch (selectedAdditionalCharge.calculationType) {
        case 'PerUnit':
          amount = unitUsage * selectedAdditionalCharge.perUnitRate;
          break;
        case 'Formula':
          try {
            const formula = selectedAdditionalCharge.formula
              .replace(/\$\{unitUsage\}/g, unitUsage)
              .replace(/\$\{rate\}/g, selectedAdditionalCharge.perUnitRate);
            amount = eval(formula);
          } catch (error) {
            console.error('Formula evaluation error:', error);
            setNotificationWithTimeout('Error calculating formula', 'error');
            return;
          }
          break;
      }
    }

    const newCharge = {
      billHeadId: selectedAdditionalCharge._id,
      chargeType: normalizeChargeType(selectedAdditionalCharge.name),
      amount,
      ledgerId: selectedAdditionalCharge.accountingConfig.incomeLedgerId,
      unitUsage: selectedAdditionalCharge.calculationType === 'Fixed' ? 1 : parseFloat(document.getElementById('additionalChargeUnits').value),
      calculationType: selectedAdditionalCharge.calculationType
    };

    console.log('Adding additional charge:', newCharge);

    const newCharges = [...additionalCharges, newCharge];
    setAdditionalCharges(newCharges);

    // Recalculate total amount
    const additionalChargesTotal = newCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const totalAmount = billCalculation.baseAmount + billCalculation.gstDetails.total + additionalChargesTotal;

    setBillCalculation(prev => ({
      ...prev,
      additionalChargesTotal,
      totalAmount
    }));
    
    // Reset selection
    setSelectedAdditionalCharge(null);
    if (document.getElementById('additionalChargeSelect')) {
      document.getElementById('additionalChargeSelect').value = '';
    }
    if (document.getElementById('additionalChargeUnits')) {
      document.getElementById('additionalChargeUnits').value = '';
    }
  };

  // Utility function to normalize chargeType
  const normalizeChargeType = (name) => {
    // Correct common typos and ensure exact match
    if (name === 'Soceity Charges') return 'Society Charges';
    // Add more corrections if needed
    return name;
  };

  // Update the main return JSX to include the modals
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 shadow-lg border-b-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
              <Receipt className="mr-3" size={32} />
              Utility Bills
            </h1>
          </div>
        </div>
      </header>

      <div className="p-4">
        {renderSummaryCards()}
        <div className="flex justify-between mb-6">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
            onClick={() => setShowBillOptions(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Generate New Bill
          </button>
        </div>
        {renderFilters()}
        {renderBillsList()}
        
        {showBillOptions && (
          <SelectionPopup 
            isOpen={showBillOptions}
            onClose={() => setShowBillOptions(false)}
            onSelectType={handleBillGenerationTypeSelect}
            title="Generate Utility Bill For"
          />
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto z-40">
            <div className="bg-white rounded-lg p-6 w-full max-w-6xl m-4 mt-24 max-h-[90vh] overflow-y-auto my-auto mx-auto">
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pt-2 pb-4 border-b z-10">
                <h2 className="text-xl font-semibold text-gray-900">
                  {billGenerationType === 'individual' && 'Generate Bill for Individual Resident'}
                  {billGenerationType === 'block' && 'Generate Bills for Block'}
                  {billGenerationType === 'floor' && 'Generate Bills for Floor'}
                  {billGenerationType === 'bulk' && 'Bulk Bill Generation'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Panel - Different based on bill generation type */}
                <div className="bg-white rounded-lg shadow p-6 md:max-h-[70vh] md:overflow-y-auto">
                  {billGenerationType === 'individual' && (
                    <>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Resident</h2>
                      {/* Existing resident selector code */}
                  {loading ? (
                    <div className="flex justify-center p-4">
                      <p>Loading residents...</p>
                    </div>
                  ) : Object.keys(structuredResidents).length > 0 ? (
                    <div className="space-y-4">
                      {Object.keys(structuredResidents).sort().map((blockName) => (
                        <div key={blockName} className="border rounded-md overflow-hidden">
                          <div
                            className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
                            onClick={() => toggleBlock(blockName)}
                          >
                            <div className="font-medium capitalize">{structureType} {blockName}</div>
                            <div>{openBlocks[blockName] ? '−' : '+'}</div>
                          </div>

                          {openBlocks[blockName] && (
                            <div className="p-3 space-y-3">
                              {Object.keys(structuredResidents[blockName]).sort().map((floorNumber) => (
                                <div key={`${blockName}-${floorNumber}`} className="border rounded-md overflow-hidden ml-3">
                                  <div
                                    className="flex justify-between items-center p-2 bg-gray-50 cursor-pointer"
                                    onClick={() => toggleFloor(`${blockName}-${floorNumber}`)}
                                  >
                                    <div className="font-medium">Floor {floorNumber}</div>
                                    <div>{openFloors[`${blockName}-${floorNumber}`] ? '−' : '+'}</div>
                                  </div>

                                  {openFloors[`${blockName}-${floorNumber}`] && (
                                    <div className="p-2 space-y-2">
                                      {Object.keys(structuredResidents[blockName][floorNumber]).sort().map((flatNumber) => (
                                        <div key={`${blockName}-${flatNumber}`} className="border rounded-md overflow-hidden ml-3">
                                          <div
                                            className="flex justify-between items-center p-2 bg-gray-50 cursor-pointer"
                                            onClick={() => toggleFlat(`${blockName}-${flatNumber}`)}
                                          >
                                            <div className="font-medium">Flat {flatNumber}</div>
                                            <div>{openFlats[`${blockName}-${flatNumber}`] ? '−' : '+'}</div>
                                          </div>

                                          {openFlats[`${blockName}-${flatNumber}`] && (
                                            <div className="p-2">
                                              {structuredResidents[blockName][floorNumber][flatNumber].map((resident) => (
                                                <div
                                                  key={resident._id}
                                                  className={`p-2 rounded-md cursor-pointer ${selectedResident?._id === resident._id
                                                      ? 'bg-blue-50 border border-blue-200'
                                                      : 'hover:bg-gray-50'
                                                    }`}
                                                  onClick={() => selectResident(resident, blockName, floorNumber, flatNumber)}
                                                >
                                                  <div className="font-medium">{resident.name}</div>
                                                  <div className="text-sm text-gray-500">
                                                    {resident.phone} | {resident.email}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <p className="text-yellow-800">No residents found. Please make sure residents are added to the society.</p>
                    </div>
                  )}
                    </>
                  )}

                  {billGenerationType === 'block' && (
                    <>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Block</h2>
                      <BlockSelector 
                        structuredResidents={structuredResidents}
                        selectedBlock={selectedBlockForBulk}
                        onSelectBlock={(blockName) => {
                          setSelectedBlockForBulk(blockName);
                          // Immediately get residents when block is selected (single click)
                          const blockResidents = residents.filter(r => 
                            r.flatDetails && 
                            r.flatDetails.blockName && 
                            r.flatDetails.flatNumber &&
                            r.flatDetails.blockName === blockName
                          );
                          setBulkResidents(blockResidents);
                        }}
                      />
                    </>
                  )}

                  {billGenerationType === 'floor' && (
                    <>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Block & Floor</h2>
                      <FloorSelector 
                        structuredResidents={structuredResidents}
                        selectedBlock={selectedBlockForBulk}
                        selectedFloor={selectedFloorForBulk}
                        onSelectBlock={(blockName) => {
                          setSelectedBlockForBulk(blockName);
                          setSelectedFloorForBulk('');
                          setBulkResidents([]);
                        }}
                        onSelectFloor={(floorNumber) => {
                          setSelectedFloorForBulk(floorNumber);
                          // Get residents for the selected floor
                          const floorResidents = residents.filter(r => 
                            r.flatDetails && 
                            r.flatDetails.blockName && 
                            r.flatDetails.flatNumber &&
                            r.flatDetails.blockName === selectedBlockForBulk && 
                            (r.flatDetails.floorIndex?.toString() === floorNumber || 
                             r.flatDetails.floorNumber?.toString() === floorNumber)
                          );
                          setBulkResidents(floorResidents);
                        }}
                      />
                      
                      {/* Show selected residents count */}
                      {selectedBlockForBulk && selectedFloorForBulk && bulkResidents.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-blue-800">
                            <span className="font-medium">{bulkResidents.length}</span> residents selected
                          </p>
                          </div>
                      )}
                      
                      {selectedBlockForBulk && selectedFloorForBulk && bulkResidents.length === 0 && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="text-yellow-800">
                            No residents found on this floor with assigned flats.
                          </p>
                          </div>
                      )}
                    </>
                  )}

                  {billGenerationType === 'bulk' && (
                    <>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Bulk Generation</h2>
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-md">
                        <p className="text-orange-800 mb-2 font-medium">Warning</p>
                        <p className="text-orange-700 text-sm">
                          This will generate bills for all residents in the society. This operation might take some time.
                        </p>
                        <p className="mt-4 font-medium text-gray-700">
                          Total residents: <span className="text-orange-700">{residents.length}</span>
                        </p>
                          </div>
                    </>
                  )}
                      </div>

                {/* Right Panel - Bill Generation Form */}
                <div className="md:col-span-2 md:max-h-[70vh] md:overflow-y-auto pr-2">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Bill Details</h2>

                  {/* Different content based on bill generation type */}
                  {billGenerationType === 'individual' && (
                    <div className="mb-6">
                      {selectedResident ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                          <h3 className="font-medium text-blue-800 mb-2">Selected Resident</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <p className="text-sm text-gray-600">Name</p>
                              <p className="font-medium">{selectedResident.name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Flat</p>
                              <p className="font-medium">{`${selectedBlock}-${selectedFlat}`}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Phone</p>
                              <p className="font-medium">{selectedResident.phone}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Email</p>
                              <p className="font-medium">{selectedResident.email}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                          <p className="text-yellow-800">Please select a resident from the left panel to generate a bill.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bill Head Selection - Common for all types */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Bill Head</label>
                        <select
                          className="mt-1 block w-full p-2 border rounded-md border-gray-300 shadow-sm"
                          value={formData.billHeadId}
                          onChange={handleBillHeadChange}
                          required
                        >
                          <option value="">Select Bill Head</option>
                          {billHeads.map((bh) => (
                            <option key={bh._id} value={bh._id}>
                              {bh.code} - {bh.name} ({bh.subCategory})
                            </option>
                          ))}
                                              </select>
                    </div>

              {/* Period Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Period Type</label>
                <select
                  className="mt-1 block w-full p-2 border rounded-md border-gray-300 shadow-sm"
                  value={formData.periodType}
                  onChange={handlePeriodTypeChange}
                  required
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="HalfYearly">Half Yearly</option>
                  <option value="Yearly">Yearly</option>
                        </select>
                      </div>

                  {/* Units Input - Common for all types but with different handling */}
                  {selectedBillHead && renderUnitsInput()}

                  {/* Additional Charges */}
                  {selectedBillHead && renderAdditionalCharges()}

                  {/* Calculate Button */}
                  {renderCalculateButton()}

                  {/* Bill Details - Show calculation results */}
                      {renderBillDetails()}

                  {/* Dates - Common for all types */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                          <input
                            type="date"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={formData.issueDate}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                issueDate: e.target.value
                              }));
                              setShowCalculation(false);
                            }}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Due Date</label>
                          <input
                            type="date"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={formData.dueDate}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                dueDate: e.target.value
                              }));
                              setShowCalculation(false);
                            }}
                            required
                          />
                        </div>
                      </div>

                  {/* Different content based on bill generation type */}

                  {(billGenerationType === 'block' || billGenerationType === 'floor') && (
                    <div>
                      {bulkResidents.length > 0 ? (
                        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                          <h3 className="font-medium text-green-800 mb-2">Selected Residents</h3>
                          <p className="text-green-700">
                            {bulkResidents.length} residents will be billed with these details.
                          </p>
                          <div className="mt-4 max-h-40 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Flat</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {bulkResidents.map((resident) => (
                                  <tr key={resident._id}>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm">{resident.name}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                                      {resident.flatDetails?.flatNumber}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                          <p className="text-yellow-800">
                            {billGenerationType === 'block' ? 'Please select a block from the left panel.' : 'Please select a block and floor from the left panel.'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {billGenerationType === 'bulk' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-6">
                      <h3 className="font-medium text-orange-800 mb-2">Bulk Generation</h3>
                      <p className="text-orange-700">
                        This will generate bills for all residents with assigned flats in the society.
                      </p>
                      <p className="mt-4 font-medium text-gray-700">
                        Total eligible residents: <span className="text-orange-700">
                          {residents.filter(r => r.flatDetails && r.flatDetails.blockName && r.flatDetails.flatNumber).length}
                        </span>
                      </p>
                      {isGeneratingBulk && (
                        <div className="mt-4">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-orange-600 h-2.5 rounded-full" 
                              style={{ width: `${bulkProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-sm mt-2 text-gray-600">
                            Processing: {bulkProgress}% complete
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                      {/* Form Actions */}
                      <div className="flex justify-end space-x-4 mt-6">
                        <button
                          type="button"
                          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
                          onClick={() => setShowForm(false)}
                        >
                          Cancel
                        </button>
                        <button
                      type="button"
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                      disabled={
                        !showCalculation || 
                        (billGenerationType === 'individual' && !selectedResident) ||
                        ((billGenerationType === 'block' || billGenerationType === 'floor') && bulkResidents.length === 0) ||
                        isGeneratingBulk
                      }
                      onClick={
                        billGenerationType === 'individual' 
                          ? handleSubmit 
                          : () => handleBulkGeneration()
                      }
                    >
                      {isGeneratingBulk ? 'Generating...' : 'Generate Bill'}
                        </button>
                      </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {showBillDetailsModal && (
          <BillDetailsPopup 
            bill={selectedBillForView} 
            onClose={() => {
              setShowBillDetailsModal(false);
              setSelectedBillForView(null);
            }}
          />
        )}
        
        {showPaymentModal && selectedBillForPayment && (
          <PaymentModal 
            bill={selectedBillForPayment} 
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedBillForPayment(null);
            }}
          />
        )}
        
        {notification.show && (
          <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg
            ${notification.type === 'success' ? 'bg-green-500' :
              notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}
            text-white`}>
            {notification.message}
          </div>
        )}
      </div>
    </div>
  );
}