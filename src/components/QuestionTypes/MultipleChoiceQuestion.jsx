import React from 'react';
import QuestionWrapper from './QuestionWrapper';

const MultipleChoiceQuestion = ({ 
  title, 
  description, 
  options, 
  selectedValues = [], 
  onChange, 
  type = 'single', // 'single' or 'multi'
  layout = 'vertical' // 'vertical' or 'horizontal'
}) => {
  
  const handleChange = (value) => {
    if (type === 'single') {
      onChange([value]);
    } else {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter(v => v !== value)
        : [...selectedValues, value];
      onChange(newValues);
    }
  };

  return (
    <QuestionWrapper title={title} description={description}>
      <div className={`flex ${layout === 'horizontal' ? 'flex-row flex-wrap gap-4' : 'flex-col space-y-3'}`}>
        {options.map((option) => (
          <label 
            key={option.value} 
            className={`
              flex items-center p-3 border rounded-lg cursor-pointer transition-colors
              ${selectedValues.includes(option.value) 
                ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' 
                : 'bg-white border-gray-300 hover:bg-gray-50'}
            `}
          >
            <input
              type={type === 'single' ? 'radio' : 'checkbox'}
              name={title} // Group radios by title/id if possible, but title works for simple cases
              value={option.value}
              checked={selectedValues.includes(option.value)}
              onChange={() => handleChange(option.value)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            <div className="ml-3 flex flex-col">
              {option.img && (
                <img 
                  src={option.img} 
                  alt={option.label} 
                  className="mb-2 h-32 w-32 object-cover rounded-md border border-gray-200"
                />
              )}
              <span className="block text-sm font-medium text-gray-700">
                {option.label}
              </span>
            </div>
          </label>
        ))}
      </div>
    </QuestionWrapper>
  );
};

export default MultipleChoiceQuestion;
