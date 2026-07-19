const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const { startOfMonth, endOfMonth, startOfYear, endOfYear, subYears, format } = require('date-fns');

const getLeaveAnalytics = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const previousYear = currentYear - 1;

    // Use aggregation for monthly trends - much faster than loading all data
    const monthlyTrendsAgg = await LeaveRequest.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: {
            $gte: startOfYear(new Date(currentYear, 0, 1)),
            $lte: endOfYear(new Date(currentYear, 11, 31))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Previous year monthly trends for comparison
    const previousYearTrendsAgg = await LeaveRequest.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: {
            $gte: startOfYear(new Date(previousYear, 0, 1)),
            $lte: endOfYear(new Date(previousYear, 11, 31))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Build monthly trends array
    const monthlyTrends = [];
    for (let month = 0; month < 12; month++) {
      const monthNum = month + 1;
      const currentMonthData = monthlyTrendsAgg.find(m => m._id.month === monthNum);
      const previousMonthData = previousYearTrendsAgg.find(m => m._id.month === monthNum);

      monthlyTrends.push({
        month: format(new Date(currentYear, month), 'MMM'),
        currentYear: currentMonthData?.total || 0,
        previousYear: previousMonthData?.total || 0,
        approved: currentMonthData?.approved || 0,
        rejected: currentMonthData?.rejected || 0,
        pending: currentMonthData?.pending || 0
      });
    }

    // Find peak and low periods
    const peakMonth = monthlyTrends.reduce((max, month) => 
      month.currentYear > max.currentYear ? month : max, monthlyTrends[0]);
    const lowMonth = monthlyTrends.reduce((min, month) => 
      month.currentYear < min.currentYear ? month : min, monthlyTrends[0]);

    // Leave type distribution using aggregation
    const leaveTypeAgg = await LeaveRequest.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: {
            $gte: startOfYear(new Date(currentYear, 0, 1)),
            $lte: endOfYear(new Date(currentYear, 11, 31))
          }
        }
      },
      {
        $group: {
          _id: '$leaveType',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRequests = leaveTypeAgg.reduce((sum, item) => sum + item.count, 0);
    const leaveTypeData = leaveTypeAgg.map(item => ({
      name: item._id || 'Other',
      value: item.count,
      percentage: totalRequests > 0 ? ((item.count / totalRequests) * 100).toFixed(1) : '0'
    }));

    // Department-wise trends using aggregation with lookup
    const departmentTrendsAgg = await LeaveRequest.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: {
            $gte: startOfYear(new Date(currentYear, 0, 1)),
            $lte: endOfYear(new Date(currentYear, 11, 31))
          }
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      {
        $unwind: '$employee'
      },
      {
        $group: {
          _id: '$employee.department',
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } }
        }
      }
    ]);

    const departmentData = departmentTrendsAgg.map(item => ({
      name: item._id || 'Unknown',
      total: item.total,
      approved: item.approved,
      rejected: item.rejected,
      pending: item.pending,
      approvalRate: item.total > 0 ? ((item.approved / item.total) * 100).toFixed(1) : '0'
    }));

    // Approval rates using aggregation
    const approvalAgg = await LeaveRequest.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: {
            $gte: startOfYear(new Date(currentYear, 0, 1)),
            $lte: endOfYear(new Date(currentYear, 11, 31))
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } }
        }
      }
    ]);

    const stats = approvalAgg[0] || { total: 0, approved: 0, rejected: 0, pending: 0 };
    const approvalRates = {
      approved: stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : '0',
      rejected: stats.total > 0 ? ((stats.rejected / stats.total) * 100).toFixed(1) : '0',
      pending: stats.total > 0 ? ((stats.pending / stats.total) * 100).toFixed(1) : '0'
    };

    // Top employees using aggregation
    const topEmployeesAgg = await LeaveRequest.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: {
            $gte: startOfYear(new Date(currentYear, 0, 1)),
            $lte: endOfYear(new Date(currentYear, 11, 31))
          }
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      {
        $unwind: '$employee'
      },
      {
        $group: {
          _id: '$employeeId',
          name: { $first: '$employee.name' },
          department: { $first: '$employee.department' },
          totalLeaves: { $sum: 1 },
          totalDays: { $sum: '$duration' }
        }
      },
      {
        $sort: { totalLeaves: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const topEmployees = topEmployeesAgg.map(item => ({
      employeeId: item._id,
      name: item.name || 'Unknown',
      department: item.department || 'Unknown',
      totalLeaves: item.totalLeaves,
      totalDays: item.totalDays || 0
    }));

    // Year-over-year comparison using aggregation
    const currentYearStats = await LeaveRequest.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: {
            $gte: startOfYear(new Date(currentYear, 0, 1)),
            $lte: endOfYear(new Date(currentYear, 11, 31))
          }
        }
      },
      {
        $group: {
          _id: null,
          totalLeaves: { $sum: 1 },
          totalDays: { $sum: '$duration' }
        }
      }
    ]);

    const previousYearStats = await LeaveRequest.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: {
            $gte: startOfYear(new Date(previousYear, 0, 1)),
            $lte: endOfYear(new Date(previousYear, 11, 31))
          }
        }
      },
      {
        $group: {
          _id: null,
          totalLeaves: { $sum: 1 },
          totalDays: { $sum: '$duration' }
        }
      }
    ]);

    const currentData = currentYearStats[0] || { totalLeaves: 0, totalDays: 0 };
    const previousData = previousYearStats[0] || { totalLeaves: 0, totalDays: 0 };

    const yoyComparison = {
      currentYear: {
        year: currentYear,
        totalLeaves: currentData.totalLeaves,
        totalDays: currentData.totalDays
      },
      previousYear: {
        year: previousYear,
        totalLeaves: previousData.totalLeaves,
        totalDays: previousData.totalDays
      },
      growth: {
        totalLeaves: previousData.totalLeaves > 0 
          ? (((currentData.totalLeaves - previousData.totalLeaves) / previousData.totalLeaves) * 100).toFixed(1)
          : '0',
        totalDays: previousData.totalDays > 0
          ? (((currentData.totalDays - previousData.totalDays) / previousData.totalDays) * 100).toFixed(1)
          : '0'
      }
    };

    res.json({
      monthlyTrends,
      peakPeriod: { month: peakMonth.month, count: peakMonth.currentYear },
      lowPeriod: { month: lowMonth.month, count: lowMonth.currentYear },
      leaveTypeDistribution: leaveTypeData,
      departmentTrends: departmentData,
      approvalRates,
      topEmployees,
      yearOverYear: yoyComparison,
      summary: {
        totalRequests: currentData.totalLeaves,
        totalDays: currentData.totalDays,
        averageDuration: currentData.totalLeaves > 0 
          ? (currentData.totalDays / currentData.totalLeaves).toFixed(1)
          : '0'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getLeaveAnalytics
};
