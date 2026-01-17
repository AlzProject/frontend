import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import testData from './data.json';
import api from '../../api';
import { uploadMediaAndGetAnswerText } from '../../media';
import { checkFeedbackAndRedirect } from '../../utils';

function ImageDescriptionTest() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('app_language') || 'en';
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [questionId, setQuestionId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Image pool and selection
  const [imagePool, setImagePool] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);

  const selectedMedia = imagePool[currentImageIndex];

  // Fetch image URL when selection changes
  useEffect(() => {
    const fetchImageUrl = async () => {
      if (selectedMedia && selectedMedia.id) {
        try {
          // If we already have a presigned url in the media object (sometimes API might return it), use it
          // But based on openapi, we usually need to call /media/{id}/download
          const res = await api.get(`/media/${selectedMedia.id}/download`);
          if (res.data && res.data.presignedUrl) {
            setCurrentImageUrl(res.data.presignedUrl);
          }
        } catch (err) {
          console.error("Failed to fetch image url", err);
          setCurrentImageUrl(null);
        }
      } else {
        setCurrentImageUrl(null);
      }
    };
    fetchImageUrl();
  }, [selectedMedia]);
  
  const handleNextImage = () => {
    if (imagePool.length > 0) {
      setCurrentImageIndex(prev => (prev + 1) % imagePool.length);
    }
  };

  const handlePrevImage = () => {
    if (imagePool.length > 0) {
      setCurrentImageIndex(prev => (prev - 1 + imagePool.length) % imagePool.length);
    }
  };
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const t = language === 'mr' && testData.translations.mr 
    ? testData.translations.mr 
    : testData;

  // Initialize test and create attempt
  useEffect(() => {
    const initializeTest = async () => {
      try {
        setLoading(true);
        
        // Fetch all tests and find by title
        const testsResponse = await api.get('/tests');
        const tests = testsResponse.data.items || [];
        const test = tests.find(t => t.title === 'Image Description Test');
        
        if (!test) {
          throw new Error('Image Description test not found');
        }
        
        // Fetch sections (API returns array directly)
        const sectionsResponse = await api.get(`/tests/${test.id}/sections`);
        const sections = Array.isArray(sectionsResponse.data) ? sectionsResponse.data : [];
        
        if (sections.length === 0) {
          throw new Error('No sections found for Image Description test');
        }
        
        const section = sections[0];
        
        // Fetch questions (API returns array directly)
        const questionsResponse = await api.get(`/sections/${section.id}/questions`);
        const questions = Array.isArray(questionsResponse.data) ? questionsResponse.data : [];
        
        if (questions.length === 0) {
          throw new Error('No questions found for Image Description test');
        }
        
        const questionListItem = questions[0];
        
        // Fetch full question details to get media attachments
        const fullQuestionResponse = await api.get(`/questions/${questionListItem.id}`);
        const fullQuestion = fullQuestionResponse.data;
        
        setQuestionId(fullQuestion.id);

        if (fullQuestion.media && Array.isArray(fullQuestion.media)) {
          // Use attached media images
          const images = fullQuestion.media
            .filter(m => m.type === 'image')
            .sort((a, b) => (a.label || '').localeCompare(b.label || ''));
          setImagePool(images);
        }
        
        // Create attempt
        const attemptResponse = await api.post('/attempts', {
          testId: test.id
        });
        
        setAttemptId(attemptResponse.data.id);
        setLoading(false);
      } catch (err) {
        console.error('Error initializing test:', err);
        setError(err.message || 'Failed to load test');
        setLoading(false);
      }
    };
    
    initializeTest();
  }, []);

  // Stop recording function
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Timer for recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, stopRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setHasStarted(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please grant permission and try again.');
    }
  };

  const handleSubmit = async () => {
    if (!audioBlob) {
      alert('Please record your description before submitting.');
      return;
    }

    if (!attemptId || !questionId) {
      alert('Test not properly initialized. Please refresh and try again.');
      return;
    }

    try {
      setSubmitting(true);
      
      // Upload media using helper (handles presigned URL, S3 upload, and formatting)
      const answerText = await uploadMediaAndGetAnswerText({
        questionId: questionId,
        fileOrBlob: audioBlob,
        type: 'audio',
        label: `Description for Question ${questionId}`,
        attachToQuestion: true
      });
      
      // Create response with media reference
      await api.post('/responses', {
        questionId: questionId,
        attemptId: attemptId,
        answerText: answerText
      });
      
      // Finalize attempt
      await api.post(`/attempts/${attemptId}`, {
        submit_time: new Date().toISOString()
      });
      
      alert('Test completed successfully!');
      await checkFeedbackAndRedirect(navigate);
    } catch (err) {
      console.error('Error submitting test:', err);
      alert('Failed to submit test. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'mr' : 'en');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const section = t.sections[0];
  const question = section.questions[0];
  const config = question.config || testData.sections[0].questions[0].config;

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 border-b-2 border-blue-700 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-slate-600 text-base sm:text-lg">Loading test...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg border border-red-200 p-6 sm:p-8 max-w-md w-full">
          <div className="text-red-600 text-lg sm:text-xl font-bold mb-3 sm:mb-4">Error</div>
          <p className="text-slate-700 mb-4 sm:mb-6 text-sm sm:text-base">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition-all text-sm sm:text-base w-full sm:w-auto"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Header */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto py-2 sm:py-3 px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
              {t.title}
            </h1>
            <button 
              onClick={toggleLanguage}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-xs font-medium transition-all rounded-lg bg-slate-800/50 hover:bg-slate-800"
            >
              {language === 'en' ? 'मराठी' : 'English'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-3 py-4 sm:px-4 sm:py-4 md:px-6 md:py-6 lg:px-8 h-[calc(100vh-64px)] overflow-hidden flex flex-col">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl ring-1 ring-slate-900/5 flex flex-col h-full overflow-hidden">
          
          {/* Section Header */}
          <div className="bg-slate-900 px-4 py-3 shrink-0 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">{section.title}</h2>
              <p className="text-xs text-slate-300">{section.description}</p>
            </div>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors border border-slate-700 mx-2"
            >
              {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
            {/* Instructions Collapsible */}
            {showInstructions && (
              <div className="bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg p-3 shadow-sm shrink-0">
                <div className="flex gap-3">
                  <div className="shrink-0 mt-0.5">
                    <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-indigo-900 text-sm mb-1">Instructions</h3>
                    <p className="text-indigo-800 font-medium mb-1 text-xs">{question.text}</p>
                    <p className="text-indigo-700 text-xs leading-relaxed max-w-3xl">
                      {config.instructions || "Please observe the image below carefully. Navigate through the images using the arrows if multiple images are provided. When you are ready, press the 'Start Recording' button and describe everything you see in detail. You have 1 minute to record your response."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Image Display */}
            {selectedMedia && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 shadow-inner flex-1 flex flex-col min-h-0">
                <div className="flex flex-col items-center gap-3 h-full">
                  <div className="flex justify-between w-full items-center px-2">
                     <button
                      onClick={handlePrevImage}
                      className="p-2 hover:bg-white text-slate-600 hover:text-blue-600 rounded-lg border border-transparent hover:border-slate-200 transition-all"
                      title="Previous Image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <span className="text-xs font-semibold text-slate-500">
                      Image {currentImageIndex + 1} / {imagePool.length}
                    </span>
                    
                    <button
                      onClick={handleNextImage}
                      className="p-2 hover:bg-white text-slate-600 hover:text-blue-600 rounded-lg border border-transparent hover:border-slate-200 transition-all"
                      title="Next Image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  <div className="border rounded-lg shadow-sm bg-white w-full flex-1 min-h-0 flex items-center justify-center p-2 overflow-hidden">
                    {currentImageUrl ? (
                      <img 
                        src={currentImageUrl}
                        alt={`Description prompt ${currentImageIndex + 1}`}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="text-sm font-medium">Loading image...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Footer Controls: Recording & Submit */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shrink-0 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Timer & Status */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2 bg-slate-100 px-4 py-2 rounded-full">
                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`}></div>
                    <span className={`text-base font-mono font-bold ${isRecording ? 'text-slate-900' : 'text-slate-500'}`}>
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                  isRecording 
                    ? 'bg-red-50 text-red-600 border border-red-100' 
                    : hasStarted 
                      ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                      : 'bg-green-50 text-green-600 border border-green-100'
                }`}>
                  {isRecording ? 'Recording' : hasStarted ? 'Recorded' : 'Ready'}
                </span>
                </div>

                {/* Recording Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={startRecording}
                    disabled={isRecording || audioBlob}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                      isRecording || audioBlob
                        ? 'bg-slate-100 text-slate-400 border border-slate-200'
                        : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Record
                  </button>

                  <button
                    onClick={stopRecording}
                    disabled={!isRecording}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                      !isRecording
                        ? 'bg-slate-100 text-slate-400 border border-slate-200'
                        : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                    Stop
                  </button>
                  
                  {audioBlob && (
                      <audio 
                        src={URL.createObjectURL(audioBlob)} 
                        controls 
                        className="h-10 w-40"
                      />
                  )}
                </div>

                {/* Submit Actions */}
                <div className="flex items-center gap-3 border-l border-slate-100 pl-3">
                  <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!audioBlob || submitting}
                    className={`px-5 py-2 text-sm font-bold rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-2 ${
                      audioBlob && !submitting
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ImageDescriptionTest;
