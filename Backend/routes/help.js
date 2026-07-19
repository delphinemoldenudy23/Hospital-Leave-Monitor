const express = require('express');
const router = express.Router();
const {
  createHelpRequest,
  getAllHelpRequests,
  getHelpRequestById,
  getEmployeeHelpRequests,
  replyToHelpRequest,
  updateHelpRequestStatus,
  softDeleteHelpRequest,
  restoreHelpRequest,
  permanentDeleteHelpRequest,
  getDeletedHelpRequests
} = require('../controllers/helpController');
const { auth, adminAuth } = require('../middleware/auth');

router.post('/', auth, createHelpRequest);
router.get('/', adminAuth, getAllHelpRequests);
router.get('/:id', auth, getHelpRequestById);
router.get('/employee/my-requests', auth, getEmployeeHelpRequests);
router.put('/:id/reply', adminAuth, replyToHelpRequest);
router.put('/:id/status', adminAuth, updateHelpRequestStatus);
router.delete('/:id', adminAuth, softDeleteHelpRequest);
router.put('/:id/restore', adminAuth, restoreHelpRequest);
router.delete('/:id/permanent', adminAuth, permanentDeleteHelpRequest);
router.get('/trash/all', adminAuth, getDeletedHelpRequests);

module.exports = router;
