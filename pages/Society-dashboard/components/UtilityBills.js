import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PreloaderSociety from '../../components/PreloaderSociety';
import { FileText, Plus, Edit2, Archive, Check, X, AlertCircle } from 'lucide-react';
import { usePermissions } from "../../../components/PermissionsContext";
import AccessDenied from "../widget/societyComponents/accessRestricted";

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
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Summary state
  const [summary, setSummary] = useState({
    totalBills: 0,
    pendingAmount: 0,
    paidAmount: 0,
    overdueAmount: 0,
    totalGstCollected: 0
  });

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
    residentsArray.forEach(resident => {
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
      setNotification({
        show: true,
        message: error.message || 'Failed to fetch residents',
        type: 'error'
      });
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
        ...(filters.subCategory && { subCategory: filters.subCategory }) // Add subCategory to query
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
      setSummary({
        totalBills: data.summary.totalBills || 0,
        pendingAmount: data.summary.totalPending || 0,
        paidAmount: data.summary.totalPaid || 0,
        overdueAmount: data.summary.totalOverdue || 0,
        totalGstCollected: data.summary.totalGstCollected || 0
      });
    } catch (error) {
      console.error('Error fetching bills:', error);
      setNotification({
        show: true,
        message: 'Failed to fetch bills',
        type: 'error'
      });
    }
  };

  // Add subcategories for Utility bills
  const utilitySubCategories = ['Water', 'Electricity', 'Gas', 'Internet', 'Cable', 'Telephone', 'Other'];

  // Update fetchBillHeads to include subcategory info
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
      
      // Filter only utility bill heads and group by subcategory
      const utilityBillHeads = result.data.filter(bh => bh.category === 'Utility');
      console.log('Utility Bill Heads:', utilityBillHeads);
      
      setBillHeads(utilityBillHeads);
    } catch (error) {
      console.error('Error in fetchBillHeads:', error);
      setNotification({
        show: true,
        message: error.message || 'Failed to fetch bill heads',
        type: 'error'
      });
    }
  };

  // Handle bill head selection
  const handleBillHeadChange = (e) => {
    const billHeadId = e.target.value;
    const billHead = billHeads.find(bh => bh._id === billHeadId);
    setSelectedBillHead(billHead);
    setFormData(prev => ({
      ...prev,
      billHeadId,
      unitUsage: '',
      baseAmount: billHead?.calculationType === 'Fixed' ? billHead.fixedAmount : 0
    }));
  };

  // Calculate bill amount with GST and late fees
  const calculateAmount = () => {
    if (!selectedBillHead || !formData.unitUsage) {
      setNotification({
        show: true,
        message: 'Please select bill head and enter units used',
        type: 'error'
      });
      return;
    }

    let baseAmount = 0;
    switch (selectedBillHead.calculationType) {
      case 'Fixed':
        baseAmount = selectedBillHead.fixedAmount;
        break;
      case 'PerUnit':
        baseAmount = formData.unitUsage * selectedBillHead.perUnitRate;
        break;
      case 'Formula':
        try {
          const formula = selectedBillHead.formula
            .replace(/\$\{unitUsage\}/g, formData.unitUsage)
            .replace(/\$\{rate\}/g, selectedBillHead.perUnitRate);
          baseAmount = eval(formula);
        } catch (error) {
          console.error('Formula evaluation error:', error);
          baseAmount = 0;
        }
        break;
    }

    // Calculate GST
    let gstDetails = {
      cgst: 0,
      sgst: 0,
      igst: 0,
      total: 0
    };

    if (selectedBillHead.gstConfig?.isGSTApplicable) {
      const { cgstPercentage, sgstPercentage, igstPercentage } = selectedBillHead.gstConfig;
      gstDetails = {
        cgst: (baseAmount * cgstPercentage) / 100,
        sgst: (baseAmount * sgstPercentage) / 100,
        igst: (baseAmount * igstPercentage) / 100,
        total: 0
      };
      gstDetails.total = gstDetails.cgst + gstDetails.sgst + gstDetails.igst;
    }

    // Calculate late fees if applicable
    let lateFees = 0;
    const dueDate = new Date(formData.dueDate);
    const today = new Date();
    
    if (selectedBillHead.latePaymentConfig?.isLatePaymentChargeApplicable) {
      const gracePeriod = selectedBillHead.latePaymentConfig.gracePeriodDays;
      const daysLate = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)) - gracePeriod);

      if (daysLate > 0) {
        if (selectedBillHead.latePaymentConfig.chargeType === 'Fixed') {
          lateFees = selectedBillHead.latePaymentConfig.chargeValue;
        } else {
          // Percentage based
          lateFees = (baseAmount * selectedBillHead.latePaymentConfig.chargeValue) / 100;
          
          // Apply compounding if configured
          if (selectedBillHead.latePaymentConfig.compoundingFrequency === 'Daily') {
            lateFees *= daysLate;
          } else if (selectedBillHead.latePaymentConfig.compoundingFrequency === 'Weekly') {
            lateFees *= Math.ceil(daysLate / 7);
          } else if (selectedBillHead.latePaymentConfig.compoundingFrequency === 'Monthly') {
            lateFees *= Math.ceil(daysLate / 30);
          }
        }
      }
    }

    const totalAmount = baseAmount + gstDetails.total + lateFees;

    setBillCalculation({
      baseAmount,
      gstDetails,
      lateFees,
      totalAmount
    });

    setShowCalculation(true);
  };

  // Update the units used input section in the form
  const renderUnitsInput = () => {
    if (!selectedBillHead) return null;

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          {selectedBillHead.calculationType === 'Fixed' ? 'Fixed Amount' :
           selectedBillHead.calculationType === 'PerUnit' ? 'Units Used' :
           'Units Used (for formula calculation)'}
        </label>
        <div className="mt-1 flex space-x-2">
          {selectedBillHead.calculationType === 'Fixed' ? (
            <input
              type="text"
              className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={selectedBillHead.fixedAmount}
              disabled
            />
          ) : (
            <>
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
              <button
                type="button"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                onClick={calculateAmount}
              >
                Calculate
              </button>
            </>
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

  // Update the bill details section
  const renderBillDetails = () => {
    if (!selectedBillHead || !showCalculation) return null;

    return (
      <div className="space-y-4 mt-4 border-t pt-4">
        {/* Base Amount */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Base Amount:</span>
          <span className="font-medium">₹{billCalculation.baseAmount.toFixed(2)}</span>
        </div>

        {/* GST Details */}
        {selectedBillHead.gstConfig?.isGSTApplicable && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">GST Details:</div>
            {billCalculation.gstDetails.cgst > 0 && (
              <div className="flex justify-between items-center pl-4">
                <span className="text-gray-600">CGST ({selectedBillHead.gstConfig.cgstPercentage}%):</span>
                <span>₹{billCalculation.gstDetails.cgst.toFixed(2)}</span>
              </div>
            )}
            {billCalculation.gstDetails.sgst > 0 && (
              <div className="flex justify-between items-center pl-4">
                <span className="text-gray-600">SGST ({selectedBillHead.gstConfig.sgstPercentage}%):</span>
                <span>₹{billCalculation.gstDetails.sgst.toFixed(2)}</span>
              </div>
            )}
            {billCalculation.gstDetails.igst > 0 && (
              <div className="flex justify-between items-center pl-4">
                <span className="text-gray-600">IGST ({selectedBillHead.gstConfig.igstPercentage}%):</span>
                <span>₹{billCalculation.gstDetails.igst.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center font-medium border-t pt-2">
              <span>Total GST:</span>
              <span>₹{billCalculation.gstDetails.total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Late Payment Details */}
        {selectedBillHead.latePaymentConfig?.isLatePaymentChargeApplicable && (
          <div className="space-y-2 border-t pt-2">
            <div className="text-sm font-medium text-gray-700">Late Payment Configuration:</div>
            <div className="pl-4 text-sm text-gray-600">
              <div>Grace Period: {selectedBillHead.latePaymentConfig.gracePeriodDays} days</div>
              <div>
                Charge: {selectedBillHead.latePaymentConfig.chargeType === 'Fixed' 
                  ? `₹${selectedBillHead.latePaymentConfig.chargeValue} (Fixed)`
                  : `${selectedBillHead.latePaymentConfig.chargeValue}% (${selectedBillHead.latePaymentConfig.compoundingFrequency} compounding)`}
              </div>
            </div>
            {billCalculation.lateFees > 0 && (
              <div className="flex justify-between items-center text-red-600 font-medium">
                <span>Late Payment Charges:</span>
                <span>₹{billCalculation.lateFees.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Total Amount */}
        <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
          <span>Total Amount:</span>
          <span>₹{billCalculation.totalAmount.toFixed(2)}</span>
        </div>
      </div>
    );
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
        throw new Error('Failed to fetch society details');
      }

      const societyData = await societyResponse.json();

      // Get selected bill head details and populate ledgers
      const billHeadResponse = await fetch(`/api/BillHead-Api/get-bill-heads?societyId=${societyData.societyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (!billHeadResponse.ok) {
        throw new Error('Failed to fetch bill head details');
      }

      const billHeadData = await billHeadResponse.json();
      const selectedBillHeadData = billHeadData.data.find(bh => bh._id === formData.billHeadId);

      if (!selectedBillHeadData) {
        throw new Error('Selected bill head not found');
      }

      // Create default ledgers if they don't exist
      const createDefaultLedger = async (code, name, category, type) => {
        try {
          const response = await fetch('/api/Ledger-Api/create-ledger', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              societyId: societyData._id,
              code,
              name,
              type,
              category,
              openingBalance: 0,
              balanceType: type === 'Asset' ? 'Debit' : 'Credit'
            })
          });

          if (!response.ok) {
            const data = await response.json();
            if (data.message.includes('Ledger code already exists')) {
              // If ledger exists, fetch it
              const ledgersResponse = await fetch(`/api/Ledger-Api/get-ledgers?societyId=${societyData.societyId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                }
              });
              const ledgersData = await ledgersResponse.json();
              return ledgersData.ledgers.find(l => l.code === code);
            }
            return null;
          }

          const data = await response.json();
          return data.data;
        } catch (error) {
          console.error(`Error creating ${name} ledger:`, error);
          return null;
        }
      };

      // Try to get or create income and receivable ledgers
      let incomeLedger = selectedBillHeadData.accountingConfig?.incomeLedgerId;
      let receivableLedger = selectedBillHeadData.accountingConfig?.receivableLedgerId;

      if (!incomeLedger) {
        incomeLedger = await createDefaultLedger(
          'INC001',
          'Utility Income',
          'Operating Income',
          'Income'
        );
      }

      if (!receivableLedger) {
        receivableLedger = await createDefaultLedger(
          'REC001',
          'Utility Receivables',
          'Receivable',
          'Asset'
        );
      }

      // Create GST ledger if it doesn't exist
      let gstLedger = await createDefaultLedger(
        'GSTPAY',
        'GST Payable',
        'Current Liability',
        'Liability'
      );

      if (!gstLedger) {
        setNotification({
          show: true,
          message: 'Failed to create or find GST ledger',
          type: 'error'
        });
        return;
      }

      // Add society _id and bill calculation details to form data
      const billData = {
        ...formData,
        societyId: societyData._id,
        baseAmount: billCalculation.baseAmount,
        gstDetails: {
          isGSTApplicable: selectedBillHeadData.gstConfig?.isGSTApplicable || false,
          cgstAmount: billCalculation.gstDetails.cgst,
          sgstAmount: billCalculation.gstDetails.sgst,
          igstAmount: billCalculation.gstDetails.igst,
          totalGstAmount: billCalculation.gstDetails.total
        },
        totalAmount: billCalculation.totalAmount,
        billHeadDetails: {
          code: selectedBillHeadData.code,
          name: selectedBillHeadData.name,
          accountingConfig: {
            ...(incomeLedger && { incomeLedgerId: incomeLedger._id }),
            ...(receivableLedger && { receivableLedgerId: receivableLedger._id }),
            ...(gstLedger && { gstLedgerId: gstLedger._id })
          }
        }
      };

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
        setNotification({
          show: true,
          message: 'Bill generated successfully',
          type: 'success'
        });
        setShowForm(false);
        fetchBills();
      } else {
        throw new Error(data.message || 'Failed to generate bill');
      }
    } catch (error) {
      console.error('Error generating bill:', error);
      setNotification({
        show: true,
        message: error.message || 'Failed to generate bill',
        type: 'error'
      });
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
  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold">Total Bills</h3>
          <p className="text-2xl">{summary.totalBills}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold">Pending Amount</h3>
          <p className="text-2xl text-yellow-600">₹{summary.pendingAmount.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold">Paid Amount</h3>
          <p className="text-2xl text-green-600">₹{summary.paidAmount.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold">Overdue Amount</h3>
          <p className="text-2xl text-red-600">₹{summary.overdueAmount.toFixed(2)}</p>
            </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold">Total GST</h3>
        <p className="text-2xl text-blue-600">₹{summary.totalGstCollected.toFixed(2)}</p>
                        </div>
                        </div>
  );

  // Update bills list to show more details
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
                  <div className="text-sm text-gray-500">{bill.blockName}-{bill.flatNumber}</div>
                </div>
              </td>
                <td className="px-6 py-4 whitespace-nowrap">{bill.billHeadId.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">₹{bill.baseAmount.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {bill.gstDetails.isGSTApplicable ? (
                  <div className="text-sm">
                    <div>CGST: ₹{bill.gstDetails.cgstAmount.toFixed(2)}</div>
                    <div>SGST: ₹{bill.gstDetails.sgstAmount.toFixed(2)}</div>
                    <div>IGST: ₹{bill.gstDetails.igstAmount.toFixed(2)}</div>
                  </div>
                ) : (
                  'N/A'
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {bill.latePaymentDetails.lateFeeAmount > 0 ? 
                  `₹${bill.latePaymentDetails.lateFeeAmount.toFixed(2)}` : 
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
                    onClick={() => {/* View bill details */}}
                              >
                                View
                              </button>
                              {bill.status !== 'Paid' && (
                                <button
                                  className="text-green-600 hover:text-green-900"
                      onClick={() => {/* Record payment */}}
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

  const BillDetails = ({ bill }) => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Bill Information</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Bill Number:</span> {bill.billNumber}</p>
              <p><span className="font-medium">Issue Date:</span> {new Date(bill.issueDate).toLocaleDateString()}</p>
              <p><span className="font-medium">Due Date:</span> {new Date(bill.dueDate).toLocaleDateString()}</p>
              <p><span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded-full text-sm ${
                  bill.status === 'Paid' ? 'bg-green-100 text-green-800' :
                  bill.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                  bill.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {bill.status}
                </span>
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Resident Details</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Flat:</span> {bill.flatNumber}</p>
              <p><span className="font-medium">Name:</span> {bill.ownerName}</p>
              <p><span className="font-medium">Mobile:</span> {bill.ownerMobile}</p>
              <p><span className="font-medium">Email:</span> {bill.ownerEmail || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Amount Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Base Amount ({bill.unitUsage} units × ₹{bill.perUnitRate})</span>
              <span>₹{bill.baseAmount.toFixed(2)}</span>
            </div>

            {bill.gstDetails.isGSTApplicable && (
              <>
                {bill.gstDetails.cgstAmount > 0 && (
                  <div className="flex justify-between items-center text-gray-600">
                    <span>CGST @ {bill.gstDetails.cgstPercentage}%</span>
                    <span>₹{bill.gstDetails.cgstAmount.toFixed(2)}</span>
                  </div>
                )}
                {bill.gstDetails.sgstAmount > 0 && (
                  <div className="flex justify-between items-center text-gray-600">
                    <span>SGST @ {bill.gstDetails.sgstPercentage}%</span>
                    <span>₹{bill.gstDetails.sgstAmount.toFixed(2)}</span>
                  </div>
                )}
                {bill.gstDetails.igstAmount > 0 && (
                  <div className="flex justify-between items-center text-gray-600">
                    <span>IGST @ {bill.gstDetails.igstPercentage}%</span>
                    <span>₹{bill.gstDetails.igstAmount.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}

            {bill.latePaymentDetails.lateFeeAmount > 0 && (
              <div className="flex justify-between items-center text-red-600">
                <span>Late Payment Charges</span>
                <span>₹{bill.latePaymentDetails.lateFeeAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t pt-3 font-semibold">
              <div className="flex justify-between items-center">
                <span>Total Amount</span>
                <span>₹{bill.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {bill.paidAmount > 0 && (
              <>
                <div className="flex justify-between items-center text-green-600">
                  <span>Paid Amount</span>
                  <span>₹{bill.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center font-semibold">
                  <span>Remaining Amount</span>
                  <span>₹{(bill.totalAmount - bill.paidAmount).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {bill.paymentHistory && bill.paymentHistory.length > 0 && (
          <div className="border-t mt-6 pt-6">
            <h3 className="text-lg font-semibold mb-4">Payment History</h3>
            <div className="space-y-3">
              {bill.paymentHistory.map((payment, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                    <p className="text-gray-600">{payment.paymentMethod} - {payment.transactionId}</p>
                  </div>
                  <span className="font-medium">₹{payment.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {bill.journalEntries && bill.journalEntries.length > 0 && (
          <div className="border-t mt-6 pt-6">
            <h3 className="text-lg font-semibold mb-4">Journal Entries</h3>
            <div className="space-y-3">
              {bill.journalEntries.map((entry, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{entry.type}</p>
                    <p className="text-gray-600">{new Date(entry.date).toLocaleDateString()}</p>
                  </div>
                  <span className="font-medium">₹{entry.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Update the main return JSX to use the new components
  return (
    <div className="p-4">
      {renderSummaryCards()}
      {/* Action Buttons */}
      <div className="flex justify-between mb-6">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-5 h-5 mr-2" />
          Generate New Bill
        </button>
      </div>
      {renderFilters()}
      {renderBillsList()}
      {/* Keep existing form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl m-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Resident Selector */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Resident</h2>

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
                                                className={`p-2 rounded-md cursor-pointer ${
                                                  selectedResident?._id === resident._id
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
              </div>

              {/* Bill Generation Form */}
              <div className="md:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Utility Bill</h2>

                {selectedResident ? (
                  <form onSubmit={handleSubmit}>
                    {/* Selected Resident Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
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

                    {/* Bill Head Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">Bill Head</label>
                      <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        value={formData.billHeadId}
                        onChange={(e) => {
                          handleBillHeadChange(e);
                          setShowCalculation(false);
                        }}
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

                    {/* Units Input */}
                    {renderUnitsInput()}

                    {/* Bill Details */}
                    {renderBillDetails()}

                    {/* Dates */}
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
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                        disabled={!showCalculation}
                      >
                        Generate Bill
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <p className="text-yellow-800">Please select a resident from the left panel to generate a bill.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Notification */}
      {notification.show && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg
          ${notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}
          text-white`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}