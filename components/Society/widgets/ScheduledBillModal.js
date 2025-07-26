import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, Settings, Building, Home, User, Calculator } from 'lucide-react';
import { BlockSelector, FloorSelector, SelectionPopup } from './';
import { useRouter } from 'next/router';

export default function ScheduledBillModal({ 
  isOpen, 
  onClose, 
  billHeads, 
  selectedBill = null,
  onSubmit 
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    billHeadId: '',
    frequency: 'Monthly',
    customFrequencyDays: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    dueDays: 15,
    unitUsage: '',
    periodType: 'Monthly',
    baseAmount: 0,
    totalAmount: 0,
    selectedResidents: []
  });

  const [selectedBillHead, setSelectedBillHead] = useState(null);
  const [showCalculation, setShowCalculation] = useState(false);
  const [billCalculation, setBillCalculation] = useState({
    baseAmount: 0,
    gstDetails: {
      isGSTApplicable: false,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      total: 0
    },
    totalAmount: 0
  });

  // Resident selection states
  const [structuredResidents, setStructuredResidents] = useState({});
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedResidents, setSelectedResidents] = useState([]);
  const [showSelectionPopup, setShowSelectionPopup] = useState(true);
  const [selectionType, setSelectionType] = useState('');

  // Add new state for late payment details
  const [latePaymentDetails, setLatePaymentDetails] = useState({
    isApplicable: false,
    gracePeriodDays: 0,
    chargeType: 'Fixed',
    chargeValue: 0,
    compoundingFrequency: 'Monthly'
  });

  const router = useRouter();

  useEffect(() => {
    if (selectedBill) {
      setFormData({
        ...selectedBill,
        billHeadId: selectedBill.billHeadId._id
      });
      setSelectedBillHead(billHeads.find(bh => bh._id === selectedBill.billHeadId._id));
      setShowCalculation(true);
      setBillCalculation({
        baseAmount: selectedBill.baseAmount,
        gstDetails: selectedBill.gstDetails,
        totalAmount: selectedBill.totalAmount
      });
      setShowSelectionPopup(false);

      // Load existing selected residents
      if (selectedBill.selectedResidents && selectedBill.selectedResidents.length > 0) {
        setSelectedResidents(selectedBill.selectedResidents);
        setFormData(prev => ({
          ...prev,
          selectedResidents: selectedBill.selectedResidents
        }));

        // Determine selection type based on existing data
        const residents = selectedBill.selectedResidents;
        if (residents.length > 0) {
          const uniqueBlocks = [...new Set(residents.map(r => r.blockName))];
          const uniqueFloors = [...new Set(residents.map(r => r.floorNumber))];
          
          if (uniqueBlocks.length === 1 && uniqueFloors.length === 1) {
            // Single block and floor - could be floor selection
            setSelectionType('floor');
            setSelectedBlock(uniqueBlocks[0]);
            setSelectedFloor(uniqueFloors[0]);
          } else if (uniqueBlocks.length === 1) {
            // Single block - block selection
            setSelectionType('block');
            setSelectedBlock(uniqueBlocks[0]);
          } else {
            // Individual selection (default for mixed selections)
            setSelectionType('individual');
          }
        } else {
          // No residents selected
          setSelectionType('');
        }
      }

      // Set late payment details from bill head
      if (selectedBill.latePaymentConfig) {
        setLatePaymentDetails({
          isApplicable: selectedBill.latePaymentConfig.isLatePaymentChargeApplicable,
          gracePeriodDays: selectedBill.latePaymentConfig.gracePeriodDays,
          chargeType: selectedBill.latePaymentConfig.chargeType,
          chargeValue: selectedBill.latePaymentConfig.chargeValue,
          compoundingFrequency: selectedBill.latePaymentConfig.compoundingFrequency
        });
      }
    }
    fetchResidents();
  }, [selectedBill, billHeads]);

  const fetchResidents = async () => {
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

      // Then fetch residents
      const response = await fetch(`/api/Resident-Api/get-society-residents?societyId=${societyData.societyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch residents');
      }

      const result = await response.json();
      const residentsArray = result.residents || [];
      setStructuredResidents(structureResidentsData(residentsArray));
    } catch (error) {
      console.error('Error fetching residents:', error);
    }
  };

  const structureResidentsData = (residentsArray) => {
    const structured = {};
    
    // Filter out residents without flatDetails
    const residentsWithFlats = residentsArray.filter(resident => 
      resident.flatDetails && resident.flatDetails.blockName && resident.flatDetails.flatNumber
    );
    
    residentsWithFlats.forEach(resident => {
      const flatDetails = resident.flatDetails || {};
      const blockName = flatDetails.blockName || 'Unassigned';
      const floorNumber = flatDetails.floorIndex?.toString() || flatDetails.floorNumber?.toString() || 'Ground';
      const flatNumber = flatDetails.flatNumber || 'Unassigned';

      if (!structured[blockName]) {
        structured[blockName] = {};
      }
      if (!structured[blockName][floorNumber]) {
        structured[blockName][floorNumber] = {};
      }
      if (!structured[blockName][floorNumber][flatNumber]) {
        structured[blockName][floorNumber][flatNumber] = [];
      }

      structured[blockName][floorNumber][flatNumber].push({
        _id: resident._id,
        name: resident.name,
        phone: resident.phone,
        email: resident.email,
        flatDetails: resident.flatDetails
      });
    });

    return structured;
  };

  const handleBillHeadChange = (e) => {
    const billHeadId = e.target.value;
    const billHead = billHeads.find(bh => bh._id === billHeadId);
    
    setSelectedBillHead(billHead);
    setFormData(prev => ({
      ...prev,
      billHeadId,
      unitUsage: billHead?.calculationType === 'Fixed' ? '1' : '',
      baseAmount: billHead?.calculationType === 'Fixed' ? billHead.fixedAmount : 0
    }));

    // Set late payment details from bill head
    if (billHead?.latePaymentConfig) {
      setLatePaymentDetails({
        isApplicable: billHead.latePaymentConfig.isLatePaymentChargeApplicable,
        gracePeriodDays: billHead.latePaymentConfig.gracePeriodDays,
        chargeType: billHead.latePaymentConfig.chargeType,
        chargeValue: billHead.latePaymentConfig.chargeValue,
        compoundingFrequency: billHead.latePaymentConfig.compoundingFrequency
      });
    }

    // If Fixed calculation type, automatically calculate amount
    if (billHead?.calculationType === 'Fixed') {
      setTimeout(() => {
        const baseAmount = billHead.fixedAmount;
        const gstDetails = {
          isGSTApplicable: billHead.gstConfig?.isGSTApplicable || false,
          cgstPercentage: billHead.gstConfig?.cgstPercentage || 0,
          sgstPercentage: billHead.gstConfig?.sgstPercentage || 0,
          igstPercentage: billHead.gstConfig?.igstPercentage || 0,
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

        const totalAmount = baseAmount + gstDetails.total;

        setBillCalculation({
          baseAmount,
          gstDetails,
          totalAmount
        });

        setFormData(prev => ({
          ...prev,
          baseAmount,
          totalAmount,
          gstDetails
        }));

        setShowCalculation(true);
      }, 100);
    } else {
      setShowCalculation(false);
    }
  };

  const calculateAmount = () => {
    if (!selectedBillHead) return;

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
          return;
        }
        break;
    }

    // Calculate GST
    const gstDetails = {
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

    const totalAmount = baseAmount + gstDetails.total;

    setBillCalculation({
      baseAmount,
      gstDetails,
      totalAmount
    });

    setFormData(prev => ({
      ...prev,
      baseAmount,
      totalAmount,
      gstDetails
    }));

    setShowCalculation(true);
  };

  const handleResidentSelect = (resident, block, floor, flat) => {
    const residentData = {
      residentId: resident._id,
      flatNumber: flat,
      blockName: block,
      floorNumber: floor,
      ownerName: resident.name,
      ownerMobile: resident.phone,
      ownerEmail: resident.email
    };

    if (selectionType === 'individual') {
      // For individual selection, replace all residents
      setSelectedResidents([residentData]);
    } else {
      // For block/floor selection, toggle the resident
      setSelectedResidents(prev => {
        const exists = prev.some(r => r.residentId === resident._id);
        if (exists) {
          return prev.filter(r => r.residentId !== resident._id);
        }
        return [...prev, residentData];
      });
    }
  };

  const handleSelectionTypeSelect = (type) => {
    setSelectionType(type);
    setShowSelectionPopup(false);
    setSelectedBlock('');
    setSelectedFloor('');
    setSelectedResidents([]);

    if (type === 'bulk') {
      // For bulk, select all residents from structured data
      const allResidents = [];
      Object.entries(structuredResidents).forEach(([block, floors]) => {
        Object.entries(floors).forEach(([floor, flats]) => {
          Object.entries(flats).forEach(([flat, residents]) => {
            residents.forEach(resident => {
              allResidents.push({
                residentId: resident._id,
                flatNumber: flat,
                blockName: block,
                floorNumber: floor,
                ownerName: resident.name,
                ownerMobile: resident.phone,
                ownerEmail: resident.email
              });
            });
          });
        });
      });
      setSelectedResidents(allResidents);
    }
  };

  const handleBlockSelect = (blockName) => {
    setSelectedBlock(blockName);
    setSelectedFloor('');

    if (selectionType === 'block') {
      // Select all residents in the block
      const blockResidents = [];
      Object.entries(structuredResidents[blockName] || {}).forEach(([floor, flats]) => {
        Object.entries(flats).forEach(([flat, residents]) => {
          residents.forEach(resident => {
            blockResidents.push({
              residentId: resident._id,
              flatNumber: flat,
              blockName: blockName,
              floorNumber: floor,
              ownerName: resident.name,
              ownerMobile: resident.phone,
              ownerEmail: resident.email
            });
          });
        });
      });
      setSelectedResidents(blockResidents);
    }
  };

  const handleFloorSelect = (floorNumber) => {
    setSelectedFloor(floorNumber);

    if (selectionType === 'floor') {
      // Select all residents in the floor
      const floorResidents = [];
      Object.entries(structuredResidents[selectedBlock][floorNumber] || {}).forEach(([flat, residents]) => {
        residents.forEach(resident => {
          floorResidents.push({
            residentId: resident._id,
            flatNumber: flat,
            blockName: selectedBlock,
            floorNumber: floorNumber,
            ownerName: resident.name,
            ownerMobile: resident.phone,
            ownerEmail: resident.email
          });
        });
      });
      setSelectedResidents(floorResidents);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!showCalculation) {
      alert('Please calculate amounts first');
      return;
    }

    if (selectedResidents.length === 0) {
      alert('Please select at least one resident');
      return;
    }

    const submitData = {
      ...formData,
      selectedResidents,
      baseAmount: billCalculation.baseAmount,
      gstDetails: billCalculation.gstDetails,
      totalAmount: billCalculation.totalAmount
    };

    onSubmit(submitData);
  };

  if (!isOpen) return null;

  if (showSelectionPopup) {
    return (
      <SelectionPopup
        isOpen={true}
        onClose={onClose}
        onSelectType={handleSelectionTypeSelect}
        title="Schedule Bills For"
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center overflow-y-auto p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl my-4">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
          <h2 className="text-xl font-semibold">
            {selectedBill ? 'Edit Scheduled Bill' : 'Create Scheduled Bill'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Panel - Resident Selection */}
          <div className="bg-gray-50 p-4 rounded-lg max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Select Residents</h3>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800 text-sm"
                onClick={() => setShowSelectionPopup(true)}
              >
                Change Selection Type
              </button>
            </div>

            {selectionType !== 'bulk' && (
              <>
                <BlockSelector
                  structuredResidents={structuredResidents}
                  selectedBlock={selectedBlock}
                  onSelectBlock={handleBlockSelect}
                />
                {selectedBlock && (selectionType === 'floor' || selectionType === 'individual') && (
                  <FloorSelector
                    structuredResidents={structuredResidents}
                    selectedBlock={selectedBlock}
                    selectedFloor={selectedFloor}
                    onSelectBlock={handleBlockSelect}
                    onSelectFloor={handleFloorSelect}
                  />
                )}
              </>
            )}

            {/* Display residents for selection */}
            {selectionType === 'individual' && selectedBlock && selectedFloor && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Select Resident</h4>
                <div className="max-h-60 overflow-y-auto">
                  {Object.entries(structuredResidents[selectedBlock][selectedFloor] || {}).map(([flat, residents]) => (
                    <div key={flat} className="mb-2">
                      <div className="font-medium">Flat {flat}</div>
                      {residents.map(resident => (
                        <div
                          key={resident._id}
                          className={`p-2 cursor-pointer rounded ${
                            selectedResidents.some(r => r.residentId === resident._id)
                              ? 'bg-blue-100'
                              : 'hover:bg-gray-100'
                          }`}
                          onClick={() => handleResidentSelect(resident, selectedBlock, selectedFloor, flat)}
                        >
                          <div>{resident.name}</div>
                          <div className="text-sm text-gray-500">{resident.phone}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selection Summary */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Selection Summary</h4>
              <div className="text-blue-600">
                <p>Selected: {selectedResidents.length} residents</p>
                {selectedBlock && <p>Block: {selectedBlock}</p>}
                {selectedFloor && <p>Floor: {selectedFloor}</p>}
              </div>
            </div>
          </div>

          {/* Right Panel - Bill Details */}
          <div className="md:col-span-2 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
            {/* Basic Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bill Head</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={formData.billHeadId}
                  onChange={handleBillHeadChange}
                  required
                >
                  <option value="">Select Bill Head</option>
                  {billHeads.map(bh => (
                    <option key={bh._id} value={bh._id}>
                      {bh.name} ({bh.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Schedule Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Frequency</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={formData.frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                  required
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="HalfYearly">Half Yearly</option>
                  <option value="Yearly">Yearly</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
              {formData.frequency === 'Custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Days Interval</label>
                  <input
                    type="number"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={formData.customFrequencyDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, customFrequencyDays: e.target.value }))}
                    min="1"
                    required
                  />
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
                <input
                  type="date"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Days</label>
                <input
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={formData.dueDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDays: e.target.value }))}
                  min="1"
                  required
                />
              </div>
            </div>

            {/* Bill Calculation */}
            {selectedBillHead && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Period Type</label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={formData.periodType}
                    onChange={(e) => setFormData(prev => ({ ...prev, periodType: e.target.value }))}
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

                {/* Show calculation details for Fixed type */}
                {selectedBillHead.calculationType === 'Fixed' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">
                      Fixed Amount: ₹{selectedBillHead.fixedAmount}
                    </div>
                  </div>
                )}

                {/* Show input field for PerUnit and Formula types */}
                {selectedBillHead.calculationType !== 'Fixed' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {selectedBillHead.calculationType === 'PerUnit' ? 'Units Used' : 'Formula Input'}
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        value={formData.unitUsage}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, unitUsage: e.target.value }));
                          setShowCalculation(false);
                        }}
                        min="0"
                        step="0.01"
                        required
                      />
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
                  </div>
                )}

                {/* Late Payment Details */}
                {latePaymentDetails.isApplicable && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">Late Payment Charges</h4>
                    <div className="space-y-2 text-sm text-yellow-700">
                      <p>Grace Period: {latePaymentDetails.gracePeriodDays} days</p>
                      <p>
                        Charge: {latePaymentDetails.chargeValue}
                        {latePaymentDetails.chargeType === 'Percentage' ? '%' : '₹'}
                      </p>
                      <p>Compounding: {latePaymentDetails.compoundingFrequency}</p>
                    </div>
                  </div>
                )}

                {/* Calculate button only for non-Fixed types */}
                {selectedBillHead.calculationType !== 'Fixed' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
                      onClick={calculateAmount}
                    >
                      <Calculator className="w-5 h-5 mr-2" />
                      Calculate Amount
                    </button>
                  </div>
                )}

                {/* Show calculation results */}
                {showCalculation && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Base Amount:</span>
                      <span>₹{billCalculation.baseAmount.toFixed(2)}</span>
                    </div>
                    {billCalculation.gstDetails.isGSTApplicable && (
                      <>
                        <div className="flex justify-between">
                          <span>CGST ({billCalculation.gstDetails.cgstPercentage}%):</span>
                          <span>₹{billCalculation.gstDetails.cgstAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SGST ({billCalculation.gstDetails.sgstPercentage}%):</span>
                          <span>₹{billCalculation.gstDetails.sgstAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>IGST ({billCalculation.gstDetails.igstPercentage}%):</span>
                          <span>₹{billCalculation.gstDetails.igstAmount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total Amount:</span>
                      <span>₹{billCalculation.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows="3"
              />
            </div>

            {/* Selected Residents Summary */}
            {selectedResidents.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Selected Residents</h4>
                <p className="text-blue-600">{selectedResidents.length} residents selected</p>
              </div>
            )}

            {/* Form Actions - Make sticky at bottom */}
            <div className="sticky bottom-0 bg-white pt-4 mt-4 border-t flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                disabled={!showCalculation || selectedResidents.length === 0}
              >
                {selectedBill ? 'Update' : 'Create'} Schedule
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 