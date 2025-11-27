import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';

const EvaluationView = () => {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState({}); // Map questionId -> question details
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [attemptId]);

  const fetchData = async () => {
    try {
      const attemptRes = await api.get(`/attempts/${attemptId}`);
      setAttempt(attemptRes.data);

      const responsesRes = await api.get(`/responses?attempt_id=${attemptId}&limit=100`);
      const responsesData = responsesRes.data.items || [];
      setResponses(responsesData);

      // Fetch question details for each response to show text
      const qIds = [...new Set(responsesData.map(r => r.questionId))];
      const qPromises = qIds.map(id => api.get(`/questions/${id}`).catch(() => null));
      const qResults = await Promise.all(qPromises);
      
      const qMap = {};
      qResults.forEach(res => {
        if (res && res.data) {
          qMap[res.data.id] = res.data;
        }
      });
      setQuestions(qMap);

    } catch (error) {
      console.error('Error fetching evaluation data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (responseId, score) => {
    const comment = prompt("Optional comment:");
    try {
      await api.post('/grading/manual', {
        responseId,
        score: parseFloat(score),
        comment: comment || ''
      });
      // Refresh responses to show updated score
      const res = await api.get(`/responses/${responseId}`);
      setResponses(prev => prev.map(r => r.id === responseId ? res.data : r));
    } catch (error) {
      console.error('Grading failed', error);
      alert('Grading failed');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!attempt) return <div>Attempt not found</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900">Evaluation: Attempt #{attempt.id}</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>Status: {attempt.status}</div>
          <div>Total Score: {attempt.totalScore}</div>
          <div>User ID: {attempt.userId}</div>
          <div>Submitted: {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : 'Not submitted'}</div>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Responses</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {responses.map(response => {
            const question = questions[response.questionId];
            return (
              <li key={response.id} className="p-4">
                <div className="mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Question {response.questionId}</span>
                  <p className="text-sm text-gray-900 font-medium mt-1">
                    {question ? question.text : 'Loading question text...'}
                  </p>
                  {question && question.type === 'file_upload' && (
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                       File Upload
                     </span>
                  )}
                </div>

                <div className="bg-gray-50 p-3 rounded-md mb-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">User Answer</span>
                  <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">
                    {response.answerText || (response.selectedOptionIds ? `Options: ${response.selectedOptionIds.join(', ')}` : 'No answer')}
                  </div>
                </div>

                <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
                  <div className="text-sm">
                    <span className="font-medium">Current Score:</span> {response.score !== null ? response.score : 'Not graded'}
                    {question && <span className="text-gray-500 ml-1">/ {question.maxScore}</span>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      placeholder="Score" 
                      className="w-20 border-gray-300 rounded-md shadow-sm text-sm p-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleGrade(response.id, e.target.value);
                        }
                      }}
                    />
                    <button 
                      className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                      onClick={(e) => {
                        const input = e.target.previousSibling;
                        handleGrade(response.id, input.value);
                      }}
                    >
                      Grade
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default EvaluationView;
