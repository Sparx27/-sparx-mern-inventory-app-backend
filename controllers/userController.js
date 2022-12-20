const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const Token = require('../models/tokenModel')
const crypto = require('crypto')
const sendEmail = require('../utils/sendEmail')

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' })
}

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

  // Validation
  if (!name || !email || !password) {
    res.status(400)
    throw new Error('Please fill in all required fields')
  }
  if (password.length < 6) {
    res.status(400)
    throw new Error('Password must be up to 6 characters')
  }
  // Check if user email already exists
  const userExists = await User.findOne({ email })
  if (userExists) {
    res.status(400)
    throw new Error('Email has already been used')
  }

  // Create new user
  const user = await User.create({
    name,
    email,
    password
  })

  // Generate token
  const token = generateToken(user._id)

  // Send HTTP-only cookie
  res.cookie('token', token, {
    path: '/',
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), // 1 day
    sameSite: 'none', // front and back can have different URLs
    secure: true
  })

  if (user) {
    const { _id, name, email, photo, phone, bio } = user
    res.status(201).json({
      _id, name, email, photo, phone, bio, token
    })
  } else {
    res.status(400)
    throw new Error('Wrong user data')
  }
})

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Validate request
  if (!email || !password) {
    res.status(400)
    throw new Error('Please add email and password')
  }

  // Search if user exists
  const user = await User.findOne({ email })
  if (!user) {
    res.status(400)
    throw new Error('User not found, you should signup')
  }

  // Validate password
  const passwordIsCorrect = await bcrypt.compare(password, user.password)

  // Generate token
  const token = generateToken(user._id)

  // Send HTTP-only cookie
  res.cookie('token', token, {
    path: '/',
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), // 1 day
    sameSite: 'none', // front and back can have different URLs
    secure: true
  })

  if (user && passwordIsCorrect) {
    const { _id, name, email, photo, phone, bio } = user
    res.status(200).json({
      _id, name, email, photo, phone, bio
    })
  } else {
    res.status(400)
    throw new Error('Incorrect email or password')
  }
})

const logOut = asyncHandler((req, res) => {
  res.cookie('token', '', {
    path: '/',
    httpOnly: true,
    expires: new Date(0), // 1 day
    sameSite: 'none', // front and back can have different URLs
    secure: true
  })
  return res.status(200).json({ message: 'logged out successfully' })
})

const getUserData = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (user) {
    const { _id, name, email, photo, phone, bio } = user
    res.status(200).json({
      _id, name, email, photo, phone, bio
    })
  } else {
    res.status(400)
    throw new Error('User not found')
  }
})

const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token
  if (!token) {
    return res.json(false)
  }

  // Verify token
  const verified = jwt.verify(token, process.env.JWT_SECRET)
  if (verified) {
    return res.json(true)
  }
  // If user is not logged in
  return res.json(false)
})

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (user) {
    const { name, email, photo, phone, bio } = user
    user.email = email
    user.name = req.body.name || name
    user.phone = req.body.phone || phone
    user.bio = req.body.bio || bio
    user.photo = req.body.photo || photo

    const updatedUser = await user.save()
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      photo: updatedUser.photo,
      phone: updatedUser.phone,
      bio: updatedUser.bio
    })
  } else {
    res.status(400)
    throw new Error('User not found')
  }
})

const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  const { oldPassword, password } = req.body

  // Check user
  if (!user) {
    res.status(400)
    throw new Error('User not found, please sign up')
  }
  // Validate
  if (!oldPassword || !password) {
    res.status(400)
    throw new Error('Please add old and new password')
  }
  // Check if old password matches password in database
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password)
  // Save new password
  if (user && passwordIsCorrect) {
    user.password = password
    await user.save()
    res.status(200).send('Password changed successfully')
  } else {
    res.status(400)
    throw new Error('Incorrect old password')
  }
})

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body
  const user = await User.findOne({ email })

  if (!user) {
    res.status(404)
    throw new Error('User does not exist')
  }

  // Delete token if it exists in db
  const token = await Token.findOne({ userId: user._id })
  if (token) {
    await token.deleteOne()
  }

  // Create reset token
  const resetToken = crypto.randomBytes(32).toString('hex') + user._id

  // Hash token before saving to db
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  // Save token to db
  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000) // Thirty minutes
  }).save()

  // Construct reset URL
  const resetUrl = `${process.env.FRONT_URL}/resetpassword/${resetToken}`

  // Reset email
  const message = `
  <h2>Hello ${user.name}<h2>
  <p>Please use the url below to reset your password</p>
  <p>This reset link will be valid for only 30 minutes</p>

  <a href=${resetUrl} clicktracking=off>${resetUrl}</a>

  <p>Regards,</p>
  <h3>Sparx</h3>
  `
  const subject = 'Password Reset Request'
  const sendto = user.email
  const sentfrom = process.env.EMAIL_USER

  try {
    await sendEmail(subject, message, sendto, sentfrom)
    res.status(200).json({ success: true, message: 'Reset email send' })
  } catch (error) {
    res.status(500)
    throw new Error('Email not sent, please try again')
  }
})

const resetpassword = asyncHandler(async (req, res) => {
  const { password } = req.body
  const { resetToken } = req.params

  // Hash token from req.params and then compare to token in db
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  // Find token in db
  const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() }
  })

  if (!userToken) {
    throw new Error('Reset password link expired')
  }

  // Find user
  const user = await User.findOne({ _id: userToken.userId })
  user.password = password
  await user.save()
  res.status(200).json({
    message: 'Password reset successful, you can login now'
  })
})

module.exports = {
  registerUser,
  loginUser,
  logOut,
  getUserData,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetpassword
}
