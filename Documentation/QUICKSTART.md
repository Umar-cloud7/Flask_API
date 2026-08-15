# Quick Start Guide (5 Minutes)

## 1. Start the Project (Docker Compose)

```bash
# Clone or navigate to project
cd flask_api_project

# Start containers (PostgreSQL + Flask API)
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api
```

**Output:**
```
task-api        running on 0.0.0.0:5000
task-db         running on postgres://postgres@localhost:5432
```

---

## 2. Test the API (3 Commands)

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

### Login
```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "SecurePass123"
  }' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

echo "Your token: $TOKEN"
```

### Create & Get Tasks
```bash
# Create a task
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Deploy to AWS",
    "priority": "high"
  }'

# Get all tasks
curl -X GET http://localhost:5000/api/tasks \
  -H "Authorization: Bearer $TOKEN"
```

---

## 3. Health Check
```bash
curl http://localhost:5000/health
# Output: {"status": "healthy", "timestamp": "2025-01-15T10:40:00", "service": "task-api"}
```

---

## 4. Stop the Project
```bash
docker-compose down

# Also remove volumes (reset database)
docker-compose down -v
```

---

## 5. Push to GitHub (Resume Building)

```bash
git init
git add .
git commit -m "Initial commit: Flask Task API with Docker & AWS deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/flask_api_project.git
git push -u origin main
```

---

## 6. For AWS Deployment

### Quick Deploy (Copy-Paste)
```bash
# SSH into EC2
ssh -i key.pem ubuntu@<public-ip>

# One-liner setup
git clone https://github.com/YOUR_USERNAME/flask_api_project.git && \
cd flask_api_project && \
curl -fsSL https://get.docker.com | sh && \
sudo usermod -aG docker $USER && \
cat > .env << EOF
DATABASE_URL=postgresql://postgres:PASSWORD@task-api-db.xxxxx.us-east-1.rds.amazonaws.com:5432/taskdb
JWT_SECRET_KEY=$(openssl rand -hex 32)
FLASK_ENV=production
EOF
docker-compose up -d
```

---

## 🐛 Troubleshooting

### "Connection refused on 5000"
```bash
# API not started yet, wait 5 seconds
sleep 5
curl http://localhost:5000/health
```

### "Database connection error"
```bash
# Check if DB is running
docker-compose ps db

# View logs
docker-compose logs db

# Restart
docker-compose restart db
```

### "Invalid token"
```bash
# Token expired, re-login
# Or token was wrong, check you copied it correctly
```

### Docker not installed
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

---

## 📝 What's Included

✅ Flask REST API (Python)
✅ PostgreSQL Database
✅ JWT Authentication
✅ Docker & Docker Compose
✅ Gunicorn (Production WSGI server)
✅ Health checks for load balancers
✅ AWS deployment guide
✅ Security best practices
✅ Full API documentation

---

## 🎯 Next Steps for Interview

1. **Run it locally**: `docker-compose up`
2. **Test API**: Use curl commands above
3. **Read the code**: Understand `app.py` (30 min)
4. **Deploy to AWS**: Follow `AWS_DEPLOYMENT_CHECKLIST.md`
5. **Add to resume**: "Built production-ready Flask REST API with Docker, deployed to AWS with security hardening"

---

## Interview Questions to Prepare For

1. **"Walk me through your API architecture"**
   - Answer: Flask with PostgreSQL, JWT auth, containerized with Docker

2. **"How did you handle security?"**
   - Answer: Non-root Docker user, encrypted RDS, parameterized queries (SQLAlchemy ORM), JWT tokens

3. **"How would you scale this?"**
   - Answer: Auto Scaling Group, RDS read replicas, Caching (Redis), CDN for static assets

4. **"Describe your CI/CD approach"**
   - Answer: GitHub Actions → build Docker image → push to ECR → deploy to EC2

5. **"What monitoring would you add?"**
   - Answer: CloudWatch metrics, alarms for errors/CPU, health checks via ALB

---

Good luck! 🚀
