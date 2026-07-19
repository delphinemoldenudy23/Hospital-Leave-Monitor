const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getCurrentLeaveReport,
  getOverdueReport,
  getDepartmentReport,
  getMonthlyStatistics,
  resetSystemStats
} = require('../controllers/reportController');
const { getLeaveAnalytics } = require('../controllers/analyticsController');
const { adminAuth } = require('../middleware/auth');

router.get('/dashboard-stats', adminAuth, getDashboardStats);
router.get('/current-leave', adminAuth, getCurrentLeaveReport);
router.get('/overdue', adminAuth, getOverdueReport);
router.get('/department/:department', adminAuth, getDepartmentReport);
router.get('/monthly-statistics', adminAuth, getMonthlyStatistics);
router.get('/analytics', adminAuth, getLeaveAnalytics);
router.post('/reset-stats', adminAuth, resetSystemStats);

module.exports = router;
