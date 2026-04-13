import React from 'react';

const QuestionWrapper = ({ title, description, children, className = '', mediaUrls = [] }) => {
  const validMediaUrls = (mediaUrls || []).filter(url => url && typeof url === 'string' && url.trim().length > 0);

  return (
    <div className={`bg-white shadow-md rounded-lg p-6 mb-6 ${className}`}>
      {title && <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>}
      {description && <p className="text-gray-600 mb-4">{description}</p>}

      {validMediaUrls && validMediaUrls.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-6">
          {validMediaUrls.map((url, idx) => (
            <img 
              key={idx}
              src={url}
              alt={`Media ${idx + 1}`}
              className="max-h-64 object-contain border border-gray-200 rounded p-1 bg-gray-50 shadow-sm"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ))}
        </div>
      )}
      
      <div className="mt-4">
        {children}
      </div>
    </div>
  );
};

export default QuestionWrapper;
