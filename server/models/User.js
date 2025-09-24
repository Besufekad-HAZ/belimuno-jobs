const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
	// Basic Information
	name: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },

	// Role and Access
	role: {
		type: String,
		enum: ["super_admin", "admin_hr", "admin_outsource", "worker", "client"],
		required: true,
	},
	region: { type: mongoose.Schema.Types.ObjectId, ref: "Region" },
	isVerified: { type: Boolean, default: false },
	isActive: { type: Boolean, default: true },

	// Profile Information
	profile: {
		firstName: String,
		lastName: String,
		avatar: String,
		bio: String,
		dob: Date,
		cv: {
			name: String,
			mimeType: String,
			data: mongoose.Schema.Types.Mixed, // Allows JSON structure from CV builder or base64 string uploads
		},
		address: {
			street: String,
			city: String,
			region: String,
			country: { type: String, default: "Ethiopia" },
		},
		phone: String,
		location: String,
		skills: [String],
		experience: String,
		hourlyRate: Number,
	},

	// Worker-specific fields (for general worker metadata)
	workerProfile: {
		availability: {
			type: String,
			enum: ["full-time", "part-time", "freelance"],
			default: "freelance",
		},
		portfolio: [String], // URLs to portfolio items
		certifications: [String],
		languages: [String],
		rating: { type: Number, default: 0, min: 0, max: 5 },
		totalJobs: { type: Number, default: 0 },
		completedJobs: { type: Number, default: 0 },
		reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
	},

	// Client-specific fields
	clientProfile: {
		companyName: String,
		industry: String,
		website: String,
		totalJobsPosted: { type: Number, default: 0 },
		totalAmountSpent: { type: Number, default: 0 },
		rating: { type: Number, default: 0, min: 0, max: 5 },
		reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
	},

	// Payment Information
	paymentInfo: {
		// Legacy gateway customer id (no longer used)
		chapaCustomerId: String,
		bankDetails: {
			accountNumber: String,
			bankName: String,
			accountHolderName: String,
		},
		// Wallet removed; payments are handled manually via check
	},

	// Notifications and Preferences
	notifications: {
		email: { type: Boolean, default: true },
		sms: { type: Boolean, default: true },
		push: { type: Boolean, default: true },
	},

	// Password Reset
	resetPasswordToken: String,
	resetPasswordExpire: Date,

	// Activity Tracking
	lastLogin: Date,
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

// Saved jobs for workers (and optionally clients)
UserSchema.add({
	savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
});

// Index for faster queries
UserSchema.index({ role: 1 });
UserSchema.index({ region: 1 });
UserSchema.index({ "workerProfile.rating": -1 });

module.exports = mongoose.model("User", UserSchema);
