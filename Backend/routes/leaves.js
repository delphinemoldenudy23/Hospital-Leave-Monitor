const express = require('express');
const router = express.Router();
const {
  getAllLeaveRequests,
  getLeaveRequestById,
  getEmployeeLeaveRequests,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  markAsReturned,
  updateLeaveStatuses,
  softDeleteLeaveRequest,
  restoreLeaveRequest,
  permanentDeleteLeaveRequest,
  getDeletedLeaveRequests,
  resetEmployeeLeaves
} = require('../controllers/leaveController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/', adminAuth, getAllLeaveRequests);
router.get('/trash/all', adminAuth, getDeletedLeaveRequests);
router.get('/:id', auth, getLeaveRequestById);
router.get('/employee/my-leaves', auth, getEmployeeLeaveRequests);
router.post('/', auth, createLeaveRequest);
router.put('/:id/approve', adminAuth, approveLeaveRequest);
router.put('/:id/reject', adminAuth, rejectLeaveRequest);
router.put('/:id/return', auth, markAsReturned);
router.post('/update-statuses', updateLeaveStatuses);
router.delete('/:id', adminAuth, softDeleteLeaveRequest);
router.put('/:id/restore', adminAuth, restoreLeaveRequest);
router.delete('/:id/permanent', adminAuth, permanentDeleteLeaveRequest);
router.post('/reset-my-leaves', auth, resetEmployeeLeaves);

module.exports = router;
