const axios = require("axios");
const colors = require("colors");

// Configuration
const BASE_URL = "http://localhost:5001/api";
const authTokens = {
	superAdmin: null,
	adminHr: null,
	adminOutsource: null,
	worker: null,
	client: null,
	// areaManager: null, // Removed - role no longer exists
};

// Test data
const testUsers = {
	superAdmin: {
		name: "Super Admin",
		email: "admin@belimuno.com",
		password: "SuperAdmin123!",
		role: "super_admin",
	},
	worker: {
		name: "Test Worker",
		email: "worker@belimuno.com",
		password: "Worker123!",
		role: "worker",
		workerProfile: {
			skills: ["JavaScript", "Node.js", "React"],
			experience: "intermediate",
			hourlyRate: 25,
		},
	},
	client: {
		name: "Test Client",
		email: "client@belimuno.com",
		password: "Client123!",
		role: "client",
		clientProfile: {
			companyName: "Test Company",
			industry: "Technology",
		},
	},
};

// Helper functions
const makeRequest = async (method, endpoint, data = null, token = null) => {
	try {
		const config = {
			method,
			url: `${BASE_URL}${endpoint}`,
			headers: {},
		};

		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		if (data) {
			config.data = data;
		}

		const response = await axios(config);
		return { success: true, data: response.data, status: response.status };
	} catch (error) {
		return {
			success: false,
			error: error.response?.data?.message || error.message,
			status: error.response?.status || 500,
		};
	}
};

const logTest = (testName, success, message = "") => {
	const status = success ? "✅ PASS".green : "❌ FAIL".red;
	console.log(`${status} ${testName}${message ? ` - ${message}` : ""}`);
};

const logSection = (sectionName) => {
	console.log(`\n${"=".repeat(50)}`.cyan);
	console.log(`Testing: ${sectionName}`.cyan.bold);
	console.log(`${"=".repeat(50)}`.cyan);
};

// Test functions
const testHealthCheck = async () => {
	logSection("Health Check");

	const result = await makeRequest("GET", "/health");
	logTest(
		"Health Check",
		result.success,
		result.success ? "API is running" : result.error
	);

	const apiInfo = await makeRequest("GET", "/");
	logTest(
		"API Info",
		apiInfo.success,
		apiInfo.success ? "API info retrieved" : apiInfo.error
	);
};

const testAuthentication = async () => {
	logSection("Authentication System");

	// Test user registration
	for (const [role, userData] of Object.entries(testUsers)) {
		const result = await makeRequest("POST", "/auth/register", userData);

		if (result.success) {
			authTokens[role] = result.data.token;
			logTest(`Register ${role}`, true, `Token received`);
		} else {
			// Try to login if user already exists
			const loginResult = await makeRequest("POST", "/auth/login", {
				email: userData.email,
				password: userData.password,
			});

			if (loginResult.success) {
				authTokens[role] = loginResult.data.token;
				logTest(`Login ${role}`, true, `Existing user logged in`);
			} else {
				logTest(`Auth ${role}`, false, result.error);
			}
		}
	}

	// Test protected route
	const profileResult = await makeRequest(
		"GET",
		"/auth/me",
		null,
		authTokens.client
	);
	logTest(
		"Get Profile",
		profileResult.success,
		profileResult.success ? "Profile retrieved" : profileResult.error
	);
};

const testJobManagement = async () => {
	logSection("Job Management");

	// Test getting job categories
	const categoriesResult = await makeRequest("GET", "/jobs/categories");
	logTest(
		"Get Job Categories",
		categoriesResult.success,
		categoriesResult.success
			? `${categoriesResult.data.data.length} categories`
			: categoriesResult.error
	);

	// Test getting jobs (public)
	const jobsResult = await makeRequest("GET", "/jobs");
	logTest(
		"Get Jobs (Public)",
		jobsResult.success,
		jobsResult.success ? `${jobsResult.data.count} jobs` : jobsResult.error
	);

	// Test job stats
	const statsResult = await makeRequest("GET", "/jobs/stats");
	logTest(
		"Get Job Stats",
		statsResult.success,
		statsResult.success ? "Stats retrieved" : statsResult.error
	);

	// Test job search
	const searchResult = await makeRequest("GET", "/jobs/search?q=test");
	logTest(
		"Search Jobs",
		searchResult.success,
		searchResult.success
			? `${searchResult.data.count} results`
			: searchResult.error
	);
};

const testClientWorkflow = async () => {
	logSection("Client Workflow");

	if (!authTokens.client) {
		logTest("Client Auth Required", false, "No client token available");
		return;
	}

	// Test client dashboard
	const dashboardResult = await makeRequest(
		"GET",
		"/client/dashboard",
		null,
		authTokens.client
	);
	logTest(
		"Client Dashboard",
		dashboardResult.success,
		dashboardResult.success ? "Dashboard data retrieved" : dashboardResult.error
	);

	// Test creating a job
	const jobData = {
		title: "Test Web Development Job",
		description: "Build a simple website using React and Node.js",
		category: "Technology",
		subcategory: "Web Development",
		budget: 1000,
		budgetType: "fixed",
		deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
		requiredSkills: ["React", "Node.js", "JavaScript"],
		experienceLevel: "intermediate",
		region: "507f1f77bcf86cd799439011", // You might need to create a region first
	};

	const createJobResult = await makeRequest(
		"POST",
		"/client/jobs",
		jobData,
		authTokens.client
	);
	logTest(
		"Create Job",
		createJobResult.success,
		createJobResult.success ? "Job created" : createJobResult.error
	);

	// Test getting client's jobs
	const clientJobsResult = await makeRequest(
		"GET",
		"/client/jobs",
		null,
		authTokens.client
	);
	logTest(
		"Get Client Jobs",
		clientJobsResult.success,
		clientJobsResult.success
			? `${clientJobsResult.data.count} jobs`
			: clientJobsResult.error
	);
};

const testWorkerWorkflow = async () => {
	logSection("Worker Workflow");

	if (!authTokens.worker) {
		logTest("Worker Auth Required", false, "No worker token available");
		return;
	}

	// Test worker dashboard
	const dashboardResult = await makeRequest(
		"GET",
		"/worker/dashboard",
		null,
		authTokens.worker
	);
	logTest(
		"Worker Dashboard",
		dashboardResult.success,
		dashboardResult.success ? "Dashboard data retrieved" : dashboardResult.error
	);

	// Test getting worker's jobs
	const jobsResult = await makeRequest(
		"GET",
		"/worker/jobs",
		null,
		authTokens.worker
	);
	logTest(
		"Get Worker Jobs",
		jobsResult.success,
		jobsResult.success ? `${jobsResult.data.count} jobs` : jobsResult.error
	);

	// Test getting applications
	const applicationsResult = await makeRequest(
		"GET",
		"/worker/applications",
		null,
		authTokens.worker
	);
	logTest(
		"Get Applications",
		applicationsResult.success,
		applicationsResult.success
			? `${applicationsResult.data.count} applications`
			: applicationsResult.error
	);

	// Test getting earnings
	const earningsResult = await makeRequest(
		"GET",
		"/worker/earnings",
		null,
		authTokens.worker
	);
	logTest(
		"Get Earnings",
		earningsResult.success,
		earningsResult.success ? "Earnings data retrieved" : earningsResult.error
	);

	// Test recommended jobs
	const recommendedResult = await makeRequest(
		"GET",
		"/jobs/recommended",
		null,
		authTokens.worker
	);
	logTest(
		"Get Recommended Jobs",
		recommendedResult.success,
		recommendedResult.success
			? `${recommendedResult.data.count} recommendations`
			: recommendedResult.error
	);
};

const testAdminWorkflow = async () => {
	logSection("Super Admin Workflow");

	if (!authTokens.superAdmin) {
		logTest(
			"Super Admin Auth Required",
			false,
			"No super admin token available"
		);
		return;
	}

	// Test admin dashboard
	const dashboardResult = await makeRequest(
		"GET",
		"/admin/dashboard",
		null,
		authTokens.superAdmin
	);
	logTest(
		"Admin Dashboard",
		dashboardResult.success,
		dashboardResult.success ? "Dashboard data retrieved" : dashboardResult.error
	);

	// Test getting all users
	const usersResult = await makeRequest(
		"GET",
		"/admin/users",
		null,
		authTokens.superAdmin
	);
	logTest(
		"Get All Users",
		usersResult.success,
		usersResult.success ? `${usersResult.data.count} users` : usersResult.error
	);

	// Test getting all jobs
	const jobsResult = await makeRequest(
		"GET",
		"/admin/jobs",
		null,
		authTokens.superAdmin
	);
	logTest(
		"Get All Jobs",
		jobsResult.success,
		jobsResult.success ? `${jobsResult.data.count} jobs` : jobsResult.error
	);

	// Test performance metrics
	const performanceResult = await makeRequest(
		"GET",
		"/admin/performance",
		null,
		authTokens.superAdmin
	);
	logTest(
		"Get Admin Performance",
		performanceResult.success,
		performanceResult.success
			? "Performance data retrieved"
			: performanceResult.error
	);

	// Test getting payments
	const paymentsResult = await makeRequest(
		"GET",
		"/admin/payments",
		null,
		authTokens.superAdmin
	);
	logTest(
		"Get All Payments",
		paymentsResult.success,
		paymentsResult.success
			? `${paymentsResult.data.count} payments`
			: paymentsResult.error
	);
};

const testNotificationSystem = async () => {
	logSection("Notification System");

	if (!authTokens.client) {
		logTest(
			"Auth Required",
			false,
			"No token available for notification tests"
		);
		return;
	}

	// Test getting notifications
	const notificationsResult = await makeRequest(
		"GET",
		"/notifications",
		null,
		authTokens.client
	);
	logTest(
		"Get Notifications",
		notificationsResult.success,
		notificationsResult.success
			? `${notificationsResult.data.count} notifications`
			: notificationsResult.error
	);

	// Test notification stats
	const statsResult = await makeRequest(
		"GET",
		"/notifications/stats",
		null,
		authTokens.client
	);
	logTest(
		"Get Notification Stats",
		statsResult.success,
		statsResult.success ? "Stats retrieved" : statsResult.error
	);
};

// Main test runner
const runAllTests = async () => {
	console.log("🚀 Starting Belimuno Jobs API Tests".yellow.bold);
	console.log(`Testing against: ${BASE_URL}`.gray);

	try {
		await testHealthCheck();
		await testAuthentication();
		await testJobManagement();
		await testClientWorkflow();
		await testWorkerWorkflow();
		await testAdminWorkflow();
		await testNotificationSystem();

		console.log("\n" + "=".repeat(50).green);
		console.log("🎉 All tests completed!".green.bold);
		console.log("=".repeat(50).green);
	} catch (error) {
		console.error("\n❌ Test runner error:", error.message.red);
	}
};

// Check if we can reach the server first
const checkServerConnection = async () => {
	try {
		const response = await axios.get(`${BASE_URL}/health`);
		console.log("✅ Server is running and accessible".green);
		return true;
	} catch (error) {
		console.log(
			"❌ Cannot connect to server. Make sure the server is running on port 5000"
				.red
		);
		console.log("   Run: npm start or node server.js".yellow);
		return false;
	}
};

// Run tests
(async () => {
	const serverReachable = await checkServerConnection();
	if (serverReachable) {
		await runAllTests();
	}
})();
