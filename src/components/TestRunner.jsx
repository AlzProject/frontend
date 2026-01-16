import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextResponseQuestion,
  MultipleChoiceQuestion,
  DrawingCanvasQuestion,
  AudioRecorder
} from './QuestionTypes';
import { uploadMediaAndGetAnswerText } from '../media';
import { checkFeedbackAndRedirect } from '../utils';

const TestRunner = ({ testData, testName, imagesBasePath = '/tests' }) => {
  const [answers, setAnswers] = useState({});
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  const handleAnswerChange = (key, value) => {
    setAnswers(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNext = () => {
    if (currentSectionIndex < testData.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const processedAnswers = {};

      for (const [key, value] of Object.entries(answers)) {
        if (value && typeof value === 'object' && (value.blob || value.dataUrl)) {
          const result = await uploadMediaAndGetAnswerText(value, key);
          processedAnswers[key] = result;
        } else {
          processedAnswers[key] = value;
        }
      }

      await fetch('/api/attempts/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testName,
          answers: processedAnswers,
          language
        })
      });

      await checkFeedbackAndRedirect(navigate);
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('Failed to submit test. Please try again.');
    }
  };

  const renderQuestion = (question, sectionIndex, questionIndex) => {
    const key = `s${sectionIndex}_q${questionIndex}`;
    const val = answers[key] || '';
    
    const text = (language === 'mh' && question.config?.mh?.text) 
      ? question.config.mh.text 
      : question.text;
      
    const label = (language === 'mh' && question.config?.mh?.label)
      ? question.config.mh.label
      : (question.config?.label || text);

    const commonProps = {
      key: key,
      title: text,
      description: question.config?.description || "", 
      value: val,
      onChange: (v) => handleAnswerChange(key, v),
    };

    const renderImages = () => {
      if (question.config?.imageFiles && question.config.imageFiles.length > 0) {
        return (
          <div className="flex flex-wrap gap-4 mb-4">
            {question.config.imageFiles.map((imgFile, idx) => (
              <img 
                key={idx}
                src={`${imagesBasePath}/${imgFile}`}
                alt={`Question Image ${idx + 1}`}
                className="max-h-64 object-contain border-2 border-gray-200 rounded-lg p-2 bg-white shadow-sm hover:shadow-md transition-shadow"
                onError={(e) => {
                  console.error(`Failed to load image: ${imagesBasePath}/${imgFile}`);
                  e.target.style.display = 'none';
                  const errorMsg = document.createElement('div');
                  errorMsg.className = 'p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm';
                  errorMsg.innerHTML = `⚠️ Image not found: ${imgFile}`;
                  e.target.parentNode.appendChild(errorMsg);
                }}
              />
            ))}
          </div>
        );
      }
      return null;
    };

    switch (question.type) {
      case 'text': {
        const options = Array.isArray(question.config?.correctAnswer) 
            ? question.config.correctAnswer 
            : [];
        
        return (
          <div key={key} className="space-y-4">
            {renderImages()}
            <TextResponseQuestion 
              {...commonProps} 
              placeholder={question.config?.placeholder} 
              options={options}
            />
          </div>
        );
      }
        
      case 'audio':
        return (
          <div key={key} className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{text}</h3>
            {renderImages()}
            <AudioRecorder 
              questionId={key} 
              value={val} 
              onChange={(v) => handleAnswerChange(key, v)} 
              label={label}
              maxDuration={question.config?.maxDuration}
            />
          </div>
        );

      case 'drawing':
         return (
           <div key={key} className="mb-6">
             <h3 className="text-lg font-medium text-gray-900 mb-2">{text}</h3>
             <DrawingCanvasQuestion
                {...commonProps}
                referenceImage={question.config?.referenceImageFile ? `${imagesBasePath}/${question.config.referenceImageFile}` : null}
                onSave={async (blob) => {
                  if (blob) {
                    try {
                      const result = await uploadMediaAndGetAnswerText({
                        questionId: key,
                        fileOrBlob: blob,
                        type: 'image',
                        label: `Drawing for ${key}`
                      });
                      handleAnswerChange(key, result);
                    } catch (error) {
                      console.error("Drawing upload failed", error);
                      alert("Failed to save drawing.");
                    }
                  }
                }}
             />
           </div>
         );
         
      case 'scmcq':
      case 'mcmcq':
        return (
             <div key={key}>
               {renderImages()}
               <MultipleChoiceQuestion
                  {...commonProps}
                  options={question.config?.options || []}
                  multiSelect={question.type === 'mcmcq'}
               />
             </div>
        );

      case 'numerical':
        return (
          <div key={key} className="space-y-4">
            {renderImages()}
            <TextResponseQuestion 
              {...commonProps} 
              placeholder="Enter number"
            />
          </div>
        );

      default:
        return (
          <div key={key} className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">
             Unsupported question type: {question.type}
          </div>
        );
    }
  };

  const currentSection = testData.sections[currentSectionIndex];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="bg-white shadow rounded-lg p-6 flex justify-between items-center sticky top-0 z-10 opacity-95">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {testData.title}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Section {currentSectionIndex + 1} of {testData.sections.length}
            </p>
          </div>
          <button 
             onClick={() => setLanguage(l => l === 'en' ? 'mh' : 'en')}
             className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white"
          >
             {language === 'en' ? "Switch to Marathi" : "इंग्रजी मध्ये बदला"}
          </button>
        </div>

        {currentSection && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">
                {language === 'en' ? currentSection.title : (currentSection.title_mh || currentSection.title)}
              </h2>
            </div>
            <div className="p-6 space-y-8">
              {currentSection.questions.map((q, qIdx) => renderQuestion(q, currentSectionIndex, qIdx))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pb-10">
           <button
             onClick={handlePrevious}
             disabled={currentSectionIndex === 0}
             className={`px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 ${currentSectionIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
           >
             Previous
           </button>
           
           {currentSectionIndex < testData.sections.length - 1 ? (
             <button
               onClick={handleNext}
               className="px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
             >
               Next Section
             </button>
           ) : (
             <button
               onClick={handleSubmit}
               className="px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700"
             >
               Submit Assessment
             </button>
           )}
        </div>
        
      </div>
    </div>
  );
};

export default TestRunner;
