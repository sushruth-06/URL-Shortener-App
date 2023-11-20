const mongoose = require('mongoose')

const tierSchema = new mongoose.Schema({
  1: {
    type: Number,
    required: true
  },
  2: {
    type: Number,
    required: true
  },
  3: {
    type: Number,
    required: true
  }
})

module.exports = mongoose.model('tier', tierSchema)