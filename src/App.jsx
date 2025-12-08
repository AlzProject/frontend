import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MMSETest from './tests/MMSE/MMSETest';
import MOCATest from './tests/MoCA/MOCATest';
import ACEIIITest from './tests/ACE-III/ACEIIITest';
import CDRTest from './tests/CDR/CDRTest';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ParticipantLogin from './pages/ParticipantLogin';
import ParticipantSignup from './pages/ParticipantSignup';
import TestList from './components/Admin/TestList';
import CreateTest from './components/Admin/CreateTest';
import TestDetails from './components/Admin/TestDetails';
import AttemptList from './components/Admin/AttemptList';
import EvaluationView from './components/Admin/EvaluationView';
import api from './api';
import './App.css'

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
    heroTitle: "Comprehensive Mental Health Screening",
    heroSubtitle: "Accessible and professional cognitive assessments to help identify potential concerns early.",
    startAssessment: "Start Assessment",
    footer: "© 2025 Smriti (स्मृति). All rights reserved.",
    switchLang: "मराठी"
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
    switchLang: "English"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      {/* Hero Section */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">स्</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t.title}
            </h1>
          </div>
          <nav className="flex items-center space-x-2 sm:space-x-4">
            <Link to="/" className="text-gray-600 hover:text-indigo-600 px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors">{t.home}</Link>
            <a href="#tests" className="text-gray-600 hover:text-indigo-600 px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors">{t.tests}</a>
            <a href="#about" className="text-gray-600 hover:text-indigo-600 px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors hidden sm:block">{t.about}</a>
            
            {user ? (
              <>
                <span className="text-gray-900 px-2 sm:px-3 py-2 text-sm font-medium hidden sm:inline">
                  {user.name}
                </span>
                <button 
                  onClick={handleLogout} 
                  className="text-gray-600 hover:text-red-600 px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {t.logout}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-indigo-600 px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors">{t.login}</Link>
                <Link to="/signup" className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors">{t.signup}</Link>
              </>
            )}
            
            <button 
              onClick={toggleLanguage}
              className="ml-2 px-2 sm:px-3 py-1.5 border-2 border-indigo-600 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-600 hover:text-white transition-all"
            >
              {t.switchLang}
            </button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Banner */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-base text-indigo-200 font-semibold tracking-wide uppercase animate-pulse">{t.onlineAssessment}</h2>
              <p className="mt-2 text-3xl sm:text-4xl lg:text-5xl leading-tight font-extrabold text-white">
                {t.heroTitle}
              </p>
              <p className="mt-4 max-w-3xl text-lg sm:text-xl text-indigo-100 mx-auto">
                {t.heroSubtitle}
              </p>
              <div className="mt-8">
                <a 
                  href="#tests"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-indigo-600 bg-white hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl"
                >
                  {t.startAssessment}
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Tests Section */}
        <div id="tests" className="max-w-7xl mx-auto py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">Available Assessments</h3>
            <p className="mt-2 text-gray-600">Choose a cognitive assessment test to begin</p>
          </div>

          {loadingTests ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
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
                  className="group bg-white overflow-hidden shadow-md rounded-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-indigo-300 transform hover:-translate-y-1"
                >
                  <div className="px-6 py-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Active</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                      {test.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {test.description}
                    </p>
                    <Link
                      to={`/test/${test.slug}`}
                      className="inline-flex items-center justify-center w-full px-4 py-2.5 border border-transparent font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-md hover:shadow-lg"
                    >
                      {t.startAssessment}
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
      
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
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
        <Route path="/test/mmse" element={<MMSETest />} />
        <Route path="/test/moca" element={<MOCATest />} />
        <Route path="/test/ace-iii" element={<ACEIIITest />} />
        <Route path="/test/cdr" element={<CDRTest />} />
        <Route path="/test/clinical-dementia-rating" element={<CDRTest />} />
        
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
