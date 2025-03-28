import mongoose from 'mongoose';

const MaintenanceBillSchema = new mongoose.Schema({
  // References
  societyId: { type: String, required: true }, // Society ID
  flatNumber: { type: String, required: true }, // Flat number for easier querying/display
  blockName: { type: String, required: true }, // Block name
  floorNumber: { type: Number, required: true }, // Floor number
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident' }, // Resident reference

  // Owner details
  ownerName: { type: String, required: true }, // Owner's name
  ownerMobile: { type: String, required: true }, // Owner's mobile number
  ownerEmail: { type: String, required: true }, // Owner's email address

  // Bill Type
  billType: {
    type: String,
    required: true,
    enum: ['Security', 'Cleaning', 'Parking', 'Other'], // Added more bill types
  },

  // Bill details
  description: { type: String }, // Description of the bill
  amount: { type: Number, required: true }, // Bill base amount
  additionalCharges: [
    {
      description: String,
      amount: Number,
    },
  ], // Extra charges if any

  // Dates
  issueDate: { type: Date, default: Date.now }, // Date when the bill was issued
  dueDate: { type: Date, required: true }, // Due date for payment

  // Late payment and penalty
  finePerDay: { type: Number, default: 0 }, // Fine per day after the due date
  penaltyAmount: { type: Number, default: 0 }, // Fixed additional penalty if any
  currentPenalty: { type: Number, default: 0 }, // Accumulated late payment penalty

  // Payment details
  amountPaid: { type: Number, default: 0 }, // Amount paid so far
  remainingAmount: { type: Number }, // Remaining amount to be paid
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Paid', 'Overdue', 'Partially Paid'], // Bill status
    default: 'Pending',
  },
  paymentHistory: [
    {
      amount: Number,
      paymentDate: Date,
      paymentMethod: String,
      transactionId: String,
    },
  ],

}, { timestamps: true });

// Calculate penalty based on days overdue and fine per day
MaintenanceBillSchema.methods.calculatePenalty = function() {
  // If bill is already paid, no penalty
  if (this.status === 'Paid') {
    return 0;
  }
  
  // Calculate days overdue
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  
  // If not yet due, no penalty
  if (today <= dueDate) {
    return 0;
  }
  
  // Calculate days difference
  const diffTime = Math.abs(today - dueDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Calculate penalty amount
  const finePerDay = this.finePerDay || 50; // Default to 50 if not specified
  const penalty = diffDays * finePerDay;
  
  return penalty;
};

// Calculate total amount including base amount, additional charges, and penalty
MaintenanceBillSchema.methods.calculateTotalAmount = function() {
  const baseAmount = this.amount || 0;
  
  // Sum additional charges
  const additionalChargesTotal = this.additionalCharges.reduce((sum, charge) => {
    return sum + (charge.amount || 0);
  }, 0);
  
  // Add penalties
  const fixedPenalty = this.penaltyAmount || 0;
  const currentPenalty = this.currentPenalty || 0;
  
  return baseAmount + additionalChargesTotal + fixedPenalty + currentPenalty;
};

// Calculate remaining amount
MaintenanceBillSchema.methods.calculateRemainingAmount = function() {
  if (this.status === 'Paid') {
    return 0;
  }
  
  const totalAmount = this.calculateTotalAmount();
  return totalAmount - (this.amountPaid || 0);
};

// Pre-save hook to update remaining amount and penalty
MaintenanceBillSchema.pre('save', function(next) {
  // Update current penalty amount
  if (this.status !== 'Paid') {
    this.currentPenalty = this.calculatePenalty();
    
    // Update status to Overdue if past due date
    if (new Date() > new Date(this.dueDate)) {
      this.status = 'Overdue';
    }
    
    // If partially paid, ensure status reflects that
    if (this.amountPaid > 0 && this.amountPaid < this.calculateTotalAmount()) {
      this.status = 'Partially Paid';
    }
  }
  
  // Update remaining amount
  this.remainingAmount = this.calculateRemainingAmount();
  
  next();
});

// Virtual field to calculate total due amount (bill + additional charges + penalties - paid amount)
MaintenanceBillSchema.virtual('totalDue').get(function () {
  return this.calculateRemainingAmount();
});

const MaintenanceBill = mongoose.models.MaintenanceBill || mongoose.model('MaintenanceBill', MaintenanceBillSchema);
export default MaintenanceBill;
