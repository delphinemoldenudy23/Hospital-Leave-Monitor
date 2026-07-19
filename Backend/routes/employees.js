const express = require('express');
const router = express.Router();
const { getAllEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee, uploadProfilePicture, upload } = require('../controllers/employeeController');
const { adminAuth, auth } = require('../middleware/auth');

router.get('/', adminAuth, getAllEmployees);
router.get('/:id', adminAuth, getEmployeeById);
router.post('/', adminAuth, createEmployee);
router.put('/:id', adminAuth, updateEmployee);
router.delete('/:id', adminAuth, deleteEmployee);
router.post('/:id/profile-picture', auth, upload.single('profilePicture'), uploadProfilePicture);

module.exports = router;
