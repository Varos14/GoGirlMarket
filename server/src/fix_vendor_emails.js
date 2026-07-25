const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const fixVendorEmails = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gogirlmarket';
    await mongoose.connect(connStr);
    console.log('Connected to MongoDB.');

    // Find all vendors
    const vendors = await User.find({ role: 'vendor' });
    console.log(`Found ${vendors.length} vendors in database.`);

    for (const vendor of vendors) {
      console.log(`Vendor: ${vendor.storeName || vendor.name} | Email: ${vendor.email} | Phone: ${vendor.phone}`);
      
      // If vendor is VAROS / varos kicks, ensure their email is set to geraldvaros@gmail.com or their specific email
      if (vendor.storeName?.toLowerCase().includes('varos') || vendor.name?.toLowerCase().includes('varos')) {
        vendor.email = 'geraldvaros@gmail.com';
        await vendor.save();
        console.log(`Updated email for vendor ${vendor.name} (${vendor.storeName}) to geraldvaros@gmail.com`);
      }
    }

    mongoose.connection.close();
    console.log('Done.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

fixVendorEmails();
