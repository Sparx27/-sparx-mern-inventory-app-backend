const express = require('express')
const { registerUser, loginUser, logOut, getUserData, loginStatus, updateUser, changePassword, forgotPassword, resetpassword } = require('../controllers/userController')
const protect = require('../middlewares/authMiddleware')
const userRouter = express.Router()

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.get('/logout', logOut)

userRouter.get('/getuser', protect, getUserData)
userRouter.get('/loggedin', loginStatus)
userRouter.patch('/updateuser', protect, updateUser)
userRouter.patch('/changepassword', protect, changePassword)
userRouter.post('/forgotpassword', forgotPassword)
userRouter.put('/resetpassword/:resetToken', resetpassword)

module.exports = userRouter
