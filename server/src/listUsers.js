const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const listUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const users = await User.find({}).sort({ createdAt: -1 });
    console.log(`Total Users in DB: ${users.length}`);
    users.forEach(u => console.log(`- ${u.name} (${u.email}) [Role: ${u.role}]`));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

listUsers();
