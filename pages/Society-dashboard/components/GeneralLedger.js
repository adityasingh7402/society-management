import React, { useState, useEffect, useMemo } from 'react';
import { Book, Filter, Download, RefreshCw, Calendar, Search, FileText, Tag, Info } from 'lucide-react';
import PreloaderSociety from '../../components/PreloaderSociety';
import { useRouter } from 'next/router';
import { usePermissions } from "../../../components/PermissionsContext";
import AccessDenied from "../widget/societyComponents/accessRestricted";

export default function GeneralLedger() {
  const permissions = usePermissions();
  if (!permissions.includes("view_reports") && !permissions.includes("full_access")) {
    return <AccessDenied />;
  }
  const [loading, setLoading] = useState(true);
  const [ledgers, setLedgers] = useState([]);
  const [selectedBillHead, setSelectedBillHead] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [combinedLedgerData, setCombinedLedgerData] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    voucherType: '',
    minAmount: '',
    maxAmount: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIncomeLedger, setSelectedIncomeLedger] = useState('');
  const [selectedReceivableLedger, setSelectedReceivableLedger] = useState('');

  const router = useRouter();

  // Ledger types and categories from the model
  const ledgerTypes = ['Asset', 'Liability', 'Income', 'Expense', 'Equity'];
  const ledgerCategories = [
    'Current Asset', 'Fixed Asset', 'Bank', 'Cash', 'Receivable', 'Investment',
    'Current Liability', 'Long Term Liability', 'Payable', 'Deposit',
    'Operating Income', 'Other Income', 'Interest Income',
    'Operating Expense', 'Administrative Expense', 'Financial Expense',
    'Capital', 'Reserve', 'Surplus'
  ];
  const voucherTypes = [
    'Receipt', 'Payment', 'Journal', 'Contra', 'Sales', 'Purchase', 'Credit Note', 'Debit Note'
  ];

  // Format amount helper
  const formatAmount = (amount, type) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
    const formattedAmount = Math.abs(amount).toFixed(2);
    return `₹${formattedAmount}${type ? ` ${type}` : ''}`;
  };

  // Add helper for balance color
  const getBalanceColor = (type, ledgerType) => {
    if (type === 'Balanced') return 'text-gray-600';
    
    switch(ledgerType) {
      case 'Asset':
      case 'Expense':
        return type === 'Debit' ? 'text-green-600' : 'text-red-600';
      case 'Liability':
      case 'Income':
      case 'Equity':
        return type === 'Credit' ? 'text-green-600' : 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Add helper for voucher type color
  const getVoucherTypeColor = (type) => {
    const colors = {
      'Receipt': 'text-green-600',
      'Payment': 'text-red-600',
      'Journal': 'text-blue-600',
      'Contra': 'text-purple-600',
      'Sales': 'text-indigo-600',
      'Purchase': 'text-orange-600',
      'Credit Note': 'text-teal-600',
      'Debit Note': 'text-pink-600'
    };
    return colors[type] || 'text-gray-600';
  };

  // Group ledgers by bill head
  const groupedLedgers = useMemo(() => {
    const groups = {};
    ledgers.forEach(ledger => {
      if (ledger.billCategory && ledger.subCategory) {
        const key = `${ledger.billCategory} - ${ledger.subCategory}`;
        if (!groups[key]) {
          groups[key] = {
            billCategory: ledger.billCategory,
            subCategory: ledger.subCategory,
            displayName: key,
            incomeLedger: null,
            receivableLedger: null
          };
        }
        if (ledger.category === 'Operating Income') {
          groups[key].incomeLedger = ledger;
        } else if (ledger.category === 'Receivable') {
          groups[key].receivableLedger = ledger;
        }
      }
    });
    return Object.values(groups);
  }, [ledgers]);

  // Filter ledgers based on type and category
  const filteredLedgers = ledgers.filter(ledger => {
    if (filters.type && ledger.type !== filters.type) return false;
    if (filters.category && ledger.category !== filters.category) return false;
    return true;
  });

  // Filter transactions based on filters
  const filteredTransactions = combinedLedgerData?.income?.entries.filter(entry => {
    if (filters.voucherType && entry.voucherType !== filters.voucherType) return false;
    if (filters.minAmount && entry.entries.amount < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && entry.entries.amount > parseFloat(filters.maxAmount)) return false;
    return true;
  }) || [];

  // Combine entries from same voucher
  const combineVoucherEntries = (entries) => {
    const voucherMap = new Map();
    
    entries.forEach(entry => {
      const key = entry.voucherNumber;
      if (!voucherMap.has(key)) {
        voucherMap.set(key, {
          ...entry,
          income: 0,
          collection: 0,
          receivable: 0
        });
      }
      const voucherEntry = voucherMap.get(key);
      
      // Process all entries in the voucher
      if (entry.entries && Array.isArray(entry.entries)) {
        entry.entries.forEach(entryItem => {
          // Find income amount (credit entry for bill)
          if (entryItem.type === 'credit' && entryItem.description.includes('Bill for')) {
            voucherEntry.income = entryItem.amount;
          }
          // Find receivable amount (debit entry for total receivable)
          if (entryItem.type === 'debit' && entryItem.description.includes('Total receivable')) {
            voucherEntry.receivable = entryItem.amount;
          }
        });
      }
    });
    
    return Array.from(voucherMap.values());
  };

  const renderTransactionRows = () => {
    const allEntries = [...combinedLedgerData.income.entries, ...combinedLedgerData.receivable.entries];
    console.log('All entries:', allEntries);
    
    const combinedEntries = combineVoucherEntries(allEntries)
      .sort((a, b) => new Date(a.voucherDate) - new Date(b.voucherDate));

    return combinedEntries.map((entry, index) => {
      // Format GST details if available
      let gstInfo = '';
      if (entry.gstDetails && entry.gstDetails.isGSTApplicable && entry.gstDetails.gstEntries) {
        try {
          // Always treat entries as an array
          const entriesArr = Array.isArray(entry.entries) ? entry.entries : (entry.entries ? [entry.entries] : []);
          const baseAmountEntry = entriesArr.find(e => e.type === 'credit' && e.description && e.description.includes('Bill for'));
          const baseAmount = baseAmountEntry ? baseAmountEntry.amount : 0;
          
          gstInfo = `Base Amount: ${formatAmount(baseAmount)}\n`;
          
          // Add individual GST components from gstEntries
          entry.gstDetails.gstEntries.forEach(gst => {
            gstInfo += `${gst.type} (${gst.percentage || 0}%): ${formatAmount(gst.amount || 0)}\n`;
          });
        } catch (error) {
          console.error('Error calculating GST details:', error);
          gstInfo = 'GST calculation error';
        }
      }

      return (
        <tr key={`${entry.voucherNumber}-${index}`} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {new Date(entry.voucherDate).toLocaleDateString()}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            <div className="flex flex-col">
              <span>{entry.voucherNumber}</span>
              <span className="text-xs text-gray-500">{entry.voucherType}</span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Bill</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.referenceNumber}</td>
          <td className="px-6 py-4 text-sm text-gray-900">
            <div>
              <div>{entry.narration}</div>
              {gstInfo && (
                <div className="text-xs text-gray-500 mt-1 whitespace-pre-line">
                  {gstInfo}
                </div>
              )}
            </div>
          </td>
          <td className="px-6 py-4 text-right whitespace-nowrap text-sm text-gray-900">
            {entry.income > 0 ? formatAmount(entry.income) : ''}
          </td>
          <td className="px-6 py-4 text-right whitespace-nowrap text-sm text-gray-900">
            {entry.voucherType === 'Payment' && entry.collection > 0 ? formatAmount(entry.collection) : ''}
          </td>
          <td className="px-6 py-4 text-right whitespace-nowrap text-sm text-gray-900">
            {entry.receivable > 0 ? formatAmount(entry.receivable) : ''}
          </td>
        </tr>
      );
    });
  };

  // Fetch ledgers on component mount
  useEffect(() => {
    fetchLedgers();
  }, []);

  // Fetch ledger data when selection or date range changes
  useEffect(() => {
    if (selectedBillHead) {
      fetchCombinedLedgerData();
    }
  }, [selectedBillHead, dateRange]);

  useEffect(() => {
    if (selectedBillHead) {
      setSelectedIncomeLedger(selectedBillHead.incomeLedgerId);
      setSelectedReceivableLedger(selectedBillHead.receivableLedgerId);
    }
  }, [selectedBillHead]);

  const fetchLedgers = async () => {
    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      // First get society details
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

      // Then fetch ledgers with society ID
      const response = await fetch(`/api/Ledger-Api/get-ledgers?societyId=${societyId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Sort ledgers by name
        const sortedLedgers = data.ledgers.sort((a, b) => a.name.localeCompare(b.name));
        setLedgers(sortedLedgers);
      } else {
        throw new Error('Failed to fetch ledgers');
      }
    } catch (error) {
      console.error('Error fetching ledgers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCombinedLedgerData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      const selectedGroup = groupedLedgers.find(g => 
        g.billCategory === selectedBillHead?.billCategory && 
        g.subCategory === selectedBillHead?.subCategory
      );

      if (!selectedGroup?.incomeLedger?._id || !selectedGroup?.receivableLedger?._id) {
        return;
      }
      console.log(selectedGroup.incomeLedger);

      const [incomeResponse, receivableResponse] = await Promise.all([
        fetch(
          `/api/Journal-Api/get-general-ledger?societyId=${selectedGroup.incomeLedger.societyId}&ledgerId=${selectedGroup.incomeLedger._id}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        ),
        fetch(
          `/api/Journal-Api/get-general-ledger?societyId=${selectedGroup.receivableLedger.societyId}&ledgerId=${selectedGroup.receivableLedger._id}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
      ]);

      if (incomeResponse.ok && receivableResponse.ok) {
        const [incomeData, receivableData] = await Promise.all([
          incomeResponse.json(),
          receivableResponse.json()
        ]);

        console.log('Income Data:', incomeData);
        console.log('Receivable Data:', receivableData);

        setCombinedLedgerData({
          income: incomeData.data,
          receivable: receivableData.data,
          billHead: selectedGroup
        });
      }
    } catch (error) {
      console.error('Error fetching ledger data:', error);
      setCombinedLedgerData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!combinedLedgerData) return;

    const rows = [
      ['Date', 'Voucher No', 'Type', 'Reference', 'Category', 'Narration', 'GST Details', 'Debit', 'Credit', 'Balance'],
      ...combinedLedgerData.income.entries.map(entry => [
        new Date(entry.voucherDate).toLocaleDateString(),
        entry.voucherNo,
        entry.voucherType,
        entry.referenceNo || '',
        `${entry.category || ''} ${entry.subCategory ? `/ ${entry.subCategory}` : ''}`,
        entry.narration,
        entry.gstDetails?.isGSTApplicable ? 'Yes' : 'No',
        entry.entries.type === 'Debit' ? entry.entries.amount.toFixed(2) : '',
        entry.entries.type === 'Credit' ? entry.entries.amount.toFixed(2) : '',
        `${entry.balance.amount.toFixed(2)} ${entry.balance.type}`
      ])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `general_ledger_${combinedLedgerData.income.ledger.name}_${dateRange.startDate}_${dateRange.endDate}.csv`);
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
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition duration-200 flex items-center"
            >
              <Filter className="mr-2" size={16} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Bill Head Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Bill Head</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={selectedBillHead ? `${selectedBillHead.billCategory}-${selectedBillHead.subCategory}` : ''}
                onChange={(e) => {
                  const [billCategory, subCategory] = e.target.value.split('-');
                  setSelectedBillHead(billCategory && subCategory ? { billCategory, subCategory } : null);
                }}
              >
                <option value="">Select a bill head</option>
                {groupedLedgers.map((group) => (
                  <option 
                    key={`${group.billCategory}-${group.subCategory}`} 
                    value={`${group.billCategory}-${group.subCategory}`}
                  >
                    {group.displayName}
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
                onClick={fetchCombinedLedgerData}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200 flex items-center"
                disabled={!selectedBillHead}
              >
                <RefreshCw className="mr-2" size={16} />
                Refresh
              </button>
              <button
                onClick={handleExport}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200 flex items-center"
                disabled={!combinedLedgerData}
              >
                <Download className="mr-2" size={16} />
                Export
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ledger Type</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="">All Types</option>
                  {ledgerTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">All Categories</option>
                  {ledgerCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Voucher Type</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={filters.voucherType}
                  onChange={(e) => setFilters(prev => ({ ...prev, voucherType: e.target.value }))}
                >
                  <option value="">All Vouchers</option>
                  {voucherTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={filters.minAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}
        </div>

        {/* Combined Ledger Data */}
        {combinedLedgerData && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Income Ledger Summary */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Income Account</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Current Balance</p>
                    <p className={`text-lg font-semibold ${getBalanceColor(combinedLedgerData.income.closingBalance.type, 'Income')}`}>
                      {formatAmount(combinedLedgerData.income.closingBalance.amount, combinedLedgerData.income.closingBalance.type)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Today's Collection</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatAmount(combinedLedgerData.income.totals.totalCredit)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Receivable Ledger Summary */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Receivable Account</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Current Balance</p>
                    <p className={`text-lg font-semibold ${getBalanceColor(combinedLedgerData.receivable.closingBalance.type, 'Asset')}`}>
                      {formatAmount(combinedLedgerData.receivable.closingBalance.amount, combinedLedgerData.receivable.closingBalance.type)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pending Bills</p>
                    <p className="text-lg font-semibold text-red-600">
                      {formatAmount(combinedLedgerData.receivable.totals.totalDebit)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voucher</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Collection</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Receivable</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Opening Balance Row */}
                  <tr className="bg-gray-50">
                    <td colSpan="5" className="px-6 py-4 text-sm text-gray-900">Opening Balance</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {formatAmount(combinedLedgerData.income.openingBalance.amount, combinedLedgerData.income.openingBalance.type)}
                    </td>
                    <td className="px-6 py-4"></td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {formatAmount(combinedLedgerData.receivable.openingBalance.amount, combinedLedgerData.receivable.openingBalance.type)}
                    </td>
                  </tr>

                  {/* Table body */}
                  {renderTransactionRows()}

                  {/* Totals Row */}
                  <tr className="bg-gray-100 font-medium">
                    <td colSpan="5" className="px-6 py-4 text-sm text-gray-900">Total</td>
                    <td className="px-6 py-4 text-right text-sm text-green-600">
                      {formatAmount(combinedLedgerData.income.closingBalance.amount, combinedLedgerData.income.closingBalance.type)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-green-600">
                      {formatAmount(0)} {/* Replace with actual collection total */}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-red-600">
                      {formatAmount(combinedLedgerData.receivable.closingBalance.amount, combinedLedgerData.receivable.closingBalance.type)}
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