const Flat = require('../models/Flat');
const User = require('../models/User');

exports.createFlat = async (req, res) => {
  const { flatNumber, floor } = req.body;
  try {
    const flatExists = await Flat.findOne({ flatNumber });
    if (flatExists) return res.status(400).json({ message: 'Flat already exists' });

    const flat = await Flat.create({ flatNumber, floor });
    res.status(201).json(flat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignResident = async (req, res) => {
  const { flatId, userId } = req.body;
  try {
    const flat = await Flat.findById(flatId);
    const user = await User.findById(userId);

    if (!flat || !user) return res.status(404).json({ message: 'Flat or User not found' });

    // Clear previous owner's flatId reference if exists
    if (flat.owner) {
      const prevOwner = await User.findById(flat.owner);
      if (prevOwner) {
        prevOwner.flatId = undefined;
        await prevOwner.save();
      }
    }

    // Set new owner
    flat.owner = userId;
    await flat.save();

    user.flatId = flatId;
    await user.save();

    res.json({ message: 'Resident assigned successfully', flat });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllFlats = async (req, res) => {
  try {
    const flats = await Flat.find().populate('owner', 'name email');
    res.json(flats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateFlat = async (req, res) => {
  try {
    const flat = await Flat.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(flat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteFlat = async (req, res) => {
  try {
    await Flat.findByIdAndDelete(req.params.id);
    res.json({ message: 'Flat deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { flatId } = req.params;
    const flat = await Flat.findById(flatId);
    if (!flat) return res.status(404).json({ message: 'Flat not found' });
    
    flat.members.push(req.body);
    await flat.save();
    res.json(flat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMember = async (req, res) => {
  try {
    const { flatId, memberId } = req.params;
    const flat = await Flat.findById(flatId);
    flat.members = flat.members.filter(m => m._id.toString() !== memberId);
    await flat.save();
    res.json(flat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyFlat = async (req, res) => {
  try {
    const flat = await Flat.findOne({ owner: req.user._id }).populate('owner', 'name email');
    if (!flat) return res.status(404).json({ message: 'Flat not found for this user' });
    res.json(flat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
