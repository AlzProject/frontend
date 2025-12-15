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

const isMediaRef = (value) => typeof value === 'string' && value.toLowerCase().startsWith('media:');
const getMediaIdFromRef = (value) => (isMediaRef(value) ? value.slice('media:'.length).trim() : null);

// --- Helper Components ---

const MatchingQuestion = ({ title, description, leftItems, rightItems, value, onChange, questionMedia = [] }) => {
  const [matches, setMatches] = useState(value || {});
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [lines, setLines] = useState([]);
  const leftColumnRef = React.useRef(null);
  const rightColumnRef = React.useRef(null);

  const handleLeftClick = (leftId) => {
    setSelectedLeft(leftId);
  };

  const handleRightClick = (rightId) => {
    if (selectedLeft) {
      // Find labels for both left and right items
      const leftItem = leftItems.find(item => item.id === selectedLeft);
      const rightItem = rightItems.find(item => item.id === rightId);
      
      // Save as label-to-label mapping
      const newMatches = { ...matches, [leftItem.label]: rightItem.label };
      setMatches(newMatches);
      onChange(newMatches);
      setSelectedLeft(null);
    }
  };

  // Update connecting lines when matches change
  useEffect(() => {
    const updateLines = () => {
      if (!leftColumnRef.current || !rightColumnRef.current) return;
      
      const newLines = [];
      // Convert label-based matches back to ID-based for DOM queries
      Object.entries(matches).forEach(([leftLabel, rightLabel]) => {
        const leftItem = leftItems.find(item => item.label === leftLabel);
        const rightItem = rightItems.find(item => item.label === rightLabel);
        if (!leftItem || !rightItem) return;
        
        const leftButton = leftColumnRef.current?.querySelector(`[data-item-id="${leftItem.id}"]`);
        const rightButton = rightColumnRef.current?.querySelector(`[data-item-id="${rightItem.id}"]`);
        
        if (leftButton && rightButton) {
          const leftRect = leftButton.getBoundingClientRect();
          const rightRect = rightButton.getBoundingClientRect();
          const containerRect = leftColumnRef.current.parentElement.getBoundingClientRect();
          
          const x1 = leftRect.right - containerRect.left;
          const y1 = leftRect.top + leftRect.height / 2 - containerRect.top;
          const x2 = rightRect.left - containerRect.left;
          const y2 = rightRect.top + rightRect.height / 2 - containerRect.top;
          
          newLines.push({
            key: `${leftItem.id}-${rightItem.id}`,
            x1,
            y1,
            x2,
            y2
          });
        }
      });
      
      setLines(newLines);
    };

    // Update immediately and on window resize
    updateLines();
    window.addEventListener('resize', updateLines);
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(updateLines, 100);
    
    return () => {
      window.removeEventListener('resize', updateLines);
      clearTimeout(timer);
    };
  }, [matches, leftItems, rightItems]);

  return (
    <QuestionWrapper title={title} description={description}>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Instructions:</strong> Click on a word on the left, then click on the matching picture on the right to connect them.
        </p>
      </div>
      <div className="relative">
        <svg 
          className="absolute inset-0 pointer-events-none text-indigo-500" 
          style={{ width: '100%', height: '100%', zIndex: 1 }}
        >
          {lines.map(line => (
            <line
              key={line.key}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div className="grid grid-cols-2 gap-8" style={{ position: 'relative', zIndex: 2 }}>
          {/* Left Column - Words */}
          <div className="space-y-3" ref={leftColumnRef}>
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Words</h3>
            {leftItems.map((item) => {
              const isSelected = selectedLeft === item.id;
              const isMatched = matches[item.label]; // Check by label
              
              return (
                <div key={item.id} className="flex items-center gap-2">
                  <button
                    data-item-id={item.id}
                    onClick={() => handleLeftClick(item.id)}
                    className={`flex-1 p-3 rounded-lg border-2 font-medium text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 shadow-md'
                        : isMatched
                        ? 'border-indigo-300 bg-indigo-50'
                        : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right Column - Pictures */}
          <div className="space-y-3" ref={rightColumnRef}>
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Pictures</h3>
            {rightItems.map((item) => {
              const isTargetOfSelected = !!selectedLeft;
              // Find which left label matches this right label
              const matchedLeftLabel = Object.entries(matches).find(([, rightLabel]) => rightLabel === item.label)?.[0];
              const matchedByLeft = leftItems.find(l => l.label === matchedLeftLabel);
              
              // Get image URL: first try questionMedia
              let imageUrl = null;
              if (item.type === 'image' && item.imageIndex !== undefined) {
                if (questionMedia && questionMedia[item.imageIndex]) {
                  imageUrl = questionMedia[item.imageIndex].url;
                }
              }
              
              return (
                <button
                  key={item.id}
                  data-item-id={item.id}
                  onClick={() => handleRightClick(item.id)}
                  disabled={!selectedLeft}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    matchedByLeft
                      ? 'border-indigo-300 bg-indigo-50'
                      : isTargetOfSelected
                      ? 'border-indigo-400 bg-indigo-50 cursor-pointer hover:border-indigo-600 hover:shadow-md'
                      : 'border-gray-300 cursor-not-allowed opacity-50'
                  }`}
                >
                  {imageUrl ? (
                    <div className="flex flex-col items-center">
                      <img 
                        src={imageUrl} 
                        alt={item.label || 'Match option'} 
                        className="w-full h-40 object-contain rounded mb-2"
                        onError={(e) => {
                          console.error('Failed to load matching image:', imageUrl);
                          e.target.alt = 'Image not available';
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      {item.label}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        Matched: {Object.keys(matches).length} / {leftItems.length}
        {Object.keys(matches).length === leftItems.length && (
          <span className="ml-2 text-indigo-600 font-medium">All matched</span>
        )}
      </div>
    </QuestionWrapper>
  );
};

const AudioRecorder = ({ onRecordingComplete, label = "Start Recording", savedAudioUrl = null }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioUrl, setAudioUrl] = useState(savedAudioUrl);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      const chunks = [];
      
      recorder.ondataavailable = e => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        // Create blob with proper MIME type
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        console.log('Audio recorded:', { size: blob.size, type: blob.type });
        
        // Pass the blob to parent - it will handle upload
        if (blob.size > 0) {
          onRecordingComplete(blob);
        } else {
          console.error('Recorded audio blob is empty');
          alert('Recording failed - no audio data captured');
        }
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please ensure permissions are granted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <button 
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-4 py-2 rounded-md text-white font-medium ${
          isRecording 
            ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
            : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isRecording ? "Stop Recording" : (audioUrl ? "Re-record" : label)}
      </button>
      {audioUrl && (
        <div className="flex flex-col items-center">
          <audio controls src={audioUrl} className="mt-2" />
          <p className="text-xs text-green-600 mt-1">✓ Recording saved</p>
        </div>
      )}
    </div>
  );
};

// Component for Name & Address Learning
const NameAddressLearning = ({ title, description, onComplete, address, instructionText, memorizeText, hidingText, repeatText, buttonShow, buttonNext, buttonFinish, onTrialRecording }) => {
  const [phase, setPhase] = useState('instruction'); // instruction, showing, input
  const [trial, setTrial] = useState(1);
  const [timeLeft, setTimeLeft] = useState(5);
  const [trialRecorded, setTrialRecorded] = useState(false);

  useEffect(() => {
    if (phase === 'showing') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setPhase('input');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase]);

  const startTrial = () => {
    setTimeLeft(5);
    setPhase('showing');
  };

  const handleNextTrial = () => {
    if (trial < 3) {
      setTrial(prev => prev + 1);
      setPhase('instruction');
      setTrialRecorded(false); // Reset for next trial
    } else {
      if (onComplete) onComplete();
    }
  };

  if (phase === 'instruction') {
    return (
      <QuestionWrapper title={`${title} - Trial ${trial}/3`} description={description}>
        <div className="text-center py-8">
          <p className="mb-4 text-gray-600">
            {instructionText}
          </p>
          <button
            onClick={startTrial}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {buttonShow}
          </button>
        </div>
      </QuestionWrapper>
    );
  }

  if (phase === 'showing') {
    return (
      <QuestionWrapper title={`${title} - Trial ${trial}/3`} description={memorizeText}>
        <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <h3 className="text-2xl font-bold text-indigo-600 mb-6 tracking-wider leading-loose">
            {address}
          </h3>
          <p className="text-sm text-gray-500">
            {hidingText} <span className="font-bold text-gray-900">{timeLeft}</span> seconds.
          </p>
        </div>
      </QuestionWrapper>
    );
  }

  const handleRecording = async (blob) => {
    console.log(`Trial ${trial} address recording:`, { size: blob.size, type: blob.type });
    setTrialRecorded(true);
    if (onTrialRecording) {
      await onTrialRecording(blob, trial);
    }
  };

  return (
    <QuestionWrapper title={`${title} - Trial ${trial}/3`} description={repeatText}>
      <div className="space-y-4 flex flex-col items-center">
        <p className="text-sm text-gray-500 mb-2">Please speak the address clearly.</p>
        <AudioRecorder 
          onRecordingComplete={handleRecording}
          label="Record Address"
        />
        <div className="flex justify-end w-full mt-4">
          <button
            onClick={handleNextTrial}
            disabled={!trialRecorded}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              trialRecorded 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {trial < 3 ? buttonNext : buttonFinish}
          </button>
        </div>
      </div>
    </QuestionWrapper>
  );
};

// --- Main Component ---

const ACEIIITest = () => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const [responses, setResponses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('en');
  const [micPermission, setMicPermission] = useState(null); // null, granted, denied
  const [sections, setSections] = useState([]);
  const [testTitle, setTestTitle] = useState('ACE-III Assessment');
  const [testSpecificInfo, setTestSpecificInfo] = useState({});
  
  // Ref to prevent duplicate attempt creation
  const attemptInitializedRef = React.useRef(false);

  useEffect(() => {
    const initTest = async () => {
      // Prevent duplicate initialization (React Strict Mode double-mount)
      if (attemptInitializedRef.current) return;
      attemptInitializedRef.current = true;
      
      setLoading(true);
      
      try {
        // Check microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setMicPermission('granted');

        // Fetch ACE-III test
        const testsRes = await api.get('/tests');
        const tests = testsRes.data.items || [];
        const aceTest = tests.find(t => 
          (t.title || '').toLowerCase().includes('ace') || 
          (t.title || '').toLowerCase().includes('addenbrooke')
        );
        
        if (!aceTest) {
          alert("ACE-III test not found.");
          setLoading(false);
          return;
        }

        setTestTitle(aceTest.title);
        setTestSpecificInfo(aceTest.test_specific_info || {});

        // Fetch sections & questions
        const sectionsRes = await api.get(`/tests/${aceTest.id}/sections`);
        const sectionsData = Array.isArray(sectionsRes.data) ? sectionsRes.data : [];
        sectionsData.sort((a, b) => a.orderIndex - b.orderIndex);

        const fullSections = await Promise.all(sectionsData.map(async (section) => {
          const qRes = await api.get(`/sections/${section.id}/questions`);
          
          // Fetch detailed question data with media and options
          const questionsWithMedia = await Promise.all(qRes.data.map(async (q) => {
            try {
              const detailRes = await api.get(`/questions/${q.id}`);
              const questionDetail = detailRes.data;

              const isLanguageComprehension =
                (section.title || '').toLowerCase().includes('language - comprehension') ||
                ((questionDetail.text || '').toLowerCase().includes('point to the one that is a fruit'));

              if (import.meta?.env?.DEV && isLanguageComprehension) {
                // Helpful when diagnosing frog/banana/car option media
                console.log('[ACE-III] Language Comprehension question detail', {
                  sectionTitle: section.title,
                  questionId: q.id,
                  questionText: questionDetail.text,
                  options: questionDetail.options,
                });
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
              console.log("Below Fetching Options")
              if (questionDetail.options && Array.isArray(questionDetail.options)) {
                options = await Promise.all(questionDetail.options.map(async (opt) => {
                  // Fetch media for each option if it has any
                  let optionMedia = [];
                  
                  // Strategy 1: If backend populated opt.media array, fetch those
                  if (opt.media && Array.isArray(opt.media) && opt.media.length > 0) {
                    optionMedia = await Promise.all(opt.media.map(async (m) => {
                      try {
                        const mediaId =
                          (typeof m === 'number' ? m : null) ??
                          (typeof m === 'string' ? (getMediaIdFromRef(m) ?? null) : null) ??
                          (m?.mediaId ?? null) ??
                          (m?.id ?? null);

                        if (!mediaId) {
                          if (import.meta?.env?.DEV && isLanguageComprehension) {
                            console.warn('[ACE-III] Option media missing id', { optionId: opt.id, media: m });
                          }
                          return m;
                        }

                        const downloadRes = await api.get(`/media/${mediaId}/download`);
                        const presignedUrl =
                          downloadRes.data?.presignedUrl ||
                          downloadRes.data?.url ||
                          downloadRes.data?.presigned_url;

                        return {
                          ...(typeof m === 'object' && m !== null ? m : {}),
                          url: presignedUrl
                        };
                      } catch (err) {
                        if (import.meta?.env?.DEV && isLanguageComprehension) {
                          console.error('[ACE-III] Failed to fetch option media presigned URL', {
                            optionId: opt.id,
                            media: m,
                            error: err,
                          });
                        } else {
                          console.error('Failed to fetch option media:', err);
                        }
                        return m;
                      }
                    }));
                  }
                  // Strategy 2: Fallback to opt.config.mediaId if backend didn't populate opt.media
                  else if (opt.config?.mediaId) {
                    try {
                      const downloadRes = await api.get(`/media/${opt.config.mediaId}/download`);
                      const presignedUrl =
                        downloadRes.data?.presignedUrl ||
                        downloadRes.data?.url ||
                        downloadRes.data?.presigned_url;
                      
                      optionMedia = [{
                        id: opt.config.mediaId,
                        url: presignedUrl
                      }];
                      
                      if (import.meta?.env?.DEV && isLanguageComprehension) {
                        console.log('[ACE-III] Fetched option media via config.mediaId', {
                          optionId: opt.id,
                          mediaId: opt.config.mediaId,
                          url: presignedUrl
                        });
                      }
                    } catch (err) {
                      if (import.meta?.env?.DEV && isLanguageComprehension) {
                        console.error('[ACE-III] Failed to fetch option media via config.mediaId', {
                          optionId: opt.id,
                          mediaId: opt.config.mediaId,
                          error: err,
                        });
                      } else {
                        console.error('Failed to fetch option config media:', err);
                      }
                    }
                  }

                  if (import.meta?.env?.DEV && isLanguageComprehension) {
                    console.log('[ACE-III] Language Comprehension option media resolved', {
                      optionId: opt.id,
                      optionText: opt.text,
                      optionMedia,
                    });
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

        // Check for existing attempt or create new one
        try {
          const attemptsRes = await api.get('/attempts');
          const attempts = attemptsRes.data.items || attemptsRes.data || [];
          
          const activeAttempt = attempts.find(a => 
            a.testId === aceTest.id && !a.submittedAt && !a.submit_time
          );

          if (activeAttempt) {
            setAttemptId(activeAttempt.id);
            
            // Load previous responses
            const responsesRes = await api.get(`/responses?attempt_id=${activeAttempt.id}`);
            const responsesData = responsesRes.data.items || responsesRes.data || [];
            
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
              if (typeof value === 'string' && (value.startsWith('media/') || value.startsWith('media:'))) {
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
            }));            setResponses(loadedResponses);
          } else {
            // Create new attempt
            const attemptRes = await api.post('/attempts', { testId: aceTest.id });
            setAttemptId(attemptRes.data.id);
          }
        } catch {
          console.warn("Running in demo mode - results won't be saved");
        }
      } catch (error) {
        console.error("Failed to initialize test:", error);
        if (error.message?.includes('microphone')) {
          setMicPermission('denied');
        } else {
          alert("Failed to load test. Please refresh the page.");
        }
      } finally {
        setLoading(false);
      }
    };

    initTest();
  }, [navigate]);

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
      const question = findQuestion(questionId);
      if (!question) return;

      let answerText = typeof valueToSave === 'string' ? valueToSave : JSON.stringify(valueToSave);

      // Handle media uploads (store `answerText` as `media:<id>`)
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
          alert('Failed to upload drawing. Please try again.');
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
          alert('Failed to upload file. Please try again.');
          return;
        }
      }

      // Handle Audio Blob uploads
      if (valueToSave instanceof Blob && (valueToSave.type || '').startsWith('audio/')) {
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

      // For Blob values (drawing/audio), store a preview URL but save the original bytes
      let valueToSave = newValue;
      if (fieldIndex === null && newValue instanceof Blob) {
        const prevVal = prev[questionId];
        if (typeof prevVal === 'string' && prevVal.startsWith('blob:')) {
          try { URL.revokeObjectURL(prevVal); } catch { /* ignore */ }
        }
        newValue = URL.createObjectURL(newValue);
      }
      
      // Save to backend after state update
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
        // Responses are already saved, just finalize the attempt (following MoCA pattern)
        await api.post(`/attempts/${attemptId}`, {
          submit_time: new Date().toISOString()
        });
        alert("ACE-III Test submitted successfully!");
      } else {
        console.log("Demo mode submission:", responses);
        alert("ACE-III Test submitted successfully (Demo Mode - Not Saved to Backend)!");
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

  if (micPermission === 'denied') {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Microphone Access Required</h2>
        <p className="text-gray-700 mb-4">This test requires voice input for several sections. Please allow microphone access in your browser settings and refresh the page.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  if (sections.length === 0) {
    return <div className="flex justify-center items-center min-h-screen">Test data not available.</div>;
  }

  const renderQuestion = (q, qIdx) => {
    const qTrans = getTranslation(language, currentSection, qIdx);
    const config = { ...(q.config || {}), ...(qTrans?.config || {}) };
    const type = config.frontend_type || q.type;
    const title = config.title || q.title;
    const description = qTrans?.text || q.text || q.description;

    switch (type) {
      case 'name_address_learning':
        return (
          <NameAddressLearning
            key={q.id}
            title={title}
            description={description}
            onComplete={() => {}}
            address={config.address || q.address}
            instructionText={config.instructionText || q.instructionText}
            memorizeText={config.memorizeText || q.memorizeText}
            hidingText={config.hidingText || q.hidingText}
            repeatText={config.repeatText || q.repeatText}
            buttonShow={config.buttonShow || q.buttonShow || "Show Address"}
            buttonNext={config.buttonNext || q.buttonNext || "Next Trial"}
            buttonFinish={config.buttonFinish || q.buttonFinish || "Finish"}
            onTrialRecording={async (blob, trialNum) => {
              // Save each trial's recording separately
              console.log(`Saving trial ${trialNum} recording for question ${q.id}`);
              await handleResponseChange(q.id, blob);
            }}
          />
        );
      case 'memory_registration':
        return (
          <QuestionWrapper key={q.id} title={title} description={description}>
             <div className="p-4 bg-blue-50 text-blue-800 rounded-md text-center font-bold text-xl mb-6">
               {(config.words || q.words || []).join(" - ")}
             </div>
             <div className="flex flex-col items-center">
               <p className="mb-2 text-sm text-gray-600">Press record and repeat the words.</p>
               <AudioRecorder 
                 onRecordingComplete={(blob) => handleResponseChange(q.id, blob)} 
                 label="Record Words"
                 savedAudioUrl={responses[q.id]}
               />
             </div>
          </QuestionWrapper>
        );
      case 'audio':
        return (
          <QuestionWrapper key={q.id} title={title} description={description}>
             <div className="flex flex-col items-center py-4">
               <AudioRecorder 
                 onRecordingComplete={(blob) => handleResponseChange(q.id, blob)} 
                 label="Start Recording Answer"
                 savedAudioUrl={responses[q.id]}
               />
             </div>
          </QuestionWrapper>
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
      case 'text_multiline':
        return (
          <TextResponseQuestion
            key={q.id}
            title={title}
            description={description}
            value={responses[q.id] || ''}
            onChange={(val) => handleResponseChange(q.id, val)}
            placeholder={config.placeholder || q.placeholder}
            multiline={true}
          />
        );
      case 'text_grouped':
        return (
          <QuestionWrapper key={q.id} title={title} description={description}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(config.fields || q.fields || []).map((field, idx) => (
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
      case 'matching':
        return (
          <MatchingQuestion
            key={q.id}
            title={title}
            description={description}
            leftItems={config.leftItems || []}
            rightItems={config.rightItems || []}
            value={responses[q.id] || {}}
            onChange={(matches) => handleResponseChange(q.id, matches)}
            questionMedia={q.media || []}
          />
        );
      case 'naming_grouped':
        return (
          <QuestionWrapper key={q.id} title={title} description={description}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {(config.items || q.items || []).map((item, idx) => {
                const mediaIndex = item.imageIndex !== undefined ? item.imageIndex : idx;
                const imageUrl = q.media?.[mediaIndex]?.url;

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
                    <input
                      type="text"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      value={(responses[q.id] || [])[idx] || ''}
                      onChange={(e) => handleResponseChange(q.id, e.target.value, idx)}
                      placeholder={item.placeholder}
                    />
                  </div>
                );
              })}
            </div>
          </QuestionWrapper>
        );
      case 'mcq': {
        // Use actual options from backend if available, otherwise fall back to config
        const configOptions = config.options || [];
        const optionsToRender = q.options && q.options.length > 0 ? q.options : configOptions;
        
        const hasImages = optionsToRender.some(o => (o.media && o.media.length > 0) || (o.imageIndex !== undefined && q.media && q.media[o.imageIndex]));
        
        return (
          <QuestionWrapper key={q.id} title={title} description={description}>
            <div className={`${hasImages ? 'grid grid-cols-1 sm:grid-cols-3 gap-6' : 'space-y-3'}`}>
              {optionsToRender.map((opt, idx) => {
                  // Get image from multiple sources:
                  // 1. Option's media from backend
                  // 2. Question media mapped via imageIndex from config
                  let optImage = null;
                  if (opt.media && opt.media.length > 0) {
                    optImage = opt.media[0].url;
                  } else if (opt.imageIndex !== undefined && q.media && q.media[opt.imageIndex]) {
                    optImage = q.media[opt.imageIndex].url;
                  }
                  
                  // For backend options, use option.id; for config options, use opt.value
                  const optionValue = opt.id || opt.value || idx;
                  const optionLabel = opt.text || opt.label || `Option ${idx + 1}`;
                  const isSelected = responses[q.id] === optionValue;
                  
                  return (
                    <div 
                      key={opt.id || idx} 
                      onClick={() => handleResponseChange(q.id, optionValue)}
                      className={`relative flex ${optImage ? 'flex-col items-center text-center p-4' : 'items-center p-4'} border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200 shadow-md' : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        checked={isSelected}
                        onChange={() => handleResponseChange(q.id, optionValue)}
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 absolute top-3 right-3"
                      />
                      
                      {optImage && (
                        <img 
                          src={optImage} 
                          alt={optionLabel || 'Option image'} 
                          className="w-full h-40 object-contain mb-3 rounded"
                          onError={(e) => {
                            console.error('Failed to load image:', optImage);
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                       
                      {optionLabel && (
                        <span className={`block font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                          {optionLabel}
                        </span>
                      )}
                    </div>
                  );
              })}
            </div>
          </QuestionWrapper>
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
      case 'drawing': {
        const referenceImage = q.media?.find(m => m.type === 'image')?.url;
        
        return (
          <DrawingCanvasQuestion
            key={q.id}
            title={title}
            description={description}
            onSave={(blob) => handleResponseChange(q.id, blob)}
            referenceImage={referenceImage}
            savedImage={responses[q.id] || null}
            width={referenceImage ? 350 : 500}
            height={referenceImage ? 280 : 400}
          />
        );
      }
      default:
        return null;
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
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {!attemptId && !loading && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p className="font-bold">Demo Mode</p>
          <p>You are not logged in or could not start a session. Your results will NOT be saved.</p>
        </div>
      )}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{currentTestTitle}</h1>
          <p className="mt-2 text-gray-600">Section {currentSection + 1} of {sections.length}</p>
        </div>
        <button
          onClick={() => setLanguage(prev => prev === 'en' ? 'mr' : 'en')}
          className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 font-medium"
        >
          {language === 'en' ? 'Switch to Marathi' : 'Switch to English'}
        </button>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4 mb-8">
        <div 
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
          style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
        ></div>
      </div>

      <div className="space-y-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">{currentSectionTitle}</h2>
          <div className="space-y-6">
            {sections[currentSection].questions.map((q, idx) => renderQuestion(q, idx))}
          </div>
        </div>

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

export default ACEIIITest;
