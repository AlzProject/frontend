import React from 'react';
import QuestionWrapper from './QuestionWrapper';

const LikertScaleQuestion = ({ 
  title, 
  description, 
  options, // Array of { label, value }
  selectedValue, 
  onChange 
}) => {
  return (
    <QuestionWrapper title={title} description={description}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {options.map((option) => (
          <div 
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer text-center transition-all
              ${selectedValue === option.value 
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md transform scale-105' 
                : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'}
            `}
          >
            <span className="text-lg font-bold mb-1">{option.value}</span>
            <span className={`text-xs ${selectedValue === option.value ? 'text-indigo-100' : 'text-gray-500'}`}>
              {option.label}
            </span>
          </div>
        ))}
      </div>
    </QuestionWrapper>
  );
};

export default LikertScaleQuestion;
