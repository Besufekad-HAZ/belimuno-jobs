const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const https = require("https");
const User = require("../models/User");
const Region = require("../models/Region");
const ErrorResponse = require("../utils/errorResponse");
const { generateToken, generateShortToken } = require("../utils/jwtUtils");
const {
	sendPasswordResetEmail,
	sendPasswordResetSuccessEmail,
} = require("../utils/emailService");
const dns = require("dns");
// Prefer IPv4 results first to avoid IPv6 connectivity issues in some environments (e.g., WSL)
try {
	if (dns.setDefaultResultOrder) dns.setDefaultResultOrder("ipv4first");
} catch {}

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
	try {
		const { name, email, password, role } = req.body;

		// Check if user already exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: "User already exists with this email",
			});
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Create user object
		const userData = {
			name,
			email,
			password: hashedPassword,
			role,
			isVerified: true, // Auto-verify all users for testing (can be changed to false for production)
		};

		// Create user
		const user = await User.create(userData);

		// Generate JWT token
		const token = generateToken({ id: user._id });

		// Remove password from response
		user.password = undefined;

		res.status(201).json({
			success: true,
			message: "User registered successfully",
			token,
			user,
		});
	} catch (error) {
		console.error("Registration error:", error);
		res.status(500).json({
			success: false,
			message: "Error creating user",
			error: error.message,
		});
	}
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		// Find user and include password for comparison
		const user = await User.findOne({ email }).select("+password");
		// .populate("region")
		// .populate("workerProfile.education")
		// .populate("workerProfile.workHistory");

		if (!user) {
			return res.status(401).json({
				success: false,
				message: "No account found with this email.",
			});
		}

		// Check password
		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			return res.status(401).json({
				success: false,
				message: "Incorrect password.",
			});
		}

		// Check if user is active
		if (!user.isActive) {
			return res.status(401).json({
				success: false,
				message: "Account has been deactivated. Please contact support.",
			});
		}

		// Update last login
		user.lastLogin = new Date();
		await user.save();

		// Generate JWT token
		const token = generateToken({ id: user._id });

		// Remove password from response
		user.password = undefined;

		res.status(200).json({
			success: true,
			message: "Login successful",
			token,
			user,
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({
			success: false,
			message: "Error during login",
			error: error.message,
		});
	}
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
	res.status(200).json({
		success: true,
		message: "Logged out successfully",
	});
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
	try {
		const user = await User.findById(req.user.id);
		// .populate("region")
		// .populate("workerProfile.education")
		// .populate("workerProfile.workHistory");

		res.status(200).json({
			success: true,
			user,
		});
	} catch (error) {
		console.error("Get me error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching user data",
			error: error.message,
		});
	}
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
	try {
		// Build update operators to better control nested merges and unsets
		const updateOps = { $set: {}, $unset: {} };

		if (req.body.name !== undefined) updateOps.$set.name = req.body.name;
		if (req.body.notifications !== undefined)
			updateOps.$set.notifications = req.body.notifications;
		if (req.body.region !== undefined) updateOps.$set.region = req.body.region; // Allow updating region

		// Profile: deep-merge with existing, and support explicit CV deletion when null is sent
		if (req.body.profile !== undefined) {
			const currentUser = await User.findById(req.user.id);
			const currentProfile =
				currentUser && currentUser.profile
					? typeof currentUser.profile.toObject === "function"
						? currentUser.profile.toObject()
						: currentUser.profile
					: {};
			const incomingProfile = req.body.profile || {};

			// Explicitly set/update individual profile fields that may come from CV builder
			if (Object.prototype.hasOwnProperty.call(incomingProfile, "phone"))
				updateOps.$set["profile.phone"] = incomingProfile.phone;
			if (Object.prototype.hasOwnProperty.call(incomingProfile, "location"))
				updateOps.$set["profile.location"] = incomingProfile.location;
			if (Object.prototype.hasOwnProperty.call(incomingProfile, "bio"))
				updateOps.$set["profile.bio"] = incomingProfile.bio;
			if (Object.prototype.hasOwnProperty.call(incomingProfile, "skills"))
				updateOps.$set["profile.skills"] = incomingProfile.skills;
			if (Object.prototype.hasOwnProperty.call(incomingProfile, "experience"))
				updateOps.$set["profile.experience"] = incomingProfile.experience;
			if (Object.prototype.hasOwnProperty.call(incomingProfile, "hourlyRate"))
				updateOps.$set["profile.hourlyRate"] = incomingProfile.hourlyRate;
			if (Object.prototype.hasOwnProperty.call(incomingProfile, "address"))
				updateOps.$set["profile.address"] = incomingProfile.address;

			// Track explicit CV deletion intent
			let shouldUnsetCv = false;
			if (
				Object.prototype.hasOwnProperty.call(incomingProfile, "cv") &&
				incomingProfile.cv === null
			) {
				updateOps.$unset["profile.cv"] = "";
				shouldUnsetCv = true;
			} else if (incomingProfile.cv !== undefined) {
				// If CV is provided, ensure it's a valid object before setting
				if (incomingProfile.cv === null) {
					updateOps.$unset["profile.cv"] = "";
				} else if (
					typeof incomingProfile.cv === "object" &&
					incomingProfile.cv !== null
				) {
					updateOps.$set["profile.cv"] = incomingProfile.cv;
				} else {
					console.warn("Invalid CV data format received in updateProfile");
				}
			}

			// Remove fields that are being explicitly set or handled separately to avoid overwriting
			delete incomingProfile.phone;
			delete incomingProfile.location;
			delete incomingProfile.bio;
			delete incomingProfile.skills;
			delete incomingProfile.experience;
			delete incomingProfile.hourlyRate;
			delete incomingProfile.address;
			delete incomingProfile.cv;

			// Merge remaining top-level profile fields (e.g., firstName, lastName, avatar)
			const mergedProfile = { ...currentProfile, ...incomingProfile };

			// If there are still fields in mergedProfile, update the entire profile object
			if (Object.keys(mergedProfile).length > 0) {
				updateOps.$set.profile = mergedProfile;
			} else if (
				Object.keys(incomingProfile).length === 0 &&
				!shouldUnsetCv &&
				Object.keys(updateOps.$set).every((key) => !key.startsWith("profile."))
			) {
				// If incomingProfile is empty and no specific nested fields were updated, and no CV unset, do nothing with profile to avoid unintentional full replacement
				delete updateOps.$set.profile;
			}
		}

		// Update worker-specific profile fields explicitly
		if (req.body.workerProfile !== undefined) {
			// This should now contain education and workHistory
			updateOps.$set.workerProfile = {
				...(req.user.workerProfile ? req.user.workerProfile.toObject() : {}),
				...req.body.workerProfile,
			};
		}
		if (req.body.clientProfile) {
			updateOps.$set.clientProfile = {
				...(req.user.clientProfile ? req.user.clientProfile.toObject() : {}),
				...req.body.clientProfile,
			};
		}

		// Cleanup empty operators
		if (Object.keys(updateOps.$set).length === 0) delete updateOps.$set;
		if (Object.keys(updateOps.$unset).length === 0) delete updateOps.$unset;

		const user = await User.findByIdAndUpdate(req.user.id, updateOps, {
			new: true,
			runValidators: true,
		});

		res.status(200).json({
			success: true,
			message: "Profile updated successfully",
			user,
		});
	} catch (error) {
		console.error("Update profile error:", error);
		res.status(500).json({
			success: false,
			message: "Error updating profile",
			error: error.message,
		});
	}
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res, next) => {
	try {
		const { currentPassword, newPassword } = req.body;

		// Get user with password
		const user = await User.findById(req.user.id).select("+password");

		// Check current password
		const isCurrentPasswordValid = await bcrypt.compare(
			currentPassword,
			user.password
		);

		if (!isCurrentPasswordValid) {
			return res.status(400).json({
				success: false,
				message: "Current password is incorrect",
			});
		}

		// Hash new password
		const hashedNewPassword = await bcrypt.hash(newPassword, 12);

		// Update password
		user.password = hashedNewPassword;
		await user.save();

		res.status(200).json({
			success: true,
			message: "Password changed successfully",
		});
	} catch (error) {
		console.error("Change password error:", error);
		res.status(500).json({
			success: false,
			message: "Error changing password",
			error: error.message,
		});
	}
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
	try {
		const { email } = req.body;

		const user = await User.findOne({ email });

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "No user found with this email",
			});
		}

		// Generate reset token using crypto for better security
		const resetToken = crypto.randomBytes(32).toString("hex");

		// Hash the token and set expiration (10 minutes from now)
		const hashedToken = crypto
			.createHash("sha256")
			.update(resetToken)
			.digest("hex");
		const resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

		// Save token and expiration to user
		user.resetPasswordToken = hashedToken;
		user.resetPasswordExpire = resetPasswordExpire;
		await user.save();

		try {
			// Send password reset email
			await sendPasswordResetEmail(email, resetToken, user.name);

			res.status(200).json({
				success: true,
				message: "Password reset instructions sent to your email",
				// Always return token in development for testing
				resetToken:
					process.env.NODE_ENV === "development" ? resetToken : undefined,
			});
		} catch (emailError) {
			console.error("❌ Email sending failed:", emailError);

			// Check if it's a configuration issue
			const isEmailConfigured =
				process.env.SMTP_USER &&
				process.env.SMTP_USER !== "your-email@gmail.com" &&
				process.env.SMTP_PASS &&
				process.env.SMTP_PASS !== "your-app-password";

			// Clear the reset token if email fails
			user.resetPasswordToken = undefined;
			user.resetPasswordExpire = undefined;
			await user.save();

			if (!isEmailConfigured) {
				res.status(500).json({
					success: false,
					message:
						"Email service not configured. Please contact support or check console for reset link.",
					// In development, return the reset token for testing
					resetToken:
						process.env.NODE_ENV === "development" ? resetToken : undefined,
				});
			} else {
				res.status(500).json({
					success: false,
					message:
						"Failed to send password reset email. Please try again later.",
					// In development, return the reset token for testing even on email failure
					resetToken:
						process.env.NODE_ENV === "development" ? resetToken : undefined,
				});
			}
		}
	} catch (error) {
		console.error("Forgot password error:", error);
		res.status(500).json({
			success: false,
			message: "Error processing forgot password request",
			error: error.message,
		});
	}
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
	try {
		const { token } = req.params;
		const { password } = req.body;

		// Hash the token to compare with stored token
		const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

		// Find user with valid reset token
		const user = await User.findOne({
			resetPasswordToken: hashedToken,
			resetPasswordExpire: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(400).json({
				success: false,
				message: "Invalid or expired reset token",
			});
		}

		// Hash new password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Update password and clear reset token
		user.password = hashedPassword;
		user.resetPasswordToken = undefined;
		user.resetPasswordExpire = undefined;
		await user.save();

		try {
			// Send success email
			await sendPasswordResetSuccessEmail(user.email, user.name);
		} catch (emailError) {
			console.error("Failed to send success email:", emailError);
			// Don't fail the reset if email fails
		}

		res.status(200).json({
			success: true,
			message: "Password reset successfully",
		});
	} catch (error) {
		console.error("Reset password error:", error);
		res.status(500).json({
			success: false,
			message: "Error resetting password",
			error: error.message,
		});
	}
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res, next) => {
	try {
		const { token } = req.params;

		// Verify token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		// Find user
		const user = await User.findById(decoded.id);

		if (!user) {
			return res.status(400).json({
				success: false,
				message: "Invalid verification token",
			});
		}

		// Mark user as verified
		user.isVerified = true;
		await user.save();

		res.status(200).json({
			success: true,
			message: "Email verified successfully",
		});
	} catch (error) {
		console.error("Verify email error:", error);

		if (
			error.name === "JsonWebTokenError" ||
			error.name === "TokenExpiredError"
		) {
			return res.status(400).json({
				success: false,
				message: "Invalid or expired verification token",
			});
		}

		res.status(500).json({
			success: false,
			message: "Error verifying email",
			error: error.message,
		});
	}
};

// @desc    Resend email verification
// @route   POST /api/auth/resend-verification
// @access  Private
const resendVerification = async (req, res, next) => {
	try {
		if (req.user.isVerified) {
			return res.status(400).json({
				success: false,
				message: "Email is already verified",
			});
		}

		// Generate verification token
		const verificationToken = generateShortToken({ id: req.user._id }, "24h");

		// In a real application, you would send this token via email
		console.log(
			`Email verification token for ${req.user.email}: ${verificationToken}`
		);

		res.status(200).json({
			success: true,
			message: "Verification email sent",
			// Remove this in production - only for development
			verificationToken:
				process.env.NODE_ENV === "development" ? verificationToken : undefined,
		});
	} catch (error) {
		console.error("Resend verification error:", error);
		res.status(500).json({
			success: false,
			message: "Error sending verification email",
			error: error.message,
		});
	}
};

module.exports = {
	register,
	login,
	logout,
	getMe,
	updateProfile,
	changePassword,
	forgotPassword,
	resetPassword,
	verifyEmail,
	resendVerification,
	googleAuth,
};

/**
 * Google OAuth: verify ID token without external deps using tokeninfo endpoint
 */
async function verifyGoogleIdToken(idToken) {
	const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
		idToken
	)}`;
	return new Promise((resolve, reject) => {
		const req = https.get(url, (res) => {
			let data = "";
			res.on("data", (chunk) => (data += chunk));
			res.on("end", () => {
				try {
					const payload = JSON.parse(data);
					if (payload.error_description || payload.error)
						return reject(
							new Error(payload.error_description || payload.error)
						);
					resolve(payload);
				} catch (e) {
					reject(e);
				}
			});
		});
		req.on("timeout", () => {
			req.destroy(new Error("ETIMEDOUT"));
		});
		req.on("error", async (err) => {
			// Optional dev fallback (offline verify) when network is blocked
			if (process.env.GOOGLE_OFFLINE_VERIFY === "true") {
				try {
					const decoded = jwt.decode(idToken) || {};
					if (!decoded || typeof decoded !== "object") return reject(err);
					// Minimal checks
					const now = Math.floor(Date.now() / 1000);
					if (decoded.exp && now > decoded.exp)
						return reject(new Error("Token expired"));
					if (!decoded.aud) return reject(new Error("Missing audience"));
					resolve({
						aud: decoded.aud,
						email: decoded.email,
						email_verified:
							decoded.email_verified || decoded.email_verified === "true",
						name: decoded.name,
						picture: decoded.picture,
						iss: decoded.iss,
					});
					return;
				} catch (e) {
					return reject(err);
				}
			}
			reject(err);
		});
		req.end();
	});
}

// @desc    Google login/register
// @route   POST /api/auth/google
// @access  Public
async function googleAuth(req, res) {
	try {
		const { credential, role } = req.body || {};
		if (!credential) {
			return res
				.status(400)
				.json({ success: false, message: "Missing Google credential" });
		}

		let googlePayload;
		try {
			googlePayload = await verifyGoogleIdToken(credential);
		} catch (err) {
			console.error("Google auth verify error:", err);
			const allowOffline =
				process.env.GOOGLE_OFFLINE_VERIFY === "true" ||
				(process.env.NODE_ENV || "development") !== "production";
			if (allowOffline) {
				try {
					const decoded = jwt.decode(credential) || {};
					const now = Math.floor(Date.now() / 1000);
					if (!decoded || typeof decoded !== "object") throw err;
					if (decoded.exp && now > decoded.exp)
						throw new Error("Token expired");
					googlePayload = {
						aud: decoded.aud,
						email: decoded.email,
						email_verified:
							decoded.email_verified || decoded.email_verified === "true",
						name: decoded.name,
						picture: decoded.picture,
					};
					console.warn(
						"Google auth: using offline JWT decode fallback (dev mode)."
					);
				} catch (e) {
					return res.status(400).json({
						success: false,
						message: "Invalid Google credential. Please try again.",
						error: (e && e.message) || "decode_failed",
					});
				}
			} else {
				return res.status(503).json({
					success: false,
					message:
						"Unable to verify Google token (network). Please try again later.",
					error: err.message,
				});
			}
		}
		const audience = googlePayload.aud;
		const expectedStr = (
			process.env.GOOGLE_CLIENT_ID ||
			process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
			process.env.GOOGLE_CLIENT_IDS ||
			""
		).trim();
		const expectedList = expectedStr
			? expectedStr
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean)
			: [];

		const isProd = (process.env.NODE_ENV || "development") === "production";
		const offlineVerify = process.env.GOOGLE_OFFLINE_VERIFY === "true";

		if (expectedList.length === 0) {
			if (!isProd || offlineVerify) {
				console.warn(
					"Google auth: GOOGLE_CLIENT_ID not set; skipping audience check in development/offline mode."
				);
			} else {
				return res.status(500).json({
					success: false,
					message: "Server misconfiguration: GOOGLE_CLIENT_ID not set",
				});
			}
		} else if (!expectedList.includes(audience)) {
			if (!isProd || offlineVerify) {
				console.warn(
					`Google auth: token audience ${audience} not in expected list [${expectedList.join(
						", "
					)}]; allowing in development/offline mode.`
				);
			} else {
				return res.status(401).json({
					success: false,
					message: "Invalid token audience",
					expected: expectedList,
					received: audience,
				});
			}
		}
		const emailVerified =
			googlePayload.email_verified === true ||
			googlePayload.email_verified === "true";
		if (!emailVerified) {
			return res
				.status(401)
				.json({ success: false, message: "Google email not verified" });
		}

		const email = googlePayload.email;
		const name = googlePayload.name || email.split("@")[0];
		const picture = googlePayload.picture;

		let user = await User.findOne({ email });
		if (!user) {
			// If role provided and allowed, create a new account (Google sign-up)
			const allowedSignupRoles = ["worker", "client"];
			if (role && allowedSignupRoles.includes(role)) {
				const randomPassword = crypto.randomBytes(16).toString("hex");
				const hashedPassword = await bcrypt.hash(randomPassword, 12);
				const profile = { avatar: picture };
				user = await User.create({
					name,
					email,
					password: hashedPassword,
					role,
					profile,
					isVerified: true,
				});
			} else {
				return res.status(404).json({
					success: false,
					message:
						"No account found for this Google email. Please sign up first or select a role to create an account.",
				});
			}
		} else {
			if (!user.isActive) {
				return res.status(401).json({
					success: false,
					message: "Account has been deactivated. Please contact support.",
				});
			}
			// Ensure avatar gets updated if empty
			if (picture && (!user.profile || !user.profile.avatar)) {
				user.profile = user.profile || {};
				user.profile.avatar = picture;
				await user.save();
			}
		}

		const token = generateToken({ id: user._id });
		user.password = undefined;
		res
			.status(200)
			.json({ success: true, message: "Google login successful", token, user });
	} catch (error) {
		console.error("Google auth error:", error);
		res.status(500).json({
			success: false,
			message: "Error during Google authentication",
			error: error.message,
		});
	}
}
