import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const ParticipantSignup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: 'male',
    education_years: '',
    medical_history: [],
    neurological_history: [],
    family_history: 'unknown',
    smoking: 'never',
    alcohol: 'never',
    vision_hearing: 'none',
    medications: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      // Handle multi-select arrays (medical_history, neurological_history)
      if (name === 'medical_history' || name === 'neurological_history') {
        setFormData(prev => {
          const list = prev[name];
          if (checked) {
            return { ...prev, [name]: [...list, value] };
          } else {
            return { ...prev, [name]: list.filter(item => item !== value) };
          }
        });
      } else {
        setFormData({ ...formData, [name]: checked });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
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
          age: parseInt(formData.age),
          gender: formData.gender,
          education_years: parseInt(formData.education_years),
          medical_history: formData.medical_history,
          neurological_history: formData.neurological_history,
          family_history: formData.family_history,
          smoking: formData.smoking,
          alcohol: formData.alcohol,
          vision_hearing: formData.vision_hearing,
          medications: formData.medications
        }
      };

      await api.post('/auth/register', payload);
      
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  const medicalConditions = [
    "Diabetes", "Hypertension (High BP)", "High Cholesterol", "Heart Disease", "Depression", "Anxiety"
  ];

  const neurologicalConditions = [
    "Stroke / TIA", "Head Injury (with loss of consciousness)", "Epilepsy / Seizures", "Parkinson's Disease"
  ];

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
                <div>
                  <label htmlFor="age" className="block text-sm font-semibold text-gray-900 mb-2">Age</label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    required
                    className="mt-1 block w-full border-2 border-gray-300 py-3 px-4 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 sm:text-sm transition-all"
                    value={formData.age}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="gender" className="block text-sm font-semibold text-gray-900 mb-2">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    className="mt-1 block w-full border-2 border-gray-300 py-3 px-4 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 sm:text-sm transition-all"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="education_years" className="block text-sm font-semibold text-gray-900 mb-2">Years of Education</label>
                  <input
                    id="education_years"
                    name="education_years"
                    type="number"
                    required
                    className="mt-1 block w-full border-2 border-gray-300 py-3 px-4 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 sm:text-sm transition-all"
                    value={formData.education_years}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Health Information */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b-2 border-blue-700 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Health & Screening Information
              </h3>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="block text-sm font-semibold text-gray-900 mb-3">Medical History (Select all that apply)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {medicalConditions.map(cond => (
                      <label key={cond} className="inline-flex items-center hover:bg-white p-2 rounded transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          name="medical_history"
                          value={cond}
                          checked={formData.medical_history.includes(cond)}
                          onChange={handleChange}
                          className="w-4 h-4 border-2 border-gray-400 text-blue-700 focus:ring-2 focus:ring-blue-700/20"
                        />
                        <span className="ml-2 text-sm text-gray-800">{cond}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="block text-sm font-semibold text-gray-900 mb-3">Neurological History</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {neurologicalConditions.map(cond => (
                      <label key={cond} className="inline-flex items-center hover:bg-white p-2 rounded transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          name="neurological_history"
                          value={cond}
                          checked={formData.neurological_history.includes(cond)}
                          onChange={handleChange}
                          className="w-4 h-4 border-2 border-gray-400 text-blue-700 focus:ring-2 focus:ring-blue-700/20"
                        />
                        <span className="ml-2 text-sm text-gray-800">{cond}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="family_history" className="block text-sm font-semibold text-gray-900 mb-2">Family History of Dementia?</label>
                    <select
                      id="family_history"
                      name="family_history"
                      className="mt-1 block w-full border-2 border-gray-300 py-3 px-4 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 sm:text-sm transition-all"
                      value={formData.family_history}
                      onChange={handleChange}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="vision_hearing" className="block text-sm font-semibold text-gray-900 mb-2">Vision/Hearing Issues?</label>
                    <select
                      id="vision_hearing"
                      name="vision_hearing"
                      className="mt-1 block w-full border-2 border-gray-300 py-3 px-4 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 sm:text-sm transition-all"
                      value={formData.vision_hearing}
                      onChange={handleChange}
                    >
                      <option value="none">None</option>
                      <option value="corrected">Corrected (Glasses/Hearing Aid)</option>
                      <option value="uncorrected">Uncorrected (Difficulty seeing/hearing)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="smoking" className="block text-sm font-semibold text-gray-900 mb-2">Smoking Status</label>
                    <select
                      id="smoking"
                      name="smoking"
                      className="mt-1 block w-full border-2 border-gray-300 py-3 px-4 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 sm:text-sm transition-all"
                      value={formData.smoking}
                      onChange={handleChange}
                    >
                      <option value="never">Never</option>
                      <option value="past">Past Smoker</option>
                      <option value="current">Current Smoker</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="alcohol" className="block text-sm font-semibold text-gray-900 mb-2">Alcohol Consumption</label>
                    <select
                      id="alcohol"
                      name="alcohol"
                      className="mt-1 block w-full border-2 border-gray-300 py-3 px-4 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 sm:text-sm transition-all"
                      value={formData.alcohol}
                      onChange={handleChange}
                    >
                      <option value="never">Never</option>
                      <option value="occasional">Occasional</option>
                      <option value="regular">Regular</option>
                      <option value="heavy">Heavy</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="medications" className="block text-sm font-semibold text-gray-900 mb-2">Current Medications (Optional)</label>
                  <textarea
                    id="medications"
                    name="medications"
                    rows={3}
                    className="mt-1 block w-full border-2 border-gray-300 py-3 px-4 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 sm:text-sm transition-all"
                    placeholder="List any medications you are currently taking..."
                    value={formData.medications}
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
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="mt-1 block w-full border-2 border-gray-300 py-3 px-4 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 sm:text-sm transition-all"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-900 mb-2">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
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
