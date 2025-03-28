import React, { useState, useEffect } from 'react';

export default function PaymentTracking() {
  // States for data and filters
  const [billHistory, setBillHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalBills: 0,
    totalAmount: 0,
    totalPaidAmount: 0,
    totalDueAmount: 0,
    totalPenalty: 0
  });

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUtilityType, setFilterUtilityType] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  // Fetch bill data
  useEffect(() => {
    const fetchBillData = async () => {
      try {
        const [utilityResponse, maintenanceResponse] = await Promise.all([
          fetch('/api/UtilityBill-Api/getBills'),
          fetch('/api/MaintenanceBill-Api/getBills')
        ]);

        const utilityData = await utilityResponse.json();
        const maintenanceData = await maintenanceResponse.json();

        // Combine and format bills
        const combinedBills = [
          ...utilityData.bills.map(bill => ({
            ...bill,
            billType: bill.utilityType,
            totalAmount: bill.baseAmount +
              (bill.additionalCharges?.reduce((acc, charge) => acc + charge.amount, 0) || 0) +
              (bill.penaltyAmount || 0)
          })),
          ...maintenanceData.bills.map(bill => ({
            ...bill,
            billType: bill.billType || bill.maintenanceType || bill.type || 'Maintenance', // Use dynamic maintenance type
            totalAmount: bill.amount +
              (bill.additionalCharges?.reduce((acc, charge) => acc + charge.amount, 0) || 0) +
              (bill.penaltyAmount || 0)
          }))
        ];

        // Calculate summary
        const summary = {
          totalBills: combinedBills.length,
          totalAmount: combinedBills.reduce((sum, bill) => sum + bill.totalAmount, 0),
          totalPaidAmount: combinedBills.filter(bill => bill.status === 'Paid')
            .reduce((sum, bill) => sum + bill.totalAmount, 0),
          totalDueAmount: combinedBills.filter(bill => bill.status !== 'Paid')
            .reduce((sum, bill) => sum + bill.totalAmount, 0),
          totalPenalty: combinedBills.reduce((sum, bill) => sum + (bill.penaltyAmount || 0), 0)
        };

        setBillHistory(combinedBills);
        setFilteredHistory(combinedBills);
        setSummaryData(summary);
      } catch (error) {
        console.error('Error fetching bills:', error);
      }
    };

    fetchBillData();
  }, []);

  // Filter effect
  useEffect(() => {
    const filtered = billHistory.filter((bill) => {
      const dateMatch = filterDate === "" || bill.issueDate?.substring(0, 10) === filterDate;
      const statusMatch = filterStatus === "all" || 
        (filterStatus === "paid" && bill.status === "Paid") ||
        (filterStatus === "unpaid" && (bill.status === "Pending" || bill.status === "Overdue"));
      const typeMatch = filterUtilityType === "all" || bill.billType === filterUtilityType;

      return dateMatch && statusMatch && typeMatch;
    });

    setFilteredHistory(filtered);
  }, [filterStatus, filterUtilityType, filterDate, billHistory]);

  // Update the table rendering
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
              <label className="block text-sm font-medium text-gray-700">Bill Type</label>
              <select
                value={filterUtilityType}
                onChange={(e) => setFilterUtilityType(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Types</option>
                <optgroup label="Utility Bills">
                  <option value="Electricity">Electricity</option>
                  <option value="Water">Water</option>
                  <option value="Gas">Gas</option>
                  <option value="Internet">Internet</option>
                  <option value="Other">Other Utility</option>
                </optgroup>
                <optgroup label="Maintenance Bills">
                  <option value="Security">Security</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Parking">Parking</option>
                  <option value="Other Maintenance">Other Maintenance</option>
                </optgroup>
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
                {filteredHistory.map((bill) => (
                  <tr key={bill._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.ownerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bill.flatNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.billType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{bill.totalAmount.toLocaleString()}
                      {bill.penaltyAmount > 0 && (
                        <span className="text-xs text-red-500 block">
                          (includes ₹{bill.penaltyAmount.toLocaleString()} penalty)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(bill.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          bill.status === "Paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                        {bill.status}
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