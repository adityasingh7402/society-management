import React, { useState, useEffect } from 'react';
import { X, Wallet, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { useRouter } from 'next/router';

const ResidentPaymentPopup = ({ bill, onClose, onPaymentComplete }) => {
  const router = useRouter();
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [error, setError] = useState('');
  const [billData, setBillData] = useState(bill);

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    try {
      setWalletLoading(true);
      const token = localStorage.getItem("Resident");
      if (!token) return;

      const response = await fetch('/api/wallet/balance', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.data.currentBalance || 0);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      setError('Failed to fetch wallet balance');
    } finally {
      setWalletLoading(false);
    }
  };

  // Refresh bill data based on bill type
  const refreshBillData = async () => {
    try {
      const token = localStorage.getItem('Resident');
      
      // Determine the correct API endpoint based on bill type
      let apiEndpoint;
      switch (bill.billType) {
        case 'Maintenance':
          apiEndpoint = `/api/MaintenanceBill-Api/getBill?billId=${bill._id}`;
          break;
        case 'Amenity':
          apiEndpoint = `/api/AmenityBill-Api/getBill?billId=${bill._id}`;
          break;
        case 'Utility':
        default:
          apiEndpoint = `/api/UtilityBill-Api/getBill?billId=${bill._id}`;
          break;
      }
      
      const response = await fetch(apiEndpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Preserve the original billType since the API doesn't return it
          setBillData({
            ...data.data,
            billType: bill.billType // Keep the original billType
          });
        }
      }
    } catch (error) {
      console.error('Error fetching bill data:', error);
    }
  };

  useEffect(() => {
    fetchWalletBalance();
    refreshBillData();
  }, []);

  // Handle wallet payment
  const handleWalletPayment = async () => {
    if (walletBalance < billData.totalAmount) {
      return; // Insufficient balance, user needs to add money
    }

    setPaymentProcessing(true);
    setError('');

    try {
      const token = localStorage.getItem("Resident");
      if (!token) {
        throw new Error("Authentication required");
      }

      // Generate transaction ID for wallet payment if not provided
      let transactionId = Math.floor(100000000000 + Math.random() * 900000000000).toString();
      
      // Determine the correct billType for the API based on the bill's billType
      let apiBillType;
      switch (billData.billType) {
        case 'Maintenance':
          apiBillType = 'MaintenanceBill';
          break;
        case 'Amenity':
          apiBillType = 'AmenityBill';
          break;
        case 'Utility':
        default:
          apiBillType = 'UtilityBill';
          break;
      }
      
      // Create payment details for wallet payment
      const paymentDetails = {
        billId: billData._id,
        amount: billData.totalAmount,
        paymentMethod: 'Wallet', // Use 'Wallet' for resident payments
        transactionId: transactionId,
        paymentDate: new Date().toISOString(),
        notes: 'Wallet payment from resident dashboard',
        billType: apiBillType // Use the correct billType for the API
      };

      console.log('Processing wallet payment:', paymentDetails);

      // Call the payment API that updates PaymentEntry model
      const response = await fetch('/api/Payment-Api/recordPayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentDetails)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Payment failed');
      }

      // Wallet deduction is now handled within the recordPayment API
      console.log('Payment recorded successfully, wallet should be updated');

      // Refresh wallet balance
      await fetchWalletBalance();

      // Call completion callback
      onPaymentComplete(result.data);

    } catch (error) {
      console.error("Error processing wallet payment:", error);
      setError(error.message || "Failed to process payment. Please try again.");
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Navigate to wallet page to add money
  const handleAddMoney = () => {
    onClose();
    router.push('/Resident-dashboard/components/WalletDashboard');  // Navigate to wallet dashboard
  };

  const remainingAmount = billData.totalAmount - (billData.paidAmount || 0);
  const hasInsufficientBalance = walletBalance < remainingAmount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
        <div className="sticky top-0 bg-white p-6 pb-4 border-b z-10 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Pay with Wallet</h2>
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
          {error && (
            <div className="mb-4 p-4 rounded-lg border-l-4 bg-red-50 border-red-400 text-red-800">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                <div className="font-medium">Error</div>
              </div>
              <div className="text-sm mt-1">{error}</div>
            </div>
          )}

          <div className="space-y-6">
            {/* Bill Information */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-3">Bill Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Bill Number:</span>
                  <span className="font-medium">{billData.billNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Due Date:</span>
                  <span className="font-medium">{new Date(billData.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Amount:</span>
                  <span className="font-medium">₹{billData.baseAmount.toFixed(2)}</span>
                </div>
                {billData.gstDetails?.isGSTApplicable && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST:</span>
                    <span className="font-medium">₹{(
                      (billData.gstDetails.cgstAmount || 0) +
                      (billData.gstDetails.sgstAmount || 0) +
                      (billData.gstDetails.igstAmount || 0)
                    ).toFixed(2)}</span>
                  </div>
                )}
                {billData.latePaymentDetails?.lateFeeAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Late Fee:</span>
                    <span className="font-medium text-red-600">₹{billData.latePaymentDetails.lateFeeAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-blue-200">
                  <span>Total Amount:</span>
                  <span>₹{remainingAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Wallet Balance */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Wallet className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-medium text-green-800">Wallet Balance</span>
                </div>
                {walletLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                )}
              </div>
              <div className="text-2xl font-bold text-green-600">
                ₹{walletBalance.toFixed(2)}
              </div>
              
              {hasInsufficientBalance && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-800 font-medium">Insufficient Balance</p>
                      <p className="text-sm text-red-600 mt-1">
                        You need ₹{(remainingAmount - walletBalance).toFixed(2)} more to complete this payment.
                      </p>
                      <button
                        onClick={handleAddMoney}
                        className="mt-2 inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Money to Wallet
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Action */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                onClick={onClose}
                disabled={paymentProcessing}
              >
                Cancel
              </button>
              
              {hasInsufficientBalance ? (
                <button
                  type="button"
                  onClick={handleAddMoney}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Money</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  disabled={paymentProcessing || walletLoading}
                  onClick={handleWalletPayment}
                >
                  {paymentProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4" />
                      <span>Pay ₹{remainingAmount.toFixed(2)}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentPaymentPopup;
