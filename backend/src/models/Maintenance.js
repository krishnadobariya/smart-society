const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  month: { type: String, required: true },
  status: { type: String, enum: ['paid', 'pending'], default: 'pending' },
  paymentDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Maintenance', maintenanceSchema);
