const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const fixPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const users = await User.find({});
    for (let user of users) {
      // Check if password is not already a bcrypt hash
      if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) { 
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        await User.updateOne({ _id: user._id }, { password: hashedPassword });
      }
    }

    console.log('Passwords fixed successfully');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixPasswords();
