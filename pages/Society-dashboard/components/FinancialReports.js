import React, { useState } from 'react';
import { useRouter } from 'next/router';
import PreloaderSociety from '../../components/PreloaderSociety';

export default function FinancialReports() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('TrialBalance');
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState(null);

  const generateReport = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      // Get society details
      const societyResponse = await fetch('/api/Society-Api/get-society-details', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!societyResponse.ok) {
        throw new Error('Failed to fetch society details');
      }

      const societyData = await societyResponse.json();

      // Generate report
      const response = await fetch('/api/Report-Api/generate-financial-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          societyId: societyData.societyId,
          reportType,
          fromDate,
          toDate
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      setReport(data.report);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(Math.abs(amount));
  };

  if (loading) {
    return <PreloaderSociety />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 shadow-lg border-b-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Financial Reports
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Report Generation Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={generateReport} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Type
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  required
                >
                  <option value="TrialBalance">Trial Balance</option>
                  <option value="BalanceSheet">Balance Sheet</option>
                  <option value="IncomeExpense">Income & Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={loading}
              >
                Generate Report
              </button>
            </div>
          </form>
        </div>

        {/* Report Display */}
        {report && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Trial Balance */}
            {reportType === 'TrialBalance' && (
              <div>
                <div className="px-6 py-4 border-b">
                  <h2 className="text-xl font-semibold">Trial Balance</h2>
                  <p className="text-sm text-gray-500">
                    {new Date(fromDate).toLocaleDateString()} to {new Date(toDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ledger</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Opening Balance</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Closing Balance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.entries.map((entry, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{entry.ledgerCode}</div>
                            <div className="text-sm text-gray-500">{entry.ledgerName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {formatAmount(entry.openingBalance)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {formatAmount(entry.debitTotal)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {formatAmount(entry.creditTotal)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {formatAmount(entry.closingBalance)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-medium">
                        <td className="px-6 py-4">Total</td>
                        <td className="px-6 py-4 text-right">{formatAmount(report.debitTotal)}</td>
                        <td className="px-6 py-4 text-right">{formatAmount(report.creditTotal)}</td>
                        <td className="px-6 py-4 text-right">-</td>
                        <td className="px-6 py-4 text-right">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Balance Sheet */}
            {reportType === 'BalanceSheet' && (
              <div>
                <div className="px-6 py-4 border-b">
                  <h2 className="text-xl font-semibold">Balance Sheet</h2>
                  <p className="text-sm text-gray-500">As on {new Date(toDate).toLocaleDateString()}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                  {/* Assets */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Assets</h3>
                    
                    <div className="space-y-6">
                      {/* Fixed Assets */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Fixed Assets</h4>
                        {report.assets.fixed.map((asset, index) => (
                          <div key={index} className="flex justify-between py-1">
                            <span className="text-sm">{asset.ledgerName}</span>
                            <span className="text-sm">{formatAmount(asset.amount)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Current Assets */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Current Assets</h4>
                        {report.assets.current.map((asset, index) => (
                          <div key={index} className="flex justify-between py-1">
                            <span className="text-sm">{asset.ledgerName}</span>
                            <span className="text-sm">{formatAmount(asset.amount)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex justify-between font-medium">
                          <span>Total Assets</span>
                          <span>{formatAmount(report.assets.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Liabilities</h3>
                    
                    <div className="space-y-6">
                      {/* Capital */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Capital & Reserves</h4>
                        {report.liabilities.capital.map((item, index) => (
                          <div key={index} className="flex justify-between py-1">
                            <span className="text-sm">{item.ledgerName}</span>
                            <span className="text-sm">{formatAmount(item.amount)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Long Term Liabilities */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Long Term Liabilities</h4>
                        {report.liabilities.longTerm.map((item, index) => (
                          <div key={index} className="flex justify-between py-1">
                            <span className="text-sm">{item.ledgerName}</span>
                            <span className="text-sm">{formatAmount(item.amount)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Current Liabilities */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Current Liabilities</h4>
                        {report.liabilities.current.map((item, index) => (
                          <div key={index} className="flex justify-between py-1">
                            <span className="text-sm">{item.ledgerName}</span>
                            <span className="text-sm">{formatAmount(item.amount)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex justify-between font-medium">
                          <span>Total Liabilities</span>
                          <span>{formatAmount(report.liabilities.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Income & Expense */}
            {reportType === 'IncomeExpense' && (
              <div>
                <div className="px-6 py-4 border-b">
                  <h2 className="text-xl font-semibold">Income & Expense Statement</h2>
                  <p className="text-sm text-gray-500">
                    {new Date(fromDate).toLocaleDateString()} to {new Date(toDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                  {/* Income */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Income</h3>
                    
                    <div className="space-y-2">
                      {report.income.items.map((item, index) => (
                        <div key={index} className="flex justify-between py-1">
                          <span className="text-sm">{item.ledgerName}</span>
                          <span className="text-sm">{formatAmount(item.amount)}</span>
                        </div>
                      ))}

                      <div className="pt-4 border-t">
                        <div className="flex justify-between font-medium">
                          <span>Total Income</span>
                          <span>{formatAmount(report.income.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expense */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Expense</h3>
                    
                    <div className="space-y-2">
                      {report.expense.items.map((item, index) => (
                        <div key={index} className="flex justify-between py-1">
                          <span className="text-sm">{item.ledgerName}</span>
                          <span className="text-sm">{formatAmount(item.amount)}</span>
                        </div>
                      ))}

                      <div className="pt-4 border-t">
                        <div className="flex justify-between font-medium">
                          <span>Total Expense</span>
                          <span>{formatAmount(report.expense.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t">
                  <div className="flex justify-between font-medium text-lg">
                    <span>Net Surplus/Deficit</span>
                    <span className={report.surplus >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatAmount(report.surplus)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
} 