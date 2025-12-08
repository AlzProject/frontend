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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create Participant Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              sign in to existing account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">Email address</label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age</label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.age}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="education_years" className="block text-sm font-medium text-gray-700">Years of Education</label>
                  <input
                    id="education_years"
                    name="education_years"
                    type="number"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.education_years}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Health Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 border-t pt-4">Health & Screening Information</h3>
              
              <div className="space-y-4">
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Medical History (Select all that apply)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {medicalConditions.map(cond => (
                      <label key={cond} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          name="medical_history"
                          value={cond}
                          checked={formData.medical_history.includes(cond)}
                          onChange={handleChange}
                          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-600">{cond}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Neurological History</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {neurologicalConditions.map(cond => (
                      <label key={cond} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          name="neurological_history"
                          value={cond}
                          checked={formData.neurological_history.includes(cond)}
                          onChange={handleChange}
                          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-600">{cond}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="family_history" className="block text-sm font-medium text-gray-700">Family History of Dementia?</label>
                    <select
                      id="family_history"
                      name="family_history"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.family_history}
                      onChange={handleChange}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="vision_hearing" className="block text-sm font-medium text-gray-700">Vision/Hearing Issues?</label>
                    <select
                      id="vision_hearing"
                      name="vision_hearing"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    <label htmlFor="smoking" className="block text-sm font-medium text-gray-700">Smoking Status</label>
                    <select
                      id="smoking"
                      name="smoking"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.smoking}
                      onChange={handleChange}
                    >
                      <option value="never">Never</option>
                      <option value="past">Past Smoker</option>
                      <option value="current">Current Smoker</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="alcohol" className="block text-sm font-medium text-gray-700">Alcohol Consumption</label>
                    <select
                      id="alcohol"
                      name="alcohol"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                  <label htmlFor="medications" className="block text-sm font-medium text-gray-700">Current Medications (Optional)</label>
                  <textarea
                    id="medications"
                    name="medications"
                    rows={2}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="List any medications you are currently taking..."
                    value={formData.medications}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Security */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 border-t pt-4">Security</h3>
              <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ParticipantSignup;
