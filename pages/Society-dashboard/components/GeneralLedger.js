import React, { useState, useEffect } from 'react';
import { Book, Filter, Download, RefreshCw, Calendar, Search } from 'lucide-react';
import PreloaderSociety from '../../components/PreloaderSociety';
import { useRouter } from 'next/router';

export default function GeneralLedger() {
  const [loading, setLoading] = useState(true);
  const [ledgers, setLedgers] = useState([]);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of current year
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [ledgerData, setLedgerData] = useState(null);
  const router = useRouter();

  // Fetch ledgers on component mount
  useEffect(() => {
    fetchLedgers();
  }, []);

  // Fetch ledger data when ledger or date range changes
  useEffect(() => {
    if (selectedLedger) {
      fetchLedgerData();
    }
  }, [selectedLedger, dateRange]);

  const fetchLedgers = async () => {
    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      const response = await fetch('/api/Ledger-Api/get-ledgers', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLedgers(data.ledgers);
      } else {
        throw new Error('Failed to fetch ledgers');
      }
    } catch (error) {
      console.error('Error fetching ledgers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      const societyResponse = await fetch('/api/Society-Api/get-society-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!societyResponse.ok) {
        throw new Error('Failed to fetch society details');
      }

      const societyData = await societyResponse.json();
      const societyId = societyData.societyId;

      const response = await fetch(
        `/api/Journal-Api/get-general-ledger?societyId=${societyId}&ledgerId=${selectedLedger}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );

      if (response.ok) {
        const data = await response.json();
        setLedgerData(data.data);
      }
    } catch (error) {
      console.error('Error fetching ledger data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!ledgerData) return;

    const rows = [
      ['Date', 'Voucher No', 'Type', 'Reference', 'Narration', 'Debit', 'Credit', 'Balance'],
      ...ledgerData.entries.map(entry => [
        new Date(entry.voucherDate).toLocaleDateString(),
        entry.voucherNo,
        entry.voucherType,
        entry.referenceNo || '',
        entry.narration,
        entry.entries.type === 'Debit' ? entry.entries.amount.toFixed(2) : '',
        entry.entries.type === 'Credit' ? entry.entries.amount.toFixed(2) : '',
        `${entry.balance.amount.toFixed(2)} ${entry.balance.type}`
      ])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `general_ledger_${ledgerData.ledger.name}_${dateRange.startDate}_${dateRange.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <PreloaderSociety />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b-4 border-yellow-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
              <Book className="mr-3" size={32} />
              General Ledger
            </h1>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Ledger Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Ledger</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={selectedLedger || ''}
                onChange={(e) => setSelectedLedger(e.target.value)}
              >
                <option value="">Select a ledger</option>
                {ledgers.map((ledger) => (
                  <option key={ledger._id} value={ledger._id}>
                    {ledger.code} - {ledger.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-end space-x-2">
              <button
                onClick={fetchLedgerData}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200 flex items-center"
                disabled={!selectedLedger}
              >
                <RefreshCw className="mr-2" size={16} />
                Refresh
              </button>
              <button
                onClick={handleExport}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200 flex items-center"
                disabled={!ledgerData}
              >
                <Download className="mr-2" size={16} />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Data */}
        {ledgerData && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Ledger Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Ledger Name</h3>
                  <p className="mt-1 text-lg font-semibold">{ledgerData.ledger.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Code</h3>
                  <p className="mt-1 text-lg font-semibold">{ledgerData.ledger.code}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Opening Balance</h3>
                  <p className="mt-1 text-lg font-semibold">
                    ₹{ledgerData.openingBalance.amount.toFixed(2)} {ledgerData.openingBalance.type}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Closing Balance</h3>
                  <p className="mt-1 text-lg font-semibold">
                    ₹{ledgerData.closingBalance.amount.toFixed(2)} {ledgerData.closingBalance.type}
                  </p>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voucher</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Narration</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Opening Balance Row */}
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" colSpan="5">
                      Opening Balance
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {ledgerData.openingBalance.type === 'Debit' ? `₹${ledgerData.openingBalance.amount.toFixed(2)}` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {ledgerData.openingBalance.type === 'Credit' ? `₹${ledgerData.openingBalance.amount.toFixed(2)}` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      ₹{ledgerData.openingBalance.amount.toFixed(2)} {ledgerData.openingBalance.type}
                    </td>
                  </tr>

                  {/* Transaction Rows */}
                  {ledgerData.entries.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(entry.voucherDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.voucherNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.voucherType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.referenceNo || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{entry.narration}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {entry.entries.type === 'Debit' ? `₹${entry.entries.amount.toFixed(2)}` : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {entry.entries.type === 'Credit' ? `₹${entry.entries.amount.toFixed(2)}` : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        ₹{entry.balance.amount.toFixed(2)} {entry.balance.type}
                      </td>
                    </tr>
                  ))}

                  {/* Totals Row */}
                  <tr className="bg-gray-100 font-medium">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" colSpan="5">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      ₹{ledgerData.totals.totalDebit.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      ₹{ledgerData.totals.totalCredit.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      ₹{ledgerData.closingBalance.amount.toFixed(2)} {ledgerData.closingBalance.type}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 