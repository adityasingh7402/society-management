import React from 'react';
import { Download } from 'lucide-react';
import { FaArrowLeft } from "react-icons/fa";
import { useRouter } from 'next/router';

export default function Ownership() {
    const router = useRouter();
    // Sample ownership data
    const ownershipDetails = {
        owner: "Rahul Sharma",
        flatNo: "A-201",
        purchaseDate: "2022-06-15",
        registrationDate: "2022-07-10",
        propertyValue: "₹85,00,000",
        area: "1250 sq. ft.",
        propertyTax: "₹22,500/year",
        maintenanceCharges: "₹3,500/month"
    };

    // Sample documents
    const documents = [
        { id: 1, name: "Sale Agreement", date: "2022-06-15", size: "2.4 MB", type: "PDF" },
        { id: 2, name: "Registration Certificate", date: "2022-07-10", size: "1.8 MB", type: "PDF" },
        { id: 3, name: "Property Tax Receipt", date: "2025-01-10", size: "850 KB", type: "PDF" },
        { id: 4, name: "Maintenance Agreement", date: "2022-06-20", size: "1.2 MB", type: "PDF" },
        { id: 5, name: "Floor Plan", date: "2022-06-15", size: "3.5 MB", type: "PDF" }
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header with Back Button */}
            <div className="classss">
                <button onClick={() => router.back()} className="flex items-center p-4 md:p-6 space-x-2 text-blue-500 hover:text-blue-600 font-semibold transition-colors">
                    <FaArrowLeft size={18} />
                    <span className="text-base">Back</span>
                </button>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-blue-600 mb-4 md:mb-8 text-center">Ownership Details</h1>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Resident Profile */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Resident Profile</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Owner Information</h3>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <p className="text-sm font-medium text-gray-500">Owner Name</p>
                                    <p className="text-sm text-gray-900">{ownershipDetails.owner}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <p className="text-sm font-medium text-gray-500">Flat Number</p>
                                    <p className="text-sm text-gray-900">{ownershipDetails.flatNo}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <p className="text-sm font-medium text-gray-500">Purchase Date</p>
                                    <p className="text-sm text-gray-900">{ownershipDetails.purchaseDate}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <p className="text-sm font-medium text-gray-500">Registration Date</p>
                                    <p className="text-sm text-gray-900">{ownershipDetails.registrationDate}</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Property Details</h3>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <p className="text-sm font-medium text-gray-500">Property Value</p>
                                    <p className="text-sm text-gray-900">{ownershipDetails.propertyValue}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <p className="text-sm font-medium text-gray-500">Area</p>
                                    <p className="text-sm text-gray-900">{ownershipDetails.area}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <p className="text-sm font-medium text-gray-500">Property Tax</p>
                                    <p className="text-sm text-gray-900">{ownershipDetails.propertyTax}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <p className="text-sm font-medium text-gray-500">Maintenance Charges</p>
                                    <p className="text-sm text-gray-900">{ownershipDetails.maintenanceCharges}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Agreement Section */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Agreement Details</h2>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                        <p className="text-sm text-blue-700">
                            Your property ownership has been registered on {ownershipDetails.registrationDate}. All legal documents are available for download below.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            The agreement includes terms related to property ownership, maintenance responsibilities, common area usage, and compliance with society rules and regulations.
                        </p>
                        <p className="text-sm text-gray-600">
                            Any modifications to the property structure require prior approval from the society management committee as per clause 8.2 of the agreement.
                        </p>
                    </div>
                </div>

                {/* Documents Section */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <h2 className="text-xl font-semibold text-gray-900 p-6 border-b border-gray-200">Documents</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {documents.map((document) => (
                                    <tr key={document.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{document.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{document.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{document.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{document.size}</td>
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
        </div>
    );
}