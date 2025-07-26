import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import PreloaderSociety from '../../components/PreloaderSociety';
import { FileText, Plus, Edit2, Archive, Check, X, AlertCircle, Trash2 } from 'lucide-react';
import { debounce } from 'lodash';
import { usePermissions } from "../../../components/PermissionsContext";
import AccessDenied from "../widget/societyComponents/accessRestricted";

export default function BillHeads() {
  const router = useRouter();
  const permissions = usePermissions();
  if (!permissions.includes("manage_bills") && !permissions.includes("full_access")) {
    return <AccessDenied />;
  }
  const [loading, setLoading] = useState(true);
  const [billHeads, setBillHeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [filters, setFilters] = useState({
    category: '',
    subCategory: '',
    calculationType: ''
  });
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
  // Update the initial form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Maintenance',
    subCategory: '',
    description: '',
    calculationType: 'Fixed',
    fixedAmount: 0,
    perUnitRate: 0,
    formula: '',
    billNumberPrefix: '',
    billNumberSequence: 1,
    frequency: 'Monthly',
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
    notificationConfig: {
      sendReminders: true,
      reminderDays: [-7, -3, -1, 1, 3, 7],
      reminderTemplate: 'Your {billTitle} of ₹{amount} is {status}. Due date: {dueDate}'
    },
    accountingConfig: {
      incomeLedgerId: '',
      receivableLedgerId: '',
      gstLedgerId: '',
      lateFeeIncomeLedgerId: ''
    },
    status: 'Active'
  });

  // Add these constants at the top with other constants
  const FREQUENCIES = ['OneTime', 'Monthly', 'Quarterly', 'HalfYearly', 'Yearly'];
  const CHARGE_TYPES = ['Fixed', 'Percentage'];
  const COMPOUNDING_FREQUENCIES = ['Daily', 'Weekly', 'Monthly'];

  // Add subcategories mapping
  const subCategories = {
    Utility: ['Water', 'Electricity', 'Gas', 'Internet', 'Cable', 'Telephone', 'Other'],
    Maintenance: ['Cleaning', 'Security', 'Gardening', 'Equipment', 'Repairs', 'Staff', 'Other'],
    Amenity: ['Gym', 'Swimming Pool', 'Club House', 'Sports', 'Park', 'Community Hall', 'Other'],
    // Service: ['Pest Control', 'Plumbing', 'Electrical', 'Carpentry', 'Housekeeping', 'Other'],
    Other: [
      'Society Charges',
      'Platform Charges',
      'Transfer Charges',
      'NOC Charges',
      'Processing Fees',
      'Late Payment Charges',
      'Legal Charges',
      'Documentation Charges',
      'Administrative Charges',
      'Event Charges',
      'Miscellaneous'
    ]
  };

  // Handle category change
  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setFormData(prev => ({
      ...prev,
      category: newCategory,
      subCategory: '', // Reset subcategory when category changes
      accountingConfig: {
        ...prev.accountingConfig,
        incomeLedgerId: '', // Reset ledger IDs when category changes
        receivableLedgerId: ''
      }
    }));
  };

  // Individual field handlers
  const handleCodeChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, code: value }));
    if (isSubmitted) { // Only validate if form has been submitted
      const error = validateField('code', value);
      setFormErrors(prev => ({ ...prev, code: error }));
    }
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, name: value }));
    if (isSubmitted) {
      const error = validateField('name', value);
      setFormErrors(prev => ({ ...prev, name: error }));
    }
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, description: value }));
  };

  const handleSubCategoryChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, subCategory: value }));
    const error = validateField('subCategory', value);
    setFormErrors(prev => ({ ...prev, subCategory: error }));
  };

  const handleCalculationTypeChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, calculationType: value }));
    const error = validateField('calculationType', value);
    setFormErrors(prev => ({ ...prev, calculationType: error }));
  };

  const handleFixedAmountChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData(prev => ({ ...prev, fixedAmount: value }));
    if (isSubmitted) {
      const error = validateField('fixedAmount', value);
      setFormErrors(prev => ({ ...prev, fixedAmount: error }));
    }
  };

  const handlePerUnitRateChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData(prev => ({ ...prev, perUnitRate: value }));
    if (isSubmitted) {
      const error = validateField('perUnitRate', value);
      setFormErrors(prev => ({ ...prev, perUnitRate: error }));
    }
  };

  const handleFormulaChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, formula: value }));
  };

  const handleStatusChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, status: value }));
  };

  // Add new handlers
  const handleFrequencyChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, frequency: value }));
  };

  const handleBillNumberPrefixChange = (e) => {
    const value = e.target.value;
    if (value.length <= 5) {
      setFormData(prev => ({ ...prev, billNumberPrefix: value }));
    }
  };

  const handleBillNumberSequenceChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    if (value >= 1) {
      setFormData(prev => ({ ...prev, billNumberSequence: value }));
    }
  };

  const handleReminderDaysChange = (e) => {
    const value = e.target.value;
    try {
      const days = value.split(',').map(d => parseInt(d.trim()));
      if (days.every(d => !isNaN(d))) {
        setFormData(prev => ({
          ...prev,
          notificationConfig: {
            ...prev.notificationConfig,
            reminderDays: days
          }
        }));
      }
    } catch (error) {
      console.error('Invalid reminder days format');
    }
  };

  const handleReminderTemplateChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      notificationConfig: {
        ...prev.notificationConfig,
        reminderTemplate: value
      }
    }));
  };

  const handleSendRemindersChange = (e) => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      notificationConfig: {
        ...prev.notificationConfig,
        sendReminders: checked
      }
    }));
  };

  // Notification state
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Add form validation schema
  const validationSchema = {
    code: {
      required: true,
      pattern: /^[A-Z0-9-_]{3,10}$/,
      message: 'Code must be 3-10 characters (A-Z, 0-9, -, _)'
    },
    name: {
      required: true,
      minLength: 3,
      maxLength: 50,
      message: 'Name must be between 3 and 50 characters'
    },
    category: {
      required: true,
      message: 'Category is required'
    },
    subCategory: {
      required: true,
      message: 'Sub-category is required'
    },
    calculationType: {
      required: true,
      message: 'Calculation type is required'
    },
    fixedAmount: {
      min: 0,
      message: 'Amount must be greater than 0'
    },
    perUnitRate: {
      min: 0,
      message: 'Rate must be greater than 0'
    }
  };

  // Add form error state
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); // Add this state

  // Validate single field
  const validateField = (name, value) => {
    const validation = validationSchema[name];
    if (!validation) return '';

    if (validation.required && !value) {
      return validation.message;
    }

    if (validation.pattern && !validation.pattern.test(value)) {
      return validation.message;
    }

    if (validation.minLength && value.length < validation.minLength) {
      return validation.message;
    }

    if (validation.maxLength && value.length > validation.maxLength) {
      return validation.message;
    }

    if (validation.min !== undefined && Number(value) < validation.min) {
      return validation.message;
    }

    return '';
  };

  // Fixed handleFieldChange function
  const handleFieldChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Debounce validation to avoid constant re-renders
    const debouncedValidate = debounce(() => {
      const error = validateField(name, value);
      setFormErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }, 300);
    
    debouncedValidate();
  };

  // Generic input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    handleFieldChange(name, value);
  };

  // Validate all fields
  const validateForm = () => {
    const errors = {};
    Object.keys(validationSchema).forEach(field => {
      const value = formData[field];
      const error = validateField(field, value);
      if (error) {
        errors[field] = error;
      }
    });

    // Additional validation for calculation type specific fields
    if (formData.calculationType === 'Fixed' && (!formData.fixedAmount || formData.fixedAmount <= 0)) {
      errors.fixedAmount = 'Fixed amount is required and must be greater than 0';
    }

    if (formData.calculationType === 'PerUnit' && (!formData.perUnitRate || formData.perUnitRate <= 0)) {
      errors.perUnitRate = 'Per unit rate is required and must be greater than 0';
    }

    // GST validation
    if (formData.gstConfig.isGSTApplicable) {
      const { cgstPercentage, sgstPercentage, igstPercentage } = formData.gstConfig;
      if (cgstPercentage < 0 || cgstPercentage > 14) {
        errors.cgstPercentage = 'CGST must be between 0 and 14%';
      }
      if (sgstPercentage < 0 || sgstPercentage > 14) {
        errors.sgstPercentage = 'SGST must be between 0 and 14%';
      }
      if (igstPercentage < 0 || igstPercentage > 28) {
        errors.igstPercentage = 'IGST must be between 0 and 28%';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // GST Configuration handlers
  const handleGSTApplicableChange = (e) => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      gstConfig: { ...prev.gstConfig, isGSTApplicable: checked }
    }));
  };

  const handleCGSTChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    if (value >= 0 && value <= 14) {
      setFormData(prev => ({
        ...prev,
        gstConfig: { ...prev.gstConfig, cgstPercentage: value }
      }));
    }
  };

  const handleSGSTChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    if (value >= 0 && value <= 14) {
      setFormData(prev => ({
        ...prev,
        gstConfig: { ...prev.gstConfig, sgstPercentage: value }
      }));
    }
  };

  const handleIGSTChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    if (value >= 0 && value <= 28) {
      setFormData(prev => ({
        ...prev,
        gstConfig: { ...prev.gstConfig, igstPercentage: value }
      }));
    }
  };

  // Late Payment Configuration handlers
  const handleLatePaymentApplicableChange = (e) => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      latePaymentConfig: { ...prev.latePaymentConfig, isLatePaymentChargeApplicable: checked }
    }));
  };

  const handleGracePeriodChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setFormData(prev => ({
      ...prev,
      latePaymentConfig: { ...prev.latePaymentConfig, gracePeriodDays: value }
    }));
  };

  const handleChargeTypeChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      latePaymentConfig: { ...prev.latePaymentConfig, chargeType: value }
    }));
  };

  const handleChargeValueChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData(prev => ({
      ...prev,
      latePaymentConfig: { ...prev.latePaymentConfig, chargeValue: value }
    }));
  };

  const handleCompoundingFrequencyChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      latePaymentConfig: { ...prev.latePaymentConfig, compoundingFrequency: value }
    }));
  };

  // Accounting Configuration handlers
  const handleIncomeLedgerChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      accountingConfig: { ...prev.accountingConfig, incomeLedgerId: value }
    }));
  };

  const handleReceivableLedgerChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      accountingConfig: { ...prev.accountingConfig, receivableLedgerId: value }
    }));
  };

  // Add loading states for API calls
  const [isFetchingBillHeads, setIsFetchingBillHeads] = useState(true);
  const [isFetchingLedgers, setIsFetchingLedgers] = useState(true);

  // Add debounced search
  const debouncedSearch = useCallback(
    debounce((term) => {
      const filtered = billHeads.filter(bh => 
        bh.name.toLowerCase().includes(term.toLowerCase()) ||
        bh.code.toLowerCase().includes(term.toLowerCase()) ||
        bh.category.toLowerCase().includes(term.toLowerCase()) ||
        bh.subCategory.toLowerCase().includes(term.toLowerCase())
      );
      // setFilteredBillHeads(filtered); // This line is removed as per the edit hint
    }, 300),
    [billHeads]
  );

  // Handle search
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
  };

  // Handle filter click for status filters
  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
  };

  // Handle filter change for category/subcategory/calculation type
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      // Reset subCategory when category changes
      ...(field === 'category' ? { subCategory: '' } : {})
    }));
  };

  // Combine search and filters
  const filteredBillHeads = billHeads.filter(bill => {
    // Search filter
    const matchesSearch = !searchTerm || 
      bill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category, subcategory, and calculation type filters
    const matchesFilters = (
      (!filters.category || bill.category === filters.category) &&
      (!filters.subCategory || bill.subCategory === filters.subCategory) &&
      (!filters.calculationType || bill.calculationType === filters.calculationType)
    );

    // Status and taxable filters
    const matchesStatusFilter = 
      activeFilter === 'all' ||
      (activeFilter === 'active' && bill.status === 'Active') ||
      (activeFilter === 'inactive' && bill.status === 'Inactive') ||
      (activeFilter === 'taxable' && bill.gstConfig?.isGSTApplicable);

    return matchesSearch && matchesFilters && matchesStatusFilter;
  });

  // Fetch bill heads and ledgers on component mount
  useEffect(() => {
    fetchBillHeads();
    fetchLedgers();
  }, []);

  // Update filtered data when billHeads or filter changes
  useEffect(() => {
    // The filtering logic is now handled by the computed filteredBillHeads
  }, [billHeads, activeFilter]);

  // Update summary when billHeads changes
  useEffect(() => {
    if (billHeads.length > 0) {
      const newSummary = {
        total: billHeads.length,
        active: billHeads.filter(b => b.status === 'Active').length,
        inactive: billHeads.filter(b => b.status === 'Inactive').length,
        gstApplicable: billHeads.filter(b => b.gstConfig.isGSTApplicable).length,
        byCategory: {
          Maintenance: billHeads.filter(b => b.category === 'Maintenance').length,
          Utility: billHeads.filter(b => b.category === 'Utility').length,
          Amenity: billHeads.filter(b => b.category === 'Amenity').length,
          Service: billHeads.filter(b => b.category === 'Service').length,
          Other: billHeads.filter(b => b.category === 'Other').length
        }
      };
      setSummary(newSummary);
    }
  }, [billHeads]);

  // Improved fetchBillHeads with loading state
  const fetchBillHeads = async () => {
    setIsFetchingBillHeads(true);
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
      setIsFetchingBillHeads(false);
    }
  };

  // Improved fetchLedgers with loading state
  const fetchLedgers = async () => {
    setIsFetchingLedgers(true);
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
    } finally {
      setIsFetchingLedgers(false);
    }
  };

  // Improved handleSubmit with validation and loading state
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitted(true); // Set submitted state to true
    
    if (!validateForm()) {
      showNotification('Please fix the form errors before submitting', 'error');
      return;
    }

    setIsSubmitting(true);
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
        societyId: societyData._id,
        accountingConfig: {
          incomeLedgerId: formData.accountingConfig.incomeLedgerId || null,
          receivableLedgerId: formData.accountingConfig.receivableLedgerId || null
        }
      };
      console.log(payload);

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
      setIsSubmitting(false);
    }
  };

  const handleEdit = (billHead) => {
    setEditingBillHead(billHead);
    setFormData({
      code: billHead.code,
      name: billHead.name,
      category: billHead.category,
      subCategory: billHead.subCategory || '',
      description: billHead.description || '',
      calculationType: billHead.calculationType,
      fixedAmount: billHead.fixedAmount || 0,
      perUnitRate: billHead.perUnitRate || 0,
      formula: billHead.formula || '',
      billNumberPrefix: billHead.billNumberPrefix || '',
      billNumberSequence: billHead.billNumberSequence || 1,
      frequency: billHead.frequency || 'Monthly',
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
      notificationConfig: {
        sendReminders: billHead.notificationConfig?.sendReminders || true,
        reminderDays: billHead.notificationConfig?.reminderDays || [-7, -3, -1, 1, 3, 7],
        reminderTemplate: billHead.notificationConfig?.reminderTemplate || 'Your {billTitle} of ₹{amount} is {status}. Due date: {dueDate}'
      },
      accountingConfig: {
        incomeLedgerId: billHead.accountingConfig?.incomeLedgerId || '',
        receivableLedgerId: billHead.accountingConfig?.receivableLedgerId || '',
        gstLedgerId: billHead.accountingConfig?.gstLedgerId || '',
        lateFeeIncomeLedgerId: billHead.accountingConfig?.lateFeeIncomeLedgerId || ''
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
      subCategory: '',
      description: '',
      calculationType: 'Fixed',
      fixedAmount: 0,
      perUnitRate: 0,
      formula: '',
      billNumberPrefix: '',
      billNumberSequence: 1,
      frequency: 'Monthly',
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
      notificationConfig: {
        sendReminders: true,
        reminderDays: [-7, -3, -1, 1, 3, 7],
        reminderTemplate: 'Your {billTitle} of ₹{amount} is {status}. Due date: {dueDate}'
      },
      accountingConfig: {
        incomeLedgerId: '',
        receivableLedgerId: '',
        gstLedgerId: '',
        lateFeeIncomeLedgerId: ''
      },
      status: 'Active'
    });
    setFormErrors({});
    setIsSubmitted(false); // Reset submitted state
    setShowForm(false);
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Fixed FormField component
  const FormField = ({ label, name, type = 'text', value, onChange, error, ...props }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );

  // Add this function after the other handlers
  const getFilteredLedgers = (category, type = 'Income') => {
    return ledgers.filter(l => {
      const isCorrectType = l.category === type;
      const matchesCategory = l.subCategory === category || !l.subCategory;
      return isCorrectType && matchesCategory;
    });
  };

  const formatAmount = (amount, balanceType) => {
    if (!amount) return '₹0.00';
    const formattedAmount = parseFloat(amount).toFixed(2);
    if (balanceType === 'Debit') {
      return `₹${formattedAmount} Dr`;
    } else if (balanceType === 'Credit') {
      return `₹${formattedAmount} Cr`;
    } else {
      return `₹${formattedAmount}`;
    }
  };

  // Add delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    billHead: null
  });

  // Add delete handler
  const handleDelete = async (billHead) => {
    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      const response = await fetch(`/api/BillHead-Api/delete-bill-head?billHeadId=${billHead._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete bill head');
      }

      showNotification('Bill head deleted successfully', 'success');
      setDeleteConfirm({ show: false, billHead: null });
      fetchBillHeads(); // Refresh the list
    } catch (error) {
      console.error('Error deleting bill head:', error);
      showNotification(error.message, 'error');
    }
  };

  if (isFetchingBillHeads || isFetchingLedgers) {
    return <PreloaderSociety />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b-4 border-blue-500">
        <div className="mx-auto px-4 py-4">
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

      {/* Add search bar */}
      <div className="mx-auto px-4 py-4">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search bill heads..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Add filter section */}
      <div className="mx-auto px-4 py-4">
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
            >
              <option value="">All Categories</option>
              {Object.keys(subCategories).map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Subcategory</label>
            <select
              value={filters.subCategory}
              onChange={(e) => handleFilterChange('subCategory', e.target.value)}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
              disabled={!filters.category}
            >
              <option value="">All Subcategories</option>
              {filters.category && subCategories[filters.category]?.map((subCategory) => (
                <option key={subCategory} value={subCategory}>{subCategory}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Calculation Type</label>
            <select
              value={filters.calculationType}
              onChange={(e) => handleFilterChange('calculationType', e.target.value)}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
            >
              <option value="">All Types</option>
              <option value="Fixed">Fixed Amount</option>
              <option value="PerUnit">Per Unit Rate</option>
              <option value="Formula">Formula Based</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mx-auto px-4 py-6">
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
      <main className="mx-auto px-4 pb-8">
        {/* Bill Heads Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategory</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calculation Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBillHeads.map((billHead) => (
                  <tr key={billHead._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{billHead.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{billHead.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{billHead.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{billHead.subCategory}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{billHead.periodType || 'Monthly'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{billHead.calculationType}</td>
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
                      <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleEdit(billHead)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                      >
                          <Edit2 size={18} />
                      </button>
                        <button
                          onClick={() => setDeleteConfirm({ show: true, billHead })}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bill Head Code</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleCodeChange}
                    placeholder="Enter code (e.g., WTR-001)"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                      isSubmitted && formErrors.code ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {isSubmitted && formErrors.code && <p className="mt-1 text-sm text-red-500">{formErrors.code}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="Enter name"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                      isSubmitted && formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {isSubmitted && formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleCategoryChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                      isSubmitted && formErrors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select Category</option>
                    {Object.keys(subCategories).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {isSubmitted && formErrors.category && <p className="mt-1 text-sm text-red-500">{formErrors.category}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
                  <select
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleSubCategoryChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                      isSubmitted && formErrors.subCategory ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select Sub Category</option>
                    {formData.category && subCategories[formData.category]?.map(subCat => (
                      <option key={subCat} value={subCat}>{subCat}</option>
                    ))}
                  </select>
                  {isSubmitted && formErrors.subCategory && <p className="mt-1 text-sm text-red-500">{formErrors.subCategory}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calculation Type</label>
                  <select
                    name="calculationType"
                    value={formData.calculationType}
                    onChange={handleCalculationTypeChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                      isSubmitted && formErrors.calculationType ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="Fixed">Fixed Amount</option>
                    <option value="PerUnit">Per Unit</option>
                    <option value="Formula">Formula Based</option>
                    <option value="Custom">Custom</option>
                  </select>
                  {isSubmitted && formErrors.calculationType && <p className="mt-1 text-sm text-red-500">{formErrors.calculationType}</p>}
                </div>

                {formData.calculationType === 'Fixed' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Amount (₹)</label>
                    <input
                      type="number"
                      name="fixedAmount"
                      value={formData.fixedAmount}
                      onChange={handleFixedAmountChange}
                      placeholder="Enter fixed amount"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                        isSubmitted && formErrors.fixedAmount ? 'border-red-500' : 'border-gray-300'
                      }`}
                      min="0"
                      step="0.01"
                    />
                    {isSubmitted && formErrors.fixedAmount && <p className="mt-1 text-sm text-red-500">{formErrors.fixedAmount}</p>}
                  </div>
                )}

                {formData.calculationType === 'PerUnit' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Per Unit Rate (₹)</label>
                    <input
                      type="number"
                      name="perUnitRate"
                      value={formData.perUnitRate}
                      onChange={handlePerUnitRateChange}
                      placeholder="Enter per unit rate"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                        isSubmitted && formErrors.perUnitRate ? 'border-red-500' : 'border-gray-300'
                      }`}
                      min="0"
                      step="0.01"
                    />
                    {isSubmitted && formErrors.perUnitRate && <p className="mt-1 text-sm text-red-500">{formErrors.perUnitRate}</p>}
                  </div>
                )}

                {formData.calculationType === 'Formula' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Formula</label>
                    <input
                      type="text"
                      name="formula"
                      value={formData.formula}
                      onChange={handleFormulaChange}
                      placeholder="Enter formula (e.g., area * rate)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Available variables: area, rate, units<br/>
                      Operators: + - * / ( )<br/>
                      Example: (area * rate) + (units * 100)
                    </p>
                  </div>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  placeholder="Enter description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleStatusChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* GST Configuration */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-4">GST Configuration</h3>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.gstConfig.isGSTApplicable}
                      onChange={handleGSTApplicableChange}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">GST Applicable</span>
                  </label>
                </div>

                {formData.gstConfig.isGSTApplicable && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">CGST (%)</label>
                      <input
                        type="number"
                        name="cgstPercentage"
                        value={formData.gstConfig.cgstPercentage}
                        onChange={handleCGSTChange}
                        min="0"
                        max="14"
                        step="0.01"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                          isSubmitted && formErrors.cgstPercentage ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {isSubmitted && formErrors.cgstPercentage && <p className="mt-1 text-sm text-red-500">{formErrors.cgstPercentage}</p>}
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">SGST (%)</label>
                      <input
                        type="number"
                        name="sgstPercentage"
                        value={formData.gstConfig.sgstPercentage}
                        onChange={handleSGSTChange}
                        min="0"
                        max="14"
                        step="0.01"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                          isSubmitted && formErrors.sgstPercentage ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {isSubmitted && formErrors.sgstPercentage && <p className="mt-1 text-sm text-red-500">{formErrors.sgstPercentage}</p>}
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">IGST (%)</label>
                      <input
                        type="number"
                        name="igstPercentage"
                        value={formData.gstConfig.igstPercentage}
                        onChange={handleIGSTChange}
                        min="0"
                        max="28"
                        step="0.01"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                          isSubmitted && formErrors.igstPercentage ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {isSubmitted && formErrors.igstPercentage && <p className="mt-1 text-sm text-red-500">{formErrors.igstPercentage}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Late Payment Configuration */}
              <div className="border rounded-lg p-4 bg-gray-50 mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Late Payment Configuration</h3>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.latePaymentConfig.isLatePaymentChargeApplicable}
                      onChange={handleLatePaymentApplicableChange}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Late Payment Charge Applicable</span>
                  </label>
                </div>

                {formData.latePaymentConfig.isLatePaymentChargeApplicable && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Grace Period (Days)</label>
                      <input
                      type="number"
                      value={formData.latePaymentConfig.gracePeriodDays}
                        onChange={handleGracePeriodChange}
                      min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Charge Type</label>
                      <select
                        value={formData.latePaymentConfig.chargeType}
                        onChange={handleChargeTypeChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        {CHARGE_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Charge Value {formData.latePaymentConfig.chargeType === 'Percentage' ? '(%)' : '(₹)'}
                      </label>
                      <input
                      type="number"
                      value={formData.latePaymentConfig.chargeValue}
                        onChange={handleChargeValueChange}
                      min="0"
                        step={formData.latePaymentConfig.chargeType === 'Percentage' ? '0.01' : '1'}
                        max={formData.latePaymentConfig.chargeType === 'Percentage' ? '100' : undefined}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Compounding Frequency</label>
                      <select
                        value={formData.latePaymentConfig.compoundingFrequency}
                        onChange={handleCompoundingFrequencyChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        {COMPOUNDING_FREQUENCIES.map(freq => (
                          <option key={freq} value={freq}>{freq}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Configuration */}
              <div className="border rounded-lg p-4 bg-gray-50 mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Configuration</h3>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.notificationConfig.sendReminders}
                      onChange={handleSendRemindersChange}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Send Reminders</span>
                  </label>
                </div>

                {formData.notificationConfig.sendReminders && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Days</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.notificationConfig.reminderDays.join(', ')}
                          onChange={handleReminderDaysChange}
                          placeholder="Enter days (comma separated, e.g., -7, -3, -1, 1, 3, 7)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            notificationConfig: {
                              ...prev.notificationConfig,
                              reminderDays: [-7, -3, -1, 1, 3, 7]
                            }
                          }))}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          Default
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">Negative numbers for days before due date, positive for after</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Template</label>
                      <div className="space-y-2">
                        <textarea
                          value={formData.notificationConfig.reminderTemplate}
                          onChange={handleReminderTemplateChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Use {billTitle}, {amount}, {status}, and {dueDate} placeholders"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              notificationConfig: {
                                ...prev.notificationConfig,
                                reminderTemplate: 'Your {billTitle} of ₹{amount} is {status}. Due date: {dueDate}'
                              }
                            }))}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                          >
                            Insert Default Template
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              const template = formData.notificationConfig.reminderTemplate;
                              const placeholder = '{billTitle}';
                              setFormData(prev => ({
                                ...prev,
                                notificationConfig: {
                                  ...prev.notificationConfig,
                                  reminderTemplate: template + placeholder
                                }
                              }));
                            }}
                            className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded hover:bg-blue-200 cursor-pointer"
                          >
                            {'{billTitle}'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const template = formData.notificationConfig.reminderTemplate;
                              const placeholder = '{amount}';
                              setFormData(prev => ({
                                ...prev,
                                notificationConfig: {
                                  ...prev.notificationConfig,
                                  reminderTemplate: template + placeholder
                                }
                              }));
                            }}
                            className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded hover:bg-blue-200 cursor-pointer"
                          >
                            {'{amount}'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const template = formData.notificationConfig.reminderTemplate;
                              const placeholder = '{status}';
                              setFormData(prev => ({
                                ...prev,
                                notificationConfig: {
                                  ...prev.notificationConfig,
                                  reminderTemplate: template + placeholder
                                }
                              }));
                            }}
                            className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded hover:bg-blue-200 cursor-pointer"
                          >
                            {'{status}'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const template = formData.notificationConfig.reminderTemplate;
                              const placeholder = '{dueDate}';
                              setFormData(prev => ({
                                ...prev,
                                notificationConfig: {
                                  ...prev.notificationConfig,
                                  reminderTemplate: template + placeholder
                                }
                              }));
                            }}
                            className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded hover:bg-blue-200 cursor-pointer"
                          >
                            {'{dueDate}'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Accounting Configuration */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Accounting Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Income Ledger</label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                      {formData.category && formData.subCategory ? 
                        `${formData.category} - ${formData.subCategory} Income` : 
                        'Select category and subcategory first'
                      }
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Auto-generated income ledger name based on category and subcategory
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Receivable Ledger</label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                      {formData.category && formData.subCategory ? 
                        `${formData.category} - ${formData.subCategory} Receivable` : 
                        'Select category and subcategory first'
                      }
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Auto-generated receivable ledger name based on category and subcategory
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Saving...' : editingBillHead ? 'Update Bill Head' : 'Create Bill Head'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-red-100 rounded-full p-3">
                <AlertCircle className="text-red-600" size={32} />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-center mb-4">Confirm Delete</h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete the bill head "{deleteConfirm.billHead?.name}"? 
              This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setDeleteConfirm({ show: false, billHead: null })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.billHead)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}