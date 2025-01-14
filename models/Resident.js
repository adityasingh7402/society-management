import mongoose from 'mongoose';

const residentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // Ensure the email is unique
  address: { type: String, required: true },
  unitNumber: { type: String, required: true },
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  societyName: { type: String, required: true },
  residentId: { 
    type: String, 
    unique: true, // Ensure this field is unique
    default: function() {
      return `R-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // Generate a unique residentId
    }
  }
});

const Resident = mongoose.models.Resident || mongoose.model('Resident', residentSchema);

export default Resident;
