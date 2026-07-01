const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      if (user.role === 'admin') {
        res.status(400).json({ message: 'Cannot delete admin user' });
        return;
      }
      await User.deleteOne({ _id: user._id });
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.role = req.body.role || user.role;
      user.storeName = req.body.storeName || user.storeName;
      
      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        storeName: updatedUser.storeName,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get vendor profile by slug
// @route   GET /api/users/store/:slug
// @access  Public
const getVendorBySlug = async (req, res) => {
  try {
    const vendor = await User.findOne({ storeSlug: req.params.slug, role: 'vendor' })
      .select('-password -resetPasswordToken -resetPasswordExpire');

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor store not found' });
    }

    const products = await Product.find({ vendor: vendor._id });

    res.json({
      vendor,
      products
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getUsers,
  deleteUser,
  updateUserRole,
  getVendorBySlug,
};
