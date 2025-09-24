const axios = require("axios");

const BASE_URL = "http://localhost:5001/api";

const testLogin = async () => {
	try {
		console.log("🧪 Testing login after registration...");

		// Step 1: Register a test user
		console.log("\n1. Registering test user...");
		const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
			name: "Test User",
			email: "test@example.com",
			password: "Test123!",
			role: "client",
			clientProfile: {
				companyName: "Test Company",
				industry: "Technology",
			},
		});

		if (registerResponse.data.success) {
			console.log("✅ Registration successful");
			console.log(
				"Token received:",
				registerResponse.data.token ? "Yes" : "No"
			);
		} else {
			console.log("❌ Registration failed:", registerResponse.data.message);
			return;
		}

		// Step 2: Test login
		console.log("\n2. Testing login...");
		const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
			email: "test@example.com",
			password: "Test123!",
		});

		if (loginResponse.data.success) {
			console.log("✅ Login successful");
			console.log("Token received:", loginResponse.data.token ? "Yes" : "No");
			console.log("User verified:", loginResponse.data.user.isVerified);
		} else {
			console.log("❌ Login failed:", loginResponse.data.message);
			return;
		}

		// Step 3: Test protected endpoint
		console.log("\n3. Testing protected endpoint...");
		const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
			headers: {
				Authorization: `Bearer ${loginResponse.data.token}`,
			},
		});

		if (profileResponse.data.success) {
			console.log("✅ Protected endpoint accessible");
			console.log("User role:", profileResponse.data.user.role);
		} else {
			console.log(
				"❌ Protected endpoint failed:",
				profileResponse.data.message
			);
		}

		console.log(
			"\n🎉 All tests passed! Login and authentication working correctly."
		);
	} catch (error) {
		console.error("❌ Test failed:");
		if (error.response) {
			console.error("Status:", error.response.status);
			console.error("Data:", error.response.data);
		} else {
			console.error("Error:", error.message);
		}
	}
};

// Check if server is running first
const checkServer = async () => {
	try {
		const response = await axios.get(`${BASE_URL}/health`);
		console.log("✅ Server is running");
		return true;
	} catch (error) {
		console.log(
			"❌ Server is not running. Please start the server with: npm start"
		);
		return false;
	}
};

(async () => {
	const serverRunning = await checkServer();
	if (serverRunning) {
		await testLogin();
	}
})();
