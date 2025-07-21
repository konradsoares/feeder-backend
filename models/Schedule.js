const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  hour: {
    type: Number,
    required: true,
    min: 0,
    max: 23
  },
  minute: {
    type: Number,
    required: true,
    min: 0,
    max: 59
  },
  description: String
});

module.exports = mongoose.model('Schedule', scheduleSchema);

