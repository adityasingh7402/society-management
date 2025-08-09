import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const WalletDashboardEnhanced = () => {
  const [balanceInfo, setBalanceInfo] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [addingMoney, setAddingMoney] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionSummary, setTransactionSummary] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Decode JWT token to get user info
    const token = localStorage.getItem('Resident');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserInfo(decoded);
      } catch (err) {
        console.error('Error decoding token:', err);
      }
    }
    
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('Resident');
      
      const [balanceResponse, transactionsResponse] = await Promise.all([
        axios.get('/api/wallet/balance-enhanced', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/wallet/transactions-enhanced?limit=10', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setBalanceInfo(balanceResponse.data.data);
      setTransactions(transactionsResponse.data.data.transactions);
      setTransactionSummary(transactionsResponse.data.data.summary);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('Failed to load wallet information');
      if (err.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoney = async () => {
    if (!addMoneyAmount || addMoneyAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Check tenant restrictions
    if (balanceInfo?.walletType === 'TENANT' && balanceInfo?.restrictions) {
      if (!balanceInfo.restrictions.canAddMoney) {
        alert('You are not allowed to add money to your wallet');
        return;
      }
      if (addMoneyAmount > balanceInfo.restrictions.maxDailyAddMoney) {
        alert(`Maximum daily add money limit is ₹${balanceInfo.restrictions.maxDailyAddMoney}`);
        return;
      }
    }

    try {
      setAddingMoney(true);
      const token = localStorage.getItem('Resident');
      
      await axios.post('/api/wallet/add-money-enhanced', {
        amount: parseFloat(addMoneyAmount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Money added successfully!');
      setAddMoneyAmount('');
      setShowAddMoney(false);
      fetchWalletData(); // Refresh data
    } catch (err) {
      console.error('Error adding money:', err);
      alert(err.response?.data?.error || 'Failed to add money');
    } finally {
      setAddingMoney(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    const iconMap = {
      'ADD_MONEY': '💰',
      'BILL_PAYMENT': '🧾',
      'MAINTENANCE_PAYMENT': '🏠',
      'UTILITY_PAYMENT': '⚡',
      'AMENITY_PAYMENT': '🏊‍♂️',
      'TRANSFER': '↔️',
      'REFUND': '↩️',
      'PENALTY': '⚠️',
      'REWARD': '🎁'
    };
    return iconMap[type] || '💳';
  };

  const getWalletTitle = () => {
    if (balanceInfo?.walletType === 'TENANT') {
      return 'Tenant Digital Wallet';
    }
    return 'Digital Wallet';
  };

  const getWalletDescription = () => {
    if (balanceInfo?.walletType === 'TENANT') {
      return 'Manage your tenant payments and transactions';
    }
    return 'Manage your society payments and transactions';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!balanceInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading wallet information...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{getWalletTitle()}</h1>
              <p className="text-gray-600">{getWalletDescription()}</p>
            </div>
            {balanceInfo.walletType === 'TENANT' && (
              <div className="text-right">
                <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                  Tenant Account
                </div>
                {balanceInfo.residentInfo?.parentResident && (
                  <p className="text-xs text-gray-500 mt-1">
                    Under: {balanceInfo.residentInfo.parentResident}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`${balanceInfo.walletType === 'TENANT' ? 'bg-gradient-to-r from-orange-600 to-orange-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'} rounded-xl p-6 text-white shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${balanceInfo.walletType === 'TENANT' ? 'text-orange-100' : 'text-blue-100'} text-sm font-medium`}>
                  Current Balance
                </p>
                <p className="text-2xl font-bold">{formatCurrency(balanceInfo.currentBalance)}</p>
              </div>
              <div className={`p-3 ${balanceInfo.walletType === 'TENANT' ? 'bg-orange-500' : 'bg-blue-500'} bg-opacity-30 rounded-full`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            {balanceInfo.isFrozen && (
              <div className="mt-2 flex items-center text-yellow-200">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-xs">Wallet Frozen</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Credits</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(balanceInfo.totalCredits)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Debits</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(balanceInfo.totalDebits)}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Wallet Status</p>
                <p className={`text-lg font-semibold ${
                  balanceInfo.isActive && !balanceInfo.isFrozen 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {balanceInfo.isActive && !balanceInfo.isFrozen ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                balanceInfo.isActive && !balanceInfo.isFrozen 
                  ? 'bg-green-100' 
                  : 'bg-red-100'
              }`}>
                <svg className={`w-6 h-6 ${
                  balanceInfo.isActive && !balanceInfo.isFrozen 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={balanceInfo.isActive && !balanceInfo.isFrozen ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                {/* Add Money Button - Check restrictions for tenants */}
                {(!balanceInfo.restrictions || balanceInfo.restrictions.canAddMoney) && (
                  <button
                    onClick={() => setShowAddMoney(!showAddMoney)}
                    className={`w-full flex items-center justify-center px-4 py-3 ${balanceInfo.walletType === 'TENANT' ? 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800' : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'} text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg`}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Money
                  </button>
                )}
                
                {showAddMoney && (
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount to Add
                      {balanceInfo.restrictions?.maxDailyAddMoney && (
                        <span className="text-xs text-gray-500 ml-2">
                          (Max: ₹{balanceInfo.restrictions.maxDailyAddMoney}/day)
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      value={addMoneyAmount}
                      onChange={(e) => setAddMoneyAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter amount"
                      min="1"
                      max={balanceInfo.restrictions?.maxDailyAddMoney || undefined}
                    />
                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={handleAddMoney}
                        disabled={addingMoney}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {addingMoney ? 'Adding...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddMoney(false);
                          setAddMoneyAmount('');
                        }}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Pay Bills - Check restrictions for tenants */}
                {(!balanceInfo.restrictions || balanceInfo.restrictions.canPayUtilities) && (
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Pay Bills
                  </button>
                )}
                
                {/* Transfer Money - Check restrictions for tenants */}
                {(!balanceInfo.restrictions || balanceInfo.restrictions.canTransferMoney) && (
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Transfer Money
                  </button>
                )}

                {/* Show restrictions for tenant */}
                {balanceInfo.walletType === 'TENANT' && balanceInfo.restrictions && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="text-sm font-medium text-orange-800 mb-2">Account Restrictions</h4>
                    <div className="space-y-1 text-xs text-orange-700">
                      {!balanceInfo.restrictions.canAddMoney && (
                        <p>• Cannot add money to wallet</p>
                      )}
                      {!balanceInfo.restrictions.canTransferMoney && (
                        <p>• Cannot transfer money</p>
                      )}
                      {!balanceInfo.restrictions.canPayUtilities && (
                        <p>• Cannot pay utility bills</p>
                      )}
                      {balanceInfo.restrictions.maxDailyAddMoney && (
                        <p>• Daily add money limit: ₹{balanceInfo.restrictions.maxDailyAddMoney}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Limits */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Transaction Limits</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-600">Daily Limit</span>
                    <span className="text-sm text-gray-900">
                      {formatCurrency(balanceInfo.limits.daily.usedAmount)} / {formatCurrency(balanceInfo.limits.daily.maxAmount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${balanceInfo.walletType === 'TENANT' ? 'bg-orange-600' : 'bg-blue-600'} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${Math.min((balanceInfo.limits.daily.usedAmount / balanceInfo.limits.daily.maxAmount) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-600">Monthly Limit</span>
                    <span className="text-sm text-gray-900">
                      {formatCurrency(balanceInfo.limits.monthly.usedAmount)} / {formatCurrency(balanceInfo.limits.monthly.maxAmount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((balanceInfo.limits.monthly.usedAmount / balanceInfo.limits.monthly.maxAmount) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Per Transaction Limit</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(balanceInfo.limits.perTransaction.maxAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  View All
                </button>
              </div>
              
              {transactionSummary && (
                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Transactions</p>
                    <p className="text-lg font-semibold text-gray-900">{transactionSummary.transactionCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Credits</p>
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(transactionSummary.totalCredit)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Debits</p>
                    <p className="text-lg font-semibold text-red-600">{formatCurrency(transactionSummary.totalDebit)}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <div key={transaction._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getTransactionIcon(transaction.type)}</div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {transaction.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <p className="text-sm text-gray-600">{formatDate(transaction.createdAt)}</p>
                          {transaction.description && (
                            <p className="text-xs text-gray-500 mt-1">{transaction.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.transactionFlow === 'CREDIT' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {transaction.transactionFlow === 'CREDIT' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <p className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                          transaction.status === 'SUCCESS' 
                            ? 'bg-green-100 text-green-800' 
                            : transaction.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-500">No transactions yet</p>
                    <p className="text-gray-400 text-sm mt-1">Your transaction history will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-900">{balanceInfo.residentInfo.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-900">{balanceInfo.residentInfo.phone}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Flat Number</p>
                <p className="font-medium text-gray-900">{balanceInfo.residentInfo.flatNumber}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Wallet ID:</span>
                <span className="font-mono text-sm font-medium text-gray-900">{balanceInfo.walletId}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  balanceInfo.walletType === 'TENANT' 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {balanceInfo.walletType}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Last Activity: {formatDate(balanceInfo.lastActivity)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletDashboardEnhanced;
