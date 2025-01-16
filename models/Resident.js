import mongoose from 'mongoose';

const residentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true }, // Primary phone number, must be unique
  additionalNumbers: {
    type: [String], // Array of strings for additional phone numbers
    validate: {
      validator: function (v) {
        // Validator to ensure each number starts with "+91" and is 13 characters long
        return v.every(num => /^\+91\d{10}$/.test(num));
      },
      message: props => `Invalid phone number(s) in additionalNumbers: ${props.value}`,
    },
  },
  email: { type: String, required: true },
  address: { type: String, required: true },
  unitNumber: { type: String, required: true },
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  societyCode: { type: String, required: true },
  societyName: { type: String, required: true },
  residentId: {
    type: String,
    unique: true, // Ensure this field is unique
    default: function () {
      return `R-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // Generate a unique residentId
    },
  },
  tenants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' }], // Array of tenant references
});

const Resident = mongoose.models.Resident || mongoose.model('Resident', residentSchema);

export default Resident;
