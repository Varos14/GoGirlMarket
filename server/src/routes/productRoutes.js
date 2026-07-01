const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct, createProductReview } = require('../controllers/productController');
const { protect, vendor } = require('../middleware/authMiddleware');

router.route('/')
  .get(getProducts)
  .post(protect, vendor, createProduct);

router.route('/:id')
  .get(getProductById)
  .put(protect, vendor, updateProduct)
  .delete(protect, vendor, deleteProduct);

router.route('/:id/reviews').post(protect, createProductReview);

module.exports = router;
