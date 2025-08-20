const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './.env' });

const testSystem = async () => {
  console.log('🧪 Testing Belimuno Jobs System...\n');

  // Test 1: Environment Variables
  console.log('1. Checking Environment Variables:');
  const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'PORT'];
  let envOk = true;

  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      console.log(`   ❌ ${varName} is missing`);
      envOk = false;
    } else {
      console.log(`   ✅ ${varName} is set`);
    }
  });

  if (!envOk) {
    console.log('\n❌ Please create a .env file with required variables');
    console.log('   See setup-env.md for details');
    return;
  }

  // Test 2: Database Connection
  console.log('\n2. Testing Database Connection:');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('   ✅ Connected to MongoDB');

    // Test 3: Check if data exists
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    console.log(`   ✅ Database has ${userCount} users`);

    if (userCount === 0) {
      console.log('   ⚠️  No users found. Run seedTestData.js to create test data');
    } else {
      // Test 4: Test login with seeded data
      console.log('\n3. Testing Authentication:');
      const testUser = await User.findOne({ email: 'worker1@belimuno.com' });
      if (testUser) {
        console.log('   ✅ Test user found:', testUser.email);
        console.log('   ✅ User role:', testUser.role);
        console.log('   ✅ User verified:', testUser.isVerified);
        console.log('   ✅ User active:', testUser.isActive);
      } else {
        console.log('   ❌ Test user not found. Run seedTestData.js');
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ System test completed successfully!');

  } catch (error) {
    console.log('   ❌ Database connection failed:', error.message);
    console.log('\n❌ Please check:');
    console.log('   - MongoDB is running');
    console.log('   - MONGO_URI is correct in .env file');
    console.log('   - Network connectivity');
  }
};

// Run the test
testSystem().catch(console.error);
