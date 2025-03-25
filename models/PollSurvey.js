import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  id: String,
  text: String,
  votes: {
    type: Number,
    default: 0
  }
});

const questionSchema = new mongoose.Schema({
  id: String,
  questionText: String,
  questionType: {
    type: String,
    enum: ['multiple-choice', 'checkbox', 'text']
  },
  required: {
    type: Boolean,
    default: true
  },
  options: [optionSchema]
});

const participantSchema = new mongoose.Schema({
  userId: String,
  votedOption: String,
  answers: [{
    questionId: String,
    answer: mongoose.Schema.Types.Mixed
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

const pollSurveySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['poll', 'survey'],
    required: true
  },
  societyId: {
    type: String,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'ended'],
    default: 'active'
  },
  options: [optionSchema],
  questions: [questionSchema],
  participants: [participantSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add a pre-save middleware to update status based on endDate
pollSurveySchema.pre('save', function(next) {
  this.status = new Date(this.endDate) > new Date() ? 'active' : 'ended';
  next();
});

// Virtual property to get total votes/responses
pollSurveySchema.virtual('totalParticipants').get(function() {
  return this.participants.length;
});

// Ensure virtuals are included in JSON output
pollSurveySchema.set('toJSON', { virtuals: true });
pollSurveySchema.set('toObject', { virtuals: true });

export default mongoose.models.PollSurvey || mongoose.model('PollSurvey', pollSurveySchema);