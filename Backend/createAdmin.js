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

    // Check if admin user already exists
    let adminUser = await User.findOne({ email: 'admin@hospital.com' });

    if (adminUser) {
      console.log('Admin user already exists. Updating password...');
      // Update password to ensure it matches admin123
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      adminUser.password = hashedPassword;
      await adminUser.save();
      console.log('Admin password updated successfully');
    } else {
      console.log('Creating new admin account...');

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
      }

      // Create admin user with bcrypt
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      adminUser = await User.create({
        email: 'admin@hospital.com',
        password: hashedPassword,
        role: 'admin',
        employeeId: adminEmployee._id
      });
      console.log('Created admin user account');
    }

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
