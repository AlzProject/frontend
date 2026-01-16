import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const ParticipantSignup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        type: 'participant',
        user_specific_info: {
          contact: formData.contact
        }
      };

      await api.post('/auth/register', payload);
      
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50/40 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-700 flex items-center justify-center mb-4">
            <span className="text-white text-3xl font-bold">स्</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Create Participant Account
          </h2>
          <p className="mt-3 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-600 underline">
              Sign in here
            </Link>
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSignup}>
          <div className="bg-white p-8 border-2 border-gray-800 shadow-2xl space-y-8">
            
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b-2 border-blue-700 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="email-address" className="block text-sm font-semibold text-gray-900 mb-2">Email address</label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="mt-1 block w-full border-2 border-gray-300 py-3 px-4 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 sm:text-sm transition-all"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="mt-1 block w-full border-2 border-gray-300 py-3 px-4 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 sm:text-sm transition-all"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="contact" className="block text-sm font-semibold text-gray-900 mb-2">Contact Number</label>
                  <input
                    id="contact"
                    name="contact"
                    type="tel"
                    className="mt-1 block w-full border-2 border-gray-300 py-3 px-4 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 sm:text-sm transition-all"
                    value={formData.contact}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Security */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b-2 border-blue-700 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Security
              </h3>
              <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      className="mt-1 block w-full border-2 border-gray-300 py-3 px-4 pr-10 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 sm:text-sm transition-all"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none mt-1"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-900 mb-2">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className="mt-1 block w-full border-2 border-gray-300 py-3 px-4 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 sm:text-sm transition-all"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>
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
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ParticipantSignup;
