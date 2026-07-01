const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Product = require('./models/Product');
const { users, products } = require('./data/mockData');
const connectDB = require('./config/db');

dotenv.config({ path: path.join(__dirname, '../.env') });

connectDB();

const importData = async () => {
  try {
    await Product.deleteMany();
    await User.deleteMany();

    const createdUsers = await User.insertMany(users);
    
    // The second user is our mock vendor
    const vendorId = createdUsers[1]._id;

    const sampleProducts = products.map((product) => {
      return { ...product, vendor: vendorId };
    });

    await Product.insertMany(sampleProducts);

    console.log('Mock Data Imported successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

importData();
