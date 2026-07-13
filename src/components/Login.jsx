import React, { useState } from 'react';
import { Lock, User, AlertCircle, Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    setTimeout(() => {
      if (username.trim().toLowerCase() === 'admin' && password === 'Balaji@123') {
        onLoginSuccess({ username: 'Admin', initials: 'AD' });
      } else {
        setError('Invalid username or password.');
        setLoading(false);
      }
    }, 800); // Simulate login verification animation
  };

  // Custom keyframe and utility styles for the Login screen
  const loginStyles = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes float {
      0%, 100% {
        transform: translateY(0px) rotate(0deg);
      }
      50% {
        transform: translateY(-15px) rotate(2deg);
      }
    }

    @keyframes gradientBG {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .animate-fade-in {
      animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .animate-float {
      animation: float 6s ease-in-out infinite;
    }

    .login-container {
      display: flex;
      min-height: 100vh;
      background-color: #0b0f19;
      font-family: 'Inter', system-ui, sans-serif;
      overflow: hidden;
      width: 100%;
    }

    .login-left {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 50%;
      background: linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #0f172a 100%);
      background-size: 200% 200%;
      animation: gradientBG 15s ease infinite;
      padding: 48px;
      color: #fff;
      position: relative;
    }

    .login-left::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%);
      pointer-events: none;
    }

    .login-right {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50%;
      padding: 40px;
      position: relative;
      background-color: #0b0f19;
    }

    .login-right::before {
      content: '';
      position: absolute;
      top: 10%; right: 10%;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%);
      pointer-events: none;
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      padding: 40px;
      background: rgba(17, 24, 39, 0.7);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 24px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    }

    .login-input-wrapper {
      position: relative;
      margin-bottom: 20px;
    }

    .login-input {
      width: 100%;
      padding: 14px 16px 14px 44px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      color: #fff;
      font-size: 0.95rem;
      transition: all 0.3s ease;
    }

    .login-input:focus {
      background: rgba(255, 255, 255, 0.06);
      border-color: #8b5cf6;
      box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15);
      outline: none;
    }

    .login-btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
      border: none;
      border-radius: 12px;
      color: #fff;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .login-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(124, 58, 237, 0.3);
    }

    .login-btn:active {
      transform: translateY(0);
    }

    @media (max-width: 968px) {
      .login-left {
        display: none;
      }
      .login-right {
        width: 100%;
      }
    }
  `;

  return (
    <div className="login-container">
      <style dangerouslySetInnerHTML={{ __html: loginStyles }} />

      {/* Left Illustrative Panel */}
      <div className="login-left animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '40px', width: 'auto' }} />
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.5px' }}>KUNDAVAI</h2>
            <p style={{ fontSize: '0.75rem', letterSpacing: '1px', color: '#a78bfa' }}>AC TEC</p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '40px 0' }}>
          <img
            src="/login_illustration.png"
            alt="Dashboard illustration"
            className="animate-float"
            style={{
              maxWidth: '85%',
              height: 'auto',
              maxHeight: '400px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.4))'
            }}
          />
        </div>

        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px', lineHeight: '1.3' }}>
            Elevate Your Business Billing Experience
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '480px' }}>
            A comprehensive panel for tracking agency revenues, managing client assets, orchestrating employees, and logging operational spends.
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="login-right">
        <div className="login-card animate-fade-in" style={{ animationDelay: '0.15s' }}>
          {/* Mobile/Brand Header */}
          <div className="brand-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <img src="/logo.png" alt="Logo" style={{ height: '48px', width: 'auto' }} />
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>KUNDAVAI</h2>
                <p style={{ fontSize: '0.78rem', letterSpacing: '1px', color: '#a78bfa' }}>AC TEC</p>
              </div>
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>Welcome Back</h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>Sign in to access your administrative workspace.</p>
          </div>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#fca5a5',
              padding: '12px 14px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              marginBottom: '20px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label" htmlFor="username" style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Username</label>
              <div className="login-input-wrapper">
                <User size={18} style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  zIndex: 2
                }} />
                <input
                  id="username"
                  type="text"
                  className="login-input"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" htmlFor="password" style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Password</label>
              <div className="login-input-wrapper">
                <Lock size={18} style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  zIndex: 2
                }} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  style={{ paddingRight: '44px' }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                    zIndex: 2
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <>Verifying Session...</>
              ) : (
                <>
                  <ShieldCheck size={18} /> Sign In to Workspace
                </>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '28px' }}>
            <span style={{ fontSize: '0.78rem', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} style={{ color: '#8b5cf6' }} /> Powered by Kundavai AC Tec
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
