import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PreloaderSociety from '../../components/PreloaderSociety';
import { FileText, Plus, Edit2, Archive, Check, X, AlertCircle } from 'lucide-react';

export default function UtilityBills() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [billHeads, setBillHeads] = useState([]);
  const [residents, setResidents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedBillHead, setSelectedBillHead] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

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
    overdueAmount: 0
  });

  // Fetch initial data
  useEffect(() => {
    fetchBillHeads();
    fetchResidents();
    fetchBills();
  }, []);

  // Fetch bill heads
  const fetchBillHeads = async () => {
    try {
      const response = await fetch('/api/BillHead-Api/get-bill-heads');
      const data = await response.json();
      // Filter only utility bill heads
      const utilityBillHeads = data.filter(bh => bh.category === 'Utility');
      setBillHeads(utilityBillHeads);
    } catch (error) {
      console.error('Error fetching bill heads:', error);
      setNotification({
        show: true,
        message: 'Failed to fetch bill heads',
        type: 'error'
      });
    }
  };

  // Fetch residents
  const fetchResidents = async () => {
    try {
      const response = await fetch('/api/Resident-Api/get-society-residents');
      const data = await response.json();
      setResidents(data);
    } catch (error) {
      console.error('Error fetching residents:', error);
      setNotification({
        show: true,
        message: 'Failed to fetch residents',
        type: 'error'
      });
    }
  };

  // Fetch bills
  const fetchBills = async () => {
    try {
      const response = await fetch('/api/UtilityBill-Api/getBills');
      const data = await response.json();
      setBills(data);
      
      // Calculate summary
      const summary = data.reduce((acc, bill) => {
        acc.totalBills++;
        acc.pendingAmount += bill.remainingAmount;
        acc.paidAmount += bill.paidAmount;
        if (bill.status === 'Overdue') {
          acc.overdueAmount += bill.remainingAmount;
        }
        return acc;
      }, {
        totalBills: 0,
        pendingAmount: 0,
        paidAmount: 0,
        overdueAmount: 0
      });
      
      setSummary(summary);
    } catch (error) {
      console.error('Error fetching bills:', error);
      setNotification({
        show: true,
        message: 'Failed to fetch bills',
        type: 'error'
      });
    } finally {
      setLoading(false);
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

  // Handle resident selection
  const handleResidentChange = (e) => {
    const residentId = e.target.value;
    const resident = residents.find(r => r._id === residentId);
    if (resident) {
      setFormData(prev => ({
        ...prev,
        residentId,
        flatNumber: resident.flatDetails?.flatNumber || '',
        blockName: resident.flatDetails?.blockName || '',
        floorNumber: resident.flatDetails?.floorNumber || '',
        ownerName: resident.name || '',
        ownerMobile: resident.mobile || '',
        ownerEmail: resident.email || ''
      }));
    }
  };

  // Calculate bill amount
  const calculateAmount = () => {
    if (!selectedBillHead || !formData.unitUsage) return 0;

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

    // Calculate GST if applicable
    let gstAmount = 0;
    if (selectedBillHead.gstConfig?.isGSTApplicable) {
      const { cgstPercentage, sgstPercentage, igstPercentage } = selectedBillHead.gstConfig;
      gstAmount = (baseAmount * (cgstPercentage + sgstPercentage + igstPercentage)) / 100;
    }

    return baseAmount + gstAmount;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/UtilityBill-Api/generateBill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
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
        throw new Error(data.message);
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

  if (loading) {
    return <PreloaderSociety />;
  }

  return (
    <div className="p-4">
          {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
          </div>

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

                {/* Bill Generation Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-2xl font-semibold mb-4">Generate Utility Bill</h2>
            
            <form onSubmit={handleSubmit}>
              {/* Bill Head Selection */}
              <div className="mb-4">
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
                      {bh.code} - {bh.name}
                              </option>
                            ))}
                          </select>
                        </div>

              {/* Resident Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Resident</label>
                          <select
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={formData.residentId}
                  onChange={handleResidentChange}
                            required
                          >
                  <option value="">Select Resident</option>
                  {residents.map(resident => (
                    <option key={resident._id} value={resident._id}>
                      {resident.flatDetails?.flatNumber} - {resident.name}
                    </option>
                  ))}
                          </select>
                        </div>

              {/* Calculation Type Specific Fields */}
              {selectedBillHead && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    {selectedBillHead.calculationType === 'Fixed' ? 'Fixed Amount' :
                     selectedBillHead.calculationType === 'PerUnit' ? 'Units Used' :
                     'Units Used (for formula calculation)'}
                  </label>
                  {selectedBillHead.calculationType === 'Fixed' ? (
                          <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      value={selectedBillHead.fixedAmount}
                      disabled
                    />
                  ) : (
                          <input
                            type="number"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      value={formData.unitUsage}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        unitUsage: e.target.value
                      }))}
                            required
                          />
                  )}
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
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                  <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                          <input
                    type="date"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={formData.issueDate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      issueDate: e.target.value
                    }))}
                            required
                          />
                        </div>
                        <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                          <input
                            type="date"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      dueDate: e.target.value
                    }))}
                            required
                          />
                        </div>
                        </div>

              {/* Calculated Amount */}
              {selectedBillHead && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                              <input
                                type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={`₹${calculateAmount().toFixed(2)}`}
                    disabled
                              />
                            </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-4">
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
                        >
                  Generate Bill
                        </button>
                      </div>
                    </form>
                </div>
              </div>
            )}

      {/* Bills List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resident</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Head</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
            {bills.map((bill) => (
                          <tr key={bill._id}>
                <td className="px-6 py-4 whitespace-nowrap">{bill.billNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">{bill.ownerName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{bill.billHeadId.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">₹{bill.totalAmount.toFixed(2)}</td>
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