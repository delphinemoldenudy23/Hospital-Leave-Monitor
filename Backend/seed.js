require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Employee = require('./models/Employee');
const Department = require('./models/Department');

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital-leave-system');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    console.log('Cleared existing data');

    // Create departments
    const departments = await Department.create([
      { name: 'Emergency', description: 'Emergency Department' },
      { name: 'Surgery', description: 'Surgical Department' },
      { name: 'Pediatrics', description: 'Pediatric Department' },
      { name: 'Cardiology', description: 'Cardiology Department' },
      { name: 'Neurology', description: 'Neurology Department' },
      { name: 'Radiology', description: 'Radiology Department' },
      { name: 'Laboratory', description: 'Laboratory Services' },
      { name: 'Pharmacy', description: 'Pharmacy Department' },
      { name: 'Administration', description: 'Hospital Administration' },
      { name: 'Nursing', description: 'Nursing Services' }
    ]);
    console.log('Created departments');

    // Create general admin employee
    const generalAdminEmployee = await Employee.create({
      staffId: 'GA001',
      name: 'General Administrator',
      department: 'Administration',
      position: 'General Hospital Administrator',
      phoneNumber: '+1234567899',
      email: 'generaladmin@hospital.com'
    });
    console.log('Created general admin employee');

    // Create general admin user
    const salt = await bcrypt.genSalt(10);
    const generalAdminPassword = await bcrypt.hash('general123', salt);

    const generalAdminUser = await User.create({
      email: 'generaladmin@hospital.com',
      password: generalAdminPassword,
      role: 'generalAdmin',
      employeeId: generalAdminEmployee._id
    });
    console.log('Created general admin user');

    // Create admin employee
    const adminEmployee = await Employee.create({
      staffId: 'ADMIN001',
      name: 'System Administrator',
      department: 'Administration',
      position: 'Hospital Administrator',
      phoneNumber: '+1234567890',
      email: 'admin@hospital.com'
    });
    console.log('Created admin employee');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', salt);

    const adminUser = await User.create({
      email: 'admin@hospital.com',
      password: adminPassword,
      role: 'admin',
      employeeId: adminEmployee._id
    });
    console.log('Created admin user');

    // Create sample employees
    const sampleEmployees = await Employee.create([
      {
        staffId: 'EMP001',
        name: 'Dr. John Smith',
        department: 'Emergency',
        position: 'Senior Physician',
        phoneNumber: '+1234567891',
        email: 'john.smith@hospital.com'
      },
      {
        staffId: 'EMP002',
        name: 'Dr. Sarah Johnson',
        department: 'Surgery',
        position: 'Surgeon',
        phoneNumber: '+1234567892',
        email: 'sarah.johnson@hospital.com'
      },
      {
        staffId: 'EMP003',
        name: 'Dr. Michael Brown',
        department: 'Pediatrics',
        position: 'Pediatrician',
        phoneNumber: '+1234567893',
        email: 'michael.brown@hospital.com'
      },
      {
        staffId: 'EMP004',
        name: 'Dr. Emily Davis',
        department: 'Cardiology',
        position: 'Cardiologist',
        phoneNumber: '+1234567894',
        email: 'emily.davis@hospital.com'
      },
      {
        staffId: 'EMP005',
        name: 'Nurse Alice Wilson',
        department: 'Nursing',
        position: 'Registered Nurse',
        phoneNumber: '+1234567895',
        email: 'alice.wilson@hospital.com'
      }
    ]);
    console.log('Created sample employees');

    // Create user accounts for sample employees
    const employeePassword = await bcrypt.hash('employee123', salt);
    
    for (const employee of sampleEmployees) {
      await User.create({
        email: employee.email,
        password: employeePassword,
        role: 'employee',
        employeeId: employee._id
      });
    }
    console.log('Created user accounts for employees');

    console.log('\n=== Database seeded successfully ===');
    console.log('\nGeneral Admin credentials:');
    console.log('Email: generaladmin@hospital.com');
    console.log('Password: general123');
    console.log('\nAdmin credentials:');
    console.log('Email: admin@hospital.com');
    console.log('Password: admin123');
    console.log('\nEmployee credentials (for any employee):');
    console.log('Email: john.smith@hospital.com (or any employee email)');
    console.log('Password: employee123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
