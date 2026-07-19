const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const SystemSettings = require('../models/SystemSettings');
const { addDays, isAfter, isBefore, differenceInDays, startOfDay } = require('date-fns');

const getAllLeaveRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Use lean() for better performance when we don't need document methods
    const [leaveRequests, total] = await Promise.all([
      LeaveRequest.find({ isDeleted: false })
        .populate('employeeId', 'name department email')
        .populate('approvedBy', 'email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LeaveRequest.countDocuments({ isDeleted: false })
    ]);

    res.json({
      leaveRequests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getLeaveRequestById = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id)
      .populate('employeeId')
      .populate('approvedBy', 'email role');
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    res.json(leaveRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getEmployeeLeaveRequests = async (req, res) => {
  try {
    // Get employeeId from req.user - it could be an ObjectId or populated object
    const employeeId = req.user.employeeId?._id || req.user.employeeId;
    
    if (!employeeId) {
      return res.status(404).json({ message: 'Employee not found - no employee linked to your account' });
    }
    
    // Use lean() for better performance
    const leaveRequests = await LeaveRequest.find({ employeeId, isDeleted: false })
      .populate('approvedBy', 'email role')
      .sort({ createdAt: -1 })
      .lean();
    res.json(leaveRequests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createLeaveRequest = async (req, res) => {
  try {
    const { leaveType, startDate, duration, reason } = req.body;

    // Get employeeId from req.user - it could be an ObjectId or populated object
    const employeeId = req.user.employeeId?._id || req.user.employeeId;
    
    if (!employeeId) {
      return res.status(404).json({ message: 'Employee not found - no employee linked to your account' });
    }

    const employee = await Employee.findById(employeeId);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Calculate expected return date
    const startDateObj = new Date(startDate);
    const expectedReturnDate = addDays(startDateObj, duration);

    const leaveRequest = new LeaveRequest({
      employeeId,
      leaveType,
      startDate: startDateObj,
      duration,
      expectedReturnDate,
      reason
    });

    await leaveRequest.save();

    // Emit socket event to admin room
    const io = req.app.get('io');
    if (io) {
      const populatedLeave = await leaveRequest.populate('employeeId');
      io.to('admin-room').emit('new-leave-request', {
        leaveRequest: populatedLeave,
        employee: employee
      });
      // Also notify the employee that their request was submitted
      io.to(`employee-${employeeId}`).emit('leave-status-updated', {
        leaveRequest: populatedLeave,
        action: 'submitted'
      });
    }

    res.status(201).json(leaveRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const approveLeaveRequest = async (req, res) => {
  try {
    // Check admin approval permission - use lean for faster read
    const systemSettings = await SystemSettings.findOne().lean();
    if (!systemSettings?.adminApprovalPermission && req.user.role !== 'generalAdmin') {
      return res.status(403).json({ message: 'Only General Admin can approve leave requests when permission is disabled' });
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    leaveRequest.status = 'Approved';
    leaveRequest.approvedBy = req.user._id;
    await leaveRequest.save();

    // Create notification
    const notification = new Notification({
      recipientId: leaveRequest.employeeId,
      type: 'Leave Approved',
      title: 'Leave Request Approved',
      message: `Your leave request from ${new Date(leaveRequest.startDate).toLocaleDateString()} to ${new Date(leaveRequest.expectedReturnDate).toLocaleDateString()} has been approved.`,
      leaveRequestId: leaveRequest._id,
      sentVia: ['In-App', 'Email']
    });
    await notification.save();

    // Emit socket event to admin and employee rooms
    const io = req.app.get('io');
    if (io) {
      const populatedLeave = await leaveRequest.populate('employeeId');
      io.to('admin-room').emit('leave-request-updated', {
        leaveRequest: populatedLeave,
        action: 'approved'
      });
      // Notify the employee about approval
      io.to(`employee-${leaveRequest.employeeId}`).emit('leave-status-updated', {
        leaveRequest: populatedLeave,
        action: 'approved'
      });
    }

    res.json(leaveRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const rejectLeaveRequest = async (req, res) => {
  try {
    // Check admin approval permission - use lean for faster read
    const systemSettings = await SystemSettings.findOne().lean();
    if (!systemSettings?.adminApprovalPermission && req.user.role !== 'generalAdmin') {
      return res.status(403).json({ message: 'Only General Admin can reject leave requests when permission is disabled' });
    }

    const { rejectionReason } = req.body;
    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    leaveRequest.status = 'Rejected';
    leaveRequest.rejectionReason = rejectionReason;
    leaveRequest.approvedBy = req.user._id;
    await leaveRequest.save();

    // Create notification
    const notification = new Notification({
      recipientId: leaveRequest.employeeId,
      type: 'Leave Rejected',
      title: 'Leave Request Rejected',
      message: `Your leave request has been rejected. Reason: ${rejectionReason}`,
      leaveRequestId: leaveRequest._id,
      sentVia: ['In-App', 'Email']
    });
    await notification.save();

    // Emit socket event to admin and employee rooms
    const io = req.app.get('io');
    if (io) {
      const populatedLeave = await leaveRequest.populate('employeeId');
      io.to('admin-room').emit('leave-request-updated', {
        leaveRequest: populatedLeave,
        action: 'rejected'
      });
      // Notify the employee about rejection
      io.to(`employee-${leaveRequest.employeeId}`).emit('leave-status-updated', {
        leaveRequest: populatedLeave,
        action: 'rejected'
      });
    }

    res.json(leaveRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const markAsReturned = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    leaveRequest.status = 'Returned';
    leaveRequest.actualReturnDate = new Date();
    await leaveRequest.save();

    // Clear overdue notifications if employee is returning
    await Notification.updateMany(
      { leaveRequestId: leaveRequest._id, type: 'Overdue Alert' },
      { isRead: true }
    );

    // Create return confirmation notification
    const notification = new Notification({
      recipientId: leaveRequest.employeeId,
      type: 'Return Reminder',
      title: 'Return to Duty Confirmed',
      message: `You have been marked as returned to duty on ${new Date().toLocaleDateString()}.`,
      leaveRequestId: leaveRequest._id,
      sentVia: ['In-App']
    });
    await notification.save();

    res.json(leaveRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateLeaveStatuses = async (req, res) => {
  try {
    const today = startOfDay(new Date());
    const leaveRequests = await LeaveRequest.find({ status: { $in: ['Approved', 'On Leave'] } });

    let updatedCount = 0;
    let overdueCount = 0;

    for (const leave of leaveRequests) {
      const expectedReturn = startOfDay(new Date(leave.expectedReturnDate));
      const startDate = startOfDay(new Date(leave.startDate));
      const daysUntilReturn = differenceInDays(expectedReturn, today);
      const daysSinceStart = differenceInDays(today, startDate);

      // If today is on or after the start date, mark as 'On Leave'
      if (daysSinceStart >= 0 && leave.status === 'Approved') {
        leave.status = 'On Leave';
        await leave.save();
        updatedCount++;
      }

      // If today is past the expected return date and not yet returned, mark as 'Overdue'
      if (daysUntilReturn < 0 && leave.status === 'On Leave') {
        leave.status = 'Overdue';
        await leave.save();
        updatedCount++;
        overdueCount++;

        // Create overdue notification if not already created
        const existingOverdueNotif = await Notification.findOne({
          leaveRequestId: leave._id,
          type: 'Overdue Alert'
        });
        
        if (!existingOverdueNotif) {
          const notification = new Notification({
            recipientId: leave.employeeId,
            type: 'Overdue Alert',
            title: 'Leave Overdue',
            message: `Your leave was expected to end on ${expectedReturn.toDateString()}. Please report to HR immediately.`,
            leaveRequestId: leave._id,
            sentVia: ['In-App', 'Email']
          });
          await notification.save();
        }
      }
    }

    res.json({
      message: 'Leave statuses updated successfully',
      updatedCount,
      overdueCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const softDeleteLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    leaveRequest.isDeleted = true;
    leaveRequest.deletedAt = new Date();
    leaveRequest.deletedBy = req.user._id;
    await leaveRequest.save();

    res.json({ message: 'Leave request moved to trash' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const restoreLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    leaveRequest.isDeleted = false;
    leaveRequest.deletedAt = undefined;
    leaveRequest.deletedBy = undefined;
    await leaveRequest.save();

    res.json({ message: 'Leave request restored' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const permanentDeleteLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    await LeaveRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Leave request permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getDeletedLeaveRequests = async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find({ isDeleted: true })
      .populate('employeeId')
      .populate('deletedBy', 'email role')
      .sort({ deletedAt: -1 });
    res.json(leaveRequests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const resetEmployeeLeaves = async (req, res) => {
  try {
    const { confirm } = req.body;
    const employeeId = req.user.employeeId;
    
    // Require explicit confirmation
    if (confirm !== 'RESET_CONFIRMED') {
      return res.status(400).json({ 
        message: 'Confirmation required. Please send confirm: "RESET_CONFIRMED" to proceed.' 
      });
    }

    const now = new Date();

    // Soft delete all leave requests for this employee
    const leaveDeleteResult = await LeaveRequest.updateMany(
      { employeeId, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: now,
        deletedBy: req.user._id
      }
    );

    res.json({
      message: 'Your leave history reset successfully',
      details: {
        leaveRequestsReset: leaveDeleteResult.modifiedCount,
        resetAt: now
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllLeaveRequests,
  getLeaveRequestById,
  getEmployeeLeaveRequests,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  markAsReturned,
  updateLeaveStatuses,
  softDeleteLeaveRequest,
  restoreLeaveRequest,
  permanentDeleteLeaveRequest,
  getDeletedLeaveRequests,
  resetEmployeeLeaves
};
