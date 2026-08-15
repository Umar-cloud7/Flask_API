# Task Management REST API

A production-ready REST API for task management built with Flask, PostgreSQL, and JWT authentication. Fully containerized and AWS-deployment ready.

## 📋 Features

- **User Authentication**: JWT-based auth with secure password hashing (Werkzeug)
- **CRUD Operations**: Full task lifecycle management (Create, Read, Update, Delete)
- **Filtering & Pagination**: Query tasks by status/priority with pagination support
- **Security Hardening**: 
  - Non-root Docker user (principle of least privilege)
  - SQL injection prevention via ORM
  - Password hashing with salted bcrypt
  - JWT token-based API security
  - Environment-based configuration
- **Production-Ready**:
  - Multi-stage Docker build for optimized image size
  - Gunicorn WSGI server
  - Health check endpoints
  - Database connection pooling
  - Comprehensive error handling
- **Monitoring-Ready**: Health check endpoint for load balancer integration

## 🏗️ Architecture

```
┌─────────────────────────┐
│   Flask REST API        │ (Port 5000)
│  - JWT Authentication   │
│  - SQLAlchemy ORM       │
│  - Error Handling       │
└──────────┬──────────────┘
           │
┌──────────▼──────────────┐
│  PostgreSQL Database    │ (Port 5432)
│  - User table           │
│  - Tasks table          │
│  - Indexes for perf     │
└─────────────────────────┘
```

## 🚀 Quick Start (Local Development)

### Prerequisites
- Docker & Docker Compose installed
- Git

### 1. Clone & Setup
```bash
git clone <repo-url>
cd flask_api_project
```

### 2. Run with Docker Compose
```bash
docker-compose up --build
```

This will:
- Start PostgreSQL on port 5432
- Start Flask API on port 5000
- Initialize database with indexes
- Wait for database health check

### 3. Test the API
```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePassword123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "SecurePassword123"
  }'

# Copy the access_token from response, use in next request:

# Create a task
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Deploy to AWS",
    "description": "Deploy Flask API to EC2",
    "priority": "high",
    "due_date": "2025-01-31T18:00:00"
  }'

# Get all tasks
curl -X GET "http://localhost:5000/api/tasks?status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Health check
curl http://localhost:5000/health
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <access_token>
```

### Endpoints

#### 1. **Register User**
```
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response (201):
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2025-01-15T10:30:00"
  }
}
```

#### 2. **Login**
```
POST /auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePass123"
}

Response (200):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

#### 3. **Create Task**
```
POST /tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Complete DevOps project",
  "description": "Deploy Flask API to AWS with security hardening",
  "priority": "high",
  "due_date": "2025-02-01T18:00:00"
}

Response (201):
{
  "message": "Task created successfully",
  "task": {
    "id": 1,
    "title": "Complete DevOps project",
    "description": "Deploy Flask API to AWS...",
    "status": "pending",
    "priority": "high",
    "created_at": "2025-01-15T10:35:00",
    "updated_at": "2025-01-15T10:35:00",
    "due_date": "2025-02-01T18:00:00"
  }
}
```

#### 4. **Get All Tasks**
```
GET /tasks?status=pending&priority=high&page=1&per_page=10
Authorization: Bearer <token>

Response (200):
{
  "tasks": [ { ... } ],
  "total": 25,
  "pages": 3,
  "current_page": 1
}
```

#### 5. **Get Single Task**
```
GET /tasks/<task_id>
Authorization: Bearer <token>

Response (200):
{
  "task": { ... }
}
```

#### 6. **Update Task**
```
PUT /tasks/<task_id>
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in_progress",
  "priority": "medium"
}

Response (200):
{
  "message": "Task updated successfully",
  "task": { ... }
}
```

#### 7. **Delete Task**
```
DELETE /tasks/<task_id>
Authorization: Bearer <token>

Response (200):
{
  "message": "Task deleted successfully"
}
```

#### 8. **Get Task Statistics**
```
GET /stats
Authorization: Bearer <token>

Response (200):
{
  "total_tasks": 25,
  "completed": 10,
  "pending": 12,
  "in_progress": 3,
  "completion_rate": 40.0
}
```

#### 9. **Health Check** (No auth required)
```
GET /health

Response (200):
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:40:00",
  "service": "task-api"
}
```

---

## 🔐 Security Implementation

### 1. **Password Security**
- Passwords hashed with Werkzeug (PBKDF2) + salt
- Original password never stored
- Bcrypt-level security

### 2. **JWT Authentication**
- Token-based, stateless auth
- 24-hour expiration (configurable)
- Secret key environment variable (never hardcoded)

### 3. **SQL Injection Prevention**
- SQLAlchemy ORM parameterized queries
- User input sanitized via Flask request parsing

### 4. **Least Privilege (Docker)**
- Container runs as non-root user (appuser, UID 1000)
- Read-only filesystem where possible
- Minimal Python image (python:3.11-slim)

### 5. **Environment-Based Config**
```bash
# Never commit secrets to git
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET_KEY=your-super-secret-key-here
FLASK_ENV=production
```

### 6. **Database Security**
- Connection pooling to prevent resource exhaustion
- Indexes on frequently queried fields
- Foreign key constraints for data integrity

---

## 🐳 Docker & Containerization

### Build Image
```bash
# Build locally
docker build -t task-api:1.0 .

# Run container
docker run -p 5000:5000 \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/taskdb \
  -e JWT_SECRET_KEY=prod-secret-key \
  task-api:1.0
```

### Multi-Stage Build Benefits
- **Smaller image**: Only runtime dependencies included (~150MB)
- **Faster builds**: Dependencies cached separately
- **Security**: No build tools in production image

### Docker Compose (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

---

## ☁️ AWS Deployment Guide

### Prerequisites
- AWS Account with EC2 & RDS access
- Security group configured
- IAM role with appropriate permissions

### Step 1: Set Up RDS PostgreSQL
```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier task-api-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --storage-encrypted \
  --storage-type gp2 \
  --vpc-security-group-ids sg-xxxxxxxx
```

### Step 2: Create EC2 Instance
```bash
# Launch EC2 (Ubuntu 22.04 LTS)
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.micro \
  --key-name your-key-pair \
  --security-groups app-server \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=task-api-server}]'
```

### Step 3: SSH into EC2 & Deploy
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Clone repository
git clone <repo-url>
cd flask_api_project

# Create .env with RDS credentials
cat > .env << EOF
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@task-api-db.xxxxx.us-east-1.rds.amazonaws.com:5432/taskdb
JWT_SECRET_KEY=$(openssl rand -hex 32)
FLASK_ENV=production
EOF

# Start application
docker-compose up -d
```

### Step 4: Configure Security Groups
**Inbound Rules:**
```
SSH (22):     0.0.0.0/0 or your IP only
HTTP (80):    0.0.0.0/0 (for ALB)
HTTPS (443):  0.0.0.0/0
API (5000):   ALB security group only
```

**Database Security Group (Inbound):**
```
PostgreSQL (5432): EC2 security group only (not 0.0.0.0/0)
```

### Step 5: Set Up Application Load Balancer (ALB)
```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name task-api-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-alb-xxx \
  --scheme internet-facing

# Create target group
aws elbv2 create-target-group \
  --name task-api-targets \
  --protocol HTTP \
  --port 5000 \
  --vpc-id vpc-xxxxx \
  --health-check-path /health \
  --health-check-interval-seconds 30

# Register targets
aws elbv2 register-targets \
  --target-group-arn arn:aws:... \
  --targets Id=i-xxxxx Port=5000
```

### Step 6: IAM Policy for EC2
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBInstances",
        "rds:DescribeDBClusters"
      ],
      "Resource": "arn:aws:rds:*:*:db/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeSecurityGroups"
      ],
      "Resource": "*"
    }
  ]
}
```

### Step 7: RDS Encryption & Backups
```bash
# Enable automated backups
aws rds modify-db-instance \
  --db-instance-identifier task-api-db \
  --backup-retention-period 7 \
  --enable-cloudwatch-logs-exports postgresql

# Verify encryption
aws rds describe-db-instances \
  --db-instance-identifier task-api-db \
  --query 'DBInstances[0].StorageEncrypted'
```

---

## 📊 Monitoring & Observability

### Health Check Integration
The `/health` endpoint enables load balancer health checks:
```bash
# ALB will periodically check:
GET /health
Response: {"status": "healthy", ...}
```

### CloudWatch Logs
```bash
# View logs
docker-compose logs -f api

# Or in AWS CloudWatch:
# /aws/ec2/task-api-server
```

### Metrics to Monitor
- API response time
- Error rate (4xx, 5xx)
- Database connection pool usage
- JWT token issuance rate
- Task creation rate (business metric)

---

## 🧪 Testing

### Unit Tests (Optional - Add Later)
```bash
pip install pytest pytest-flask
pytest tests/
```

### Load Testing
```bash
pip install locust

locust -f locustfile.py --host=http://localhost:5000
```

### Database Connection Test
```bash
psql -h localhost -U postgres -d taskdb -c "SELECT COUNT(*) FROM users;"
```

---

## 📦 Project Structure
```
flask_api_project/
├── app.py                  # Main Flask application
├── Dockerfile             # Production-ready Docker image
├── docker-compose.yml     # Local dev environment
├── requirements.txt       # Python dependencies
├── init.sql              # Database initialization
├── .env.example          # Environment variables template
├── README.md             # This file
└── .gitignore           # Git ignore patterns
```

---

## 🔧 Environment Variables

Create `.env` file:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/taskdb
JWT_SECRET_KEY=your-secret-key-here-use-openssl-rand-hex-32
FLASK_ENV=production
```

**Never commit `.env` to git!**

---

## 🚨 Troubleshooting

### Database Connection Error
```
Error: could not connect to server
```
**Solution:**
- Check PostgreSQL is running: `docker-compose ps`
- Verify DATABASE_URL is correct
- Check security groups if using AWS RDS

### JWT Token Expired
```
Error: Token has expired
```
**Solution:**
- Re-login to get new token
- Or extend expiration in `app.py`: `JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=48)`

### Docker Build Fails
```
docker-compose up --build --no-cache
```

---

## 📝 Interview Talking Points

1. **Architecture**: Explained full-stack deployment from code to AWS RDS
2. **Security**: Non-root Docker user, JWT auth, SQL injection prevention, encrypted RDS
3. **Scalability**: Database indexes for query performance, stateless API (scalable horizontally)
4. **DevOps**: Docker Compose for local dev, ALB for load balancing, RDS for managed DB
5. **Best Practices**: Multi-stage Docker build, environment-based config, health checks for automation

---

## 📧 Contact
Umar Farooque - umarsk0209@gmail.com
GitHub: https://github.com/umarsk0209
