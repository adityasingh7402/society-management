import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function SocietyBillView() {
  const router = useRouter();
  const { id } = router.query;
  
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPrintView, setShowPrintView] = useState(false);
  
  useEffect(() => {
    if (!id) return;
    
    const fetchBill = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/MaintenanceBill-Api/getBill?id=${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch bill details');
        }
        const data = await response.json();
        setBill(data);
      } catch (err) {
        console.error('Error fetching bill:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBill();
  }, [id]);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const calculateTotalAmount = () => {
    if (!bill) return 0;
    
    const baseAmount = bill.amount || 0;
    const additionalTotal = bill.additionalCharges?.reduce((sum, charge) => sum + charge.amount, 0) || 0;
    const penaltyAmount = bill.penaltyAmount || 0;
    
    return baseAmount + additionalTotal + penaltyAmount;
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  const handlePrintBill = () => {
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      setShowPrintView(false);
    }, 300);
  };
  
  const handleSendReminder = async () => {
    if (!bill) return;
    
    try {
      const response = await fetch('/api/MaintenanceBill-Api/sendReminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billId: bill._id,
          flatNumber: bill.flatNumber,
          ownerEmail: bill.ownerEmail,
          ownerName: bill.ownerName,
          dueDate: bill.dueDate,
          amount: calculateTotalAmount()
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send reminder');
      }
      
      alert('Payment reminder sent successfully');
    } catch (err) {
      console.error('Error sending reminder:', err);
      alert(`Failed to send reminder: ${err.message}`);
    }
  };
  
  const handleMarkAsPaid = async () => {
    if (!bill) return;
    
    const paymentDate = prompt('Enter payment date (YYYY-MM-DD)', new Date().toISOString().split('T')[0]);
    const paymentMethod = prompt('Enter payment method (e.g. Cash, Bank Transfer, UPI)', 'Cash');
    const transactionId = prompt('Enter transaction ID (optional)');
    
    if (!paymentDate) return;
    
    try {
      const response = await fetch('/api/MaintenanceBill-Api/updateBillStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billId: bill._id,
          status: 'Paid',
          paidDate: paymentDate,
          paymentMethod: paymentMethod,
          transactionId: transactionId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update bill status');
      }
      
      // Refresh bill data
      const updatedBill = await response.json();
      setBill(updatedBill);
      alert('Bill marked as paid successfully');
    } catch (err) {
      console.error('Error updating bill status:', err);
      alert(`Failed to update bill status: ${err.message}`);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-center text-gray-600">Loading bill details...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error}</p>
          <div className="mt-6">
            <Link href="/admin/maintenance-bills" className="text-blue-600 hover:text-blue-800">
              &larr; Back to Maintenance Bills
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!bill) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-center text-gray-600">Bill not found</p>
          <div className="mt-6 text-center">
            <Link href="/admin/maintenance-bills" className="text-blue-600 hover:text-blue-800">
              &larr; Back to Maintenance Bills
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen ${showPrintView ? 'bg-white' : 'bg-gray-100'}`}>
      {/* Non-printable header (hidden in print view) */}
      {!showPrintView && (
        <header className="bg-white shadow print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Maintenance Bill Management</h1>
              <div className="flex space-x-4">
                <button
                  onClick={handlePrintBill}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Print Bill
                </button>
                <Link
                  href="/admin/maintenance-bills"
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Back to Bills
                </Link>
              </div>
            </div>
          </div>
        </header>
      )}
      
      {/* Main Content */}
      <main className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${showPrintView ? 'pt-0' : ''}`}>
        {/* Admin Actions Panel (Society POV) */}
        {!showPrintView && (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <h2 className="text-xl font-bold mb-4">Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bill.status !== 'Paid' && (
                <>
                  <button
                    onClick={handleMarkAsPaid}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Mark as Paid
                  </button>
                  <button
                    onClick={handleSendReminder}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                  >
                    Send Payment Reminder
                  </button>
                </>
              )}
              <Link
                href={`/admin/edit-bill/${bill._id}`}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-center"
              >
                Edit Bill
              </Link>
            </div>
          </div>
        )}
        
        <div className={`bg-white rounded-lg ${showPrintView ? '' : 'shadow'}`}>
          {/* Society Info Header (visible in print) */}
          <div className="border-b p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Maintenance Bill</h2>
                <p className="text-gray-600">Bill ID: {bill.billNumber || bill._id}</p>
              </div>
              <div className="text-right">
                <h3 className="text-xl font-bold">Your Society Name</h3>
                <p className="text-gray-600">123 Society Address, City</p>
                <p className="text-gray-600">contact@yoursociety.com</p>
              </div>
            </div>
          </div>
          
          {/* Bill Status */}
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <div>
                <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(bill.status)}`}>
                  {bill.status}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Issue Date: {formatDate(bill.issueDate)}</p>
                <p className="text-sm text-gray-600">Due Date: {formatDate(bill.dueDate)}</p>
                {bill.paidDate && (
                  <p className="text-sm text-green-600">Paid Date: {formatDate(bill.paidDate)}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Resident Information */}
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold mb-4">Resident Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{bill.ownerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Flat Number</p>
                <p className="font-medium">{bill.flatNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{bill.ownerMobile}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{bill.ownerEmail}</p>
              </div>
            </div>
          </div>
          
          {/* Bill Details */}
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold mb-4">Bill Details</h3>
            <div className="overflow-hidden border rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Base charge */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{bill.billType}</div>
                      {bill.description && <div className="text-gray-500">{bill.description}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ₹{bill.amount?.toLocaleString()}
                    </td>
                  </tr>
                  
                  {/* Additional charges */}
                  {bill.additionalCharges && bill.additionalCharges.length > 0 && bill.additionalCharges.map((charge, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {charge.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        ₹{charge.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Penalty amount if any */}
                  {bill.penaltyAmount > 0 && (
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        Late Payment Penalty ({bill.finePerDay} per day)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">
                        ₹{bill.penaltyAmount.toLocaleString()}
                      </td>
                    </tr>
                  )}
                  
                  {/* Total amount */}
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      Total Amount
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                      ₹{calculateTotalAmount().toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Payment Information */}
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
            
            {bill.status === 'Paid' ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-green-800">
                  <span className="font-medium">Payment Received</span>
                </p>
                {bill.paymentMethod && (
                  <div className="text-sm text-green-700 mt-2">
                    <p>Payment Method: {bill.paymentMethod}</p>
                    {bill.transactionId && <p>Transaction ID: {bill.transactionId}</p>}
                    <p>Received on: {formatDate(bill.paidDate)}</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                  <p className="text-yellow-800">
                    <span className="font-medium">Payment Pending</span>
                    {bill.status === 'Overdue' ? 
                      ` - This payment is overdue by ${Math.ceil((new Date() - new Date(bill.dueDate)) / (1000 * 60 * 60 * 24))} days` : 
                      ' - Payment due date approaching'}
                  </p>
                </div>
                
                {!showPrintView && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Payment Tracking:</h4>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p><span className="font-medium">Last Reminder Sent:</span> {bill.lastReminderDate ? formatDate(bill.lastReminderDate) : 'None'}</p>
                      <p><span className="font-medium">Days Overdue:</span> {bill.dueDate && new Date() > new Date(bill.dueDate) ? 
                        Math.ceil((new Date() - new Date(bill.dueDate)) / (1000 * 60 * 60 * 24)) : 0}</p>
                      <p><span className="font-medium">Current Penalty:</span> ₹{bill.penaltyAmount?.toLocaleString() || '0'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Notes & Terms */}
          <div className="p-6 border-t text-sm text-gray-600">
            <p>1. Late payments are subject to a penalty of ₹{bill.finePerDay} per day after the due date.</p>
            <p>2. For any queries regarding this bill, please contact the society office.</p>
            <p>3. This is a computer-generated bill and does not require a signature.</p>
          </div>
        </div>
        
        {/* Admin Notes (Society POV) */}
        {!showPrintView && (
          <div className="bg-white rounded-lg shadow mt-6 p-6">
            <h3 className="text-lg font-semibold mb-4">Admin Notes</h3>
            <div className="mb-4">
              <textarea 
                className="w-full p-3 border rounded-md" 
                rows="3" 
                placeholder="Add private notes about this bill or resident (not visible to residents)"
                defaultValue={bill.adminNotes || ''}
              ></textarea>
              <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Save Notes
              </button>
            </div>
            
            <h4 className="font-medium mt-4 mb-2">Payment History</h4>
            <div className="overflow-hidden border rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bill.activityLog ? (
                    bill.activityLog.map((log, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{formatDate(log.date)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{log.action}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{log.details}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-4 py-2 text-sm text-gray-500 text-center">No activity recorded</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0.5cm;
          }
          
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}