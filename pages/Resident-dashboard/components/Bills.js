import React, { useState, useEffect } from 'react';
import { FaTools, FaArrowLeft, FaHistory, FaCreditCard, FaFileInvoiceDollar, FaCheckCircle, FaBuilding, FaHammer, FaLeaf, FaBroom, FaChevronDown, FaChevronUp, FaFilter, FaCalendarAlt, FaTimes } from 'react-icons/fa';
import { useRouter } from 'next/router';

// Import ResidentPaymentPopup for wallet-only payments
import ResidentPaymentPopup from '../../../components/Resident/widgets/ResidentPaymentPopup';
import PaymentSuccessPopup from '../../../components/Resident/widgets/PaymentSuccessPopup';

export default function Bills() {
    const router = useRouter();
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [paymentData, setPaymentData] = useState(null);
    const [bills, setBills] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [walletBalance, setWalletBalance] = useState(0);
    const [walletLoading, setWalletLoading] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [upiId, setUpiId] = useState('');
    const [upiVerified, setUpiVerified] = useState(false);
    const [upiVerifying, setUpiVerifying] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [collapsedBills, setCollapsedBills] = useState({});
    const [collapsedHistoryBills, setCollapsedHistoryBills] = useState({});

    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        category: '',
        subCategory: '',
        dateFrom: '',
        dateTo: '',
        status: ''
    });
    const [allBillsData, setAllBillsData] = useState([]); // Store all bills for filtering
    const [allPaidBills, setAllPaidBills] = useState([]); // Store all paid bills for history

    // Fetch all bills for resident
    const fetchAllBills = async () => {
        try {
            const token = localStorage.getItem("Resident");
            if (!token) {
                router.push("/login");
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
            const residentId = residentData._id;
            const societyId = residentData.societyId; // Get society ID for amenity bills

            // Fetch all bill types concurrently
            const [utilityResponse, maintenanceResponse, amenityResponse] = await Promise.allSettled([
                fetch(`/api/UtilityBill-Api/getBill-Resident?residentId=${residentId}`),
                fetch(`/api/MaintenanceBill-Api/getBill-Resident?residentId=${residentId}`),
                fetch(`/api/AmenityBill-Api/getBill-Resident?residentId=${residentId}`)
            ]);

            let allBills = [];
            let allPayments = [];

            // Process utility bills
            if (utilityResponse.status === 'fulfilled' && utilityResponse.value.ok) {
                const utilityData = await utilityResponse.value.json();
                const utilityBills = utilityData.bills?.map(bill => ({
                    ...bill,
                    billType: 'Utility',
                    icon: 'FaBuilding'
                })) || [];
                allBills.push(...utilityBills);

                // Extract payment history from utility bills
                utilityBills.forEach(bill => {
                    if (bill.paymentHistory && bill.paymentHistory.length > 0) {
                        bill.paymentHistory.forEach(payment => {
                            allPayments.push({
                                _id: payment._id || payment.transactionId,
                                type: 'Utility Bill',
                                billNumber: bill.billNumber,
                                amount: payment.amount || bill.totalAmount,
                                baseAmount: bill.baseAmount,
                                gstAmount: bill.gstDetails?.isGSTApplicable ? (
                                    (bill.gstDetails.cgstAmount || 0) +
                                    (bill.gstDetails.sgstAmount || 0) +
                                    (bill.gstDetails.igstAmount || 0)
                                ) : 0,
                                gstDetails: bill.gstDetails,
                                lateFeeAmount: bill.latePaymentDetails?.lateFeeAmount || 0,
                                latePaymentDetails: bill.latePaymentDetails,
                                additionalChargesAmount: bill.additionalCharges?.reduce((sum, charge) => sum + (charge.amount || 0), 0) || 0,
                                additionalCharges: bill.additionalCharges,
                                paidOn: payment.paymentDate || payment.createdAt || bill.updatedAt,
                                paymentMethod: payment.paymentMethod || 'N/A',
                                paymentReference: payment.paymentReference || payment.transactionReference || 'N/A',
                                status: payment.status || 'Success',
                                flatNumber: bill.flatNumber,
                                blockName: bill.blockName,
                                floorNumber: bill.floorNumber,
                                unitUsage: bill.unitUsage,
                                periodType: bill.periodType,
                                dueDate: bill.dueDate
                            });
                        });
                    }
                });
            } else {
                console.warn('Failed to fetch utility bills');
            }

            // Process maintenance bills
            if (maintenanceResponse.status === 'fulfilled' && maintenanceResponse.value.ok) {
                const maintenanceData = await maintenanceResponse.value.json();
                const maintenanceBills = maintenanceData.bills?.map(bill => ({
                    ...bill,
                    billType: 'Maintenance',
                    icon: 'FaHammer'
                })) || [];
                allBills.push(...maintenanceBills);

                // Extract payment history from maintenance bills
                maintenanceBills.forEach(bill => {
                    if (bill.paymentHistory && bill.paymentHistory.length > 0) {
                        bill.paymentHistory.forEach(payment => {
                            allPayments.push({
                                _id: payment._id || payment.transactionId,
                                type: 'Maintenance Bill',
                                billNumber: bill.billNumber,
                                amount: payment.amount || bill.totalAmount,
                                baseAmount: bill.baseAmount || bill.amount,
                                gstAmount: bill.gstDetails?.isGSTApplicable ? (
                                    (bill.gstDetails.cgstAmount || 0) +
                                    (bill.gstDetails.sgstAmount || 0) +
                                    (bill.gstDetails.igstAmount || 0)
                                ) : 0,
                                gstDetails: bill.gstDetails,
                                lateFeeAmount: bill.latePaymentDetails?.lateFeeAmount || bill.penaltyAmount || 0,
                                latePaymentDetails: bill.latePaymentDetails,
                                additionalChargesAmount: bill.additionalCharges?.reduce((sum, charge) => sum + (charge.amount || 0), 0) || 0,
                                additionalCharges: bill.additionalCharges,
                                paidOn: payment.paymentDate || payment.createdAt || bill.updatedAt,
                                paymentMethod: payment.paymentMethod || 'N/A',
                                paymentReference: payment.paymentReference || payment.transactionReference || 'N/A',
                                status: payment.status || 'Success',
                                flatNumber: bill.flatNumber,
                                blockName: bill.blockName,
                                floorNumber: bill.floorNumber,
                                unitUsage: bill.unitUsage,
                                periodType: bill.periodType,
                                dueDate: bill.dueDate
                            });
                        });
                    }
                });
            } else {
                console.warn('Failed to fetch maintenance bills');
            }

            // Process amenity bills
            if (amenityResponse.status === 'fulfilled' && amenityResponse.value.ok) {
                const amenityData = await amenityResponse.value.json();
                const amenityBills = amenityData.bills?.map(bill => ({
                    ...bill,
                    billType: 'Amenity',
                    icon: 'FaLeaf'
                })) || [];
                allBills.push(...amenityBills);

                // Extract payment history from amenity bills
                amenityBills.forEach(bill => {
                    if (bill.paymentHistory && bill.paymentHistory.length > 0) {
                        bill.paymentHistory.forEach(payment => {
                            allPayments.push({
                                _id: payment._id || payment.transactionId,
                                type: 'Amenity Bill',
                                billNumber: bill.billNumber,
                                amount: payment.amount || bill.totalAmount,
                                baseAmount: bill.baseAmount,
                                gstAmount: bill.gstDetails?.isGSTApplicable ? (
                                    (bill.gstDetails.cgstAmount || 0) +
                                    (bill.gstDetails.sgstAmount || 0) +
                                    (bill.gstDetails.igstAmount || 0)
                                ) : 0,
                                lateFeeAmount: bill.latePaymentDetails?.lateFeeAmount || bill.penaltyAmount || 0,
                                additionalChargesAmount: bill.additionalCharges?.reduce((sum, charge) => sum + (charge.amount || 0), 0) || 0,
                                paidOn: payment.paymentDate || payment.createdAt || bill.updatedAt,
                                paymentMethod: payment.paymentMethod || 'N/A',
                                paymentReference: payment.paymentReference || payment.transactionReference || 'N/A',
                                status: payment.status || 'Success'
                            });
                        });
                    }
                });
            } else {
                console.warn('Failed to fetch amenity bills');
            }

            // Separate paid and unpaid bills
            const unpaidBills = allBills.filter(bill => bill.status !== 'Paid');
            const paidBills = allBills.filter(bill => bill.status === 'Paid');

            // Sort by issue date (newest first)
            unpaidBills.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
            paidBills.sort((a, b) => new Date(b.paymentDate || b.updatedAt) - new Date(a.paymentDate || a.updatedAt));

            // Sort payment history by payment date (newest first)
            allPayments.sort((a, b) => new Date(b.paidOn) - new Date(a.paidOn));

            setBills(unpaidBills);
            setAllBillsData(allBills); // Store all bills for filtering
            setAllPaidBills(paidBills); // Store paid bills for history
            setPaymentHistory(allPayments);

        } catch (error) {
            console.error("Error fetching data:", error);
            router.push("/login");
        } finally {
            setLoading(false);
        }
    };

    // Add notification utility function
    const setNotificationWithTimeout = (message, type) => {
        // For now, use alert - you can implement a proper notification system later
        if (type === 'success') {
            alert(`Success: ${message}`);
        } else if (type === 'error') {
            alert(`Error: ${message}`);
        } else {
            alert(message);
        }
    };

    // Fetch resident details and all bills
    useEffect(() => {
        fetchAllBills();
    }, [router]);

    // Calculate bill stats
    const billStats = {
        total: bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0),
        unpaid: bills.filter(bill => bill.status !== "Paid").reduce((sum, bill) => sum + (bill.totalAmount || 0), 0),
        paid: bills.filter(bill => bill.status === "Paid").reduce((sum, bill) => sum + (bill.totalAmount || 0), 0),
        due: bills.filter(bill =>
            bill.status !== "Paid" &&
            new Date(bill.dueDate) <= new Date(new Date().setDate(new Date().getDate() + 5))
        ).length,
        totalGst: bills.reduce((sum, bill) => {
            if (bill.gstDetails?.isGSTApplicable) {
                return sum + (
                    (bill.gstDetails.cgstAmount || 0) +
                    (bill.gstDetails.sgstAmount || 0) +
                    (bill.gstDetails.igstAmount || 0)
                );
            }
            return sum;
        }, 0),
        totalLateFees: bills.reduce((sum, bill) => sum + (bill.latePaymentDetails?.lateFeeAmount || 0), 0),
        totalAdditionalCharges: bills.reduce((sum, bill) =>
            sum + (bill.additionalCharges?.reduce((chargeSum, charge) => chargeSum + (charge.amount || 0), 0) || 0), 0)
    };

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
        } finally {
            setWalletLoading(false);
        }
    };

    // Handler for opening payment modal
    const handlePayNow = (bill) => {
        setSelectedBill(bill);
        setPaymentModalOpen(true);
        fetchWalletBalance(); // Fetch wallet balance when opening payment modal
    };

    // UPI Verification Handler
    const handleUpiVerification = async () => {
        if (!upiId) {
            alert('Please enter UPI ID');
            return;
        }

        setUpiVerifying(true);
        try {
            // Simulate UPI verification - replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Simple UPI ID validation (you can enhance this)
            const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
            if (upiRegex.test(upiId)) {
                setUpiVerified(true);
            } else {
                alert('Invalid UPI ID format');
            }
        } catch (error) {
            console.error('UPI verification error:', error);
            alert('UPI verification failed. Please try again.');
        } finally {
            setUpiVerifying(false);
        }
    };

    // Handler for processing payment
    const handlePayment = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem("Resident");
            if (!token) {
                router.push("/login");
                return;
            }

            // Get payment method from state or form and map to model enum
            const rawPaymentMethod = selectedPaymentMethod || e.target.paymentMethod?.value;

            // Map frontend payment methods to UtilityBill model enum values
            const paymentMethodMapping = {
                'Credit Card': 'Other',
                'Debit Card': 'Other',
                'UPI Payment': 'UPI',
                'Net Banking': 'Bank Transfer',
                'Wallet': 'Other'
            };

            const paymentMethod = paymentMethodMapping[rawPaymentMethod] || 'Other';

            // Generate payment reference with safe fallback based on bill type
            const billTypePrefix = selectedBill.billType.toUpperCase();
            const paymentReference = `${billTypePrefix.substring(0, 2)}${Math.floor(Math.random() * 10000000000)}`;

            // Create payment details object
            const paymentDetails = {
                billId: selectedBill._id,
                paymentMethod: paymentMethod,
                paymentReference: paymentReference,
                paymentDate: new Date().toISOString(),
                amount: selectedBill.totalAmount,
                gstDetails: selectedBill.gstDetails,
                latePaymentDetails: selectedBill.latePaymentDetails,
                additionalCharges: selectedBill.additionalCharges,
                baseAmount: selectedBill.baseAmount,
                paymentBreakdown: {
                    baseAmount: selectedBill.baseAmount,
                    gstAmount: selectedBill.gstDetails?.isGSTApplicable ? (
                        (selectedBill.gstDetails.cgstAmount || 0) +
                        (selectedBill.gstDetails.sgstAmount || 0) +
                        (selectedBill.gstDetails.igstAmount || 0)
                    ) : 0,
                    lateFeeAmount: selectedBill.latePaymentDetails?.lateFeeAmount || 0,
                    additionalChargesAmount: selectedBill.additionalCharges?.reduce((sum, charge) => sum + charge.amount, 0) || 0
                }
            };

            // Add card details if paying by card
            if (paymentMethod === "Credit Card" || paymentMethod === "Debit Card") {
                const cardNumber = e.target.cardNumber?.value;
                if (cardNumber) {
                    paymentDetails.cardDetails = {
                        lastFourDigits: cardNumber.slice(-4),
                        cardType: paymentMethod
                    };
                }
            }

            // Add UPI details if paying by UPI
            if (paymentMethod === "UPI Payment") {
                paymentDetails.upiDetails = {
                    upiId: upiId,
                    verified: upiVerified
                };
            }

            // Add bank details if paying by Net Banking
            if (paymentMethod === "Net Banking") {
                const bankName = e.target.bankName?.value;
                if (bankName) {
                    paymentDetails.bankDetails = {
                        bankName: bankName
                    };
                }
            }

            // Send payment data to the backend
            const paymentResponse = await fetch("/api/UtilityBill-Api/payBill", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(paymentDetails),
            });

            if (!paymentResponse.ok) {
                const errorData = await paymentResponse.json();
                throw new Error(errorData.message || "Failed to process payment");
            }

            const paymentResult = await paymentResponse.json();

            // Update the bills list with the new payment
            setBills(prevBills =>
                prevBills.map(bill =>
                    bill._id === selectedBill._id
                        ? {
                            ...bill,
                            status: "Paid",
                            paidAmount: bill.totalAmount,
                            remainingAmount: 0,
                            paidOn: new Date().toISOString(),
                            paymentDetails: paymentResult.paymentDetails
                        }
                        : bill
                )
            );

            // Add to payment history
            const newPaymentRecord = {
                _id: paymentResult.paymentId,
                type: 'Utility Bill',
                billNumber: selectedBill.billNumber,
                amount: selectedBill.totalAmount,
                baseAmount: selectedBill.baseAmount,
                gstAmount: paymentDetails.paymentBreakdown.gstAmount,
                lateFeeAmount: paymentDetails.paymentBreakdown.lateFeeAmount,
                additionalChargesAmount: paymentDetails.paymentBreakdown.additionalChargesAmount,
                dueDate: selectedBill.dueDate,
                paidOn: new Date().toISOString(),
                paymentMethod: paymentDetails.paymentMethod,
                paymentReference: paymentDetails.paymentReference,
                status: "Success"
            };

            setPaymentHistory(prev => [newPaymentRecord, ...prev]);
            setPaymentSuccess(true);

            // Reset after showing success message
            setTimeout(() => {
                setPaymentSuccess(false);
                setPaymentModalOpen(false);
                setSelectedBill(null);
            }, 2000);

        } catch (error) {
            console.error("Error processing payment:", error);
            alert(error.message || "Failed to process payment. Please try again.");
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

    // Toggle bill visibility
    const toggleBillVisibility = (billId) => {
        setCollapsedBills((prev) => ({
            ...prev,
            [billId]: !prev[billId],
        }));
    };

    // Toggle history bill visibility
    const toggleHistoryBillVisibility = (billId) => {
        setCollapsedHistoryBills((prev) => ({
            ...prev,
            [billId]: !prev[billId],
        }));
    };

    // Filter bills based on filters state
    const filterBills = () => {
        return allBillsData.filter((bill) => {
            const matchesCategory = !filters.category || bill.billHeadId?.category === filters.category;
            const matchesSubCategory = !filters.subCategory || bill.billHeadId?.subCategory === filters.subCategory;
            const matchesDateFrom = !filters.dateFrom || new Date(bill.issueDate) >= new Date(filters.dateFrom);
            const matchesDateTo = !filters.dateTo || new Date(bill.issueDate) <= new Date(filters.dateTo);

            return matchesCategory && matchesSubCategory && matchesDateFrom && matchesDateTo;
        });
    };

    // Filter paid bills for payment history
    const filterPaidBills = () => {
        return allPaidBills.filter((bill) => {
            const matchesCategory = !filters.category || bill.billHeadId?.category === filters.category;
            const matchesSubCategory = !filters.subCategory || bill.billHeadId?.subCategory === filters.subCategory;
            const matchesDateFrom = !filters.dateFrom || new Date(bill.paymentDate) >= new Date(filters.dateFrom);
            const matchesDateTo = !filters.dateTo || new Date(bill.paymentDate) <= new Date(filters.dateTo);

            return matchesCategory && matchesSubCategory && matchesDateFrom && matchesDateTo;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading bills...</p>
                </div>
            </div>
        );
    }

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
                <h1 className="text-2xl md:text-3xl text-center font-bold text-blue-600 mb-6">Bills</h1>

                {/* Bills Overview Section */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Bills Overview</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-gray-500">Total Amount</p>
                            <p className="text-2xl font-bold text-blue-600">₹{billStats.total.toFixed(2)}</p>
                            <div className="mt-2 text-xs text-gray-500">
                                <p>Base: ₹{(billStats.total - billStats.totalGst - billStats.totalLateFees - billStats.totalAdditionalCharges).toFixed(2)}</p>
                                <p>GST: ₹{billStats.totalGst.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-gray-500">Unpaid Amount</p>
                            <p className="text-2xl font-bold text-red-600">₹{billStats.unpaid.toFixed(2)}</p>
                            <p className="mt-2 text-xs text-gray-500">Due Bills: {billStats.due}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-gray-500">Paid Amount</p>
                            <p className="text-2xl font-bold text-green-600">₹{billStats.paid.toFixed(2)}</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-gray-500">Additional Charges</p>
                            <p className="text-2xl font-bold text-orange-600">₹{(billStats.totalLateFees + billStats.totalAdditionalCharges).toFixed(2)}</p>
                            <div className="mt-2 text-xs text-gray-500">
                                <p>Late Fees: ₹{billStats.totalLateFees.toFixed(2)}</p>
                                <p>Other: ₹{billStats.totalAdditionalCharges.toFixed(2)}</p>
                            </div>
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

                {/* Filters Section */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                        >
                            <FaFilter />
                            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                        </button>
                    </div>
                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bill Type</label>
                                <select
                                    value={filters.category}
                                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Types</option>
                                    <option value="Utility">Utility</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Amenity">Amenity</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                                <input
                                    type="date"
                                    value={filters.dateFrom}
                                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                                <input
                                    type="date"
                                    value={filters.dateTo}
                                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Status</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Unpaid">Unpaid</option>
                                    <option value="Overdue">Overdue</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => setFilters({ category: '', subCategory: '', dateFrom: '', dateTo: '', status: '' })}
                                    className="w-full px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Current Bills Section */}
                {!showHistory && (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            Current Bills
                        </h2>
                        {bills.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {bills.map((bill) => (
                                    <div
                                        key={bill._id}
                                        className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                                    >
                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                                             onClick={() => toggleBillVisibility(bill._id)}>
                                            <div className="flex items-center">
                                                <div className="p-2 rounded-full bg-white shadow-sm mr-3">
                                                    {bill.billType === 'Utility' && <FaBuilding className="text-blue-600" />}
                                                    {bill.billType === 'Maintenance' && <FaHammer className="text-green-600" />}
                                                    {bill.billType === 'Amenity' && <FaLeaf className="text-purple-600" />}
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-gray-900">
                                                        {bill.billHeadId?.name ||
                                                            bill.scheduledBillReference?.scheduledBillTitle ||
                                                            bill.billHeadId?.subCategory ||
                                                            `${bill.billType} Bill`}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">Bill #{bill.billNumber}</p>
                                                    <p className="text-xs text-gray-400">{bill.flatNumber} - {bill.blockName}</p>
                                                    <p className="text-xs text-gray-400">Floor {bill.floorNumber}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm px-2 py-1 rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200">
                                                {collapsedBills[bill._id] ? <FaChevronUp /> : <FaChevronDown />}
                                            </span>
                                        </div>
                                        {collapsedBills[bill._id] && (
                                            <div className="p-4">
                                                {/* Usage Information */}
                                                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                                                    <div className="flex justify-between mb-2">
                                                        <span className="text-sm text-gray-500">Usage:</span>
                                                        <span className="text-sm font-medium">
                                                            {bill.unitUsage || 'N/A'} Units
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-500">Period:</span>
                                                        <span className="text-sm font-medium">
                                                            {bill.periodType}
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

                                                {/* GST Details */}
                                                {bill.gstDetails?.isGSTApplicable && (
                                                    <div className="mb-2">
                                                        <span className="text-sm text-gray-500">GST Details:</span>
                                                        <div className="ml-4 mt-1">
                                                            {bill.gstDetails.cgstAmount > 0 && (
                                                                <div className="flex justify-between text-sm">
                                                                    <span>CGST ({bill.gstDetails.cgstPercentage}%):</span>
                                                                    <span>₹{bill.gstDetails.cgstAmount.toFixed(2)}</span>
                                                                </div>
                                                            )}
                                                            {bill.gstDetails.sgstAmount > 0 && (
                                                                <div className="flex justify-between text-sm">
                                                                    <span>SGST ({bill.gstDetails.sgstPercentage}%):</span>
                                                                    <span>₹{bill.gstDetails.sgstAmount.toFixed(2)}</span>
                                                                </div>
                                                            )}
                                                            {bill.gstDetails.igstAmount > 0 && (
                                                                <div className="flex justify-between text-sm">
                                                                    <span>IGST ({bill.gstDetails.igstPercentage}%):</span>
                                                                    <span>₹{bill.gstDetails.igstAmount.toFixed(2)}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex justify-between text-sm font-medium pt-1 border-t border-gray-200 mt-1">
                                                                <span>Total GST:</span>
                                                                <span>₹{(
                                                                    (bill.gstDetails.cgstAmount || 0) +
                                                                    (bill.gstDetails.sgstAmount || 0) +
                                                                    (bill.gstDetails.igstAmount || 0)
                                                                ).toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Additional Charges */}
                                                {bill.additionalCharges && bill.additionalCharges.length > 0 && (
                                                    <div className="mb-2">
                                                        <span className="text-sm text-gray-500">Additional Charges:</span>
                                                        <div className="ml-4 mt-1">
                                                            {bill.additionalCharges.map((charge, index) => (
                                                                <div key={index} className="flex justify-between text-sm">
                                                                    <span>{charge.chargeType}:</span>
                                                                    <span>₹{charge.amount.toFixed(2)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Late Payment Details */}
                                                {bill.latePaymentDetails && bill.latePaymentDetails.isLatePaymentChargeApplicable && (
                                                    <div className="mb-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-sm text-gray-500">Late Fee Type:</span>
                                                            <span className="text-sm font-medium">{bill.latePaymentDetails.chargeType || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-sm text-gray-500">Grace Period:</span>
                                                            <span className="text-sm font-medium">{bill.latePaymentDetails.gracePeriodDays} days</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-sm text-gray-500">Charge Value:</span>
                                                            <span className="text-sm font-medium">₹{bill.latePaymentDetails.chargeValue}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-sm text-gray-500">Late Fee Amount:</span>
                                                            <span className="text-sm font-medium text-red-500">₹{(bill.latePaymentDetails.lateFeeAmount || 0).toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Total Amount */}
                                                <div className="flex justify-between mb-4 pt-2 border-t border-gray-200 mt-2">
                                                    <span className="text-sm font-semibold text-gray-700">Total Amount:</span>
                                                    <span className="text-lg font-bold">
                                                        ₹{bill.totalAmount.toFixed(2)}
                                                    </span>
                                                </div>

                                                {bill.status === 'Paid' ? (
                                                    <div className="text-center text-green-600 text-sm font-medium">
                                                        <FaCheckCircle className="inline mr-1" />
                                                        Paid on {bill.paymentDate ? new Date(bill.paymentDate).toLocaleDateString() : new Date(bill.updatedAt).toLocaleDateString()}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePayNow(bill);
                                                        }}
                                                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                    >
                                                        <FaCreditCard className="mr-2" />
                                                        Pay Now - ₹{bill.remainingAmount ? bill.remainingAmount.toFixed(2) : bill.totalAmount.toFixed(2)}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">No bills found.</p>
                        )}
                    </div>
                )}

    {/* Payment History Section */}
    {showHistory && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Payment History
            </h2>
            {paymentHistory.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {paymentHistory.map((payment) => (
                        <div key={payment._id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center cursor-pointer" onClick={() => toggleHistoryBillVisibility(payment._id)}>
                                <div className="flex items-center">
                                    <div className="p-2 rounded-full bg-white shadow-sm mr-3">
                                        {payment.type === 'Utility Bill' && <FaBuilding className="text-blue-600" />}
                                        {payment.type === 'Maintenance Bill' && <FaHammer className="text-green-600" />}
                                        {payment.type === 'Amenity Bill' && <FaLeaf className="text-purple-600" />}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">{payment.type}</h3>
                                        <p className="text-sm text-gray-500">Bill #{payment.billNumber}</p>
                                        <p className="text-xs text-gray-500">Paid on {new Date(payment.paidOn).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className="text-sm px-2 py-1 rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200">
                                    {collapsedHistoryBills[payment._id] ? <FaChevronUp /> : <FaChevronDown />}
                                </span>
                            </div>
                            {collapsedHistoryBills[payment._id] && (
                                <div className="p-4">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-gray-500">Base Amount:</span>
                                        <span className="text-sm font-medium">₹{payment.baseAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-gray-500">GST:</span>
                                        <span className="text-sm font-medium">₹{payment.gstAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-gray-500">Late Fee:</span>
                                        <span className="text-sm font-medium">₹{payment.lateFeeAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-gray-500">Additional:</span>
                                        <span className="text-sm font-medium">₹{payment.additionalChargesAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-gray-500">Payment Method:</span>
                                        <span className="text-sm font-medium">{payment.paymentMethod}</span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-gray-500">Reference:</span>
                                        <span className="text-sm font-medium">{payment.paymentReference}</span>
                                    </div>
                                    <div className="flex justify-between mb-2 pt-2 border-t border-gray-200">
                                        <span className="text-sm font-bold text-gray-700">Total Amount:</span>
                                        <span className="text-lg font-bold">₹{payment.amount.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 text-center py-4">No payment history found.</p>
            )}
        </div>
    )}
            </div>

            {/* Payment Modal */}
            {paymentModalOpen && selectedBill && (
                <ResidentPaymentPopup
                    bill={selectedBill}
                    onClose={() => setPaymentModalOpen(false)}
                    onPaymentComplete={(data) => {
                        // Set payment data for success popup
                        setPaymentData({
                            bill: selectedBill,
                            payment: data.payment,
                            amount: selectedBill.totalAmount
                        });
                        setPaymentSuccess(true);
                        fetchAllBills(); // Refresh bills list
                        setPaymentModalOpen(false);
                    }}
                />
            )}

            {/* Payment Success Popup */}
            <PaymentSuccessPopup
                isOpen={paymentSuccess}
                onClose={() => {
                    setPaymentSuccess(false);
                    setPaymentData(null);
                }}
                paymentData={paymentData}
            />
        </div>
    );
}