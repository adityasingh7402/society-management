import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
  },
  image: {
    type: [String], // Change to array of strings
    default: [], // Default empty array if no images
  },
  date: {
    type: String,
    required: [true, 'Please provide a date'],
  },
  time: {
    type: String,
    required: [true, 'Please provide a time'],
  },
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: [true, 'Please provide society ID'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);