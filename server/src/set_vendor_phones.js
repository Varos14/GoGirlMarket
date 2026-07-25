const mongoose = require('mongoose');
const User = require('./models/User');

const setVendorPhones = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/gogirlmarket');
    
    // Update all vendors to have a valid phone number if missing
    const vendors = await User.find({ role: 'vendor' });
    console.log(`Found ${vendors.length} vendors.`);

    for (const vendor of vendors) {
      if (!vendor.phone) {
        vendor.phone = '+256771234567'; // Default WhatsApp phone for testing
        await vendor.save();
        console.log(`Updated phone for vendor: ${vendor.storeName || vendor.name} -> +256771234567`);
      } else {
        console.log(`Vendor ${vendor.storeName || vendor.name} already has phone: ${vendor.phone}`);
      }
    }

    mongoose.connection.close();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

setVendorPhones();
