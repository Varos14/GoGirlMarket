const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { protect, vendor } = require('../middleware/authMiddleware');

router.post('/', protect, vendor, upload.single('image'), (req, res) => {
  if (req.file && req.file.path) {
    res.json({
      message: 'Image uploaded successfully',
      url: req.file.path,
    });
  } else {
    res.status(400).json({ message: 'No image file provided or upload failed' });
  }
});

module.exports = router;
