const mongoose = require('mongoose');

const RegionSchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true }, // ETH-AA for Addis Ababa
  description: String,

  // Geographic Information
  country: { type: String, default: 'Ethiopia' },
  state: String,
  city: String,
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  timezone: { type: String, default: 'Africa/Addis_Ababa' },

  // Management
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assistantManagers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Work Rules and Policies
  workHourRules: {
    startTime: { type: String, default: '08:00' },
    endTime: { type: String, default: '17:00' },
    maxHoursPerDay: { type: Number, default: 8 },
    workDays: {
      type: [String],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    holidays: [{
      name: String,
      date: Date,
      isRecurring: Boolean
    }]
  },

  // Payment and Compensation
  payRates: {
    currency: { type: String, default: 'ETB' },
    minimum: { type: Number, default: 0 },
    standard: Number,
    overtime: Number,
    skillPremium: [{
      skill: String,
      multiplier: Number // 1.2 for 20% premium
    }]
  },

  // Localization
  language: { type: String, default: 'en' },
  supportedLanguages: [{ type: String, default: ['en', 'am'] }],
  currency: { type: String, default: 'ETB' },

  // Regional Statistics
  stats: {
    totalWorkers: { type: Number, default: 0 },
    activeWorkers: { type: Number, default: 0 },
    totalClients: { type: Number, default: 0 },
    totalJobs: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 }
  },

  // Operational Settings
  settings: {
    autoAssignJobs: { type: Boolean, default: false },
    requireManagerApproval: { type: Boolean, default: true },
    maxJobsPerWorker: { type: Number, default: 5 },
    paymentProcessingDelay: { type: Number, default: 24 }, // hours
    disputeResolutionSLA: { type: Number, default: 72 }, // hours

    // Communication preferences
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      defaultLanguage: { type: String, default: 'en' }
    }
  },

  // Service Areas and Specializations
  serviceAreas: [String], // ['tech', 'construction', 'healthcare', etc.]
  specializations: [String],

  // Compliance and Regulations
  compliance: {
    taxRate: { type: Number, default: 0 },
    requiredDocuments: [String],
    regulatoryNotes: String
  },

  // Status and Activity
  isActive: { type: Boolean, default: true },
  isAcceptingNewWorkers: { type: Boolean, default: true },
  isAcceptingNewJobs: { type: Boolean, default: true },

  // Emergency Contacts
  emergencyContacts: [{
    name: String,
    role: String,
    phone: String,
    email: String
  }],

  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
RegionSchema.index({ manager: 1 });
RegionSchema.index({ isActive: 1 });
RegionSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

// Pre-save middleware
RegionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Region', RegionSchema);
