const mongoose = require('mongoose');

const amenitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  icon: { type: String, default: 'Building' }, // Lucide icon name
  pricePerHour: { type: Number, default: 0 },
  status: { type: String, enum: ['available', 'maintenance', 'closed'], default: 'available' },
}, { timestamps: true });

module.exports = mongoose.model('Amenity', amenitySchema);
