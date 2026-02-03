/**
 * Script to identify and delete fake/randomly generated users from MongoDB
 *
 * This script identifies fake users based on patterns:
 * - Randomized names (no spaces, all caps/lowercase mix, random character strings)
 * - Randomized bios, experiences, professions
 * - Missing avatars (real users typically have avatars from Google OAuth)
 * - Suspicious email patterns
 *
 * Usage:
 *   node cleanup-fake-users.js [--dry-run] [--confirm]
 *
 * Options:
 *   --dry-run: Show what would be deleted without actually deleting
 *   --confirm: Actually delete the users (requires confirmation)
 */

require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Check if a name looks like a real name (has spaces, proper capitalization)
const isRealName = (name) => {
  if (!name || typeof name !== 'string') return false;

  const trimmed = name.trim();

  // Real names typically:
  // - Have spaces (first and last name)
  // - Start with capital letters
  // - Are between 3-50 characters
  // - Don't have random character patterns

  // Check if it's a single word (likely fake)
  if (!trimmed.includes(' ') && trimmed.length > 15) return false;

  // Check for random character patterns (too many consecutive consonants/vowels)
  const randomPattern = /[bcdfghjklmnpqrstvwxyz]{5,}|[aeiou]{5,}/i;
  if (randomPattern.test(trimmed)) return false;

  // Check if it looks like a proper name (has spaces and proper capitalization)
  const hasSpace = trimmed.includes(' ');
  const properCapitalization = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)+/.test(trimmed);

  // If it has a space and proper capitalization, it's likely real
  if (hasSpace && properCapitalization) return true;

  // If it's a single word but short and looks reasonable, might be real
  if (!hasSpace && trimmed.length <= 20 && /^[A-Z][a-z]+$/.test(trimmed)) return true;

  // Otherwise, check length - very long single words are suspicious
  if (!hasSpace && trimmed.length > 20) return false;

  return true;
};

// Check if bio/experience/profession looks randomized
const isRandomizedText = (text) => {
  if (!text || typeof text !== 'string') return false;

  const trimmed = text.trim();

  // Very short random strings
  if (trimmed.length < 5) return false;

  // Check for random character patterns
  const randomPattern = /[bcdfghjklmnpqrstvwxyz]{6,}|[aeiou]{5,}/i;
  if (randomPattern.test(trimmed)) return true;

  // Check if it's all caps or all lowercase (suspicious)
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 10) return true;
  if (trimmed === trimmed.toLowerCase() && trimmed.length > 10 && !trimmed.includes(' ')) return true;

  // Check for lack of spaces in long strings (suspicious)
  if (trimmed.length > 15 && !trimmed.includes(' ')) return true;

  return false;
};

// Check if email domain is suspicious
const isSuspiciousEmail = (email) => {
  if (!email || typeof email !== 'string') return false;

  // Common legitimate email domains (add more as needed)
  const legitimateDomains = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
    'protonmail.com', 'aol.com', 'mail.com', 'yandex.com', 'zoho.com',
    'belimunojobs.com', 'belimuno.com'
  ];

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return true;

  // If domain is legitimate, email is probably fine
  if (legitimateDomains.some(legit => domain.includes(legit))) return false;

  // Check for suspicious patterns in domain
  const suspiciousPatterns = [
    /^[a-z]{10,}\.com$/, // Very long random domain names
    /[0-9]{3,}/, // Many numbers in domain
  ];

  return suspiciousPatterns.some(pattern => pattern.test(domain));
};

// Identify fake users
const identifyFakeUsers = async () => {
  try {
    const allUsers = await User.find({}).lean();
    const fakeUsers = [];
    const realUsers = [];

    console.log(`\n🔍 Analyzing ${allUsers.length} users...\n`);

    for (const user of allUsers) {
      let isFake = false;
      const reasons = [];

      // Check name
      if (!isRealName(user.name)) {
        isFake = true;
        reasons.push('Randomized name');
      }

      // Check bio
      if (user.profile?.bio && isRandomizedText(user.profile.bio)) {
        isFake = true;
        reasons.push('Randomized bio');
      }

      // Check experience
      if (user.profile?.experience && isRandomizedText(user.profile.experience)) {
        isFake = true;
        reasons.push('Randomized experience');
      }

      // Check profession
      if (user.profile?.profession && isRandomizedText(user.profile.profession)) {
        isFake = true;
        reasons.push('Randomized profession');
      }

      // Check if user has no avatar (real users from Google OAuth typically have avatars)
      // But don't use this as sole criteria since some real users might not have avatars
      if (!user.profile?.avatar && isFake) {
        reasons.push('No avatar');
      }

      // Check email
      if (isSuspiciousEmail(user.email)) {
        isFake = true;
        reasons.push('Suspicious email domain');
      }

      // Additional check: if user has resetPasswordToken but was created recently
      // and has randomized data, it's likely fake
      if (user.resetPasswordToken && user.resetPasswordExpire) {
        const daysSinceCreation = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation < 7 && isFake) {
          reasons.push('Recent account with reset token');
        }
      }

      if (isFake) {
        fakeUsers.push({
          _id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          reasons: reasons.join(', ')
        });
      } else {
        realUsers.push({
          _id: user._id,
          name: user.name,
          email: user.email
        });
      }
    }

    return { fakeUsers, realUsers };
  } catch (error) {
    console.error('❌ Error identifying fake users:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const needsConfirmation = args.includes('--confirm');

  await connectDB();

  console.log('\n🚀 Starting fake user cleanup...');
  if (isDryRun) {
    console.log('⚠️  DRY RUN MODE - No users will be deleted\n');
  }

  const { fakeUsers, realUsers } = await identifyFakeUsers();

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Real users: ${realUsers.length}`);
  console.log(`   ❌ Fake users: ${fakeUsers.length}\n`);

  if (fakeUsers.length === 0) {
    console.log('✨ No fake users found!');
    await mongoose.connection.close();
    process.exit(0);
  }

  // Show fake users
  console.log('🔴 Fake users identified:\n');
  fakeUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.email})`);
    console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);
    console.log(`   Reasons: ${user.reasons}\n`);
  });

  if (isDryRun) {
    console.log('💡 Run with --confirm to actually delete these users');
    await mongoose.connection.close();
    process.exit(0);
  }

  if (!needsConfirmation) {
    console.log('⚠️  To actually delete these users, run:');
    console.log('   node cleanup-fake-users.js --confirm\n');
    await mongoose.connection.close();
    process.exit(0);
  }

  // Confirm deletion
  console.log('⚠️  WARNING: This will permanently delete the above users!');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    const fakeUserIds = fakeUsers.map(u => u._id);
    const result = await User.deleteMany({ _id: { $in: fakeUserIds } });

    console.log(`\n✅ Successfully deleted ${result.deletedCount} fake users!`);
    console.log(`📊 Remaining users: ${realUsers.length}`);
  } catch (error) {
    console.error('❌ Error deleting users:', error);
  }

  await mongoose.connection.close();
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
