import mongoose from 'mongoose';

const UtilityBillSchema = new mongoose.Schema({
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
    required: true 
  },
  flatNumber: { type: String, required: true },
  blockName: { type: String, required: true },
  floorNumber: { type: Number, required: true },
  residentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Resident', 
    required: true 
  },
  ownerName: { type: String, required: true },
  ownerMobile: { type: String, required: true },
  ownerEmail: {
    type: String,
    required: true
  },
  periodType: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'HalfYearly', 'Yearly'],
    required: true,
    default: 'Monthly'
  },
  
  // Bill calculation details
  baseAmount: { type: Number, required: true },
  unitUsage: { type: Number },
  perUnitRate: { type: Number },
  formula: { type: String },
  
  // Additional charges
  additionalCharges: [{
    chargeType: {
      type: String,
      enum: [
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
    },
    amount: { type: Number, required: true },
    ledgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ledger',
      required: true
    },
    description: String
  }],
  
  // GST details
  gstDetails: {
    isGSTApplicable: { type: Boolean, default: false },
    cgstPercentage: { type: Number, default: 0 },
    sgstPercentage: { type: Number, default: 0 },
    igstPercentage: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 }
  },
  
  // Late payment details
  latePaymentDetails: {
    isLatePaymentChargeApplicable: { type: Boolean, default: false },
    gracePeriodDays: { type: Number, default: 0 },
    chargeType: { type: String, enum: ['Fixed', 'Percentage'] },
    chargeValue: { type: Number, default: 0 },
    compoundingFrequency: { type: String, enum: ['Daily', 'Weekly', 'Monthly'] },
    lateFeeAmount: { type: Number, default: 0 }
  },
  
  // Bill amounts
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number },
  
  // Dates
  issueDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  paymentDate: { type: Date },
  
  // Status
  status: {
    type: String,
    enum: ['Pending', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Pending'
  },
  
  // Payment history
  paymentHistory: [{
    amount: Number,
    paymentDate: Date,
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Cheque', 'Bank Transfer', 'UPI', 'Wallet', 'Other']
    },
    transactionId: String,
    receiptNumber: String,
    notes: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Add maker information fields
    makerName: String,
    makerContact: String,
    makerEmail: String
  }],
  
  // Journal entries
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
  
  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Approval details
  approvedBy: {
    adminId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Society' 
    },
    adminName: { type: String },
    approvedAt: { type: Date }
  },
  
  // Scheduled bill reference (for auto-generated bills)
  scheduledBillReference: {
    scheduledBillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ScheduledBill'
    },
    scheduledBillTitle: { type: String },
    generatedAt: { type: Date }
  }
}, { 
  timestamps: true 
});
  
// Pre-save hook to calculate remaining amount
UtilityBillSchema.pre('save', function(next) {
  this.remainingAmount = this.totalAmount - this.paidAmount;
  next();
});

// Method to generate bill number
UtilityBillSchema.methods.generateBillNumber = async function(session) {
  const date = new Date();
  const prefix = 'UTL/' + date.getFullYear().toString().substr(-2) + 
    ('0' + (date.getMonth() + 1)).slice(-2) + '/';
  
  const lastBill = await this.constructor.findOne({
    societyId: this.societyId,
    billNumber: new RegExp('^' + prefix)
  }).sort({ billNumber: -1 }).session(session);
  
  let nextNumber = 1;
  if (lastBill) {
    const lastNumber = parseInt(lastBill.billNumber.split('/').pop());
    nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
  }
  
  const billNumber = prefix + ('000' + nextNumber).slice(-4);

  // Verify the generated number is unique
  const existingBill = await this.constructor.findOne({
    societyId: this.societyId,
    billNumber: billNumber
  }).session(session);

  if (existingBill) {
    // If duplicate found, recursively try next number
    this.billNumber = prefix + ('000' + (nextNumber + 1)).slice(-4);
    return this.generateBillNumber(session);
  }

  return billNumber;
};

// Method to calculate late payment charges
UtilityBillSchema.methods.calculateLateFee = function() {
  if (!this.latePaymentDetails.isLatePaymentChargeApplicable) return 0;
  
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  dueDate.setDate(dueDate.getDate() + this.latePaymentDetails.gracePeriodDays);
  
  if (today <= dueDate) return 0;
  
  const daysLate = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
  let lateFee = 0;
  
  if (this.latePaymentDetails.chargeType === 'Fixed') {
    lateFee = this.latePaymentDetails.chargeValue;
  } else {
    lateFee = (this.totalAmount * this.latePaymentDetails.chargeValue) / 100;
  }
  
  // Apply compounding if configured
  if (this.latePaymentDetails.compoundingFrequency !== 'Daily') {
    const periods = Math.floor(daysLate / 
      (this.latePaymentDetails.compoundingFrequency === 'Weekly' ? 7 : 30));
    lateFee *= Math.pow(1 + (this.latePaymentDetails.chargeValue / 100), periods);
  }
  
  return lateFee;
};

export default mongoose.models.UtilityBill || mongoose.model('UtilityBill', UtilityBillSchema);