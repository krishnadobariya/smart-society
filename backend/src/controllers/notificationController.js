const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      targetRole: { $in: ['all', req.user.role] }
    }).sort({ createdAt: -1 }).limit(10);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const { title, message, targetRole } = req.body;
    const notification = await Notification.create({
      title,
      message,
      targetRole: targetRole || 'all',
      createdBy: req.user._id
    });

    // Broadcast notice to all
    req.io.emit('new_notice', notification);

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
