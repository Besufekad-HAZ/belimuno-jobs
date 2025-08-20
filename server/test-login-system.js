const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './.env' });

const testLoginSystem = async () => {
  console.log('🔐 Testing Belimuno Jobs Login System...\n');

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
      console.log('   ❌ No users found. Run seedTestData.js to create test data');
      console.log('   Command: node seedTestData.js');
      return;
    }

    // Test 4: Test specific test accounts
    console.log('\n3. Testing Test Accounts:');
    const testAccounts = [
      'worker1@belimuno.com',
      'client1@belimuno.com',
      'admin.hr@belimuno.com'
    ];

    for (const email of testAccounts) {
      const user = await User.findOne({ email });
      if (user) {
        console.log(`   ✅ ${email} - Found (${user.role})`);
        console.log(`      - Verified: ${user.isVerified}`);
        console.log(`      - Active: ${user.isActive}`);
        console.log(`      - Has password: ${!!user.password}`);

        // Test password verification
        const testPassword = 'Belimuno#2025!';
        const isPasswordValid = await bcrypt.compare(testPassword, user.password);
        console.log(`      - Password valid: ${isPasswordValid}`);

        if (!isPasswordValid) {
          console.log(`      ❌ Password verification failed for ${email}`);
        }
      } else {
        console.log(`   ❌ ${email} - Not found`);
      }
    }

    // Test 5: Test login simulation
    console.log('\n4. Testing Login Simulation:');
    const testUser = await User.findOne({ email: 'worker1@belimuno.com' });
    if (testUser) {
      const testPassword = 'Belimuno#2025!';
      const isPasswordValid = await bcrypt.compare(testPassword, testUser.password);

      if (isPasswordValid) {
        console.log('   ✅ Password verification works');
        console.log('   ✅ Login should work for worker1@belimuno.com');
      } else {
        console.log('   ❌ Password verification failed');
        console.log('   ❌ Login will fail');
      }
    }

    // Test 6: Check for common issues
    console.log('\n5. Checking for Common Issues:');

    // Check if users have regions
    const usersWithoutRegions = await User.countDocuments({ region: { $exists: false } });
    if (usersWithoutRegions > 0) {
      console.log(`   ⚠️  ${usersWithoutRegions} users without regions`);
    } else {
      console.log('   ✅ All users have regions assigned');
    }

    // Check if workers have workerProfile
    const workersWithoutProfile = await User.countDocuments({
      role: 'worker',
      workerProfile: { $exists: false }
    });
    if (workersWithoutProfile > 0) {
      console.log(`   ⚠️  ${workersWithoutProfile} workers without workerProfile`);
    } else {
      console.log('   ✅ All workers have workerProfile');
    }

    // Check if clients have clientProfile
    const clientsWithoutProfile = await User.countDocuments({
      role: 'client',
      clientProfile: { $exists: false }
    });
    if (clientsWithoutProfile > 0) {
      console.log(`   ⚠️  ${clientsWithoutProfile} clients without clientProfile`);
    } else {
      console.log('   ✅ All clients have clientProfile');
    }

    await mongoose.disconnect();
    console.log('\n✅ Login system test completed!');

    if (userCount > 0) {
      console.log('\n📝 Next Steps:');
      console.log('   1. Make sure the server is running: npm start');
      console.log('   2. Try logging in with: worker1@belimuno.com / Belimuno#2025!');
      console.log('   3. Check browser console for any errors');
    }

  } catch (error) {
    console.log('   ❌ Database connection failed:', error.message);
    console.log('\n❌ Please check:');
    console.log('   - MongoDB is running');
    console.log('   - MONGO_URI is correct in .env file');
    console.log('   - Network connectivity');
  }
};

// Run the test
testLoginSystem().catch(console.error);
