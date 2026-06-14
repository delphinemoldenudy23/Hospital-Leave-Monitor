const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  leaveType: {
    type: String,
    enum: [
      'Annual Leave',
      'Sick Leave',
      'Maternity Leave',
      'Paternity Leave',
      'Bereavement Leave',
      'Unpaid Leave',
      'Other',
    ],
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    required: true, // Number of days
  },
  expectedReturnDate: {
    type: Date,
    required: true,
  },
  actualReturnDate: {
    type: Date,
    default: null,
  },
  reason: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'On Leave', 'Returned', 'Overdue', 'Cancelled'],
    default: 'Pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  approvalDate: {
    type: Date,
    default: null,
  },
  approvalNotes: {
    type: String,
    default: null,
  },
  reminders: {
    sevenDaysBefore: { type: Boolean, default: false },
    threeDaysBefore: { type: Boolean, default: false },
    onReturnDate: { type: Boolean, default: false },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
