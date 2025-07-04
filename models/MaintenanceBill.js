import mongoose from 'mongoose';

const MaintenanceBillSchema = new mongoose.Schema({
  // References
  societyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Society',
    required: true 
  },
  billHeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BillHead',
    required: true
  },
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  flatNumber: { 
    type: String, 
    required: true 
  },
  blockName: { 
    type: String, 
    required: true 
  },
  floorNumber: { 
    type: Number, 
    required: true 
  },
  residentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Resident',
    required: true
  },

  // Owner details
  ownerName: { type: String, required: true },
  ownerMobile: { type: String, required: true },
  ownerEmail: { type: String, required: true },

  // Bill details
  description: String,
  baseAmount: { 
    type: Number, 
    required: true 
  },
  additionalCharges: [{
    description: String,
    amount: Number
  }],
  
  // GST details
  gstDetails: {
    isGSTApplicable: { type: Boolean, default: false },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    totalGST: { type: Number, default: 0 }
  },

  // Dates
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },

  // Late payment and penalty
  latePaymentConfig: {
    isApplicable: { type: Boolean, default: false },
    gracePeriodDays: { type: Number, default: 0 },
    chargeType: { 
      type: String,
      enum: ['Fixed', 'Percentage'],
      default: 'Fixed'
    },
    chargeValue: { type: Number, default: 0 },
    compoundingFrequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly'],
      default: 'Monthly'
    }
  },
  currentPenalty: { type: Number, default: 0 },

  // Payment details
  totalAmount: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  remainingAmount: { type: Number },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Pending'
  },
  paymentHistory: [{
    amount: Number,
    paymentDate: Date,
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Cheque', 'Bank Transfer', 'UPI', 'Other']
    },
    transactionId: String,
    receiptNumber: String,
    notes: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Accounting entries
  journalEntries: [{
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JournalVoucher'
    },
    type: {
      type: String,
      enum: ['Bill', 'Payment', 'Late Fee', 'Cancellation']
    },
    amount: Number,
    date: Date
  }],

  // Notifications
  notifications: [{
    type: {
      type: String,
      enum: ['Reminder', 'Payment', 'Overdue', 'Other']
    },
    sentAt: Date,
    channel: {
      type: String,
      enum: ['Email', 'SMS', 'Push']
    },
    status: {
      type: String,
      enum: ['Sent', 'Failed', 'Pending']
    }
  }],

  // Audit trail
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

// Calculate penalty based on configuration
MaintenanceBillSchema.methods.calculatePenalty = function() {
  if (this.status === 'Paid' || !this.latePaymentConfig.isApplicable) {
    return 0;
  }
  
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  dueDate.setDate(dueDate.getDate() + this.latePaymentConfig.gracePeriodDays);
  
  if (today <= dueDate) {
    return 0;
  }
  
  const diffDays = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
  let penalty = 0;
  
  if (this.latePaymentConfig.chargeType === 'Fixed') {
    switch(this.latePaymentConfig.compoundingFrequency) {
      case 'Daily':
        penalty = diffDays * this.latePaymentConfig.chargeValue;
        break;
      case 'Weekly':
        penalty = Math.ceil(diffDays / 7) * this.latePaymentConfig.chargeValue;
        break;
      case 'Monthly':
        penalty = Math.ceil(diffDays / 30) * this.latePaymentConfig.chargeValue;
        break;
    }
  } else { // Percentage
    const baseForPenalty = this.baseAmount + this.gstDetails.totalGST;
    const percentagePerPeriod = this.latePaymentConfig.chargeValue;
    
    switch(this.latePaymentConfig.compoundingFrequency) {
      case 'Daily':
        penalty = baseForPenalty * Math.pow(1 + (percentagePerPeriod/100), diffDays) - baseForPenalty;
        break;
      case 'Weekly':
        const weeks = Math.ceil(diffDays / 7);
        penalty = baseForPenalty * Math.pow(1 + (percentagePerPeriod/100), weeks) - baseForPenalty;
        break;
      case 'Monthly':
        const months = Math.ceil(diffDays / 30);
        penalty = baseForPenalty * Math.pow(1 + (percentagePerPeriod/100), months) - baseForPenalty;
        break;
    }
  }
  
  return Math.round(penalty * 100) / 100; // Round to 2 decimal places
};

// Calculate total amount
MaintenanceBillSchema.methods.calculateTotalAmount = function() {
  const baseAmount = this.baseAmount || 0;
  const additionalChargesTotal = this.additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
  const gstTotal = this.gstDetails.totalGST || 0;
  const penalty = this.currentPenalty || 0;
  
  return baseAmount + additionalChargesTotal + gstTotal + penalty;
};

// Calculate remaining amount
MaintenanceBillSchema.methods.calculateRemainingAmount = function() {
  return this.calculateTotalAmount() - (this.amountPaid || 0);
};

// Pre-save middleware
MaintenanceBillSchema.pre('save', function(next) {
  // Update penalty
  if (this.status !== 'Paid') {
    this.currentPenalty = this.calculatePenalty();
    
    // Update status based on due date and payments
    const today = new Date();
    if (today > this.dueDate && this.status !== 'Partially Paid') {
      this.status = 'Overdue';
    }
    
    if (this.amountPaid > 0 && this.amountPaid < this.calculateTotalAmount()) {
      this.status = 'Partially Paid';
    }
  }
  
  // Update total and remaining amounts
  this.totalAmount = this.calculateTotalAmount();
  this.remainingAmount = this.calculateRemainingAmount();
  
  next();
});

// Virtual field for total due amount
MaintenanceBillSchema.virtual('totalDue').get(function() {
  return this.calculateRemainingAmount();
});

// Indexes for better query performance
MaintenanceBillSchema.index({ societyId: 1, billNumber: 1 }, { unique: true });
MaintenanceBillSchema.index({ societyId: 1, status: 1 });
MaintenanceBillSchema.index({ societyId: 1, dueDate: 1 });
MaintenanceBillSchema.index({ residentId: 1, status: 1 });

export default mongoose.models.MaintenanceBill || mongoose.model('MaintenanceBill', MaintenanceBillSchema);
