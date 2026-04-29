const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  amenityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Amenity', required: true },
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true }, // e.g. "10:00"
  endTime: { type: String, required: true },   // e.g. "12:00"
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
  totalPrice: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
