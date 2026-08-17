require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user');
const Employee = require('./models/Employee');

const createAdminAccount = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital-leave-system');
    console.log('Connected to MongoDB');

    // Delete existing admin user if exists to ensure clean state
    await User.deleteOne({ email: 'admin@hospital.com' });
    console.log('Cleared existing admin user if present');

    // Check if admin employee exists
    let adminEmployee = await Employee.findOne({ staffId: 'ADMIN001' });

    if (!adminEmployee) {
      adminEmployee = await Employee.create({
        staffId: 'ADMIN001',
        name: 'System Administrator',
        department: 'Administration',
        position: 'Hospital Administrator',
        phoneNumber: '+1234567890',
        email: 'admin@hospital.com'
      });
      console.log('Created admin employee record');
    } else {
      console.log('Admin employee record already exists');
    }

    // Create admin user with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const adminUser = await User.create({
      email: 'admin@hospital.com',
      password: hashedPassword,
      role: 'admin',
      employeeId: adminEmployee._id
    });
    console.log('Created admin user account with bcrypt-hashed password');

    console.log('\n=== Admin account ready ===');
    console.log('Email: admin@hospital.com');
    console.log('Password: admin123');
    console.log('Role: admin');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin account:', error);
    process.exit(1);
  }
};

createAdminAccount();
