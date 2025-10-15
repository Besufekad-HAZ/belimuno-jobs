# Environment Setup Guide

## 1. Create .env file in server directory

Create a file named `.env` in the server directory with the following content:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/belimuno_jobs
JWT_SECRET=belimuno_jobs_jwt_secret_key_2025_development
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:3000

# AWS S3 (required for media uploads)
AWS_S3_BUCKET=belimuno-uploads
AWS_S3_REGION=eu-north-1
AWS_S3_PUBLIC_BASE_URL=https://belimuno-uploads.s3.eu-north-1.amazonaws.com/public
AWS_S3_TEAM_PREFIX=public/team

# AWS credentials (use IAM user or role with PutObject/DeleteObject permissions)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Optional overrides
# AWS_S3_ENDPOINT=https://s3.eu-north-1.amazonaws.com
# AWS_S3_FORCE_PATH_STYLE=false

# Google OAuth (optional - for Google Sign-In)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_OFFLINE_VERIFY=false
```

## 2. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On Ubuntu/Debian
sudo systemctl start mongod

# On macOS with Homebrew
brew services start mongodb-community

# On Windows
# Start MongoDB service from Services
```

## 3. Install dependencies and start server

```bash
cd server
npm install
npm start
```

## 4. Seed test data

In a new terminal:

```bash
cd server
node seedTestData.js
```

## 5. Test accounts after seeding

Use these exact credentials from the seeded data:

| Role | Email | Password |
|------|-------|----------|
| Super Admin 1 | admin1@belimuno.com | Belimuno#2025! |
| Super Admin 2 | admin2@belimuno.com | Belimuno#2025! |
| Admin HR | admin.hr@belimuno.com | Belimuno#2025! |
| Admin Outsource | admin.outsource@belimuno.com | Belimuno#2025! |
| Worker 1 | worker1@belimuno.com | Belimuno#2025! |
| Worker 2 | worker2@belimuno.com | Belimuno#2025! |
| Worker 3 | worker3@belimuno.com | Belimuno#2025! |
| Client 1 | client1@belimuno.com | Belimuno#2025! |
| Client 2 | client2@belimuno.com | Belimuno#2025! |
| Client 3 | client3@belimuno.com | Belimuno#2025! |

## 6. Start client

In another terminal:

```bash
cd client
npm install
npm run dev
```

## Troubleshooting

- **MongoDB connection error**: Make sure MongoDB is running and accessible
- **JWT errors**: Check that JWT_SECRET is set in .env
- **Port conflicts**: Change PORT in .env if 5000 is already in use
- **CORS errors**: Make sure CLIENT_URL matches your client's actual URL
