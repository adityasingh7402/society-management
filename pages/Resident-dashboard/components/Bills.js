import React, { useState, useEffect } from 'react';
import { FaTools, FaArrowLeft, FaHistory, FaCreditCard, FaFileInvoiceDollar, FaCheckCircle, FaBuilding, FaHammer, FaLeaf, FaBroom } from 'react-icons/fa';
import { useRouter } from 'next/router';

export default function Bills() {
    const router = useRouter();
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [utilityBills, setUtilityBills] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch resident details and utility bills
    useEffect(() => {
        const fetchResidentDetailsAndBills = async () => {
            try {
                const token = localStorage.getItem("Resident");
                if (!token) {
                    router.push("/Login");
                    return;
                }

                // Fetch resident details
                const residentResponse = await fetch("/api/Resident-Api/get-resident-details", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!residentResponse.ok) {
                    throw new Error("Failed to fetch resident details");
                }

                const residentData = await residentResponse.json();
                const residentId = residentData._id; // Assuming the resident ID is available in the response

                // Fetch utility bills for the resident
                const billsResponse = await fetch(`/api/UtilityBill-Api/getBill-Resident?residentId=${residentId}`);
                if (!billsResponse.ok) {
                    throw new Error("Failed to fetch utility bills");
                }

                const billsData = await billsResponse.json();
                setUtilityBills(billsData.bills); // Set the utility bills for the resident
                setPaymentHistory(billsData.bills || []); // Set payment history if available
            } catch (error) {
                console.error("Error fetching data:", error);
                router.push("/Login");
            } finally {
                setLoading(false);
            }
        };

        fetchResidentDetailsAndBills();
    }, [router]);

    // Calculate utility bill stats
    const billStats = {
        total: utilityBills.reduce((sum, bill) => sum + (
            bill.baseAmount + 
            (bill.additionalCharges?.reduce((sum, charge) => sum + charge.amount, 0) || 0) + 
            (bill.penaltyAmount || 0)
        ), 0),
        unpaid: utilityBills.filter(bill => bill.status !== "Paid").reduce((sum, bill) => sum + (
            bill.baseAmount + 
            (bill.additionalCharges?.reduce((sum, charge) => sum + charge.amount, 0) || 0) + 
            (bill.penaltyAmount || 0)
        ), 0),
        paid: utilityBills.filter(bill => bill.status === "Paid").reduce((sum, bill) => sum + (
            bill.baseAmount + 
            (bill.additionalCharges?.reduce((sum, charge) => sum + charge.amount, 0) || 0) + 
            (bill.penaltyAmount || 0)
        ), 0),
        due: utilityBills.filter(bill =>
            bill.status !== "Paid" &&
            new Date(bill.dueDate) <= new Date(new Date().setDate(new Date().getDate() + 5))
        ).length,
        totalPenalty: utilityBills.reduce((sum, bill) => sum + (bill.penaltyAmount || 0), 0)
    };

    // Handler for opening payment modal
    const handlePayNow = (bill) => {
        setSelectedBill(bill);
        setPaymentModalOpen(true);
    };

    // Handler for processing payment
    const handlePayment = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem("Resident");
            if (!token) {
                router.push("/Login");
                return;
            }

            // Update the bill status to paid
            const updatedBills = utilityBills.map(bill => {
                if (bill._id === selectedBill._id) {
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
                type: selectedBill.utilityType,
                amount: selectedBill.baseAmount + selectedBill.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0),
                dueDate: selectedBill.dueDate,
                paidOn: new Date().toISOString().split('T')[0],
                transactionId: `${selectedBill.utilityType.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 10000000000)}`,
                paymentMethod: `${e.target.paymentMethod.value} ${e.target.paymentMethod.value === "Credit Card" || e.target.paymentMethod.value === "Debit Card" ? "ending with " + e.target.cardNumber.value.slice(-4) : ""}`
            };

            // Send payment data to the backend
            const paymentResponse = await fetch("/api/UtilityBill-Api/payBill", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    billId: selectedBill._id,
                    paymentDetails: newPaymentRecord
                }),
            });

            if (!paymentResponse.ok) {
                throw new Error("Failed to process payment");
            }

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
        } catch (error) {
            console.error("Error processing payment:", error);
            alert("Failed to process payment. Please try again.");
        }
    };
    const getUnitLabel = (type) => {
        switch (type) {
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
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                        <div className="bg-orange-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-gray-500">Total Penalty</p>
                            <p className="text-2xl font-bold text-orange-600">₹{billStats.totalPenalty.toFixed(2)}</p>
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
                {!showHistory && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                <FaTools className="mr-2 text-blue-600" />
                                Current Utility Bills
                            </h2>

                            {loading ? (
                                <p className="text-gray-500 text-center py-4">Loading bills...</p>
                            ) : utilityBills.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {utilityBills.map((bill) => (
                                        <div key={bill._id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                                <div className="flex items-center">
                                                    <div className="p-2 rounded-full bg-white shadow-sm mr-3">
                                                        <FaBuilding className="text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium text-gray-900">{bill.utilityType}</h3>
                                                        <p className="text-sm text-gray-500">{bill.description}</p>
                                                    </div>
                                                </div>
                                                <span className={`text-sm px-2 py-1 rounded-full ${bill.status === 'Paid'
                                                        ? 'bg-green-100 text-green-800'
                                                        : bill.status === 'Overdue'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {bill.status}
                                                </span>
                                            </div>
                                            <div className="p-4">
                                                {/* Usage Information */}
                                                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                                                    <div className="flex justify-between mb-2">
                                                        <span className="text-sm text-gray-500">Usage:</span>
                                                        <span className="text-sm font-medium">
                                                            {bill.unitUsage} {getUnitLabel(bill.utilityType)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-500">Rate:</span>
                                                        <span className="text-sm font-medium">
                                                            ₹{bill.perUnitRate}/{getUnitLabel(bill.utilityType)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Bill Details */}
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-sm text-gray-500">Due Date:</span>
                                                    <span className={`text-sm font-medium ${new Date(bill.dueDate) <= new Date() && bill.status !== 'Paid'
                                                            ? 'text-red-600'
                                                            : ''
                                                        }`}>
                                                        {new Date(bill.dueDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-sm text-gray-500">Base Amount:</span>
                                                    <span className="text-sm font-medium">₹{bill.baseAmount.toFixed(2)}</span>
                                                </div>

                                                {/* Additional Charges */}
                                                {bill.additionalCharges && bill.additionalCharges.length > 0 && (
                                                    <div className="mb-2">
                                                        <span className="text-sm text-gray-500">Additional Charges:</span>
                                                        <div className="ml-4 mt-1">
                                                            {bill.additionalCharges.map((charge, index) => (
                                                                <div key={index} className="flex justify-between text-sm">
                                                                    <span>{charge.description}:</span>
                                                                    <span>₹{charge.amount.toFixed(2)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Penalty Amount */}
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-sm text-gray-500">Penalty Amount:</span>
                                                    <span className="text-sm font-medium text-red-500">
                                                        ₹{(bill.penaltyAmount || 0).toFixed(2)}
                                                    </span>
                                                </div>

                                                {/* Total Amount */}
                                                <div className="flex justify-between mb-4 pt-2 border-t border-gray-200 mt-2">
                                                    <span className="text-sm font-semibold text-gray-700">Total Amount:</span>
                                                    <span className="text-lg font-bold">
                                                        ₹{(
                                                            bill.baseAmount +
                                                            (bill.additionalCharges ? bill.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0) : 0) +
                                                            (bill.penaltyAmount || 0)
                                                        ).toFixed(2)}
                                                    </span>
                                                </div>

                                                {bill.status === 'Paid' ? (
                                                    <div className="text-center text-green-600 text-sm font-medium">
                                                        <FaCheckCircle className="inline mr-1" />
                                                        Paid on {new Date(bill.updatedAt).toLocaleDateString()}
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

                            {loading ? (
                                <p className="text-gray-500 text-center py-4">Loading payment history...</p>
                            ) : paymentHistory.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Amount</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penalty</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {paymentHistory.map((payment) => (
                                                <tr key={payment._id || payment.transactionId}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                                                                <FaBuilding className="text-blue-600" />
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">{payment.utilityType}</div>
                                                                <div className="text-xs text-gray-500">{payment.description}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {payment.unitUsage} {getUnitLabel(payment.utilityType)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        ₹{payment.baseAmount?.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(payment.dueDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(payment.issueDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">
                                                        ₹{(payment.penaltyAmount || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                        ₹{(
                                                            payment.baseAmount +
                                                            (payment.additionalCharges ? payment.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0) : 0) +
                                                            (payment.penaltyAmount || 0)
                                                        ).toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${payment.status === 'Paid'
                                                                ? 'bg-green-100 text-green-800'
                                                                : payment.status === 'Overdue'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {payment.status}
                                                        </span>
                                                    </td>
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
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Pay {selectedBill.utilityType} Bill</h2>
                                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-gray-600">Usage:</span>
                                        <span className="text-sm font-medium">
                                            {selectedBill.unitUsage} {getUnitLabel(selectedBill.utilityType)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-gray-600">Base Amount:</span>
                                        <span className="text-sm font-medium">₹{selectedBill.baseAmount.toFixed(2)}</span>
                                    </div>
                                    {selectedBill.additionalCharges && selectedBill.additionalCharges.length > 0 && (
                                        <div className="mb-2">
                                            <span className="text-sm text-gray-600">Additional Charges:</span>
                                            <div className="ml-4 mt-1">
                                                {selectedBill.additionalCharges.map((charge, index) => (
                                                    <div key={index} className="flex justify-between text-sm">
                                                        <span>{charge.description}:</span>
                                                        <span>₹{charge.amount.toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {selectedBill.penaltyAmount > 0 && (
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm text-red-500">Penalty Amount:</span>
                                            <span className="text-sm font-medium text-red-500">₹{selectedBill.penaltyAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                                        <span className="text-sm font-semibold text-gray-700">Total Amount:</span>
                                        <span className="text-lg font-bold">
                                            ₹{(
                                                selectedBill.baseAmount +
                                                (selectedBill.additionalCharges ? selectedBill.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0) : 0) +
                                                (selectedBill.penaltyAmount || 0)
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-gray-600">Due Date:</span>
                                        <span className="text-sm font-medium">{new Date(selectedBill.dueDate).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {/* Rest of the payment form */}
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
                                            Pay ₹{(selectedBill.baseAmount + selectedBill.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0)).toFixed(2)}
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
