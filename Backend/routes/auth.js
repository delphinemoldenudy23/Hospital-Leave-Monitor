const express = require('express');
const router = express.Router();
const { register, login, getMe, getAllAdmins, createAdmin, updateAdminRole, deleteAdmin, uploadProfilePicture, upload, changePassword } = require('../controllers/authController');
const { auth, generalAdminAuth } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);
router.get('/admins', generalAdminAuth, getAllAdmins);
router.post('/admins', generalAdminAuth, createAdmin);
router.put('/admins/:id/role', generalAdminAuth, updateAdminRole);
router.delete('/admins/:id', generalAdminAuth, deleteAdmin);
router.post('/profile-picture', auth, upload.single('profilePicture'), uploadProfilePicture);
router.post('/change-password', auth, changePassword);

module.exports = router;
