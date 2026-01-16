import api from './api';

/**
 * Checks if the current user has given feedback.
 * If not, redirects to the feedback page.
 * Otherwise, redirects to home.
 * 
 * @param {Function} navigate - The navigate function from useNavigate hook
 */
export const checkFeedbackAndRedirect = async (navigate) => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userObj = JSON.parse(userStr);
      // Fetch fresh user data to see if feedback exists
      const userRes = await api.get(`/users/${userObj.id}`);
      const userInfo = userRes.data.user_specific_info || {};
      const feedback = userInfo.feedback;
      
      // If feedback array is missing or empty, redirect to feedback page
      if (!feedback || !Array.isArray(feedback) || feedback.length === 0) {
        navigate('/feedback');
        return;
      }
    }
  } catch (err) {
    console.error("Error checking feedback status:", err);
    // On error, default to home to avoid blocking the user
  }
  navigate('/');
};
