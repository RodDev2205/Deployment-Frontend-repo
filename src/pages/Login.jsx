import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo3.png';
import API_BASE_URL from '../config/api';

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    if (password.length < 3) {
      setError('Password must be at least 3 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, platform: 'web' }),
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        if (data.error === 'Deactivated' || response.status === 403) {
          setError(data.message || 'Your account is deactivated.');
        } else {
          setError(data.error || 'Invalid credentials!');
        }
        return;
      }

      // Login success
      const roleId = Number(data.role_id);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role_id', roleId);
      setSuccess(true);

      // Redirect based on role
      switch (roleId) {
        case 3:
          navigate('/superadmin');
          break;
        case 2:
          navigate('/admin');
          break;
        case 1:
          navigate('/pos');
          break;
        default:
          setError('Unknown role returned by backend.');
      }
    } catch (err) {
      setLoading(false);
      setError('Server error. Cannot connect to backend.');
    }
  };

  return (
    <div className="w-full min-h-screen flex">
      {/* Left Info Panel */}
      <div className="w-1/2 bg-emerald-700 text-white flex flex-col items-center justify-center p-12 relative rounded-r-2xl">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold">Point of Sale</h1>
          <div className="w-2 h-2 bg-white rounded-full mx-auto"></div>
          <h2 className="text-2xl font-bold">Employee Management</h2>
          <div className="w-2 h-2 bg-white rounded-full mx-auto"></div>
          <h2 className="text-2xl font-bold">Inventory and Records</h2>
          <div className="w-2 h-2 bg-white rounded-full mx-auto"></div>
          <h2 className="text-2xl font-bold">Business Analytics</h2>
        </div>
        <div className="absolute bottom-8 text-center text-sm">
          <p>Brought to you by CodeStrive Systems,</p>
          <p>a WMSU CSS student company group</p>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-1/2 bg-gray-100 flex flex-col items-center justify-center p-12">
        <div className="w-full max-w-sm">
          {logo ? (
            <img src={logo} alt="Profile" className="w-90 h-auto mx-auto mb-3" />
          ) : (
            <User className="w-20 h-20 text-gray-500 mx-auto mb-6" />
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-md font-medium text-gray-700 mb-1">Username:</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-md font-medium text-gray-700 mb-1">Password:</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border-2 border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-4 h-4 text-green-600 shrink-0">✓</div>
                <span className="text-sm text-green-600">Login successful!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-700 text-white font-semibold rounded hover:bg-emerald-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'LOGGING IN...' : 'LOGIN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
