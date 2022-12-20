const express = require('express')
const productRouter = express.Router()
const protect = require('../middlewares/authMiddleware')
const { createProduct, getProducts, getSingleProduct, deleteProduct, updateProduct } = require('../controllers/productController')
const { upload } = require('../utils/fileUpload')

productRouter.post('/', protect, upload.single('image'), createProduct)
productRouter.get('/', protect, getProducts)
productRouter.get('/:id', protect, getSingleProduct)
productRouter.delete('/:id', protect, deleteProduct)
productRouter.patch('/:id', protect, upload.single('image'), updateProduct)

module.exports = productRouter
