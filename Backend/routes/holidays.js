const express = require('express');
const router = express.Router();
const {
  getAllHolidays,
  getHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday
} = require('../controllers/holidayController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/', auth, getAllHolidays);
router.get('/:id', auth, getHolidayById);
router.post('/', adminAuth, createHoliday);
router.put('/:id', adminAuth, updateHoliday);
router.delete('/:id', adminAuth, deleteHoliday);

module.exports = router;
