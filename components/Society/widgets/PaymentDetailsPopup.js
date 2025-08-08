import React from 'react';
import { X, Home, CheckCircle, Phone, Mail, MapPin, CreditCard, Calendar, User, FileText, DollarSign, AlertTriangle } from 'lucide-react';

const PaymentDetailsPopup = ({ payment, onClose }) => {
  if (!payment) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBillTypeColor = (billType) => {
    switch (billType) {
      case 'MaintenanceBill':
        return 'bg-blue-100 text-blue-800';
      case 'UtilityBill':
        return 'bg-purple-100 text-purple-800';
      case 'AmenityBill':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentModeIcon = (mode) => {
    switch (mode) {
      case 'Cash':
        return '💵';
      case 'UPI':
        return '📱';
      case 'Bank Transfer':
      case 'NEFT':
      case 'RTGS':
        return '🏦';
      case 'Card':
        return '💳';
      case 'Cheque':
        return '📋';
      default:
        return '💰';
    }
  };

  const Section = ({ title, icon: Icon, children, className = '' }) => (
    <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-100 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="w-5 h-5 text-gray-500" />}
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );

  const InfoItem = ({ label, value, className = '' }) => (
    <div className={`mb-3 ${className}`}>
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-gray-900 font-medium">{value}</div>
    </div>
  );

  const DetailRow = ({ label, value, className = '' }) => (
    <div className={`flex justify-between py-2 border-b border-gray-100 last:border-0 ${className}`}>
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-xl shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Payment Details
              </h1>
              <p className="text-sm text-gray-500">
                Transaction ID: {payment.transactionId || 'N/A'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-12 gap-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Left Column - Resident & Payment Info */}
          <div className="col-span-5 space-y-6">
            {/* Resident Details */}
            <Section title="Resident Details" icon={Home}>
              <div className="space-y-4">
                <InfoItem 
                  label="Name" 
                  value={payment.residentDetails?.name || payment.residentId?.name || 'N/A'} 
                />
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    {payment.residentDetails?.phone || payment.residentId?.phone || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    {payment.residentDetails?.email || payment.residentId?.email || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    Flat: {payment.residentDetails?.flatNumber || 'N/A'}
                  </span>
                </div>
              </div>
            </Section>

            {/* Payment Information */}
            <Section title="Payment Information" icon={CreditCard}>
              <div className="space-y-4">
                <InfoItem 
                  label="Amount" 
                  value={formatCurrency(payment.amount)}
                  className="text-lg"
                />
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Payment Mode</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getPaymentModeIcon(payment.paymentMode)}</span>
                    <span className="font-medium">{payment.paymentMode}</span>
                  </div>
                </div>
                <DetailRow 
                  label="Payment Date" 
                  value={formatDate(payment.paymentDate)} 
                />
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                    {payment.status}
                  </span>
                </div>
                {payment.referenceNumber && (
                  <DetailRow 
                    label="Reference Number" 
                    value={payment.referenceNumber} 
                  />
                )}
              </div>
            </Section>

            {/* Bank/Payment Details */}
            {payment.bankDetails && Object.keys(payment.bankDetails).some(key => payment.bankDetails[key]) && (
              <Section title="Payment Details" icon={DollarSign}>
                <div className="space-y-3 text-sm">
                  {payment.bankDetails.accountNumber && (
                    <DetailRow label="Account Number" value={`****${payment.bankDetails.accountNumber.slice(-4)}`} />
                  )}
                  {payment.bankDetails.bankName && (
                    <DetailRow label="Bank Name" value={payment.bankDetails.bankName} />
                  )}
                  {payment.bankDetails.branchName && (
                    <DetailRow label="Branch" value={payment.bankDetails.branchName} />
                  )}
                  {payment.bankDetails.ifscCode && (
                    <DetailRow label="IFSC Code" value={payment.bankDetails.ifscCode} />
                  )}
                  {payment.bankDetails.chequeNumber && (
                    <DetailRow label="Cheque Number" value={payment.bankDetails.chequeNumber} />
                  )}
                  {payment.bankDetails.chequeDate && (
                    <DetailRow label="Cheque Date" value={new Date(payment.bankDetails.chequeDate).toLocaleDateString()} />
                  )}
                  {payment.bankDetails.upiId && (
                    <DetailRow label="UPI ID" value={payment.bankDetails.upiId} />
                  )}
                  {payment.bankDetails.cardLast4 && (
                    <DetailRow label="Card" value={`****${payment.bankDetails.cardLast4}`} />
                  )}
                </div>
              </Section>
            )}
          </div>

          {/* Right Column - Bill & Workflow Details */}
          <div className="col-span-7 space-y-6">
            {/* Bill Information */}
            <Section title="Bill Information" icon={FileText}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Bill Type</span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getBillTypeColor(payment.billType)}`}>
                    {payment.billType?.replace('Bill', '')}
                  </span>
                </div>
                
                {payment.billDetails && (
                  <>
                    <DetailRow 
                      label="Bill Number" 
                      value={payment.billDetails.billNumber || 'N/A'} 
                    />
                    <DetailRow 
                      label="Bill Amount" 
                      value={formatCurrency(payment.billDetails.billAmount || 0)} 
                    />
                    <DetailRow 
                      label="Bill Head" 
                      value={`${payment.billDetails.billHeadCode || 'N/A'} - ${payment.billDetails.billHeadName || 'N/A'}`} 
                    />
                  </>
                )}

                {/* Bill ID for reference */}
                <DetailRow 
                  label="Bill Reference" 
                  value={payment.billId?._id || payment.billId || 'N/A'} 
                  className="text-xs"
                />
              </div>
            </Section>

            {/* Maker Information */}
            <Section title="Recorded By" icon={User}>
              <div className="space-y-3">
                <InfoItem 
                  label="Maker" 
                  value={payment.maker?.userId?.name || 'N/A'} 
                />
                <DetailRow 
                  label="Recorded At" 
                  value={formatDate(payment.maker?.timestamp || payment.createdAt)} 
                />
                {payment.maker?.remarks && (
                  <InfoItem 
                    label="Remarks" 
                    value={payment.maker.remarks} 
                  />
                )}
              </div>
            </Section>

            {/* Checker Information (if approved/rejected) */}
            {payment.checker?.userId && (
              <Section 
                title="Approval Details" 
                icon={payment.checker.action === 'Approved' ? CheckCircle : AlertTriangle}
                className={payment.checker.action === 'Approved' ? 'border-green-200' : 'border-red-200'}
              >
                <div className="space-y-3">
                  <InfoItem 
                    label={payment.checker.action === 'Approved' ? 'Approved By' : 'Rejected By'} 
                    value={payment.checker.userId?.name || 'N/A'} 
                  />
                  <DetailRow 
                    label={`${payment.checker.action} At`}
                    value={formatDate(payment.checker.timestamp)} 
                  />
                  {payment.checker.remarks && (
                    <InfoItem 
                      label="Checker Remarks" 
                      value={payment.checker.remarks} 
                    />
                  )}
                </div>
              </Section>
            )}

            {/* Voucher Information */}
            {payment.voucherId && (
              <Section title="Accounting Entry" icon={FileText}>
                <div className="space-y-3">
                  <DetailRow 
                    label="Voucher ID" 
                    value={payment.voucherId} 
                  />
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium text-blue-800 mb-1">Journal Entry Created</p>
                    <p>This payment has been recorded in the accounting system with the above voucher reference.</p>
                  </div>
                </div>
              </Section>
            )}

            {/* Timeline */}
            <Section title="Payment Timeline" icon={Calendar}>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Payment Recorded</p>
                    <p className="text-sm text-gray-500">{formatDate(payment.createdAt)}</p>
                  </div>
                </div>
                
                {payment.checker?.timestamp && (
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      payment.checker.action === 'Approved' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="font-medium">{payment.checker.action}</p>
                      <p className="text-sm text-gray-500">{formatDate(payment.checker.timestamp)}</p>
                    </div>
                  </div>
                )}

                {payment.voucherId && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Accounting Entry Posted</p>
                      <p className="text-sm text-gray-500">Journal voucher created</p>
                    </div>
                  </div>
                )}
              </div>
            </Section>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-white p-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Last updated: {formatDate(payment.updatedAt || payment.createdAt)}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
            {payment.status === 'Pending' && (
              <div className="flex gap-2">
                <button className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                  Reject
                </button>
                <button className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsPopup;
