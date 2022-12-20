const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const sendEmail = require('../utils/sendEmail')

const contactUs = asyncHandler(async (req, res) => {
  const { subject, message } = req.body
  const user = await User.findById(req.user._id)

  if (!user) {
    res.status(401)
    throw new Error('Unauthorized, please sign up')
  }

  // Validation
  if (!subject || !message) {
    res.status(400)
    throw new Error('Please add subject and message')
  }

  const sendto = process.env.EMAIL_USER
  const sentfrom = process.env.EMAIL_USER
  const replyto = user.email
  try {
    await sendEmail(subject, message, sendto, sentfrom, replyto)
    res.status(200).json({ success: true, message: 'Email sent' })
  } catch (error) {
    res.status(500)
    throw new Error('Email not sent, please try again')
  }
})

module.exports = {
  contactUs
}
