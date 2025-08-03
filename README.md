# Climate Champion Programme 2025 Portal

A comprehensive web portal for the Climate Champion Programme by Anant School for Climate Action, designed to facilitate participant registration, document submissions, and program management.

## 🌱 Features

### For Participants
- **User Registration**: Complete registration with personal and school information
- **Document Submission**: Upload quarterly reports, final reports, and idea contest entries
- **Progress Tracking**: View submission history and evaluation results
- **Leaderboard**: See rankings of top participants and schools

### For Administrators
- **Dashboard**: Overview of registrations, submissions, and evaluations
- **Submission Management**: Review and evaluate participant submissions
- **School Management**: View registered schools and their participants
- **Evaluation System**: Score submissions and provide detailed feedback

### General Features
- **Modern UI**: Climate-themed responsive design
- **Secure Authentication**: Separate login systems for participants and admins
- **File Upload**: Support for PDF, DOC, DOCX, PPT, PPTX files (up to 16MB)
- **Real-time Statistics**: Live updates on participation and performance

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Installation

1. **Clone or download the project files**
   ```bash
   # Ensure you have all the project files in your directory
   ls -la
   # Should show: app.py, requirements.txt, templates/, static/, etc.
   ```

2. **Install dependencies**
   ```bash
   pip install --user -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python3 app.py
   ```

4. **Access the portal**
   - Open your web browser
   - Navigate to: `http://localhost:5000`
   - The portal is now ready to use!

## 📱 User Guide

### For Participants

#### 1. Registration
1. Visit the homepage and click "Register Now"
2. Fill in personal information:
   - Email address
   - Student name
   - Grade/Class
   - Phone number
   - Password
3. Provide school information:
   - School name and address
   - Principal details
   - Faculty representative details
4. Submit registration

#### 2. Login and Dashboard
1. Use your email and password to login
2. Access your dashboard to view:
   - Total submissions
   - Evaluated submissions
   - Current scores
   - Submission history

#### 3. Document Submission
1. Click "Submit Document" from dashboard
2. Choose submission type:
   - **Quarterly Report**: Regular progress updates
   - **Final Report**: End-of-program summary
   - **Idea Contest Entry**: Innovation proposals
3. Provide title and detailed description
4. Upload your document (PDF, DOC, DOCX, PPT, PPTX)
5. Submit for evaluation

#### 4. View Results
- Check dashboard for evaluation status
- View scores and feedback from administrators
- Download your submitted documents anytime

### For Administrators

#### 1. Admin Registration
1. Click "Register as Admin"
2. Enter admin details and the admin key: `CLIMATE_ADMIN_2025`
3. Complete registration

#### 2. Admin Dashboard
- View system statistics
- Monitor recent submissions
- Access quick action buttons

#### 3. Managing Submissions
1. Navigate to "Submissions" from the admin menu
2. Filter submissions by status (All/Pending/Evaluated)
3. Click "Evaluate Submission" for pending items
4. Provide score (0-100) and detailed feedback
5. Submit evaluation

#### 4. School Management
- View all registered schools
- See participant counts and submission statistics
- Monitor school performance

## 🗂️ Database Schema

The application uses SQLite database with the following tables:

- **Users**: Participant and admin accounts
- **Schools**: School information and contacts
- **Submissions**: Document submissions and evaluations

## 🎨 UI Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Climate Theme**: Green color scheme with environmental icons
- **Interactive Elements**: Drag-and-drop file upload, hover effects
- **Accessibility**: Clear navigation and readable typography

## 🔧 Configuration

### Environment Variables
Create a `.env` file for production:
```
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///climate_portal.db
```

### Admin Key
The default admin registration key is `CLIMATE_ADMIN_2025`. Change this in `app.py` for production:
```python
if form.admin_key.data != 'YOUR_NEW_ADMIN_KEY':
```

## 📁 File Structure

```
climate-portal/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── templates/            # HTML templates
│   ├── base.html
│   ├── index.html
│   ├── login.html
│   ├── register_participant.html
│   ├── register_admin.html
│   ├── participant_dashboard.html
│   ├── submit_document.html
│   ├── admin_dashboard.html
│   ├── admin_submissions.html
│   ├── evaluate_submission.html
│   ├── admin_schools.html
│   └── leaderboard.html
├── static/              # CSS, JS, and image files
│   └── css/
│       └── style.css
└── uploads/             # Document storage (created automatically)
```

## 🔒 Security Features

- Password hashing with Werkzeug
- CSRF protection on all forms
- File type validation for uploads
- Size limits on file uploads
- Session management with Flask-Login

## 🌍 Production Deployment

### Using Gunicorn
```bash
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

### Environment Setup
1. Set environment variables
2. Use a production database (PostgreSQL recommended)
3. Configure reverse proxy (Nginx)
4. Enable HTTPS
5. Set up file storage (cloud storage recommended)

## 📊 Evaluation Guidelines

### Scoring Criteria (0-100 points)
- **Excellent (90-100)**: Outstanding innovation & impact
- **Good (70-89)**: Strong concept with good potential  
- **Average (50-69)**: Decent effort, needs improvement
- **Below Average (0-49)**: Significant improvements needed

### Evaluation Factors
- Innovation and creativity
- Implementation feasibility
- Environmental impact potential
- Evidence-based approach
- Presentation quality

## 🤝 Support

For technical support or questions about the portal:

1. Check the user guide above
2. Contact your system administrator
3. Review the error messages for troubleshooting

## 📅 Programme Timeline

- **April - July 2025**: Registration period
- **July 28, 2025**: Induction programme
- **August 2025 - March 2026**: Quarterly submissions
- **March 31, 2026**: Final report deadline
- **April 22, 2026**: Award ceremony on Earth Day

---

*Climate Champion Programme 2025 - Anant School for Climate Action*  
*Building tomorrow's environmental leaders today* 🌱
