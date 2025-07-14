import mongoose from 'mongoose';

const LedgerSchema = new mongoose.Schema({
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  
  // Ledger type and category
  type: {
    type: String,
    enum: ['Asset', 'Liability', 'Income', 'Expense', 'Equity'],
    required: true
  },
  category: {
    type: String,
    enum: [
      // Asset categories
      'Current Asset', 'Fixed Asset', 'Bank', 'Cash', 'Receivable', 'Investment',
      // Liability categories
      'Current Liability', 'Long Term Liability', 'Payable', 'Deposit',
      // Income categories
      'Operating Income', 'Other Income', 'Interest Income',
      // Expense categories
      'Operating Expense', 'Administrative Expense', 'Financial Expense',
      // Equity categories
      'Capital', 'Reserve', 'Surplus'
    ],
    required: true
  },
  
  // Bill category association (for income and receivable ledgers)
  billCategory: {
    type: String,
    enum: ['Maintenance', 'Utility', 'Amenity', 'Service', 'Other'],
    required: function() {
      return this.category === 'Operating Income' || 
             (this.category === 'Receivable' && this.type === 'Asset');
    }
  },
  
  // Subcategory for detailed tracking
  subCategory: {
    type: String,
    required: false,
    validate: {
      validator: function(value) {
        // If no value is provided, it's valid
        if (!value) return true;
        
        // If billCategory is not set, any value is valid
        if (!this.billCategory) return true;
        
        const subCategories = {
          Utility: ['Water', 'Electricity', 'Gas', 'Internet', 'Cable', 'Telephone', 'Other'],
          Maintenance: ['Cleaning', 'Security', 'Gardening', 'Equipment', 'Repairs', 'Staff', 'Other'],
          Amenity: ['Gym', 'Swimming Pool', 'Club House', 'Sports', 'Park', 'Community Hall', 'Other'],
          Service: ['Pest Control', 'Plumbing', 'Electrical', 'Carpentry', 'Housekeeping', 'Other'],
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
        
        // Only validate if a value is provided and billCategory exists
        return subCategories[this.billCategory]?.includes(value);
      },
      message: 'Invalid subcategory for the selected bill category'
    }
  },
  
  // Account details for bank accounts
  bankDetails: {
    accountNumber: String,
    bankName: String,
    branchName: String,
    ifscCode: String,
    accountType: {
      type: String,
      enum: ['Savings', 'Current', 'FixedDeposit', 'Other']
    }
  },
  
  // GST configuration
  gstConfig: {
    isGSTApplicable: {
      type: Boolean,
      default: false
    },
    gstNumber: String,
    gstType: {
      type: String,
      enum: ['Regular', 'Composition', 'Unregistered']
    }
  },
  
  // TDS configuration
  tdsConfig: {
    isTDSApplicable: {
      type: Boolean,
      default: false
    },
    tdsPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    tanNumber: String
  },
  
  // Balance tracking
  openingBalance: {
    type: Number,
    required: true,
    default: 0
  },
  currentBalance: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Reconciliation
  lastReconciled: Date,
  reconciliationStatus: {
    type: String,
    enum: ['Reconciled', 'Pending', 'InProgress', 'Error'],
    default: 'Pending'
  },
  
  // Status and audit
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Frozen'],
    default: 'Active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index for unique code per society
LedgerSchema.index({ societyId: 1, code: 1 }, { unique: true });

// Method to update balance
LedgerSchema.methods.updateBalance = async function(amount, type, session) {
  if (type === 'debit') {
    switch(this.type) {
      case 'Asset':
      case 'Expense':
        this.currentBalance += amount;
        break;
      case 'Liability':
      case 'Income':
      case 'Equity':
        this.currentBalance -= amount;
        break;
    }
  } else { // credit
    switch(this.type) {
      case 'Asset':
      case 'Expense':
        this.currentBalance -= amount;
        break;
      case 'Liability':
      case 'Income':
      case 'Equity':
        this.currentBalance += amount;
        break;
    }
  }
  
  await this.save({ session });
};

// Method to get balance type (debit/credit)
LedgerSchema.methods.getBalanceType = function() {
  if (this.currentBalance === 0) return 'Balanced';
  
  switch(this.type) {
    case 'Asset':
    case 'Expense':
      return this.currentBalance > 0 ? 'Debit' : 'Credit';
    case 'Liability':
    case 'Income':
    case 'Equity':
      return this.currentBalance > 0 ? 'Credit' : 'Debit';
  }
};

// Static method to get category-specific ledgers
LedgerSchema.statics.getCategoryLedgers = async function(societyId, billCategory) {
  const ledgers = await this.find({
    societyId,
    billCategory,
    status: 'Active',
    $or: [
      { category: 'Operating Income' },
      { category: 'Receivable', type: 'Asset' }
    ]
  });

  return {
    incomeLedger: ledgers.find(l => l.category === 'Operating Income'),
    receivableLedger: ledgers.find(l => l.category === 'Receivable')
  };
};

// Static method to create default category ledgers
LedgerSchema.statics.createCategoryLedgers = async function(societyId, billCategory, createdBy) {
  const code = billCategory.substring(0, 3).toUpperCase();
  
  const incomeLedger = await this.findOneAndUpdate(
    {
      societyId,
      code: `${code}INC`,
      billCategory
    },
    {
      $setOnInsert: {
        name: `${billCategory} Income`,
        type: 'Income',
        category: 'Operating Income',
        description: `Default Income Ledger for ${billCategory}`,
        createdBy
      }
    },
    { upsert: true, new: true }
  );

  const receivableLedger = await this.findOneAndUpdate(
    {
      societyId,
      code: `${code}REC`,
      billCategory
    },
    {
      $setOnInsert: {
        name: `${billCategory} Receivable`,
        type: 'Asset',
        category: 'Receivable',
        description: `Default Receivable Ledger for ${billCategory}`,
        createdBy
      }
    },
    { upsert: true, new: true }
  );

  return { incomeLedger, receivableLedger };
};

export default mongoose.models.Ledger || mongoose.model('Ledger', LedgerSchema); 