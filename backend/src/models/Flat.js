const mongoose = require('mongoose');

const flatSchema = new mongoose.Schema({
  flatNumber: { type: String, required: true, unique: true },
  floor: { type: Number },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{
    name: String,
    age: Number,
    relation: String
  }],
}, { timestamps: true });

module.exports = mongoose.model('Flat', flatSchema);
