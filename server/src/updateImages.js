const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Product = require('./models/Product');

dotenv.config({ path: path.join(__dirname, '../.env') });

const updateImages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // 1. Elegant Evening Dress
    await Product.updateOne({ name: 'Elegant Evening Dress' }, { images: ['/images/evening_dress.png'] });
    
    // 2. Hydrating Face Serum
    await Product.updateOne({ name: 'Hydrating Face Serum' }, { images: ['/images/face_serum.png'] });
    
    // 3. Classic Leather Handbag
    await Product.updateOne({ name: 'Classic Leather Handbag' }, { images: ['/images/leather_handbag.png'] });
    
    // 4. Matte Liquid Lipstick
    await Product.updateOne({ name: 'Matte Liquid Lipstick' }, { images: ['/images/matte_lipstick.png'] });

    console.log('Images updated successfully');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

updateImages();
