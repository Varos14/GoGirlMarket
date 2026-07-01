const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const fixVendor = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/gogirlmarket', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Find a vendor
    let vendor = await User.findOne({ role: 'vendor' });
    
    if (!vendor) {
      console.log('No vendor found. Creating one...');
      vendor = new User({
        name: 'Jane Boutique',
        email: 'vendor@gogirl.com',
        password: 'password123',
        role: 'vendor',
        storeName: 'Jane Boutique'
      });
      await vendor.save();
      console.log('Created vendor@gogirl.com with password password123');
    } else {
      console.log(`Found vendor: ${vendor.email}`);
      vendor.password = 'password123';
      await vendor.save();
      console.log(`Updated password for ${vendor.email} to 'password123'`);
    }

    mongoose.connection.close();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

fixVendor();
