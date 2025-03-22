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

// Virtual field to calculate total due amount (bill + additional charges + penalties - paid amount)
MaintenanceBillSchema.virtual('totalDue').get(function () {
  const extraCharges = this.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
  return this.amount + extraCharges + this.penaltyAmount + this.currentPenalty - this.amountPaid;
});

const MaintenanceBill = mongoose.models.MaintenanceBill || mongoose.model('MaintenanceBill', MaintenanceBillSchema);
export default MaintenanceBill;
