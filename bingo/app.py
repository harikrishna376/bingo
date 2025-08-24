# app.py - The backend server for the Bingo game.

from flask import Flask, render_template, request, jsonify, session, g
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
import secrets
from functools import wraps

# Initialize Flask app
app = Flask(__name__)

# Configure a secret key for session management.
# This is a security requirement for Flask sessions.
app.secret_key = secrets.token_hex(16)

# Configure the SQLite database.
# The database will be a file named 'bingo.db' in the project directory.
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bingo.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database object.
db = SQLAlchemy(app)

# Define the User model for the database.
# This represents the 'users' table.
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    # Relationship to scores, so we can access a user's scores easily.
    scores = db.relationship('Score', backref='user', lazy=True)

# Define the Score model for the database.
# This represents the 'scores' table.
class Score(db.Model):
    __tablename__ = 'scores'
    id = db.Column(db.Integer, primary_key=True)
    score = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

# This decorator is a security measure to ensure a user is logged in
# before they can access certain routes.
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "Unauthorized"}), 401
        
        g.user = User.query.get(session['user_id'])

        if g.user is None:
            return jsonify({"error": "Unauthorized"}), 401

        return f(*args, **kwargs)
    return decorated_function

# --- API Endpoints ---

# Route for user registration.
@app.route('/api/register', methods=['POST'])
def register():
    """
    Handles user registration. It expects a JSON payload with a username and password.
    It hashes the password before saving it to the database.
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 409

    # Hash the password for security.
    hashed_password = generate_password_hash(password)
    new_user = User(username=username, password_hash=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201

# Route for user login.
@app.route('/api/login', methods=['POST'])
def login():
    """
    Handles user login. It checks the provided password against the hashed password in the database.
    If credentials are valid, it sets a session variable for the user.
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    # Check if user exists and the password is correct.
    if user and check_password_hash(user.password_hash, password):
        session['user_id'] = user.id  # Store the user's ID in the session.
        session['username'] = user.username # Store the username for display
        return jsonify({"message": "Login successful"}), 200
    else:
        return jsonify({"error": "Invalid username or password"}), 401

# Route for user logout.
@app.route('/api/logout', methods=['POST'])
def logout():
    """
    Handles user logout by clearing the session.
    """
    session.pop('user_id', None)
    session.pop('username', None)
    return jsonify({"message": "Logout successful"}), 200

# Route to get the current user's session status.
@app.route('/api/me', methods=['GET'])
def get_current_user():
    """
    Returns the username of the currently logged-in user.
    """
    if 'username' in session:
        return jsonify({"username": session['username']}), 200
    return jsonify({"username": None}), 200

# Route to submit a player's score.
@app.route('/api/submit_score', methods=['POST'])
@login_required
def submit_score():
    """
    Accepts a new score from an authenticated player and saves it to the database.
    """
    data = request.get_json()
    score = data.get('score')
    user_id = session.get('user_id')

    if user_id is None:
        return jsonify({"error": "User not logged in"}), 401
    
    if score is None:
        return jsonify({"error": "Score is required"}), 400

    new_score = Score(score=score, user_id=user_id)
    db.session.add(new_score)
    db.session.commit()

    return jsonify({"message": "Score submitted successfully"}), 201

# Route to get the top 10 scores for the leaderboard.
@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    """
    Fetches the top 10 scores from the database and returns them as a JSON list.
    """
    # Query the database for the top 10 scores, ordered from highest to lowest.
    top_scores = Score.query.order_by(Score.score.desc()).limit(10).all()
    leaderboard_data = []

    for score_entry in top_scores:
        user = User.query.get(score_entry.user_id)
        leaderboard_data.append({
            "username": user.username if user else "Unknown User",
            "score": score_entry.score
        })
    
    return jsonify(leaderboard_data), 200

# The main route that serves the single HTML page.
@app.route('/')
def index():
    """
    Serves the main HTML file.
    """
    return render_template('index.html')

# This block ensures the database tables are created when the application starts.
if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create all tables defined in the models.
    app.run(debug=True)
