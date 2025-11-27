import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';

const TestDetails = () => {
  const { testId } = useParams();
  const [test, setTest] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [expandedSection, setExpandedSection] = useState(null);
  const [questions, setQuestions] = useState({}); // Map sectionId -> questions array

  useEffect(() => {
    fetchTestDetails();
  }, [testId]);

  const fetchTestDetails = async () => {
    try {
      const [testRes, sectionsRes] = await Promise.all([
        api.get(`/tests/${testId}`),
        api.get(`/tests/${testId}/sections`)
      ]);
      setTest(testRes.data);
      setSections(sectionsRes.data);
    } catch (error) {
      console.error('Error fetching details', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/tests/${testId}/sections`, {
        title: newSectionTitle,
        orderIndex: sections.length + 1,
        description: ''
      });
      setNewSectionTitle('');
      fetchTestDetails();
    } catch (error) {
      console.error('Error creating section', error);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (window.confirm('Are you sure you want to delete this section? All questions in it will be lost.')) {
      try {
        await api.delete(`/sections/${sectionId}`);
        fetchTestDetails();
      } catch (error) {
        console.error('Error deleting section', error);
      }
    }
  };

  const toggleSection = async (sectionId) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionId);
      if (!questions[sectionId]) {
        try {
          const res = await api.get(`/sections/${sectionId}/questions`);
          setQuestions(prev => ({ ...prev, [sectionId]: res.data }));
        } catch (error) {
          console.error('Error fetching questions', error);
        }
      }
    }
  };

  const handleAddQuestion = async (sectionId) => {
    const text = prompt("Enter question text:");
    if (!text) return;
    
    const type = prompt("Enter type (scmcq, mcmcq, numerical, text, file_upload):", "text");
    if (!type) return;

    try {
      await api.post(`/sections/${sectionId}/questions`, {
        text,
        type,
        maxScore: 1,
        sectionId: parseInt(sectionId)
      });
      // Refresh questions for this section
      const res = await api.get(`/sections/${sectionId}/questions`);
      setQuestions(prev => ({ ...prev, [sectionId]: res.data }));
    } catch (error) {
      console.error('Error adding question', error);
      alert('Failed to add question');
    }
  };

  const handleDeleteQuestion = async (sectionId, questionId) => {
    if (window.confirm('Delete this question?')) {
      try {
        await api.delete(`/questions/${questionId}`);
        const res = await api.get(`/sections/${sectionId}/questions`);
        setQuestions(prev => ({ ...prev, [sectionId]: res.data }));
      } catch (error) {
        console.error('Error deleting question', error);
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!test) return <div>Test not found</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900">{test.title}</h2>
        <p className="mt-1 text-gray-500">{test.description}</p>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>Duration: {test.duration || 'Unlimited'}s</div>
          <div>Active: {test.isActive ? 'Yes' : 'No'}</div>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sections</h3>
        
        <form onSubmit={handleCreateSection} className="mb-6 flex gap-4">
          <input
            type="text"
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            placeholder="New Section Title"
            className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Add Section
          </button>
        </form>

        <div className="space-y-4">
          {sections.map(section => (
            <div key={section.id} className="border border-gray-200 rounded-md">
              <div 
                className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection(section.id)}
              >
                <h4 className="text-md font-medium text-gray-900">{section.title}</h4>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }}
                    className="text-xs text-red-600 hover:text-red-900"
                  >
                    Delete Section
                  </button>
                  <span className="text-gray-500 text-sm">
                    {expandedSection === section.id ? '▼' : '▶'}
                  </span>
                </div>
              </div>
              
              {expandedSection === section.id && (
                <div className="p-4 bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="text-sm font-medium text-gray-700">Questions</h5>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAddQuestion(section.id); }}
                      className="text-xs text-indigo-600 hover:text-indigo-900"
                    >
                      + Add Question
                    </button>
                  </div>
                  
                  {questions[section.id] && questions[section.id].length > 0 ? (
                    <ul className="space-y-2">
                      {questions[section.id].map(q => (
                        <li key={q.id} className="flex justify-between items-center text-sm text-gray-600 border-b border-gray-100 pb-2">
                          <div>
                            <span className="font-mono text-xs text-gray-400">[{q.type}]</span> {q.text}
                          </div>
                          <button
                            onClick={() => handleDeleteQuestion(section.id, q.id)}
                            className="text-xs text-red-500 hover:text-red-700 ml-2"
                          >
                            Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No questions yet.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestDetails;
