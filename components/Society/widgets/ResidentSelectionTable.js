import React, { useState, useEffect } from 'react';
import { Check, X, Calculator, User, Home } from 'lucide-react';

const ResidentSelectionTable = ({
  residents = [],
  selectedResidents = [],
  onResidentToggle,
  onUnitUsageChange,
  billHead,
  onCalculate,
  showCalculation = false,
  calculationResults = {},
  additionalCharges = [] // Add additional charges prop
}) => {
  const [selectAll, setSelectAll] = useState(false); // Default to false
  const [unitUsages, setUnitUsages] = useState({});

  // Update select all state when selectedResidents changes
  useEffect(() => {
    setSelectAll(residents.length > 0 && selectedResidents.length === residents.length);
  }, [selectedResidents, residents]);

  // Initialize unit usages for residents
  useEffect(() => {
    const initialUsages = {};
    residents.forEach(resident => {
      if (!unitUsages[resident._id]) {
        initialUsages[resident._id] = billHead?.calculationType === 'Fixed' ? '1' : '';
      }
    });
    if (Object.keys(initialUsages).length > 0) {
      setUnitUsages(prev => ({ ...prev, ...initialUsages }));
    }
  }, [residents, billHead]);

  const handleSelectAll = () => {
    const shouldSelectAll = !selectAll;
    
    // Update state immediately
    setSelectAll(shouldSelectAll);

    // Process all residents
    residents.forEach(resident => {
      onResidentToggle(resident, shouldSelectAll);
    });
  };

  const handleUnitChange = (residentId, value) => {
    setUnitUsages(prev => ({
      ...prev,
      [residentId]: value
    }));
    onUnitUsageChange(residentId, value);
  };

  const shouldShowUnitInput = () => {
    return billHead && ['PerUnit', 'Formula', 'Custom'].includes(billHead.calculationType);
  };

  const getUnitInputLabel = () => {
    if (!billHead) return 'Units';
    switch (billHead.calculationType) {
      case 'PerUnit':
        return 'Units Used';
      case 'Formula':
        return 'Units (for formula)';
      case 'Custom':
        return 'Custom Units';
      default:
        return 'Units';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  if (!residents || residents.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">No residents found for the selected criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Select Residents ({selectedResidents.length} of {residents.length} selected)
        </h3>
      </div>

      {/* Bill Head Info */}
      {billHead && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <div>
              <h4 className="font-medium text-blue-900">{billHead.code} - {billHead.name}</h4>
              <p className="text-sm text-blue-700">
                Calculation Type: {billHead.calculationType}
                {billHead.calculationType === 'PerUnit' && ` (₹${billHead.perUnitRate}/unit)`}
                {billHead.calculationType === 'Fixed' && ` (₹${billHead.fixedAmount})`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Residents Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="overflow-y-auto" style={{maxHeight: '400px'}}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resident
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Flat Details
                  </th>
                  {shouldShowUnitInput() && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {getUnitInputLabel()}
                    </th>
                  )}
                  {showCalculation && (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Base Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GST Amount
                      </th>
                      {additionalCharges.length > 0 && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Additional Charges
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {residents.map((resident) => {
                  const isSelected = selectedResidents.find(sr => sr._id === resident._id);
                  const residentCalculation = calculationResults[resident._id] || {};
                  
                  return (
                    <tr 
                      key={resident._id} 
                      className={`${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={(e) => onResidentToggle(resident, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{resident.name}</div>
                            <div className="text-sm text-gray-500">{resident.phone}</div>
                            <div className="text-sm text-gray-500">{resident.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <Home className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {resident.flatDetails?.flatNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              Floor {resident.flatDetails?.floorIndex || resident.flatDetails?.floorNumber || 'Ground'}
                            </div>
                          </div>
                        </div>
                      </td>
                      {shouldShowUnitInput() && (
                        <td className="px-4 py-4">
                          <input
                            type="number"
                            value={unitUsages[resident._id] || ''}
                            onChange={(e) => handleUnitChange(resident._id, e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Enter units"
                            min="0"
                            step="0.01"
                            disabled={!isSelected}
                          />
                          {billHead?.calculationType === 'PerUnit' && (
                            <p className="mt-1 text-xs text-gray-500">
                              Rate: ₹{billHead.perUnitRate}/unit
                            </p>
                          )}
                        </td>
                      )}
                      {showCalculation && (
                        <>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {residentCalculation.baseAmount ? formatCurrency(residentCalculation.baseAmount) : '-'}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {residentCalculation.gstAmount ? formatCurrency(residentCalculation.gstAmount) : '-'}
                          </td>
                          {additionalCharges.length > 0 && (
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {additionalCharges.length > 0 ? (
                                <div className="text-xs">
                                  {additionalCharges.map((charge, index) => (
                                    <div key={index} className="flex justify-between">
                                      <span>{charge.chargeType}:</span>
                                      <span>{formatCurrency(charge.amount)}</span>
                                    </div>
                                  ))}
                                  <div className="border-t pt-1 mt-1 font-medium">
                                    <div className="flex justify-between">
                                      <span>Total:</span>
                                      <span>{formatCurrency(additionalCharges.reduce((sum, charge) => sum + charge.amount, 0))}</span>
                                    </div>
                                  </div>
                                </div>
                              ) : '-'}
                            </td>
                          )}
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            {residentCalculation.totalAmount ? formatCurrency(residentCalculation.totalAmount) : '-'}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Calculate Button - Moved after the table */}
      {selectedResidents.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={onCalculate}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calculate Bills
          </button>
        </div>
      )}

      {/* Summary */}
      {showCalculation && selectedResidents.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Bill Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Selected Residents</p>
              <p className="text-lg font-semibold text-gray-900">{selectedResidents.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Base Amount</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(
                  Object.values(calculationResults).reduce((sum, calc) => sum + (calc.baseAmount || 0), 0)
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total GST Amount</p>
              <p className="text-lg font-semibold text-blue-600">
                {formatCurrency(
                  Object.values(calculationResults).reduce((sum, calc) => sum + (calc.gstAmount || 0), 0)
                )}
              </p>
            </div>
            {additionalCharges.length > 0 && (
              <div>
                <p className="text-sm text-gray-600">Total Additional Charges</p>
                <p className="text-lg font-semibold text-purple-600">
                  {formatCurrency(
                    additionalCharges.reduce((sum, charge) => sum + charge.amount, 0) * selectedResidents.length
                  )}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Grand Total</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(
                  Object.values(calculationResults).reduce((sum, calc) => sum + (calc.totalAmount || 0), 0)
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentSelectionTable;