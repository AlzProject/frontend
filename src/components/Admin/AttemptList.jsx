import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

const AttemptList = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      const response = await api.get('/attempts');
      setAttempts(response.data.items || []);
    } catch (error) {
      console.error('Failed to fetch attempts', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Attempts</h3>
      </div>
      <ul className="divide-y divide-gray-200">
        {attempts.map((attempt) => (
          <li key={attempt.id}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-indigo-600 truncate">
                  Attempt #{attempt.id} (Test ID: {attempt.testId})
                </p>
                <div className="ml-2 shrink-0 flex">
                  <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${attempt.status === 'graded' ? 'bg-green-100 text-green-800' : 
                      attempt.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'}`}>
                    {attempt.status}
                  </p>
                </div>
              </div>
              <div className="mt-2 sm:flex sm:justify-between">
                <div className="sm:flex">
                  <p className="flex items-center text-sm text-gray-500">
                    User ID: {attempt.userId}
                  </p>
                  <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                    Score: {attempt.totalScore !== null ? attempt.totalScore : 'N/A'}
                  </p>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                  <Link to={`/admin/dashboard/attempts/${attempt.id}`} className="text-indigo-600 hover:text-indigo-900">
                    Evaluate / View
                  </Link>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AttemptList;
