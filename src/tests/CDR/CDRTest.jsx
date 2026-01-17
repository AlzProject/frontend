import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextResponseQuestion,
  MultipleChoiceQuestion,
  QuestionWrapper
} from '../../components/QuestionTypes';
import api from '../../api';
import { checkFeedbackAndRedirect } from '../../utils';

// AutocompleteInput Component with dropdown suggestions
const AutocompleteInput = ({ value, onChange, suggestions = [], placeholder = '', className = '' }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [displaySuggestions, setDisplaySuggestions] = useState([]);

  // Filter and randomize suggestions
  useEffect(() => {
    let result = [];
    if (!value || !Array.isArray(suggestions)) {
      result = [...suggestions];
    } else {
      const lowerValue = value.toLowerCase();
      result = suggestions.filter(s => 
        s.toLowerCase().includes(lowerValue)
      );
    }
    // Randomize the order
    const shuffled = result.sort(() => Math.random() - 0.5);
    setTimeout(() => setDisplaySuggestions(shuffled), 0);
  }, [value, suggestions]);

  const handleSelect = (suggestion) => {
    onChange(suggestion);
    setIsFocused(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        placeholder={placeholder}
        className={className}
      />
      {isFocused && displaySuggestions.length > 0 && (
        <div className="absolute z-9999 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-2xl max-h-48 sm:max-h-60 overflow-auto">
          {displaySuggestions.map((suggestion, idx) => (
            <div
              key={idx}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(suggestion);
              }}
              className="px-3 sm:px-4 py-1.5 sm:py-2 cursor-pointer hover:bg-indigo-50 text-xs sm:text-sm text-gray-700 border-b border-gray-100 last:border-b-0">
            
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper component for memory words display
const MemoryWordsDisplay = ({ words, instruction, onContinue, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(10);
  const [phase, setPhase] = useState('instruction'); // instruction, showing, completed
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    if (phase === 'showing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'showing' && timeLeft === 0) {
      // Defer state update to next tick to avoid synchronous update warning
      const timeout = setTimeout(() => {
        setPhase('completed');
        setCanContinue(true);
        // Notify parent that memorization is complete (show other questions)
        if (onComplete) onComplete();
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [timeLeft, phase, onComplete]);

  const startMemorization = () => {
    setPhase('showing');
  };

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {phase === 'instruction' ? (
        <div className="text-center py-4 sm:py-6 md:py-8">
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6">
            <p className="text-base sm:text-lg text-indigo-900 mb-3 sm:mb-4">
              {instruction || "I will show you three words. Please remember them."}
            </p>
            <p className="text-sm text-gray-600">
              The words will be displayed for 10 seconds. Try to memorize them.
            </p>
          </div>
          <button
            onClick={startMemorization}
            className="px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium text-sm sm:text-base shadow-md hover:shadow-lg transition-all">
          
            Show Words
          </button>
        </div>
      ) : phase === 'showing' ? (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 sm:p-6 md:p-8 text-center">
          <p className="text-base sm:text-lg text-blue-900 mb-4 sm:mb-5 md:mb-6">Please remember these three words:</p>
          <div className="flex justify-center items-center space-x-4 sm:space-x-6 md:space-x-8 flex-wrap gap-3 sm:gap-4">
            {words.map((word, idx) => (
              <div key={idx} className="bg-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-lg shadow-md">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-indigo-600">{word}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 sm:mt-5 md:mt-6">
            <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Time remaining:</p>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600">{timeLeft}s</div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 sm:py-6 md:py-8">
          <div className="mb-3 sm:mb-4">
            <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-base sm:text-lg text-gray-700 mb-4 sm:mb-5 md:mb-6">Words memorization complete!</p>
          <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">You will be asked to recall these words later.</p>
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className={`px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-md font-medium text-sm sm:text-base shadow-md transition-all ${
              canContinue
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Continue to Next Question
          </button>
        </div>
      )}
    </div>
  );
};

const CDRTest = () => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const [responses, setResponses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('en');
  const [sections, setSections] = useState([]);
  const [testTitle, setTestTitle] = useState('CDR Assessment');
  const [testSpecificInfo, setTestSpecificInfo] = useState({});
  const [memoryRegistrationComplete, setMemoryRegistrationComplete] = useState(false);
  
  // Ref to prevent duplicate attempt creation
  const attemptInitializedRef = React.useRef(false);

  useEffect(() => {
    const initTest = async () => {
      // Prevent duplicate initialization (React Strict Mode double-mount)
      if (attemptInitializedRef.current) return;
      attemptInitializedRef.current = true;
      
      setLoading(true);
      try {
        // 1. Fetch tests to find CDR
        const testsRes = await api.get('/tests');
        const tests = testsRes.data.items || [];
        const cdrTest = tests.find(t => 
          (t.title || '').toLowerCase().includes('cdr') || 
          (t.title || '').toLowerCase().includes('clinical dementia rating')
        );
        
        if (cdrTest) {
          setTestTitle(cdrTest.title);
          setTestSpecificInfo(cdrTest.test_specific_info || {});

          // 2. Fetch Sections & Questions
          try {
            const sectionsRes = await api.get(`/tests/${cdrTest.id}/sections`);
            const sectionsData = Array.isArray(sectionsRes.data) ? sectionsRes.data : [];
            sectionsData.sort((a, b) => a.orderIndex - b.orderIndex);

            const fullSections = await Promise.all(sectionsData.map(async (section) => {
              const qRes = await api.get(`/sections/${section.id}/questions`);
              
              // Fetch detailed question data with media and options
              const questionsWithMedia = await Promise.all(qRes.data.map(async (q) => {
                try {
                  const detailRes = await api.get(`/questions/${q.id}`);
                  const questionDetail = detailRes.data;
                  
                  // Parse config from ans field or use q.config
                  let config = {};
                  try {
                    config = JSON.parse(questionDetail.ans || '{}');
                  } catch {
                    config = questionDetail.config || {};
                  }
                  
                  // Fetch presigned URLs for question media
                  let questionMedia = [];
                  if (questionDetail.media && Array.isArray(questionDetail.media)) {
                    questionMedia = await Promise.all(questionDetail.media.map(async (m) => {
                      try {
                        const downloadRes = await api.get(`/media/${m.id}/download`);
                        return {
                          ...m,
                          url: downloadRes.data.presignedUrl
                        };
                      } catch (err) {
                        console.error(`Failed to fetch media ${m.id}:`, err);
                        return m;
                      }
                    }));
                  }
                  
                  // Fetch options with their media
                  let options = [];
                  if (questionDetail.options && Array.isArray(questionDetail.options)) {
                    options = await Promise.all(questionDetail.options.map(async (opt) => {
                      // Fetch media for each option if it has any
                      let optionMedia = [];
                      if (opt.media && Array.isArray(opt.media)) {
                        optionMedia = await Promise.all(opt.media.map(async (m) => {
                          try {
                            const downloadRes = await api.get(`/media/${m.id}/download`);
                            return {
                              ...m,
                              url: downloadRes.data.presignedUrl
                            };
                          } catch (err) {
                            console.error(`Failed to fetch option media ${m.id}:`, err);
                            return m;
                          }
                        }));
                      }
                      return {
                        ...opt,
                        media: optionMedia
                      };
                    }));
                  }
                  
                  return {
                    ...q,
                    config: config,
                    media: questionMedia,
                    options: options
                  };
                } catch (err) {
                  console.error(`Failed to fetch details for question ${q.id}:`, err);
                  // Fallback to basic config parsing
                  let config = {};
                  try {
                    config = JSON.parse(q.ans || '{}');
                  } catch {
                    config = {};
                  }
                  return {
                    ...q,
                    config: config
                  };
                }
              }));
              
              return {
                ...section,
                questions: questionsWithMedia
              };
            }));

            setSections(fullSections);

            // 3. Check for existing in-progress attempt
            try {
              const attemptsRes = await api.get('/attempts');
              const attempts = attemptsRes.data.items || attemptsRes.data || [];
              
              const activeAttempt = attempts.find(a => 
                a.testId === cdrTest.id && !a.submittedAt && !a.submit_time
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
                      // Parse answerText if it's a JSON string for arrays/objects
                      let value = r.answerText;
                      try {
                        value = JSON.parse(r.answerText);
                      } catch {
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
                const attemptRes = await api.post('/attempts', { testId: cdrTest.id });
                setAttemptId(attemptRes.data.id);
              }
            } catch (attemptError) {
              console.error("Failed to create attempt:", attemptError);
              alert("Failed to start test. Please login again.");
              navigate('/login');
              return;
            }
          } catch (secError) {
            console.error("Failed to fetch sections:", secError);
            alert("Failed to load test content.");
          }
        } else {
          console.warn("CDR test not found in backend.");
          alert("CDR test not found. Please run createTest.sh first.");
        }
      } catch (error) {
        console.error("Failed to initialize test:", error);
      } finally {
        setLoading(false);
      }
    };

    initTest();
  }, [navigate]);

  // Reset memory registration state when section changes
  useEffect(() => {
    setMemoryRegistrationComplete(false);
  }, [currentSection]);

  // Helper to get translated content
  const getTranslation = (lang, sectionIdx = null, questionIdx = null) => {
    if (lang === 'en') return null;
    const trans = testSpecificInfo?.translations?.[lang];
    if (!trans) return null;
    
    if (sectionIdx !== null && questionIdx === null) {
      return trans.sections?.[sectionIdx];
    }
    if (sectionIdx !== null && questionIdx !== null) {
      return trans.sections?.[sectionIdx]?.questions?.[questionIdx];
    }
    return trans; // Test level
  };

  const saveResponseToBackend = async (questionId, valueToSave) => {
    if (!attemptId) return;
    
    try {
      let answerText;

      if (Array.isArray(valueToSave)) {
        // Grouped question - concatenate answers with ';' separator
        answerText = valueToSave.join(';');
      } else if (typeof valueToSave === 'object' && valueToSave !== null) {
        // Objects (like matching questions) - stringify
        answerText = JSON.stringify(valueToSave);
      } else {
        // Simple string/number answer
        answerText = String(valueToSave);
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

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => {
      const newValue = value;
      
      // Save to backend after state update
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (attemptId) {
        // Responses are already saved, just finalize the attempt
        await api.post(`/attempts/${attemptId}`, {
          submit_time: new Date().toISOString()
        });
        alert("CDR Assessment submitted successfully! A clinician will review your responses.");
      } else {
        console.log("Demo mode submission:", responses);
        alert("CDR Assessment submitted successfully (Demo Mode)!");
      }
      await checkFeedbackAndRedirect(navigate);
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 border-b-2 border-indigo-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Assessment Not Available</h2>
        <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">The CDR test data is not available in the backend.</p>
        <p className="text-xs sm:text-sm text-gray-500">Please run the createTest.sh script to populate the test data.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-3 sm:mt-4 px-4 py-2 bg-indigo-600 text-white text-sm sm:text-base rounded-md hover:bg-indigo-700">
        
          Go Back
        </button>
      </div>
    );
  }

  const renderQuestion = (q, qIdx) => {
    const qTrans = getTranslation(language, currentSection, qIdx);
    const config = { ...(q.config || {}), ...(qTrans?.config || {}) };
    const type = config.frontend_type || q.type;
    const title = config.title || q.title;
    const description = qTrans?.text || q.text || q.description;

    switch (type) {
      case 'memory_words_display':
        return (
          <QuestionWrapper key={q.id} title={title} description={description}>
            <MemoryWordsDisplay
              words={config.words || ['Apple', 'Chair', 'River']}
              instruction={config.instruction}
              onComplete={() => {
                // Mark memory registration as complete (show other questions)
                setMemoryRegistrationComplete(true);
              }}
              onContinue={() => {
                // Mark as viewed
                handleResponseChange(q.id, 'viewed');
              }}
            />
          </QuestionWrapper>
        );
      
      case 'mcq': {
        const isMultiselect = config.multiselect || false;
        
        // Use actual options from backend if available, otherwise fall back to config
        const rawOptions = q.options && q.options.length > 0 ? q.options : (config.options || []);
        
        // Transform backend options to component format
        const transformedOptions = rawOptions.map(opt => ({
          value: opt.id || opt.value,
          label: opt.text || opt.label,
          img: opt.media?.[0]?.url || opt.img
        }));
        
        return (
          <MultipleChoiceQuestion
            key={q.id}
            title={title}
            description={description}
            options={transformedOptions}
            selectedValues={
              isMultiselect
                ? (Array.isArray(responses[q.id]) ? responses[q.id] : [])
                : (responses[q.id] ? [responses[q.id]] : [])
            }
            onChange={(vals) => {
              if (isMultiselect) {
                handleResponseChange(q.id, vals);
              } else {
                handleResponseChange(q.id, vals[0] || '');
              }
            }}
            type={isMultiselect ? "multiple" : "single"}
          />
        );
      }
      
      case 'text':
        return (
          <QuestionWrapper key={q.id} title={title} description={description}>
            <AutocompleteInput
              value={responses[q.id] || ''}
              onChange={(val) => handleResponseChange(q.id, val)}
              suggestions={config.suggestions || []}
              placeholder={config.placeholder || 'Enter your answer...'}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </QuestionWrapper>
        );
      
      case 'text_multiline':
        return (
          <QuestionWrapper key={q.id} title={title} description={description}>
            <div className="space-y-2">
              {config.suggestions && config.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  {config.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleResponseChange(q.id, suggestion)}
                      className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 border border-indigo-200">
                    
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              <textarea
                value={responses[q.id] || ''}
                onChange={(e) => handleResponseChange(q.id, e.target.value)}
                placeholder={config.placeholder || 'Enter your answer...'}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </QuestionWrapper>
        );
      
      default: {
        // For scmcq, numerical, and any other type, render as MCQ or text based on config
        const rawOptions = q.options && q.options.length > 0 ? q.options : (config.options || []);
        
        if (rawOptions.length > 0) {
          // Transform backend options to component format
          const transformedOptions = rawOptions.map(opt => ({
            value: opt.id || opt.value,
            label: opt.text || opt.label,
            img: opt.media?.[0]?.url || opt.img
          }));
          
          return (
            <MultipleChoiceQuestion
              key={q.id}
              title={title}
              description={description}
              options={transformedOptions}
              selectedValues={responses[q.id] ? [responses[q.id]] : []}
              onChange={(vals) => handleResponseChange(q.id, vals[0] || '')}
              type="single"
            />
          );
        } else {
          return (
            <TextResponseQuestion
              key={q.id}
              title={title}
              description={description}
              value={responses[q.id] || ''}
              onChange={(val) => handleResponseChange(q.id, val)}
              placeholder={config.placeholder || 'Enter your answer...'}
            />
          );
        }
      }
    }
  };

  const currentTestTitle = language === 'en' 
    ? testTitle 
    : (getTranslation(language)?.title || testTitle);

  const currentSectionData = sections[currentSection];
  const currentSectionTitle = currentSectionData 
    ? (language === 'en' ? currentSectionData.title : (getTranslation(language, currentSection)?.title || currentSectionData.title))
    : '';

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{currentTestTitle}</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
              {language === 'en' ? 'Patient Self-Assessment' : 'रुग्ण स्वयं-मूल्यांकन'}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {language === 'en' 
                ? `Section ${currentSection + 1} of ${sections.length}` 
                : `विभाग ${currentSection + 1} पैकी ${sections.length}`}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end space-y-2 w-full sm:w-auto">
            <button
              onClick={() => setLanguage(prev => prev === 'en' ? 'mr' : 'en')}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 font-medium text-sm w-full sm:w-auto"
            >
              {language === 'en' ? 'Switch to Marathi' : 'Switch to English'}
            </button>
            <div className="bg-indigo-50 px-3 sm:px-4 py-2 rounded-lg border border-indigo-200 w-full sm:w-auto">
              <p className="text-xs sm:text-sm text-indigo-700">
                <span className="font-semibold">{language === 'en' ? 'Note:' : 'टीप:'}</span>{' '}
                {language === 'en' 
                  ? 'A clinician will review your responses' 
                  : 'एक चिकित्सक तुमच्या प्रतिसादांचे पुनरावलोकन करेल'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 sm:mb-6 md:mb-8">
        <div 
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
          style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
        ></div>
      </div>

      {/* Section Content */}
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-4 sm:p-5 md:p-6">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 mb-4 sm:mb-5 md:mb-6">{currentSectionTitle}</h2>
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            {sections[currentSection].questions.map((q, idx) => {
              // Check if this is the memory section (first section, index 0)
              const isMemorySection = currentSection === 0;
              const isFirstQuestion = idx === 0;
              
              // For memory section: only show questions after the first one if memory registration is complete
              if (isMemorySection && !isFirstQuestion && !memoryRegistrationComplete) {
                return null; // Hide delayed recall and other questions until memory display is complete
              }
              
              return renderQuestion(q, idx);
            })}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-3 sm:pt-4">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentSection === 0}
            className={`inline-flex items-center justify-center px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              currentSection === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {language === 'en' ? 'Previous' : 'मागील'}
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          
            {currentSection === sections.length - 1 ? (
              isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {language === 'en' ? 'Submitting...' : 'सबमिट करत आहे...'}
                </>
              ) : (
                <>
                  {language === 'en' ? 'Submit Assessment' : 'मूल्यांकन सबमिट करा'}
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )
            ) : (
              <>
                {language === 'en' ? 'Next' : 'पुढील'}
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CDRTest;

