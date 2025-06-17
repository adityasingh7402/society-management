import React, { useState, useEffect } from 'react';
import PreloaderSociety from '../../components/PreloaderSociety';

export default function PaymentTracking() {
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUtilityType, setFilterUtilityType] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [billHistory, setBillHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/MaintenanceBill-Api/getBills');
      if (response.ok) {
        const data = await response.json();
        setBillHistory(data.bills);
        setFilteredHistory(data.bills);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {loading ? (
        <PreloaderSociety />
      ) : (
        <div className="min-h-screen bg-gray-100">
          <header className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-3xl font-bold text-gray-900">Payment Tracking</h1>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Filters</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          ₹{((bill.amount || 0) + 
                             (bill.additionalCharges?.reduce((sum, charge) => sum + (charge.amount || 0), 0) || 0) + 
                             (bill.penaltyAmount || 0) + 
                             (bill.currentPenalty || 0)).toLocaleString()}
                          {(bill.penaltyAmount > 0 || bill.currentPenalty > 0) && (
                            <span className="text-xs text-red-500 block">
                              (includes ₹{((bill.penaltyAmount || 0) + (bill.currentPenalty || 0)).toLocaleString()} penalty)
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
      )}
    </div>
  );
}