const mongoose = require('mongoose');

const RegionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  workHourRules: {
    startTime: String,
    endTime: String,
    maxHoursPerDay: Number
  },
  payRates: {
    standard: Number,
    overtime: Number
  },
  language: { type: String, default: 'en' }
});

module.exports = mongoose.model('Region', RegionSchema);
