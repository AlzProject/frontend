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

// --- Helper Components ---

const AudioRecorder = ({ onRecordingComplete, label = "Start Recording", savedAudioUrl = null }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioUrl, setAudioUrl] = useState(savedAudioUrl);
  const [isUploading, setIsUploading] = useState(false);

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
        disabled={isUploading}
        className={`px-4 py-2 rounded-md text-white font-medium ${
          isRecording 
            ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
            : isUploading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isRecording ? "Stop Recording" : isUploading ? "Uploading..." : (audioUrl ? "Re-record" : label)}
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
        // Check mic permission first
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          setMicPermission('granted');
        } catch (error) {
          console.error("Mic permission denied:", error);
          setMicPermission('denied');
          setLoading(false);
          return; // Stop initialization if mic denied
        }

        // 1. Fetch tests to find ACE-III
        const testsRes = await api.get('/tests');
        const tests = testsRes.data.items || [];
        const aceTest = tests.find(t => 
          (t.title || '').toLowerCase().includes('ace') || 
          (t.title || '').toLowerCase().includes('addenbrooke')
        );
        
        if (aceTest) {
          setTestTitle(aceTest.title);
          setTestSpecificInfo(aceTest.test_specific_info || {});

          // 2. Fetch Sections & Questions
          try {
            const sectionsRes = await api.get(`/tests/${aceTest.id}/sections`);
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
                a.testId === aceTest.id && !a.submittedAt && !a.submit_time
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
                const attemptRes = await api.post('/attempts', { testId: aceTest.id });
                setAttemptId(attemptRes.data.id);
              }
            } catch (attemptError) {
              console.warn("Failed to start attempt (running in demo mode):", attemptError);
            }
          } catch (secError) {
            console.error("Failed to fetch sections:", secError);
            alert("Failed to load test content.");
          }
        } else {
          console.warn("ACE-III test not found in backend.");
          alert("ACE-III test not found.");
        }
      } catch (error) {
        console.error("Failed to initialize test:", error);
      } finally {
        setLoading(false);
      }
    };

    initTest();
  }, []);

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

      // Handle Drawing/File Uploads and Audio - upload immediately
      const config = question.config || {};
      const isDrawing = config.frontend_type === 'drawing' || question.type === 'file_upload';
      const isAudio = config.frontend_type === 'audio' || question.type === 'audio';

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
          return; // Don't save response if upload failed
        }
      } else if (valueToSave instanceof Blob) {
        // Handle audio blob upload immediately
        console.log('Detected Blob for upload:', { 
          size: valueToSave.size, 
          type: valueToSave.type,
          questionId: questionId
        });
        
        // Verify blob has content
        if (valueToSave.size === 0) {
          console.error(`Audio blob is empty for question ${questionId}`);
          alert('Recording is empty. Please try recording again.');
          return;
        }
        
        try {
          const formData = new FormData();
          // Use the original blob directly - don't rewrap it
          // Append with explicit filename and proper MIME type
          formData.append('file', valueToSave, `audio_q${questionId}_${Date.now()}.webm`);
          formData.append('type', 'audio');
          formData.append('label', `Audio recording for Question ${questionId}`);
          
          console.log(`Uploading audio for question ${questionId}...`);
          console.log('Audio blob details:', { 
            size: valueToSave.size, 
            type: valueToSave.type,
            isBlob: valueToSave instanceof Blob
          });
          
          // Don't set Content-Type header - let the browser set it with proper boundary
          const mediaRes = await api.post('/media', formData);
          
          console.log('Media upload response:', mediaRes.data);
          
          if (mediaRes.data && mediaRes.data.url) {
            answerText = mediaRes.data.url;
            console.log(`Audio uploaded successfully: ${answerText}`);
          } else {
            console.error('Media upload succeeded but no URL returned:', mediaRes.data);
            return;
          }
        } catch (uploadError) {
          console.error(`Failed to upload audio for question ${questionId}:`, uploadError);
          console.error('Upload error details:', uploadError.response?.data);
          console.error('Full error:', uploadError);
          return; // Don't save response if upload failed
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

  const handleResponseChange = async (questionId, value, fieldIndex = null) => {
    // Special handling for Blobs (audio recordings) - upload immediately
    if (value instanceof Blob) {
      console.log('Handling audio blob for question', questionId, 'Size:', value.size);
      
      // Upload immediately to prevent blob data loss
      await saveResponseToBackend(questionId, value);
      
      // Store a placeholder in state to indicate audio was uploaded
      setResponses(prev => ({
        ...prev,
        [questionId]: `audio_uploaded_q${questionId}` // Placeholder
      }));
      return;
    }
    
    // For non-blob values (text, arrays, etc.), use normal flow
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
        alert("ACE-III Test submitted successfully!");
      } else {
        console.log("Demo mode submission:", responses);
        alert("ACE-III Test submitted successfully (Demo Mode)!");
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
        const savedAudioReg = responses[q.id] && typeof responses[q.id] === 'string' && responses[q.id].startsWith('http') 
          ? responses[q.id] 
          : null;
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
                 savedAudioUrl={savedAudioReg}
               />
             </div>
          </QuestionWrapper>
        );
      case 'audio':
        const savedAudio = responses[q.id] && typeof responses[q.id] === 'string' && responses[q.id].startsWith('http') 
          ? responses[q.id] 
          : null;
        return (
          <QuestionWrapper key={q.id} title={title} description={description}>
             <div className="flex flex-col items-center py-4">
               <AudioRecorder 
                 onRecordingComplete={(blob) => handleResponseChange(q.id, blob)} 
                 label="Start Recording Answer"
                 savedAudioUrl={savedAudio}
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
      case 'naming_grouped':
        return (
          <QuestionWrapper key={q.id} title={title} description={description}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {(config.items || q.items || []).map((item, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <img src={item.img} alt={item.label} className="w-24 h-24 object-cover rounded-md mb-3 border" />
                  <input
                    type="text"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    value={(responses[q.id] || [])[idx] || ''}
                    onChange={(e) => handleResponseChange(q.id, e.target.value, idx)}
                    placeholder={item.placeholder}
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
            title={title}
            description={description}
            options={config.options || q.options || []}
            selectedValues={responses[q.id] ? [responses[q.id]] : []}
            onChange={(val) => handleResponseChange(q.id, val[0])}
            type="single"
          />
        );
      case 'drawing':
        return (
          <DrawingCanvasQuestion
            key={q.id}
            title={title}
            description={description}
            onSave={(dataUrl) => handleResponseChange(q.id, dataUrl)}
            backgroundImage={config.backgroundImage || q.backgroundImage}
            savedImage={responses[q.id] || null}
          />
        );
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
