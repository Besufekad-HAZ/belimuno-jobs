const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "../.env" });

async function addPerformanceIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/belimuno", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("🗄️  Connected to MongoDB");

    const db = mongoose.connection.db;

    // Users Collection Indexes
    console.log("📊 Creating indexes for users collection...");
    await db.collection("users").createIndex({ role: 1, isVerified: 1, isActive: 1 });
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ createdAt: -1 });
    await db.collection("users").createIndex({ "profile.skills": 1 });
    await db.collection("users").createIndex({ region: 1, role: 1, isVerified: 1 });

    // Jobs Collection Indexes
    console.log("📊 Creating indexes for jobs collection...");
    await db.collection("jobs").createIndex({ status: 1, createdAt: -1 });
    await db.collection("jobs").createIndex({ client: 1, status: 1 });
    await db.collection("jobs").createIndex({ worker: 1, status: 1 });
    await db.collection("jobs").createIndex({ region: 1, status: 1 });
    await db.collection("jobs").createIndex({ category: 1, status: 1 });
    await db.collection("jobs").createIndex({ requiredSkills: 1, status: 1 });
    await db.collection("jobs").createIndex({ createdAt: -1 });

    // Applications Collection Indexes
    console.log("📊 Creating indexes for applications collection...");
    await db.collection("applications").createIndex({ job: 1, worker: 1 }, { unique: true });
    await db.collection("applications").createIndex({ worker: 1, status: 1, appliedAt: -1 });
    await db.collection("applications").createIndex({ job: 1, status: 1, appliedAt: -1 });
    await db.collection("applications").createIndex({ status: 1, appliedAt: -1 });

    // Payments Collection Indexes
    console.log("📊 Creating indexes for payments collection...");
    await db.collection("payments").createIndex({ payer: 1, status: 1, createdAt: -1 });
    await db.collection("payments").createIndex({ recipient: 1, status: 1, createdAt: -1 });
    await db.collection("payments").createIndex({ job: 1 });
    await db.collection("payments").createIndex({ status: 1, createdAt: -1 });
    await db.collection("payments").createIndex({ transactionId: 1 }, { unique: true, sparse: true });

    // Notifications Collection Indexes
    console.log("📊 Creating indexes for notifications collection...");
    await db.collection("notifications").createIndex({ recipient: 1, isRead: 1, createdAt: -1 });
    await db.collection("notifications").createIndex({ recipient: 1, createdAt: -1 });
    await db.collection("notifications").createIndex({ type: 1, createdAt: -1 });
    await db.collection("notifications").createIndex({ createdAt: -1 });

    // Disputes Collection Indexes
    console.log("📊 Creating indexes for disputes collection...");
    await db.collection("disputes").createIndex({ worker: 1, status: 1, createdAt: -1 });
    await db.collection("disputes").createIndex({ client: 1, status: 1, createdAt: -1 });
    await db.collection("disputes").createIndex({ job: 1 });
    await db.collection("disputes").createIndex({ status: 1, priority: 1, createdAt: -1 });

    // Reviews Collection Indexes
    console.log("📊 Creating indexes for reviews collection...");
    await db.collection("reviews").createIndex({ reviewer: 1, reviewee: 1 });
    await db.collection("reviews").createIndex({ job: 1 });
    await db.collection("reviews").createIndex({ reviewee: 1, rating: 1 });

    console.log("✅ All performance indexes created successfully!");

    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
    process.exit(1);
  }
}

addPerformanceIndexes();

