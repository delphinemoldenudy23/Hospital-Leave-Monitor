const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const moment = require('moment');

// Calculate return date
const calculateReturnDate = (startDate, duration) => {
  return moment(startDate).add(duration, 'days').toDate();
};

// Get all leaves
exports.getAllLeaves = async (req, res) => {
  try {
    const { status, department, startDate, endDate } = req.query;
    let query = {};

    if (status) query.status = status;
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    let leaves = await LeaveRequest.find(query)
      .populate('employee')
      .sort({ startDate: -1 });

    if (department) {
      leaves = leaves.filter(leave => 
        leave.employee.department.toString() === department
      );
    }

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get leave by ID
exports.getLeaveById = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id)
      .populate('employee')
      .populate('approvedBy', 'email');

    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create leave
exports.createLeave = async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, duration, reason } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const expectedReturnDate = calculateReturnDate(startDate, duration);

    const leave = new LeaveRequest({
      employee: employeeId,
      leaveType,
      startDate: new Date(startDate),
      endDate: moment(startDate).add(duration - 1, 'days').toDate(),
      duration,
      expectedReturnDate,
      reason,
      status: 'Pending',
    });

    await leave.save();

    res.status(201).json({
      message: 'Leave request created successfully',
      leave,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update leave
exports.updateLeave = async (req, res) => {
  try {
    const { startDate, duration } = req.body;

    let updateData = { ...req.body };

    if (startDate && duration) {
      const expectedReturnDate = calculateReturnDate(startDate, duration);
      updateData.expectedReturnDate = expectedReturnDate;
      updateData.endDate = moment(startDate).add(duration - 1, 'days').toDate();
    }

    const leave = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('employee');

    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    res.json({
      message: 'Leave updated successfully',
      leave,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve leave
exports.approveLeave = async (req, res) => {
  try {
    const { approvalNotes } = req.body;

    const leave = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Approved',
        approvedBy: req.user.id,
        approvalDate: new Date(),
        approvalNotes,
      },
      { new: true }
    ).populate('employee');

    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    res.json({
      message: 'Leave approved successfully',
      leave,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark as returned
exports.markAsReturned = async (req, res) => {
  try {
    const actualReturnDate = new Date();

    const leave = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Returned',
        actualReturnDate,
      },
      { new: true }
    ).populate('employee');

    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    res.json({
      message: 'Return to duty marked successfully',
      leave,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Cancel leave
exports.cancelLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'Cancelled' },
      { new: true }
    ).populate('employee');

    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    res.json({
      message: 'Leave cancelled successfully',
      leave,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get employee leaves
exports.getEmployeeLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ employee: req.params.employeeId })
      .sort({ startDate: -1 });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
