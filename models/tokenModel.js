const mongoose = require('mongoose')
const { Schema, model } = mongoose

const tokenSchema = Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'user'
  },
  token: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
})

const Token = model('Token', tokenSchema)

module.exports = Token
