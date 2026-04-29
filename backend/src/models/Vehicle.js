const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleNumber: { type: String, required: true, unique: true },
  vehicleType: { type: String, enum: ['car', 'bike', 'other'], default: 'car' },
  brand: { type: String },
  model: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
