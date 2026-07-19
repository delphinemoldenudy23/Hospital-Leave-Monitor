const express = require('express');
const router = express.Router();
const {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
} = require('../controllers/departmentController');
const { adminAuth } = require('../middleware/auth');

router.get('/', adminAuth, getAllDepartments);
router.get('/:id', adminAuth, getDepartmentById);
router.post('/', adminAuth, createDepartment);
router.put('/:id', adminAuth, updateDepartment);
router.delete('/:id', adminAuth, deleteDepartment);

module.exports = router;
