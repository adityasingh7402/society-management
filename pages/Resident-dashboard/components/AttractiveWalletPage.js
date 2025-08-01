import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AttractiveWalletPage = () => {
  const [balanceInfo, setBalanceInfo] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newAmount, setNewAmount] = useState('');

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const token = localStorage.getItem('Resident');
        const balanceData = await axios.get('/api/wallet/balance', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const transactionData = await axios.get('/api/wallet/transactions', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setBalanceInfo(balanceData.data.data);
        setTransactions(transactionData.data.data.transactions);

      } catch (err) {
        console.error('Error fetching wallet data:', err);
        setError('Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    };
    fetchWalletData();
  }, []);

  const handleAddMoney = async () => {
    try {
      const token = localStorage.getItem('Resident');
      await axios.post('/api/wallet/add-money', {
        amount: newAmount,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Money added successfully!');
      setNewAmount('');
    } catch (err) {
      console.error('Error adding money:', err);
      setError('Failed to add money');
    }
  };

  if (loading) return <div>Loading...</div>;

  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-4">Wallet Overview</h1>
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold">Balance Information</h2>
        <p>Current Balance: ₹{balanceInfo.currentBalance.toLocaleString()}</p>
        <p>Total Credits: ₹{balanceInfo.totalCredits.toLocaleString()}</p>
        <p>Total Debits: ₹{balanceInfo.totalDebits.toLocaleString()}</p>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Add Money</label>
          <input
            type="number"
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            placeholder="Enter amount"
          />
          <button
            onClick={handleAddMoney}
            className="mt-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Money
          </button>
        </div>
      </div>
      <div className="bg-white shadow rounded-lg mt-6 p-4">
        <h2 className="text-lg font-semibold mb-2">Transaction History</h2>
        <ul>
          {transactions.map((transaction) => (
            <li key={transaction._id} className="border-b py-2 flex justify-between">
              <span>{transaction.type}</span>
              <span>{transaction.amount}</span>
              <span className={transaction.transactionFlow === 'CREDIT' ? "text-green-600" : "text-red-600"}>
                {transaction.transactionFlow}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AttractiveWalletPage;

