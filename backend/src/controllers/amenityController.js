const Amenity = require('../models/Amenity');

exports.createAmenity = async (req, res) => {
  try {
    const amenity = await Amenity.create(req.body);
    res.status(201).json(amenity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllAmenities = async (req, res) => {
  try {
    const amenities = await Amenity.find();
    res.json(amenities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAmenity = async (req, res) => {
  try {
    const amenity = await Amenity.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(amenity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAmenity = async (req, res) => {
  try {
    await Amenity.findByIdAndDelete(req.params.id);
    res.json({ message: 'Amenity deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
