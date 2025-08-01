import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaHistory, FaDownload, FaFilter, FaSort, FaSearch, FaFileInvoiceDollar, FaCreditCard, FaCalendarAlt, FaWater, FaBolt, FaTools, FaWifi } from 'react-icons/fa';
import { useRouter } from 'next/router';

export default function History() {
    const router = useRouter();
    const [selectedBill, setSelectedBill] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [paymentType, setPaymentType] = useState('all');
    const [billType, setBillType] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');

    // Sample data for payment history (expanded from your original data)
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
            paymentMethod: "Credit Card ending with 4582",
            billPeriod: "Jan 15 - Feb 15, 2025",
            meterReading: "3256 kWh",
            previousReading: "2985 kWh",
            consumptionUnits: "271 kWh",
            ratePerUnit: 5.25,
            taxAmount: 142.28,
            discounts: 0,
            invoiceNumber: "ELSEB/2025/02/45721"
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
            paymentMethod: "UPI Payment",
            billPeriod: "Jan 10 - Feb 10, 2025",
            meterReading: "218 kL",
            previousReading: "195 kL",
            consumptionUnits: "23 kL",
            ratePerUnit: 25.5,
            taxAmount: 92.75,
            discounts: 0,
            invoiceNumber: "MWS/2025/03/12847"
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
            paymentMethod: "Net Banking",
            billPeriod: "February 2025",
            meterReading: null,
            previousReading: null,
            consumptionUnits: null,
            ratePerUnit: null,
            taxAmount: 0,
            discounts: 0,
            invoiceNumber: "APMNT/2025/02/1057"
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
            paymentMethod: "Credit Card ending with 4582",
            billPeriod: "March 2025",
            meterReading: null,
            previousReading: null,
            consumptionUnits: "100 Mbps Unlimited",
            ratePerUnit: null,
            taxAmount: 152.68,
            discounts: 0,
            invoiceNumber: "BSL/2025/03/78541"
        },
        {
            id: 105,
            type: "Electricity",
            icon: <FaBolt className="text-yellow-500" />,
            provider: "State Electricity Board",
            amount: 1585.30,
            dueDate: "2025-02-05",
            paidOn: "2025-02-03",
            transactionId: "EL2502031455",
            paymentMethod: "Debit Card ending with 7831",
            billPeriod: "Dec 15 - Jan 15, 2025",
            meterReading: "2985 kWh",
            previousReading: "2740 kWh",
            consumptionUnits: "245 kWh",
            ratePerUnit: 5.25,
            taxAmount: 129.95,
            discounts: 10.00,
            invoiceNumber: "ELSEB/2025/01/38952"
        },
        {
            id: 106,
            type: "Water",
            icon: <FaWater className="text-blue-500" />,
            provider: "Municipal Water Supply",
            amount: 612.45,
            dueDate: "2025-02-10",
            paidOn: "2025-02-07",
            transactionId: "WT2502071230",
            paymentMethod: "UPI Payment",
            billPeriod: "Dec 10 - Jan 10, 2025",
            meterReading: "195 kL",
            previousReading: "174 kL",
            consumptionUnits: "21 kL",
            ratePerUnit: 25.5,
            taxAmount: 83.73,
            discounts: 0,
            invoiceNumber: "MWS/2025/02/10489"
        },
        {
            id: 107,
            type: "Maintenance",
            icon: <FaTools className="text-gray-600" />,
            provider: "Apartment Association",
            amount: 2500.00,
            dueDate: "2025-01-31",
            paidOn: "2025-01-28",
            transactionId: "MT2501281045",
            paymentMethod: "Net Banking",
            billPeriod: "January 2025",
            meterReading: null,
            previousReading: null,
            consumptionUnits: null,
            ratePerUnit: null,
            taxAmount: 0,
            discounts: 0,
            invoiceNumber: "APMNT/2025/01/0895"
        },
        {
            id: 108,
            type: "Internet",
            icon: <FaWifi className="text-indigo-500" />,
            provider: "Broadband Services Ltd.",
            amount: 999.00,
            dueDate: "2025-02-25",
            paidOn: "2025-02-20",
            transactionId: "IN2502201345",
            paymentMethod: "Credit Card ending with 4582",
            billPeriod: "February 2025",
            meterReading: null,
            previousReading: null,
            consumptionUnits: "100 Mbps Unlimited",
            ratePerUnit: null,
            taxAmount: 152.68,
            discounts: 0,
            invoiceNumber: "BSL/2025/02/65287"
        }
    ]);

    // Calculate statistics
    const stats = {
        totalPaid: paymentHistory.reduce((sum, payment) => sum + payment.amount, 0),
        averageMonthly: paymentHistory.reduce((sum, payment) => sum + payment.amount, 0) /
            ([...new Set(paymentHistory.map(p => p.billPeriod.split(' - ')[0].split(' ')[0] + ' ' +
                p.billPeriod.split(' - ')[0].split(' ')[1]))].length || 1),
        highestBill: Math.max(...paymentHistory.map(p => p.amount)),
        mostUsedPayment: Object.entries(paymentHistory.reduce((acc, curr) => {
            const method = curr.paymentMethod.split(' ')[0];
            acc[method] = (acc[method] || 0) + 1;
            return acc;
        }, {})).sort((a, b) => b[1] - a[1])[0][0]
    };

    // Filter and sort function
    const getFilteredPayments = () => {
        return paymentHistory
            .filter(payment => {
                // Search filter
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch =
                    payment.type.toLowerCase().includes(searchLower) ||
                    payment.provider.toLowerCase().includes(searchLower) ||
                    payment.transactionId.toLowerCase().includes(searchLower) ||
                    payment.paymentMethod.toLowerCase().includes(searchLower) ||
                    payment.invoiceNumber.toLowerCase().includes(searchLower);

                // Date range filter
                const paidDate = new Date(payment.paidOn);
                const matchesDateFrom = !dateRange.from || paidDate >= new Date(dateRange.from);
                const matchesDateTo = !dateRange.to || paidDate <= new Date(dateRange.to);

                // Payment method filter
                const matchesPaymentType = paymentType === 'all' ||
                    payment.paymentMethod.toLowerCase().includes(paymentType.toLowerCase());

                // Bill type filter
                const matchesBillType = billType === 'all' || payment.type === billType;

                return matchesSearch && matchesDateFrom && matchesDateTo &&
                    matchesPaymentType && matchesBillType;
            })
            .sort((a, b) => {
                if (sortBy === 'date') {
                    return sortOrder === 'asc'
                        ? new Date(a.paidOn) - new Date(b.paidOn)
                        : new Date(b.paidOn) - new Date(a.paidOn);
                } else if (sortBy === 'amount') {
                    return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
                } else if (sortBy === 'type') {
                    return sortOrder === 'asc'
                        ? a.type.localeCompare(b.type)
                        : b.type.localeCompare(a.type);
                }
                return 0;
            });
    };

    const filteredPayments = getFilteredPayments();

    // Function to handle viewing bill details
    const handleViewDetails = (payment) => {
        setSelectedBill(payment);
        setDetailModalOpen(true);
    };

    // Reset filters
    const resetFilters = () => {
        setSearchTerm('');
        setDateRange({ from: '', to: '' });
        setPaymentType('all');
        setBillType('all');
        setSortBy('date');
        setSortOrder('desc');
        setFilterOpen(false);
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
                <h1 className="text-2xl md:text-3xl text-center font-bold text-blue-600 mb-6">Payment History Details</h1>

                {/* Analytics Overview */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Analytics</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-gray-500">Total Paid</p>
                            <p className="text-2xl font-bold text-blue-600">₹{stats.totalPaid.toFixed(2)}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-gray-500">Average Monthly</p>
                            <p className="text-2xl font-bold text-green-600">₹{stats.averageMonthly.toFixed(2)}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-gray-500">Highest Bill</p>
                            <p className="text-2xl font-bold text-red-600">₹{stats.highestBill.toFixed(2)}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-gray-500">Preferred Payment</p>
                            <p className="text-2xl font-bold text-purple-600">{stats.mostUsedPayment}</p>
                        </div>
                    </div>
                </div>

                {/* Search and Filter Controls */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex flex-col gap-4 mb-4">
                        {/* Search */}
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search bills, providers, transactions..."
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filter and Sort Controls */}
                        <div className="flex flex-wrap gap-2">
                            {/* Filter Toggle Button */}
                            <button
                                onClick={() => setFilterOpen(!filterOpen)}
                                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <FaFilter className="mr-2" />
                                Filters {Object.values({
                                    date: dateRange.from || dateRange.to,
                                    payment: paymentType !== 'all',
                                    bill: billType !== 'all'
                                }).filter(Boolean).length > 0 ? `(${Object.values({
                                    date: dateRange.from || dateRange.to,
                                    payment: paymentType !== 'all',
                                    bill: billType !== 'all'
                                }).filter(Boolean).length})` : ''}
                            </button>

                            {/* Sort Direction Button */}
                            <button
                                onClick={() => {
                                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                }}
                                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <FaSort className="mr-2" />
                                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                            </button>

                            {/* Sort By Dropdown */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <option value="date">Sort by Date</option>
                                <option value="amount">Sort by Amount</option>
                                <option value="type">Sort by Type</option>
                            </select>
                        </div>
                    </div>

                    {/* Filter Panel */}
                    {filterOpen && (
                        <div className="bg-gray-50 p-4 rounded-lg mt-2 border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Date Range */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                                    <div className="flex space-x-2">
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-500">From</label>
                                            <input
                                                type="date"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={dateRange.from}
                                                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-500">To</label>
                                            <input
                                                type="date"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={dateRange.to}
                                                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                    <select
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        value={paymentType}
                                        onChange={(e) => setPaymentType(e.target.value)}
                                    >
                                        <option value="all">All Payment Methods</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="UPI">UPI Payment</option>
                                        <option value="NEFT">NEFT</option>
                                        <option value="RTGS">RTGS</option>
                                        <option value="Card">Card Payment</option>
                                        <option value="Wallet">Wallet Payment</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                {/* Bill Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bill Type</label>
                                    <select
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        value={billType}
                                        onChange={(e) => setBillType(e.target.value)}
                                    >
                                        <option value="all">All Bill Types</option>
                                        <option value="Electricity">Electricity</option>
                                        <option value="Water">Water</option>
                                        <option value="Internet">Internet</option>
                                        <option value="Maintenance">Maintenance</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={resetFilters}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Payments Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <FaHistory className="mr-2 text-blue-600" />
                            Payment History ({filteredPayments.length} records)
                        </h2>

                        {filteredPayments.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Bill Details
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Payment Date
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Payment Method
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Invoice #
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredPayments.map((payment) => (
                                            <tr key={payment.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                                                            {payment.icon}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{payment.type}</div>
                                                            <div className="text-sm text-gray-500">{payment.provider}</div>
                                                            <div className="text-xs text-gray-500">{payment.billPeriod}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">₹{payment.amount.toFixed(2)}</div>
                                                    {payment.taxAmount > 0 && (
                                                        <div className="text-xs text-gray-500">Inc. tax: ₹{payment.taxAmount.toFixed(2)}</div>
                                                    )}
                                                    {payment.discounts > 0 && (
                                                        <div className="text-xs text-green-500">Discount: ₹{payment.discounts.toFixed(2)}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{payment.paidOn}</div>
                                                    <div className="text-xs text-gray-500">
                                                        <FaCalendarAlt className="inline mr-1" />
                                                        Due: {payment.dueDate}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        <FaCreditCard className="inline mr-1" />
                                                        {payment.paymentMethod}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Trans ID: {payment.transactionId}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {payment.invoiceNumber}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex justify-center space-x-2">
                                                        <button
                                                            onClick={() => handleViewDetails(payment)}
                                                            className="text-blue-600 hover:text-blue-800"
                                                            title="View Details"
                                                        >
                                                            <FaFileInvoiceDollar size={18} />
                                                        </button>
                                                        <button
                                                            className="text-green-600 hover:text-green-800"
                                                            title="Download Invoice"
                                                        >
                                                            <FaDownload size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No payment records match your filters.</p>
                                <button
                                    onClick={resetFilters}
                                    className="mt-4 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bill Detail Modal */}
            {detailModalOpen && selectedBill && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Bill Details</h2>
                            <button
                                onClick={() => setDetailModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg mb-4 flex justify-between items-center">
                            <div className="flex items-center">
                                <div className="p-3 bg-white rounded-full shadow mr-4">
                                    {selectedBill.icon}
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">{selectedBill.type} Bill</h3>
                                    <p className="text-sm text-gray-600">{selectedBill.provider}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Invoice Number</p>
                                <p className="text-sm font-medium">{selectedBill.invoiceNumber}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-2">Bill Information</h4>
                                <dl className="space-y-2">
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-gray-500">Bill Period:</dt>
                                        <dd className="text-sm font-medium text-gray-900">{selectedBill.billPeriod}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-gray-500">Due Date:</dt>
                                        <dd className="text-sm font-medium text-gray-900">{selectedBill.dueDate}</dd>
                                    </div>
                                    {selectedBill.meterReading && (
                                        <>
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500">Current Reading:</dt>
                                                <dd className="text-sm font-medium text-gray-900">{selectedBill.meterReading}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500">Previous Reading:</dt>
                                                <dd className="text-sm font-medium text-gray-900">{selectedBill.previousReading}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500">Consumption:</dt>
                                                <dd className="text-sm font-medium text-gray-900">{selectedBill.consumptionUnits}</dd>
                                            </div>
                                            {selectedBill.ratePerUnit && (
                                                <div className="flex justify-between">
                                                    <dt className="text-sm text-gray-500">Rate per Unit:</dt>
                                                    <dd className="text-sm font-medium text-gray-900">₹{selectedBill.ratePerUnit}</dd>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </dl>
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-2">Payment Information</h4>
                                <dl className="space-y-2">
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-gray-500">Payment Date:</dt>
                                        <dd className="text-sm font-medium text-gray-900">{selectedBill.paidOn}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-gray-500">Payment Method:</dt>
                                        <dd className="text-sm font-medium text-gray-900">{selectedBill.paymentMethod}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-gray-500">Transaction ID:</dt>
                                        <dd className="text-sm font-medium text-gray-900">{selectedBill.transactionId}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
                            <h4 className="font-medium text-gray-900 mb-2">Amount Breakdown</h4>
                            <div className="space-y-2">
                                {selectedBill.consumptionUnits && selectedBill.ratePerUnit && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Consumption Charges:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {selectedBill.consumptionUnits.split(' ')[0]} × ₹{selectedBill.ratePerUnit} =
                                            ₹{(parseFloat(selectedBill.consumptionUnits.split(' ')[0]) * selectedBill.ratePerUnit).toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                {selectedBill.taxAmount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Tax:</span>
                                        <span className="text-sm font-medium text-gray-900">₹{selectedBill.taxAmount.toFixed(2)}</span>
                                    </div>
                                )}

                                {selectedBill.discounts > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Discounts:</span>
                                        <span className="text-sm font-medium text-green-600">-₹{selectedBill.discounts.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between pt-2 border-t border-gray-200">
                                    <span className="text-base font-semibold text-gray-900">Total Amount:</span>
                                    <span className="text-base font-semibold text-gray-900">₹{selectedBill.amount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <button
                                onClick={() => setDetailModalOpen(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Close
                            </button>
                            <button
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <FaDownload className="inline mr-2" />
                                Download Invoice
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}