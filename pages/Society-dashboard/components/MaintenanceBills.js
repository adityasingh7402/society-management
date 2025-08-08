// pages/maintenance-bills.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PreloaderSociety from '../../components/PreloaderSociety';
import { FileText, Plus, Edit2, Archive, Check, X, AlertCircle, Users, Home, Building, User, Receipt } from 'lucide-react';
import { usePermissions } from "../../../components/PermissionsContext";
import AccessDenied from "../widget/societyComponents/accessRestricted";

// Import reusable components
import {
  SelectionPopup,
  BlockSelector,
  FloorSelector,
  BillDetailsPopup,
  PaymentEntryPopup,
  ResidentSelectionTable
} from '../../../components/Society/widgets';

export default function MaintenanceBills() {
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
    subCategory: ''
  });
  const [showCalculation, setShowCalculation] = useState(false);

  // Bill generation options state
  const [showBillOptions, setShowBillOptions] = useState(false);
  const [billGenerationType, setBillGenerationType] = useState('individual');
  const [selectedBlockForBulk, setSelectedBlockForBulk] = useState('');
  const [selectedFloorForBulk, setSelectedFloorForBulk] = useState('');
  const [bulkResidents, setBulkResidents] = useState([]);
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  // Bill details and payment modal state
  const [selectedBillForView, setSelectedBillForView] = useState(null);
  const [showBillDetailsModal, setShowBillDetailsModal] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Additional states for bulk generation and resident selection
  const [selectedResidents, setSelectedResidents] = useState([]);
  const [filteredResidents, setFilteredResidents] = useState([]);
  const [residentUnitUsages, setResidentUnitUsages] = useState({});
  const [calculationResults, setCalculationResults] = useState({});
  const [showResidentCalculation, setShowResidentCalculation] = useState(false);
  const [bulkFilter, setBulkFilter] = useState({ block: '', floor: '' });
  const [bulkBillType, setBulkBillType] = useState('');
  const [bulkDescription, setBulkDescription] = useState('');
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkIssueDate, setBulkIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkDueDate, setBulkDueDate] = useState('');
  const [bulkFinePerDay, setBulkFinePerDay] = useState('50');

  // History filter states
  const [billHistory, setBillHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [historyBlock, setHistoryBlock] = useState('');
  const [historyFloor, setHistoryFloor] = useState('');
  const [historyFlat, setHistoryFlat] = useState('');
  const [billTypeFilter, setBillTypeFilter] = useState('');
  const [summaryData, setSummaryData] = useState({
    totalBills: 0,
    totalAmount: 0,
    totalPaidAmount: 0,
    totalDueAmount: 0,
    totalPenalty: 0
  });

  // Form state
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
    periodType: 'Monthly',  // Add period type with default value
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

  // Additional charges state
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [availableCharges, setAvailableCharges] = useState([]);
  const [selectedAdditionalCharge, setSelectedAdditionalCharge] = useState(null);

  // Add subcategories for Maintenance bills
  const maintenanceSubCategories = ['Cleaning', 'Security', 'Gardening', 'Equipment', 'Repairs', 'Staff', 'Other'];

  // Function to structure residents data
  function structureResidentsData(residentsArray) {
    console.log('Structuring residents:', residentsArray);
    const structured = {};
    const newBlockOpenState = {};
    const newFloorOpenState = {};
    const newFlatOpenState = {};

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
        newBlockOpenState[blockName] = false; // Default closed
      }
      if (!structured[blockName][floorNumber]) {
        structured[blockName][floorNumber] = {};
        newFloorOpenState[`${blockName}-${floorNumber}`] = false; // Default closed
      }
      if (!structured[blockName][floorNumber][flatNumber]) {
        structured[blockName][floorNumber][flatNumber] = [];
        newFlatOpenState[`${blockName}-${flatNumber}`] = false; // Default closed
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

    // Set first block open
    const blocks = Object.keys(structured).sort();
    if (blocks.length > 0) {
      const firstBlock = blocks[0];
      newBlockOpenState[firstBlock] = true;

      // Set first floor of first block open
      const floors = Object.keys(structured[firstBlock]).sort();
      if (floors.length > 0) {
        const firstFloor = floors[0];
        newFloorOpenState[`${firstBlock}-${firstFloor}`] = true;

        // Set all flats in the first floor closed
        Object.keys(structured[firstBlock][firstFloor]).forEach(flatNumber => {
          newFlatOpenState[`${firstBlock}-${flatNumber}`] = false;
        });
      }
    }

    console.log('Structured data:', structured);
    setStructuredResidents(structured);
    setOpenBlocks(newBlockOpenState);
    setOpenFloors(newFloorOpenState);
    setOpenFlats(newFlatOpenState);
  }

  // Remove duplicate useEffect for fetching available charges
  useEffect(() => {
    console.log('Component mounted, fetching data...');
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('Society');
        if (!token) {
          router.push('/societyLogin');
          return;
        }

        // Fetch all data in parallel
        await Promise.all([
          fetchBillHeads(),
          fetchResidents(),
          fetchBills(),
          fetchAvailableCharges()
        ]);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setNotification({
          show: true,
          message: 'Failed to load data',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  // Add notification helper
  const setNotificationWithTimeout = (message, type) => {
    setNotification({
      show: true,
      message,
      type
    });

    setTimeout(() => {
      setNotification({
        show: false,
        message: '',
        type: ''
      });
    }, 5000);
  };

  // Add period type change handler
  const handlePeriodTypeChange = (e) => {
    const value = e.target.value;
    console.log('Changing period type to:', value);
    setFormData(prev => {
      const newFormData = {
        ...prev,
        periodType: value
      };
      console.log('Updated form data:', newFormData);
      return newFormData;
    });
  };

  // Add handleBillHeadChange function
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

  // Add calculateAmount function
  const calculateAmount = () => {
    if (!selectedBillHead) {
      setNotification({
        show: true,
        message: 'Please select bill head',
        type: 'error'
      });
      return;
    }

    if (selectedBillHead.calculationType !== 'Fixed' && !formData.unitUsage) {
      setNotification({
        show: true,
        message: 'Please enter units used',
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
          setNotification({
            show: true,
            message: 'Error calculating formula: ' + error.message,
            type: 'error'
          });
          return;
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

  // Add renderUnitsInput function
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

  // Add renderCalculateButton function
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

  // Add renderBillDetails function
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

  // Update renderAdditionalCharges function
  const renderAdditionalCharges = () => {
    if (!selectedBillHead) return null;

    return (
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
  };

  // Add renderBillGenerationForm function
  const renderBillGenerationForm = () => {
    if (!showForm) return null;

    return (
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

              {/* Units Input - Only show for individual bill generation */}
              {selectedBillHead && billGenerationType === 'individual' && renderUnitsInput()}

              {/* Additional Charges - Show for all types but only individual can modify */}
              {selectedBillHead && renderAdditionalCharges()}

              {/* Calculate Button - Only show for individual generation */}
              {billGenerationType === 'individual' && renderCalculateButton()}

              {/* Bill Details - Show calculation results for all types */}
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
                    <ResidentSelectionTable 
                      residents={bulkResidents}
                      selectedResidents={selectedResidents}
                      onResidentToggle={(resident, isSelected) => {
                        if (isSelected) {
                          setSelectedResidents(prev => [...prev, resident]);
                        } else {
                          setSelectedResidents(prev => prev.filter(r => r._id !== resident._id));
                        }
                      }}
                      onUnitUsageChange={() => {}} // No-op for maintenance bills since they're fixed
                      billHead={{
                        ...selectedBillHead,
                        calculationType: 'Fixed' // Always treat as fixed for maintenance
                      }}
                      onCalculate={() => {
                        if (selectedResidents.length === 0) {
                          setNotificationWithTimeout('Please select at least one resident', 'error');
                          return;
                        }
                        
                        if (!selectedBillHead) {
                          setNotificationWithTimeout('Please select a bill head first', 'error');
                          return;
                        }
                        
                        // Calculate for each selected resident (all same amount since maintenance is fixed)
                        const newCalculationResults = {};
                        selectedResidents.forEach(resident => {
                          // For maintenance bills, always use fixed amount
                          let baseAmount = selectedBillHead.fixedAmount || 0;
                          
                          // Calculate GST
                          let gstDetails = selectedBillHead.gstConfig?.isGSTApplicable
                            ? {
                                cgstAmount: (baseAmount * selectedBillHead.gstConfig.cgstPercentage) / 100,
                                sgstAmount: (baseAmount * selectedBillHead.gstConfig.sgstPercentage) / 100,
                                igstAmount: (baseAmount * selectedBillHead.gstConfig.igstPercentage) / 100,
                                total: 0
                              }
                            : {
                                cgstAmount: 0,
                                sgstAmount: 0,
                                igstAmount: 0,
                                total: 0
                              };
                          gstDetails.total = gstDetails.cgstAmount + gstDetails.sgstAmount + gstDetails.igstAmount;
                          
                          // Calculate additional charges total
                          const additionalChargesTotal = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
                          
                          newCalculationResults[resident._id] = {
                            baseAmount,
                            gstAmount: gstDetails.total,
                            additionalChargesTotal,
                            totalAmount: baseAmount + gstDetails.total + additionalChargesTotal
                          };
                        });
                        
                        setCalculationResults(newCalculationResults);
                        setShowResidentCalculation(true);
                      }}
                      showCalculation={showResidentCalculation}
                      calculationResults={calculationResults}
                      additionalCharges={additionalCharges}
                    />
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
                <div>
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
                  
                  {/* Add ResidentSelectionTable for bulk generation */}
                  {selectedBillHead && residents.filter(r => r.flatDetails && r.flatDetails.blockName && r.flatDetails.flatNumber).length > 0 && (
                    <ResidentSelectionTable 
                      residents={residents.filter(r => r.flatDetails && r.flatDetails.blockName && r.flatDetails.flatNumber)}
                      selectedResidents={selectedResidents.length > 0 ? selectedResidents : residents.filter(r => r.flatDetails && r.flatDetails.blockName && r.flatDetails.flatNumber)}
                      onResidentToggle={(resident, isSelected) => {
                        // For bulk generation, we'll auto-select all residents but allow deselection
                        if (isSelected) {
                          setSelectedResidents(prev => {
                            const exists = prev.find(r => r._id === resident._id);
                            return exists ? prev : [...prev, resident];
                          });
                        } else {
                          setSelectedResidents(prev => prev.filter(r => r._id !== resident._id));
                        }
                      }}
                      onUnitUsageChange={() => {}} // No-op for maintenance bills since they're fixed
                      billHead={{
                        ...selectedBillHead,
                        calculationType: 'Fixed' // Always treat as fixed for maintenance
                      }}
                      onCalculate={() => {
                        if (!selectedBillHead) {
                          setNotificationWithTimeout('Please select a bill head first', 'error');
                          return;
                        }
                        
                        // Get all eligible residents if none selected
                        const residentsToCalculate = selectedResidents.length > 0 
                          ? selectedResidents 
                          : residents.filter(r => r.flatDetails && r.flatDetails.blockName && r.flatDetails.flatNumber);
                        
                        if (residentsToCalculate.length === 0) {
                          setNotificationWithTimeout('No eligible residents found', 'error');
                          return;
                        }
                        
                        // Calculate for each resident (all same amount since maintenance is fixed)
                        const newCalculationResults = {};
                        residentsToCalculate.forEach(resident => {
                          // For maintenance bills, always use fixed amount
                          let baseAmount = selectedBillHead.fixedAmount || 0;
                          
                          // Calculate GST
                          let gstDetails = selectedBillHead.gstConfig?.isGSTApplicable
                            ? {
                                cgstAmount: (baseAmount * selectedBillHead.gstConfig.cgstPercentage) / 100,
                                sgstAmount: (baseAmount * selectedBillHead.gstConfig.sgstPercentage) / 100,
                                igstAmount: (baseAmount * selectedBillHead.gstConfig.igstPercentage) / 100,
                                total: 0
                              }
                            : {
                                cgstAmount: 0,
                                sgstAmount: 0,
                                igstAmount: 0,
                                total: 0
                              };
                          gstDetails.total = gstDetails.cgstAmount + gstDetails.sgstAmount + gstDetails.igstAmount;
                          
                          // Calculate additional charges total
                          const additionalChargesTotal = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
                          
                          newCalculationResults[resident._id] = {
                            baseAmount,
                            gstAmount: gstDetails.total,
                            additionalChargesTotal,
                            totalAmount: baseAmount + gstDetails.total + additionalChargesTotal
                          };
                        });
                        
                        // Auto-select all residents if none were selected
                        if (selectedResidents.length === 0) {
                          setSelectedResidents(residentsToCalculate);
                        }
                        
                        setCalculationResults(newCalculationResults);
                        setShowResidentCalculation(true);
                      }}
                      showCalculation={showResidentCalculation}
                      calculationResults={calculationResults}
                      additionalCharges={additionalCharges}
                      bulkMode={true} // Add a prop to indicate bulk mode
                    />
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
                    (billGenerationType === 'individual' && (!showCalculation || !selectedResident)) ||
                    ((billGenerationType === 'block' || billGenerationType === 'floor') && (!showResidentCalculation || selectedResidents.length === 0)) ||
                    (billGenerationType === 'bulk' && !showCalculation) ||
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
    );
  };



  // Fix fetchBillHeads function
  const fetchBillHeads = async () => {
    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      // Get society details first
      const societyResponse = await fetch('/api/Society-Api/get-society-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!societyResponse.ok) {
        throw new Error('Failed to fetch society details');
      }

      const societyData = await societyResponse.json();
      const societyCode = societyData.societyId; // Use societyId (code) instead of _id

      const response = await fetch(`/api/BillHead-Api/get-bill-heads?societyId=${societyCode}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter only maintenance bill heads
        const maintenanceBillHeads = data.data.filter(bh => bh.category === 'Maintenance');
        setBillHeads(maintenanceBillHeads);
      } else {
        throw new Error('Failed to fetch bill heads');
      }
    } catch (error) {
      console.error('Error fetching bill heads:', error);
      setNotification({
        show: true,
        message: 'Failed to fetch bill heads',
        type: 'error'
      });
    }
  };

  // Update fetchResidents function to use structureResidentsData
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
      structureResidentsData(residentsArray);
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

  // Update fetchBills function
  const fetchBills = async () => {
    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      // Get society details first
      const societyResponse = await fetch('/api/Society-Api/get-society-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!societyResponse.ok) {
        throw new Error('Failed to fetch society details');
      }

      const societyData = await societyResponse.json();
      const societyId = societyData.societyId; // Use societyId (code) instead of _id

      // Build query string from filters
      const queryParams = new URLSearchParams({
        societyId: societyId,
        ...(filters.status && { status: filters.status }),
        ...(filters.billHeadId && { billHeadId: filters.billHeadId }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
        ...(filters.subCategory && { subCategory: filters.subCategory })
      }).toString();

      // Fetch bills with filters
      const response = await fetch(`/api/MaintenanceBill-Api/getBills?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bills');
      }

      const data = await response.json();
      setBills(data.bills || []);
      setSummary(data.summary || {
        totalBills: 0,
        pendingAmount: 0,
        paidAmount: 0,
        overdueAmount: 0,
        totalGstCollected: 0
      });
    } catch (error) {
      console.error('Error fetching bills:', error);
      setNotification({
        show: true,
        message: 'Failed to fetch bills',
        type: 'error'
      });
      // Set default values for bills and summary on error
      setBills([]);
      setSummary({
        totalBills: 0,
        pendingAmount: 0,
        paidAmount: 0,
        overdueAmount: 0,
        totalGstCollected: 0
      });
    }
  };

  // Fix fetchAvailableCharges function
  const fetchAvailableCharges = async () => {
    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      // Get society details first
      const societyResponse = await fetch('/api/Society-Api/get-society-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!societyResponse.ok) {
        throw new Error('Failed to fetch society details');
      }

      const societyData = await societyResponse.json();
      const societyId = societyData.societyId; // Use societyId (code) instead of _id

      // Fetch bill heads of category 'Other'
      const response = await fetch(`/api/BillHead-Api/get-bill-heads?societyId=${societyId}&category=Other`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch available charges');
      }

      const data = await response.json();
      setAvailableCharges(data.data || []);
    } catch (error) {
      console.error('Error fetching available charges:', error);
      setNotification({
        show: true,
        message: 'Failed to fetch available charges',
        type: 'error'
      });
    }
  };

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

  // Toggle resident selection for bulk generation
  const toggleResidentSelection = (residentId) => {
    if (selectedResidents.includes(residentId)) {
      setSelectedResidents(selectedResidents.filter(id => id !== residentId));
    } else {
      setSelectedResidents([...selectedResidents, residentId]);
    }
  };

  // Select or deselect all residents
  const toggleAllResidents = () => {
    if (selectedResidents.length === filteredResidents.length) {
      setSelectedResidents([]);
    } else {
      setSelectedResidents(filteredResidents.map(r => r._id));
    }
  };

  // Add handleSubmit function for individual bill generation
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!selectedBillHead || !showCalculation) {
      setNotification({
        show: true,
        message: 'Please select bill head and calculate amount first',
        type: 'error'
      });
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
      const billData = {
        ...formData,
        societyId: societyData.societyId,
        baseAmount: billCalculation.baseAmount,
        periodType: formData.periodType,  // Explicitly include period type
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
          chargeType: getValidChargeType(availableCharges.find(bh => bh._id === charge.billHeadId || bh.name === charge.chargeType)),
          amount: charge.amount,
          ledgerId: charge.ledgerId,
          unitUsage: charge.unitUsage,
          calculationType: charge.calculationType
        }))
      };

      console.log('Sending bill data:', billData);

      const response = await fetch('/api/MaintenanceBill-Api/generateBill', {
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

  // Update handleBulkGeneration function
  const handleBulkGeneration = async () => {
    // For bulk generation, only check if bill head is selected
    // For block/floor generation, check showResidentCalculation
    let calculationCheck = true;
    if (billGenerationType === 'individual') {
      calculationCheck = showCalculation;
    } else if (billGenerationType === 'block' || billGenerationType === 'floor') {
      calculationCheck = showResidentCalculation;
    }
    
    if (!selectedBillHead || !calculationCheck) {
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

      // Prepare bills data for bulk generation
      // Log the form data before preparing bills
      console.log('Form data before bulk generation:', formData);

      // Calculate base amount for maintenance bills (always fixed)
      const baseAmount = selectedBillHead.fixedAmount || 0;
      
      // Calculate GST details
      const gstDetails = selectedBillHead.gstConfig?.isGSTApplicable
        ? {
            cgstAmount: (baseAmount * selectedBillHead.gstConfig.cgstPercentage) / 100,
            sgstAmount: (baseAmount * selectedBillHead.gstConfig.sgstPercentage) / 100,
            igstAmount: (baseAmount * selectedBillHead.gstConfig.igstPercentage) / 100
          }
        : {
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 0
          };
      
      const totalGstAmount = gstDetails.cgstAmount + gstDetails.sgstAmount + gstDetails.igstAmount;
      const additionalChargesTotal = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
      const totalAmount = baseAmount + totalGstAmount + additionalChargesTotal;

      const billsData = residentsToProcess.map(resident => ({
        societyId: societyData.societyId,
        billHeadId: formData.billHeadId,
        residentId: resident._id,
        flatNumber: resident.flatDetails?.flatNumber || '',
        blockName: resident.flatDetails?.blockName || '',
        floorNumber: resident.flatDetails?.floorIndex || resident.flatDetails?.floorNumber || 0,
        ownerName: resident.name || '',
        ownerMobile: resident.phone || '',
        ownerEmail: resident.email || '',
        unitUsage: formData.unitUsage,
        periodType: formData.periodType,  // Add period type
        baseAmount: baseAmount,
        gstDetails: {
          isGSTApplicable: selectedBillHead.gstConfig?.isGSTApplicable || false,
          cgstAmount: gstDetails.cgstAmount,
          sgstAmount: gstDetails.sgstAmount,
          igstAmount: gstDetails.igstAmount,
          cgstPercentage: selectedBillHead.gstConfig?.cgstPercentage || 0,
          sgstPercentage: selectedBillHead.gstConfig?.sgstPercentage || 0,
          igstPercentage: selectedBillHead.gstConfig?.igstPercentage || 0
        },
        totalAmount: totalAmount,
        additionalCharges: additionalCharges.map(charge => ({
          billHeadId: charge.billHeadId,
          chargeType: getValidChargeType(availableCharges.find(bh => bh._id === charge.billHeadId || bh.name === charge.chargeType)),
          amount: charge.amount,
          ledgerId: charge.ledgerId,
          unitUsage: charge.unitUsage,
          calculationType: charge.calculationType
        })),
        issueDate: formData.issueDate,
        dueDate: formData.dueDate
      }));

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
        const response = await fetch('/api/MaintenanceBill-Api/generateBulkBills', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ bills: batchBills })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate bills');
        }

        const result = await response.json();
        successCount += result.results.success.length;
        failedCount += result.results.failed.length;
      }

      // Final progress update
      setBulkProgress(100);

      // Show completion notification
      setNotification({
        show: true,
        message: `Generated ${successCount} bills successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
        type: failedCount > 0 ? 'warning' : 'success'
      });

      // Refresh bills list
      fetchBills();

      // Close form after short delay
      setTimeout(() => {
        setShowForm(false);
        setIsGeneratingBulk(false);
      }, 2000);

    } catch (error) {
      console.error('Error in bulk generation:', error);
      setNotification({
        show: true,
        message: error.message || 'Failed to generate bills',
        type: 'error'
      });
      setIsGeneratingBulk(false);
    }
  };

  // Handle bill actions (view/pay)
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

  // Payment Modal component
  const PaymentModal = ({ bill, onClose }) => {
    if (!bill) return null;

    return (
      <PaymentEntryPopup
        bill={bill}
        onClose={onClose}
        onPaymentComplete={(data) => {
          setNotificationWithTimeout('Payment recorded successfully', 'success');
          fetchBills();
          onClose();
        }}
      />
    );
  };

  // Handle bill generation type selection
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
      periodType: formData.periodType, // Preserve the selected period type
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  // Render functions
  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold">Total Bills</h3>
        <p className="text-2xl">{summary?.totalBills || 0}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold">Total Amount</h3>
        <p className="text-2xl text-gray-600">₹{(summary?.totalAmount || 0).toFixed(2)}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold">Pending Amount</h3>
        <p className="text-2xl text-yellow-600">₹{(summary?.pendingAmount || 0).toFixed(2)}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold">Paid Amount</h3>
        <p className="text-2xl text-green-600">₹{(summary?.paidAmount || 0).toFixed(2)}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold">Overdue Amount</h3>
        <p className="text-2xl text-red-600">₹{(summary?.overdueAmount || 0).toFixed(2)}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold">Total GST</h3>
        <p className="text-2xl text-blue-600">₹{(summary?.totalGstCollected || 0).toFixed(2)}</p>
      </div>
    </div>
  );

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
            {maintenanceSubCategories.map((sub) => (
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
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
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
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          onClick={fetchBills}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );

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

  // Main render
  const permissions = usePermissions();
  if (!permissions.includes("manage_maintenance") && !permissions.includes("full_access")) {
    return <AccessDenied />;
  }

  if (loading) {
    return <PreloaderSociety />;
  }

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
      setNotification({
        show: true,
        message: 'This charge has already been added',
        type: 'warning'
      });
      e.target.value = ''; // Reset dropdown
      return;
    }

    setSelectedAdditionalCharge(billHead);

    // If it's a fixed amount bill head, automatically add the charge
    if (billHead.calculationType === 'Fixed') {
      const normalizedChargeType = getValidChargeType(billHead);
      const newCharge = {
        billHeadId: billHead._id,
        chargeType: normalizedChargeType,
        amount: billHead.fixedAmount,
        ledgerId: billHead.accountingConfig.incomeLedgerId,
        unitUsage: 1,
        calculationType: billHead.calculationType
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

      setSelectedAdditionalCharge(null); // Clear selection after adding
      e.target.value = ''; // Reset dropdown
    }
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
    let unitUsage = 1;

    // For fixed amount, no need to check for input
    if (selectedAdditionalCharge.calculationType === 'Fixed') {
      amount = selectedAdditionalCharge.fixedAmount;
    } else {
      // For PerUnit and Formula, check input element and value
      const inputElement = document.getElementById('additionalChargeUnits');
      if (!inputElement) {
        setNotification({
          show: true,
          message: 'Units input not found',
          type: 'error'
        });
        return;
      }

      unitUsage = parseFloat(inputElement.value);
      if (!unitUsage || isNaN(unitUsage)) {
        setNotification({
          show: true,
          message: 'Please enter valid units',
          type: 'error'
        });
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
            setNotification({
              show: true,
              message: 'Error calculating formula: ' + error.message,
              type: 'error'
            });
            return;
          }
          break;
      }
    }

    const normalizedChargeType = getValidChargeType(selectedAdditionalCharge);
    const newCharge = {
      billHeadId: selectedAdditionalCharge._id,
      chargeType: normalizedChargeType,
      amount,
      ledgerId: selectedAdditionalCharge.accountingConfig.incomeLedgerId,
      unitUsage,
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

  // Utility function to map bill head subCategory to valid enum values
  const getValidChargeType = (billHead) => {
    if (!billHead) return 'Miscellaneous';
    
    // Map subCategory to valid enum values
    const subCategoryToEnum = {
      'Processing Fees': 'Processing Fees',
      'Society Charges': 'Society Charges',
      'Platform Charges': 'Platform Charges',
      'Transfer Charges': 'Transfer Charges',
      'NOC Charges': 'NOC Charges',
      'Late Payment Charges': 'Late Payment Charges',
      'Legal Charges': 'Legal Charges',
      'Documentation Charges': 'Documentation Charges',
      'Administrative Charges': 'Administrative Charges',
      'Event Charges': 'Event Charges',
      'Other': 'Miscellaneous'
    };
    
    // Try to map by subCategory first
    if (billHead.subCategory && subCategoryToEnum[billHead.subCategory]) {
      return subCategoryToEnum[billHead.subCategory];
    }
    
    // Try to map by name as fallback
    if (billHead.name && subCategoryToEnum[billHead.name]) {
      return subCategoryToEnum[billHead.name];
    }
    
    // Default to Miscellaneous if no match found
    return 'Miscellaneous';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 shadow-lg border-b-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
              <Receipt className="mr-3" size={32} />
              Maintenance Bills
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto px-4 py-6">
        {renderSummaryCards()}

        {/* Action Buttons */}
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

        {/* Bill Generation Options Modal */}
        {showBillOptions && (
          <SelectionPopup
            isOpen={showBillOptions}
            onClose={() => setShowBillOptions(false)}
            onSelectType={handleBillGenerationTypeSelect}
            title="Generate Maintenance Bill For"
          />
        )}

        {/* Bill Generation Form */}
        {showForm && renderBillGenerationForm()}

        {/* Bill Details Modal */}
        {showBillDetailsModal && (
          <BillDetailsPopup
            bill={selectedBillForView}
            onClose={() => {
              setShowBillDetailsModal(false);
              setSelectedBillForView(null);
            }}
          />
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedBillForPayment && (
          <PaymentModal
            bill={{
              ...selectedBillForPayment,
              _modelName: 'MaintenanceBill',
              billHeadId: {
                ...selectedBillForPayment.billHeadId,
                category: 'Maintenance'
              }
            }}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedBillForPayment(null);
            }}
          />
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
    </div>
  );
}
