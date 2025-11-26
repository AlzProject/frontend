import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextResponseQuestion,
  MultipleChoiceQuestion,
  DrawingCanvasQuestion,
  QuestionWrapper
} from '../../components/QuestionTypes';
import api from '../../api';
import mmseData from './MMSE_Questions.json';

// Internal component for Memory Registration
const MemoryRegistrationQuestion = ({ title, description, words, fields, value, onChange }) => {
  const [showWords, setShowWords] = useState(true);
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowWords(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (showWords) {
    return (
      <QuestionWrapper title={title} description={description}>
        <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <h3 className="text-2xl font-bold text-indigo-600 mb-6 tracking-wider">
            {words.join(" • ")}
          </h3>
          <p className="text-sm text-gray-500">
            Memorize these words. They will disappear in <span className="font-bold text-gray-900">{timeLeft}</span> seconds.
          </p>
        </div>
      </QuestionWrapper>
    );
  }

  return (
    <QuestionWrapper title={title} description="Please type the 3 words you just saw.">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {fields.map((field, idx) => (
          <div key={idx}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field}</label>
            <input
              type="text"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
              value={(value || [])[idx] || ''}
              onChange={(e) => {
                const newVal = [...(value || [])];
                newVal[idx] = e.target.value;
                onChange(newVal);
              }}
            />
          </div>
        ))}
      </div>
    </QuestionWrapper>
  );
};

const MMSETest = () => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const [responses, setResponses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('en'); // 'en' or 'mr'

  useEffect(() => {
    const initTest = async () => {
      try {
        // 1. Fetch tests to find MMSE
        const testsRes = await api.get('/tests');
        const tests = testsRes.data.items || [];
        const mmseTest = tests.find(t => t.name.includes('MMSE') || t.name.includes('Mini-Mental'));
        
        if (mmseTest) {
          // 2. Start an attempt
          const attemptRes = await api.post('/attempts', { testId: mmseTest.id });
          setAttemptId(attemptRes.data.id);
        } else {
          console.warn("MMSE test not found in backend. Running in offline/demo mode.");
        }
      } catch (error) {
        console.error("Failed to initialize test:", error);
      } finally {
        setLoading(false);
      }
    };

    initTest();
  }, []);

  // Define the test structure based on MMSE_STRUCTURE.md
  const sections = mmseData[language];

  const handleResponseChange = (questionId, value, fieldIndex = null) => {
    setResponses(prev => {
      if (fieldIndex !== null) {
        const currentArr = prev[questionId] || [];
        const newArr = [...currentArr];
        newArr[fieldIndex] = value;
        return { ...prev, [questionId]: newArr };
      }
      return { ...prev, [questionId]: value };
    });
  };

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (attemptId) {
        await api.post(`/attempts/${attemptId}`, {
          submit_time: new Date().toISOString()
        });
        alert("Test submitted successfully!");
      } else {
        console.log("Demo mode submission:", responses);
        alert("Test submitted successfully (Demo Mode)!");
      }
      navigate('/');
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit test. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  const renderQuestion = (q) => {
    switch (q.type) {
      case 'memory_registration':
        return (
          <MemoryRegistrationQuestion
            key={q.id}
            title={q.title}
            description={q.description}
            words={q.words}
            fields={q.fields}
            value={responses[q.id]}
            onChange={(val) => handleResponseChange(q.id, val)}
          />
        );
      case 'text':
        return (
          <TextResponseQuestion
            key={q.id}
            title={q.title}
            description={q.description}
            value={responses[q.id] || ''}
            onChange={(val) => handleResponseChange(q.id, val)}
            placeholder={q.placeholder}
          />
        );
      case 'text_multiline':
        return (
          <TextResponseQuestion
            key={q.id}
            title={q.title}
            description={q.description}
            value={responses[q.id] || ''}
            onChange={(val) => handleResponseChange(q.id, val)}
            placeholder={q.placeholder}
            multiline={true}
          />
        );
      case 'text_grouped':
        return (
          <QuestionWrapper key={q.id} title={q.title} description={q.description}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {q.fields.map((field, idx) => (
                <div key={idx}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field}</label>
                  <input
                    type="text"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    value={(responses[q.id] || [])[idx] || ''}
                    onChange={(e) => handleResponseChange(q.id, e.target.value, idx)}
                  />
                </div>
              ))}
            </div>
          </QuestionWrapper>
        );
      case 'mcq':
        return (
          <MultipleChoiceQuestion
            key={q.id}
            title={q.title}
            description={q.description}
            options={q.options}
            selectedValues={responses[q.id] ? [responses[q.id]] : []}
            onChange={(vals) => handleResponseChange(q.id, vals[0])}
            type="single"
          />
        );
      case 'drawing':
        return (
          <DrawingCanvasQuestion
            key={q.id}
            title={q.title}
            description={q.description}
            onSave={(dataUrl) => handleResponseChange(q.id, dataUrl)}
          />
        );
      default:
        return null;
    }
  };

  const currentSectionData = sections[currentSection];

  const uiText = {
    en: {
      title: "MMSE Assessment",
      section: "Section",
      of: "of",
      previous: "Previous",
      next: "Next Section",
      submit: "Submit Assessment",
      submitting: "Submitting..."
    },
    mr: {
      title: "MMSE मूल्यमापन",
      section: "विभाग",
      of: "पैकी",
      previous: "मागे",
      next: "पुढील विभाग",
      submit: "मूल्यमापन जमा करा",
      submitting: "जमा करत आहे..."
    }
  };
  const t = uiText[language];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setLanguage(language === 'en' ? 'mr' : 'en')}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {language === 'en' ? 'Switch to Marathi (मराठी)' : 'Switch to English'}
            </button>
          </div>

          <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
            ></div>
          </div>
          <p className="mt-2 text-sm text-gray-500 text-right">
            {t.section} {currentSection + 1} {t.of} {sections.length}
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
            <h2 className="text-xl font-medium text-gray-900 mb-4">{currentSectionData.title}</h2>
            <div className="space-y-6">
              {currentSectionData.questions.map(renderQuestion)}
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentSection === 0}
            className={`px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${currentSection === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {t.previous}
          </button>
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {currentSection === sections.length - 1 ? (isSubmitting ? t.submitting : t.submit) : t.next}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MMSETest;
