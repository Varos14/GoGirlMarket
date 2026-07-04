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
      
      if (req.body.isVerified !== undefined) {
        user.isVerified = req.body.isVerified;
      }
      if (req.body.commissionRate !== undefined) {
        user.commissionRate = req.body.commissionRate;
      }
      
      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        storeName: updatedUser.storeName,
        isVerified: updatedUser.isVerified,
        commissionRate: updatedUser.commissionRate,
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

// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
const getUserWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist', 'name price images vendor countInStock');
    
    if (user) {
      res.json(user.wishlist);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add product to wishlist
// @route   POST /api/users/wishlist
// @access  Private
const addWishlistItem = async (req, res) => {
  try {
    const { productId } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (user) {
      // Check if already in wishlist
      if (user.wishlist.includes(productId)) {
        return res.status(400).json({ message: 'Product already in wishlist' });
      }
      
      user.wishlist.push(productId);
      await user.save();
      
      res.status(201).json({ message: 'Product added to wishlist' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/users/wishlist/:productId
// @access  Private
const removeWishlistItem = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user) {
      user.wishlist = user.wishlist.filter(
        (item) => item.toString() !== req.params.productId
      );
      
      await user.save();
      
      res.json({ message: 'Product removed from wishlist' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Suspend vendor
// @route   PUT /api/users/:id/suspend
// @access  Private/Admin
const suspendVendor = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user && user.role === 'vendor') {
      user.isSuspended = !user.isSuspended;
      await user.save();
      res.json({ message: user.isSuspended ? 'Vendor suspended' : 'Vendor reinstated', isSuspended: user.isSuspended });
    } else {
      res.status(404).json({ message: 'Vendor not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve vendor
// @route   PUT /api/users/:id/approve
// @access  Private/Admin
const approveVendor = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user && user.role === 'vendor') {
      user.isApproved = !user.isApproved;
      await user.save();
      res.json({ message: user.isApproved ? 'Vendor approved' : 'Vendor unapproved', isApproved: user.isApproved });
    } else {
      res.status(404).json({ message: 'Vendor not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Buy boost credits
// @route   POST /api/users/buy-credits
// @access  Private/Vendor
const buyCredits = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user && user.role === 'vendor') {
      const packageCost = 10000;
      const creditsGained = 50;

      // Mock payment for now: deduct directly from their wallet availableBalance.
      // In production, this would integrate with Flutterwave and trigger upon webhook success.
      if (!user.wallet) user.wallet = { pendingBalance: 0, availableBalance: 0, boostCredits: 0 };
      
      if (user.wallet.availableBalance < packageCost) {
        return res.status(400).json({ message: 'Insufficient available balance to buy credits' });
      }

      user.wallet.availableBalance -= packageCost;
      user.wallet.boostCredits = (user.wallet.boostCredits || 0) + creditsGained;
      user.wallet.adSpend = (user.wallet.adSpend || 0) + packageCost;
      
      await user.save();
      res.json({ 
        message: 'Boost credits purchased successfully!', 
        wallet: user.wallet 
      });
    } else {
      res.status(404).json({ message: 'Vendor not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  deleteUser,
  updateUserRole,
  getVendorBySlug,
  getUserWishlist,
  addWishlistItem,
  removeWishlistItem,
  suspendVendor,
  approveVendor,
  buyCredits,
};
