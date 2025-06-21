import mongoose from 'mongoose';

const animalTagSchema = new mongoose.Schema({
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true
  },
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  animalType: {
    type: String,
    enum: ['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Other'],
    required: true
  },
  animalDetails: {
    name: {
      type: String,
      required: true
    },
    breed: String,
    color: String,
    age: Number,
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: true
    },
    identificationMark: String,
    vaccinated: {
      type: Boolean,
      default: false
    },
    lastVaccinationDate: Date,
    nextVaccinationDue: Date,
    medicalHistory: String
  },
  pinCode: {
    type: String,
    required: true,
    unique: true,
    length: 6
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  qrCode: {
    type: String // URL or base64 of QR code
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society'
  },
  approvedAt: Date,
  remarks: String,
  documents: [{
    type: {
      type: String,
      enum: ['Vaccination Certificate', 'Medical Record', 'License', 'Other']
    },
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Add index for faster queries
animalTagSchema.index({ residentId: 1, status: 1 });
animalTagSchema.index({ societyId: 1, status: 1 });

const AnimalTag = mongoose.models.AnimalTag || mongoose.model('AnimalTag', animalTagSchema);

export default AnimalTag; 