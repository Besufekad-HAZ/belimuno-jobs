const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const testRegistration = async () => {
  try {
    console.log('🧪 Testing registration endpoint...');

    // Test 1: Register Super Admin
    console.log('\n1. Testing Super Admin registration...');
    const adminResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Super Admin',
      email: 'admin@belimuno.com',
      password: 'SuperAdmin123!',
      role: 'super_admin'
    });
    console.log('✅ Super Admin registration successful:', adminResponse.data.success);

    // Test 2: Register Client
    console.log('\n2. Testing Client registration...');
    const clientResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Tech Solutions Ltd',
      email: 'client@belimuno.com',
      password: 'Client123!',
      role: 'client',
      clientProfile: {
        companyName: 'Tech Solutions Ltd',
        industry: 'Technology'
      }
    });
    console.log('✅ Client registration successful:', clientResponse.data.success);

    // Test 3: Register Worker
    console.log('\n3. Testing Worker registration...');
    const workerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'John Doe',
      email: 'worker@belimuno.com',
      password: 'Worker123!',
      role: 'worker',
      workerProfile: {
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: 'intermediate',
        hourlyRate: 25
      }
    });
    console.log('✅ Worker registration successful:', workerResponse.data.success);

    // Test 4: Register Area Manager
    console.log('\n4. Testing Area Manager registration...');
    const managerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Area Manager',
      email: 'manager@belimuno.com',
      password: 'Manager123!',
      role: 'area_manager'
    });
    console.log('✅ Area Manager registration successful:', managerResponse.data.success);

    console.log('\n🎉 All registration tests passed!');

    // Test login
    console.log('\n5. Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'client@belimuno.com',
      password: 'Client123!'
    });
    console.log('✅ Login successful:', loginResponse.data.success);
    console.log('Token received:', loginResponse.data.token ? 'Yes' : 'No');

  } catch (error) {
    console.error('❌ Registration test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
};

// Check if server is running first
const checkServer = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start the server with: npm start');
    return false;
  }
};

(async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testRegistration();
  }
})();
