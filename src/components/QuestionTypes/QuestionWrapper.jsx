import React from 'react';

const QuestionWrapper = ({ title, description, children, className = '' }) => {
  return (
    <div className={`bg-white shadow-md rounded-lg p-6 mb-6 ${className}`}>
      {title && <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>}
      {description && <p className="text-gray-600 mb-4">{description}</p>}
      <div className="mt-4">
        {children}
      </div>
    </div>
  );
};

export default QuestionWrapper;
