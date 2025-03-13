// pages/maintenance-dashboard.js
import React from 'react';
import { useState } from 'react';

export default function MaintenanceBills() {
  // Sample data for maintenance bills
  const maintenanceData = {
    collections: {
      monthly: 125000,
      yearly: 1500000,
      total: 4500000
    },
    expenses: {
      monthly: 98000,
      yearly: 1176000,
      total: 3528000
    },
    reserveFund: 972000,
    paymentStatus: {
      paid: 85,
      unpaid: 15,
      totalResidents: 100
    },
    penalty: {
      totalAmount: 45000,
      dailyIncrease: 100
    }
  };

  // Sample resident data
  const residents = [
    { id: 1, name: "Rahul Sharma", flatNo: "A-201", status: "paid", amount: 2500, paidDate: "2025-03-05" },
    { id: 2, name: "Anita Patel", flatNo: "B-404", status: "paid", amount: 2500, paidDate: "2025-03-10" },
    { id: 3, name: "Vikram Kumar", flatNo: "C-102", status: "unpaid", amount: 2500, dueDate: "2025-02-15", penalty: 2800 },
    { id: 4, name: "Priya Singh", flatNo: "A-305", status: "paid", amount: 2500, paidDate: "2025-03-07" },
    { id: 5, name: "Suresh Gupta", flatNo: "B-202", status: "unpaid", amount: 2500, dueDate: "2025-02-15", penalty: 2800 },
    { id: 6, name: "Meera Joshi", flatNo: "D-101", status: "paid", amount: 2500, paidDate: "2025-03-01" },
    { id: 7, name: "Amit Verma", flatNo: "C-306", status: "unpaid", amount: 2500, dueDate: "2025-02-15", penalty: 2800 },
    { id: 8, name: "Sanjay Kapoor", flatNo: "A-108", status: "paid", amount: 2500, paidDate: "2025-03-09" }
  ];

  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Maintenance Bills</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'paid' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('paid')}
          >
            Paid Residents
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'unpaid' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('unpaid')}
          >
            Unpaid Residents
          </button>
        </div>
        
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Collection Summary */}
            <div className="bg-white rounded-lg shadow p-6" style={{ minHeight: '400px' }}>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Collection Summary</h2>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-600 font-medium">Monthly Collection</p>
                    <p className="text-xl font-bold text-gray-900">₹{maintenanceData.collections.monthly.toLocaleString()}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-600 font-medium">Yearly Collection</p>
                    <p className="text-xl font-bold text-gray-900">₹{maintenanceData.collections.yearly.toLocaleString()}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-600 font-medium">Total Collection</p>
                    <p className="text-xl font-bold text-gray-900">₹{maintenanceData.collections.total.toLocaleString()}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-600 font-medium">Reserve Fund</p>
                    <p className="text-xl font-bold text-blue-600">₹{maintenanceData.reserveFund.toLocaleString()}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Expenses Summary */}
            <div className="bg-white rounded-lg shadow p-6" style={{ minHeight: '400px' }}>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Expenses Summary</h2>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-600 font-medium">Monthly Expenses</p>
                    <p className="text-xl font-bold text-gray-900">₹{maintenanceData.expenses.monthly.toLocaleString()}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-600 font-medium">Yearly Expenses</p>
                    <p className="text-xl font-bold text-gray-900">₹{maintenanceData.expenses.yearly.toLocaleString()}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-600 font-medium">Total Expenses</p>
                    <p className="text-xl font-bold text-gray-900">₹{maintenanceData.expenses.total.toLocaleString()}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600 font-medium">Monthly Balance</p>
                    <p className="text-xl font-bold text-green-600">
                      ₹{(maintenanceData.collections.monthly - maintenanceData.expenses.monthly).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Status */}
            <div className="bg-white rounded-lg shadow p-6" style={{ minHeight: '400px' }}>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Status</h2>
              <div className="space-y-6">
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-500">Paid</p>
                    <p className="text-xl font-bold text-green-600">{maintenanceData.paymentStatus.paid} Residents</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-500">Unpaid</p>
                    <p className="text-xl font-bold text-red-600">{maintenanceData.paymentStatus.unpaid} Residents</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-600 font-medium">Total Penalty</p>
                      <p className="text-xl font-bold text-red-600">₹{maintenanceData.penalty.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-gray-600 font-medium">Daily Increase</p>
                      <p className="text-lg font-semibold text-amber-600">₹{maintenanceData.penalty.dailyIncrease}/day</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'paid' && (
          <div className="bg-white rounded-lg shadow overflow-hidden" style={{ minHeight: '400px' }}>
            <h2 className="text-xl font-semibold text-gray-900 p-6 border-b border-gray-200">Paid Residents</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resident</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flat No.</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {residents.filter(res => res.status === 'paid').map((resident) => (
                    <tr key={resident.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                            {resident.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{resident.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{resident.flatNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{resident.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{resident.paidDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Paid
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'unpaid' && (
          <div className="bg-white rounded-lg shadow overflow-hidden" style={{ minHeight: '400px' }}>
            <h2 className="text-xl font-semibold text-gray-900 p-6 border-b border-gray-200">Unpaid Residents</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resident</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flat No.</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penalty</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {residents.filter(res => res.status === 'unpaid').map((resident) => (
                    <tr key={resident.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center text-white font-medium">
                            {resident.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{resident.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{resident.flatNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{resident.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{resident.dueDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">₹{resident.penalty.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Unpaid
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 p-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Total Unpaid Amount</p>
                  <p className="text-lg font-bold text-gray-900">₹{residents.filter(res => res.status === 'unpaid').reduce((sum, res) => sum + res.amount, 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Penalty Amount</p>
                  <p className="text-lg font-bold text-red-600">₹{residents.filter(res => res.status === 'unpaid').reduce((sum, res) => sum + res.penalty, 0).toLocaleString()}</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">Send Reminders</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}