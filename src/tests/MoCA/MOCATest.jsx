import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextResponseQuestion,
  MultipleChoiceQuestion,
  DrawingCanvasQuestion,
  QuestionWrapper
} from '../../components/QuestionTypes';
import api from '../../api';
import { uploadMediaAndGetAnswerText } from '../../media';

// SVG files served from the frontend (avoid data: URLs)
const TRAIL_MAKING_SVG = '/moca-trail-making.svg';
const CUBE_SVG = '/moca-cube.svg';

const SVG_MAP = {
  'TRAIL_MAKING_SVG': TRAIL_MAKING_SVG,
  'CUBE_SVG': CUBE_SVG
};

const isMediaRef = (value) => typeof value === 'string' && value.toLowerCase().startsWith('media:');
const getMediaIdFromRef = (value) => (isMediaRef(value) ? value.slice('media:'.length).trim() : null);

// Internal component for Memory Registration (MoCA version - 5 words)
const MemoryRegistrationQuestion = ({ title, description, words, onComplete }) => {
  const [showWords, setShowWords] = useState(true);
  const [timeLeft, setTimeLeft] = useState(5); // 5 seconds for 5 words

  useEffect(() => {
    if (!showWords) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowWords(false);
          if (onComplete) onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showWords, onComplete]);

  if (showWords) {
    return (
      <QuestionWrapper title={title} description={description}>
        <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <h3 className="text-2xl font-bold text-indigo-600 mb-6 tracking-wider leading-loose">
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
    <QuestionWrapper title={title} description="Registration phase complete.">
      <div className="p-4 bg-green-50 text-green-700 rounded-md">
        <p>Words hidden. Proceed to the next task. (Recall will be tested later)</p>
      </div>
    </QuestionWrapper>
  );
};

// Internal component for Digit Span
const DigitSpanQuestion = ({ title, description, sequence, type, onChange, value }) => {
  const [status, setStatus] = useState('ready'); // ready, showing, input
  const [currentIndex, setCurrentIndex] = useState(0);

  const startTest = () => {
    setStatus('showing');
    setCurrentIndex(0);
  };

  useEffect(() => {
    if (status === 'showing') {
      if (currentIndex < sequence.length) {
        const timer = setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
        }, 1000); // 1 second per digit
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => setStatus('input'), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [status, currentIndex, sequence]);

  return (
    <QuestionWrapper title={title} description={description}>
      {status === 'ready' && (
        <div className="text-center py-8">
          <button
            onClick={startTest}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Start {type} Sequence
          </button>
        </div>
      )}
      
      {status === 'showing' && (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <span className="text-6xl font-bold text-indigo-600">
            {currentIndex < sequence.length ? sequence[currentIndex] : "..."}
          </span>
        </div>
      )}

      {status === 'input' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter the sequence {type === 'Backward' ? 'backwards' : 'exactly as shown'}:
          </label>
          <input
            type="text"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-lg border-gray-300 rounded-md p-2 border"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. 1 2 3"
          />
        </div>
      )}
    </QuestionWrapper>
  );
};

// Internal component for Vigilance
const VigilanceQuestion = ({ title, description, sequence, onChange, value }) => {
  // value will be an array of indices clicked
  const selectedIndices = value || [];

  const toggleSelection = (index) => {
    const newSelection = selectedIndices.includes(index)
      ? selectedIndices.filter(i => i !== index)
      : [...selectedIndices, index];
    onChange(newSelection);
  };

  return (
    <QuestionWrapper title={title} description={description}>
      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg justify-center">
        {sequence.split('').map((char, idx) => (
          <button
            key={idx}
            onClick={() => toggleSelection(idx)}
            className={`w-10 h-10 rounded-full font-bold text-lg transition-colors ${
              selectedIndices.includes(idx)
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            {char}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">Click on every letter 'A'.</p>
    </QuestionWrapper>
  );
};

const MOCATest = () => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const [responses, setResponses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState(() => localStorage.getItem('moca_language') || 'en');
  const [sections, setSections] = useState([]);
  const [testTitle, setTestTitle] = useState('');

  const [testSpecificInfo, setTestSpecificInfo] = useState({});

  // Refs to track previous state for migration
  const sectionsRef = React.useRef([]);
  const responsesRef = React.useRef({});
  
  // Ref to prevent duplicate attempt creation
  const attemptInitializedRef = React.useRef(false);

  useEffect(() => {
    sectionsRef.current = sections;
    responsesRef.current = responses;
  }, [sections, responses]);

  useEffect(() => {
    localStorage.setItem('moca_language', language);
  }, [language]);

  useEffect(() => {
    const initTest = async () => {
      // Prevent duplicate initialization (React Strict Mode double-mount)
      if (attemptInitializedRef.current) return;
      attemptInitializedRef.current = true;
      
      setLoading(true);
      
      try {
        // 1. Fetch tests to find MoCA
        const testsRes = await api.get('/tests');
        const tests = testsRes.data.items || [];
        
        const mocaTest = tests.find(t => 
          (t.title || '').includes('Montreal Cognitive Assessment') || 
          (t.title || '').toLowerCase().includes('moca')
        );
        
        if (mocaTest) {
          setTestTitle(mocaTest.title);
          setTestSpecificInfo(mocaTest.test_specific_info || {});
          
          // 2. Fetch Sections & Questions (Prioritize content loading)
          try {
            const sectionsRes = await api.get(`/tests/${mocaTest.id}/sections`);
            const sectionsData = Array.isArray(sectionsRes.data) ? sectionsRes.data : [];
            sectionsData.sort((a, b) => a.orderIndex - b.orderIndex);

            const fullSections = await Promise.all(sectionsData.map(async (section) => {
              const qRes = await api.get(`/sections/${section.id}/questions`);
              
              // Fetch detailed question data with media and options
              const questionsWithMedia = await Promise.all(qRes.data.map(async (q) => {
                try {
                  const detailRes = await api.get(`/questions/${q.id}`);
                  const questionDetail = detailRes.data;
                  
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
                    config: q.config || q.test_specific_info || {},
                    media: questionMedia,
                    options: options
                  };
                } catch (err) {
                  console.error(`Failed to fetch details for question ${q.id}:`, err);
                  return {
                    ...q,
                    config: q.config || q.test_specific_info || {}
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
                a.testId === mocaTest.id && !a.submittedAt && !a.submit_time
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
                    
                    // Process each response
                    await Promise.all(responsesData.map(async (r) => {
                      let value = r.answerText;
                      try {
                        value = JSON.parse(r.answerText);
                      } catch {
                        // Keep as string if not JSON
                      }
                      
                      // Handle media refs: store presigned URL for display/playback
                      if (typeof value === 'string' && (value.startsWith('media:') || value.startsWith('media/'))) {
                        try {
                          let mediaId = getMediaIdFromRef(value);
                          if (!mediaId && value.startsWith('media/')) {
                            const match = value.match(/media\/(\d+)\//);
                            if (match) mediaId = match[1];
                          }

                          if (mediaId) {
                            const downloadRes = await api.get(`/media/${mediaId}/download`);
                            loadedResponses[r.questionId] = downloadRes.data.presignedUrl || value;
                          } else {
                            loadedResponses[r.questionId] = value;
                          }
                        } catch (error) {
                          console.error(`Failed to load media for question ${r.questionId}:`, error);
                          loadedResponses[r.questionId] = value;
                        }
                      } else {
                        loadedResponses[r.questionId] = value;
                      }
                    }));
                    
                    setResponses(loadedResponses);
                    console.log("Loaded", responsesData.length, "previous responses");
                  }
                } catch (err) {
                  console.error("Failed to load existing responses", err);
                }
              } else {
                // Start a new attempt
                const attemptRes = await api.post('/attempts', { testId: mocaTest.id });
                setAttemptId(attemptRes.data.id);
              }
            } catch (attemptError) {
              console.warn("Failed to start attempt (likely not logged in). Running in Demo Mode.", attemptError);
            }

          } catch (secError) {
            console.error("Failed to fetch sections:", secError);
            alert("Failed to load test content.");
            return;
          }

        } else {
          console.warn("MoCA test not found in backend.");
          alert("Test not found.");
        }
      } catch (error) {
        console.error("Failed to initialize test:", error);
      } finally {
        setLoading(false);
      }
    };

    initTest();
  }, []); // Run once on mount

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

  const currentTestTitle = language === 'en' 
    ? (testTitle || 'MoCA Test') 
    : (getTranslation(language)?.title || testTitle || 'MoCA Test');

  const currentSectionData = sections[currentSection];
  const currentSectionTitle = currentSectionData 
    ? (language === 'en' ? currentSectionData.title : (getTranslation(language, currentSection)?.title || currentSectionData.title))
    : '';

  const findQuestion = (id) => {
    for (const section of sections) {
      const q = section.questions.find(q => q.id == id);
      if (q) return q;
    }
    return null;
  };

  const saveResponseToBackend = async (questionId, valueToSave) => {
    if (!attemptId) return;
    
    try {
      const question = findQuestion(questionId);
      if (!question) return;

      let answerText = typeof valueToSave === 'string' ? valueToSave : JSON.stringify(valueToSave);

      // Handle Drawing/File Uploads - upload immediately
      const config = question.config || {};
      const isDrawing = config.frontend_type === 'drawing';
      const isFileUpload = question.type === 'file_upload' || config.frontend_type === 'file_upload';

      if (isDrawing && valueToSave instanceof Blob && !(valueToSave.type || '').startsWith('audio/')) {
        try {
          answerText = await uploadMediaAndGetAnswerText({
            questionId: parseInt(questionId),
            fileOrBlob: valueToSave,
            type: 'image',
            label: `Drawing for Question ${questionId}`,
            attachToQuestion: true,
          });
        } catch (uploadError) {
          console.error(`Failed to upload drawing for question ${questionId}:`, uploadError);
          console.error('Upload error details:', uploadError.response?.data);
          return; // Don't save if upload fails
        }
      }

      if (isFileUpload && valueToSave instanceof File) {
        try {
          answerText = await uploadMediaAndGetAnswerText({
            questionId: parseInt(questionId),
            fileOrBlob: valueToSave,
            type: 'image',
            label: `File upload for Question ${questionId}`,
            attachToQuestion: true,
          });
        } catch (uploadError) {
          console.error(`Failed to upload file for question ${questionId}:`, uploadError);
          console.error('Upload error details:', uploadError.response?.data);
          return;
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

      // For Blob/File values (drawing), store a preview URL but save the original bytes
      let valueToSave = newValue;
      if (fieldIndex === null && newValue instanceof Blob) {
        const prevVal = prev[questionId];
        if (typeof prevVal === 'string' && prevVal.startsWith('blob:')) {
          try { URL.revokeObjectURL(prevVal); } catch { /* ignore */ }
        }
        newValue = URL.createObjectURL(newValue);
      }
      
      // Save to backend after state update
      // Use setTimeout to ensure state has updated
      setTimeout(() => {
        saveResponseToBackend(questionId, valueToSave);
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
        alert("MoCA Test submitted successfully!");
      } else {
        console.log("Demo mode submission:", responses);
        alert("MoCA Test submitted successfully (Demo Mode - Not Saved to Backend)!");
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

  const renderQuestion = (q, qIdx) => {
    const qTrans = getTranslation(language, currentSection, qIdx);
    const config = { ...(q.config || {}), ...(qTrans?.config || {}) };
    const type = config.frontend_type || q.type;
    const title = config.title || q.title; // Note: q.title might not exist on backend object, usually in config
    const description = qTrans?.text || q.text || q.description;

    switch (type) {
      case 'memory_registration':
        return (
          <MemoryRegistrationQuestion
            key={q.id}
            title={title}
            description={description}
            words={config.words || q.words}
            onComplete={() => {}}
          />
        );
      case 'digit_span':
        return (
          <DigitSpanQuestion
            key={q.id}
            title={title}
            description={description}
            sequence={config.sequence || q.sequence}
            type={config.subType || q.subType}
            value={responses[q.id]}
            onChange={(val) => handleResponseChange(q.id, val)}
          />
        );
      case 'vigilance':
        return (
          <VigilanceQuestion
            key={q.id}
            title={title}
            description={description}
            sequence={config.sequence || q.sequence}
            value={responses[q.id]}
            onChange={(val) => handleResponseChange(q.id, val)}
          />
        );
      case 'text':
        return (
          <TextResponseQuestion
            key={q.id}
            title={title}
            description={description}
            value={responses[q.id] || ''}
            onChange={(val) => handleResponseChange(q.id, val)}
            placeholder={config.placeholder || q.placeholder}
          />
        );
      case 'text_grouped':
        return (
          <QuestionWrapper key={q.id} title={title} description={description}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(config.fields || q.fields).map((field, idx) => (
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
      case 'dropdown_grouped':
        return (
          <QuestionWrapper key={q.id} title={title} description={description}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(config.fields || q.fields).map((field, idx) => {
                const fieldLabel = typeof field === 'string' ? field : field.label;
                const fieldOptions = typeof field === 'object' ? field.options : [];
                
                return (
                  <div key={idx}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel}</label>
                    <select
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      value={(responses[q.id] || [])[idx] || ''}
                      onChange={(e) => handleResponseChange(q.id, e.target.value, idx)}
                    >
                      <option value="">Select...</option>
                      {fieldOptions.map((opt, optIdx) => (
                        <option key={optIdx} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </QuestionWrapper>
        );
      case 'naming_grouped':
        return (
          <QuestionWrapper key={q.id} title={title} description={description}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {(config.items || q.items || []).map((item, idx) => {
                const mediaIndex = item.imageIndex !== undefined ? item.imageIndex : idx;
                const imageUrl = q.media?.[mediaIndex]?.url || item.img;

                return (
                  <div key={idx} className="flex flex-col items-center">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={item.label} 
                        className="w-32 h-32 object-contain rounded-md mb-3 border bg-white"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gray-100 rounded-md mb-3 border flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                    <label className="block text-sm font-medium text-gray-700 mb-1">{item.label}</label>
                    {item.options ? (
                      <select
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        value={(responses[q.id] || [])[idx] || ''}
                        onChange={(e) => handleResponseChange(q.id, e.target.value, idx)}
                      >
                        <option value="">{item.placeholder || 'Select...'}</option>
                        {item.options.map((opt, optIdx) => (
                          <option key={optIdx} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        value={(responses[q.id] || [])[idx] || ''}
                        onChange={(e) => handleResponseChange(q.id, e.target.value, idx)}
                        placeholder={item.placeholder}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </QuestionWrapper>
        );
      case 'mcq': {
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
            selectedValues={responses[q.id] ? [responses[q.id]] : []}
            onChange={(val) => handleResponseChange(q.id, val[0])}
            type="single"
          />
        );
      }
      case 'file_upload':
        return (
          <QuestionWrapper key={q.id} title={title} description={description}>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                className="block w-full text-sm text-gray-700"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setResponses(prev => ({ ...prev, [q.id]: URL.createObjectURL(file) }));
                  saveResponseToBackend(q.id, file);
                }}
              />
              {typeof responses[q.id] === 'string' && (responses[q.id].startsWith('data:') || responses[q.id].startsWith('http') || responses[q.id].startsWith('blob:')) && (
                <img
                  src={responses[q.id]}
                  alt="Uploaded"
                  className="max-h-64 rounded border"
                />
              )}
            </div>
          </QuestionWrapper>
        );
      case 'drawing':
        return (
          <DrawingCanvasQuestion
            key={q.id}
            title={title}
            description={description}
            onSave={(dataUrl) => handleResponseChange(q.id, dataUrl)}
            backgroundImage={SVG_MAP[config.backgroundImageKey || q.backgroundImageKey] || q.backgroundImage}
            savedImage={responses[q.id] || null}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {!attemptId && !loading && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p className="font-bold">Demo Mode</p>
          <p>You are not logged in or could not start a session. Your results will NOT be saved.</p>
        </div>
      )}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">{currentTestTitle}</h1>
          <button
            onClick={() => setLanguage(prev => prev === 'en' ? 'mr' : 'en')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {language === 'en' ? 'मराठी' : 'English'}
          </button>
        </div>
        <p className="mt-2 text-gray-600">Section {currentSection + 1} of {sections.length}</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
          <div 
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: sections.length > 0 ? `${((currentSection + 1) / sections.length) * 100}%` : '0%' }}
          ></div>
        </div>
      </div>

      <div className="space-y-8">
        {sections.length > 0 && sections[currentSection] ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <h2 className="text-xl font-medium text-gray-900 mb-4">{currentSectionTitle}</h2>
            <div className="space-y-6">
              {sections[currentSection].questions.map((q, idx) => renderQuestion(q, idx))}
            </div>
          </div>
        ) : (
          <div className="text-center py-10">No sections found.</div>
        )}

        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentSection === 0}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${currentSection === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {currentSection === sections.length - 1 ? (isSubmitting ? 'Submitting...' : 'Submit Test') : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MOCATest;