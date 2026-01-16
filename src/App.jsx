import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MMSETest from './tests/MMSE/MMSETest';
import MOCATest from './tests/MoCA/MOCATest';
import ACEIIITest from './tests/ACE-III/ACEIIITest';
import CDRTest from './tests/CDR/CDRTest';
import ImageDescriptionTest from './tests/ImageDescription/ImageDescriptionTest';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ParticipantLogin from './pages/ParticipantLogin';
import ParticipantSignup from './pages/ParticipantSignup';
import Feedback from './pages/Feedback';
import TestList from './components/Admin/TestList';
import CreateTest from './components/Admin/CreateTest';
import TestDetails from './components/Admin/TestDetails';
import AttemptList from './components/Admin/AttemptList';
import EvaluationView from './components/Admin/EvaluationView';
import api from './api';
import './App.css'

// Protected Route Component - requires login
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Redirect to login if no token
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const translations = {
  en: {
    title: "Smriti (स्मृति)",
    home: "Home",
    tests: "Tests",
    about: "About",
    login: "Login",
    signup: "Sign Up",
    logout: "Logout",
    onlineAssessment: "Online Assessment",
    heroTitle: "Comprehensive Cognitive Screening",
    heroSubtitle: "Accessible and professional cognitive assessments to help identify potential concerns early.",
    startAssessment: "Start Assessment",
    footer: "© 2025 Smriti (स्मृति). All rights reserved.",
    switchLang: "मराठी",
    feedback: "Feedback"
  },
  mr: {
    title: "स्मृति (Smriti)",
    home: "मुख्यपृष्ठ",
    tests: "चाचण्या",
    about: "आमच्याबद्दल",
    login: "लॉगिन",
    signup: "साइन अप",
    logout: "बाहेर पडा",
    onlineAssessment: "ऑनलाइन मूल्यांकन",
    heroTitle: "सर्वसमावेशक मानसिक आरोग्य तपासणी",
    heroSubtitle: "संभाव्य चिंता लवकर ओळखण्यासाठी सुलभ आणि व्यावसायिक संज्ञानात्मक मूल्यांकन.",
    startAssessment: "चाचणी सुरू करा",
    footer: "© २०२५ स्मृति (Smriti). सर्व हक्क राखीव.",
    switchLang: "English",
    feedback: "अभिप्राय"
  }
};

function LandingPage() {
  // Default to English, persist in localStorage
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('app_language') || 'en';
  });
  
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const [tests, setTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [error, setError] = useState(null);
  
  const t = translations[language];
  const navigate = useNavigate();

  // Persist language changes
  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  // Fetch tests from backend
  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoadingTests(true);
        const response = await api.get('/tests?active=true');
        const testsData = response.data.items || response.data || [];
        
        // Filter only active tests and map to display format
        const activeTests = testsData
          .filter(test => test.isActive !== false)
          .map(test => ({
            id: test.id,
            name: test.title,
            description: test.description || 'Cognitive assessment test',
            slug: generateSlug(test.title, test.test_specific_info)
          }));
        
        setTests(activeTests);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch tests:', err);
        setError('Failed to load tests. Please try again later.');
      } finally {
        setLoadingTests(false);
      }
    };

    fetchTests();
  }, []);

  // Generate URL-friendly slug from test title or test_specific_info
  const generateSlug = (title, testSpecificInfo = {}) => {
    // First, check if slug is provided in test_specific_info
    if (testSpecificInfo?.slug) {
      return testSpecificInfo.slug;
    }
    
    // Otherwise, infer from title
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('cdr') || lowerTitle.includes('clinical dementia rating')) {
      return 'cdr';
    } else if (lowerTitle.includes('moca') || lowerTitle.includes('montreal')) {
      return 'moca';
    } else if (lowerTitle.includes('mmse') || lowerTitle.includes('mini-mental')) {
      return 'mmse';
    } else if (lowerTitle.includes('ace') || lowerTitle.includes('addenbrooke')) {
      return 'ace-iii';
    }
    
    // Default: convert title to slug
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'mr' : 'en');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Hero Section */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20 flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform">
              <span className="text-white text-lg font-bold">स्</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {t.title}
            </h1>
          </div>
          <nav className="flex items-center space-x-4 sm:space-x-6">
            {user ? (
              <>
                <Link 
                  to="/feedback"
                  className="text-slate-300 hover:text-white px-2 sm:px-3 py-2 text-sm font-medium transition-colors"
                >
                  {t.feedback}
                </Link>
                <span className="text-slate-300 px-2 sm:px-3 py-2 text-sm font-medium hidden sm:inline">
                  {user.name}
                </span>
                <button 
                  onClick={handleLogout} 
                  className="text-slate-300 hover:text-white px-2 sm:px-3 py-2 text-sm font-medium transition-colors"
                >
                  {t.logout}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-300 hover:text-white px-2 sm:px-3 py-2 text-sm font-medium transition-colors">{t.login}</Link>
                <Link to="/signup" className="bg-blue-600 text-white hover:bg-blue-500 px-4 py-1.5 text-sm font-semibold transition-all rounded-full shadow-md shadow-blue-900/20 hover:shadow-lg hover:shadow-blue-900/30 border border-blue-500/50">{t.signup}</Link>
              </>
            )}
            
            <button 
              onClick={toggleLanguage}
              className="ml-2 px-3 py-1.5 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-xs font-medium transition-all rounded-lg bg-slate-800/50 hover:bg-slate-800"
            >
              {t.switchLang}
            </button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Banner */}
        <div className="relative bg-slate-50 py-12 sm:py-16 overflow-hidden">
          {/* Animated gradient orbs - Balanced */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-80 mix-blend-multiply"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-80 mix-blend-multiply"></div>
            <div className="absolute -bottom-32 left-1/3 w-72 h-72 bg-sky-100 rounded-full blur-3xl opacity-80 mix-blend-multiply"></div>
          </div>
          
          {/* Grid pattern overlay - Subtle */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" aria-hidden="true"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                <span className="text-xs text-slate-700 font-semibold tracking-wide uppercase">{t.onlineAssessment}</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-tight font-extrabold text-slate-900 tracking-tight">
                {t.heroTitle}
              </h1>
              
              <p className="max-w-2xl text-lg text-slate-600 mx-auto leading-relaxed font-medium">
                {t.heroSubtitle}
              </p>
              
              <div className="pt-3 flex flex-wrap justify-center gap-3">
                <a href="#tests" className="inline-flex items-center px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-full shadow-md shadow-blue-700/20 transition-all hover:shadow-blue-700/30 hover:-translate-y-0.5 text-base">
                  View Assessments
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </a>
                <Link to="/signup" className="inline-flex items-center px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-full border border-slate-200 shadow-sm hover:shadow-md transition-all text-base">
                  Get Started
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tests Section */}
        <div id="tests" className="relative max-w-7xl mx-auto py-12 sm:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Background SVG Decorations */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
            {/* Brain SVG - Top Right - Rotated */}
            <svg className="absolute -top-24 -right-16 w-72 h-72 sm:w-96 sm:h-96 text-blue-700/70 transform rotate-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C10.34 2 9 3.34 9 5c0 .35.07.68.18 1-.31.1-.61.24-.88.41A2.5 2.5 0 006.5 6C4.57 6 3 7.57 3 9.5c0 .83.29 1.58.77 2.18C3.29 12.28 3 13.11 3 14c0 1.66 1.34 3 3 3 .35 0 .69-.06 1-.18.1.31.24.61.41.88-.26.48-.41 1.02-.41 1.6 0 1.93 1.57 3.5 3.5 3.5.58 0 1.12-.15 1.6-.41.27.17.57.31.88.41-.12.31-.18.65-.18 1 0 1.66 1.34 3 3 3s3-1.34 3-3c0-.35-.06-.69-.18-1 .31-.1.61-.24.88-.41.48.26 1.02.41 1.6.41 1.93 0 3.5-1.57 3.5-3.5 0-.58-.15-1.12-.41-1.6.17-.27.31-.57.41-.88.31.12.65.18 1 .18 1.66 0 3-1.34 3-3 0-.89-.29-1.72-.77-2.38.48-.6.77-1.35.77-2.18C21 7.57 19.43 6 17.5 6c-.58 0-1.12.15-1.6.41-.27-.17-.57-.31-.88-.41.12-.32.18-.65.18-1 0-1.66-1.34-3-3-3z"/>
            </svg>
            
            {/* Report SVG - Bottom Left - Rotated */}
            <svg className="absolute bottom-0 -left-16 w-64 h-64 sm:w-80 sm:h-80 text-blue-800/70 transform -rotate-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v4a2 2 0 002 2h4" />
            </svg>
          </div>

          {/* Content */}
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">Available Assessments</h3>
            <p className="mt-2 text-gray-600">Choose a cognitive assessment test to begin</p>
          </div>

          {loadingTests ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-700"></div>
              <p className="mt-4 text-gray-600">Loading assessments...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-600">No tests available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {tests.map((test) => (
                <div 
                  key={test.id} 
                  className="group bg-white overflow-hidden border border-gray-200 hover:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-xl rounded-xl"
                >
                  <div className="px-6 py-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-blue-50 border border-blue-100 flex items-center justify-center rounded-lg">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">Active</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                      {test.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {test.description}
                    </p>
                    <Link
                      to={`/test/${test.slug}`}
                      className="inline-flex items-center justify-center w-full px-4 py-2.5 border border-gray-900 font-semibold text-gray-900 bg-white hover:bg-blue-600 hover:text-white hover:border-blue-600 focus:outline-none transition-all rounded-lg"
                    >
                      Begin Test
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <footer className="bg-slate-50 border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500">
            {t.footer}
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<ParticipantLogin />} />
        <Route path="/signup" element={<ParticipantSignup />} />
        <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
        
        {/* Test Routes */}
        <Route path="/test/mmse" element={<ProtectedRoute><MMSETest /></ProtectedRoute>} />
        <Route path="/test/moca" element={<ProtectedRoute><MOCATest /></ProtectedRoute>} />
        <Route path="/test/ace-iii" element={<ProtectedRoute><ACEIIITest /></ProtectedRoute>} />
        <Route path="/test/cdr" element={<ProtectedRoute><CDRTest /></ProtectedRoute>} />
        <Route path="/test/clinical-dementia-rating" element={<ProtectedRoute><CDRTest /></ProtectedRoute>} />
        <Route path="/test/image-description" element={<ProtectedRoute><ImageDescriptionTest /></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />}>
          <Route index element={<div className="text-center py-10">Select an option from the menu</div>} />
          <Route path="tests" element={<TestList />} />
          <Route path="tests/create" element={<CreateTest />} />
          <Route path="tests/:testId" element={<TestDetails />} />
          <Route path="attempts" element={<AttemptList />} />
          <Route path="attempts/:attemptId" element={<EvaluationView />} />
          <Route path="users" element={<div className="p-4">User management coming soon...</div>} />
        </Route>
        {/* Add other test routes here as needed */}
      </Routes>
    </Router>
  );
}

export default App;
