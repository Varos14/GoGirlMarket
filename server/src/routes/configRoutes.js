const express = require('express');
const router = express.Router();

router.get('/stripe', (req, res) => {
  // Normally this would be process.env.STRIPE_PUBLISHABLE_KEY
  // We'll return a test key for MVP
  res.send('pk_test_51MockStripeKey1234567890abcdefghijklmnopqrstuvwxyz');
});

module.exports = router;
