const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/admin', authenticate, authorize('admin'), dashboardController.getAdminDashboard);
router.get('/employee', authenticate, dashboardController.getEmployeeDashboard);
router.get('/statistics', authenticate, authorize('admin'), dashboardController.getStatistics);

module.exports = router;
