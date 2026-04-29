const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true },
  purpose: { type: String },
  status: { type: String, enum: ['waiting', 'approved', 'rejected', 'left'], default: 'waiting' },
  isPreApproved: { type: Boolean, default: false },
  passCode: { type: String }, // For QR code / pre-approval verification
  entryTime: { type: Date, default: Date.now },
  exitTime: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Visitor', visitorSchema);
