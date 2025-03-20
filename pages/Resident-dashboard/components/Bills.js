import React, { useState } from 'react';
import { FaWater, FaBolt, FaTools, FaWifi, FaArrowLeft, FaHistory, FaCreditCard, FaCalendarAlt, FaFileInvoiceDollar, FaCheckCircle } from 'react-icons/fa';
import { useRouter } from 'next/router';

export default function Bills() {
    const router = useRouter();
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    // Sample data for utility bills
    const [utilityBills, setUtilityBills] = useState([
        {
            id: 1,
            type: "Electricity",
            icon: <FaBolt className="text-yellow-500" />,
            provider: "State Electricity Board",
            amount: 1850.75,
            dueDate: "2025-04-05",
            status: "Unpaid",
            meterReading: "3456 kWh",
            billPeriod: "Feb 15 - Mar 15, 2025"
        },
        {
            id: 2,
            type: "Water",
            icon: <FaWater className="text-blue-500" />,
            provider: "Municipal Water Supply",
            amount: 750.50,
            dueDate: "2025-04-10",
            status: "Unpaid",
            meterReading: "245 kL",
            billPeriod: "Feb 10 - Mar 10, 2025"
        },
        {
            id: 3,
            type: "Maintenance",
            icon: <FaTools className="text-gray-600" />,
            provider: "Apartment Association",
            amount: 2500.00,
            dueDate: "2025-03-31",
            status: "Unpaid",
            meterReading: null,
            billPeriod: "March 2025"
        },
        {
            id: 4,
            type: "Internet",
            icon: <FaWifi className="text-indigo-500" />,
            provider: "Broadband Services Ltd.",
            amount: 999.00,
            dueDate: "2025-03-25",
            status: "Paid",
            meterReading: null,
            billPeriod: "March 2025",
            paidOn: "2025-03-18"
        }
    ]);

    // Sample data for payment history
    const [paymentHistory, setPaymentHistory] = useState([
        {
            id: 101,
            type: "Electricity",
            icon: <FaBolt className="text-yellow-500" />,
            provider: "State Electricity Board",
            amount: 1640.25,
            dueDate: "2025-03-05",
            paidOn: "2025-03-02",
            transactionId: "EL2503021855",
            paymentMethod: "Credit Card ending with 4582"
        },
        {
            id: 102,
            type: "Water",
            icon: <FaWater className="text-blue-500" />,
            provider: "Municipal Water Supply",
            amount: 680.75,
            dueDate: "2025-03-10",
            paidOn: "2025-03-08",
            transactionId: "WT2503081042",
            paymentMethod: "UPI Payment"
        },
        {
            id: 103,
            type: "Maintenance",
            icon: <FaTools className="text-gray-600" />,
            provider: "Apartment Association",
            amount: 2500.00,
            dueDate: "2025-02-28",
            paidOn: "2025-02-25",
            transactionId: "MT2502251630",
            paymentMethod: "Net Banking"
        },
        {
            id: 104,
            type: "Internet",
            icon: <FaWifi className="text-indigo-500" />,
            provider: "Broadband Services Ltd.",
            amount: 999.00,
            dueDate: "2025-03-25",
            paidOn: "2025-03-18",
            transactionId: "IN2503181225",
            paymentMethod: "Credit Card ending with 4582"
        }
    ]);

    // Calculate utility stats
    const billStats = {
        total: utilityBills.reduce((sum, bill) => sum + bill.amount, 0),
        unpaid: utilityBills.filter(bill => bill.status === "Unpaid").reduce((sum, bill) => sum + bill.amount, 0),
        paid: utilityBills.filter(bill => bill.status === "Paid").reduce((sum, bill) => sum + bill.amount, 0),
        due: utilityBills.filter(bill => new Date(bill.dueDate) <= new Date(new Date().setDate(new Date().getDate() + 5))).length
    };

    // Handler for opening payment modal
    const handlePayNow = (bill) => {
        setSelectedBill(bill);
        setPaymentModalOpen(true);
    };

    // Handler for processing payment
    const handlePayment = (e) => {
        e.preventDefault();
        
        // Update the bill status to paid
        const updatedBills = utilityBills.map(bill => {
            if (bill.id === selectedBill.id) {
                return {
                    ...bill,
                    status: "Paid",
                    paidOn: new Date().toISOString().split('T')[0]
                };
            }
            return bill;
        });
        
        // Create a new payment history entry
        const newPaymentRecord = {
            id: Date.now(),
            type: selectedBill.type,
            icon: selectedBill.icon,
            provider: selectedBill.provider,
            amount: selectedBill.amount,
            dueDate: selectedBill.dueDate,
            paidOn: new Date().toISOString().split('T')[0],
            transactionId: `${selectedBill.type.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 10000000000)}`,
            paymentMethod: `${e.target.paymentMethod.value} ${e.target.paymentMethod.value === "Credit Card" ? "ending with " + e.target.cardNumber.value.slice(-4) : ""}`
        };
        
        // Update state
        setUtilityBills(updatedBills);
        setPaymentHistory([newPaymentRecord, ...paymentHistory]);
        setPaymentSuccess(true);
        
        // Reset after showing success message
        setTimeout(() => {
            setPaymentSuccess(false);
            setPaymentModalOpen(false);
            setSelectedBill(null);
        }, 2000);
    };

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header with Back Button */}
            <div className="p-4 md:p-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 font-semibold transition-colors"
                >
                    <FaArrowLeft size={18} />
                    <span className="text-base">Back</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <h1 className="text-2xl md:text-3xl text-center font-bold text-blue-600 mb-6">Utility Bills</h1>

                {/* Bills Overview Section */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Bills Overview</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-gray-500">Total Amount</p>
                            <p className="text-2xl font-bold text-blue-600">₹{billStats.total.toFixed(2)}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-gray-500">Unpaid Amount</p>
                            <p className="text-2xl font-bold text-red-600">₹{billStats.unpaid.toFixed(2)}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-gray-500">Paid Amount</p>
                            <p className="text-2xl font-bold text-green-600">₹{billStats.paid.toFixed(2)}</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-gray-500">Due Soon</p>
                            <p className="text-2xl font-bold text-yellow-600">{billStats.due} Bills</p>
                        </div>
                    </div>
                </div>

                {/* Toggle Between Bills and History */}
                <div className="flex justify-center mb-6">
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                        <button
                            type="button"
                            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${!showHistory ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            onClick={() => setShowHistory(false)}
                        >
                            <FaFileInvoiceDollar className="inline mr-2" />
                            Current Bills
                        </button>
                        <button
                            type="button"
                            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${showHistory ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            onClick={() => setShowHistory(true)}
                        >
                            <FaHistory className="inline mr-2" />
                            Payment History
                        </button>
                    </div>
                </div>

                {/* Current Bills Section */}
                {!showHistory && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                <FaFileInvoiceDollar className="mr-2 text-blue-600" />
                                Current Bills
                            </h2>
                            
                            {utilityBills.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {utilityBills.map((bill) => (
                                        <div key={bill.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                                <div className="flex items-center">
                                                    <div className="p-2 rounded-full bg-white shadow-sm mr-3">
                                                        {bill.icon}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium text-gray-900">{bill.type}</h3>
                                                        <p className="text-sm text-gray-500">{bill.provider}</p>
                                                    </div>
                                                </div>
                                                <span className={`text-sm px-2 py-1 rounded-full ${
                                                    bill.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {bill.status}
                                                </span>
                                            </div>
                                            <div className="p-4">
                                                <div className="flex justify-between mb-3">
                                                    <span className="text-sm text-gray-500">Bill Period:</span>
                                                    <span className="text-sm font-medium">{bill.billPeriod}</span>
                                                </div>
                                                {bill.meterReading && (
                                                    <div className="flex justify-between mb-3">
                                                        <span className="text-sm text-gray-500">Meter Reading:</span>
                                                        <span className="text-sm font-medium">{bill.meterReading}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between mb-3">
                                                    <span className="text-sm text-gray-500">Due Date:</span>
                                                    <span className={`text-sm font-medium ${
                                                        new Date(bill.dueDate) <= new Date() && bill.status !== 'Paid' ? 'text-red-600' : ''
                                                    }`}>
                                                        {bill.dueDate}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between mb-4">
                                                    <span className="text-sm text-gray-500">Amount:</span>
                                                    <span className="text-lg font-bold">₹{bill.amount.toFixed(2)}</span>
                                                </div>
                                                {bill.status === 'Paid' ? (
                                                    <div className="text-center text-green-600 text-sm font-medium">
                                                        <FaCheckCircle className="inline mr-1" />
                                                        Paid on {bill.paidOn}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handlePayNow(bill)}
                                                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                    >
                                                        <FaCreditCard className="mr-2" />
                                                        Pay Now
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No utility bills found.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Payment History Section */}
                {showHistory && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                <FaHistory className="mr-2 text-blue-600" />
                                Payment History
                            </h2>
                            
                            {paymentHistory.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Type</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid On</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {paymentHistory.map((payment) => (
                                                <tr key={payment.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                                                                {payment.icon}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">{payment.type}</div>
                                                                <div className="text-sm text-gray-500">{payment.provider}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{payment.amount.toFixed(2)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.dueDate}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.paidOn}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.paymentMethod}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.transactionId}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No payment history available.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {paymentModalOpen && selectedBill && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        {paymentSuccess ? (
                            <div className="text-center py-6">
                                <FaCheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
                                <p className="text-gray-600">Your payment has been processed successfully.</p>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Pay {selectedBill.type} Bill</h2>
                                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-gray-600">Provider:</span>
                                        <span className="text-sm font-medium">{selectedBill.provider}</span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-gray-600">Bill Period:</span>
                                        <span className="text-sm font-medium">{selectedBill.billPeriod}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Amount:</span>
                                        <span className="text-lg font-bold">₹{selectedBill.amount.toFixed(2)}</span>
                                    </div>
                                </div>
                                <form onSubmit={handlePayment}>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                        <select
                                            name="paymentMethod"
                                            required
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        >
                                            <option value="">Select payment method</option>
                                            <option value="Credit Card">Credit Card</option>
                                            <option value="Debit Card">Debit Card</option>
                                            <option value="UPI Payment">UPI Payment</option>
                                            <option value="Net Banking">Net Banking</option>
                                        </select>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaCreditCard className="text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                name="cardNumber"
                                                placeholder="XXXX XXXX XXXX XXXX"
                                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                                                maxLength="19"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                            <input
                                                type="text"
                                                name="expiryDate"
                                                placeholder="MM/YY"
                                                className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                maxLength="5"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                                            <input
                                                type="text"
                                                name="cvv"
                                                placeholder="XXX"
                                                className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                maxLength="3"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end space-x-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentModalOpen(false)}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            Pay ₹{selectedBill.amount.toFixed(2)}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}