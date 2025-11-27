import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const CreateTest = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('manual'); // 'manual' or 'json'
  const [jsonInput, setJsonInput] = useState('');
  const [importLogs, setImportLogs] = useState([]);
  const [importing, setImporting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    isActive: true,
    allowNegativeMarking: false,
    allowPartialMarking: false,
    shuffleQuestions: false,
    shuffleOptions: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        duration: formData.duration ? parseInt(formData.duration) : null
      };
      await api.post('/tests', payload);
      navigate('/admin/dashboard/tests');
    } catch (error) {
      console.error('Failed to create test', error);
      alert('Failed to create test');
    }
  };

  const handleJsonImport = async (e) => {
    e.preventDefault();
    setImporting(true);
    setImportLogs([]);

    try {
      let data;
      try {
        data = JSON.parse(jsonInput);
      } catch (err) {
        console.error(err);
        throw new Error('Invalid JSON format');
      }

      const testsToCreate = Array.isArray(data) ? data : [data];
      const logs = [];

      for (const testData of testsToCreate) {
        logs.push(`Creating test: ${testData.title}...`);
        setImportLogs([...logs]);

        // 1. Create Test
        const testPayload = {
          title: testData.title,
          description: testData.description,
          isActive: true,
          test_specific_info: { language: testData.language }
        };

        const testRes = await api.post('/tests', testPayload);
        const testId = testRes.data.id;
        logs.push(`✅ Test created (ID: ${testId})`);
        setImportLogs([...logs]);

        // 2. Create Sections
        if (testData.sections && Array.isArray(testData.sections)) {
          for (const sectionData of testData.sections) {
            logs.push(`  Creating section: ${sectionData.title}...`);
            setImportLogs([...logs]);

            const sectionPayload = {
              title: sectionData.title,
              orderIndex: sectionData.orderIndex,
              description: sectionData.description || ''
            };

            const sectionRes = await api.post(`/tests/${testId}/sections`, sectionPayload);
            const sectionId = sectionRes.data.id;

            // 3. Create Questions
            if (sectionData.questions && Array.isArray(sectionData.questions)) {
              for (const qData of sectionData.questions) {
                const qPayload = {
                  text: qData.text,
                  type: qData.type,
                  maxScore: qData.maxScore,
                  test_specific_info: qData.config // Mapping config to test_specific_info as per script
                };

                await api.post(`/sections/${sectionId}/questions`, qPayload);
              }
              logs.push(`    ✅ Added ${sectionData.questions.length} questions`);
              setImportLogs([...logs]);
            }
          }
        }
      }

      logs.push('🎉 Import completed successfully!');
      setImportLogs([...logs]);
      setTimeout(() => navigate('/admin/dashboard/tests'), 2000);

    } catch (error) {
      console.error('Import failed', error);
      setImportLogs(prev => [...prev, `❌ Error: ${error.message}`]);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setMode('manual')}
            className={`${
              mode === 'manual'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
          >
            Manual Creation
          </button>
          <button
            onClick={() => setMode('json')}
            className={`${
              mode === 'json'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
          >
            Import from JSON
          </button>
        </nav>
      </div>

      {mode === 'manual' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (seconds)</label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex items-center h-5">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={handleChange}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Active</label>
            </div>
            
            <div className="flex items-center h-5">
              <input
                id="allowNegativeMarking"
                name="allowNegativeMarking"
                type="checkbox"
                checked={formData.allowNegativeMarking}
                onChange={handleChange}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <label htmlFor="allowNegativeMarking" className="ml-2 block text-sm text-gray-900">Negative Marking</label>
            </div>

            <div className="flex items-center h-5">
              <input
                id="shuffleQuestions"
                name="shuffleQuestions"
                type="checkbox"
                checked={formData.shuffleQuestions}
                onChange={handleChange}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <label htmlFor="shuffleQuestions" className="ml-2 block text-sm text-gray-900">Shuffle Questions</label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard/tests')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Test
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleJsonImport} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Paste JSON Configuration
              <span className="text-gray-500 text-xs ml-2">(Array of tests or single test object)</span>
            </label>
            <textarea
              rows={15}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 font-mono text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder='[
  {
    "title": "My Test",
    "description": "...",
    "sections": [
      {
        "title": "Section 1",
        "orderIndex": 1,
        "questions": [...]
      }
    ]
  }
]'
              required
            />
          </div>

          {importLogs.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 max-h-60 overflow-y-auto">
              {importLogs.map((log, i) => (
                <div key={i} className="text-xs font-mono text-gray-600">{log}</div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard/tests')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={importing}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                importing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {importing ? 'Importing...' : 'Import JSON'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreateTest;
