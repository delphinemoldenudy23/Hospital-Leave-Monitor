const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');
const Department = require('../models/Department');
const moment = require('moment');

// Admin Dashboard
exports.getAdminDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total employees
    const totalEmployees = await Employee.countDocuments({ isActive: true });

    // Employees on leave
    const employeesOnLeave = await LeaveRequest.countDocuments({
      status: 'On Leave',
      startDate: { $lte: today },
      endDate: { $gte: today },
    });

    // Employees returning soon (next 7 days)
    const sevenDaysFromNow = moment().add(7, 'days').toDate();
    const returningWithin7Days = await LeaveRequest.countDocuments({
      status: 'On Leave',
      expectedReturnDate: { $gte: today, $lte: sevenDaysFromNow },
    });

    // Overdue employees
    const overdueEmployees = await LeaveRequest.countDocuments({
      status: 'On Leave',
      expectedReturnDate: { $lt: today },
    });

    // Recent leaves
    const recentLeaves = await LeaveRequest.find()
      .populate('employee')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalEmployees,
      employeesOnLeave,
      returningWithin7Days,
      overdueEmployees,
      recentLeaves,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Employee Dashboard
exports.getEmployeeDashboard = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Current leave
    const currentLeave = await LeaveRequest.findOne({
      employee: employee._id,
      status: 'On Leave',
    });

    // Upcoming leaves
    const upcomingLeaves = await LeaveRequest.find({
      employee: employee._id,
      status: { $in: ['Pending', 'Approved'] },
      startDate: { $gte: new Date() },
    }).sort({ startDate: 1 });

    // Leave history
    const leaveHistory = await LeaveRequest.find({
      employee: employee._id,
      status: { $in: ['Returned', 'Cancelled'] },
    })
      .sort({ startDate: -1 })
      .limit(10);

    res.json({
      currentLeave,
      upcomingLeaves,
      leaveHistory,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Statistics
exports.getStatistics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Leave by type
    const leaveByType = await LeaveRequest.aggregate([
      { $group: { _id: '$leaveType', count: { $sum: 1 } } },
    ]);

    // Leave by department
    const leaveByDepartment = await LeaveRequest.aggregate([
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeData',
        },
      },
      { $unwind: '$employeeData' },
      {
        $group: {
          _id: '$employeeData.department',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'departmentData',
        },
      },
    ]);

    // Monthly statistics
    const monthlyStats = await LeaveRequest.aggregate([
      {
        $match: {
          startDate: {
            $gte: moment().subtract(12, 'months').toDate(),
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$startDate' },
            year: { $year: '$startDate' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      leaveByType,
      leaveByDepartment,
      monthlyStats,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
