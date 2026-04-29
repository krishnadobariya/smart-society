const Visitor = require('../models/Visitor');
const Flat = require('../models/Flat');

exports.addVisitor = async (req, res) => {
  const { name, phone, flatId, purpose } = req.body;
  try {
    const visitor = await Visitor.create({ name, phone, flatId, purpose });
    
    // Notify resident
    const flat = await Flat.findById(flatId);
    if (flat && flat.owner) {
      req.io.to(flat.owner.toString()).emit('visitor_updated', {
        message: `New visitor: ${name} is waiting for your approval.`,
        visitor
      });
    }

    // Notify admins
    req.io.to('admin').emit('visitor_updated', {
      message: `Visitor ${name} has arrived for Flat ${flat?.flatNumber || ''}.`,
      visitor
    });

    // Notify security
    req.io.to('security').emit('visitor_updated', {
      message: `Visitor ${name} entry registered.`,
      visitor
    });

    res.status(201).json(visitor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.preApproveGuest = async (req, res) => {
  const { name, phone, flatId, purpose } = req.body;
  try {
    const passCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const visitor = await Visitor.create({ 
      name, phone, flatId, purpose, 
      status: 'approved',
      isPreApproved: true,
      passCode 
    });

    // Notify security about new pre-approved guest
    req.io.to('security').emit('visitor_updated', {
      message: `New pre-approved guest added: ${name}`,
      visitor
    });

    res.status(201).json(visitor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyPassCode = async (req, res) => {
  const { passCode } = req.body;
  try {
    const visitor = await Visitor.findOne({ passCode, status: 'approved' }).populate('flatId');
    if (!visitor) return res.status(404).json({ message: 'Invalid or expired pass code' });
    
    visitor.entryTime = Date.now();
    await visitor.save();

    // Notify Resident
    const flat = await Flat.findById(visitor.flatId);
    if (flat && flat.owner) {
      req.io.to(flat.owner.toString()).emit('visitor_updated', {
        message: `Your pre-approved guest ${visitor.name} has entered the society.`,
        visitor
      });
    }

    req.io.to('admin').emit('visitor_updated', { message: `Pre-approved guest ${visitor.name} has arrived.`, visitor });
    req.io.to('security').emit('visitor_updated', { message: `Pass code verified: ${visitor.name} checked in.`, visitor });

    res.json(visitor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateVisitorStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });

    visitor.status = status;
    if (status === 'left') visitor.exitTime = Date.now();
    
    await visitor.save();

    // Notify resident
    const flat = await Flat.findById(visitor.flatId);
    if (flat && flat.owner) {
      req.io.to(flat.owner.toString()).emit('visitor_updated', {
        message: `Visitor ${visitor.name} status updated to ${status}.`,
        visitor
      });
    }

    // Notify admins
    req.io.to('admin').emit('visitor_updated', {
      message: `Visitor ${visitor.name} status updated to ${status}.`,
      visitor
    });

    // Notify security
    req.io.to('security').emit('visitor_updated', {
      message: `Visitor ${visitor.name} status updated to ${status}.`,
      visitor
    });

    res.json(visitor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getVisitorLogs = async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    let query = {};
    if (startDate && endDate) {
      query.entryTime = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const logs = await Visitor.find(query).populate('flatId', 'flatNumber').sort({ entryTime: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getResidentVisitors = async (req, res) => {
  try {
    let flatId = req.params.flatId;
    
    // If not in params (resident call), try to find the flat they own
    if (!flatId && req.user.role === 'resident') {
      const Flat = require('../models/Flat');
      const flat = await Flat.findOne({ owner: req.user._id });
      if (flat) flatId = flat._id;
    }

    // Fallback to the flatId on user object if still not found
    if (!flatId) flatId = req.user.flatId;

    console.log('DEBUG: Fetching visitors for resolved flatId:', flatId);
    
    if (!flatId) {
      return res.json([]);
    }
    const logs = await Visitor.find({ flatId }).sort({ entryTime: -1 }).limit(10);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getVisitorSummary = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const summary = await Visitor.aggregate([
      { $match: { entryTime: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $month: '$entryTime' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = monthNames.map((name, index) => {
      const monthNum = index + 1;
      const count = summary.find(s => s._id === monthNum)?.count || 0;
      return { name, count };
    }).filter((_, i) => {
       const currentMonth = new Date().getMonth();
       return i <= currentMonth && i > currentMonth - 6;
    });

    res.json(chartData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportVisitorLogs = async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    let query = {};
    if (startDate && endDate) {
      query.entryTime = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const visitors = await Visitor.find(query).populate('flatId', 'flatNumber');
    
    let csv = 'Visitor Name,Phone,Flat No,Purpose,Status,Entry Time,Exit Time\n';
    visitors.forEach(v => {
      const entry = v.entryTime ? new Date(v.entryTime).toLocaleString() : 'N/A';
      const exit = v.exitTime ? new Date(v.exitTime).toLocaleString() : 'N/A';
      csv += `"${v.name}","${v.phone}","${v.flatId?.flatNumber || 'N/A'}","${v.purpose}","${v.status}","${entry}","${exit}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`visitors_${startDate || 'all'}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
