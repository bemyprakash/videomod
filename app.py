import os
from flask import Flask, render_template, redirect, url_for, flash, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileRequired, FileAllowed
from wtforms import StringField, TextAreaField, PasswordField, SelectField, SubmitField, IntegerField
from wtforms.validators import DataRequired, Email, Length, EqualTo
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime
import uuid

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'climate-champion-secret-key-2025'
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or 'sqlite:///climate_portal.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access this page.'

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    is_admin = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Participant specific fields
    school_id = db.Column(db.Integer, db.ForeignKey('school.id'))
    student_name = db.Column(db.String(100))
    grade = db.Column(db.String(20))
    phone = db.Column(db.String(20))
    
    # Admin specific fields
    admin_name = db.Column(db.String(100))
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def get_id(self):
        return str(self.id)

class School(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    address = db.Column(db.Text)
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    pincode = db.Column(db.String(10))
    principal_name = db.Column(db.String(100))
    principal_email = db.Column(db.String(120))
    faculty_name = db.Column(db.String(100))
    faculty_email = db.Column(db.String(120))
    registration_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Participants from this school
    participants = db.relationship('User', backref='school', lazy=True)
    submissions = db.relationship('Submission', backref='school', lazy=True)

class Submission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('school.id'), nullable=False)
    submission_type = db.Column(db.String(50), nullable=False)  # quarterly_report, final_report, idea_contest
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    file_path = db.Column(db.String(300))
    original_filename = db.Column(db.String(200))
    submission_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Evaluation fields
    is_evaluated = db.Column(db.Boolean, default=False)
    score = db.Column(db.Integer, default=0)
    feedback = db.Column(db.Text)
    evaluated_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    evaluation_date = db.Column(db.DateTime)
    
    user = db.relationship('User', foreign_keys=[user_id], backref='submissions')
    evaluator = db.relationship('User', foreign_keys=[evaluated_by])

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Forms
class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Login')

class ParticipantRegistrationForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField('Confirm Password', 
                                   validators=[DataRequired(), EqualTo('password')])
    student_name = StringField('Student Name', validators=[DataRequired()])
    grade = StringField('Grade/Class', validators=[DataRequired()])
    phone = StringField('Phone Number', validators=[DataRequired()])
    
    # School information
    school_name = StringField('School Name', validators=[DataRequired()])
    school_address = TextAreaField('School Address', validators=[DataRequired()])
    city = StringField('City', validators=[DataRequired()])
    state = StringField('State', validators=[DataRequired()])
    pincode = StringField('Pincode', validators=[DataRequired()])
    principal_name = StringField('Principal Name', validators=[DataRequired()])
    principal_email = StringField('Principal Email', validators=[DataRequired(), Email()])
    faculty_name = StringField('Faculty Representative Name', validators=[DataRequired()])
    faculty_email = StringField('Faculty Representative Email', validators=[DataRequired(), Email()])
    
    submit = SubmitField('Register')

class AdminRegistrationForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField('Confirm Password', 
                                   validators=[DataRequired(), EqualTo('password')])
    admin_name = StringField('Admin Name', validators=[DataRequired()])
    admin_key = StringField('Admin Key', validators=[DataRequired()])
    submit = SubmitField('Register as Admin')

class SubmissionForm(FlaskForm):
    submission_type = SelectField('Submission Type', 
                                choices=[('quarterly_report', 'Quarterly Report'),
                                       ('final_report', 'Final Report'),
                                       ('idea_contest', 'Idea Contest Entry')],
                                validators=[DataRequired()])
    title = StringField('Title', validators=[DataRequired()])
    description = TextAreaField('Description', validators=[DataRequired()])
    file = FileField('Upload Document', 
                    validators=[FileRequired(), 
                              FileAllowed(['pdf', 'doc', 'docx', 'ppt', 'pptx'], 
                                        'Only PDF, DOC, DOCX, PPT, PPTX files allowed!')])
    submit = SubmitField('Submit')

class EvaluationForm(FlaskForm):
    score = IntegerField('Score (0-100)', validators=[DataRequired()])
    feedback = TextAreaField('Feedback', validators=[DataRequired()])
    submit = SubmitField('Submit Evaluation')

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and user.check_password(form.password.data) and user.is_active:
            login_user(user)
            next_page = request.args.get('next')
            if user.is_admin:
                return redirect(next_page) if next_page else redirect(url_for('admin_dashboard'))
            else:
                return redirect(next_page) if next_page else redirect(url_for('participant_dashboard'))
        flash('Invalid email or password')
    return render_template('login.html', form=form)

@app.route('/register/participant', methods=['GET', 'POST'])
def register_participant():
    form = ParticipantRegistrationForm()
    if form.validate_on_submit():
        # Check if user already exists
        if User.query.filter_by(email=form.email.data).first():
            flash('Email already registered')
            return render_template('register_participant.html', form=form)
        
        # Check if school already exists
        school = School.query.filter_by(name=form.school_name.data).first()
        if not school:
            school = School(
                name=form.school_name.data,
                address=form.school_address.data,
                city=form.city.data,
                state=form.state.data,
                pincode=form.pincode.data,
                principal_name=form.principal_name.data,
                principal_email=form.principal_email.data,
                faculty_name=form.faculty_name.data,
                faculty_email=form.faculty_email.data
            )
            db.session.add(school)
            db.session.commit()
        
        # Create user
        user = User(
            email=form.email.data,
            student_name=form.student_name.data,
            grade=form.grade.data,
            phone=form.phone.data,
            school_id=school.id,
            is_admin=False
        )
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! You can now log in.')
        return redirect(url_for('login'))
    
    return render_template('register_participant.html', form=form)

@app.route('/register/admin', methods=['GET', 'POST'])
def register_admin():
    form = AdminRegistrationForm()
    if form.validate_on_submit():
        # Check admin key (you should change this)
        if form.admin_key.data != 'CLIMATE_ADMIN_2025':
            flash('Invalid admin key')
            return render_template('register_admin.html', form=form)
        
        # Check if user already exists
        if User.query.filter_by(email=form.email.data).first():
            flash('Email already registered')
            return render_template('register_admin.html', form=form)
        
        # Create admin user
        user = User(
            email=form.email.data,
            admin_name=form.admin_name.data,
            is_admin=True
        )
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        
        flash('Admin registration successful! You can now log in.')
        return redirect(url_for('login'))
    
    return render_template('register_admin.html', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/participant/dashboard')
@login_required
def participant_dashboard():
    if current_user.is_admin:
        return redirect(url_for('admin_dashboard'))
    
    submissions = Submission.query.filter_by(user_id=current_user.id).order_by(Submission.submission_date.desc()).all()
    return render_template('participant_dashboard.html', submissions=submissions)

@app.route('/participant/submit', methods=['GET', 'POST'])
@login_required
def submit_document():
    if current_user.is_admin:
        return redirect(url_for('admin_dashboard'))
    
    form = SubmissionForm()
    if form.validate_on_submit():
        file = form.file.data
        if file:
            # Generate unique filename
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(file_path)
            
            # Create submission record
            submission = Submission(
                user_id=current_user.id,
                school_id=current_user.school_id,
                submission_type=form.submission_type.data,
                title=form.title.data,
                description=form.description.data,
                file_path=file_path,
                original_filename=filename
            )
            db.session.add(submission)
            db.session.commit()
            
            flash('Document submitted successfully!')
            return redirect(url_for('participant_dashboard'))
    
    return render_template('submit_document.html', form=form)

@app.route('/admin/dashboard')
@login_required
def admin_dashboard():
    if not current_user.is_admin:
        return redirect(url_for('participant_dashboard'))
    
    total_schools = School.query.count()
    total_participants = User.query.filter_by(is_admin=False).count()
    total_submissions = Submission.query.count()
    pending_evaluations = Submission.query.filter_by(is_evaluated=False).count()
    
    recent_submissions = Submission.query.order_by(Submission.submission_date.desc()).limit(10).all()
    
    return render_template('admin_dashboard.html', 
                         total_schools=total_schools,
                         total_participants=total_participants,
                         total_submissions=total_submissions,
                         pending_evaluations=pending_evaluations,
                         recent_submissions=recent_submissions)

@app.route('/admin/submissions')
@login_required
def admin_submissions():
    if not current_user.is_admin:
        return redirect(url_for('participant_dashboard'))
    
    submissions = Submission.query.order_by(Submission.submission_date.desc()).all()
    return render_template('admin_submissions.html', submissions=submissions)

@app.route('/admin/evaluate/<int:submission_id>', methods=['GET', 'POST'])
@login_required
def evaluate_submission(submission_id):
    if not current_user.is_admin:
        return redirect(url_for('participant_dashboard'))
    
    submission = Submission.query.get_or_404(submission_id)
    form = EvaluationForm()
    
    if form.validate_on_submit():
        submission.score = form.score.data
        submission.feedback = form.feedback.data
        submission.is_evaluated = True
        submission.evaluated_by = current_user.id
        submission.evaluation_date = datetime.utcnow()
        db.session.commit()
        
        flash('Evaluation submitted successfully!')
        return redirect(url_for('admin_submissions'))
    
    return render_template('evaluate_submission.html', submission=submission, form=form)

@app.route('/download/<int:submission_id>')
@login_required
def download_file(submission_id):
    submission = Submission.query.get_or_404(submission_id)
    
    # Check permissions
    if not current_user.is_admin and submission.user_id != current_user.id:
        flash('Access denied')
        return redirect(url_for('index'))
    
    return send_file(submission.file_path, as_attachment=True, download_name=submission.original_filename)

@app.route('/leaderboard')
def leaderboard():
    # Calculate scores by school
    school_scores = db.session.query(
        School.name,
        db.func.sum(Submission.score).label('total_score'),
        db.func.count(Submission.id).label('submission_count')
    ).join(Submission).filter(Submission.is_evaluated == True).group_by(School.id).order_by(db.desc('total_score')).all()
    
    # Calculate scores by participant
    participant_scores = db.session.query(
        User.student_name,
        School.name.label('school_name'),
        db.func.sum(Submission.score).label('total_score'),
        db.func.count(Submission.id).label('submission_count')
    ).join(Submission).join(School).filter(
        Submission.is_evaluated == True,
        User.is_admin == False
    ).group_by(User.id).order_by(db.desc('total_score')).all()
    
    return render_template('leaderboard.html', 
                         school_scores=school_scores,
                         participant_scores=participant_scores)

@app.route('/admin/schools')
@login_required
def admin_schools():
    if not current_user.is_admin:
        return redirect(url_for('participant_dashboard'))
    
    schools = School.query.order_by(School.registration_date.desc()).all()
    return render_template('admin_schools.html', schools=schools)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)