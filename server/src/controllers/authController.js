const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, role, storeName, storeDescription } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'customer',
      storeName: role === 'vendor' ? storeName : undefined,
      storeDescription: role === 'vendor' ? storeDescription : undefined,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeName: user.storeName,
        storeSlug: user.storeSlug,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeName: user.storeName,
        storeSlug: user.storeSlug,
        tagline: user.tagline,
        phone: user.phone,
        location: user.location,
        payout: user.payout,
        isVerified: user.isVerified,
        commissionRate: user.commissionRate,
        socialLinks: user.socialLinks,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeName: user.storeName,
        storeSlug: user.storeSlug,
        tagline: user.tagline,
        phone: user.phone,
        location: user.location,
        payout: user.payout,
        isVerified: user.isVerified,
        commissionRate: user.commissionRate,
        socialLinks: user.socialLinks,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      
      if (user.role === 'vendor' || user.role === 'admin') {
        if (req.body.storeName) user.storeName = req.body.storeName;
        if (req.body.tagline !== undefined) user.tagline = req.body.tagline;
        if (req.body.phone !== undefined) user.phone = req.body.phone;
        if (req.body.location !== undefined) user.location = req.body.location;
        
        if (req.body.payout) {
          user.payout = {
            bankCode: req.body.payout.bankCode,
            accountNumber: req.body.payout.accountNumber,
            accountName: req.body.payout.accountName,
            // Mocking a successful subaccount creation with Flutterwave
            flutterwaveSubaccountId: `RS_${Math.floor(Math.random() * 90000) + 10000}_${Date.now().toString().slice(-4)}`
          };
        }
        
        if (req.body.socialLinks) {
          user.socialLinks = {
            instagram: req.body.socialLinks.instagram || user.socialLinks?.instagram || '',
            tiktok: req.body.socialLinks.tiktok || user.socialLinks?.tiktok || '',
          };
        }
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        storeName: updatedUser.storeName,
        storeSlug: updatedUser.storeSlug,
        tagline: updatedUser.tagline,
        phone: updatedUser.phone,
        location: updatedUser.location,
        payout: updatedUser.payout,
        isVerified: updatedUser.isVerified,
        commissionRate: updatedUser.commissionRate,
        socialLinks: updatedUser.socialLinks,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ message: 'There is no user with that email' });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url (pointing to the frontend app)
    // We use the origin from the request or a default env var
    const origin = req.headers.origin || 'http://localhost:5174';
    const resetUrl = `${origin}/reset-password/${resetToken}`;

    const message = `
      <h1>You have requested a password reset</h1>
      <p>Please go to this link to reset your password:</p>
      <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        html: message,
      });

      // Also log it to the console for local development testing
      console.log(`\n=== PASSWORD RESET LINK ===\n${resetUrl}\n===========================\n`);

      res.status(200).json({ message: 'Email sent' });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile, forgotPassword, resetPassword };
