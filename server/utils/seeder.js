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
  // Super Admin
  {
    name: 'Besufekad Alemu',
    email: 'admin@belimunojobs.com',
    password: 'Admin123!',
    role: 'super_admin',
    profile: {
      firstName: 'Besufekad',
      lastName: 'Alemu',
      bio: 'Platform Administrator and Full-Stack Developer'
    },
    isVerified: true,
    isActive: true
  },

  // Area Managers
  {
    name: 'Abebe Kebede',
    email: 'manager.aa@belimunojobs.com',
    password: 'Manager123!',
    role: 'area_manager',
    profile: {
      firstName: 'Abebe',
      lastName: 'Kebede',
      bio: 'Area Manager for Addis Ababa region'
    },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Almaz Tadesse',
    email: 'manager.or@belimunojobs.com',
    password: 'Manager123!',
    role: 'area_manager',
    profile: {
      firstName: 'Almaz',
      lastName: 'Tadesse',
      bio: 'Area Manager for Oromia region'
    },
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

      // Assign regions to users
      if (users[i].role === 'area_manager') {
        if (users[i].email.includes('manager.aa')) {
          users[i].region = createdRegions[0]._id; // Addis Ababa
        } else if (users[i].email.includes('manager.or')) {
          users[i].region = createdRegions[1]._id; // Oromia
        }
      } else if (users[i].role === 'worker' || users[i].role === 'client') {
        users[i].region = createdRegions[0]._id; // Default to Addis Ababa
      }
    }

    // Create users
    const createdUsers = await User.insertMany(users);
    console.log('Users Imported...');

    // Update regions with their managers
    await Region.findByIdAndUpdate(
      createdRegions[0]._id,
      { manager: createdUsers[1]._id } // Abebe Kebede for Addis Ababa
    );

    await Region.findByIdAndUpdate(
      createdRegions[1]._id,
      { manager: createdUsers[2]._id } // Almaz Tadesse for Oromia
    );

    // Create sample jobs
    for (let i = 0; i < sampleJobs.length; i++) {
      sampleJobs[i].client = createdUsers.find(user => user.role === 'client')._id;
      sampleJobs[i].region = createdRegions[0]._id; // Addis Ababa
      sampleJobs[i].areaManager = createdUsers[1]._id; // Abebe Kebede
    }

    await Job.insertMany(sampleJobs);
    console.log('Sample Jobs Imported...');

    console.log('✅ Data Imported Successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('Super Admin: admin@belimunojobs.com / Admin123!');
    console.log('Area Manager (AA): manager.aa@belimunojobs.com / Manager123!');
    console.log('Area Manager (OR): manager.or@belimunojobs.com / Manager123!');
    console.log('Worker 1: daniel.worker@example.com / Worker123!');
    console.log('Worker 2: sara.worker@example.com / Worker123!');
    console.log('Client 1: client1@techsolutions.et / Client123!');
    console.log('Client 2: client2@greenconstruction.et / Client123!');

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
