const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, notificationController.getNotifications);
router.post('/send-reminders', authenticate, authorize('admin'), notificationController.sendReminders);
router.post('/send-manual', authenticate, authorize('admin'), notificationController.sendManualNotification);

module.exports = router;
