import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const ParticipantLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;
      
      if (user.type !== 'participant') {
        setError('Access denied. Please use the correct login page.');
        return;
      }

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/'); // Redirect to dashboard/home
    } catch (err) {
      console.error(err);
      setError('Invalid credentials or server error.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50/40 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white border-2 border-gray-800 shadow-2xl p-8 space-y-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-700 flex items-center justify-center mb-4">
              <span className="text-white text-3xl font-bold">स्</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Participant Login
            </h2>
            <p className="mt-3 text-sm text-gray-600">
              New here?{' '}
              <Link to="/signup" className="font-semibold text-blue-700 hover:text-blue-600 underline">
                Create an account
              </Link>
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-5">
              <div>
                <label htmlFor="email-address" className="block text-sm font-semibold text-gray-900 mb-2">Email address</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 sm:text-sm transition-all"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 sm:text-sm transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-600 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border-2 border-gray-900 text-base font-semibold text-white bg-gray-900 hover:bg-blue-700 hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                Sign in
              </button>
            </div>
            
            <div className="text-center pt-4 border-t border-gray-200">
              <Link to="/admin/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                Admin Login →
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ParticipantLogin;
