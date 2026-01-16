import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Feedback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    satisfactionRating: '',
    uiRating: '',
    testsRating: '',
    navigationRating: '',
    responseTimeRating: '',
    accessibilityRating: '',
    recommendationRating: '',
    uiFeedback: '',
    testsFeedback: '',
    uxFeedback: '',
    suggestions: ''
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        alert("Please login to submit feedback");
        navigate('/login');
        return;
      }
      const user = JSON.parse(userStr);

      // Get current user details to preserve existing info
      const userResponse = await api.get(`/users/${user.id}`);
      // Handle different response structures if necessary, assume user object is directly in data or data.user
      const userData = userResponse.data; 
      const userInfo = userData.user_specific_info || {};
      
      // Append new feedback to existing feedback list or create new
      const currentFeedbackList = userInfo.feedback || [];
      const newFeedbackEntry = {
        id: Date.now().toString(),
        submittedAt: new Date().toISOString(),
        ...formData,
        satisfactionRating: parseInt(formData.satisfactionRating),
        uiRating: parseInt(formData.uiRating),
        testsRating: parseInt(formData.testsRating),
        navigationRating: parseInt(formData.navigationRating),
        responseTimeRating: parseInt(formData.responseTimeRating),
        accessibilityRating: parseInt(formData.accessibilityRating),
        recommendationRating: parseInt(formData.recommendationRating)
      };

      const updatedInfo = {
        ...userInfo,
        feedback: [...currentFeedbackList, newFeedbackEntry]
      };

      // Patch user info
      await api.patch(`/users/${user.id}`, {
        user_specific_info: updatedInfo
      });

      alert('Feedback submitted successfully. Thank you for helping us improve!');
      navigate('/');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Platform Feedback</h2>
          <p className="text-blue-200 text-sm">Your feedback helps us improve Smriti (स्मृति) for everyone.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Overall Satisfaction Rating */}
          <div>
            <label htmlFor="satisfactionRating" className="block text-sm font-medium text-slate-700 mb-1">
              Overall Satisfaction
            </label>
            <p className="text-xs text-slate-500 mb-2">How satisfied are you with the platform overall?</p>
            <div className="flex items-center justify-between gap-2 mt-2">
              <span className="text-xs text-slate-600">Very Dissatisfied</span>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <label key={rating} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="satisfactionRating"
                      value={rating}
                      checked={parseInt(formData.satisfactionRating) === rating}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      required
                    />
                    <span className="ml-1 text-sm text-slate-700 font-medium">{rating}</span>
                  </label>
                ))}
              </div>
              <span className="text-xs text-slate-600">Very Satisfied</span>
            </div>
          </div>

          {/* UI Rating */}
          <div>
            <label htmlFor="uiRating" className="block text-sm font-medium text-slate-700 mb-1">
              User Interface Design
            </label>
            <p className="text-xs text-slate-500 mb-2">How would you rate the visual design, colors, and layout?</p>
            <div className="flex items-center justify-between gap-2 mt-2">
              <span className="text-xs text-slate-600">Poor</span>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <label key={rating} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="uiRating"
                      value={rating}
                      checked={parseInt(formData.uiRating) === rating}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      required
                    />
                    <span className="ml-1 text-sm text-slate-700 font-medium">{rating}</span>
                  </label>
                ))}
              </div>
              <span className="text-xs text-slate-600">Excellent</span>
            </div>
          </div>

          {/* Tests Quality Rating */}
          <div>
            <label htmlFor="testsRating" className="block text-sm font-medium text-slate-700 mb-1">
              Tests Quality & Clarity
            </label>
            <p className="text-xs text-slate-500 mb-2">How clear and comprehensive were the cognitive assessment tests?</p>
            <div className="flex items-center justify-between gap-2 mt-2">
              <span className="text-xs text-slate-600">Confusing</span>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <label key={rating} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="testsRating"
                      value={rating}
                      checked={parseInt(formData.testsRating) === rating}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      required
                    />
                    <span className="ml-1 text-sm text-slate-700 font-medium">{rating}</span>
                  </label>
                ))}
              </div>
              <span className="text-xs text-slate-600">Very Clear</span>
            </div>
          </div>

          {/* Navigation Rating */}
          <div>
            <label htmlFor="navigationRating" className="block text-sm font-medium text-slate-700 mb-1">
              Ease of Navigation
            </label>
            <p className="text-xs text-slate-500 mb-2">How easy was it to find what you needed and move around the platform?</p>
            <div className="flex items-center justify-between gap-2 mt-2">
              <span className="text-xs text-slate-600">Difficult</span>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <label key={rating} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="navigationRating"
                      value={rating}
                      checked={parseInt(formData.navigationRating) === rating}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      required
                    />
                    <span className="ml-1 text-sm text-slate-700 font-medium">{rating}</span>
                  </label>
                ))}
              </div>
              <span className="text-xs text-slate-600">Very Easy</span>
            </div>
          </div>

          {/* Response Time Rating */}
          <div>
            <label htmlFor="responseTimeRating" className="block text-sm font-medium text-slate-700 mb-1">
              Platform Speed & Performance
            </label>
            <p className="text-xs text-slate-500 mb-2">How would you rate the loading times and responsiveness?</p>
            <div className="flex items-center justify-between gap-2 mt-2">
              <span className="text-xs text-slate-600">Very Slow</span>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <label key={rating} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="responseTimeRating"
                      value={rating}
                      checked={parseInt(formData.responseTimeRating) === rating}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      required
                    />
                    <span className="ml-1 text-sm text-slate-700 font-medium">{rating}</span>
                  </label>
                ))}
              </div>
              <span className="text-xs text-slate-600">Very Fast</span>
            </div>
          </div>

          {/* Accessibility Rating */}
          <div>
            <label htmlFor="accessibilityRating" className="block text-sm font-medium text-slate-700 mb-1">
              Accessibility & Ease of Use
            </label>
            <p className="text-xs text-slate-500 mb-2">How accessible and user-friendly was the platform for you?</p>
            <div className="flex items-center justify-between gap-2 mt-2">
              <span className="text-xs text-slate-600">Not Accessible</span>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <label key={rating} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="accessibilityRating"
                      value={rating}
                      checked={parseInt(formData.accessibilityRating) === rating}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      required
                    />
                    <span className="ml-1 text-sm text-slate-700 font-medium">{rating}</span>
                  </label>
                ))}
              </div>
              <span className="text-xs text-slate-600">Very Accessible</span>
            </div>
          </div>

          {/* Recommendation Rating */}
          <div>
            <label htmlFor="recommendationRating" className="block text-sm font-medium text-slate-700 mb-1">
              Likelihood to Recommend
            </label>
            <p className="text-xs text-slate-500 mb-2">How likely are you to recommend this platform to others?</p>
            <div className="flex items-center justify-between gap-2 mt-2">
              <span className="text-xs text-slate-600">Not Likely</span>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <label key={rating} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="recommendationRating"
                      value={rating}
                      checked={parseInt(formData.recommendationRating) === rating}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      required
                    />
                    <span className="ml-1 text-sm text-slate-700 font-medium">{rating}</span>
                  </label>
                ))}
              </div>
              <span className="text-xs text-slate-600">Very Likely</span>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 mt-6">
            <h3 className="text-base font-semibold text-slate-800 mb-4">Additional Comments (Optional)</h3>
          </div>
          
          {/* User Interface */}
          <div>
            <label htmlFor="uiFeedback" className="block text-sm font-medium text-slate-700 mb-1">
              User Interface Feedback
            </label>
            <p className="text-xs text-slate-500 mb-2">Share any specific thoughts about the design, colors, or layout.</p>
            <textarea
              id="uiFeedback"
              name="uiFeedback"
              rows={3}
              value={formData.uiFeedback}
              onChange={handleChange}
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
              placeholder="e.g., The colors are pleasing, but the text size could be larger..."
            />
          </div>

          {/* Tests Experience */}
          <div>
            <label htmlFor="testsFeedback" className="block text-sm font-medium text-slate-700 mb-1">
              Tests Experience Feedback
            </label>
            <p className="text-xs text-slate-500 mb-2">Share your experience with the cognitive assessment tests.</p>
            <textarea
              id="testsFeedback"
              name="testsFeedback"
              rows={3}
              value={formData.testsFeedback}
              onChange={handleChange}
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
              placeholder="e.g., The instructions were clear, but the Image Description test loaded slowly..."
            />
          </div>

          {/* User Experience */}
          <div>
            <label htmlFor="uxFeedback" className="block text-sm font-medium text-slate-700 mb-1">
              User Experience Feedback
            </label>
            <p className="text-xs text-slate-500 mb-2">Share any navigation issues or usability concerns you encountered.</p>
            <textarea
              id="uxFeedback"
              name="uxFeedback"
              rows={3}
              value={formData.uxFeedback}
              onChange={handleChange}
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
              placeholder="e.g., Navigation is intuitive, but I couldn't find the logout button easily..."
            />
          </div>

          {/* Suggestions */}
          <div>
            <label htmlFor="suggestions" className="block text-sm font-medium text-slate-700 mb-1">
              Suggestions & Improvements
            </label>
            <p className="text-xs text-slate-500 mb-2">What features or changes would you like to see?</p>
            <textarea
              id="suggestions"
              name="suggestions"
              rows={3}
              value={formData.suggestions}
              onChange={handleChange}
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
              placeholder="e.g., Please add a dark mode or more language options..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Feedback;
