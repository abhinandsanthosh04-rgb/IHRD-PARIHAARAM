const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    message: { type: String, required: true },
    updatedBy: { type: String, default: 'System' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    college: {
      type: String,
      required: true,
    },
    collegeCode: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Infrastructure',
        'Classroom',
        'Laboratory',
        'Electrical',
        'Internet / Wi-Fi',
        'Washroom / Sanitation',
        'Hostel',
        'Library',
        'Transport',
        'Academic',
        'Administrative',
        'Other',
      ],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected', 'Reopened'],
      default: 'Submitted',
    },
    assignedTo: {
      type: String,
      default: '',
    },
    resolution: {
      type: String,
      default: '',
    },
    history: [historySchema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Complaint', complaintSchema);
