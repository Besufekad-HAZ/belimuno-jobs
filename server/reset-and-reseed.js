const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './.env' });

const resetAndReseed = async () => {
  console.log('🔄 Starting Complete Database Reset and Reseed...\n');

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
  console.log('\n2. Connecting to Database:');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('   ✅ Connected to MongoDB');

    // Test 3: Complete Data Reset
    console.log('\n3. 🔥 COMPLETE DATA RESET:');
    console.log('   ⚠️  WARNING: This will delete ALL data!');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);

    console.log(`   📋 Found ${collectionNames.length} collections: ${collectionNames.join(', ')}`);

    // Clear ALL collections
    for (const collectionName of collectionNames) {
      try {
        await mongoose.connection.db.collection(collectionName).deleteMany({});
        console.log(`   ✅ Cleared collection: ${collectionName}`);
      } catch (error) {
        console.log(`   ⚠️  Could not clear ${collectionName}: ${error.message}`);
      }
    }

    console.log('   🗑️  All data has been cleared!');

    // Test 4: Reseed with fresh data
    console.log('\n4. 🌱 Reseeding Database:');

    // Import and run the seed script
    try {
      console.log('   📥 Running seedTestData.js...');
      const seedScript = require('./seedTestData');
      await seedScript();
      console.log('   ✅ Database reseeded successfully!');
    } catch (error) {
      console.log('   ❌ Failed to reseed database:', error.message);
      console.log('   📝 Please run manually: node seedTestData.js');
      return;
    }

    // Test 5: Verify the new data
    console.log('\n5. 🔍 Verifying New Data:');

    const User = require('./models/User');
    const Job = require('./models/Job');
    const Region = require('./models/Region');
    const Application = require('./models/Application');
    const Notification = require('./models/Notification');

    const userCount = await User.countDocuments();
    const jobCount = await Job.countDocuments();
    const regionCount = await Region.countDocuments();
    const applicationCount = await Application.countDocuments();
    const notificationCount = await Notification.countDocuments();

    console.log(`   👥 Users: ${userCount}`);
    console.log(`   💼 Jobs: ${jobCount}`);
    console.log(`   🌍 Regions: ${regionCount}`);
    console.log(`   📝 Applications: ${applicationCount}`);
    console.log(`   🔔 Notifications: ${notificationCount}`);

    // Test 6: Verify test accounts
    console.log('\n6. 🔐 Verifying Test Accounts:');
    const testAccounts = [
      'worker1@belimuno.com',
      'client1@belimuno.com',
      'admin.hr@belimuno.com'
    ];

    for (const email of testAccounts) {
      const user = await User.findOne({ email });
      if (user) {
        console.log(`   ✅ ${email} - ${user.role} (${user.name})`);
      } else {
        console.log(`   ❌ ${email} - Not found`);
      }
    }

    await mongoose.disconnect();
    console.log('\n🎉 COMPLETE RESET AND RESEED SUCCESSFUL!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Start the server: npm start');
    console.log('   2. Start the client: npm run dev (in client directory)');
    console.log('   3. Test login with: worker1@belimuno.com / Belimuno#2025!');
    console.log('   4. All data is fresh and clean!');

  } catch (error) {
    console.log('   ❌ Database operation failed:', error.message);
    console.log('\n❌ Please check:');
    console.log('   - MongoDB is running');
    console.log('   - MONGO_URI is correct in .env file');
    console.log('   - Network connectivity');
  }
};

// Run the reset and reseed
resetAndReseed().catch(console.error);
