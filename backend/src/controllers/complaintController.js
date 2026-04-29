const Complaint = require('../models/Complaint');

exports.createComplaint = async (req, res) => {
  const { title, description, priority } = req.body;
  try {
    const complaint = await Complaint.create({
      userId: req.user._id,
      title,
      description,
      priority
    });

    // Notify admins
    req.io.to('admin').emit('complaint_updated', {
      message: `New complaint received: ${title}`,
      complaint
    });

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateComplaintStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status = status;
    await complaint.save();

    // Notify resident
    req.io.to(complaint.userId.toString()).emit('complaint_updated', {
      message: `Your complaint "${complaint.title}" status has been updated to ${status}.`,
      status,
      id: complaint._id
    });

    // Notify admins
    req.io.to('admin').emit('complaint_updated', {
      message: `Complaint "${complaint.title}" status updated to ${status}.`,
      complaint
    });

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getResidentComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user._id });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().populate('userId', 'name email');
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
