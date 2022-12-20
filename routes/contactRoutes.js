const express = require('express')
const { contactUs } = require('../controllers/contactController')
const contactRouter = express.Router()
const protect = require('../middlewares/authMiddleware')

contactRouter.post('/', protect, contactUs)

module.exports = contactRouter
