const Notification = require('../models/Notification');
const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const nodemailer = require('nodemailer');
const { addDays, differenceInDays } = require('date-fns');

const getNotifications = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const notifications = await Notification.find({ recipientId: employeeId })
      .sort({ sentAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const sendLeaveReminders = async (req, res) => {
  try {
    const today = new Date();
    const leaveRequests = await LeaveRequest.find({
      status: { $in: ['Approved', 'On Leave'] }
    }).populate('employeeId');

    for (const leave of leaveRequests) {
      const expectedReturn = new Date(leave.expectedReturnDate);
      const daysUntilReturn = differenceInDays(expectedReturn, today);

      // Send reminder 7 days before
      if (daysUntilReturn === 7) {
        await createAndSendNotification(
          leave.employeeId,
          'Return Reminder',
          'Leave Return Reminder',
          `Your leave is ending in 7 days on ${expectedReturn.toDateString()}. Please prepare for your return.`,
          leave._id
        );
      }

      // Send reminder 3 days before
      if (daysUntilReturn === 3) {
        await createAndSendNotification(
          leave.employeeId,
          'Return Reminder',
          'Leave Return Reminder',
          `Your leave is ending in 3 days on ${expectedReturn.toDateString()}. Please prepare for your return.`,
          leave._id
        );
      }

      // Send reminder on return day
      if (daysUntilReturn === 0) {
        await createAndSendNotification(
          leave.employeeId,
          'Return Reminder',
          'Return to Work Today',
          `Your leave ends today. Please report to work and confirm your return.`,
          leave._id
        );
      }
    }

    res.json({ message: 'Leave reminders sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createAndSendNotification = async (employee, type, title, message, leaveRequestId) => {
  try {
    // Create in-app notification
    const notification = new Notification({
      recipientId: employee._id,
      type,
      title,
      message,
      leaveRequestId,
      sentVia: ['In-App', 'Email']
    });
    await notification.save();

    // Send email if configured
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@hospital.com',
        to: employee.email,
        subject: title,
        text: message
      });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  sendLeaveReminders
};
