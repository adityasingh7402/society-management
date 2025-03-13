import React, { useState } from 'react';

export default function PaymentTracking() {
  // Sample payment data
  const payments = [
    { id: 1, resident: "Rahul Sharma", flatNo: "A-201", utilityType: "Water Bill", amount: 2000, date: "2025-03-05", status: "Paid" },
    { id: 2, resident: "Anita Patel", flatNo: "B-404", utilityType: "Electricity Bill", amount: 2500, date: "2025-03-10", status: "Paid" },
    { id: 3, resident: "Vikram Kumar", flatNo: "C-102", utilityType: "Gas Bill", amount: 1500, date: "2025-02-15", status: "Unpaid" },
    { id: 4, resident: "Priya Singh", flatNo: "A-305", utilityType: "Maintenance Bill", amount: 3000, date: "2025-03-07", status: "Paid" },
    { id: 5, resident: "Suresh Gupta", flatNo: "B-202", utilityType: "Water Bill", amount: 2000, date: "2025-02-15", status: "Unpaid" },
    { id: 6, resident: "Meera Joshi", flatNo: "D-101", utilityType: "Electricity Bill", amount: 2500, date: "2025-03-01", status: "Paid" },
    { id: 7, resident: "Amit Verma", flatNo: "C-306", utilityType: "Gas Bill", amount: 1500, date: "2025-02-15", status: "Unpaid" },
    { id: 8, resident: "Sanjay Kapoor", flatNo: "A-108", utilityType: "Maintenance Bill", amount: 3000, date: "2025-03-09", status: "Paid" }
  ];

  // State for filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUtilityType, setFilterUtilityType] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  // Filtered payments
  const filteredPayments = payments.filter((payment) => {
    return (
      (filterStatus === "all" || payment.status.toLowerCase() === filterStatus) &&
      (filterUtilityType === "all" || payment.utilityType === filterUtilityType) &&
      (filterDate === "" || payment.date === filterDate)
    );
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Payment Tracking</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            {/* Utility Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Utility Type</label>
              <select
                value={filterUtilityType}
                onChange={(e) => setFilterUtilityType(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All</option>
                <option value="Water Bill">Water Bill</option>
                <option value="Electricity Bill">Electricity Bill</option>
                <option value="Gas Bill">Gas Bill</option>
                <option value="Maintenance Bill">Maintenance Bill</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Payment Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-xl font-semibold text-gray-900 p-6 border-b border-gray-200">Payment History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resident</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flat No.</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utility Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.resident}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.flatNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.utilityType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{payment.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.status === "Paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {payment.status}
                      </span>
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