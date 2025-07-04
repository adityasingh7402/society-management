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
LedgerSchema.methods.updateBalance = async function(amount, type) {
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
  
  await this.save();
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

// Method to calculate GST
LedgerSchema.methods.calculateGST = function(amount) {
  if (!this.gstConfig.isGSTApplicable) return 0;
  return (amount * this.gstConfig.gstPercentage) / 100;
};

// Method to calculate TDS
LedgerSchema.methods.calculateTDS = function(amount) {
  if (!this.tdsConfig.isTDSApplicable) return 0;
  return (amount * this.tdsConfig.tdsPercentage) / 100;
};

// Static method to get trial balance
LedgerSchema.statics.getTrialBalance = async function(societyId) {
  const ledgers = await this.find({ societyId, status: 'Active' });
  
  const trialBalance = {
    debit: 0,
    credit: 0,
    accounts: []
  };
  
  ledgers.forEach(ledger => {
    const balanceType = ledger.getBalanceType();
    const absBalance = Math.abs(ledger.currentBalance);
    
    trialBalance.accounts.push({
      code: ledger.code,
      name: ledger.name,
      type: ledger.type,
      debit: balanceType === 'Debit' ? absBalance : 0,
      credit: balanceType === 'Credit' ? absBalance : 0
    });
    
    if (balanceType === 'Debit') {
      trialBalance.debit += absBalance;
    } else if (balanceType === 'Credit') {
      trialBalance.credit += absBalance;
    }
  });
  
  return trialBalance;
};

export default mongoose.models.Ledger || mongoose.model('Ledger', LedgerSchema); 