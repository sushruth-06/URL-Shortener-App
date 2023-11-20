const mongoose = require('mongoose')

const urlSchema = new mongoose.Schema({
  longUrl: {
    type: String,
    required: true
  },
  shortUrl: {
    type: String
  },
  user: {
    type: Number,
    required: true
  },
  creationDate: {
    type: Date,
    required: true,
    default: Date.now
  }
})

module.exports = mongoose.model('url', urlSchema)