const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  userID: {
    type: Number,
    required: true
  },
  tier: {
    type: Number,
    default: 3
  },
  requests: {
    type: Number,
    default: 0
  }
})

module.exports = mongoose.model('user', userSchema)