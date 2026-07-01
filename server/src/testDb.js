const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Product = require('./models/Product');

dotenv.config({ path: path.join(__dirname, '../.env') });

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const count = await Product.countDocuments();
  console.log(`There are ${count} products in the database`);
  process.exit(0);
});
