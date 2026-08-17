"""
TaskFlow Pro - Flask REST API Backend (PostgreSQL Edition)
Production-ready with PostgreSQL (SQLAlchemy), JWT Authentication, Error Handling, and CORS.
"""
import os
import datetime
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt

app = Flask(__name__)

# Configuration
PORT = int(os.environ.get("PORT", 5000))
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/taskflow"
)
# SQLAlchemy requires 'postgresql://' instead of 'postgres://'
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

JWT_SECRET = os.environ.get("JWT_SECRET", "super-secret-jwt-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Setup CORS
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Database Initialization
db = SQLAlchemy(app)

# ----------------- MODELS -----------------

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    tasks = db.relationship("Task", backref="user", lazy=True, cascade="all, delete-orphan")


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, default="")
    status = db.Column(db.String(50), default="PENDING")
    priority = db.Column(db.String(50), default="MEDIUM")
    due_date = db.Column(db.String(50), default="")
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "_id": str(self.id),
            "userId": str(self.user_id),
            "title": self.title,
            "description": self.description or "",
            "status": self.status,
            "priority": self.priority,
            "dueDate": self.due_date or "",
            "createdAt": self.created_at.isoformat() if self.created_at else ""
        }

# Auto-create tables on startup
with app.app_context():
    db.create_all()

# ----------------- AUTH DECORATOR -----------------

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization")
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1]

        if not token:
            return jsonify({"message": "Authentication token is missing"}), 401

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            current_user = db.session.get(User, int(payload["sub"]))
            if not current_user:
                return jsonify({"message": "User not found or disabled"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired. Please login again."}), 401
        except (jwt.InvalidTokenError, Exception):
            return jsonify({"message": "Invalid authentication token"}), 401

        return f(current_user, *args, **kwargs)
    return decorated

# ----------------- SYSTEM ROUTES -----------------

@app.route("/api/health", methods=["GET"])
def health_check():
    try:
        db.session.execute(db.text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"unreachable: {str(e)}"

    return jsonify({
        "status": "healthy",
        "service": "taskflow-backend-postgres",
        "database": db_status,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }), 200

# ----------------- AUTH ROUTES -----------------

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"message": "Name, email, and password are required"}), 400

    if len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters long"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "An account with this email already exists"}), 409

    new_user = User(
        name=name,
        email=email,
        password=generate_password_hash(password)
    )
    db.session.add(new_user)
    db.session.commit()

    token = jwt.encode({
        "sub": str(new_user.id),
        "email": new_user.email,
        "name": new_user.name,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRATION_HOURS)
    }, JWT_SECRET, algorithm=JWT_ALGORITHM)

    return jsonify({
        "message": "Account created successfully",
        "token": token,
        "user": {"id": str(new_user.id), "name": new_user.name, "email": new_user.email}
    }), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"message": "Invalid email or password"}), 401

    token = jwt.encode({
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRATION_HOURS)
    }, JWT_SECRET, algorithm=JWT_ALGORITHM)

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {"id": str(user.id), "name": user.name, "email": user.email}
    }), 200

# ----------------- TASK CRUD ROUTES -----------------

@app.route("/api/tasks", methods=["GET"])
@token_required
def get_tasks(current_user):
    tasks = Task.query.filter_by(user_id=current_user.id).order_by(Task.created_at.desc()).all()
    return jsonify([task.to_dict() for task in tasks]), 200

@app.route("/api/tasks", methods=["POST"])
@token_required
def create_task(current_user):
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"message": "Task title is required"}), 400

    task = Task(
        user_id=current_user.id,
        title=title,
        description=data.get("description", "").strip(),
        status=data.get("status", "PENDING"),
        priority=data.get("priority", "MEDIUM"),
        due_date=data.get("dueDate", "")
    )
    db.session.add(task)
    db.session.commit()

    return jsonify(task.to_dict()), 201

@app.route("/api/tasks/<int:task_id>", methods=["PATCH"])
@token_required
def update_task(current_user, task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({"message": "Task not found or unauthorized"}), 404

    data = request.get_json() or {}
    if "title" in data:
        task.title = data["title"].strip()
    if "description" in data:
        task.description = data["description"].strip()
    if "status" in data:
        task.status = data["status"]
    if "priority" in data:
        task.priority = data["priority"]
    if "dueDate" in data:
        task.due_date = data["dueDate"]

    db.session.commit()
    return jsonify(task.to_dict()), 200

@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
@token_required
def delete_task(current_user, task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({"message": "Task not found or unauthorized"}), 404

    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted successfully", "id": str(task_id)}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)