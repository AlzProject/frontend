import fs from 'fs';
let code = fs.readFileSync('../admin/src/pages/AttemptDetails.jsx', 'utf8');

const replacement = `
        if (['scmcq', 'mcmcq'].includes(question.type)) {
             if (response.selectedOptionIds && response.selectedOptionIds.length > 0) {
                 return <div className="font-mono bg-gray-100 p-2 border border-neo-black">Selected Options: {response.selectedOptionIds.join(', ')}</div>;
             }
        }

        // Handle grouped text questions and dropdown grouped where answers are joined by ';'
        if (['text_grouped', 'dropdown_grouped'].includes(question.config?.frontend_type)) {
            const raw = response.answerText || '';
            const parts = raw.split(';');
            const fields = question.config?.fields || [];
            
            return (
                <div className="font-mono bg-gray-100 p-2 border border-neo-black">
                    {fields.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {fields.map((field, i) => (
                                <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                                    <span className="font-bold text-gray-700 min-w-[150px]">{field}:</span>
                                    <span className="break-all">{parts[i] || '(No answer provided)'}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="whitespace-pre-wrap">{raw}</div>
                    )}
                </div>
            );
        }

        // Handle audio_notes where answers are an object/JSON
        if (question.config?.frontend_type === 'audio_notes') {
            try {
                const parsed = JSON.parse(response.answerText || '{}');
                const audioUrl = parsed.audio || '';
                const notes = parsed.notes || '';
                const isMediaRef = audioUrl.toLowerCase().startsWith('media:');
                const mediaId = isMediaRef ? audioUrl.slice('media:'.length).trim() : null;

                return (
                    <div className="font-mono bg-gray-100 p-2 border border-neo-black flex flex-col gap-3">
                        <div>
                            <span className="font-bold text-sm block mb-1">Audio Uploaded: </span>
                            {audioUrl ? (
                                isMediaRef && mediaId ? (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                await openMediaById(mediaId);
                                            } catch (err) {
                                                console.error('Failed to open media', err);
                                                alert('Error opening media');
                                            }
                                        }}
                                        className="text-neo-main hover:underline font-mono"
                                    >
                                        View Audio File
                                    </button>
                                ) : (
                                    <a href={audioUrl} target="_blank" rel="noopener noreferrer" className="text-neo-main hover:underline font-mono">
                                        View Audio File
                                    </a>
                                )
                            ) : (
                                <span className="text-gray-500 italic">No audio provided</span>
                            )}
                        </div>
                        <div>
                            <span className="font-bold text-sm block mb-1">Notes: </span>
                            <span className="whitespace-pre-wrap block">{notes || '(None)'}</span>
                        </div>
                    </div>
                );
            } catch (e) {
                // Fallback if not proper JSON
                return <div className="font-mono bg-gray-100 p-2 border border-neo-black whitespace-pre-wrap">{response.answerText || '(No answer provided)'}</div>;
            }
        }

        return <div className="font-mono bg-gray-100 p-2 border border-neo-black whitespace-pre-wrap">{response.answerText || '(No answer provided)'}</div>;
`;

code = code.replace(
`        if (['scmcq', 'mcmcq'].includes(question.type)) {
             // We need to map selectedOptionIds to actual text if we have options data,
             // but usually report endpoint might just give IDs.
             // For now, let's show the text if available in response or just IDs.
             // The spec says 'answerText' might be populated or 'selectedOptionIds'.
             if (response.selectedOptionIds && response.selectedOptionIds.length > 0) {
                 return <div className="font-mono bg-gray-100 p-2 border border-neo-black">Selected Options: {response.selectedOptionIds.join(', ')}</div>;
             }
        }

        return <div className="font-mono bg-gray-100 p-2 border border-neo-black whitespace-pre-wrap">{response.answerText || '(No answer provided)'}</div>;`,
  replacement
);

fs.writeFileSync('../admin/src/pages/AttemptDetails.jsx', code);
