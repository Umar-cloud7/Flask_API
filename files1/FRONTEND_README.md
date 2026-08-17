# Task Management Frontend - React + Vite

Production-ready React frontend for the Task Management API with Docker containerization.

## 📋 Features

✅ **User Authentication**
- Registration & Login with JWT tokens
- Secure token storage (localStorage)
- Auto-logout on token expiration

✅ **Task Management**
- Create, Read, Update, Delete (CRUD) tasks
- Real-time filtering by status & priority
- Task statistics dashboard
- Status transitions (Pending → In Progress → Completed)

✅ **User Interface**
- Responsive design (mobile-friendly)
- Modern gradient UI with card-based layout
- Real-time updates
- Intuitive task filtering

✅ **Production Ready**
- Docker containerization with Nginx
- Multi-stage build for optimized image
- Security headers configured
- Gzip compression enabled
- API proxy through Nginx

---

## 🏗️ Technology Stack

**Frontend:**
- React 18 (UI framework)
- Vite (build tool)
- Axios (HTTP client)
- React Router (navigation)

**Build & Deployment:**
- Nginx (web server)
- Docker (containerization)
- Node.js (build environment)

---

## 📂 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── TaskForm.jsx      - Create new tasks
│   │   ├── TaskCard.jsx      - Display individual tasks
│   │   └── StatCard.jsx      - Display statistics
│   ├── pages/
│   │   ├── AuthPage.jsx      - Login/Registration
│   │   └── TasksPage.jsx     - Main dashboard
│   ├── App.jsx               - Main app component
│   └── main.jsx              - Entry point
├── index.html                - HTML template
├── vite.config.js            - Vite configuration
├── Dockerfile                - Production Docker image
├── nginx.conf                - Nginx main config
├── nginx-default.conf        - Nginx server config
├── package.json              - Dependencies
├── .env.example              - Environment template
├── .gitignore                - Git ignore patterns
└── .dockerignore             - Docker ignore patterns
```

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Access at: `http://localhost:5173`

The app will proxy API requests to `http://localhost:5000` (make sure backend is running).

### 3. Test with Mock API

Before starting the backend, test the UI:

```bash
# The app will work but API calls will fail
# Use browser console to see the errors
```

---

## 🐳 Docker Deployment

### Build Docker Image

```bash
docker build -t task-frontend:1.0 .
```

### Run Container Locally

```bash
docker run -p 3000:3000 \
  -e REACT_APP_API_URL=http://localhost:5000 \
  task-frontend:1.0
```

Access at: `http://localhost:3000`

### Build & Run with Docker Compose

```bash
# Full stack (frontend + backend + database)
docker-compose -f docker-compose-full.yml up -d

# Access frontend: http://localhost:3000
# Access API: http://localhost:5000
```

---

## 📊 API Integration

The frontend communicates with the Flask backend via REST API.

### Endpoints Used

```
POST   /api/auth/register     - User registration
POST   /api/auth/login        - User login
GET    /api/tasks             - List all tasks
POST   /api/tasks             - Create task
PUT    /api/tasks/<id>        - Update task
DELETE /api/tasks/<id>        - Delete task
GET    /api/stats             - Get statistics
```

### API Client Configuration

The app uses Axios with automatic token injection:

```javascript
// Token is automatically added to all requests
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
```

---

## 🔧 Environment Variables

Create `.env` file in `frontend/` directory:

```bash
# Development
REACT_APP_API_URL=http://localhost:5000

# Production
REACT_APP_API_URL=https://api.yourdomain.com
```

---

## 🎨 Customization

### Change API URL

Edit `src/App.jsx`:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://api:5000'
```

### Modify Styling

Edit `index.html` `<style>` section for global CSS, or create `src/App.css`.

### Add More Components

Create new components in `src/components/` and import in pages.

---

## 🔐 Security Features

✅ **Authentication**
- JWT tokens stored securely
- Token sent in Authorization header
- Automatic token refresh on login

✅ **Security Headers** (Nginx)
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

✅ **Build Optimization**
- No source maps in production
- Minified JS and CSS
- Gzip compression enabled

✅ **Container Security**
- Non-root user (appuser)
- Read-only filesystem where possible
- Health checks enabled

---

## 📈 Performance Optimizations

✅ **Build**
- Multi-stage Docker build (~30MB final image)
- Minified JavaScript and CSS
- Tree-shaking enabled by Vite

✅ **Runtime**
- Gzip compression on all text resources
- Cache-busting for static assets (1-year expiration)
- API requests cached locally via browser cache

✅ **Network**
- API proxy through Nginx (same origin)
- CORS not needed (same server)
- Optimized bundle size (~50KB gzipped)

---

## 🧪 Testing the Frontend

### Test Authentication Flow

1. Register new user:
   ```bash
   Username: testuser
   Email: test@example.com
   Password: SecurePass123
   ```

2. Login with credentials

3. Create a task:
   - Title: "Test Task"
   - Priority: High
   - Description: "Testing the frontend"

4. Update task status to "In Progress"

5. Mark as "Completed"

6. Verify statistics update

### Test Responsive Design

- Open DevTools (F12)
- Toggle device toolbar (Ctrl+Shift+M)
- Test on multiple screen sizes

---

## 🚀 AWS Deployment

### Step 1: Build and Push to ECR

```bash
# Build image
docker build -t task-frontend:1.0 .

# Tag for ECR
docker tag task-frontend:1.0 YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/task-frontend:1.0

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/task-frontend:1.0
```

### Step 2: Deploy to ECS or EC2

```bash
# On EC2, update docker-compose:
docker pull YOUR_ECR_IMAGE:1.0
docker run -p 3000:3000 \
  -e REACT_APP_API_URL=https://api.yourdomain.com \
  YOUR_ECR_IMAGE:1.0
```

### Step 3: Configure ALB

- ALB forwards port 3000 to frontend container
- Backend API on port 5000 (or ALB on different host)

### Step 4: Enable HTTPS

```bash
# ACM certificate for frontend domain
aws acm request-certificate \
  --domain-name frontend.yourdomain.com
```

---

## 📊 Monitoring & Logging

### Docker Logs

```bash
docker logs task-frontend

# Follow logs
docker logs -f task-frontend
```

### Nginx Access Logs

```bash
docker exec task-frontend tail -f /var/log/nginx/access.log
```

### Browser Console

Open DevTools (F12) → Console tab to see:
- API errors
- Network requests
- React warnings

---

## 🐛 Troubleshooting

### Issue: "API connection refused"

**Cause:** Backend is not running or API_URL is wrong

**Solution:**
```bash
# Check backend is running
curl http://localhost:5000/health

# Update API_URL in .env
REACT_APP_API_URL=http://YOUR_BACKEND_IP:5000
```

### Issue: "CORS error"

**Cause:** Frontend and backend on different origins

**Solution:**
- Use Nginx proxy (already configured)
- Or enable CORS on backend

### Issue: "Tasks not loading"

**Cause:** Token expired or not authenticated

**Solution:**
- Clear localStorage: `localStorage.clear()`
- Re-login in the app

### Issue: "Docker build fails"

**Cause:** Node dependencies not installed

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Rebuild
docker build --no-cache -t task-frontend:1.0 .
```

---

## 🎯 Interview Talking Points

**"Tell me about your frontend implementation"**

Answer:
"I built a React frontend using Vite for fast development. Key features:

1. **Architecture:**
   - Component-based design (TaskForm, TaskCard, StatCard)
   - Axios for API communication with auto-token injection
   - React Router for navigation

2. **Authentication:**
   - JWT-based with localStorage persistence
   - Secure token handling (Authorization header)
   - Auto-logout on 401 errors

3. **UI/UX:**
   - Responsive design (mobile-first)
   - Real-time filtering and sorting
   - Statistics dashboard
   - Intuitive task management

4. **Deployment:**
   - Multi-stage Docker build (~30MB image)
   - Nginx as reverse proxy
   - Gzip compression and security headers
   - Production-ready configuration

5. **Integration:**
   - Seamless backend communication via REST API
   - Proxy through Nginx (no CORS needed)
   - Can be deployed on AWS ALB or standalone

The frontend demonstrates full-stack understanding - not just building UI, but considering deployment, performance, and integration with backend."

---

## 📦 Build Statistics

```
Source Code:     ~500 lines
Bundle Size:     ~50 KB (gzipped)
Docker Image:    ~30 MB
Build Time:      ~2 minutes
```

---

## 🔗 Related Files

- Backend: See `/app.py` and `README.md`
- Deployment: See `AWS_DEPLOYMENT_QUICK_GUIDE.md`
- Docker: See `docker-compose-full.yml`

---

## 📝 License

MIT

---

## 📧 Contact

Umar Farooque - umarsk0209@gmail.com
GitHub: https://github.com/umarsk0209

---

**Your React frontend is production-ready and fully integrated with the Flask backend!** 🚀
