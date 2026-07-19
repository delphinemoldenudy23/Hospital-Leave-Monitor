const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  leaveType: {
    type: String,
    required: true,
    enum: ['Annual Leave', 'Sick Leave', 'Maternity Leave', 'Paternity Leave', 'Bereavement Leave', 'Unpaid Leave', 'Annual', 'Sick', 'Maternity', 'Paternity', 'Emergency', 'Other']
  },
  startDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  expectedReturnDate: {
    type: Date,
    required: true
  },
  actualReturnDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'On Leave', 'Returned', 'Overdue'],
    default: 'Pending'
  },
  reason: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

leaveRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add indexes for common queries - optimized for performance
leaveRequestSchema.index({ employeeId: 1, isDeleted: 1 });
leaveRequestSchema.index({ status: 1, isDeleted: 1 });
leaveRequestSchema.index({ createdAt: -1, isDeleted: 1 });
leaveRequestSchema.index({ expectedReturnDate: 1, isDeleted: 1 });
leaveRequestSchema.index({ status: 1, expectedReturnDate: 1, isDeleted: 1 });
leaveRequestSchema.index({ isDeleted: 1, createdAt: -1 });
leaveRequestSchema.index({ leaveType: 1, isDeleted: 1 });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);