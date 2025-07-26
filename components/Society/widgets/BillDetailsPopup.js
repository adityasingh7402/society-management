import React from 'react';
import { X, Home, CheckCircle, Phone, Mail, MapPin } from 'lucide-react';

const BillDetailsPopup = ({ bill, onClose }) => {
  if (!bill) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const Section = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="w-5 h-5 text-gray-500" />}
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );

  const InfoItem = ({ label, value }) => (
    <div className="mb-4">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-gray-900">{value}</div>
    </div>
  );

  const DetailRow = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-xl shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
          <h1 className="text-xl font-semibold text-gray-900">Bill Details #{bill.billNumber}</h1>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-12 gap-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Left Column - Flat Details */}
          <div className="col-span-4 space-y-6">
            <Section title="Flat Details" icon={Home}>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{bill.ownerMobile}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{bill.ownerEmail}</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <span>{`${bill.flatNumber}, Floor ${bill.floorNumber}`}</span>
                </div>
              </div>
            </Section>

            <Section title="Approved By" icon={CheckCircle}>
              <InfoItem label="Admin Name" value={bill.approvedBy.adminName} />
              <InfoItem
                label="Approved At"
                value={formatDate(bill.approvedBy.approvedAt)}
              />
            </Section>
          </div>

          {/* Right Column - Bill Details */}
          <div className="col-span-8 space-y-6">
            <Section title="Bill Amount Details">
              <div className="space-y-3 text-sm">
                {/* Period Type */}
                <DetailRow 
                  label="Period Type" 
                  value={bill.periodType ? bill.periodType.replace(/([A-Z])/g, ' $1').trim() : 'Monthly'} 
                />

                {/* Base Amount */}
                <DetailRow label="Base Amount" value={`₹${bill.baseAmount.toFixed(2)}`} />

                {/* GST Details */}
                {bill.gstDetails.isGSTApplicable && (
                  <>
                    {bill.gstDetails.cgstAmount > 0 && (
                      <DetailRow
                        label={`CGST (${bill.gstDetails.cgstPercentage}%)`}
                        value={`₹${bill.gstDetails.cgstAmount.toFixed(2)}`}
                      />
                    )}
                    {bill.gstDetails.sgstAmount > 0 && (
                      <DetailRow
                        label={`SGST (${bill.gstDetails.sgstPercentage}%)`}
                        value={`₹${bill.gstDetails.sgstAmount.toFixed(2)}`}
                      />
                    )}
                  </>
                )}

                {/* Additional Charges */}
                {bill.additionalCharges?.map((charge, index) => (
                  <DetailRow
                    key={index}
                    label={charge.chargeType}
                    value={`₹${charge.amount.toFixed(2)}`}
                  />
                ))}

                {/* Total */}
                <div className="pt-3 mt-3 border-t border-gray-200">
                  <DetailRow
                    label="Total Amount"
                    value={`₹${bill.totalAmount.toFixed(2)}`}
                  />
                </div>

                {/* Payment Status */}
                {bill.paidAmount > 0 && (
                  <div className="pt-3 mt-3 border-t border-gray-200 space-y-3">
                    <DetailRow
                      label="Paid Amount"
                      value={`₹${bill.paidAmount.toFixed(2)}`}
                    />
                    <DetailRow
                      label="Remaining Amount"
                      value={`₹${bill.remainingAmount.toFixed(2)}`}
                    />
                  </div>
                )}
              </div>
            </Section>

            {/* Payment History */}
            {bill.paymentHistory && bill.paymentHistory.length > 0 && (
              <Section title="Payment History">
                <div className="space-y-4">
                  {bill.paymentHistory.map((payment, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">₹{payment.amount.toFixed(2)}</div>
                          <div className="text-sm text-gray-500">{payment.paymentMethod}</div>
                          <div className="text-xs text-gray-400">{formatDate(payment.paymentDate)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">#{payment.transactionId || 'N/A'}</div>
                          {payment.notes && (
                            <div className="text-xs text-gray-500 italic">{payment.notes}</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Maker Information */}
                      {payment.recordedBy && (
                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <div className="text-xs font-medium text-gray-500">Recorded by:</div>
                          <div className="flex justify-between items-center mt-1">
                            <div className="text-sm">
                              <span className="font-medium">{payment.makerName || 'Admin'}</span>
                              {payment.makerContact && (
                                <span className="text-xs text-gray-500 ml-2">({payment.makerContact})</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">ID: {payment.recordedBy}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-white p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
          {bill.status !== 'Paid' && (
            <button
              onClick={() => {
                onClose();
                if (bill.onRecordPayment) bill.onRecordPayment(bill);
              }}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Record Payment
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillDetailsPopup; 