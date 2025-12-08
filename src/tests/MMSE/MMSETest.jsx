import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextResponseQuestion,
  MultipleChoiceQuestion,
  DrawingCanvasQuestion,
  QuestionWrapper
} from '../../components/QuestionTypes';
import api from '../../api';

// Helper to convert data URL to Blob
const dataURLtoBlob = (dataurl) => {
  try {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error("Error converting data URL to blob", e);
    return null;
  }
};

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
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en'); // 'en' or 'mr'
  const [sections, setSections] = useState([]);
  const [testId, setTestId] = useState(null);
  const [testSpecificInfo, setTestSpecificInfo] = useState({});
  const [testTitle, setTestTitle] = useState('MMSE Test');
  
  // Ref to prevent duplicate attempt creation
  const attemptInitializedRef = React.useRef(false);

  useEffect(() => {
    const initTest = async () => {
      // Prevent duplicate initialization (React Strict Mode double-mount)
      if (attemptInitializedRef.current) return;
      attemptInitializedRef.current = true;
      
      setLoading(true);
      try {
        // 1. Fetch tests to find MMSE
        const testsRes = await api.get('/tests');
        const tests = testsRes.data.items || [];
        const mmseTest = tests.find(t => 
          (t.title || '').includes('MMSE') || 
          (t.title || '').includes('Mini-Mental')
        );
        
        if (mmseTest) {
          setTestId(mmseTest.id);
          setTestTitle(mmseTest.title);
          setTestSpecificInfo(mmseTest.test_specific_info || {});
          
          // 2. Fetch Sections & Questions
          try {
            const sectionsRes = await api.get(`/tests/${mmseTest.id}/sections`);
            const sectionsData = Array.isArray(sectionsRes.data) ? sectionsRes.data : [];
            sectionsData.sort((a, b) => a.orderIndex - b.orderIndex);

            const fullSections = await Promise.all(sectionsData.map(async (section) => {
              const qRes = await api.get(`/sections/${section.id}/questions`);
              return {
                ...section,
                questions: Array.isArray(qRes.data) ? qRes.data.map(q => ({
                  ...q,
                  config: q.config || {}
                })) : []
              };
            }));

            setSections(fullSections);

            // 3. Check for existing in-progress attempt
            try {
              const attemptsRes = await api.get('/attempts');
              const attempts = attemptsRes.data.items || attemptsRes.data || [];
              
              const activeAttempt = attempts.find(a => 
                a.testId === mmseTest.id && !a.submittedAt && !a.submit_time
              );

              if (activeAttempt) {
                console.log("Resuming attempt:", activeAttempt.id);
                setAttemptId(activeAttempt.id);
                
                // Fetch previous responses for this attempt
                try {
                  const responsesRes = await api.get(`/responses?attempt_id=${activeAttempt.id}`);
                  const responsesData = responsesRes.data.items || responsesRes.data || [];
                  
                  if (Array.isArray(responsesData) && responsesData.length > 0) {
                    const loadedResponses = {};
                    responsesData.forEach(r => {
                      // Parse answerText if it's a JSON string
                      let value = r.answerText;
                      try {
                        value = JSON.parse(r.answerText);
                      } catch (e) {
                        // If parsing fails, keep as string
                      }
                      loadedResponses[r.questionId] = value;
                    });
                    setResponses(loadedResponses);
                    console.log("Loaded", responsesData.length, "previous responses");
                  }
                } catch (err) {
                  console.error("Failed to load existing responses", err);
                }
              } else {
                // Start a new attempt
                const attemptRes = await api.post('/attempts', { testId: mmseTest.id });
                setAttemptId(attemptRes.data.id);
              }
            } catch (attemptError) {
              console.warn("Failed to start attempt (running in demo mode):", attemptError);
            }
          } catch (secError) {
            console.error("Failed to fetch sections:", secError);
            setError("Failed to load test content.");
          }
        } else {
          setError("MMSE Test not found in the system.");
        }
      } catch (error) {
        console.error("Failed to initialize test:", error);
        setError("Failed to load test. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    initTest();
  }, []);

  // Helper to get translated content
  const getTranslation = (lang, sectionIdx, questionIdx) => {
    if (!sections || sections.length === 0 || !sections[sectionIdx]) return null;
    
    // Default to English content
    const section = sections[sectionIdx];
    const question = section.questions[questionIdx];
    
    let content = {
      sectionTitle: section.title,
      qText: question.text,
      config: question.config || {}
    };

    // Apply translation if available
    if (lang !== 'en' && testSpecificInfo?.translations?.[lang]) {
      const trans = testSpecificInfo.translations[lang];
      
      // 1. Test Level
      // (Not used directly in rendering questions but good to have)
      
      // 2. Section Level
      if (trans.sections && trans.sections[sectionIdx]) {
        const secTrans = trans.sections[sectionIdx];
        if (secTrans.title) content.sectionTitle = secTrans.title;
        
        // 3. Question Level
        if (secTrans.questions && secTrans.questions[questionIdx]) {
          const qTrans = secTrans.questions[questionIdx];
          if (qTrans.text) content.qText = qTrans.text;
          if (qTrans.config) {
            content.config = { ...content.config, ...qTrans.config };
          }
        }
      }
    }
    
    return content;
  };

  const saveResponseToBackend = async (questionId, valueToSave) => {
    if (!attemptId) return;
    
    try {
      const question = findQuestion(questionId);
      if (!question) return;

      let answerText = typeof valueToSave === 'string' ? valueToSave : JSON.stringify(valueToSave);

      // Handle Drawing/File Uploads - upload immediately
      const config = question.config || {};
      const isDrawing = config.frontend_type === 'drawing' || question.type === 'file_upload';

      if (isDrawing && typeof valueToSave === 'string' && valueToSave.startsWith('data:')) {
        try {
          const blob = dataURLtoBlob(valueToSave);
          if (blob) {
            const formData = new FormData();
            // Append the blob directly as 'file' - FormData will handle binary conversion
            formData.append('file', blob, `drawing_q${questionId}.png`);
            formData.append('type', 'image');
            formData.append('label', `Drawing for Question ${questionId}`);
            
            console.log(`Uploading drawing for question ${questionId}...`);
            console.log('FormData contents:', { type: 'image', label: `Drawing for Question ${questionId}`, fileSize: blob.size, fileType: blob.type });
            
            // Don't set Content-Type header - let the browser set it with proper boundary
            const mediaRes = await api.post('/media', formData);
            
            if (mediaRes.data && mediaRes.data.url) {
              answerText = mediaRes.data.url;
              console.log(`Drawing uploaded successfully: ${answerText}`);
            } else {
              console.error('Media upload succeeded but no URL returned:', mediaRes.data);
            }
          } else {
            console.error('Failed to convert data URL to blob');
            return;
          }
        } catch (uploadError) {
          console.error(`Failed to upload media for question ${questionId}:`, uploadError);
          console.error('Upload error details:', uploadError.response?.data);
          return; // Don't save if upload fails
        }
      }

      const payload = {
        attemptId: attemptId,
        questionId: parseInt(questionId),
        answerText: answerText
      };
      
      await api.post('/responses', payload);
      console.log(`Saved response for question ${questionId}:`, answerText.substring(0, 100));
    } catch (error) {
      console.error(`Failed to save response for question ${questionId}:`, error);
    }
  };

  const handleResponseChange = (questionId, value, fieldIndex = null) => {
    // Update local state and get the new value
    setResponses(prev => {
      let newValue;
      if (fieldIndex !== null) {
        const currentArr = prev[questionId] || [];
        const newArr = [...currentArr];
        newArr[fieldIndex] = value;
        newValue = newArr;
      } else {
        newValue = value;
      }
      
      // Save to backend after state update
      // Use setTimeout to ensure state has updated
      setTimeout(() => {
        saveResponseToBackend(questionId, newValue);
      }, 0);
      
      return { ...prev, [questionId]: newValue };
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

  const findQuestion = (id) => {
    for (const section of sections) {
      const q = section.questions.find(q => q.id == id);
      if (q) return q;
    }
    return null;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (attemptId) {
        // Responses are already saved, just finalize the attempt
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

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-600">{error}</div>;
  }

  if (sections.length === 0) {
    return <div className="flex justify-center items-center min-h-screen">Test data not available.</div>;
  }

  const renderQuestion = (q, idx) => {
    const { qText, config } = getTranslation(language, currentSection, idx);
    
    // Use config.frontend_type if available, otherwise fallback to q.type mapping
    // But wait, q.type is from backend (e.g. 'text', 'scmcq'). 
    // The original code switched on q.type but used custom types like 'memory_registration' which are now in config.frontend_type.
    
    const type = config.frontend_type || q.type;

    switch (type) {
      case 'memory_registration':
        return (
          <MemoryRegistrationQuestion
            key={q.id}
            title={config.title}
            description={config.description || qText}
            words={config.words || []}
            fields={config.fields || []}
            value={responses[q.id]}
            onChange={(val) => handleResponseChange(q.id, val)}
          />
        );
      case 'text':
        return (
          <TextResponseQuestion
            key={q.id}
            title={config.title}
            description={config.description || qText}
            value={responses[q.id] || ''}
            onChange={(val) => handleResponseChange(q.id, val)}
            placeholder={config.placeholder}
          />
        );
      case 'text_multiline':
        return (
          <TextResponseQuestion
            key={q.id}
            title={config.title}
            description={config.description || qText}
            value={responses[q.id] || ''}
            onChange={(val) => handleResponseChange(q.id, val)}
            placeholder={config.placeholder}
            multiline={true}
          />
        );
      case 'text_grouped':
        return (
          <QuestionWrapper key={q.id} title={config.title} description={config.description || qText}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(config.fields || []).map((field, idx) => (
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
      case 'scmcq': // Backend type might be scmcq
        return (
          <MultipleChoiceQuestion
            key={q.id}
            title={config.title}
            description={config.description || qText}
            options={config.options || []}
            selectedValues={responses[q.id] ? [responses[q.id]] : []}
            onChange={(vals) => handleResponseChange(q.id, vals[0])}
            type="single"
          />
        );
      case 'drawing':
      case 'file_upload': // Backend type might be file_upload
        return (
          <DrawingCanvasQuestion
            key={q.id}
            title={config.title}
            description={config.description || qText}
            onSave={(dataUrl) => handleResponseChange(q.id, dataUrl)}
            referenceImage={q.id === 11 ? "https://ars.els-cdn.com/content/image/3-s2.0-B9780128121122000033-f03-01-9780128121122.jpg" : null} // Hardcoded ID check might fail if IDs change. Better to check config title or something.
            savedImage={responses[q.id] || null}
          />
        );
      default:
        return (
            <div key={q.id}>Unknown question type: {type}</div>
        );
    }
  };

  const currentSectionData = sections[currentSection];
  const translationData = getTranslation(language, currentSection, 0);
  const sectionTitle = translationData ? translationData.sectionTitle : (currentSectionData?.title || '');

  // We need to get the translated test title as well
  let currentTestTitle = testTitle;
  if (language !== 'en' && testSpecificInfo?.translations?.[language]?.title) {
    currentTestTitle = testSpecificInfo.translations[language].title;
  }

  const uiText = {
    en: {
      section: "Section",
      of: "of",
      previous: "Previous",
      next: "Next Section",
      submit: "Submit Assessment",
      submitting: "Submitting..."
    },
    mr: {
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
      <div className="max-w-6xl mx-auto">
        {!attemptId && !loading && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
            <p className="font-bold">Demo Mode</p>
            <p>You are not logged in or could not start a session. Your results will NOT be saved.</p>
          </div>
        )}
        <div className="mb-8">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setLanguage(language === 'en' ? 'mr' : 'en')}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {language === 'en' ? 'Switch to Marathi (मराठी)' : 'Switch to English'}
            </button>
          </div>

          <h1 className="text-3xl font-bold text-gray-900">{currentTestTitle}</h1>
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
            <h2 className="text-xl font-medium text-gray-900 mb-4">{sectionTitle}</h2>
            <div className="space-y-6">
              {currentSectionData.questions.map((q, idx) => renderQuestion(q, idx))}
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
