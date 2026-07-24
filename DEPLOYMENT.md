# Hospital Leave Management System - Deployment Guide

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn package manager

## Project Structure

```
Hospital-Leave-Monitor-main/
├── Backend/                 # Node.js/Express API
│   ├── controllers/        # Route controllers
│   ├── models/            # Mongoose models
│   ├── routes/             # API routes
│   ├── middleware/         # Authentication middleware
│   ├── server.js           # Entry point
│   ├── seed.js             # Database seed script
│   ├── .env                # Environment variables
│   └── package.json
└── Frontend/              # Next.js Frontend
    ├── app/               # Next.js app directory
    ├── lib/               # Utility functions
    ├── .env.local         # Environment variables
    └── package.json
```

## Installation Steps

### 1. Backend Setup

```bash
cd Backend
npm install
```

### 2. Frontend Setup

```bash
cd Frontend
npm install
```

### 3. Database Setup

Make sure MongoDB is running on your system. By default, the application connects to:
```
mongodb://localhost:27017/hospital-leave-system
```

If using MongoDB Atlas or a different connection string, update the `MONGODB_URI` in `Backend/.env`.

### 4. Environment Configuration

The environment files are already configured with default values:

**Backend (.env):**
```
MONGODB_URI=mongodb://localhost:27017/hospital-leave-system
PORT=5001
JWT_SECRET=hospital-leave-secret-key-change-in-production-2024
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

### 5. Seed Database

Run the seed script to create initial admin user and sample data:

```bash
cd Backend
node seed.js
```

This will create:
- 1 Admin user (email: admin@hospital.com, password: admin123)
- 5 Sample employees (email: john.smith@hospital.com, password: employee123)
- 10 Departments

## Running the Application

### Start Backend Server

```bash
cd Backend
npm start
```

The backend will run on `http://localhost:5001`

### Start Frontend Development Server

```bash
cd Frontend
npm run dev
```

The frontend will run on `http://localhost:3000`

## Default Credentials

### Admin Account
- Email: `admin@hospital.com`
- Password: `admin123`

### Employee Account
- Email: `john.smith@hospital.com` (or any employee email)
- Password: `employee123`

## Features

### Admin Dashboard
- View dashboard statistics (total employees, on leave, returning soon, overdue)
- Manage employees (CRUD operations)
- Manage departments (CRUD operations)
- Approve/reject leave requests
- View reports (current leave, overdue, department-wise, monthly statistics)
- Send leave reminders via email

### Employee Dashboard
- View personal dashboard (current leave, upcoming leaves, leave history)
- Submit leave requests
- View leave request status
- Confirm return to duty

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Employees (Admin only)
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Departments (Admin only)
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get department by ID
- `POST /api/departments` - Create department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

### Leave Requests
- `GET /api/leaves` - Get all leave requests (Admin)
- `GET /api/leaves/:id` - Get leave request by ID
- `GET /api/leaves/employee/my-leaves` - Get employee's leave requests
- `POST /api/leaves` - Create leave request
- `PUT /api/leaves/:id/approve` - Approve leave request (Admin)
- `PUT /api/leaves/:id/reject` - Reject leave request (Admin)
- `PUT /api/leaves/:id/return` - Mark as returned
- `POST /api/leaves/update-statuses` - Update leave statuses

### Reports (Admin only)
- `GET /api/reports/dashboard-stats` - Get dashboard statistics
- `GET /api/reports/current-leave` - Get current leave report
- `GET /api/reports/overdue` - Get overdue report
- `GET /api/reports/department/:department` - Get department report
- `GET /api/reports/monthly-statistics` - Get monthly statistics

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `POST /api/notifications/send-reminders` - Send leave reminders (Admin)

## Production Deployment

### Backend Production Setup (Railway)

1. **Deploy Backend to Railway:**
   - Create a new Railway project
   - Connect your GitHub repository
   - Railway will detect the Node.js backend in the `Backend/` folder
   - Set the root directory to `Backend` in Railway settings

2. **Set Railway Environment Variables:**
   ```
   MONGODB_URI=your-mongodb-atlas-connection-string
   PORT=5001
   JWT_SECRET=your-secure-jwt-secret-change-this
   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
   ```

3. **MongoDB Atlas Setup:**
   - Create a free MongoDB Atlas account
   - Create a cluster
   - Create a database user with read/write permissions
   - Whitelist Railway's IP addresses (or use 0.0.0.0/0 for testing)
   - Copy the connection string (use the Node.js driver format)

4. **Get Railway Backend URL:**
   - After deployment, Railway will provide a URL like: `https://your-app-name.up.railway.app`
   - Note: The API routes will be at `https://your-app-name.up.railway.app/api`

### Frontend Production Setup (Vercel)

1. **Deploy Frontend to Vercel:**
   - Create a new Vercel project
   - Connect your GitHub repository
   - Vercel will detect the Next.js app
   - Click Deploy

2. **Set Vercel Environment Variables:**
   Go to your Vercel project Settings > Environment Variables and add:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-app.up.railway.app/api
   NEXT_PUBLIC_SOCKET_URL=https://your-railway-app.up.railway.app
   ```

3. **Redeploy:**
   - After setting environment variables, trigger a new deployment from Vercel dashboard

### Deployment Options

#### Option 1: Vercel (Frontend) + Railway (Backend) - RECOMMENDED
- Deploy frontend to Vercel
- Deploy backend to Railway
- Set NEXT_PUBLIC_API_URL and NEXT_PUBLIC_SOCKET_URL in Vercel to point to Railway URL
- Set ALLOWED_ORIGINS in Railway to include your Vercel domain

#### Option 2: Single Server
- Build frontend: `npm run build` in Frontend
- Serve frontend static files from backend using Express
- Or use a reverse proxy (nginx) to serve both

#### Option 3: Docker
- Create Dockerfile for both frontend and backend
- Use docker-compose to orchestrate services
- Deploy to any cloud provider

### Critical Environment Variables for Production

**Frontend (Vercel):**
- `NEXT_PUBLIC_API_URL` - Your Railway backend URL with `/api` suffix
- `NEXT_PUBLIC_SOCKET_URL` - Your Railway backend URL (no `/api` suffix)

**Backend (Railway):**
- `MONGODB_URI` - MongoDB Atlas connection string
- `PORT` - Server port (default: 5001)
- `JWT_SECRET` - Secure random string for JWT signing
- `ALLOWED_ORIGINS` - Comma-separated list of allowed frontend domains (e.g., `https://your-app.vercel.app`)

## Security Considerations

1. Change the JWT_SECRET in production
2. Use environment variables for sensitive data
3. Enable HTTPS in production
4. Implement rate limiting
5. Add input validation and sanitization
6. Regularly update dependencies
7. Use MongoDB authentication
8. Enable CORS only for trusted domains

## Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify MONGODB_URI in .env
- Check if port 5001 is available

### Frontend can't connect to backend
- Verify NEXT_PUBLIC_API_URL in .env.local
- Check if backend is running
- Check CORS configuration

### Database connection issues
- Ensure MongoDB service is running
- Check connection string format
- Verify MongoDB credentials

### Email notifications not working
- Configure email settings in .env
- Use app-specific password for Gmail
- Check firewall/network settings

## Support

For issues or questions, please refer to the project repository or contact the development team.
