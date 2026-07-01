const express = require('express');
const router = express.Router();
const { getUsers, deleteUser, updateUserRole, getVendorBySlug } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/store/:slug')
  .get(getVendorBySlug);

router.route('/')
  .get(protect, admin, getUsers);

router.route('/:id')
  .delete(protect, admin, deleteUser);

router.route('/:id/role')
  .put(protect, admin, updateUserRole);

module.exports = router;
