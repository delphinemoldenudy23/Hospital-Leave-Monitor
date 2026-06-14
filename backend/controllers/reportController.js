const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const moment = require('moment');

// Current leave report
exports.getCurrentLeaveReport = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentLeaves = await LeaveRequest.find({
      status: 'On Leave',
      startDate: { $lte: today },
      endDate: { $gte: today },
    })
      .populate('employee')
      .sort({ expectedReturnDate: 1 });

    res.json({
      reportType: 'Current Leave Report',
      generatedAt: new Date(),
      data: currentLeaves,
      totalCount: currentLeaves.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Overdue report
exports.getOverdueReport = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueLeaves = await LeaveRequest.find({
      status: 'On Leave',
      expectedReturnDate: { $lt: today },
    })
      .populate('employee')
      .sort({ expectedReturnDate: 1 });

    res.json({
      reportType: 'Overdue Employee Report',
      generatedAt: new Date(),
      data: overdueLeaves,
      totalCount: overdueLeaves.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Department leave report
exports.getDepartmentLeaveReport = async (req, res) => {
  try {
    const { departmentId } = req.query;

    let query = { status: { $in: ['On Leave', 'Returned', 'Overdue'] } };

    const leavesByDepartment = await LeaveRequest.aggregate([
      { $match: query },
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
          leaves: { $push: '$$ROOT' },
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

    res.json({
      reportType: 'Department Leave Report',
      generatedAt: new Date(),
      data: leavesByDepartment,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Monthly statistics
exports.getMonthlyStatistics = async (req, res) => {
  try {
    const { month, year } = req.query;

    const startOfMonth = moment(`${year}-${month}`, 'YYYY-MM').startOf('month').toDate();
    const endOfMonth = moment(`${year}-${month}`, 'YYYY-MM').endOf('month').toDate();

    const monthlyLeaves = await LeaveRequest.find({
      startDate: { $gte: startOfMonth, $lte: endOfMonth },
    })
      .populate('employee')
      .sort({ startDate: 1 });

    const statistics = {
      totalLeaves: monthlyLeaves.length,
      byType: {},
      byDepartment: {},
      byStatus: {},
    };

    monthlyLeaves.forEach(leave => {
      // By type
      statistics.byType[leave.leaveType] = (statistics.byType[leave.leaveType] || 0) + 1;
      // By status
      statistics.byStatus[leave.status] = (statistics.byStatus[leave.status] || 0) + 1;
    });

    res.json({
      reportType: 'Monthly Statistics',
      month,
      year,
      generatedAt: new Date(),
      statistics,
      data: monthlyLeaves,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
