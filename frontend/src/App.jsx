import React, { useState } from 'react';
import axios from 'axios';
import AuthPage from './pages/AuthPage';
import TaskPage from './pages/TaskPage';

// 1. Read Vite env or fallback directly to your Render backend URL
let rawApiUrl = import.meta.env.VITE_API_URL || 'https://taskflow-api-nudj.onrender.com';

// 2. Fix Render internal hostnames missing the domain suffix
if (rawApiUrl && !rawApiUrl.includes('.') && !rawApiUrl.includes('localhost')) {
  rawApiUrl = `${rawApiUrl}.onrender.com`;
}

// 3. Ensure the URL starts with http:// or https://
if (!rawApiUrl.startsWith('http://') && !rawApiUrl.startsWith('https://')) {
  rawApiUrl = `https://${rawApiUrl}`;
}

// 4. Remove trailing slashes and ensure /api is appended
const apiOrigin = rawApiUrl.replace(/\/+$/, '');
export const API_BASE_URL = apiOrigin.endsWith('/api') ? apiOrigin : `${apiOrigin}/api`;

// Interceptor: injects Bearer token directly on every request
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const App = () => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLoginSuccess = (authToken, userData) => {
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #0b0f19 70%)' }}>
      {token && user ? (
        <TaskPage user={user} onLogout={handleLogout} />
      ) : (
        <AuthPage onAuthSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

export default App;
