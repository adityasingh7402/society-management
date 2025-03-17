import React, { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { FaArrowLeft } from "react-icons/fa";
import { useRouter } from 'next/router';

export default function House() {
    const router = useRouter();

    // Sample house data
    const houseDetails = {
        flatNo: "A-201",
        area: "1250 sq. ft.",
        bedrooms: "3",
        bathrooms: "2",
        floorLevel: "2nd Floor",
        lastRenovated: "2021-09-15",
        parkingSlots: "2",
        orientation: "East-West"
    };

    // Sample utility bills data
    const utilityBills = [
        { id: 1, type: "Electricity", provider: "City Power Ltd.", accountNo: "EL-89675432", dueDate: "2025-03-25", amount: "₹2,450", status: "Pending" },
        { id: 2, type: "Water", provider: "Municipal Water Board", accountNo: "WT-45678901", dueDate: "2025-03-20", amount: "₹1,120", status: "Paid" },
        { id: 3, type: "Gas", provider: "GasConnect India", accountNo: "GC-34567890", dueDate: "2025-03-15", amount: "₹850", status: "Paid" },
        { id: 4, type: "Internet", provider: "SpeedNet Fiber", accountNo: "SN-56789012", dueDate: "2025-04-01", amount: "₹1,499", status: "Pending" },
        { id: 5, type: "Cable TV", provider: "DigiView Services", accountNo: "DV-12345678", dueDate: "2025-03-28", amount: "₹799", status: "Pending" }
    ];

    // Sample maintenance records
    const maintenanceRecords = [
        { id: 1, type: "Plumbing", description: "Bathroom Leak Repair", date: "2025-02-10", cost: "₹1,200", vendor: "QuickFix Services" },
        { id: 2, type: "Electrical", description: "Wiring Inspection", date: "2025-01-22", cost: "₹1,800", vendor: "ElectroCare Solutions" },
        { id: 3, type: "Painting", description: "Living Room Wall Painting", date: "2024-12-05", cost: "₹8,500", vendor: "ColorMaster Painters" },
        { id: 4, type: "Carpentry", description: "Kitchen Cabinet Repair", date: "2024-11-15", cost: "₹3,200", vendor: "WoodWorks Inc." },
        { id: 5, type: "Appliance", description: "AC Servicing", date: "2025-03-01", cost: "₹1,500", vendor: "CoolAir Services" }
    ];

    // Filter state for bills
    const [billFilterStatus, setBillFilterStatus] = useState("all");

    // Filtered bills
    const filteredBills = utilityBills.filter((bill) => {
        return billFilterStatus === "all" || bill.status.toLowerCase() === billFilterStatus.toLowerCase();
    });

    // Calculate total pending and paid amounts
    const totalPending = utilityBills
        .filter(bill => bill.status === "Pending")
        .reduce((sum, bill) => sum + parseInt(bill.amount.replace(/[^\d]/g, '')), 0);

    const totalPaid = utilityBills
        .filter(bill => bill.status === "Paid")
        .reduce((sum, bill) => sum + parseInt(bill.amount.replace(/[^\d]/g, '')), 0);

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header with Back Button */}
            <div className="classss">
                <button onClick={() => router.back()} className="flex items-center p-4 md:p-6 space-x-2 text-blue-500 hover:text-blue-600 font-semibold transition-colors">
                    <FaArrowLeft size={18} />
                    <span className="text-base">Back</span>
                </button>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-blue-600 mb-4 md:mb-8 text-center">House Details</h1>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* House Details */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Details</h3>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <p className="text-sm font-medium text-gray-500">Flat Number</p>
                                    <p className="text-sm text-gray-900">{houseDetails.flatNo}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <p className="text-sm font-medium text-gray-500">Area</p>
                                    <p className="text-sm text-gray-900">{houseDetails.area}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <p className="text-sm font-medium text-gray-500">Bedrooms</p>
                                    <p className="text-sm text-gray-900">{houseDetails.bedrooms}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <p className="text-sm font-medium text-gray-500">Bathrooms</p>
                                    <p className="text-sm text-gray-900">{houseDetails.bathrooms}</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <p className="text-sm font-medium text-gray-500">Floor Level</p>
                                    <p className="text-sm text-gray-900">{houseDetails.floorLevel}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <p className="text-sm font-medium text-gray-500">Last Renovated</p>
                                    <p className="text-sm text-gray-900">{houseDetails.lastRenovated}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <p className="text-sm font-medium text-gray-500">Parking Slots</p>
                                    <p className="text-sm text-gray-900">{houseDetails.parkingSlots}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <p className="text-sm font-medium text-gray-500">Orientation</p>
                                    <p className="text-sm text-gray-900">{houseDetails.orientation}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bill Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Total Bills */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Total Bills</h2>
                        <p className="text-3xl font-bold text-blue-600">₹{(totalPending + totalPaid).toLocaleString()}</p>
                    </div>

                    {/* Paid Bills */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Paid Bills</h2>
                        <p className="text-3xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
                    </div>

                    {/* Pending Bills */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Pending Bills</h2>
                        <p className="text-3xl font-bold text-red-600">₹{totalPending.toLocaleString()}</p>
                    </div>
                </div>

                {/* Utility Bills Section */}
                <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                    <div className="flex justify-between items-center p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Utility Bills</h2>

                        {/* Bill Filter */}
                        <div className="flex items-center">
                            <label className="mr-2 text-sm font-medium text-gray-700">Status:</label>
                            <select
                                value={billFilterStatus}
                                onChange={(e) => setBillFilterStatus(e.target.value)}
                                className="pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            >
                                <option value="all">All</option>
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account No.</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredBills.map((bill) => (
                                    <tr key={bill.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bill.provider}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bill.accountNo}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bill.dueDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bill.amount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bill.status === "Paid"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                    }`}
                                            >
                                                {bill.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-800 transition ease-in-out duration-150">
                                                <FileText size={16} className="mr-1" />
                                                View Bill
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Maintenance Records */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <h2 className="text-xl font-semibold text-gray-900 p-6 border-b border-gray-200">Maintenance Records</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {maintenanceRecords.map((record) => (
                                    <tr key={record.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.cost}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.vendor}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-800 transition ease-in-out duration-150">
                                                <Download size={16} className="mr-1" />
                                                Download
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white shadow mt-8 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} Property Management System. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}