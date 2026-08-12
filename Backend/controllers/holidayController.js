const Holiday = require('../models/Holiday');
const Notification = require('../models/Notification');
const Employee = require('../models/Employee');
const User = require('../models/user');

const getAllHolidays = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const holidays = await Holiday.find({ year, isDeleted: false }).sort({ date: 1 });
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getHolidayById = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }
    res.json(holiday);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createHoliday = async (req, res) => {
  try {
    const { name, date, isRecurring, description } = req.body;
    const io = req.app.get('io');
    
    const holiday = new Holiday({
      name,
      date,
      year: new Date(date).getFullYear(),
      isRecurring,
      description
    });
    
    await holiday.save();
    
    // Emit socket event to all connected clients
    if (io) {
      io.emit('holiday-created', holiday);
    }
    
    res.status(201).json(holiday);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateHoliday = async (req, res) => {
  try {
    const { name, date, isRecurring, description } = req.body;
    const io = req.app.get('io');
    
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }
    
    holiday.name = name || holiday.name;
    holiday.date = date || holiday.date;
    holiday.year = date ? new Date(date).getFullYear() : holiday.year;
    holiday.isRecurring = isRecurring !== undefined ? isRecurring : holiday.isRecurring;
    holiday.description = description !== undefined ? description : holiday.description;
    
    await holiday.save();
    
    // Emit socket event to all connected clients
    if (io) {
      io.emit('holiday-updated', holiday);
    }
    
    res.json(holiday);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteHoliday = async (req, res) => {
  try {
    const io = req.app.get('io');
    
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }
    
    holiday.isDeleted = true;
    holiday.deletedAt = new Date();
    holiday.deletedBy = req.user._id;
    
    await holiday.save();
    
    // Emit socket event to all connected clients
    if (io) {
      io.emit('holiday-deleted', { id: req.params.id });
    }
    
    res.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Check for upcoming holidays and send notifications
const checkUpcomingHolidays = async (io) => {
  try {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const upcomingHolidays = await Holiday.find({
      date: {
        $gte: today.toISOString().split('T')[0],
        $lte: sevenDaysFromNow.toISOString().split('T')[0]
      },
      isDeleted: false
    }).sort({ date: 1 });

    for (const holiday of upcomingHolidays) {
      const holidayDate = new Date(holiday.date);
      const diffDays = Math.ceil((holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Check if notification already sent for this holiday today
      const existingNotification = await Notification.findOne({
        type: 'holiday_alert',
        'metadata.holidayId': holiday._id,
        createdAt: {
          $gte: new Date(today.setHours(0, 0, 0, 0))
        }
      });

      if (!existingNotification) {
        // Create notification for all employees
        const employees = await Employee.find({ isDeleted: false });
        const admins = await User.find({ role: { $in: ['admin', 'generalAdmin'] } });

        const message = `Upcoming Ghana Holiday: ${holiday.name} on ${new Date(holiday.date).toLocaleDateString()} (${diffDays} day${diffDays > 1 ? 's' : ''} away)`;

        // Send notifications to employees
        for (const employee of employees) {
          await Notification.create({
            employeeId: employee._id,
            type: 'holiday_alert',
            message,
            metadata: {
              holidayId: holiday._id,
              holidayName: holiday.name,
              holidayDate: holiday.date,
              daysAway: diffDays
            }
          });

          // Emit socket event to employee
          if (io) {
            io.to(`employee-${employee._id}`).emit('new-notification', {
              type: 'holiday_alert',
              message,
              holiday
            });
          }
        }

        // Send notifications to admins
        for (const admin of admins) {
          if (io) {
            io.to('admin-room').emit('new-notification', {
              type: 'holiday_alert',
              message: `Holiday Alert: ${holiday.name} on ${new Date(holiday.date).toLocaleDateString()} (${diffDays} day${diffDays > 1 ? 's' : ''} away)`,
              holiday
            });
          }
        }

        console.log(`Holiday alert sent for: ${holiday.name}`);
      }
    }
  } catch (error) {
    console.error('Error checking upcoming holidays:', error);
  }
};

module.exports = {
  getAllHolidays,
  getHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  checkUpcomingHolidays
};
