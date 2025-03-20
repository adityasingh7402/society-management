import React, { useState } from 'react';
import { FaUser, FaHistory, FaInfoCircle, FaCalendarAlt, FaArrowLeft } from 'react-icons/fa';
import { useRouter } from 'next/router';

export default function TenantInfo() {
    const router = useRouter();

    // Sample data for tenant history
    const [tenantHistory, setTenantHistory] = useState([
        {
            id: 1,
            name: "Rahul Sharma",
            moveInDate: "2023-01-15",
            moveOutDate: "2023-09-30",
            status: "Past Tenant",
            contact: "+91 98765 43210",
            rentPaidOnTime: true
        },
        {
            id: 2,
            name: "Priya Singh",
            moveInDate: "2023-10-01",
            moveOutDate: null,
            status: "Current Tenant",
            contact: "+91 87654 32109",
            rentPaidOnTime: true
        },
        {
            id: 3,
            name: "Anil Kumar",
            moveInDate: "2022-06-01",
            moveOutDate: "2022-12-31",
            status: "Past Tenant",
            contact: "+91 76543 21098",
            rentPaidOnTime: false
        }
    ]);

    // Calculate current tenants
    const currentTenants = tenantHistory.filter(tenant => tenant.status === "Current Tenant");

    // Suggestions for managing tenants
    const suggestions = [
        "Maintain a digital record of all tenant agreements and documents.",
        "Conduct regular inspections to ensure the property is well-maintained.",
        "Communicate clearly with tenants about rent due dates and maintenance schedules.",
        "Use a tenant management system to track payments and lease renewals.",
        "Screen tenants thoroughly before approving their application."
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header with Back Button */}
            <div className=" p-4 md:p-6">
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
                <h1 className="text-2xl md:text-3xl text-center font-bold text-blue-600 mb-6">Tenant Information</h1>

                {/* Grid Layout for Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Current Tenants Section */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <FaUser className="mr-2 text-blue-600" />
                            Current Tenants
                        </h2>
                        <p className="text-gray-700 mb-4">
                            There are currently <span className="font-bold">{currentTenants.length}</span> tenant(s) living in this flat.
                        </p>
                        {currentTenants.length > 0 ? (
                            <div className="space-y-4">
                                {currentTenants.map(tenant => (
                                    <div key={tenant.id} className="border border-gray-200 rounded-md p-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-medium text-gray-900">{tenant.name}</h3>
                                                <p className="text-sm text-gray-500">{tenant.contact}</p>
                                            </div>
                                            <span className={`text-sm px-2 py-1 rounded-full ${tenant.rentPaidOnTime ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {tenant.rentPaidOnTime ? "Rent Paid on Time" : "Rent Delayed"}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-2">
                                            <p>Move-In Date: {tenant.moveInDate}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No current tenants.</p>
                        )}
                    </div>

                    {/* Tenant History Section */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <FaHistory className="mr-2 text-blue-600" />
                            Tenant History
                        </h2>
                        {tenantHistory.length > 0 ? (
                            <div className="space-y-4">
                                {tenantHistory.map(tenant => (
                                    <div key={tenant.id} className="border border-gray-200 rounded-md p-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-medium text-gray-900">{tenant.name}</h3>
                                                <p className="text-sm text-gray-500">{tenant.contact}</p>
                                            </div>
                                            <span className={`text-sm px-2 py-1 rounded-full ${tenant.status === "Current Tenant" ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {tenant.status}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-2">
                                            <p>Move-In Date: {tenant.moveInDate}</p>
                                            {tenant.moveOutDate && <p>Move-Out Date: {tenant.moveOutDate}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No tenant history available.</p>
                        )}
                    </div>
                </div>

                {/* Suggestions Section */}
                <div className="bg-white rounded-lg shadow p-6 mt-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                        <FaInfoCircle className="mr-2 text-blue-600" />
                        Suggestions for Managing Tenants
                    </h2>
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                        {suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}