import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PreloaderSociety from '../../components/PreloaderSociety';
import { FileText, Plus, Edit2, Archive, Check, X, AlertCircle } from 'lucide-react';

export default function BillHeads() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [billHeads, setBillHeads] = useState([]);
  const [filteredBillHeads, setFilteredBillHeads] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [ledgers, setLedgers] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    gstApplicable: 0,
    byCategory: {
      Maintenance: 0,
      Utility: 0,
      Amenity: 0,
      Service: 0,
      Other: 0
    }
  });
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingBillHead, setEditingBillHead] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Maintenance',
    description: '',
    calculationType: 'Fixed',
    fixedAmount: 0,
    perUnitRate: 0,
    formula: '',
    gstConfig: {
      isGSTApplicable: false,
      cgstPercentage: 0,
      sgstPercentage: 0,
      igstPercentage: 0
    },
    latePaymentConfig: {
      isLatePaymentChargeApplicable: false,
      gracePeriodDays: 0,
      chargeType: 'Fixed',
      chargeValue: 0,
      compoundingFrequency: 'Monthly'
    },
    accountingConfig: {
      incomeLedgerId: '',
      receivableLedgerId: ''
    },
    status: 'Active'
  });

  // Notification state
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Fetch bill heads and ledgers on component mount
  useEffect(() => {
    fetchBillHeads();
    fetchLedgers();
  }, []);

  // Update filtered data when billHeads or filter changes
  useEffect(() => {
    filterBillHeads(activeFilter);
  }, [billHeads, activeFilter]);

  const filterBillHeads = (filter) => {
    let filtered;
    switch (filter) {
      case 'active':
        filtered = billHeads.filter(bh => bh.status === 'Active');
        break;
      case 'inactive':
        filtered = billHeads.filter(bh => bh.status === 'Inactive');
        break;
      case 'taxable':
        filtered = billHeads.filter(bh => bh.gstConfig?.isGSTApplicable);
        break;
      default:
        filtered = billHeads;
    }
    setFilteredBillHeads(filtered);
  };

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
  };

  const fetchBillHeads = async () => {
    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      // Get society details first
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

      // Fetch bill heads
      const response = await fetch(`/api/BillHead-Api/get-bill-heads?societyId=${societyId}`);
      if (!response.ok) throw new Error('Failed to fetch bill heads');
      
      const data = await response.json();
      setBillHeads(data.data);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching bill heads:', error);
      showNotification('Failed to fetch bill heads', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLedgers = async () => {
    try {
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

      const response = await fetch(`/api/Ledger-Api/get-ledgers?societyId=${societyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLedgers(data.ledgers);
      }
    } catch (error) {
      console.error('Error fetching ledgers:', error);
      showNotification('Failed to fetch ledgers', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate GST percentages
    if (formData.gstConfig.isGSTApplicable) {
      if (formData.gstConfig.cgstPercentage < 0 || formData.gstConfig.cgstPercentage > 14) {
        showNotification('CGST percentage must be between 0 and 14', 'error');
        return;
      }
      if (formData.gstConfig.sgstPercentage < 0 || formData.gstConfig.sgstPercentage > 14) {
        showNotification('SGST percentage must be between 0 and 14', 'error');
        return;
      }
      if (formData.gstConfig.igstPercentage < 0 || formData.gstConfig.igstPercentage > 28) {
        showNotification('IGST percentage must be between 0 and 28', 'error');
        return;
      }
    }

    // Validate calculation type specific fields
    if (formData.calculationType === 'Fixed' && !formData.fixedAmount) {
      showNotification('Fixed amount is required for Fixed calculation type', 'error');
      return;
    }
    if (formData.calculationType === 'PerUnit' && !formData.perUnitRate) {
      showNotification('Per unit rate is required for PerUnit calculation type', 'error');
      return;
    }
    if (formData.calculationType === 'Formula' && !formData.formula) {
      showNotification('Formula is required for Formula calculation type', 'error');
      return;
    }

    // Validate late payment config
    if (formData.latePaymentConfig.isLatePaymentChargeApplicable) {
      if (formData.latePaymentConfig.gracePeriodDays < 0) {
        showNotification('Grace period days cannot be negative', 'error');
        return;
      }
      if (formData.latePaymentConfig.chargeValue < 0) {
        showNotification('Charge value cannot be negative', 'error');
        return;
      }
    }

    setLoading(true);

    try {
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
      
      const payload = {
        ...formData,
        societyId: societyData.societyId,
        accountingConfig: {
          incomeLedgerId: formData.accountingConfig.incomeLedgerId || null,
          receivableLedgerId: formData.accountingConfig.receivableLedgerId || null
        }
      };

      const url = editingBillHead 
        ? `/api/BillHead-Api/update-bill-head?billHeadId=${editingBillHead._id}`
        : '/api/BillHead-Api/create-bill-head';

      const response = await fetch(url, {
        method: editingBillHead ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to save bill head');
      }

      showNotification(
        editingBillHead ? 'Bill head updated successfully' : 'Bill head created successfully',
        'success'
      );

      // Reset form and refresh data
      resetForm();
      setShowForm(false);
      fetchBillHeads();
    } catch (error) {
      console.error('Error saving bill head:', error);
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (billHead) => {
    setEditingBillHead(billHead);
    setFormData({
      code: billHead.code,
      name: billHead.name,
      category: billHead.category,
      description: billHead.description || '',
      calculationType: billHead.calculationType,
      fixedAmount: billHead.fixedAmount || 0,
      perUnitRate: billHead.perUnitRate || 0,
      formula: billHead.formula || '',
      gstConfig: {
        isGSTApplicable: billHead.gstConfig?.isGSTApplicable || false,
        cgstPercentage: billHead.gstConfig?.cgstPercentage || 0,
        sgstPercentage: billHead.gstConfig?.sgstPercentage || 0,
        igstPercentage: billHead.gstConfig?.igstPercentage || 0
      },
      latePaymentConfig: {
        isLatePaymentChargeApplicable: billHead.latePaymentConfig?.isLatePaymentChargeApplicable || false,
        gracePeriodDays: billHead.latePaymentConfig?.gracePeriodDays || 0,
        chargeType: billHead.latePaymentConfig?.chargeType || 'Fixed',
        chargeValue: billHead.latePaymentConfig?.chargeValue || 0,
        compoundingFrequency: billHead.latePaymentConfig?.compoundingFrequency || 'Monthly'
      },
      accountingConfig: {
        incomeLedgerId: billHead.accountingConfig?.incomeLedgerId || '',
        receivableLedgerId: billHead.accountingConfig?.receivableLedgerId || ''
      },
      status: billHead.status || 'Active'
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingBillHead(null);
    setFormData({
      code: '',
      name: '',
      category: 'Maintenance',
      description: '',
      calculationType: 'Fixed',
      fixedAmount: 0,
      perUnitRate: 0,
      formula: '',
      gstConfig: {
        isGSTApplicable: false,
        cgstPercentage: 0,
        sgstPercentage: 0,
        igstPercentage: 0
      },
      latePaymentConfig: {
        isLatePaymentChargeApplicable: false,
        gracePeriodDays: 0,
        chargeType: 'Fixed',
        chargeValue: 0,
        compoundingFrequency: 'Monthly'
      },
      accountingConfig: {
        incomeLedgerId: '',
        receivableLedgerId: ''
      },
      status: 'Active'
    });
    setShowForm(false);
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Add input validation for GST percentages
  const handleGSTChange = (field, value) => {
    const numValue = parseFloat(value);
    let maxLimit;
    
    switch(field) {
      case 'cgstPercentage':
      case 'sgstPercentage':
        maxLimit = 14;
        break;
      case 'igstPercentage':
        maxLimit = 28;
        break;
      default:
        maxLimit = 100;
    }

    if (numValue >= 0 && numValue <= maxLimit) {
      setFormData({
        ...formData,
        gstConfig: {
          ...formData.gstConfig,
          [field]: numValue
        }
      });
    }
  };

  if (loading) {
    return <PreloaderSociety />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
              <FileText className="mr-3" size={32} />
              Billing Heads {activeFilter !== 'all' && `- ${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}`}
            </h1>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200 flex items-center"
            >
              <Plus className="mr-2" size={20} />
              Add New
            </button>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <p className="flex items-center">
            {notification.type === 'success' ? (
              <Check className="mr-2" size={20} />
            ) : (
              <AlertCircle className="mr-2" size={20} />
            )}
            {notification.message}
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div 
            onClick={() => handleFilterClick('all')}
            className={`bg-white rounded-lg shadow p-4 cursor-pointer transform transition-all duration-200 hover:scale-105 ${
              activeFilter === 'all' ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <p className="text-sm text-gray-500">Total Bill Heads</p>
            <p className="text-2xl font-bold text-gray-900">{summary?.total || 0}</p>
          </div>
          <div 
            onClick={() => handleFilterClick('active')}
            className={`bg-white rounded-lg shadow p-4 cursor-pointer transform transition-all duration-200 hover:scale-105 ${
              activeFilter === 'active' ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{summary?.active || 0}</p>
          </div>
          <div 
            onClick={() => handleFilterClick('inactive')}
            className={`bg-white rounded-lg shadow p-4 cursor-pointer transform transition-all duration-200 hover:scale-105 ${
              activeFilter === 'inactive' ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <p className="text-sm text-gray-500">Inactive</p>
            <p className="text-2xl font-bold text-gray-600">{summary?.inactive || 0}</p>
          </div>
          <div 
            onClick={() => handleFilterClick('taxable')}
            className={`bg-white rounded-lg shadow p-4 cursor-pointer transform transition-all duration-200 hover:scale-105 ${
              activeFilter === 'taxable' ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <p className="text-sm text-gray-500">Taxable Items</p>
            <p className="text-2xl font-bold text-blue-600">{summary?.gstApplicable || 0}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Bill Heads Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calculation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBillHeads.map((billHead) => (
                <tr key={billHead._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {billHead.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {billHead.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {billHead.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {billHead.calculationType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {billHead.calculationType === 'Fixed' && `₹${billHead.fixedAmount}`}
                    {billHead.calculationType === 'PerUnit' && `₹${billHead.perUnitRate}/unit`}
                    {billHead.calculationType === 'Formula' && 'Custom Formula'}
                    {billHead.calculationType === 'Custom' && 'Custom'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {billHead.gstConfig?.isGSTApplicable ? (
                      <div>
                        {billHead.gstConfig.cgstPercentage > 0 && `CGST: ${billHead.gstConfig.cgstPercentage}%`}
                        {billHead.gstConfig.sgstPercentage > 0 && ` SGST: ${billHead.gstConfig.sgstPercentage}%`}
                        {billHead.gstConfig.igstPercentage > 0 && ` IGST: ${billHead.gstConfig.igstPercentage}%`}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      billHead.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {billHead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(billHead)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-5 shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingBillHead ? 'Edit Bill Head' : 'Add New Bill Head'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Code *</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category *</label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="Maintenance">Maintenance</option>
                    <option value="Utility">Utility</option>
                    <option value="Amenity">Amenity</option>
                    <option value="Service">Service</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Calculation Type *</label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={formData.calculationType}
                    onChange={(e) => setFormData({ ...formData, calculationType: e.target.value })}
                    required
                  >
                    <option value="Fixed">Fixed Amount</option>
                    <option value="PerUnit">Per Unit Rate</option>
                    <option value="Formula">Formula Based</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                {formData.calculationType === 'Fixed' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fixed Amount *</label>
                    <input
                      type="number"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      value={formData.fixedAmount}
                      onChange={(e) => setFormData({ ...formData, fixedAmount: parseFloat(e.target.value) })}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                )}

                {formData.calculationType === 'PerUnit' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rate Per Unit *</label>
                    <input
                      type="number"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      value={formData.perUnitRate}
                      onChange={(e) => setFormData({ ...formData, perUnitRate: parseFloat(e.target.value) })}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                )}

                {formData.calculationType === 'Formula' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Formula *</label>
                    <textarea
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      value={formData.formula}
                      onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                      rows="3"
                      placeholder="Enter calculation formula"
                      required
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      checked={formData.gstConfig.isGSTApplicable}
                      onChange={(e) => setFormData({
                        ...formData,
                        gstConfig: {
                          ...formData.gstConfig,
                          isGSTApplicable: e.target.checked
                        }
                      })}
                    />
                    <label className="ml-2 block text-sm text-gray-900">GST Applicable</label>
                  </div>
                </div>

                {formData.gstConfig.isGSTApplicable && (
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isGSTApplicable"
                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        checked={formData.gstConfig.isGSTApplicable}
                        onChange={(e) => setFormData({
                          ...formData,
                          gstConfig: {
                            ...formData.gstConfig,
                            isGSTApplicable: e.target.checked
                          }
                        })}
                      />
                      <label htmlFor="isGSTApplicable" className="ml-2 text-sm text-gray-700">
                        GST Applicable
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">CGST %</label>
                        <input
                          type="number"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                          value={formData.gstConfig.cgstPercentage}
                          onChange={(e) => handleGSTChange('cgstPercentage', e.target.value)}
                          min="0"
                          max="14"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">SGST %</label>
                        <input
                          type="number"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                          value={formData.gstConfig.sgstPercentage}
                          onChange={(e) => handleGSTChange('sgstPercentage', e.target.value)}
                          min="0"
                          max="14"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">IGST %</label>
                        <input
                          type="number"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                          value={formData.gstConfig.igstPercentage}
                          onChange={(e) => handleGSTChange('igstPercentage', e.target.value)}
                          min="0"
                          max="28"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      checked={formData.latePaymentConfig.isLatePaymentChargeApplicable}
                      onChange={(e) => setFormData({
                        ...formData,
                        latePaymentConfig: {
                          ...formData.latePaymentConfig,
                          isLatePaymentChargeApplicable: e.target.checked
                        }
                      })}
                    />
                    <label className="ml-2 block text-sm text-gray-900">Late Payment Charges Applicable</label>
                  </div>
                </div>

                {formData.latePaymentConfig.isLatePaymentChargeApplicable && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Grace Period (Days)</label>
                      <input
                        type="number"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        value={formData.latePaymentConfig.gracePeriodDays}
                        onChange={(e) => setFormData({
                          ...formData,
                          latePaymentConfig: {
                            ...formData.latePaymentConfig,
                            gracePeriodDays: parseInt(e.target.value)
                          }
                        })}
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Charge Type</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        value={formData.latePaymentConfig.chargeType}
                        onChange={(e) => setFormData({
                          ...formData,
                          latePaymentConfig: {
                            ...formData.latePaymentConfig,
                            chargeType: e.target.value
                          }
                        })}
                      >
                        <option value="Fixed">Fixed Amount</option>
                        <option value="Percentage">Percentage</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {formData.latePaymentConfig.chargeType === 'Fixed' ? 'Amount' : 'Percentage'}
                      </label>
                      <input
                        type="number"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        value={formData.latePaymentConfig.chargeValue}
                        onChange={(e) => setFormData({
                          ...formData,
                          latePaymentConfig: {
                            ...formData.latePaymentConfig,
                            chargeValue: parseFloat(e.target.value)
                          }
                        })}
                        min="0"
                        step={formData.latePaymentConfig.chargeType === 'Fixed' ? "1" : "0.01"}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Compounding Frequency</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        value={formData.latePaymentConfig.compoundingFrequency}
                        onChange={(e) => setFormData({
                          ...formData,
                          latePaymentConfig: {
                            ...formData.latePaymentConfig,
                            compoundingFrequency: e.target.value
                          }
                        })}
                      >
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      checked={Boolean(formData.accountingConfig.incomeLedgerId)}
                      onChange={(e) => setFormData({
                        ...formData,
                        accountingConfig: {
                          ...formData.accountingConfig,
                          incomeLedgerId: e.target.checked ? (ledgers[0]?._id || '') : ''
                        }
                      })}
                    />
                    <label className="ml-2 block text-sm text-gray-900">Income Ledger</label>
                  </div>
                  {Boolean(formData.accountingConfig.incomeLedgerId) && (
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
                      value={formData.accountingConfig.incomeLedgerId}
                      onChange={(e) => setFormData({
                        ...formData,
                        accountingConfig: {
                          ...formData.accountingConfig,
                          incomeLedgerId: e.target.value
                        }
                      })}
                    >
                      <option value="">Select Income Ledger</option>
                      {ledgers.filter(ledger => ledger.category === 'Operating Income').map((ledger) => (
                        <option key={ledger._id} value={ledger._id}>
                          {ledger.code} - {ledger.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      checked={Boolean(formData.accountingConfig.receivableLedgerId)}
                      onChange={(e) => setFormData({
                        ...formData,
                        accountingConfig: {
                          ...formData.accountingConfig,
                          receivableLedgerId: e.target.checked ? (ledgers[0]?._id || '') : ''
                        }
                      })}
                    />
                    <label className="ml-2 block text-sm text-gray-900">Receivable Ledger</label>
                  </div>
                  {Boolean(formData.accountingConfig.receivableLedgerId) && (
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
                      value={formData.accountingConfig.receivableLedgerId}
                      onChange={(e) => setFormData({
                        ...formData,
                        accountingConfig: {
                          ...formData.accountingConfig,
                          receivableLedgerId: e.target.value
                        }
                      })}
                    >
                      <option value="">Select Receivable Ledger</option>
                      {ledgers.filter(ledger => ledger.category === 'Receivable').map((ledger) => (
                        <option key={ledger._id} value={ledger._id}>
                          {ledger.code} - {ledger.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ledger Account</label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.ledgerId}
                    onChange={(e) => setFormData({ ...formData, ledgerId: e.target.value })}
                  >
                    <option value="">Select Ledger</option>
                    {ledgers.map((ledger) => (
                      <option key={ledger._id} value={ledger._id}>
                        {ledger.code} - {ledger.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Optional. Link this bill head to a ledger account for automatic accounting entries.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (editingBillHead ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 