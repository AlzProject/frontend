import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import testData from './data.json';
import api from '../../api';
import { uploadMediaAndGetAnswerText } from '../../media';

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
  
  // Image pool and selection
  const [imagePool] = useState(() => {
    const question = testData.sections[0].questions[0];
    return question.config.imagePool || [];
  });
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const selectedImage = imagePool[currentImageIndex];
  
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
        
        const question = questions[0];
        
        setQuestionId(question.id);
        
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
      navigate('/');
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading test...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8 max-w-md">
          <div className="text-red-600 text-xl font-bold mb-4">Error</div>
          <p className="text-slate-700 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition-all"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Header */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {t.title}
            </h1>
            <button 
              onClick={toggleLanguage}
              className="px-3 py-1.5 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-xs font-medium transition-all rounded-lg bg-slate-800/50 hover:bg-slate-800"
            >
              {language === 'en' ? 'मराठी' : 'English'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Section Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white">{section.title}</h2>
            <p className="text-blue-100 text-sm mt-1">{section.description}</p>
          </div>

          {/* Question Content */}
          <div className="p-6 space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-slate-700 font-medium">{question.text}</p>
              <p className="text-sm text-slate-600 mt-2">{config.instructions}</p>
            </div>

            {/* Image Display */}
            {selectedImage && (
              <div className="flex flex-col items-center space-y-4">
                <div className="text-lg font-medium text-slate-700">
                  Image {currentImageIndex + 1} of {imagePool.length}
                </div>
                
                <div className="flex justify-center items-center gap-6 w-full">
                  <button
                    onClick={handlePrevImage}
                    className="flex flex-col items-center justify-center p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow border border-slate-200 hover:border-blue-300 transition-all min-w-[5rem]"
                    title="Previous Image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-xs font-semibold">Previous</span>
                  </button>

                  <div className="border-4 border-slate-200 rounded-lg overflow-hidden shadow-md">
                    <img 
                      src={`/src/tests/ImageDescription/Images/${selectedImage}`}
                      alt={`Description prompt ${currentImageIndex + 1}`}
                      className="object-contain bg-slate-100"
                      style={{ width: '60vh', height: '60vh' }}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400"%3E%3Crect fill="%23e2e8f0" width="600" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%2394a3b8"%3EImage: ' + selectedImage + '%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                  
                  <button
                    onClick={handleNextImage}
                    className="flex flex-col items-center justify-center p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow border border-slate-200 hover:border-blue-300 transition-all min-w-[5rem]"
                    title="Next Image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-xs font-semibold">Next</span>
                  </button>
                </div>
              </div>
            )}

            {/* Recording Controls */}
            <div className="bg-slate-50 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-4 h-4 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`}></div>
                  <span className="text-2xl font-mono font-bold text-slate-900">
                    {formatTime(recordingTime)} / 1:00
                  </span>
                </div>
                
                <div className="text-sm text-slate-600">
                  {isRecording ? 'Recording...' : hasStarted ? 'Recording stopped' : 'Ready to record'}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={startRecording}
                  disabled={isRecording || audioBlob}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                    isRecording || audioBlob
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  {audioBlob ? '✓ Recorded' : 'Start Recording'}
                </button>

                <button
                  onClick={stopRecording}
                  disabled={!isRecording}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                    !isRecording
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  Stop Recording
                </button>
              </div>

              {/* Audio Playback */}
              {audioBlob && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600 mb-2">Preview your recording:</p>
                  <audio 
                    src={URL.createObjectURL(audioBlob)} 
                    controls 
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!audioBlob || submitting}
                className={`px-6 py-2.5 font-semibold rounded-lg transition-all ${
                  audioBlob && !submitting
                    ? 'bg-blue-700 hover:bg-blue-800 text-white shadow-md hover:shadow-lg'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ImageDescriptionTest;
