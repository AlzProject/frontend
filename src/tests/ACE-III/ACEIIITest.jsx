import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextResponseQuestion,
  MultipleChoiceQuestion,
  DrawingCanvasQuestion,
  QuestionWrapper
} from '../../components/QuestionTypes';
import api from '../../api';

// --- Helper Components ---

// Component for Name & Address Learning
const NameAddressLearning = ({ title, description, onComplete }) => {
  const address = "Harry Barnes • 73 Orchard Close • Kingsbridge • Devon";
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
            I will show you a name and address. Read it and try to remember it.
          </p>
          <button
            onClick={startTrial}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Show Address
          </button>
        </div>
      </QuestionWrapper>
    );
  }

  if (phase === 'showing') {
    return (
      <QuestionWrapper title={`${title} - Trial ${trial}/3`} description="Memorize this address.">
        <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <h3 className="text-2xl font-bold text-indigo-600 mb-6 tracking-wider leading-loose">
            {address}
          </h3>
          <p className="text-sm text-gray-500">
            Hiding in <span className="font-bold text-gray-900">{timeLeft}</span> seconds.
          </p>
        </div>
      </QuestionWrapper>
    );
  }

  return (
    <QuestionWrapper title={`${title} - Trial ${trial}/3`} description="Repeat the address aloud (or type it below for self-check).">
      <div className="space-y-4">
        <textarea
          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
          rows={3}
          placeholder="Type what you remember..."
        />
        <div className="flex justify-end">
          <button
            onClick={handleNextTrial}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
          >
            {trial < 3 ? "Next Trial" : "Finish Learning"}
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

  useEffect(() => {
    const initTest = async () => {
      try {
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

  const sections = [
    // --- ATTENTION (18) ---
    {
      title: "Attention - Orientation (10 points)",
      questions: [
        {
          id: "att_orientation_time",
          type: "text_grouped",
          title: "Time Orientation",
          description: "Enter the current time details.",
          fields: ["Day", "Date", "Month", "Year", "Season"]
        },
        {
          id: "att_orientation_place",
          type: "text_grouped",
          title: "Place Orientation",
          description: "Enter the current place details.",
          fields: ["Building", "Floor", "Town", "County", "Country"]
        }
      ]
    },
    {
      title: "Attention - Registration (3 points)",
      questions: [
        {
          id: "att_registration",
          type: "memory_registration", // Reusing logic or simple text
          title: "Registration",
          description: "Repeat and memorize: LEMON, KEY, BALL.",
          words: ["Lemon", "Key", "Ball"]
        }
      ]
    },
    {
      title: "Attention - Concentration (5 points)",
      questions: [
        {
          id: "att_serial7",
          type: "text_grouped",
          title: "Serial 7s",
          description: "Subtract 7 from 100 five times.",
          fields: ["100-7", "-7", "-7", "-7", "-7"]
        }
      ]
    },
    // --- MEMORY (26) ---
    {
      title: "Memory - Recall of 3 Words (3 points)",
      questions: [
        {
          id: "mem_recall_3words",
          type: "text_grouped",
          title: "Recall of 3 Words",
          description: "Recall the 3 words learned in the Attention section (Lemon, Key, Ball).",
          fields: ["Word 1", "Word 2", "Word 3"]
        }
      ]
    },
    {
      title: "Memory - Anterograde (7 points)",
      questions: [
        {
          id: "mem_anterograde",
          type: "name_address_learning",
          title: "Name and Address Learning",
          description: "Learn the name and address: Harry Barnes, 73 Orchard Close, Kingsbridge, Devon."
        }
      ]
    },
    {
      title: "Memory - Retrograde (4 points)",
      questions: [
        {
          id: "mem_retrograde",
          type: "text_grouped",
          title: "Retrograde Memory",
          description: "Answer the following questions.",
          fields: [
            "Name of current Prime Minister/President",
            "Name of a woman who was PM/President",
            "Name of the US President",
            "Name of US President assassinated in the 1960s"
          ]
        }
      ]
    },
    // --- FLUENCY (14) ---
    {
      title: "Fluency (14 points)",
      questions: [
        {
          id: "fluency_letter",
          type: "text",
          title: "Letter Fluency",
          description: "Name as many words as possible starting with 'P' in 1 minute.",
          placeholder: "List words here..."
        },
        {
          id: "fluency_category",
          type: "text",
          title: "Category Fluency",
          description: "Name as many animals as possible in 1 minute.",
          placeholder: "List animals here..."
        }
      ]
    },
    // --- LANGUAGE (26) ---
    {
      title: "Language - Comprehension (3 points)",
      questions: [
        {
          id: "lang_comprehension",
          type: "mcq",
          title: "Comprehension",
          description: "Follow the command: 'Point to the one that is a fruit' (assuming images of Frog, Banana, Car).",
          options: [
            { label: "Frog", value: "frog" },
            { label: "Banana", value: "banana" },
            { label: "Car", value: "car" }
          ]
        }
      ]
    },
    {
      title: "Language - Writing (2 points)",
      questions: [
        {
          id: "lang_writing",
          type: "text_multiline",
          title: "Writing",
          description: "Write two complete sentences about your recent holiday or a hobby.",
          placeholder: "Write here..."
        }
      ]
    },
    {
      title: "Language - Repetition (4 points)",
      questions: [
        {
          id: "lang_repetition",
          type: "text_grouped",
          title: "Repetition",
          description: "Repeat the following exactly.",
          fields: [
            "Hippopotamus",
            "Eccentricity",
            "Unintelligible",
            "Statistician"
          ]
        }
      ]
    },
    {
      title: "Language - Naming (12 points)",
      questions: [
        {
          id: "lang_naming",
          type: "naming_grouped",
          title: "Naming",
          description: "Name the objects shown.",
          items: [
            { label: "Item 1", img: "https://placehold.co/150?text=Watch", placeholder: "Name" },
            { label: "Item 2", img: "https://placehold.co/150?text=Pencil", placeholder: "Name" },
            { label: "Item 3", img: "https://placehold.co/150?text=Penguin", placeholder: "Name" },
            { label: "Item 4", img: "https://placehold.co/150?text=Anchor", placeholder: "Name" },
            // ... usually 12 items, shortening for demo
            { label: "Item 5", img: "https://placehold.co/150?text=Giraffe", placeholder: "Name" },
            { label: "Item 6", img: "https://placehold.co/150?text=Spoon", placeholder: "Name" }
          ]
        }
      ]
    },
    {
      title: "Language - Reading & Association (5 points)",
      questions: [
        {
          id: "lang_reading",
          type: "text",
          title: "Reading (1 point)",
          description: "Read the following words aloud: 'Sew', 'Pint', 'Soot', 'Dough', 'Height'.",
          placeholder: "Note errors if any..."
        },
        {
          id: "lang_assoc",
          type: "mcq",
          title: "Comprehension Association (4 points)",
          description: "Match the word to the picture (simulated).",
          options: [
             { label: "Correct Matches", value: "correct" },
             { label: "Incorrect", value: "incorrect" }
          ]
        }
      ]
    },
    // --- VISUOSPATIAL (16) ---
    {
      title: "Visuospatial (16 points)",
      questions: [
        {
          id: "visuo_infinity",
          type: "drawing",
          title: "Infinity Diagram",
          description: "Copy the infinity loops.",
          backgroundImage: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNIDUwIDUwIEMgMjAgMjAgMjAgODAgNTAgNTAgQyA4MCAyMCAxMjAgMjAgMTUwIDUwIEMgMTgwIDgwIDE4MCAyMCAxNTAgNTAgQyAxMjAgODAgODAgODAgNTAgNTAiIHN0cm9rZT0iYmxhY2siIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMyIvPjwvc3ZnPg=="
        },
        {
          id: "visuo_cube",
          type: "drawing",
          title: "Wire Cube",
          description: "Copy the wire cube.",
          backgroundImage: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSI1MCIgeT0iNTAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyIi8+PHJlY3QgeD0iODAiIHk9IjIwIiB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMiIvPjxsaW5lIHgxPSI1MCIgeTE9IjUwIiB4Mj0iODAiIHkyPSIyMCIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyIi8+PGxpbmUgeDE9IjEzMCIgeTE9IjUwIiB4Mj0iMTYwIiB5Mj0iMjAiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMiIvPjxsaW5lIHgxPSI1MCIgeTE9IjEzMCIgeDI9IjgwIiB5Mj0iMTAwIiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjIiLz48bGluZSB4MT0iMTMwIiB5MT0iMTMwIiB4Mj0iMTYwIiB5Mj0iMTAwIiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4="
        },
        {
          id: "visuo_clock",
          type: "drawing",
          title: "Clock Drawing",
          description: "Draw a clock face with numbers and hands set to ten past five.",
        },
        {
          id: "visuo_dots",
          type: "text_grouped",
          title: "Dot Counting",
          description: "Count the dots in the squares shown (simulated).",
          fields: ["Square 1", "Square 2", "Square 3", "Square 4"]
        },
        {
          id: "visuo_letters",
          type: "text_grouped",
          title: "Identifying Letters",
          description: "Identify the fragmented letters shown (simulated).",
          fields: ["Letter 1", "Letter 2", "Letter 3", "Letter 4"]
        }
      ]
    },
    // --- MEMORY RECALL (Delayed) ---
    {
      title: "Memory - Delayed Recall & Recognition (12 points)",
      questions: [
        {
          id: "mem_delayed",
          type: "text_grouped",
          title: "Delayed Recall (7 points)",
          description: "Recall the Name and Address learned earlier.",
          fields: ["Name", "Street", "Town", "County"]
        },
        {
          id: "mem_recognition",
          type: "mcq",
          title: "Recognition (5 points)",
          description: "If recall was incomplete, identify the correct parts.",
          options: [
            { label: "Jerry Barnes", value: "wrong1" },
            { label: "Harry Barnes", value: "correct" },
            { label: "Harry Bond", value: "wrong2" }
          ]
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

  const renderQuestion = (q) => {
    switch (q.type) {
      case 'name_address_learning':
        return (
          <NameAddressLearning
            key={q.id}
            title={q.title}
            description={q.description}
            onComplete={() => {}}
          />
        );
      case 'memory_registration':
        // Simple display for now, or reuse MemoryRegistrationQuestion from MoCA if exported
        return (
          <QuestionWrapper key={q.id} title={q.title} description={q.description}>
             <div className="p-4 bg-blue-50 text-blue-800 rounded-md text-center font-bold text-xl">
               {q.words.join(" - ")}
             </div>
             <p className="mt-2 text-sm text-gray-500">Ask subject to repeat.</p>
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">ACE-III Assessment</h1>
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

export default ACEIIITest;
