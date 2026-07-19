const express = require('express');
const router = express.Router();
const {
  getSystemSettings,
  getApprovalPermission,
  updateAdminApprovalPermission,
  validatePin,
  updateSecurityPin
} = require('../controllers/systemSettingsController');
const { generalAdminAuth, auth } = require('../middleware/auth');

router.get('/', generalAdminAuth, getSystemSettings);
router.get('/approval-permission', auth, getApprovalPermission);
router.put('/approval-permission', generalAdminAuth, updateAdminApprovalPermission);
router.post('/validate-pin', auth, validatePin);
router.put('/security-pin', generalAdminAuth, updateSecurityPin);

module.exports = router;
