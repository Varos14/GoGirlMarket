const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct, createProductReview, importProductsCSV, updateProductFeatured, sponsorProduct, clickSponsoredProduct } = require('../controllers/productController');
const { protect, vendor, admin } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.route('/')
  .get(getProducts)
  .post(protect, vendor, createProduct);

router.post('/bulk', protect, vendor, upload.single('file'), importProductsCSV);

router.route('/:id')
  .get(getProductById)
  .put(protect, vendor, updateProduct)
  .delete(protect, vendor, deleteProduct);

router.route('/:id/reviews').post(protect, createProductReview);

router.route('/:id/featured').put(protect, admin, updateProductFeatured);

router.route('/:id/sponsor').put(protect, vendor, sponsorProduct);

router.route('/:id/click').post(clickSponsoredProduct);

module.exports = router;
