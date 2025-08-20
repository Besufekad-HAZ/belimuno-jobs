const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load models
const User = require('../models/User');
const Region = require('../models/Region');
const Job = require('../models/Job');

// Load env vars
dotenv.config({ path: './.env' });

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

// Sample data
const regions = [
  {
    name: 'Addis Ababa',
    code: 'ETH-AA',
    description: 'Capital city and main business hub',
    country: 'Ethiopia',
    state: 'Addis Ababa',
    city: 'Addis Ababa',
    coordinates: {
      latitude: 9.0320,
      longitude: 38.7469
    },
    serviceAreas: ['technology', 'construction', 'healthcare', 'education', 'finance'],
    payRates: {
      standard: 500,
      overtime: 750
    }
  },
  {
    name: 'Oromia Region',
    code: 'ETH-OR',
    description: 'Largest region with diverse economic activities',
    country: 'Ethiopia',
    state: 'Oromia',
    city: 'Adama',
    coordinates: {
      latitude: 8.5425,
      longitude: 39.2694
    },
    serviceAreas: ['agriculture', 'construction', 'transportation', 'healthcare'],
    payRates: {
      standard: 400,
      overtime: 600
    }
  },
  {
    name: 'Amhara Region',
    code: 'ETH-AM',
    description: 'Northern region with rich cultural heritage',
    country: 'Ethiopia',
    state: 'Amhara',
    city: 'Bahir Dar',
    coordinates: {
      latitude: 11.5941,
      longitude: 37.3902
    },
    serviceAreas: ['tourism', 'agriculture', 'handicrafts', 'education'],
    payRates: {
      standard: 380,
      overtime: 570
    }
  }
];

const users = [
  // Super Admins
  {
    name: 'Super Admin One',
    email: 'admin1@belimuno.com',
    password: 'Belimuno#2025!',
    role: 'super_admin',
    isVerified: true,
    isActive: true
  },
  {
    name: 'Super Admin Two',
    email: 'admin2@belimuno.com',
    password: 'Belimuno#2025!',
    role: 'super_admin',
    isVerified: true,
    isActive: true
  },
  // Admins
  {
    name: 'Admin HR',
    email: 'admin.hr@belimuno.com',
    password: 'Belimuno#2025!',
    role: 'admin_hr',
    isVerified: true,
    isActive: true
  },
  {
    name: 'Admin Outsource',
    email: 'admin.outsource@belimuno.com',
    password: 'Belimuno#2025!',
    role: 'admin_outsource',
    isVerified: true,
    isActive: true
  },

  // Sample Workers
  {
    name: 'Daniel Haile',
    email: 'daniel.worker@example.com',
    password: 'Worker123!',
    role: 'worker',
    profile: {
      firstName: 'Daniel',
      lastName: 'Haile',
      bio: 'Experienced software developer specializing in web applications'
    },
    workerProfile: {
      skills: ['React', 'Node.js', 'Python', 'MongoDB'],
      experience: '5+ years in full-stack development',
      hourlyRate: 800,
      availability: 'freelance',
      languages: ['English', 'Amharic'],
      certifications: ['AWS Certified Developer', 'MongoDB Professional']
    },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Sara Mohammed',
    email: 'sara.worker@example.com',
    password: 'Worker123!',
    role: 'worker',
    profile: {
      firstName: 'Sara',
      lastName: 'Mohammed',
      bio: 'Graphic designer and UI/UX specialist'
    },
    workerProfile: {
      skills: ['Photoshop', 'Illustrator', 'Figma', 'UI/UX Design'],
      experience: '3 years in graphic design and user experience',
      hourlyRate: 600,
      availability: 'part-time',
      languages: ['English', 'Arabic', 'Amharic']
    },
    isVerified: true,
    isActive: true
  },

  // Sample Clients
  {
    name: 'Tech Solutions Ethiopia',
    email: 'client1@techsolutions.et',
    password: 'Client123!',
    role: 'client',
    profile: {
      firstName: 'Meron',
      lastName: 'Tekle',
      bio: 'CEO of Tech Solutions Ethiopia'
    },
    clientProfile: {
      companyName: 'Tech Solutions Ethiopia',
      industry: 'Information Technology',
      website: 'https://techsolutions.et'
    },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Green Construction PLC',
    email: 'client2@greenconstruction.et',
    password: 'Client123!',
    role: 'client',
    profile: {
      firstName: 'Dawit',
      lastName: 'Wolde',
      bio: 'Project Manager at Green Construction'
    },
    clientProfile: {
      companyName: 'Green Construction PLC',
      industry: 'Construction',
      website: 'https://greenconstruction.et'
    },
    isVerified: true,
    isActive: true
  }
];

const sampleJobs = [
  {
    title: 'E-commerce Website Development',
    description: 'Build a modern e-commerce website with React and Node.js. Must include user authentication, product catalog, shopping cart, and payment integration.',
    category: 'technology',
    subcategory: 'web-development',
    tags: ['React', 'Node.js', 'E-commerce', 'Payment Integration'],
    budget: 25000,
    budgetType: 'fixed',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    estimatedHours: 120,
    status: 'posted',
    priority: 'high',
    requiredSkills: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'CSS'],
    experienceLevel: 'intermediate'
  },
  {
    title: 'Logo Design for Restaurant Chain',
    description: 'Create a modern, memorable logo for a new Ethiopian restaurant chain. Should reflect traditional Ethiopian culture while maintaining a contemporary feel.',
    category: 'design',
    subcategory: 'logo-design',
    tags: ['Logo Design', 'Branding', 'Ethiopian Culture', 'Restaurant'],
    budget: 5000,
    budgetType: 'fixed',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    estimatedHours: 20,
    status: 'posted',
    priority: 'medium',
    requiredSkills: ['Adobe Illustrator', 'Photoshop', 'Branding', 'Creative Design'],
    experienceLevel: 'intermediate'
  }
];

// Import data
const importData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany();
    await Region.deleteMany();
    await Job.deleteMany();

    console.log('Data Destroyed...');

    // Create regions first
    const createdRegions = await Region.insertMany(regions);
    console.log('Regions Imported...');

    // Hash passwords and assign regions to users
    for (let i = 0; i < users.length; i++) {
      users[i].password = await bcrypt.hash(users[i].password, 12);

      // Assign regions to users (workers and clients default to Addis Ababa)
      if (users[i].role === 'worker' || users[i].role === 'client') {
        users[i].region = createdRegions[0]._id; // Default to Addis Ababa
      }
    }

    // Create users
    const createdUsers = await User.insertMany(users);
    console.log('Users Imported...');

    // Update regions with super admin as manager (since no area managers)
    await Region.findByIdAndUpdate(
      createdRegions[0]._id,
      { manager: createdUsers.find(user => user.role === 'super_admin')._id }
    );

    await Region.findByIdAndUpdate(
      createdRegions[1]._id,
      { manager: createdUsers.find(user => user.role === 'super_admin')._id }
    );

    // Create sample jobs
    for (let i = 0; i < sampleJobs.length; i++) {
      sampleJobs[i].client = createdUsers.find(user => user.role === 'client')._id;
      sampleJobs[i].region = createdRegions[0]._id; // Addis Ababa
      // Remove areaManager assignment since role no longer exists
    }

    await Job.insertMany(sampleJobs);
    console.log('Sample Jobs Imported...');

  console.log('✅ Data Imported Successfully!');
  console.log('\n🔑 Login Credentials:');
  console.log('Super Admin 1: admin1@belimuno.com / Belimuno#2025!');
  console.log('Super Admin 2: admin2@belimuno.com / Belimuno#2025!');
  console.log('Admin HR: admin.hr@belimuno.com / Belimuno#2025!');
  console.log('Admin Outsource: admin.outsource@belimuno.com / Belimuno#2025!');
  console.log('Worker 1: worker1@belimuno.com / Belimuno#2025!');
  console.log('Worker 2: worker2@belimuno.com / Belimuno#2025!');
  console.log('Worker 3: worker3@belimuno.com / Belimuno#2025!');
  console.log('Client 1: client1@belimuno.com / Belimuno#2025!');
  console.log('Client 2: client2@belimuno.com / Belimuno#2025!');
  console.log('Client 3: client3@belimuno.com / Belimuno#2025!');

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await connectDB();

    await User.deleteMany();
    await Region.deleteMany();
    await Job.deleteMany();

    console.log('❌ Data Destroyed...');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Usage:');
  console.log('Import data: node utils/seeder.js -i');
  console.log('Delete data: node utils/seeder.js -d');
}
