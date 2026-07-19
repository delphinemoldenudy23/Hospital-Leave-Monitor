const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const { differenceInDays, addDays, startOfMonth, endOfMonth } = require('date-fns');

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Run all count queries in parallel - filter out soft-deleted records
    const [
      totalEmployees,
      onLeave,
      pending,
      returningSoon,
      dueBackToday,
      overdue,
      employees,
      leaveRequests,
      allLeaves,
      recentLeaves
    ] = await Promise.all([
      Employee.countDocuments(),
      LeaveRequest.countDocuments({ status: { $in: ['On Leave', 'Approved'] }, isDeleted: false }),
      LeaveRequest.countDocuments({ status: 'Pending', isDeleted: false }),
      LeaveRequest.countDocuments({
        status: { $in: ['Approved', 'On Leave'] },
        expectedReturnDate: { $gte: today, $lte: nextWeek },
        isDeleted: false
      }),
      LeaveRequest.countDocuments({
        status: { $in: ['Approved', 'On Leave'] },
        expectedReturnDate: { $gte: todayStart, $lt: todayEnd },
        isDeleted: false
      }),
      LeaveRequest.countDocuments({ status: 'Overdue', isDeleted: false }),
      Employee.find().select('department'),
      LeaveRequest.find({ status: { $in: ['On Leave', 'Approved'] }, isDeleted: false }).select('employeeId'),
      LeaveRequest.find({ isDeleted: false }).select('leaveType'),
      LeaveRequest.find({ isDeleted: false })
        .populate('employeeId', 'name department')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    // Calculate department stats in memory - optimized with Map
    const departmentStats = {};
    const employeeMap = new Map(employees.map(e => [e._id.toString(), e]));
    
    for (const emp of employees) {
      const dept = emp.department;
      if (!departmentStats[dept]) {
        departmentStats[dept] = { total: 0, onLeave: 0 };
      }
      departmentStats[dept].total++;
    }

    for (const leave of leaveRequests) {
      const emp = employeeMap.get(leave.employeeId.toString());
      if (emp) {
        const dept = emp.department;
        if (departmentStats[dept]) {
          departmentStats[dept].onLeave++;
        }
      }
    }

    // Calculate leave by type in memory - optimized
    const leaveByTypeMap = new Map();
    for (const leave of allLeaves) {
      const type = leave.leaveType;
      leaveByTypeMap.set(type, (leaveByTypeMap.get(type) || 0) + 1);
    }
    const leaveByTypeArray = Array.from(leaveByTypeMap.entries()).map(([key, value]) => ({
      _id: key,
      count: value
    }));

    // Monthly statistics - use aggregation for better performance
    const monthlyStatsAgg = await LeaveRequest.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(today.getFullYear(), today.getMonth() - 5, 1)
          },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthNum = date.getMonth() + 1;
      const year = date.getFullYear();

      const found = monthlyStatsAgg.find(
        m => m._id.year === year && m._id.month === monthNum
      );

      monthlyStats.push({
        _id: date.toLocaleString('default', { month: 'short' }),
        count: found ? found.count : 0
      });
    }

    res.json({
      totalEmployees,
      onLeave,
      pending,
      returningSoon,
      dueBackToday,
      overdue,
      departmentStats,
      leaveByType: leaveByTypeArray,
      monthlyStats,
      recentLeaves
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getCurrentLeaveReport = async (req, res) => {
  try {
    // Use lean() for better performance
    const leaveRequests = await LeaveRequest.find({
      status: { $in: ['On Leave', 'Approved'] },
      isDeleted: false
    })
    .populate('employeeId')
    .sort({ expectedReturnDate: 1 })
    .lean();

    res.json(leaveRequests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getOverdueReport = async (req, res) => {
  try {
    // Use lean() for better performance
    const overdueLeaves = await LeaveRequest.find({
      status: 'Overdue',
      isDeleted: false
    })
    .populate('employeeId')
    .sort({ expectedReturnDate: 1 })
    .lean();

    res.json(overdueLeaves);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getDepartmentReport = async (req, res) => {
  try {
    const { department } = req.params;
    
    // Use lean() for better performance
    const employees = await Employee.find({ department }).lean();
    const employeeIds = employees.map(e => e._id);

    const leaveRequests = await LeaveRequest.find({
      employeeId: { $in: employeeIds },
      isDeleted: false
    })
    .populate('employeeId')
    .sort({ createdAt: -1 })
    .lean();

    res.json({
      department,
      totalEmployees: employees.length,
      leaveRequests
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMonthlyStatistics = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    const leaveRequests = await LeaveRequest.find({
      createdAt: { $gte: startDate, $lte: endDate },
      isDeleted: false
    })
    .populate('employeeId');

    const stats = {
      total: leaveRequests.length,
      approved: leaveRequests.filter(l => l.status === 'Approved').length,
      rejected: leaveRequests.filter(l => l.status === 'Rejected').length,
      pending: leaveRequests.filter(l => l.status === 'Pending').length,
      byType: {}
    };

    for (const leave of leaveRequests) {
      const type = leave.leaveType;
      if (!stats.byType[type]) {
        stats.byType[type] = 0;
      }
      stats.byType[type]++;
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const resetSystemStats = async (req, res) => {
  try {
    const { confirm } = req.body;
    
    // Require explicit confirmation
    if (confirm !== 'RESET_CONFIRMED') {
      return res.status(400).json({ 
        message: 'Confirmation required. Please send confirm: "RESET_CONFIRMED" to proceed.' 
      });
    }

    const now = new Date();
    const adminId = req.user._id;

    // Soft delete all leave requests (preserves data but clears from active stats)
    const leaveDeleteResult = await LeaveRequest.updateMany(
      { isDeleted: false },
      {
        isDeleted: true,
        deletedAt: now,
        deletedBy: adminId
      }
    );

    res.json({
      message: 'System statistics reset successfully',
      details: {
        leaveRequestsSoftDeleted: leaveDeleteResult.modifiedCount,
        resetAt: now,
        resetBy: adminId,
        note: 'All leave requests have been soft deleted. Employees, departments, holidays, and system settings remain intact.'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getCurrentLeaveReport,
  getOverdueReport,
  getDepartmentReport,
  getMonthlyStatistics,
  resetSystemStats
};
