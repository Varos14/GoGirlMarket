const express = require('express');
const router = express.Router();
const { getUsers, deleteUser, updateUserRole, getVendorBySlug, getUserWishlist, addWishlistItem, removeWishlistItem, suspendVendor, approveVendor } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/store/:slug')
  .get(getVendorBySlug);

router.route('/wishlist')
  .get(protect, getUserWishlist)
  .post(protect, addWishlistItem);
  
router.route('/wishlist/:productId')
  .delete(protect, removeWishlistItem);

router.route('/')
  .get(protect, admin, getUsers);

router.route('/:id')
  .delete(protect, admin, deleteUser);

router.route('/:id/role')
  .put(protect, admin, updateUserRole);

router.route('/:id/suspend')
  .put(protect, admin, suspendVendor);

router.route('/:id/approve')
  .put(protect, admin, approveVendor);

module.exports = router;
