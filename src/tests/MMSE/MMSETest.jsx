import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextResponseQuestion,
  MultipleChoiceQuestion,
  DrawingCanvasQuestion,
  QuestionWrapper
} from '../../components/QuestionTypes';
import api from '../../api';
import { uploadMediaAndGetAnswerText } from '../../media';

// AutocompleteInput Component with dropdown suggestions
const AutocompleteInput = ({ value, onChange, suggestions = [], placeholder = '', className = '' }) => {
  const [isFocused, setIsFocused] = useState(false);

  // Filter suggestions based on current input value using useMemo with random ordering
  const filteredSuggestions = useMemo(() => {
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
    return result.sort(() => Math.random() - 0.5);
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
      {isFocused && filteredSuggestions.length > 0 && (
        <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-2xl max-h-60 overflow-auto">
          {filteredSuggestions.map((suggestion, idx) => (
            <div
              key={idx}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(suggestion);
              }}
              className="px-4 py-2 cursor-pointer hover:bg-indigo-50 text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const isMediaRef = (value) => typeof value === 'string' && value.toLowerCase().startsWith('media:');
const getMediaIdFromRef = (value) => (isMediaRef(value) ? value.slice('media:'.length).trim() : null);

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

import { checkFeedbackAndRedirect } from '../../utils';

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
          setTestTitle(mmseTest.title);
          setTestSpecificInfo(mmseTest.test_specific_info || {});
          
          // 2. Fetch Sections & Questions
          try {
            const sectionsRes = await api.get(`/tests/${mmseTest.id}/sections`);
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
                    config: q.config || {},
                    media: questionMedia,
                    options: options
                  };
                } catch (err) {
                  console.error(`Failed to fetch details for question ${q.id}:`, err);
                  return {
                    ...q,
                    config: q.config || {}
                  };
                }
              }));
              
              return {
                ...section,
                questions: questionsWithMedia
              };
            }));
            
            console.log("Loaded sections with questions and media:", fullSections);

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
                    await Promise.all(responsesData.map(async (r) => {
                      // Parse answerText if it's a JSON string
                      let value = r.answerText;
                      try {
                        value = JSON.parse(r.answerText);
                      } catch {
                        // If parsing fails, keep as string
                      }

                      // Resolve media refs to a presigned URL for display
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
                        } catch (err) {
                          console.error(`Failed to load media for question ${r.questionId}:`, err);
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
                const attemptRes = await api.post('/attempts', { testId: mmseTest.id });
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

      const config = question.config || {};
      const isDrawing = config.frontend_type === 'drawing';
      const isFileUpload = question.type === 'file_upload' || config.frontend_type === 'file_upload';

      let answerText;

      // Handle Blob/File uploads (drawing, audio, file_upload)
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
          alert('Failed to upload drawing. Please try again.');
          return;
        }
      } else if (isFileUpload && valueToSave instanceof File) {
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
          alert('Failed to upload file. Please try again.');
          return;
        }
      } else if (valueToSave instanceof Blob && (valueToSave.type || '').startsWith('audio/')) {
        try {
          answerText = await uploadMediaAndGetAnswerText({
            questionId: parseInt(questionId),
            fileOrBlob: valueToSave,
            type: 'audio',
            label: `Audio for Question ${questionId}`,
            attachToQuestion: true,
          });
        } catch (uploadError) {
          console.error(`Failed to upload audio for question ${questionId}:`, uploadError);
          console.error('Upload error details:', uploadError.response?.data);
          alert('Failed to upload audio. Please try again.');
          return;
        }
      } else if (Array.isArray(valueToSave)) {
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

      // For Blob values (drawing), store a preview URL but save the original bytes
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
      await checkFeedbackAndRedirect(navigate);
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
          <QuestionWrapper key={q.id} title={config.title} description={config.description || qText}>
            <AutocompleteInput
              value={responses[q.id] || ''}
              onChange={(val) => handleResponseChange(q.id, val)}
              suggestions={config.suggestions || []}
              placeholder={config.placeholder || 'Enter your answer...'}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
            />
          </QuestionWrapper>
        );
      case 'text_multiline':
        return (
          <QuestionWrapper key={q.id} title={config.title} description={config.description || qText}>
            <div className="space-y-2">
              {config.suggestions && config.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {config.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleResponseChange(q.id, suggestion)}
                      className="px-3 py-1 text-sm bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 border border-indigo-200"
                    >
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
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
              />
            </div>
          </QuestionWrapper>
        );
      case 'text_grouped':
        return (
          <QuestionWrapper key={q.id} title={config.title} description={config.description || qText}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(config.fields || []).map((field, idx) => {
                const fieldSuggestions = (config.suggestions && config.suggestions[idx]) || [];
                return (
                  <div key={idx}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field}</label>
                    <AutocompleteInput
                      value={(responses[q.id] || [])[idx] || ''}
                      onChange={(val) => handleResponseChange(q.id, val, idx)}
                      suggestions={fieldSuggestions}
                      placeholder={field}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    />
                  </div>
                );
              })}
            </div>
          </QuestionWrapper>
        );
      case 'mcq':
      case 'scmcq': { // Backend type might be scmcq
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
            title={config.title}
            description={config.description || qText}
            options={transformedOptions}
            selectedValues={responses[q.id] ? [responses[q.id]] : []}
            onChange={(vals) => handleResponseChange(q.id, vals[0])}
            type="single"
          />
        );
      }
      case 'drawing': {
        // Determine reference image from question media attachments
        // This provides visual guidance for what the patient needs to draw
        let referenceImage = null;
        
        // First, check if question has attached media (from backend)
        if (q.media && Array.isArray(q.media) && q.media.length > 0) {
          // Find the first image-type media
          const imageMedia = q.media.find(m => m.type === 'image');
          if (imageMedia) {
            // Use presigned URL from url field
            referenceImage = imageMedia.url;
          }
        }
        
        // Fallback to config.referenceImage if specified
        if (!referenceImage && config.referenceImage) {
          referenceImage = config.referenceImage;
        }
        
        return (
          <DrawingCanvasQuestion
            key={q.id}
            title={config.title}
            description={config.description || qText}
            onSave={(blob) => handleResponseChange(q.id, blob)}
            referenceImage={referenceImage}
            savedImage={responses[q.id] || null}
          />
        );
      }
      case 'file_upload': // Backend type
        return (
          <QuestionWrapper key={q.id} title={config.title} description={config.description || qText}>
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
              {typeof responses[q.id] === 'string' && (responses[q.id].startsWith('http') || responses[q.id].startsWith('blob:')) && (
                <img
                  src={responses[q.id]}
                  alt="Uploaded"
                  className="max-h-64 rounded border"
                />
              )}
            </div>
          </QuestionWrapper>
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
