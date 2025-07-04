import mongoose from 'mongoose';

const PaymentEntrySchema = new mongoose.Schema({
  societyId: {
    type: String,
    required: true,
    index: true
  },
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true
  },
  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResidentBill',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentMode: {
    type: String,
    enum: ['UPI', 'Card', 'NetBanking', 'Cash', 'Cheque', 'NEFT', 'RTGS', 'Other'],
    required: true
  },
  transactionId: String,
  referenceNumber: String,
  
  // Bank/Payment Details
  bankDetails: {
    accountNumber: String,
    bankName: String,
    branchName: String,
    ifscCode: String,
    chequeNumber: String,
    chequeDate: Date,
    upiId: String,
    cardLast4: String
  },
  
  // Payment Status and Workflow
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending'
  },
  
  // Maker-Checker Workflow
  maker: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    remarks: String
  },
  checker: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date,
    remarks: String,
    action: {
      type: String,
      enum: ['Approved', 'Rejected']
    }
  },
  
  // Voucher Reference
  voucherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JournalVoucher'
  },
  
  // Bill Details (for quick access)
  billDetails: {
    billNumber: String,
    billAmount: Number,
    billHeadCode: String,
    billHeadName: String
  },
  
  // Resident Details (for quick access)
  residentDetails: {
    name: String,
    phone: String,
    email: String,
    flatNumber: String
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
PaymentEntrySchema.index({ societyId: 1, status: 1 });
PaymentEntrySchema.index({ societyId: 1, billId: 1 });
PaymentEntrySchema.index({ societyId: 1, paymentDate: -1 });
PaymentEntrySchema.index({ transactionId: 1 }, { sparse: true });

// Pre-save middleware to validate amount
PaymentEntrySchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('amount')) {
    try {
      const ResidentBill = mongoose.model('ResidentBill');
      const bill = await ResidentBill.findById(this.billId);
      
      if (!bill) {
        throw new Error('Bill not found');
      }
      
      const totalDue = bill.amount + (bill.penaltyAmount || 0) - (bill.paidAmount || 0);
      if (this.amount > totalDue) {
        throw new Error('Payment amount cannot exceed pending amount');
      }
    } catch (error) {
      next(error);
      return;
    }
  }
  next();
});

// Instance method to process approval
PaymentEntrySchema.methods.processApproval = async function(userId, action, remarks) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Update checker details
    this.checker = {
      userId,
      timestamp: new Date(),
      remarks,
      action
    };
    
    this.status = action;
    
    if (action === 'Approved') {
      // Update bill status
      const ResidentBill = mongoose.model('ResidentBill');
      const bill = await ResidentBill.findById(this.billId).session(session);
      
      if (!bill) {
        throw new Error('Bill not found');
      }
      
      bill.paidAmount = (bill.paidAmount || 0) + this.amount;
      await bill.save({ session });
      
      // Create journal voucher
      const JournalVoucher = mongoose.model('JournalVoucher');
      const voucher = await JournalVoucher.create([{
        societyId: this.societyId,
        voucherNo: await this.generateVoucherNumber(),
        voucherType: 'Receipt',
        voucherDate: this.paymentDate,
        entries: [
          {
            ledgerId: await this.getBankLedgerId(),
            type: 'Debit',
            amount: this.amount
          },
          {
            ledgerId: await this.getBillHeadLedgerId(),
            type: 'Credit',
            amount: this.amount
          }
        ],
        narration: `Payment received for bill ${this.billDetails.billNumber}`,
        status: 'Posted',
        createdBy: userId
      }], { session });
      
      this.voucherId = voucher[0]._id;
    }
    
    await this.save({ session });
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Helper method to generate voucher number
PaymentEntrySchema.methods.generateVoucherNumber = async function() {
  const JournalVoucher = mongoose.model('JournalVoucher');
  const date = new Date();
  const prefix = 'RCP/' + date.getFullYear().toString().substr(-2) + 
    ('0' + (date.getMonth() + 1)).slice(-2) + '/';
  
  const lastVoucher = await JournalVoucher.findOne({
    societyId: this.societyId,
    voucherNo: new RegExp('^' + prefix)
  }).sort({ voucherNo: -1 });
  
  let nextNumber = 1;
  if (lastVoucher) {
    const lastNumber = parseInt(lastVoucher.voucherNo.split('/').pop());
    nextNumber = lastNumber + 1;
  }
  
  return prefix + ('000' + nextNumber).slice(-4);
};

// Helper method to get bank ledger id based on payment mode
PaymentEntrySchema.methods.getBankLedgerId = async function() {
  const Ledger = mongoose.model('Ledger');
  let query = {
    societyId: this.societyId,
    category: 'Bank',
    status: 'Active'
  };
  
  // Add specific conditions based on payment mode
  if (this.paymentMode === 'Cash') {
    query.category = 'Cash';
  }
  
  const ledger = await Ledger.findOne(query);
  if (!ledger) {
    throw new Error('Bank/Cash ledger not found');
  }
  
  return ledger._id;
};

// Helper method to get bill head ledger id
PaymentEntrySchema.methods.getBillHeadLedgerId = async function() {
  const BillHead = mongoose.model('BillHead');
  const billHead = await BillHead.findById(this.billDetails.billHeadId);
  if (!billHead) {
    throw new Error('Bill head not found');
  }
  return billHead.ledgerId;
};

export default mongoose.models.PaymentEntry || mongoose.model('PaymentEntry', PaymentEntrySchema); 