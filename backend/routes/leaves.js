const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, leaveController.getAllLeaves);
router.get('/:id', authenticate, leaveController.getLeaveById);
router.post('/', authenticate, leaveController.createLeave);
router.put('/:id', authenticate, leaveController.updateLeave);
router.put('/:id/approve', authenticate, authorize('admin'), leaveController.approveLeave);
router.put('/:id/return', authenticate, leaveController.markAsReturned);
router.delete('/:id', authenticate, authorize('admin'), leaveController.cancelLeave);
router.get('/employee/:employeeId', authenticate, leaveController.getEmployeeLeaves);

module.exports = router;
