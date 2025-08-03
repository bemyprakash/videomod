# Climate Champion Portal 2025

A comprehensive web portal for the Climate Champion Programme 2025 by Anant School for Climate Action. This platform enables students and schools across India to participate in climate awareness initiatives, submit documents, track progress, and compete on leaderboards.

## 🌱 Overview

The Climate Champion Programme is a one-year initiative that galvanizes youth towards climate awareness and action, nurturing a generation of proactive stewards for our planet. This portal serves as the central hub for:

- **Participant Registration**: Schools can register their Climate Champions
- **Document Management**: Upload quarterly reports, event documentation, and idea contest entries
- **Leaderboards**: Track performance and achievements across participants and schools
- **Admin Dashboard**: Comprehensive management tools for evaluating submissions and managing participants

## 🚀 Features

### For Participants
- **Secure Registration & Login**: Complete registration with school details and faculty information
- **Document Submission**: Upload various types of documents including quarterly reports, event documentation, and idea contest entries
- **Progress Tracking**: Monitor submission status, scores, and overall progress
- **Event Management**: Record and track climate action events organized
- **Workshop Tracking**: Log workshop attendance and certificates
- **Leaderboards**: View rankings and compare performance with peers
- **Profile Management**: Update personal and school information

### For Administrators
- **Separate Admin Login**: Secure authentication with role-based permissions
- **Participant Management**: Approve/reject registrations and manage participant profiles
- **Submission Review**: Evaluate submissions, provide scores and feedback
- **Bulk Operations**: Process multiple submissions efficiently
- **Analytics Dashboard**: Comprehensive statistics and insights
- **Report Generation**: Export data in various formats
- **User Management**: Create and manage admin accounts with different permission levels

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permission levels for admins
- **File Validation**: Secure file upload with type and size restrictions
- **Rate Limiting**: Protection against abuse
- **Password Hashing**: Secure password storage with bcrypt

## 🛠 Technology Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **Express Validator** for input validation
- **Helmet** for security headers
- **Morgan** for logging

### Frontend
- **React 19** with TypeScript
- **Material-UI (MUI)** for modern, responsive UI components
- **React Router** for navigation
- **TanStack Query** for data fetching and caching
- **Recharts** for data visualization
- **Axios** for API communication

## 📁 Project Structure

```
climate-champion-portal/
├── server/                 # Backend API
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Authentication & validation
│   └── index.js          # Server entry point
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Utility functions
│   │   └── App.tsx        # Main application
├── uploads/               # File storage directory
├── package.json           # Root package.json
└── README.md             # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd climate-champion-portal
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install --legacy-peer-deps
   cd ..
   ```

4. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on your system
   mongod
   ```

6. **Start the application**
   ```bash
   # Development mode (runs both backend and frontend)
   npm run dev
   
   # Or start separately:
   # Backend only
   npm run server
   
   # Frontend only (in another terminal)
   npm run client
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/api/health

### Default Admin Account
A default admin account will be created on first run:
- **Email**: admin@climatechampion.com
- **Password**: ChangeMe123!

**⚠️ Important**: Change the default admin password immediately after first login.

## 📊 API Endpoints

### Authentication
- `POST /api/auth/participant/register` - Participant registration
- `POST /api/auth/participant/login` - Participant login
- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/participant/me` - Get participant profile
- `GET /api/auth/admin/me` - Get admin profile

### File Upload
- `POST /api/upload/submit` - Submit single document
- `POST /api/upload/submit-multiple` - Submit multiple documents
- `GET /api/upload/my-submissions` - Get participant's submissions
- `GET /api/upload/download/:id` - Download file

### Leaderboards
- `GET /api/leaderboard/overall` - Overall participant rankings
- `GET /api/leaderboard/schools` - School-wise rankings
- `GET /api/leaderboard/states` - State-wise rankings
- `GET /api/leaderboard/my-position` - Current user's position

### Admin Routes
- `GET /api/admin/dashboard` - Admin dashboard statistics
- `GET /api/admin/participants` - Manage participants
- `GET /api/admin/submissions` - Review submissions
- `PUT /api/admin/submissions/:id/review` - Review submission

## 🔒 Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens expire after 7 days
- File uploads are validated for type and size
- Rate limiting prevents abuse
- CORS is configured for security
- Input validation on all endpoints
- SQL injection protection through Mongoose

## 🌟 Programme Timeline

### April - July 2025
- **Registration Period**: Schools register their Climate Champions
- **Induction Programme**: Official launch on July 28

### August - September 2025
- **Q1 Activities**: First quarterly reports and Mission LiFE events
- **First Workshop**: ASCA conducts educational workshops

### October - December 2025
- **Q2 Activities**: Second quarterly reports
- **Idea Contest**: AARAMBH hosts innovation challenge
- **Second Workshop**: Continued education and training

### January - February 2026
- **Q3 Activities**: Third quarterly reports
- **Final Preparations**: Schools prepare final reports

### March 2026
- **Final Submissions**: Deadline March 31
- **Evaluation**: Top schools selection

### April 2026
- **Awards Ceremony**: Earth Day celebration (April 22)
- **Recognition**: Top three schools honored

### May - June 2026
- **Summer Internships**: Opportunities for Climate Champions
- **Continued Engagement**: Ongoing climate action

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- **Email**: support@climatechampion.com
- **Documentation**: Check this README and API documentation
- **Issues**: Use GitHub Issues for bug reports and feature requests

## 🎯 Goals and Impact

The Climate Champion Programme aims to:
- Educate 1000+ students across India about climate action
- Engage 200+ schools in sustainability initiatives
- Create a network of young climate activists
- Promote innovative solutions to climate challenges
- Foster long-term environmental stewardship

---

**Built with ❤️ for a sustainable future by Anant School for Climate Action**
