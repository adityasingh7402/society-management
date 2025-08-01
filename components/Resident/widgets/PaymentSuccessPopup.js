import React, { useEffect } from 'react';
import { CheckCircle, X, Receipt, CreditCard, Calendar, Hash, User } from 'lucide-react';

const PaymentSuccessPopup = ({ isOpen, onClose, paymentData }) => {
  useEffect(() => {
    if (isOpen) {
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !paymentData) return null;

  const { bill, payment, amount } = paymentData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto relative overflow-hidden">
        {/* Success Header with Animation */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-center text-white relative">
          <div className="absolute top-4 right-4">
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Animated Success Icon */}
          <div className="mx-auto mb-4 w-20 h-20 bg-white rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
          <p className="text-green-100">Your utility bill has been paid successfully</p>
        </div>

        {/* Payment Details */}
        <div className="px-6 py-6">
          <div className="space-y-4">
            {/* Amount Paid */}
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-green-600 font-medium">Amount Paid</p>
              <p className="text-3xl font-bold text-green-700">₹{amount?.toFixed(2) || '0.00'}</p>
            </div>

            {/* Transaction Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <Receipt className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Bill Number</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {bill?.billNumber || 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Transaction ID</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {payment?.transactionId || 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Payment Method</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  Wallet
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Payment Date</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Payment Status</span>
                </div>
                <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  Completed
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Continue
            </button>
            <button
              onClick={() => {
                window.print();
              }}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Print Receipt
            </button>
          </div>

          {/* Auto-close indicator */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              This dialog will automatically close in a few seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPopup;
