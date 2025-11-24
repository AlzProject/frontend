import React from 'react';
import QuestionWrapper from './QuestionWrapper';

const TextResponseQuestion = ({ 
  title, 
  description, 
  value, 
  onChange, 
  placeholder = "Type your answer here...", 
  multiline = false,
  rows = 4
}) => {
  return (
    <QuestionWrapper title={title} description={description}>
      {multiline ? (
        <textarea
          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-3 border"
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type="text"
          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-3 border"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </QuestionWrapper>
  );
};

export default TextResponseQuestion;
