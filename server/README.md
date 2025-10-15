# Belimuno Jobs API

A comprehensive HR outsourcing and job management platform API built with Node.js, Express, and MongoDB.

## 🚀 Features

### Multi-Role System

- **Super Admin**: Complete system oversight, user management, analytics

- **Worker**: Job applications, progress tracking, earnings management
- **Client**: Job posting, worker selection, payment processing

### Core Functionality

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Job Management**: Complete job lifecycle from posting to completion
- **Application System**: Worker applications with approval/rejection workflow
- **Notification System**: Real-time notifications for all user actions
- **Payment Integration**: Ready for Chapa payment gateway integration
- **Regional Management**: Location-based job and worker management
- **Analytics & Reporting**: Comprehensive dashboards and performance metrics

## 📋 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout user

### Jobs (Public)

- `GET /api/jobs` - List all jobs (with filters)
- `GET /api/jobs/:id` - Get single job details
- `GET /api/jobs/categories` - Get job categories
- `GET /api/jobs/search` - Search jobs
- `GET /api/jobs/stats` - Get job statistics
- `POST /api/jobs/:id/apply` - Apply for job (Worker only)

### Client Portal

- `GET /api/client/dashboard` - Client dashboard
- `GET /api/client/jobs` - Get client's jobs
- `POST /api/client/jobs` - Create new job
- `GET /api/client/jobs/:id` - Get job with applications
- `PUT /api/client/jobs/:id` - Update job
- `PUT /api/client/jobs/:jobId/applications/:applicationId/accept` - Accept application
- `PUT /api/client/jobs/:jobId/applications/:applicationId/reject` - Reject application
- `PUT /api/client/jobs/:id/complete` - Mark job as completed
- `PUT /api/client/jobs/:id/request-revision` - Request revision
- `GET /api/client/payments` - Get payment history

### Worker Portal

- `GET /api/worker/dashboard` - Worker dashboard
- `GET /api/worker/jobs` - Get worker's jobs
- `GET /api/worker/jobs/:id` - Get single job details
- `PUT /api/worker/jobs/:id/status` - Update job status/progress
- `GET /api/worker/applications` - Get job applications
- `DELETE /api/worker/applications/:id` - Withdraw application
- `PUT /api/worker/profile` - Update worker profile
- `GET /api/worker/earnings` - Get earnings history

<!-- Area Manager role removed -->

### Super Admin Portal

- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - Get all users (with filters)
- `GET /api/admin/users/:id` - Get single user details
- `PUT /api/admin/users/:id` - Update user
- `PUT /api/admin/users/:id/deactivate` - Deactivate user
- `PUT /api/admin/verify-worker/:id` - Verify worker
- `GET /api/admin/jobs` - Get all jobs
- `GET /api/admin/performance` - System performance metrics
- `GET /api/admin/payments` - Get all payments
- `PUT /api/admin/payments/:id/dispute` - Handle payment disputes

### Notifications

- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/stats` - Get notification statistics
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Environment Variables

Create a `.env` file in the server directory:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/belimuno_jobs
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:3000

# AWS S3 (media uploads)
AWS_S3_BUCKET=belimuno-uploads
AWS_S3_REGION=eu-north-1
AWS_S3_PUBLIC_BASE_URL=https://belimuno-uploads.s3.eu-north-1.amazonaws.com/public
AWS_S3_TEAM_PREFIX=public/team

# IAM user or role credentials with PutObject/DeleteObject permissions
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Optional overrides for custom endpoints (e.g. MinIO)
# AWS_S3_ENDPOINT=https://s3.eu-north-1.amazonaws.com
# AWS_S3_FORCE_PATH_STYLE=false

# Email Configuration (optional)
EMAIL_FROM=noreply@belimuno.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Chapa Payment (when implemented)
CHAPA_SECRET_KEY=your_chapa_secret_key
CHAPA_PUBLIC_KEY=your_chapa_public_key
```

### Installation Steps

1. **Clone and navigate to server directory**

   ```bash
   cd server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start MongoDB**
   Make sure MongoDB is running on your system

4. **Seed test data (optional)**

   ```bash
   npm run seed
   ```

5. **Start the server**

   ```bash
   # Development mode with auto-reload
   npm start

   # Production mode
   npm run prod
   ```

6. **Test the API**

   ```bash
   # Run comprehensive API tests
   npm test

   # Seed data and run tests
   npm run test:full
   ```

The server will start on `http://localhost:5000`

## 🧪 Testing

### API Testing

The project includes a comprehensive test suite that verifies all endpoints:

```bash
# Run API tests (server must be running)
npm test

# Seed test data and run tests
npm run test:full
```

### Test Users

After seeding, you can use these test accounts:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | <admin@belimuno.com> | Belimuno#2025! |
| Super Admin 1 | <admin1@belimuno.com> | Belimuno#2025! |
| Super Admin 2 | <admin2@belimuno.com> | Belimuno#2025! |
| Admin - HR | <admin.hr@belimuno.com> | Belimuno#2025! |
| Admin - Outsource | <admin.outsource@belimuno.com> | Belimuno#2025! |
| Worker 1 | <worker1@belimuno.com> | Belimuno#2025! |
| Worker 2 | <worker2@belimuno.com> | Belimuno#2025! |
| Worker 3 | <worker3@belimuno.com> | Belimuno#2025! |
| Client 1 | <client1@belimuno.com> | Belimuno#2025! |
| Client 2 | <client2@belimuno.com> | Belimuno#2025! |
| Client 3 | <client3@belimuno.com> | Belimuno#2025! |

## 📊 Database Models

### User Model

- Basic information (name, email, password)
- Role-based profiles (worker, client, admin)
- Regional assignment
- Verification status

### Job Model

- Complete job lifecycle management
- Payment tracking
- Progress monitoring
- Review system
- Dispute handling

### Application Model

- Worker job applications
- Proposal and budget information
- Status tracking

### Notification Model

- Multi-channel notifications
- Type-based categorization
- Read/unread status

### Region Model

- Geographic management
- Local settings and rules
- Manager assignment

### Payment Model

- Transaction tracking
- Chapa integration ready
- Dispute resolution

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions by user role
- **Input Validation**: Comprehensive request validation
- **Password Hashing**: Bcrypt password encryption
- **CORS Protection**: Cross-origin request security
- **Security Headers**: XSS and content-type protection
- **Error Handling**: Secure error responses

## 🌍 Workflow Examples

### Client Workflow

1. Client registers and creates account
2. Posts job with requirements and budget
3. Reviews worker applications
4. Selects and assigns worker
5. Monitors progress and communicates
6. Reviews completed work
7. Approves payment or requests revisions

### Worker Workflow

1. Worker registers and gets verified
2. Browses available jobs
3. Submits applications with proposals
4. Gets notified of acceptance/rejection
5. Updates job progress regularly
6. Submits completed work
7. Receives payment notification

### Area Manager Workflow

1. Monitors regional activity
2. Verifies new worker registrations
3. Handles escalations and disputes
4. Reviews regional performance
5. Adjusts local settings as needed

### Admin Workflow

1. Oversees entire platform
2. Manages user accounts
3. Resolves complex disputes
4. Monitors system performance
5. Generates comprehensive reports

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secret
- [ ] Configure MongoDB Atlas or production database
- [ ] Set up SSL/TLS certificates
- [ ] Configure email service
- [ ] Set up monitoring and logging
- [ ] Configure payment gateway
- [ ] Set up backup strategy

### Environment Setup

```bash
# Production environment variables
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/belimuno_jobs
JWT_SECRET=your_very_strong_jwt_secret_key
CLIENT_URL=https://yourdomain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for Belimuno Jobs - Connecting talent with opportunities across Ethiopia**
