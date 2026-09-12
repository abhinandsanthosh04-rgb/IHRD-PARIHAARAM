const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  college: {
    type: String,
    trim: true,
  },
  collegeCode: {
    type: String,
    trim: true,
  },
  course: {
    type: String,
    trim: true,
  },
  year: {
    type: Number,
  },
  registerNumber: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'central_admin'],
    default: 'student',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
