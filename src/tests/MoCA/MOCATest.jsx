import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextResponseQuestion,
  MultipleChoiceQuestion,
  DrawingCanvasQuestion,
  QuestionWrapper
} from '../../components/QuestionTypes';
import api from '../../api';

// SVG Data URIs for background images
const TRAIL_MAKING_SVG = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSIyNTAiIGN5PSIzMDAiIHI9IjE1IiBzdHJva2U9ImJsYWNrIiBmaWxsPSJ3aGl0ZSIvPgogIDx0ZXh0IHg9IjI0NSIgeT0iMzA1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiPjE8L3RleHQ+CiAgCiAgPGNpcmNsZSBjeD0iMTUwIiBjeT0iMjAwIiByPSIxNSIgc3Ryb2tlPSJibGFjayIgZmlsbD0id2hpdGUiLz4KICA8dGV4dCB4PSIxNDUiIHk9IjIwNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2Ij5BPC90ZXh0PgogIAogIDxjaXJjbGUgY3g9IjM1MCIgY3k9IjIwMCIgcj0iMTUiIHN0cm9rZT0iYmxhY2siIGZpbGw9IndoaXRlIi8+CiAgPHRleHQgeD0iMzQ1IiB5PSIyMDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiI+MjwvdGV4dD4KICAKICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjE1IiBzdHJva2U9ImJsYWNrIiBmaWxsPSJ3aGl0ZSIvPgogIDx0ZXh0IHg9Ijk1IiB5PSIxMDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiI+QjwvdGV4dD4KICAKICA8Y2lyY2xlIGN4PSI0MDAiIGN5PSIxMDAiIHI9IjE1IiBzdHJva2U9ImJsYWNrIiBmaWxsPSJ3aGl0ZSIvPgogIDx0ZXh0IHg9IjM5NSIgeT0iMTA1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiPjM8L3RleHQ+CiAgCiAgPGNpcmNsZSBjeD0iMjAwIiBjeT0iNTAiIHI9IjE1IiBzdHJva2U9ImJsYWNrIiBmaWxsPSJ3aGl0ZSIvPgogIDx0ZXh0IHg9IjE5NSIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiI+QzwvdGV4dD4KICAKICA8Y2lyY2xlIGN4PSIzMDAiIGN5PSIzNTAiIHI9IjE1IiBzdHJva2U9ImJsYWNrIiBmaWxsPSJ3aGl0ZSIvPgogIDx0ZXh0IHg9IjI5NSIgeT0iMzU1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiPjQ8L3RleHQ+CiAgCiAgPGNpcmNsZSBjeD0iNTAiIGN5PSIzMDAiIHI9IjE1IiBzdHJva2U9ImJsYWNrIiBmaWxsPSJ3aGl0ZSIvPgogIDx0ZXh0IHg9IjQ1IiB5PSIzMDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiI+RDwvdGV4dD4KICAKICA8Y2lyY2xlIGN4PSI0NTAiIGN5PSIzMDAiIHI9IjE1IiBzdHJva2U9ImJsYWNrIiBmaWxsPSJ3aGl0ZSIvPgogIDx0ZXh0IHg9IjQ0NSIgeT0iMzA1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiPjU8L3RleHQ+CiAgCiAgPGNpcmNsZSBjeD0iMjUwIiBjeT0iMTUwIiByPSIxNSIgc3Ryb2tlPSJibGFjayIgZmlsbD0id2hpdGUiLz4KICA8dGV4dCB4PSIyNDUiIHk9IjE1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2Ij5FPC90ZXh0PgogIDx0ZXh0IHg9IjI1MCIgeT0iMTgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiPkVuZDwvdGV4dD4KPC9zdmc+`;

const CUBE_SVG = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB4PSI1MCIgeT0iMTUwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHBvbHlsaW5lIHBvaW50cz0iNTAsMTUwIDEwMCwxMDAgMjAwLDEwMCAyMDAsMjAwIDE1MCwyNTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMiIvPgogIDxsaW5lIHgxPSIxNTAiIHkxPSIxNTAiIHgyPSIyMDAiIHkyPSIxMDAiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMiIvPgogIDxsaW5lIHgxPSIxNTAiIHkxPSIyNTAiIHgyPSIxNTAiIHkyPSIxNTAiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMiIvPgogIDxsaW5lIHgxPSIxNTAiIHkxPSIyNTAiIHgyPSI1MCIgeTI9IjI1MCIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtZGFzaGFycmF5PSI1LDUiLz4KICA8bGluZSB4MT0iNTAiIHkxPSIyNTAiIHgyPSI1MCIgeTI9IjE1MCIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPGxpbmUgeDE9IjEwMCIgeTE9IjEwMCIgeDI9IjEwMCIgeTI9IjIwMCIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtZGFzaGFycmF5PSI1LDUiLz4KICA8bGluZSB4MT0iMTAwIiB5MT0iMjAwIiB4Mj0iMjAwIiB5Mj0iMjAwIiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8bGluZSB4MT0iMTAwIiB5MT0iMjAwIiB4Mj0iNTAiIHkyPSIyNTAiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWRhc2hhcnJheT0iNSw1Ii8+Cjwvc3ZnPg==`;

// Internal component for Memory Registration (MoCA version - 5 words)
const MemoryRegistrationQuestion = ({ title, description, words, onComplete }) => {
  const [showWords, setShowWords] = useState(true);
  const [timeLeft, setTimeLeft] = useState(10); // 10 seconds for 5 words

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

  useEffect(() => {
    const initTest = async () => {
      try {
        // 1. Fetch tests to find MoCA
        const testsRes = await api.get('/tests');
        const tests = testsRes.data.items || [];
        const mocaTest = tests.find(t => t.name.toLowerCase().includes('moca') || t.name.toLowerCase().includes('montreal'));
        
        if (mocaTest) {
          // 2. Start an attempt
          const attemptRes = await api.post('/attempts', { testId: mocaTest.id });
          setAttemptId(attemptRes.data.id);
        } else {
          console.warn("MoCA test not found in backend. Running in offline/demo mode.");
        }
      } catch (error) {
        console.error("Failed to initialize test:", error);
      } finally {
        setLoading(false);
      }
    };

    initTest();
  }, []);

  const sections = [
    {
      title: "Visuospatial / Executive (5 points)",
      questions: [
        {
          id: "visuo_trail",
          type: "drawing",
          title: "Trail Making",
          description: "Draw a line from a number to a letter in ascending order (1-A-2-B-3-C-4-D-5-E). End at E.",
          backgroundImage: TRAIL_MAKING_SVG
        },
        {
          id: "visuo_cube",
          type: "drawing",
          title: "Copy Cube",
          description: "Copy the drawing of the cube as accurately as possible.",
          backgroundImage: CUBE_SVG
        },
        {
          id: "visuo_clock",
          type: "drawing",
          title: "Draw Clock",
          description: "Draw a clock. Put in all the numbers and set the time to 10 past 11.",
        }
      ]
    },
    {
      title: "Naming (3 points)",
      questions: [
        {
          id: "naming_animals",
          type: "naming_grouped",
          title: "Naming",
          description: "Identify the animals shown below.",
          items: [
            { label: "Animal 1", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/020_The_lion_king_Snyggve_in_the_Serengeti_National_Park_Photo_by_Giles_Laurent.jpg/1200px-020_The_lion_king_Snyggve_in_the_Serengeti_National_Park_Photo_by_Giles_Laurent.jpg", placeholder: "Enter animal name" },
            { label: "Animal 2", img: "https://d1jyxxz9imt9yb.cloudfront.net/medialib/5483/image/s768x1300/XKP144_reduced.jpg", placeholder: "Enter animal name" },
            { label: "Animal 3", img: "https://cdn.britannica.com/94/152294-050-92FE0C83/Arabian-dromedary-camel.jpg", placeholder: "Enter animal name" }
          ]
        }
      ]
    },
    {
      title: "Memory Registration (No points)",
      questions: [
        {
          id: "memory_reg",
          type: "memory_registration",
          title: "Memory Registration",
          description: "Read the list of words. You will have 10 seconds to memorize them.",
          words: ["Face", "Velvet", "Church", "Daisy", "Red"]
        }
      ]
    },
    {
      title: "Attention (6 points)",
      questions: [
        {
          id: "attention_digits_fwd",
          type: "digit_span",
          title: "Digit Span Forward",
          description: "Read the sequence of numbers displayed one by one. Then enter them in the exact order.",
          sequence: [2, 1, 8, 5, 4],
          subType: "Forward"
        },
        {
          id: "attention_digits_bwd",
          type: "digit_span",
          title: "Digit Span Backward",
          description: "Read the sequence of numbers displayed one by one. Then enter them in BACKWARD order.",
          sequence: [7, 4, 2],
          subType: "Backward"
        },
        {
          id: "attention_vigilance",
          type: "vigilance",
          title: "Vigilance",
          description: "Tap on every letter 'A' in the sequence below.",
          sequence: "FBACMNAAJKLBAFAKDEAAAJAMOFAAB"
        },
        {
          id: "attention_serial7",
          type: "text_grouped",
          title: "Serial 7s",
          description: "Subtract 7 from 100 five times (93, 86, 79, 72, 65).",
          fields: ["100-7", "-7", "-7", "-7", "-7"]
        }
      ]
    },
    {
      title: "Language (3 points)",
      questions: [
        {
          id: "language_repetition_1",
          type: "text",
          title: "Sentence Repetition 1",
          description: "Read the following sentence, then type it exactly as shown: 'I only know that John is the one to help today.'",
          placeholder: "Type the sentence exactly"
        },
        {
          id: "language_repetition_2",
          type: "text",
          title: "Sentence Repetition 2",
          description: "Read the following sentence, then type it exactly as shown: 'The cat always hid under the couch when dogs were in the room.'",
          placeholder: "Type the sentence exactly"
        },
        {
          id: "language_fluency",
          type: "text",
          title: "Verbal Fluency",
          description: "Name as many words as possible starting with 'F' in 1 minute. (Target >= 11)",
          placeholder: "Enter count or list words..."
        }
      ]
    },
    {
      title: "Abstraction (2 points)",
      questions: [
        {
          id: "abstraction_pairs",
          type: "text_grouped",
          title: "Abstraction",
          description: "What is the similarity between these pairs?",
          fields: ["Train - Bicycle", "Watch - Ruler"]
        }
      ]
    },
    {
      title: "Delayed Recall (5 points)",
      questions: [
        {
          id: "recall_delayed",
          type: "text_grouped",
          title: "Delayed Recall",
          description: "What were the 5 words from earlier?",
          fields: ["Word 1", "Word 2", "Word 3", "Word 4", "Word 5"]
        }
      ]
    },
    {
      title: "Orientation (6 points)",
      questions: [
        {
          id: "orientation_full",
          type: "text_grouped",
          title: "Orientation",
          description: "Enter the current date and place details.",
          fields: ["Date", "Month", "Year", "Day", "Place", "City"]
        }
      ]
    }
  ];

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
          responses: responses // Send all responses
        });
        alert("MoCA Test submitted successfully!");
      } else {
        console.log("Demo mode submission:", responses);
        alert("MoCA Test submitted successfully (Demo Mode)!");
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
            onComplete={() => {}}
          />
        );
      case 'digit_span':
        return (
          <DigitSpanQuestion
            key={q.id}
            title={q.title}
            description={q.description}
            sequence={q.sequence}
            type={q.subType}
            value={responses[q.id]}
            onChange={(val) => handleResponseChange(q.id, val)}
          />
        );
      case 'vigilance':
        return (
          <VigilanceQuestion
            key={q.id}
            title={q.title}
            description={q.description}
            sequence={q.sequence}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {q.items.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <img src={item.img} alt={item.label} className="w-32 h-32 object-cover rounded-md mb-3 border" />
                  <label className="block text-sm font-medium text-gray-700 mb-1">{item.label}</label>
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
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Montreal Cognitive Assessment (MoCA)</h1>
        <p className="mt-2 text-gray-600">Section {currentSection + 1} of {sections.length}</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
          <div 
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
          ></div>
        </div>
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

export default MOCATest;
