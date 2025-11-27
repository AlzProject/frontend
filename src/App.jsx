import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import MMSETest from './tests/MMSE/MMSETest';
import MOCATest from './tests/MoCA/MOCATest';
import ACEIIITest from './tests/ACE-III/ACEIIITest';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ParticipantLogin from './pages/ParticipantLogin';
import ParticipantSignup from './pages/ParticipantSignup';
import TestList from './components/Admin/TestList';
import CreateTest from './components/Admin/CreateTest';
import TestDetails from './components/Admin/TestDetails';
import AttemptList from './components/Admin/AttemptList';
import EvaluationView from './components/Admin/EvaluationView';
import './App.css'

const tests = [
  {
    name: 'MoCA (Montreal Cognitive Assessment)',
    description: 'Screens for mild cognitive impairment (MCI).',
    id: 'moca'
  },
  {
    name: 'MMSE (Mini-Mental State Examination)',
    description: 'General cognitive screening for dementia.',
    id: 'mmse'
  },
  {
    name: 'CDT (Clock Drawing Test)',
    description: 'Assesses visuospatial ability & executive function.',
    id: 'cdt'
  },
  {
    name: 'SLUMS (Saint Louis University Mental Status Exam)',
    description: 'Alternative to MoCA/MMSE.',
    id: 'slums'
  },
  {
    name: 'ACE-III (Addenbrooke’s Cognitive Examination)',
    description: 'More detailed than MMSE; used for differential diagnosis.',
    id: 'ace-iii'
  },
  {
    name: 'RUDAS (Rowland Universal Dementia Assessment Scale)',
    description: 'Designed for multicultural populations.',
    id: 'rudas'
  },
  {
    name: 'Mini-Cog',
    description: 'Short dementia screening test (3-item recall + clock drawing).',
    id: 'mini-cog'
  }
];

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
  const [language, setLanguage] = useState('mr');
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const t = translations[language];
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
          <nav className="flex items-center space-x-4">
            <Link to="/" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">{t.home}</Link>
            <a href="#tests" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">{t.tests}</a>
            <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">{t.about}</a>
            
            {user ? (
              <>
                <span className="text-gray-900 px-3 py-2 text-sm font-medium">Hello, {user.name}</span>
                <button onClick={handleLogout} className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">{t.logout}</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">{t.login}</Link>
                <Link to="/signup" className="text-indigo-600 hover:text-indigo-900 px-3 py-2 rounded-md text-sm font-medium">{t.signup}</Link>
              </>
            )}
            
            <button 
              onClick={toggleLanguage}
              className="ml-4 px-3 py-1 border border-indigo-600 text-indigo-600 rounded-md text-sm font-medium hover:bg-indigo-50"
            >
              {t.switchLang}
            </button>
          </nav>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">{t.onlineAssessment}</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              {t.heroTitle}
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              {t.heroSubtitle}
            </p>
          </div>

          <div id="tests" className="mt-16">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {tests.map((test) => (
                <div key={test.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{test.name}</h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                      <p>{test.description}</p>
                    </div>
                    <div className="mt-5">
                      <Link
                        to={`/test/${test.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                      >
                        {t.startAssessment}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-base text-gray-400">
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
