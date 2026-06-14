const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/current-leave', authenticate, authorize('admin'), reportController.getCurrentLeaveReport);
router.get('/overdue', authenticate, authorize('admin'), reportController.getOverdueReport);
router.get('/department', authenticate, authorize('admin'), reportController.getDepartmentLeaveReport);
router.get('/monthly', authenticate, authorize('admin'), reportController.getMonthlyStatistics);

module.exports = router;
