const Maintenance = require('../models/Maintenance');
const Flat = require('../models/Flat');

exports.createBill = async (req, res) => {
  const { flatId, amount, dueDate, month } = req.body;
  try {
    const bill = await Maintenance.create({ flatId, amount, dueDate, month });
    
    // Notify owner
    const flat = await Flat.findById(flatId);
    if (flat && flat.owner) {
      req.io.to(flat.owner.toString()).emit('maintenance_updated', {
        message: `New maintenance bill for ${month} has been generated.`,
        bill
      });
    }

    // Notify admins
    req.io.to('admin').emit('maintenance_updated', {
      message: `A new maintenance bill has been generated for Flat ${flat?.flatNumber || ''}.`,
      bill
    });

    res.status(201).json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFlatDues = async (req, res) => {
  try {
    let flatId = req.params.flatId;

    // If resident call, try to find flat they own
    if (!flatId && req.user.role === 'resident') {
      const flat = await Flat.findOne({ owner: req.user._id });
      if (flat) flatId = flat._id;
    }

    if (!flatId) flatId = req.user.flatId;

    if (!flatId) {
      return res.json([]);
    }
    const dues = await Maintenance.find({ flatId }).sort({ createdAt: -1 });
    res.json(dues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAsPaid = async (req, res) => {
  try {
    const bill = await Maintenance.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    bill.status = 'paid';
    bill.paymentDate = Date.now();
    await bill.save();

    // Notify owner
    const flat = await Flat.findById(bill.flatId);
    if (flat && flat.owner) {
      req.io.to(flat.owner.toString()).emit('maintenance_updated', {
        message: `Your maintenance bill for ${bill.month} has been marked as paid.`,
        bill
      });
    }

    // Notify admins
    req.io.to('admin').emit('maintenance_updated', {
      message: `Maintenance bill for Flat ${flat?.flatNumber || ''} has been paid.`,
      bill
    });

    res.json({ message: 'Payment marked as successful', bill });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllMaintenance = async (req, res) => {
  const { startDate, endDate, status } = req.query;
  try {
    let query = {};
    if (status) query.status = status;
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const bills = await Maintenance.find(query).populate({
      path: 'flatId',
      populate: { path: 'owner', select: 'name' }
    }).sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteBill = async (req, res) => {
  try {
    await Maintenance.findByIdAndDelete(req.params.id);
    
    // Notify admins
    req.io.to('admin').emit('maintenance_updated', {
      message: `A maintenance bill has been deleted.`,
    });

    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBill = async (req, res) => {
  try {
    const bill = await Maintenance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // Notify owner
    const flat = await Flat.findById(bill.flatId);
    if (flat && flat.owner) {
      req.io.to(flat.owner.toString()).emit('maintenance_updated', {
        message: `Your maintenance bill for ${bill.month} has been updated.`,
        bill
      });
    }

    // Notify admins
    req.io.to('admin').emit('maintenance_updated', {
      message: `Maintenance bill for Flat ${flat?.flatNumber || ''} has been updated.`,
      bill
    });

    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
