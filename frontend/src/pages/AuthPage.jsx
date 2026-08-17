import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../App';
import { ShieldCheck, Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

const AuthPage = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? `${API_BASE_URL}/auth/login` : `${API_BASE_URL}/auth/register`;
    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : { name: formData.name, email: formData.email, password: formData.password };

    try {
      const response = await axios.post(endpoint, payload);
      const data = response.data;

      // Extract token and user object
      const token = data.token;
      const user = data.user || {
        email: formData.email,
        name: formData.name || data.name || 'User',
        id: data.id || '1'
      };

      if (token) {
        onAuthSuccess(token, user);
      } else {
        setError('Authentication token missing from response.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Authentication failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
      <div style={{
        width: '100%', maxWidth: '440px', background: 'rgba(17, 24, 39, 0.85)',
        backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', padding: '14px', borderRadius: '18px',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)', marginBottom: '16px',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            <ShieldCheck size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px' }}>TaskFlow Pro</h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '6px' }}>
            {isLogin ? 'Sign in to access your workspace' : 'Create an account to manage tasks'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px', padding: '12px 14px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', fontSize: '14px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#d1d5db', marginBottom: '6px' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="#6b7280" style={{ position: 'absolute', left: '14px', top: '13px' }} />
                <input
                  type="text"
                  required
                  placeholder="Alex Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%', padding: '12px 14px 12px 42px', background: '#0b0f19',
                    border: '1px solid #374151', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none'
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#d1d5db', marginBottom: '6px' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#6b7280" style={{ position: 'absolute', left: '14px', top: '13px' }} />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%', padding: '12px 14px 12px 42px', background: '#0b0f19',
                  border: '1px solid #374151', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#d1d5db', marginBottom: '6px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#6b7280" style={{ position: 'absolute', left: '14px', top: '13px' }} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{
                  width: '100%', padding: '12px 14px 12px 42px', background: '#0b0f19',
                  border: '1px solid #374151', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '10px', padding: '13px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff', border: 'none', fontWeight: '700', fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already registered? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;