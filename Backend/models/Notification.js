const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  type: {
    type: String,
    enum: ['Leave Reminder', 'Return Reminder', 'Overdue Alert', 'Leave Approved', 'Leave Rejected'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  leaveRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeaveRequest'
  },
  sentVia: {
    type: [String],
    enum: ['Email', 'SMS', 'In-App'],
    default: ['In-App']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
