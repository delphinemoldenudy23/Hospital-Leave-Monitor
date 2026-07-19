const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  adminApprovalPermission: {
    type: Boolean,
    default: true
  },
  securityPin: {
    type: String,
    default: '6969'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

systemSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
