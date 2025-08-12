const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load models
const User = require('./models/User');
const Region = require('./models/Region');
const Job = require('./models/Job');
const Application = require('./models/Application');
const Escalation = require('./models/Escalation');
const Notification = require('./models/Notification');
const Payment = require('./models/Payment');
const Report = require('./models/Report');
const Review = require('./models/Review');

// Load env vars
dotenv.config({ path: './.env' });

const seedTestData = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('🌱 Starting to seed test data...');

    // Clear existing data (start from scratch)
    await Promise.all([
      User.deleteMany({}),
      Region.deleteMany({}),
      Job.deleteMany({}),
      // Related/auxiliary collections
      Application.deleteMany({}).catch(() => {}),
      Escalation.deleteMany({}).catch(() => {}),
      Notification.deleteMany({}).catch(() => {}),
      Payment.deleteMany({}).catch(() => {}),
      Report.deleteMany({}).catch(() => {}),
      Review.deleteMany({}).catch(() => {}),
    ]);

    console.log('🗑️  Cleared existing data');

    // Create regions
    const regions = [
      {
        name: 'Addis Ababa',
        code: 'ETH-AA',
        description: 'Capital city region',
        country: 'Ethiopia',
        city: 'Addis Ababa',
        coordinates: {
          latitude: 9.0192,
          longitude: 38.7525
        }
      },
      {
        name: 'Oromia',
        code: 'ETH-OR',
        description: 'Oromia region',
        country: 'Ethiopia',
        coordinates: {
          latitude: 8.5000,
          longitude: 39.5000
        }
      },
      {
        name: 'Amhara',
        code: 'ETH-AM',
        description: 'Amhara region',
        country: 'Ethiopia',
        coordinates: {
          latitude: 11.5000,
          longitude: 37.5000
        }
      }
    ];

    const createdRegions = await Region.insertMany(regions);
    console.log(`✅ Created ${createdRegions.length} regions`);

    // Create users
  const strongTestPassword = 'Belimuno#2025!';
  const hashedPassword = await bcrypt.hash(strongTestPassword, 12);

    const users = [
      // Super Admins
      { name: 'Super Admin One', email: 'admin1@belimuno.com', password: hashedPassword, role: 'super_admin', isVerified: true, isActive: true },
      { name: 'Super Admin Two', email: 'admin2@belimuno.com', password: hashedPassword, role: 'super_admin', isVerified: true, isActive: true },
      // Admins
      { name: 'Admin HR', email: 'admin.hr@belimuno.com', password: hashedPassword, role: 'admin_hr', region: createdRegions[0]._id, isVerified: true, isActive: true },
      { name: 'Admin Outsource', email: 'admin.outsource@belimuno.com', password: hashedPassword, role: 'admin_outsource', region: createdRegions[1]._id, isVerified: true, isActive: true },
      {
        name: 'John Doe',
        email: 'worker1@belimuno.com',
        password: hashedPassword,
        role: 'worker',
        region: createdRegions[0]._id,
        isVerified: true,
        isActive: true,
        workerProfile: {
          skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
          experience: 'intermediate',
          hourlyRate: 25,
          availability: 'freelance',
          rating: 4.5,
          totalJobs: 15,
          completedJobs: 12
        }
      },
      {
        name: 'Jane Smith',
        email: 'worker2@belimuno.com',
        password: hashedPassword,
        role: 'worker',
        region: createdRegions[0]._id,
        isVerified: true,
        isActive: true,
        workerProfile: {
          skills: ['Python', 'Django', 'PostgreSQL', 'AWS'],
          experience: 'expert',
          hourlyRate: 40,
          availability: 'part-time',
          rating: 4.8,
          totalJobs: 25,
          completedJobs: 22
        }
      },
      {
        name: 'Ahmed Hassan',
        email: 'worker3@belimuno.com',
        password: hashedPassword,
        role: 'worker',
        region: createdRegions[1]._id,
        isVerified: false,
        isActive: true,
        workerProfile: {
          skills: ['Graphic Design', 'Adobe Photoshop', 'Illustrator'],
          experience: 'intermediate',
          hourlyRate: 20,
          availability: 'freelance',
          rating: 4.2,
          totalJobs: 8,
          completedJobs: 7
        }
      },
      {
        name: 'Tech Solutions Ltd',
        email: 'client1@belimuno.com',
        password: hashedPassword,
        role: 'client',
        region: createdRegions[0]._id,
        isVerified: true,
        isActive: true,
        clientProfile: {
          companyName: 'Tech Solutions Ltd',
          industry: 'Technology',
          website: 'https://techsolutions.et',
          totalJobsPosted: 10,
          totalAmountSpent: 15000
        }
      },
      {
        name: 'Creative Agency',
        email: 'client2@belimuno.com',
        password: hashedPassword,
        role: 'client',
        region: createdRegions[0]._id,
        isVerified: true,
        isActive: true,
        clientProfile: {
          companyName: 'Creative Agency',
          industry: 'Marketing',
          website: 'https://creative.et',
          totalJobsPosted: 5,
          totalAmountSpent: 8000
        }
      },
      {
        name: 'Local Business',
        email: 'client3@belimuno.com',
        password: hashedPassword,
        role: 'client',
        region: createdRegions[1]._id,
        isVerified: true,
        isActive: true,
        clientProfile: {
          companyName: 'Local Business',
          industry: 'Retail',
          totalJobsPosted: 3,
          totalAmountSpent: 3000
        }
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    // No area managers in the new model

    // Create sample jobs
    const clients = createdUsers.filter(u => u.role === 'client');
    const workers = createdUsers.filter(u => u.role === 'worker');

    const jobs = [
      {
        title: 'E-commerce Website Development',
        description: 'Build a modern e-commerce website with React and Node.js. Should include user authentication, product catalog, shopping cart, and payment integration.',
        category: 'Technology',
        subcategory: 'Web Development',
        budget: 5000,
        budgetType: 'fixed',
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        client: clients[0]._id,
        region: createdRegions[0]._id,
        requiredSkills: ['React', 'Node.js', 'MongoDB', 'JavaScript'],
        experienceLevel: 'intermediate',
        status: 'posted',
        priority: 'high'
      },
      {
        title: 'Mobile App UI/UX Design',
        description: 'Design user interface and user experience for a mobile application. Should include wireframes, mockups, and interactive prototypes.',
        category: 'Design',
        subcategory: 'UI/UX Design',
        budget: 2500,
        budgetType: 'fixed',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        client: clients[1]._id,
        region: createdRegions[0]._id,
        requiredSkills: ['Figma', 'Adobe XD', 'UI Design', 'UX Research'],
        experienceLevel: 'intermediate',
        status: 'posted',
        priority: 'medium'
      },
      {
        title: 'Data Analysis and Visualization',
        description: 'Analyze sales data and create interactive dashboards using Python and visualization libraries.',
        category: 'Technology',
        subcategory: 'Data Science',
        budget: 3000,
        budgetType: 'fixed',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        client: clients[0]._id,
        worker: workers[1]._id,
        region: createdRegions[0]._id,
        requiredSkills: ['Python', 'Pandas', 'Matplotlib', 'SQL'],
        experienceLevel: 'expert',
        status: 'assigned',
        priority: 'medium'
      },
      {
        title: 'Logo and Brand Identity Design',
        description: 'Create a complete brand identity package including logo, color palette, typography, and brand guidelines.',
        category: 'Design',
        subcategory: 'Brand Design',
        budget: 1500,
        budgetType: 'fixed',
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        client: clients[2]._id,
        region: createdRegions[1]._id,
        requiredSkills: ['Adobe Illustrator', 'Brand Design', 'Logo Design'],
        experienceLevel: 'intermediate',
        status: 'posted',
        priority: 'low'
      },
      {
        title: 'WordPress Website Maintenance',
        description: 'Regular maintenance and updates for WordPress website including security updates, content updates, and performance optimization.',
        category: 'Technology',
        subcategory: 'Web Development',
        budget: 800,
        budgetType: 'fixed',
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        client: clients[2]._id,
        worker: workers[0]._id,
        region: createdRegions[1]._id,
        requiredSkills: ['WordPress', 'PHP', 'MySQL'],
        experienceLevel: 'entry',
        status: 'completed',
        priority: 'low',
        completionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        payment: {
          totalAmount: 800,
          paidAmount: 800,
          paymentStatus: 'paid',
          workerEarnings: 720 // After platform fee
        },
        review: {
          clientReview: {
            rating: 5,
            comment: 'Excellent work! Very professional and delivered on time.',
            reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          }
        }
      }
    ];

    const createdJobs = await Job.insertMany(jobs);
    console.log(`✅ Created ${createdJobs.length} jobs`);

    console.log('\n🎉 Test data seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • ${createdRegions.length} regions created`);
    console.log(`   • ${createdUsers.length} users created`);
    console.log(`   • ${createdJobs.length} jobs created`);

    console.log('\n👥 Test Users Created:');
    console.log('   Super Admins: admin1@belimuno.com, admin2@belimuno.com');
    console.log('   Admins: admin.hr@belimuno.com (HR), admin.outsource@belimuno.com (Outsource)');
    console.log('   Workers: worker1@belimuno.com, worker2@belimuno.com, worker3@belimuno.com');
    console.log('   Clients: client1@belimuno.com, client2@belimuno.com, client3@belimuno.com');
    console.log(`   Password for all: ${strongTestPassword}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedTestData();
