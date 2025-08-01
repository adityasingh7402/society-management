import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const walletSchema = new mongoose.Schema({
  residentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Resident', 
    required: true,
    unique: true
  },
  societyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Society', 
    required: true 
  },
  walletId: {
    type: String,
    unique: true,
    default: function () {
      const timestamp = Math.floor(Date.now() / 1000).toString().slice(-4);
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      return `WLT-${timestamp}${randomNum}`;
    },
  },
  
  // Balance Information
  currentBalance: { 
    type: Number, 
    default: 0,
    min: 0
  },
  totalCredits: { 
    type: Number, 
    default: 0 
  },
  totalDebits: { 
    type: Number, 
    default: 0 
  },
  
  // Security Features
  pin: {
    type: String,
    select: false // Don't include in regular queries
  },
  pinAttempts: {
    type: Number,
    default: 0
  },
  pinLockedUntil: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Transaction Limits
  limits: {
    daily: {
      maxAmount: { type: Number, default: 50000 },
      usedAmount: { type: Number, default: 0 },
      lastResetDate: { type: Date, default: Date.now }
    },
    monthly: {
      maxAmount: { type: Number, default: 200000 },
      usedAmount: { type: Number, default: 0 },
      lastResetDate: { type: Date, default: Date.now }
    },
    perTransaction: {
      maxAmount: { type: Number, default: 25000 }
    }
  },
  
  // Wallet Settings
  settings: {
    autoRecharge: {
      enabled: { type: Boolean, default: false },
      threshold: { type: Number, default: 500 },
      amount: { type: Number, default: 2000 }
    },
    notifications: {
      lowBalance: { type: Boolean, default: true },
      transactions: { type: Boolean, default: true },
      bills: { type: Boolean, default: true }
    },
    security: {
      requirePinForTransactions: { type: Boolean, default: true },
      requirePinForLargeAmounts: { type: Boolean, default: true },
      largeAmountThreshold: { type: Number, default: 5000 }
    }
  },
  
  // KYC Information
  kycStatus: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected', 'Not Required'],
    default: 'Not Required'
  },
  kycDocuments: [{
    type: { type: String },
    url: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date },
    status: { 
      type: String, 
      enum: ['Pending', 'Verified', 'Rejected'],
      default: 'Pending'
    }
  }],
  
  // Account freeze/suspension
  isFrozen: {
    type: Boolean,
    default: false
  },
  freezeReason: {
    type: String
  },
  frozenAt: {
    type: Date
  },
  frozenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society'
  },
  
  // Audit Trail
  lastActivity: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident'
  }
}, {
  timestamps: true
});

// Indexes for better performance
walletSchema.index({ residentId: 1 });
walletSchema.index({ societyId: 1 });
walletSchema.index({ walletId: 1 });
walletSchema.index({ isActive: 1 });

// Pre-save hook to hash PIN
walletSchema.pre('save', async function(next) {
  if (!this.isModified('pin')) return next();
  
  if (this.pin) {
    this.pin = await bcrypt.hash(this.pin, 12);
  }
  next();
});

// Method to verify PIN
walletSchema.methods.verifyPin = async function(enteredPin) {
  if (!this.pin) return false;
  return await bcrypt.compare(enteredPin, this.pin);
};

// Method to check if wallet is locked
walletSchema.methods.isLocked = function() {
  return this.pinLockedUntil && this.pinLockedUntil > Date.now();
};

// Method to lock wallet after failed attempts
walletSchema.methods.lockWallet = function() {
  this.pinAttempts = 0;
  this.pinLockedUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
  return this.save();
};

// Method to reset daily limits
walletSchema.methods.resetDailyLimits = function() {
  const today = new Date();
  const lastReset = new Date(this.limits.daily.lastResetDate);
  
  if (today.toDateString() !== lastReset.toDateString()) {
    this.limits.daily.usedAmount = 0;
    this.limits.daily.lastResetDate = today;
  }
};

// Method to reset monthly limits
walletSchema.methods.resetMonthlyLimits = function() {
  const today = new Date();
  const lastReset = new Date(this.limits.monthly.lastResetDate);
  
  if (today.getMonth() !== lastReset.getMonth() || 
      today.getFullYear() !== lastReset.getFullYear()) {
    this.limits.monthly.usedAmount = 0;
    this.limits.monthly.lastResetDate = today;
  }
};

// Method to check if transaction is within limits
walletSchema.methods.canTransact = function(amount) {
  this.resetDailyLimits();
  this.resetMonthlyLimits();
  
  const errors = [];
  
  if (amount > this.limits.perTransaction.maxAmount) {
    errors.push('Amount exceeds per transaction limit');
  }
  
  if (this.limits.daily.usedAmount + amount > this.limits.daily.maxAmount) {
    errors.push('Amount exceeds daily limit');
  }
  
  if (this.limits.monthly.usedAmount + amount > this.limits.monthly.maxAmount) {
    errors.push('Amount exceeds monthly limit');
  }
  
  if (amount > this.currentBalance) {
    errors.push('Insufficient balance');
  }
  
  return {
    canTransact: errors.length === 0,
    errors
  };
};

// Method to update balance
walletSchema.methods.updateBalance = function(amount, type = 'credit') {
  if (type === 'credit') {
    this.currentBalance += amount;
    this.totalCredits += amount;
  } else if (type === 'debit') {
    this.currentBalance -= amount;
    this.totalDebits += amount;
    
    // Update limits
    this.resetDailyLimits();
    this.resetMonthlyLimits();
    this.limits.daily.usedAmount += amount;
    this.limits.monthly.usedAmount += amount;
  }
  
  this.lastActivity = new Date();
};

const Wallet = mongoose.models.Wallet || mongoose.model('Wallet', walletSchema);

export default Wallet;
