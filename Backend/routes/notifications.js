const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, sendLeaveReminders } = require('../controllers/notificationController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/', auth, getNotifications);
router.put('/:id/read', auth, markAsRead);
router.post('/send-reminders', adminAuth, sendLeaveReminders);

module.exports = router;
