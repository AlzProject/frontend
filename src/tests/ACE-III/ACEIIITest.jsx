import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextResponseQuestion,
  MultipleChoiceQuestion,
  DrawingCanvasQuestion,
  QuestionWrapper
} from '../../components/QuestionTypes';
import api from '../../api';
import aceData from './ACEIII_Questions.json';

// --- Helper Components ---

const AudioRecorder = ({ onRecordingComplete, label = "Start Recording" }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
         const blob = new Blob(chunks, { type: 'audio/webm' });
         const url = URL.createObjectURL(blob);
         setAudioUrl(url);
         onRecordingComplete(blob);
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
        className={`px-4 py-2 rounded-md text-white font-medium ${isRecording ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'}`}
      >
        {isRecording ? "Stop Recording" : (audioUrl ? "Re-record" : label)}
      </button>
      {audioUrl && (
        <audio controls src={audioUrl} className="mt-2" />
      )}
    </div>
  );
};

// Component for Name & Address Learning
const NameAddressLearning = ({ title, description, onComplete, address, instructionText, memorizeText, hidingText, repeatText, buttonShow, buttonNext, buttonFinish }) => {
  const [phase, setPhase] = useState('instruction'); // instruction, showing, input
  const [trial, setTrial] = useState(1);
  const [timeLeft, setTimeLeft] = useState(5);

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

  return (
    <QuestionWrapper title={`${title} - Trial ${trial}/3`} description={repeatText}>
      <div className="space-y-4 flex flex-col items-center">
        <p className="text-sm text-gray-500 mb-2">Please speak the address clearly.</p>
        <AudioRecorder 
          onRecordingComplete={(blob) => {
             // In a real app, we'd upload this blob. For now, we just acknowledge it.
             console.log("Address trial recording:", blob);
          }}
          label="Record Address"
        />
        <div className="flex justify-end w-full mt-4">
          <button
            onClick={handleNextTrial}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
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

  useEffect(() => {
    const initTest = async () => {
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

        const testsRes = await api.get('/tests');
        const tests = testsRes.data.items || [];
        const aceTest = tests.find(t => t.name.toLowerCase().includes('ace') || t.name.toLowerCase().includes('addenbrooke'));
        
        if (aceTest) {
          const attemptRes = await api.post('/attempts', { testId: aceTest.id });
          setAttemptId(attemptRes.data.id);
        } else {
          console.warn("ACE-III test not found in backend. Running in offline/demo mode.");
        }
      } catch (error) {
        console.error("Failed to initialize test:", error);
      } finally {
        setLoading(false);
      }
    };

    initTest();
  }, []);

  const sections = aceData[language];

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
          submit_time: new Date().toISOString(),
          responses: responses
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

  const renderQuestion = (q) => {
    switch (q.type) {
      case 'name_address_learning':
        return (
          <NameAddressLearning
            key={q.id}
            title={q.title}
            description={q.description}
            onComplete={() => {}}
            address={q.address}
            instructionText={q.instructionText}
            memorizeText={q.memorizeText}
            hidingText={q.hidingText}
            repeatText={q.repeatText}
            buttonShow={q.buttonShow}
            buttonNext={q.buttonNext}
            buttonFinish={q.buttonFinish}
          />
        );
      case 'memory_registration':
        return (
          <QuestionWrapper key={q.id} title={q.title} description={q.description}>
             <div className="p-4 bg-blue-50 text-blue-800 rounded-md text-center font-bold text-xl mb-6">
               {q.words.join(" - ")}
             </div>
             <div className="flex flex-col items-center">
               <p className="mb-2 text-sm text-gray-600">Press record and repeat the words.</p>
               <AudioRecorder 
                 onRecordingComplete={(blob) => handleResponseChange(q.id, blob)} 
                 label="Record Words"
               />
             </div>
          </QuestionWrapper>
        );
      case 'audio':
        return (
          <QuestionWrapper key={q.id} title={q.title} description={q.description}>
             <div className="flex flex-col items-center py-4">
               <AudioRecorder 
                 onRecordingComplete={(blob) => handleResponseChange(q.id, blob)} 
                 label="Start Recording Answer"
               />
             </div>
          </QuestionWrapper>
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
      case 'naming_grouped':
        return (
          <QuestionWrapper key={q.id} title={q.title} description={q.description}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {q.items.map((item, idx) => (
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
            title={q.title}
            description={q.description}
            options={q.options}
            selectedValues={responses[q.id] ? [responses[q.id]] : []}
            onChange={(val) => handleResponseChange(q.id, val[0])}
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
            backgroundImage={q.backgroundImage}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ACE-III Assessment</h1>
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
          <h2 className="text-xl font-medium text-gray-900 mb-4">{sections[currentSection].title}</h2>
          <div className="space-y-6">
            {sections[currentSection].questions.map(q => renderQuestion(q))}
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
