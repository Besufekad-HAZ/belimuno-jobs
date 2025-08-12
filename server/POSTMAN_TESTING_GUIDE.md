# 📡 Postman Testing Guide for Belimuno Jobs API

## 🚀 Quick Setup

### 1. Import Collection
- Import the `postman-collection.json` file into Postman
- Or use the individual endpoints below

### 2. Set Environment Variables
Create a new environment in Postman with these variables:
- `baseUrl`: `http://localhost:5000/api`
- `superAdminToken`: (will be set automatically)
- `adminHrToken`: (will be set automatically)
- `adminOutsourceToken`: (will be set automatically)
- `workerToken`: (will be set automatically)
- `clientToken`: (will be set automatically)

### 3. Start Server
```bash
cd server
npm install
npm run seed  # Optional: Add test data
npm start
```

---

## 🧪 Step-by-Step Testing

### STEP 1: Health Check
**GET** `{{baseUrl}}/health`
```json
// No body required
// Expected: 200 OK with server status
```

**GET** `{{baseUrl}}/`
```json
// No body required
// Expected: API info with all endpoints
```

---

### STEP 2: User Registration

#### Register Super Admin
**POST** `{{baseUrl}}/auth/register`
```json
{
  "name": "Super Admin",
  "email": "admin@belimuno.com",
  "password": "SuperAdmin123!",
  "role": "super_admin"
}
```

#### Register Worker
**POST** `{{baseUrl}}/auth/register`
```json
{
  "name": "John Doe",
  "email": "worker@belimuno.com",
  "password": "Worker123!",
  "role": "worker",
  "phone": "+251911234567",
  "region": "507f1f77bcf86cd799439011",
  "workerProfile": {
    "skills": ["JavaScript", "React", "Node.js", "MongoDB"],
    "experience": "intermediate",
    "hourlyRate": 25,
    "availability": "freelance",
    "portfolio": ["https://github.com/johndoe"],
    "languages": ["English", "Amharic"]
  }
}
```

#### Register Client
**POST** `{{baseUrl}}/auth/register`
```json
{
  "name": "Tech Solutions Ltd",
  "email": "client@belimuno.com",
  "password": "Client123!",
  "role": "client",
  "phone": "+251911234568",
  "region": "507f1f77bcf86cd799439011",
  "clientProfile": {
    "companyName": "Tech Solutions Ltd",
    "industry": "Technology",
    "website": "https://techsolutions.et"
  }
}
```

---

### STEP 3: User Login

#### Login Client (Save token for next steps)
**POST** `{{baseUrl}}/auth/login`
```json
{
  "email": "client@belimuno.com",
  "password": "Client123!"
}
```
**Copy the `token` from response and save as `clientToken`**

#### Login Worker
**POST** `{{baseUrl}}/auth/login`
```json
{
  "email": "worker@belimuno.com",
  "password": "Worker123!"
}
```
**Copy the `token` from response and save as `workerToken`**

#### Login Admin
**POST** `{{baseUrl}}/auth/login`
```json
{
  "email": "admin@belimuno.com",
  "password": "SuperAdmin123!"
}
```
**Copy the `token` from response and save as `adminToken`**

---

### STEP 4: Get User Profile
**GET** `{{baseUrl}}/auth/me`
**Headers:** `Authorization: Bearer {{clientToken}}`
```json
// No body required
// Expected: Current user profile data
```

---

### STEP 5: Job Management (Public)

#### Get All Jobs
**GET** `{{baseUrl}}/jobs`
```json
// No auth required
// Expected: List of all public jobs
```

#### Get Job Categories
**GET** `{{baseUrl}}/jobs/categories`
```json
// No auth required
// Expected: Available job categories
```

#### Search Jobs
**GET** `{{baseUrl}}/jobs/search?q=web development`
```json
// No auth required
// Expected: Jobs matching search term
```

#### Get Job Statistics
**GET** `{{baseUrl}}/jobs/stats`
```json
// No auth required
// Expected: Platform job statistics
```

---

### STEP 6: Client Workflow

#### Client Dashboard
**GET** `{{baseUrl}}/client/dashboard`
**Headers:** `Authorization: Bearer {{clientToken}}`
```json
// Expected: Client dashboard with stats and recent activity
```

#### Create Job (Save jobId from response)
**POST** `{{baseUrl}}/client/jobs`
**Headers:** `Authorization: Bearer {{clientToken}}`
```json
{
  "title": "E-commerce Website Development",
  "description": "Build a modern e-commerce website with React and Node.js. Should include user authentication, product catalog, shopping cart, and payment integration.",
  "category": "Technology",
  "subcategory": "Web Development",
  "budget": 5000,
  "budgetType": "fixed",
  "deadline": "2024-03-15T00:00:00.000Z",
  "region": "507f1f77bcf86cd799439011",
  "requiredSkills": ["React", "Node.js", "MongoDB", "JavaScript", "Express"],
  "experienceLevel": "intermediate",
  "priority": "high",
  "estimatedHours": 200,
  "tags": ["urgent", "ecommerce", "fullstack"]
}
```
**Copy the `_id` from response and save as `jobId`**

#### Get Client's Jobs
**GET** `{{baseUrl}}/client/jobs`
**Headers:** `Authorization: Bearer {{clientToken}}`
```json
// Expected: List of client's jobs
```

#### Get Single Job with Applications
**GET** `{{baseUrl}}/client/jobs/{{jobId}}`
**Headers:** `Authorization: Bearer {{clientToken}}`
```json
// Expected: Job details with applications
```

---

### STEP 7: Worker Workflow

#### Worker Dashboard
**GET** `{{baseUrl}}/worker/dashboard`
**Headers:** `Authorization: Bearer {{workerToken}}`
```json
// Expected: Worker dashboard with jobs and earnings
```

#### Apply for Job (Save applicationId from response)
**POST** `{{baseUrl}}/jobs/{{jobId}}/apply`
**Headers:** `Authorization: Bearer {{workerToken}}`
```json
{
  "proposal": "I am excited to work on your e-commerce project. With 5+ years of experience in React and Node.js, I can deliver a high-quality, scalable solution. I've built similar platforms before and understand the complexities of payment integration and user management.",
  "proposedBudget": 4800,
  "estimatedDuration": "6-8 weeks",
  "coverLetter": "I specialize in full-stack JavaScript development and have extensive experience with e-commerce platforms. I can provide you with a modern, responsive, and secure solution."
}
```
**Copy the `_id` from response and save as `applicationId`**

#### Get Worker Applications
**GET** `{{baseUrl}}/worker/applications`
**Headers:** `Authorization: Bearer {{workerToken}}`
```json
// Expected: List of worker's applications
```

#### Get Worker Jobs
**GET** `{{baseUrl}}/worker/jobs`
**Headers:** `Authorization: Bearer {{workerToken}}`
```json
// Expected: List of assigned jobs
```

---

### STEP 8: Client Reviews Application

#### Accept Worker Application
**PUT** `{{baseUrl}}/client/jobs/{{jobId}}/applications/{{applicationId}}/accept`
**Headers:** `Authorization: Bearer {{clientToken}}`
```json
{
  "notes": "Great proposal! Looking forward to working with you."
}
```

#### OR Reject Application
**PUT** `{{baseUrl}}/client/jobs/{{jobId}}/applications/{{applicationId}}/reject`
**Headers:** `Authorization: Bearer {{clientToken}}`
```json
{
  "reason": "Thank you for your interest, but we've decided to go with another candidate."
}
```

---

### STEP 9: Worker Updates Job Progress

#### Update Job Status
**PUT** `{{baseUrl}}/worker/jobs/{{jobId}}/status`
**Headers:** `Authorization: Bearer {{workerToken}}`
```json
{
  "status": "in_progress",
  "progressPercentage": 25,
  "updateMessage": "Started working on the project. Completed initial setup and database design.",
  "attachments": ["https://example.com/progress-screenshot.png"]
}
```

#### Submit Job for Review
**PUT** `{{baseUrl}}/worker/jobs/{{jobId}}/status`
**Headers:** `Authorization: Bearer {{workerToken}}`
```json
{
  "status": "submitted",
  "progressPercentage": 100,
  "updateMessage": "Project completed and ready for review. All requirements have been implemented."
}
```

---

### STEP 10: Client Reviews and Completes Job

#### Request Revision
**PUT** `{{baseUrl}}/client/jobs/{{jobId}}/request-revision`
**Headers:** `Authorization: Bearer {{clientToken}}`
```json
{
  "reason": "Please add mobile responsiveness and improve the checkout flow."
}
```

#### OR Mark Job as Completed
**PUT** `{{baseUrl}}/client/jobs/{{jobId}}/complete`
**Headers:** `Authorization: Bearer {{clientToken}}`
```json
{
  "rating": 5,
  "review": "Excellent work! Delivered on time and exceeded expectations."
}
```

---

### STEP 11: Admin Functions

#### Admin Dashboard
**GET** `{{baseUrl}}/admin/dashboard`
**Headers:** `Authorization: Bearer {{adminToken}}`
```json
// Expected: System-wide dashboard with analytics
```

#### Get All Users
**GET** `{{baseUrl}}/admin/users?role=worker&isVerified=false`
**Headers:** `Authorization: Bearer {{adminToken}}`
```json
// Expected: Filtered list of users
```

#### Verify Worker
**PUT** `{{baseUrl}}/admin/verify-worker/{{workerUserId}}`
**Headers:** `Authorization: Bearer {{adminToken}}`
```json
// No body required
// Expected: Worker verification confirmation
```

#### Get Performance Metrics
**GET** `{{baseUrl}}/admin/performance?period=30d`
**Headers:** `Authorization: Bearer {{adminToken}}`
```json
// Expected: System performance data
```

---

### STEP 12: Notifications

#### Get Notifications
**GET** `{{baseUrl}}/notifications`
**Headers:** `Authorization: Bearer {{clientToken}}`
```json
// Expected: User's notifications
```

#### Mark All as Read
**PUT** `{{baseUrl}}/notifications/read-all`
**Headers:** `Authorization: Bearer {{clientToken}}`
```json
// No body required
// Expected: Success confirmation
```

---

## 🔧 Common Issues & Solutions

### Issue: "Not authorized to access this route"
**Solution:** Make sure you're using the correct token for the user role:
- Client endpoints: Use `clientToken`
- Worker endpoints: Use `workerToken`
- Admin endpoints: Use `adminToken`

### Issue: "User already exists"
**Solution:** Use the login endpoint instead of register, or change the email address.

### Issue: "Job not found"
**Solution:** Make sure you've created a job first and are using the correct `jobId`.

### Issue: "Cannot change status"
**Solution:** Check the job status transitions. Jobs must follow the proper workflow.

### Issue: "Region not found"
**Solution:** Either create a region first or use the seeded data with `npm run seed`.

---

## 📋 Test Data (After running `npm run seed`)

### Test Users:
| Role | Email | Password |
|------|--------|----------|
| Super Admin | admin@belimuno.com | Belimuno#2025! |
| Admin HR | admin.hr@belimuno.com | Belimuno#2025! |
| Admin Outsource | admin.outsource@belimuno.com | Belimuno#2025! |
| Worker 1 | worker1@belimuno.com | Belimuno#2025! |
| Worker 2 | worker2@belimuno.com | Belimuno#2025! |
| Worker 3 | worker3@belimuno.com | Belimuno#2025! |
| Client 1 | client1@belimuno.com | Belimuno#2025! |
| Client 2 | client2@belimuno.com | Belimuno#2025! |
| Client 3 | client3@belimuno.com | Belimuno#2025! |

### Sample Region IDs:
- Addis Ababa: `507f1f77bcf86cd799439011` (example ID)
- Oromia: `507f1f77bcf86cd799439012` (example ID)

---

## 🚀 Testing Workflow Summary

1. **Health Check** → Verify API is running
2. **Register Users** → Create accounts for all roles
3. **Login** → Get authentication tokens
4. **Client Creates Job** → Post a new job
5. **Worker Applies** → Submit job application
6. **Client Reviews** → Accept/reject applications
7. **Worker Updates** → Track job progress
8. **Client Completes** → Review and pay
9. **Admin Monitors** → System oversight
10. **Notifications** → Check updates

This covers the complete job lifecycle from posting to completion! 🎉
