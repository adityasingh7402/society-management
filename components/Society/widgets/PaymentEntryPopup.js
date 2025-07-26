import React, { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, Building2, Smartphone, ArrowLeftRight, Zap, DollarSign } from 'lucide-react';

const PaymentEntryPopup = ({ bill, onClose, onPaymentComplete }) => {
  const [paymentData, setPaymentData] = useState({
    billId: bill._id,
    amount: parseFloat((bill.totalAmount - (bill.paidAmount || 0)).toFixed(2)),
    paymentMethod: 'Cash', // This will be mapped to paymentMode in the API
    transactionId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const paymentMethods = [
    { 
      value: 'Cash', 
      label: 'Cash Payment - Physical Currency',
      icon: <Banknote className="w-4 h-4" />,
      description: 'Direct cash transaction'
    },
    { 
      value: 'Cheque', 
      label: 'Cheque Payment - Bank Draft',
      icon: <Building2 className="w-4 h-4" />,
      description: 'Payment via bank cheque'
    },
    { 
      value: 'Bank Transfer', 
      label: 'Bank Transfer - Direct Account Transfer',
      icon: <ArrowLeftRight className="w-4 h-4" />,
      description: 'Direct bank-to-bank transfer'
    },
    { 
      value: 'UPI', 
      label: 'UPI Payment - Unified Payments Interface',
      icon: <Smartphone className="w-4 h-4" />,
      description: 'Digital payment via UPI apps'
    },
    { 
      value: 'NEFT', 
      label: 'NEFT Transfer - National Electronic Funds Transfer',
      icon: <Zap className="w-4 h-4" />,
      description: 'Electronic fund transfer system'
    },
    { 
      value: 'RTGS', 
      label: 'RTGS Transfer - Real Time Gross Settlement',
      icon: <Zap className="w-4 h-4" />,
      description: 'Real-time high-value transfer'
    },
    { 
      value: 'Card', 
      label: 'Card Payment - Credit/Debit Card',
      icon: <CreditCard className="w-4 h-4" />,
      description: 'Payment via credit or debit card'
    },
    { 
      value: 'Other', 
      label: 'Other Payment Methods - Alternative Options',
      icon: <DollarSign className="w-4 h-4" />,
      description: 'Other payment methods'
    }
  ];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [billData, setBillData] = useState(bill);
  const [isLoading, setIsLoading] = useState(false);

  // Update refreshBillData function to handle both bill types
  const refreshBillData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('Society');
      // Determine bill type based on the bill's model name, billHeadId category, or current page context
      let billType, apiPath;
      if (bill._modelName === 'MaintenanceBill' || bill.billHeadId?.category === 'Maintenance') {
        billType = 'MaintenanceBill';
        apiPath = 'MaintenanceBill-Api';
      } else if (bill._modelName === 'AmenityBill' || bill.billHeadId?.category === 'Amenity' || window.location.pathname.includes('AmenityBills')) {
        billType = 'AmenityBill';
        apiPath = 'AmenityBill-Api';
      } else {
        billType = 'UtilityBill';
        apiPath = 'UtilityBill-Api';
      }

      const response = await fetch(`/api/${apiPath}/getBill?billId=${bill._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setBillData(data.data);
          
          // Update payment amount based on latest bill data
          const remainingAmount = data.data.totalAmount - (data.data.paidAmount || 0);
          
          // Update amount but don't force it to match remaining amount
          if (remainingAmount > 0) {
            setPaymentData(prev => ({
              ...prev,
              amount: parseFloat(remainingAmount.toFixed(2))
            }));
          }
          
          // Clear any previous errors
          setError('');
        }
      }
    } catch (error) {
      console.error('Error fetching bill data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch latest bill data when component mounts
  useEffect(() => {
    refreshBillData();
  }, []);

  // Update handleSubmit function to handle both bill types
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setIsSubmitting(true);
    setError('');

    // Validate required fields
    if (!paymentData.billId || !paymentData.amount || !paymentData.paymentMethod) {
      setError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    // Only validate that amount is positive
    if (paymentData.amount <= 0) {
      setError('Payment amount must be greater than 0');
      setIsSubmitting(false);
      return;
    }

    // Simple direct submission without retries
    try {
      const token = localStorage.getItem('Society');
      // Determine bill type based on the bill's model name, billHeadId category, or current page context
      let billType;
      if (bill._modelName === 'MaintenanceBill' || bill.billHeadId?.category === 'Maintenance') {
        billType = 'MaintenanceBill';
      } else if (bill._modelName === 'AmenityBill' || bill.billHeadId?.category === 'Amenity' || window.location.pathname.includes('AmenityBills')) {
        billType = 'AmenityBill';
      } else {
        billType = 'UtilityBill';
      }

      // Log the billType for debugging
      console.log('Sending billType:', billType);

      const response = await fetch('/api/Payment-Api/recordPayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          billId: paymentData.billId,
          amount: parseFloat(paymentData.amount),
          paymentMethod: paymentData.paymentMethod,
          transactionId: paymentData.transactionId || undefined,
          paymentDate: paymentData.paymentDate,
          notes: paymentData.notes || undefined,
          billType // This should be 'MaintenanceBill', 'AmenityBill', or 'UtilityBill'
        })
      });

      const data = await response.json();
      console.log('API Response:', data);
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to record payment');
      }

      onPaymentComplete(data.data);
    } catch (error) {
      console.error('Error recording payment:', error);
      setError(error.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMethod = paymentMethods.find(method => method.value === paymentData.paymentMethod);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
        <div className="sticky top-0 bg-white p-6 pb-4 border-b z-10 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Record Payment</h2>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Loading latest bill data...</span>
            </div>
          ) : (
            <div>
              {error && (
                <div className={`mb-4 p-4 rounded-lg border-l-4 ${
                  error.includes('Warning') 
                    ? 'bg-yellow-50 border-yellow-400 text-yellow-800' 
                    : 'bg-red-50 border-red-400 text-red-800'
                }`}>
                  <div className="font-medium">
                    {error.includes('Warning') ? 'Warning' : 'Error'}
                  </div>
                  <div className="text-sm mt-1">{error}</div>
                </div>
              )}
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bill Number</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg shadow-sm p-3 bg-gray-50 text-gray-600"
                      value={billData.billNumber}
                      disabled
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Resident</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg shadow-sm p-3 bg-gray-50 text-gray-600"
                      value={billData.ownerName}
                      disabled
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bill Status</label>
                    <div className={`px-4 py-3 rounded-lg font-medium text-center ${
                      billData.status === 'Paid' ? 'bg-green-100 text-green-800 border border-green-200' : 
                      billData.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 
                      'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {billData.status}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Outstanding Amount</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg shadow-sm p-3 bg-gray-50 text-gray-600 font-semibold"
                      value={`₹${Math.max(0, (billData.totalAmount - (billData.paidAmount || 0))).toFixed(2)}`}
                      disabled
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-lg shadow-sm p-3 pl-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })}
                      max={billData.totalAmount}
                      step="0.01"
                      required
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <div className="relative">
                    <select
                      className="w-full border border-gray-300 rounded-lg shadow-sm p-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                      value={paymentData.paymentMethod}
                      onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                      required
                    >
                      {paymentMethods.map(method => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {selectedMethod && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2">
                        {selectedMethod.icon}
                        <span className="text-sm text-blue-800 font-medium">{selectedMethod.description}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={paymentData.transactionId}
                      onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                      placeholder="Enter transaction reference (optional)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={paymentData.paymentDate}
                      onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                    placeholder="Add any additional notes (optional)"
                    rows="3"
                  />
                </div>
                
                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <button
                    type="button"
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Record Payment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentEntryPopup;