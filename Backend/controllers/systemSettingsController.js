const SystemSettings = require('../models/SystemSettings');

const getSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    // Don't send the PIN in the response for security
    const { securityPin, ...settingsWithoutPin } = settings.toObject();
    res.json(settingsWithoutPin);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getApprovalPermission = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    // Only return the approval permission status
    res.json({ adminApprovalPermission: settings.adminApprovalPermission });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateAdminApprovalPermission = async (req, res) => {
  try {
    const { adminApprovalPermission } = req.body;

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings();
    }

    settings.adminApprovalPermission = adminApprovalPermission;
    settings.updatedBy = req.user._id;
    await settings.save();

    const { securityPin, ...settingsWithoutPin } = settings.toObject();
    res.json(settingsWithoutPin);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const validatePin = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ message: 'PIN is required' });
    }

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }

    if (settings.securityPin !== pin) {
      return res.status(401).json({ message: 'Invalid PIN' });
    }

    res.json({ valid: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateSecurityPin = async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;

    if (!currentPin || !newPin) {
      return res.status(400).json({ message: 'Current PIN and new PIN are required' });
    }

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }

    if (settings.securityPin !== currentPin) {
      return res.status(401).json({ message: 'Current PIN is incorrect' });
    }

    settings.securityPin = newPin;
    settings.updatedBy = req.user._id;
    await settings.save();

    const { securityPin, ...settingsWithoutPin } = settings.toObject();
    res.json({ message: 'PIN updated successfully', settings: settingsWithoutPin });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getSystemSettings,
  getApprovalPermission,
  updateAdminApprovalPermission,
  validatePin,
  updateSecurityPin
};
