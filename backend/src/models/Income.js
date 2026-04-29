const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { 
    type: String, 
    enum: ['Event Sponsorship', 'Rent from Club House', 'Donation', 'Fixed Deposit Interest', 'Other'],
    default: 'Other'
  },
  date: { type: Date, default: Date.now },
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Income', incomeSchema);
