// pages/maintenance-bills.js
import React, { useState, useEffect } from 'react';
import PreloaderSociety from '../../components/PreloaderSociety';
import { Building, Receipt } from 'lucide-react';
import { useRouter } from 'next/router';

export default function MaintenanceBills() {
  const router = useRouter();
  // States for UI
  const [activeTab, setActiveTab] = useState('generate');
  const [loading, setLoading] = useState(false);
  const [billTypeFilter, setBillTypeFilter] = useState('');
  const [summaryData, setSummaryData] = useState({
    totalBills: 0,
    totalAmount: 0,
    totalPaidAmount: 0,
    totalDueAmount: 0,
    totalPenalty: 0
  });

  // Add states for bulk bill generation
  const [bulkBillType, setBulkBillType] = useState('');
  const [bulkDescription, setBulkDescription] = useState('');
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkIssueDate, setBulkIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkDueDate, setBulkDueDate] = useState('');
  const [bulkFinePerDay, setBulkFinePerDay] = useState('50');
  const [selectedResidents, setSelectedResidents] = useState([]);
  const [bulkFilter, setBulkFilter] = useState({ block: '', floor: '' });
  const [filteredResidents, setFilteredResidents] = useState([]);

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
  const [billHeadId, setBillHeadId] = useState('');
  const [billHeads, setBillHeads] = useState([]);
  const [description, setDescription] = useState('');
  const [structureType, setStructureType] = useState('Block');
  const [amount, setAmount] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [finePerDay, setFinePerDay] = useState('50');
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [newCharge, setNewCharge] = useState({ description: '', amount: '' });
  const [selectedBillHead, setSelectedBillHead] = useState(null);

  // States for bill history
  const [historyBlock, setHistoryBlock] = useState('');
  const [historyFloor, setHistoryFloor] = useState('');
  const [historyFlat, setHistoryFlat] = useState('');
  const [billHistory, setBillHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);

  // Fetch society details and residents on component mount
  useEffect(() => {
    const fetchSocietyAndResidents = async () => {
      setLoading(true);
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
        console.log('Society Data:', societyData); // Add this log
        const societyCode = societyData.societyId;  // Add this line
        const societyId = societyData._id; // Change this line to use _id instead of societyId

        // Fetch both residents and bill heads in parallel
        await Promise.all([
          (async () => {
            const residentsResponse = await fetch(`/api/Resident-Api/getAllResidents?societyId=${societyId}`);
            if (residentsResponse.ok) {
              const data = await residentsResponse.json();
              setResidentList(data);
              organizeResidentsByStructure(data);
            }
          })(),
          fetchBillHeads(societyId)
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSocietyAndResidents();
  }, [router]);

  // Fetch bill summary
  useEffect(() => {
    const fetchBillSummary = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('Society');
        console.log('Token from localStorage:', token ? 'Present' : 'Missing');
        
        if (!token) {
          router.push('/societyLogin');
          return;
        }

        // Get society details first
        console.log('Fetching society details...');
        const societyResponse = await fetch('/api/Society-Api/get-society-details', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!societyResponse.ok) {
          const errorData = await societyResponse.json();
          console.error('Society API error:', errorData);
          throw new Error('Failed to fetch society details');
        }

        const societyData = await societyResponse.json();
        console.log('Society Data:', societyData);
        const societyCode = societyData.societyId;  // Add this line
        const societyId = societyData._id;

        // Then fetch bills for this society
        const billsUrl = `/api/MaintenanceBill-Api/getBills?societyId=${societyId}`;
        console.log('Fetching bills from:', billsUrl);
        
        const response = await fetch(billsUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Bills API error:', errorData);
          throw new Error(`Failed to fetch bills: ${errorData.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('Bills API Response:', data);

        if (!data || !Array.isArray(data.bills)) {
          console.error('Invalid bills data:', data);
          throw new Error('Invalid bills data received');
        }

        // Calculate correct totals using the correct property names
        const summary = {
          totalBills: data.bills.length,
          totalAmount: data.bills.reduce((sum, bill) => sum + 
            (bill.baseAmount || 0) + 
            (bill.additionalCharges?.reduce((acc, charge) => acc + charge.amount, 0) || 0) +
            (bill.penaltyAmount || 0), 0),
          totalPaidAmount: data.bills.filter(bill => bill.status === 'Paid')
            .reduce((sum, bill) => sum + 
              (bill.baseAmount || 0) + 
              (bill.additionalCharges?.reduce((acc, charge) => acc + charge.amount, 0) || 0) +
              (bill.penaltyAmount || 0), 0),
          totalDueAmount: data.bills.filter(bill => bill.status !== 'Paid')
            .reduce((sum, bill) => sum + 
              (bill.baseAmount || 0) + 
              (bill.additionalCharges?.reduce((acc, charge) => acc + charge.amount, 0) || 0) +
              (bill.penaltyAmount || 0), 0),
          totalPenalty: data.bills.reduce((sum, bill) => sum + (bill.penaltyAmount || 0), 0)
        };
        console.log('Calculated summary:', summary);

        setSummaryData(summary);
        setBillHistory(data.bills);
        setFilteredHistory(data.bills);
      } catch (error) {
        console.error('Error fetching bill summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillSummary();
  }, [router]);

  // Add fetchBillHeads function after fetchSocietyAndResidents
  const fetchBillHeads = async (societyId) => {
    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      const response = await fetch(`/api/BillHead-Api/get-bill-heads?societyId=${societyId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBillHeads(data.data);
      }
    } catch (error) {
      console.error('Error fetching bill heads:', error);
    }
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
  
  // Handle bulk bill generation
  const handleBulkBillGeneration = async (e) => {
    e.preventDefault();
    
    if (selectedResidents.length === 0) {
      alert('Please select at least one resident');
      return;
    }
    
    if (!bulkBillType || !bulkAmount || !bulkDueDate) {
      alert('Please fill all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const selectedResidentsData = residentList.filter(r => selectedResidents.includes(r._id));
      
      // Create a single request with all selected residents
      const bulkBillData = {
        societyId: selectedResidentsData[0]?.societyId,
        residents: selectedResidentsData,
        billType: bulkBillType,
        description: bulkDescription,
        amount: parseFloat(bulkAmount),
        issueDate: bulkIssueDate,
        dueDate: bulkDueDate,
        finePerDay: parseFloat(bulkFinePerDay)
      };
      
      const response = await fetch('/api/MaintenanceBill-Api/generateBillBulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('Society')}`,
        },
        body: JSON.stringify(bulkBillData),
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Successfully generated ${result.totalCreated} bills out of ${selectedResidents.length} selected residents`);
        
        // Reset form
        setBulkBillType('');
        setBulkDescription('');
        setBulkAmount('');
        setBulkIssueDate(new Date().toISOString().split('T')[0]);
        setBulkDueDate('');
        
        // Refresh bill history
        const historyResponse = await fetch('/api/MaintenanceBill-Api/getBills', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('Society')}`,
          },
        });
        if (historyResponse.ok) {
          const data = await historyResponse.json();
          setBillHistory(data.bills);
          setFilteredHistory(data.bills);
          setSummaryData(data.summary);
        }
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        alert(`Error generating bulk bills: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating bulk bills:', error);
      alert('Error generating bulk bills');
    } finally {
      setLoading(false);
    }
  };
  // Filter residents for bulk generation
  useEffect(() => {
    if (residentList.length > 0) {
      let filtered = [...residentList];
      
      if (bulkFilter.block) {
        filtered = filtered.filter(resident => 
          resident.flatDetails?.flatNumber?.startsWith(bulkFilter.block + '-')
        );
      }
      
      if (bulkFilter.floor) {
        filtered = filtered.filter(resident => {
          const flatNumber = resident.flatDetails?.flatNumber?.split('-')[1];
          return flatNumber && flatNumber.startsWith(bulkFilter.floor);
        });
      }
      
      
      setFilteredResidents(filtered);
      
      // Initialize selected residents if empty
      if (selectedResidents.length === 0) {
        setSelectedResidents(filtered.map(r => r._id));
      }
    }
  }, [residentList, bulkFilter]);
  // Filter history when history block/floor/flat changes
  useEffect(() => {
    if (billHistory.length > 0) {
      let filtered = [...billHistory];

      if (historyBlock) {
        filtered = filtered.filter(bill => bill.blockName === historyBlock);
      }

      if (historyFloor) {
        filtered = filtered.filter(bill => bill.floorNumber === historyFloor);
      }

      if (historyFlat) {
        filtered = filtered.filter(bill => bill.flatNumber === `${historyBlock}-${historyFlat}`);
      }

      if (billTypeFilter) {
        filtered = filtered.filter(bill => bill.billType === billTypeFilter);
      }

      setFilteredHistory(filtered);
    }
  }, [historyBlock, historyFloor, historyFlat, billTypeFilter, billHistory]);

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

  // Handle bill generation form submission
  const handleBillGeneration = async (e) => {
    e.preventDefault();

    if (!selectedResident) {
      alert('Please select a resident first');
      return;
    }

    if (!billHeadId || !amount || !dueDate) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      let baseAmount = parseFloat(amount);
      let gstDetails = {};

      // Calculate GST if applicable
      if (selectedBillHead?.gstApplicable) {
        const cgst = (baseAmount * (selectedBillHead.cgstPercentage || 0)) / 100;
        const sgst = (baseAmount * (selectedBillHead.sgstPercentage || 0)) / 100;
        const igst = (baseAmount * (selectedBillHead.igstPercentage || 0)) / 100;

        gstDetails = {
          cgst,
          sgst,
          igst,
          totalGst: cgst + sgst + igst
        };
      }

      const newBill = {
        societyId: selectedResident.societyId,
        flatId: selectedResident.flatDetails?.flatId,
        flatNumber: `${selectedBlock}-${selectedFlat}`,
        blockName: selectedBlock,
        floorNumber: selectedFloor,
        residentId: selectedResident._id,
        ownerName: selectedResident.name,
        ownerMobile: selectedResident.phone,
        ownerEmail: selectedResident.email,
        billHeadId,
        billHeadDetails: {
          code: selectedBillHead.code,
          name: selectedBillHead.name,
          category: selectedBillHead.category,
          calculationType: selectedBillHead.calculationType
        },
        description,
        baseAmount,
        additionalCharges,
        gstDetails,
        issueDate,
        dueDate,
        finePerDay: parseFloat(finePerDay),
        penaltyAmount: 0,
        totalAmount: baseAmount + (gstDetails.totalGst || 0) + 
          additionalCharges.reduce((sum, charge) => sum + parseFloat(charge.amount), 0)
      };

      const response = await fetch('/api/MaintenanceBill-Api/generateBill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('Society')}`,
        },
        body: JSON.stringify(newBill),
      });

      if (response.ok) {
        alert('Bill generated successfully');
        resetForm();

        // Refresh bill history
        const historyResponse = await fetch('/api/MaintenanceBill-Api/getBills', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('Society')}`,
          },
        });
        if (historyResponse.ok) {
          const data = await historyResponse.json();
          setBillHistory(data.bills);
          setFilteredHistory(data.bills);
          setSummaryData(data.summary);
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

  // Reset form
  const resetForm = () => {
    setSelectedBlock('');
    setSelectedFloor('');
    setSelectedFlat('');
    setSelectedResident(null);
    setBillHeadId('');
    setSelectedBillHead(null);
    setDescription('');
    setAmount('');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setFinePerDay('50');
    setAdditionalCharges([]);
    setNewCharge({ description: '', amount: '' });
  };

  // Calculate total amount
  const calculateTotal = () => {
    const baseAmount = parseFloat(amount) || 0;
    const additionalTotal = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
    return baseAmount + additionalTotal;
  };

  const handleBillHeadChange = (e) => {
    const selectedId = e.target.value;
    setBillHeadId(selectedId);
    
    if (selectedId) {
      const billHead = billHeads.find(head => head._id === selectedId);
      setSelectedBillHead(billHead);
      
      // Pre-fill amount if fixed amount is set
      if (billHead.calculationType === 'Fixed') {
        setAmount(billHead.fixedAmount.toString());
      } else {
        setAmount(''); // Clear amount for other calculation types
      }
      
      // Pre-fill description if available
      if (billHead.description) {
        setDescription(billHead.description);
      }
    } else {
      setSelectedBillHead(null);
      setAmount('');
      setDescription('');
    }
  };

  if (loading) {
    return <PreloaderSociety />;
  }

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
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'bulk' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('bulk')}
          >
            Bulk Generation
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate New Bill</h2>

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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bill Head *</label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={billHeadId}
                        onChange={handleBillHeadChange}
                        required
                      >
                        <option value="">Select Bill Head</option>
                        {billHeads.map(head => (
                          <option key={head._id} value={head._id}>
                            {head.code} - {head.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedBillHead && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Bill Head Details</h4>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Category:</span> {selectedBillHead.category}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Calculation Type:</span> {selectedBillHead.calculationType}
                          </p>
                          {selectedBillHead.calculationType === 'Fixed' && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Fixed Amount:</span> ₹{selectedBillHead.fixedAmount}
                            </p>
                          )}
                          {selectedBillHead.calculationType === 'Formula' && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Formula:</span> {selectedBillHead.formula}
                            </p>
                          )}
                          {selectedBillHead.gstApplicable && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">GST:</span>
                              <ul className="list-disc list-inside pl-4">
                                {selectedBillHead.cgstPercentage > 0 && (
                                  <li>CGST: {selectedBillHead.cgstPercentage}%</li>
                                )}
                                {selectedBillHead.sgstPercentage > 0 && (
                                  <li>SGST: {selectedBillHead.sgstPercentage}%</li>
                                )}
                                {selectedBillHead.igstPercentage > 0 && (
                                  <li>IGST: {selectedBillHead.igstPercentage}%</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0"
                        required
                      />
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
                    <h3 className="text-md font-medium text-gray-900 mb-2">Additional Charges</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
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
                              <tr className="bg-gray-50">
                                <td className="px-3 py-2 text-sm font-medium">Total</td>
                                <td className="px-3 py-2 text-sm font-medium text-right" colSpan="2">
                                  ₹{calculateTotal().toFixed(2)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
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

        {/* Bulk Bill Generation Tab */}
        {activeTab === 'bulk' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Bulk Bill Generation</h2>
              
              <form onSubmit={handleBulkBillGeneration}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bill Type *</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={bulkBillType}
                      onChange={(e) => setBulkBillType(e.target.value)}
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Security">Security</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Parking">Parking</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={bulkAmount}
                      onChange={(e) => setBulkAmount(e.target.value)}
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fine Per Day (₹)</label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={bulkFinePerDay}
                      onChange={(e) => setBulkFinePerDay(e.target.value)}
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={bulkIssueDate}
                      onChange={(e) => setBulkIssueDate(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={bulkDueDate}
                      onChange={(e) => setBulkDueDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={bulkDescription}
                      onChange={(e) => setBulkDescription(e.target.value)}
                      rows="2"
                    ></textarea>
                  </div>
                </div>
                
                <div className="flex justify-end mb-6">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? 'Generating...' : 'Generate Bills for Selected Residents'}
                  </button>
                </div>
              </form>
              
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-2">Filter Residents</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block capitalize text-sm font-medium text-gray-700 mb-1">{structureType}</label>
                    <select
                      className="w-full border capitalize border-gray-300 rounded-md px-3 py-2"
                      value={bulkFilter.block}
                      onChange={(e) => setBulkFilter({...bulkFilter, block: e.target.value})}
                    >
                      <option value="">All {structureType}s</option>
                      {Object.keys(structuredResidents).sort().map((block) => (
                        <option key={block} value={block}>{structureType} {block}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={bulkFilter.floor}
                      onChange={(e) => setBulkFilter({...bulkFilter, floor: e.target.value})}
                      disabled={!bulkFilter.block}
                    >
                      <option value="">All Floors</option>
                      {bulkFilter.block && Object.keys(structuredResidents[bulkFilter.block] || {}).sort().map((floor) => (
                        <option key={floor} value={floor}>Floor {floor}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-md font-medium text-gray-900">Resident Selection</h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="selectAll"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    checked={selectedResidents.length === filteredResidents.length && filteredResidents.length > 0}
                    onChange={toggleAllResidents}
                  />
                  <label htmlFor="selectAll" className="ml-2 text-sm text-gray-700">
                    {selectedResidents.length === filteredResidents.length && filteredResidents.length > 0
                      ? 'Deselect All'
                      : 'Select All'}
                  </label>
                </div>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flat</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredResidents.length > 0 ? (
                      filteredResidents.map((resident) => (
                        <tr key={resident._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                              checked={selectedResidents.includes(resident._id)}
                              onChange={() => toggleResidentSelection(resident._id)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{resident.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {resident.flatDetails?.flatNumber || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{resident.phone}</div>
                            <div className="text-sm text-gray-500">{resident.email}</div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                          No residents found matching the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 text-sm text-gray-500">
                {selectedResidents.length} of {filteredResidents.length} residents selected
              </div>
            </div>
          </div>
        )}

        {/* Bill History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Bill History</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block capitalize text-sm font-medium text-gray-700 mb-1">{structureType}</label>
                  <select
                    className="w-full border capitalize border-gray-300 rounded-md px-3 py-2"
                    value={historyBlock}
                    onChange={(e) => selectHistoryStructure(e.target.value, historyFloor, historyFlat)}
                  >
                    <option value="">All {structureType}s</option>
                    {Object.keys(structuredResidents).sort().map((block) => (
                      <option key={block} value={block}>{structureType} {block}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={historyFloor}
                    onChange={(e) => selectHistoryStructure(historyBlock, e.target.value, historyFlat)}
                    disabled={!historyBlock}
                  >
                    <option value="">All Floors</option>
                    {historyBlock && Object.keys(structuredResidents[historyBlock] || {}).sort().map((floor) => (
                      <option key={floor} value={floor}>Floor {floor}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Flat</label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={historyFlat}
                    onChange={(e) => selectHistoryStructure(historyBlock, historyFloor, e.target.value)}
                    disabled={!historyBlock || !historyFloor}
                  >
                    <option value="">All Flats</option>
                    {historyBlock && historyFloor &&
                      Object.keys(structuredResidents[historyBlock][historyFloor] || {}).sort().map((flat) => (
                        <option key={flat} value={flat}>Flat {flat}</option>
                      ))
                    }
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={billTypeFilter}
                    onChange={(e) => setBillTypeFilter(e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="Security">Security</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Parking">Parking</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resident</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flat</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th> */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((bill) => (
                      <tr key={bill._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {bill._id.substring(0, 8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{bill.ownerName}</div>
                          <div className="text-sm text-gray-500">{bill.ownerMobile}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {bill.flatNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {bill.billType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                              ₹{(
                                (bill.baseAmount || 0) +
                                (bill.additionalCharges?.reduce((sum, charge) => sum + charge.amount, 0) || 0) +
                                (bill.penaltyAmount || 0)
                              ).toFixed(2)}
                            </div>
                            {bill.penaltyAmount > 0 && (
                              <div className="text-xs text-red-500">
                                (includes ₹{bill.penaltyAmount.toFixed(2)} penalty)
                              </div>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(bill.issueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(bill.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            bill.status === 'Paid'
                              ? 'bg-green-100 text-green-800'
                              : bill.status === 'Overdue'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {bill.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                        No bills found for the selected criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
