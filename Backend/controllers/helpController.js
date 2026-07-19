const HelpRequest = require('../models/HelpRequest');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');

const createHelpRequest = async (req, res) => {
  try {
    const { subject, message } = req.body;

    const employeeId = req.user.employeeId;
    const employee = await Employee.findById(employeeId);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const helpRequest = new HelpRequest({
      employeeId,
      subject,
      message
    });

    await helpRequest.save();

    const populatedRequest = await helpRequest.populate('employeeId');

    res.status(201).json(populatedRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllHelpRequests = async (req, res) => {
  try {
    const helpRequests = await HelpRequest.find({ isDeleted: false })
      .populate('employeeId')
      .populate('repliedBy', 'email role')
      .sort({ createdAt: -1 });
    res.json(helpRequests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getHelpRequestById = async (req, res) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id)
      .populate('employeeId')
      .populate('repliedBy', 'email role');
    if (!helpRequest) {
      return res.status(404).json({ message: 'Help request not found' });
    }
    res.json(helpRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getEmployeeHelpRequests = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const helpRequests = await HelpRequest.find({ employeeId, isDeleted: false })
      .populate('repliedBy', 'email role')
      .sort({ createdAt: -1 });
    res.json(helpRequests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const replyToHelpRequest = async (req, res) => {
  try {
    const { adminReply } = req.body;
    const helpRequest = await HelpRequest.findById(req.params.id);
    
    if (!helpRequest) {
      return res.status(404).json({ message: 'Help request not found' });
    }

    helpRequest.adminReply = adminReply;
    helpRequest.repliedBy = req.user._id;
    helpRequest.repliedAt = new Date();
    helpRequest.status = 'Resolved';
    await helpRequest.save();

    // Create notification for employee
    const notification = new Notification({
      recipientId: helpRequest.employeeId,
      type: 'Help Request Reply',
      title: 'Response to Your Help Request',
      message: `Admin has replied to your help request: "${helpRequest.subject}"`,
      relatedId: helpRequest._id,
      relatedType: 'HelpRequest'
    });
    await notification.save();

    const populatedRequest = await helpRequest.populate('employeeId').populate('repliedBy', 'email role');

    res.json(populatedRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateHelpRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const helpRequest = await HelpRequest.findById(req.params.id);
    
    if (!helpRequest) {
      return res.status(404).json({ message: 'Help request not found' });
    }

    helpRequest.status = status;
    await helpRequest.save();

    res.json(helpRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const softDeleteHelpRequest = async (req, res) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id);
    if (!helpRequest) {
      return res.status(404).json({ message: 'Help request not found' });
    }

    helpRequest.isDeleted = true;
    helpRequest.deletedAt = new Date();
    helpRequest.deletedBy = req.user._id;
    await helpRequest.save();

    res.json({ message: 'Help request moved to trash' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const restoreHelpRequest = async (req, res) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id);
    if (!helpRequest) {
      return res.status(404).json({ message: 'Help request not found' });
    }

    helpRequest.isDeleted = false;
    helpRequest.deletedAt = undefined;
    helpRequest.deletedBy = undefined;
    await helpRequest.save();

    res.json({ message: 'Help request restored' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const permanentDeleteHelpRequest = async (req, res) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id);
    if (!helpRequest) {
      return res.status(404).json({ message: 'Help request not found' });
    }

    await HelpRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Help request permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getDeletedHelpRequests = async (req, res) => {
  try {
    const helpRequests = await HelpRequest.find({ isDeleted: true })
      .populate('employeeId')
      .populate('deletedBy', 'email role')
      .sort({ deletedAt: -1 });
    res.json(helpRequests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createHelpRequest,
  getAllHelpRequests,
  getHelpRequestById,
  getEmployeeHelpRequests,
  replyToHelpRequest,
  updateHelpRequestStatus,
  softDeleteHelpRequest,
  restoreHelpRequest,
  permanentDeleteHelpRequest,
  getDeletedHelpRequests
};
