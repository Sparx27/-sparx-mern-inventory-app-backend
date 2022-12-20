const mongoose = require('mongoose')
const { model, Schema } = mongoose
const bcrypt = require('bcrypt')

const userSchema = Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    trim: true,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Not valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minLength: [6, 'Password must at least 6 characters long '],
    maxLenght: [23, 'Password must not be more than 23 characters long']
  },
  photo: {
    type: String,
    required: [true, 'Please add a password'],
    default: 'https://i.ibb.co/4pDNDk1/avatar.png'
  },
  phone: {
    type: String,
    default: '+598'
  },
  bio: {
    type: String,
    maxLenght: [250, 'Bio must not be more than 250 characters long'],
    default: 'bio'
  }
}, {
  timestamps: true
  // Adds 2 properties about the moment when User is created/updated
})

// Encripting password before saving to DB
userSchema.pre('save', async function (next) {
  // Avoid changing password on profile update
  if (!this.isModified('password')) {
    return next()
  }

  const hashedPassword = await bcrypt.hash(this.password, 10)
  this.password = hashedPassword
  next()
})

const User = model('User', userSchema)

module.exports = User
