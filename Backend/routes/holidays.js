const express = require('express');
const router = express.Router();
const {
  getAllHolidays,
  getHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday
} = require('../controllers/holidayController');
const { auth, generalAdminAuth } = require('../middleware/auth');

router.get('/', auth, getAllHolidays);
router.get('/:id', auth, getHolidayById);
router.post('/', generalAdminAuth, createHoliday);
router.put('/:id', generalAdminAuth, updateHoliday);
router.delete('/:id', generalAdminAuth, deleteHoliday);

module.exports = router;
