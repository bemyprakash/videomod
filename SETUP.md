# Climate Champion Portal - Quick Setup Guide

## Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** (comes with Node.js)

## Quick Start

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies  
cd client
npm install --legacy-peer-deps
cd ..
```

### 2. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# If you have MongoDB installed locally
mongod

# Or if using MongoDB service
sudo systemctl start mongod
```

### 3. Environment Setup

The `.env` file is already configured with development defaults. For production, update the values in `.env`:

- Change `JWT_SECRET` to a secure random string
- Update `MONGODB_URI` to your MongoDB connection string
- Change `DEFAULT_ADMIN_PASSWORD` to a secure password

### 4. Create Default Admin

```bash
# Create the default admin account
node server/scripts/createAdmin.js
```

This will create an admin account with:
- **Email**: admin@climatechampion.com
- **Password**: ChangeMe123!

⚠️ **Important**: Change the default password after first login!

### 5. Start the Application

```bash
# Start both backend and frontend (recommended for development)
npm run dev

# Or start them separately:
# Backend only (port 5000)
npm run server

# Frontend only (port 3000) - in another terminal
npm run client
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## Default Accounts

### Admin Account
- **Email**: admin@climatechampion.com
- **Password**: ChangeMe123!
- **Access**: http://localhost:3000/admin/login

### Test Participant Registration
- Go to http://localhost:3000/register
- Fill out the registration form
- Admin can approve the registration from the admin dashboard

## API Testing

You can test the API health:
```bash
curl http://localhost:5000/api/health
```

## Features Available

✅ **Completed Features**:
- Participant registration and authentication
- Admin authentication with role-based permissions
- Document upload system with file validation
- Leaderboard system (overall, school-wise, state-wise)
- Admin dashboard for managing participants and submissions
- Comprehensive database models for all entities
- Security features (JWT, rate limiting, file validation)
- Modern Material-UI interface

🚧 **Pages Created (with placeholders)**:
- Participant dashboard, submissions, upload, profile pages
- Admin dashboard, participant management, submission review pages
- All authentication pages (login, register, admin login)

## Development Notes

- The application uses MongoDB for data storage
- JWT tokens for authentication (7-day expiry)
- File uploads are stored in the `uploads/` directory
- All passwords are hashed with bcrypt
- Rate limiting is enabled for API protection

## Next Steps for Full Implementation

1. **Complete the Frontend Pages**: Replace placeholder components with full functionality
2. **Add Email Notifications**: Set up SMTP for registration confirmations, etc.
3. **Implement Real-time Features**: Add websockets for live updates
4. **Add Analytics Dashboard**: Enhanced charts and reports for admins
5. **Mobile App**: Create React Native version
6. **Deployment**: Set up production deployment with Docker

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:
   - Make sure MongoDB is running
   - Check the `MONGODB_URI` in `.env`

2. **Frontend Build Errors**:
   - Use `--legacy-peer-deps` when installing client dependencies
   - Clear node_modules and reinstall if needed

3. **Port Already in Use**:
   - Change ports in `.env` (PORT) and `client/package.json` scripts

### Getting Help

- Check the main `README.md` for detailed documentation
- Review the API endpoints in the README
- Check console logs for specific error messages

---

**Built for the Climate Champion Programme 2025 by Anant School for Climate Action** 🌱