import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MMSETest from './tests/MMSE/MMSETest';
import MOCATest from './tests/MoCA/MOCATest';
import ACEIIITest from './tests/ACE-III/ACEIIITest';
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

function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">MindCheck</h1>
          <nav>
            <Link to="/" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Home</Link>
            <a href="#tests" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Tests</a>
            <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">About</a>
          </nav>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Online Assessment</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Comprehensive Mental Health Screening
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Accessible and professional cognitive assessments to help identify potential concerns early.
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
                        Start Assessment
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
            &copy; 2025 MindCheck. All rights reserved.
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
        <Route path="/test/mmse" element={<MMSETest />} />
        <Route path="/test/moca" element={<MOCATest />} />
        <Route path="/test/ace-iii" element={<ACEIIITest />} />
        {/* Add other test routes here as needed */}
      </Routes>
    </Router>
  );
}

export default App;
