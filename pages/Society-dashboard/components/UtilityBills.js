import React, { useState, useEffect } from 'react';

export default function UtilityBills() {
  // States for UI
  const [activeTab, setActiveTab] = useState('generate');
  const [loading, setLoading] = useState(false);
  const [viewBillData, setViewBillData] = useState(null);
  const [summaryData, setSummaryData] = useState({
    totalBills: 0,
    totalAmount: 0,
    totalPaidAmount: 0,
    totalDueAmount: 0,
    totalPenalty: 0
  });

  // States for structure selection
  const [structuredResidents, setStructuredResidents] = useState({});
  const [openBlocks, setOpenBlocks] = useState({});
  const [openFloors, setOpenFloors] = useState({});
  const [openFlats, setOpenFlats] = useState({});
  const [residentList, setResidentList] = useState([]);

  // States for bill generation
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedFlat, setSelectedFlat] = useState('');
  const [selectedResident, setSelectedResident] = useState(null);
  const [utilityType, setUtilityType] = useState('');
  const [description, setDescription] = useState('');
  const [structureType, setStructureType] = useState('Block');
  const [unitUsage, setUnitUsage] = useState('');
  const [perUnitRate, setPerUnitRate] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [finePerDay, setFinePerDay] = useState('50');
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [newCharge, setNewCharge] = useState({ description: '', amount: '' });

  // States for bill history
  const [historyBlock, setHistoryBlock] = useState('');
  const [historyFloor, setHistoryFloor] = useState('');
  const [historyFlat, setHistoryFlat] = useState('');
  const [utilityTypeFilter, setUtilityTypeFilter] = useState('');
  const [billHistory, setBillHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);

  // Fetch residents on component mount
  useEffect(() => {
    const fetchResidents = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/Resident-Api/getAllResidents');
        if (response.ok) {
          const data = await response.json();
          setResidentList(data);
          organizeResidentsByStructure(data);
        } else {
          console.error('Failed to fetch residents');
        }
      } catch (error) {
        console.error('Error fetching residents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResidents();
  }, []);

  useEffect(() => {
    fetchBillSummary();
  }, []);
  // Fetch bill summary
  const fetchBillSummary = async () => {
    try {
      const response = await fetch('/api/UtilityBill-Api/getBills');
      if (response.ok) {
        const data = await response.json();
        // Calculate correct totals including penalties
        const summary = {
          totalBills: data.bills.length,
          totalAmount: data.bills.reduce((sum, bill) => sum +
            bill.baseAmount +
            (bill.additionalCharges?.reduce((acc, charge) => acc + charge.amount, 0) || 0) +
            (bill.penaltyAmount || 0), 0),
          totalPaidAmount: data.bills.filter(bill => bill.status === 'Paid')
            .reduce((sum, bill) => sum +
              bill.baseAmount +
              (bill.additionalCharges?.reduce((acc, charge) => acc + charge.amount, 0) || 0) +
              (bill.penaltyAmount || 0), 0),
          totalDueAmount: data.bills.filter(bill => bill.status !== 'Paid')
            .reduce((sum, bill) => sum +
              bill.baseAmount +
              (bill.additionalCharges?.reduce((acc, charge) => acc + charge.amount, 0) || 0) +
              (bill.penaltyAmount || 0), 0),
          totalPenalty: data.bills.reduce((sum, bill) => sum + (bill.penaltyAmount || 0), 0)
        };
        setSummaryData(summary);
        setBillHistory(data.bills);
        setFilteredHistory(data.bills);
      }
    } catch (error) {
      console.error('Error fetching bill summary:', error);
    }
  };

  // Filter history when history block/floor/flat or utilityType changes
  useEffect(() => {
    if (billHistory.length > 0) {
      let filtered = [...billHistory];

      if (historyBlock) {
        filtered = filtered.filter(bill => bill.blockName === historyBlock);
      }

      if (historyFloor) {
        filtered = filtered.filter(bill => bill.floorNumber === parseInt(historyFloor));
      }

      if (historyFlat) {
        filtered = filtered.filter(bill => bill.flatNumber === `${historyBlock}-${historyFlat}`);
      }

      if (utilityTypeFilter) {
        filtered = filtered.filter(bill => bill.utilityType === utilityTypeFilter);
      }

      setFilteredHistory(filtered);
    }
  }, [historyBlock, historyFloor, historyFlat, utilityTypeFilter, billHistory]);

  // Organize residents by block, floor and flat
  const organizeResidentsByStructure = (residents) => {
    const structure = {};
    const blockOpenState = {};
    const floorOpenState = {};
    const flatOpenState = {};

    if (residents.length > 0) {
      // Look for the first resident with flatDetails
      const residentWithFlatDetails = residents.find(r => r.flatDetails && r.flatDetails.structureType);
      if (residentWithFlatDetails && residentWithFlatDetails.flatDetails.structureType) {
        setStructureType(residentWithFlatDetails.flatDetails.structureType);
      }
      // If none found, keep the default 'Block'
    }
    residents.forEach(resident => {
      if (!resident.flatDetails || !resident.flatDetails.flatNumber) return;

      // Parse flat number format (e.g., "A-101" where A is block and 101 is flat number) 
      const flatNumberParts = resident.flatDetails.flatNumber.split('-');
      if (flatNumberParts.length !== 2) return;

      const blockName = flatNumberParts[0];
      const flatNumber = flatNumberParts[1];
      const floorNumber = flatNumber.substring(0, 1); // Assuming first digit of flat number is floor

      // Initialize block if it doesn't exist 
      if (!structure[blockName]) {
        structure[blockName] = {};
        blockOpenState[blockName] = false; // Default closed 
      }

      // Initialize floor if it doesn't exist 
      if (!structure[blockName][floorNumber]) {
        structure[blockName][floorNumber] = {};
        floorOpenState[`${blockName}-${floorNumber}`] = false; // Default closed 
      }

      // Initialize flat if it doesn't exist 
      if (!structure[blockName][floorNumber][flatNumber]) {
        structure[blockName][floorNumber][flatNumber] = [];
        flatOpenState[`${blockName}-${flatNumber}`] = false; // Default closed 
      }

      // Add resident to the flat 
      structure[blockName][floorNumber][flatNumber].push(resident);
    });

    // Set first block open 
    const blocks = Object.keys(structure).sort();
    if (blocks.length > 0) {
      const firstBlock = blocks[0];
      blockOpenState[firstBlock] = true;

      // Set first floor of first block open 
      const floors = Object.keys(structure[firstBlock]).sort();
      if (floors.length > 0) {
        const firstFloor = floors[0];
        floorOpenState[`${firstBlock}-${firstFloor}`] = true;

        // Set all flats in the first floor closed 
        Object.keys(structure[firstBlock][firstFloor]).forEach(flatNumber => {
          flatOpenState[`${firstBlock}-${flatNumber}`] = false;
        });
      }
    }

    setStructuredResidents(structure);
    setOpenBlocks(blockOpenState);
    setOpenFloors(floorOpenState);
    setOpenFlats(flatOpenState);
  };

  // Toggle functions for dropdowns 
  const toggleBlock = (blockName) => {
    setOpenBlocks(prev => ({ ...prev, [blockName]: !prev[blockName] }));
  };

  const toggleFloor = (blockFloorKey) => {
    setOpenFloors(prev => ({ ...prev, [blockFloorKey]: !prev[blockFloorKey] }));
  };

  const toggleFlat = (flatKey) => {
    setOpenFlats(prev => ({ ...prev, [flatKey]: !prev[flatKey] }));
  };

  // Handle resident selection
  const selectResident = (resident, block, floor, flat) => {
    setSelectedBlock(block);
    setSelectedFloor(floor);
    setSelectedFlat(flat);
    setSelectedResident(resident);
  };

  // Handle history selection
  const selectHistoryStructure = (block, floor, flat) => {
    setHistoryBlock(block);
    setHistoryFloor(floor);
    setHistoryFlat(flat);
  };

  // Calculate base amount
  const calculateBaseAmount = () => {
    const usage = parseFloat(unitUsage) || 0;
    const rate = parseFloat(perUnitRate) || 0;
    return usage * rate;
  };

  // Add an additional charge
  const addAdditionalCharge = () => {
    if (newCharge.description && newCharge.amount) {
      setAdditionalCharges([
        ...additionalCharges,
        {
          description: newCharge.description,
          amount: parseFloat(newCharge.amount)
        }
      ]);
      setNewCharge({ description: '', amount: '' });
    }
  };

  // Remove an additional charge
  const removeAdditionalCharge = (index) => {
    setAdditionalCharges(additionalCharges.filter((_, i) => i !== index));
  };

  // Calculate total amount
  const calculateTotal = () => {
    const baseAmount = calculateBaseAmount();
    const additionalTotal = additionalCharges.reduce((sum, charge) => sum + parseFloat(charge.amount), 0);
    return baseAmount + additionalTotal;
  };

  // Handle bill generation form submission
  const handleBillGeneration = async (e) => {
    e.preventDefault();

    if (!selectedResident) {
      alert('Please select a resident first');
      return;
    }

    if (!utilityType || !unitUsage || !perUnitRate || !dueDate) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      const baseAmount = calculateBaseAmount();

      const newBill = {
        societyId: selectedResident.societyId,
        flatNumber: `${selectedBlock}-${selectedFlat}`,
        blockName: selectedBlock,
        floorNumber: parseInt(selectedFloor),
        residentId: selectedResident._id,
        ownerName: selectedResident.name,
        ownerMobile: selectedResident.phone,
        ownerEmail: selectedResident.email,
        utilityType,
        description,
        unitUsage: parseFloat(unitUsage),
        perUnitRate: parseFloat(perUnitRate),
        baseAmount,
        additionalCharges,
        issueDate,
        dueDate,
        finePerDay: parseFloat(finePerDay),
        penaltyAmount: 0,
        status: 'Pending'
      };

      const response = await fetch('/api/UtilityBill-Api/generateBill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBill),
      });

      if (response.ok) {
        alert('Utility bill generated successfully');
        resetForm();
        fetchBillSummary();

        // Refresh bill history
        const historyResponse = await fetch('/api/UtilityBill-Api/getBills');
        if (historyResponse.ok) {
          const data = await historyResponse.json();
          setBillHistory(data.bills);
          setFilteredHistory(data.bills);
        }
      } else {
        alert('Failed to generate bill');
      }
    } catch (error) {
      console.error('Error generating bill:', error);
      alert('Error generating bill');
    } finally {
      setLoading(false);
    }
  };
  const handleMarkAsPaid = async (billId) => {
    if (!confirm('Are you sure you want to mark this bill as paid?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/UtilityBill-Api/updateBillStatus/${billId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Paid' }),
      });

      if (response.ok) {
        alert('Bill marked as paid');
        fetchBillSummary();

        // Refresh bill history
        const historyResponse = await fetch('/api/UtilityBill-Api/getBills');
        if (historyResponse.ok) {
          const data = await historyResponse.json();
          setBillHistory(data.bills);
          setFilteredHistory(data.bills);
          setSummaryData(data.summary);
        }
      } else {
        alert('Failed to update bill status');
      }
    } catch (error) {
      console.error('Error updating bill status:', error);
      alert('Error updating bill status');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBill = async (billId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/UtilityBill-Api/getBill/${billId}`);
      if (response.ok) {
        const data = await response.json();
        setViewBillData(data);
      } else {
        alert('Failed to fetch bill details');
      }
    } catch (error) {
      console.error('Error fetching bill details:', error);
      alert('Error fetching bill details');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedBlock('');
    setSelectedFloor('');
    setSelectedFlat('');
    setSelectedResident(null);
    setUtilityType('');
    setDescription('');
    setUnitUsage('');
    setPerUnitRate('');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setFinePerDay('50');
    setAdditionalCharges([]);
    setNewCharge({ description: '', amount: '' });
  };

  // Get unit label based on utility type
  const getUnitLabel = () => {
    switch (utilityType) {
      case 'Electricity':
        return 'kWh';
      case 'Water':
        return 'Liters';
      case 'Gas':
        return 'm³';
      default:
        return 'Units';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Utility Bills</h1>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Bills</p>
            <p className="text-2xl font-bold text-gray-900">{summaryData.totalBills}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-2xl font-bold text-blue-600">₹{summaryData.totalAmount?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Paid Amount</p>
            <p className="text-2xl font-bold text-green-600">₹{summaryData.totalPaidAmount?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Due Amount</p>
            <p className="text-2xl font-bold text-amber-600">₹{summaryData.totalDueAmount?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Penalty Amount</p>
            <p className="text-2xl font-bold text-red-600">₹{summaryData.totalPenalty?.toLocaleString() || 0}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'generate' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('generate')}
          >
            Generate Bill
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('history')}
          >
            Bill History
          </button>
        </div>

        {/* Generate Bill Tab */}
        {activeTab === 'generate' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Resident Selector */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Resident</h2>

              {loading ? (
                <div className="flex justify-center p-4">
                  <p>Loading residents...</p>
                </div>
              ) : (
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
              )}
            </div>

            {/* Bill Generation Form */}
            <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate New Utility Bill</h2>

              {selectedResident ? (
                <form onSubmit={handleBillGeneration}>
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

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Utility Type *</label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={utilityType}
                        onChange={(e) => setUtilityType(e.target.value)}
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="Electricity">Electricity</option>
                        <option value="Water">Water</option>
                        <option value="Gas">Gas</option>
                        <option value="Internet">Internet</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                      <input
                        type="date"
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Units Used ({utilityType ? getUnitLabel() : 'Units'}) *
                      </label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={unitUsage}
                        onChange={(e) => setUnitUsage(e.target.value)}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rate per Unit (₹) *</label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={perUnitRate}
                        onChange={(e) => setPerUnitRate(e.target.value)}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                      <input
                        type="date"
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fine Per Day (₹)</label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={finePerDay}
                        onChange={(e) => setFinePerDay(e.target.value)}
                        min="0"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="3"
                      ></textarea>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-medium text-gray-900">Bill Details</h3>
                      <div className="text-md font-medium text-gray-900">
                        Base Amount: ₹{calculateBaseAmount().toFixed(2)}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-md mb-4">
                      <h3 className="text-md font-medium text-gray-900 mb-2">Additional Charges</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            placeholder="Description"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            value={newCharge.description}
                            onChange={(e) => setNewCharge({ ...newCharge, description: e.target.value })}
                          />
                        </div>
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            placeholder="Amount"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            value={newCharge.amount}
                            onChange={(e) => setNewCharge({ ...newCharge, amount: e.target.value })}
                            min="0"
                            step="0.01"
                          />
                          <button
                            type="button"
                            className="bg-blue-500 text-white px-3 py-2 rounded-md"
                            onClick={addAdditionalCharge}
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {additionalCharges.length > 0 && (
                        <div className="border rounded-md overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {additionalCharges.map((charge, index) => (
                                <tr key={index}>
                                  <td className="px-3 py-2 text-sm text-gray-900">{charge.description}</td>
                                  <td className="px-3 py-2 text-sm text-gray-900 text-right">₹{charge.amount}</td>
                                  <td className="px-3 py-2 text-right">
                                    <button
                                      type="button"
                                      className="text-red-500 hover:text-red-700"
                                      onClick={() => removeAdditionalCharge(index)}
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="bg-blue-50 p-4 rounded-md">
                      <div className="flex justify-between text-lg font-medium">
                        <span>Total Amount:</span>
                        <span>₹{calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700"
                      onClick={resetForm}
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                      disabled={loading}
                    >
                      {loading ? 'Generating...' : 'Generate Bill'}
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
        )}

        {/* Bill History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Utility Bill History</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Utility Type</label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={utilityTypeFilter}
                    onChange={(e) => setUtilityTypeFilter(e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Water">Water</option>
                    <option value="Gas">Gas</option>
                    <option value="Internet">Internet</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredHistory.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bill ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resident
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {structureType} - Flat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utility Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Issue Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredHistory.map((bill) => (
                      <tr key={bill._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {bill._id.substring(bill._id.length - 6).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{bill.ownerName}</div>
                          <div className="text-sm text-gray-500">{bill.ownerMobile}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {bill.flatNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${bill.utilityType === 'Electricity' ? 'bg-yellow-100 text-yellow-800' :
                              bill.utilityType === 'Water' ? 'bg-blue-100 text-blue-800' :
                                bill.utilityType === 'Gas' ? 'bg-red-100 text-red-800' :
                                  bill.utilityType === 'Internet' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'}`}
                          >
                            {bill.utilityType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(bill.issueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(bill.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ₹{(
                              bill.baseAmount +
                              (bill.additionalCharges?.reduce((sum, charge) => sum + charge.amount, 0) || 0) +
                              (bill.penaltyAmount || 0)
                            ).toFixed(2)}
                          </div>
                          {bill.penaltyAmount > 0 && (
                            <div className="text-xs text-red-500">(includes ₹{bill.penaltyAmount.toFixed(2)} penalty)</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${bill.status === 'Paid' ? 'bg-green-100 text-green-800' :
                              bill.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                                'bg-amber-100 text-amber-800'}`}
                          >
                            {bill.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            onClick={() => handleViewBill(bill._id)}
                          >
                            View
                          </button>
                          {bill.status !== 'Paid' && (
                            <button
                              className="text-green-600 hover:text-green-900"
                              onClick={() => handleMarkAsPaid(bill._id)}
                            >
                              Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No bills found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* View Bill Modal */}
      {viewBillData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-90vh overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Bill Details</h2>
                <button
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => setViewBillData(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Resident Information</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{viewBillData.ownerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Mobile</p>
                      <p className="font-medium">{viewBillData.ownerMobile}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{viewBillData.ownerEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Flat</p>
                      <p className="font-medium">{viewBillData.flatNumber}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Bill Information</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-500">Bill ID</p>
                      <p className="font-medium">
                        {viewBillData && viewBillData._id
                          ? viewBillData._id.substring(viewBillData._id.length - 6).toUpperCase()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Utility Type</p>
                      <p className="font-medium">{viewBillData?.utilityType || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Issue Date</p>
                      <p className="font-medium">
                        {viewBillData?.issueDate
                          ? new Date(viewBillData.issueDate).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Due Date</p>
                      <p className="font-medium">
                        {viewBillData?.dueDate
                          ? new Date(viewBillData.dueDate).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className={`font-medium ${viewBillData?.status === 'Paid' ? 'text-green-600' :
                        viewBillData?.status === 'Overdue' ? 'text-red-600' :
                          'text-amber-600'
                        }`}>
                        {viewBillData?.status || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Details</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Units Used</p>
                      <p className="font-medium">{viewBillData.unitUsage} {
                        viewBillData.utilityType === 'Electricity' ? 'kWh' :
                          viewBillData.utilityType === 'Water' ? 'Liters' :
                            viewBillData.utilityType === 'Gas' ? 'm³' : 'Units'
                      }</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Rate per Unit</p>
                      <p className="font-medium">
                        ₹{viewBillData?.perUnitRate !== undefined
                          ? viewBillData.perUnitRate.toFixed(2)
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Base Amount</p>
                      <p className="font-medium">
                        ₹{viewBillData?.baseAmount !== undefined
                          ? viewBillData.baseAmount.toFixed(2)
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {viewBillData.additionalCharges.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Charges</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {viewBillData.additionalCharges.map((charge, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm text-gray-900">{charge.description}</td>
                            <td className="px-3 py-2 text-sm text-gray-900 text-right">₹{charge.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h3>
                <div className="bg-blue-50 p-4 rounded-md">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-600">Base Amount</p>
                      <p className="font-medium">₹{viewBillData.baseAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Additional Charges</p>
                      <p className="font-medium">₹{viewBillData.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0).toFixed(2)}</p>
                    </div>
                    {viewBillData.penaltyAmount > 0 && (
                      <div>
                        <p className="text-sm text-gray-600">Penalty Amount</p>
                        <p className="font-medium text-red-600">₹{viewBillData.penaltyAmount.toFixed(2)}</p>
                      </div>
                    )}
                    <div className="md:col-span-2 pt-2 mt-2 border-t border-blue-200">
                      <div className="flex justify-between text-lg font-medium">
                        <span>Total Amount:</span>
                        <span>₹{(viewBillData.baseAmount + viewBillData.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0) + viewBillData.penaltyAmount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {viewBillData.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-700">{viewBillData.description}</p>
                  </div>
                </div>
              )}

              {viewBillData.status !== 'Paid' && (
                <div className="flex justify-end">
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    onClick={() => {
                      handleMarkAsPaid(viewBillData._id);
                      setViewBillData(null);
                    }}
                  >
                    Mark as Paid
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}