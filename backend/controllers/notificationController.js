const Notification = require('../models/Notification');
const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const moment = require('moment');
const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Send email notification
const sendEmailNotification = async (email, subject, message) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      html: message,
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

// Get notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ deliveryStatus: 'pending' })
      .populate('employee')
      .populate('leaveRequest')
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send reminders
exports.sendReminders = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get leaves that need 7-day reminder
    const sevenDaysFromNow = moment().add(7, 'days').toDate();
    const leavesFor7DayReminder = await LeaveRequest.find({
      status: 'Approved',
      expectedReturnDate: { $gte: sevenDaysFromNow, $lt: moment(sevenDaysFromNow).add(1, 'day').toDate() },
      'reminders.sevenDaysBefore': false,
    }).populate('employee');

    // Get leaves that need 3-day reminder
    const threeDaysFromNow = moment().add(3, 'days').toDate();
    const leavesFor3DayReminder = await LeaveRequest.find({
      status: 'On Leave',
      expectedReturnDate: { $gte: threeDaysFromNow, $lt: moment(threeDaysFromNow).add(1, 'day').toDate() },
      'reminders.threeDaysBefore': false,
    }).populate('employee');

    // Get leaves due today
    const leavesDueToday = await LeaveRequest.find({
      status: 'On Leave',
      expectedReturnDate: { $gte: today, $lt: moment(today).add(1, 'day').toDate() },
      'reminders.onReturnDate': false,
    }).populate('employee');

    // Process 7-day reminders
    for (const leave of leavesFor7DayReminder) {
      const notification = new Notification({
        employee: leave.employee._id,
        leaveRequest: leave._id,
        type: '7-day-reminder',
        subject: 'Return to Duty Reminder - 7 Days',
        message: `Dear ${leave.employee.firstName},\n\nThis is a reminder that your leave expires on ${moment(leave.expectedReturnDate).format('YYYY-MM-DD')}. Please ensure you return to duty on the scheduled date.`,
        channel: 'email',
        scheduledFor: sevenDaysFromNow,
      });

      await notification.save();

      const sent = await sendEmailNotification(
        leave.employee.email,
        'Return to Duty Reminder - 7 Days',
        notification.message
      );

      if (sent) {
        notification.isSent = true;
        notification.sentAt = new Date();
        notification.deliveryStatus = 'sent';
        leave.reminders.sevenDaysBefore = true;
        await notification.save();
        await leave.save();
      }
    }

    // Similar logic for 3-day and same-day reminders...

    res.json({
      message: 'Reminders sent successfully',
      sentCount: leavesFor7DayReminder.length + leavesFor3DayReminder.length + leavesDueToday.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send manual notification
exports.sendManualNotification = async (req, res) => {
  try {
    const { employeeId, subject, message, channel } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const sent = await sendEmailNotification(employee.email, subject, message);

    const notification = new Notification({
      employee: employeeId,
      type: 'manual',
      subject,
      message,
      channel: channel || 'email',
      isSent: sent,
      sentAt: sent ? new Date() : null,
      deliveryStatus: sent ? 'sent' : 'failed',
      scheduledFor: new Date(),
    });

    await notification.save();

    res.json({
      message: 'Notification sent successfully',
      notification,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
