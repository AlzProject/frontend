import React, { useState, useRef, useEffect } from 'react';
import { uploadMediaAndGetAnswerText } from '../../media';
import api from '../../api';

const AudioRecorder = ({ questionId, value, onChange, label = "Record Answer", maxDuration = 300 }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaId, setMediaId] = useState(value ? value.replace('media:', '') : null);
  const [uploading, setUploading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  // Load presigned URL for playback when mediaId exists
  useEffect(() => {
    const fetchAudioUrl = async () => {
      if (mediaId && !audioUrl) {
        try {
          const response = await api.get(`/media/${mediaId}/download`);
          if (response.data && response.data.url) {
            setAudioUrl(response.data.url);
          }
        } catch (error) {
          console.error('Failed to fetch audio playback URL:', error);
        }
      }
    };
    
    fetchAudioUrl();
  }, [mediaId, audioUrl]);

  // Update mediaId when value prop changes
  useEffect(() => {
    if (value && value.startsWith('media:')) {
      const id = value.replace('media:', '');
      setMediaId(id);
    }
  }, [value]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await handleUpload(blob);
        stream.getTracks().forEach(track => track.stop());
        
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please grant microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleUpload = async (blob) => {
    setUploading(true);
    try {
      const result = await uploadMediaAndGetAnswerText({
        questionId,
        fileOrBlob: blob,
        type: 'audio',
        label: `Audio Answer for Q${questionId}`
      });
      
      const answerText = result; // Returns `media:ID`
      onChange(answerText);
      const id = answerText.replace('media:', '');
      setMediaId(id);
      
      // Create local blob URL for immediate playback
      const localUrl = URL.createObjectURL(blob);
      setAudioUrl(localUrl);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload audio. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-3 p-4 border-2 border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white shadow-sm">
      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <span className="text-red-500">🎙️</span>
        {label}
      </label>
      
      {/* Recording Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            disabled={uploading}
          >
            <span>🔴</span>
            <span>{mediaId ? 'Re-record' : 'Start Recording'}</span>
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-800 hover:to-gray-900 animate-pulse font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <span>⏹️</span>
            <span>Stop Recording</span>
          </button>
        )}
        
        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-mono font-medium text-red-700">
              {formatTime(recordingTime)} / {formatTime(maxDuration)}
            </span>
          </div>
        )}
        
        {uploading && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-sm text-blue-700 font-medium">Uploading...</span>
          </div>
        )}
      </div>
      
      {/* Playback Controls */}
      {mediaId && audioUrl && !isRecording && !uploading && (
        <div className="mt-2 p-3 bg-green-50 border-2 border-green-200 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
            <span>✓</span>
            <span>Audio recorded successfully</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayback}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium shadow-sm hover:shadow-md flex items-center gap-2 text-sm"
            >
              <span>{isPlaying ? '⏸️' : '▶️'}</span>
              <span>{isPlaying ? 'Pause' : 'Play Recording'}</span>
            </button>
            
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              className="hidden"
            />
            
            {isPlaying && (
              <span className="text-xs text-green-700 flex items-center gap-1">
                <span className="inline-block w-1 h-3 bg-green-600 animate-pulse"></span>
                <span className="inline-block w-1 h-4 bg-green-600 animate-pulse" style={{animationDelay: '0.2s'}}></span>
                <span className="inline-block w-1 h-3 bg-green-600 animate-pulse" style={{animationDelay: '0.4s'}}></span>
              </span>
            )}
          </div>
        </div>
      )}
      
      {maxDuration < 300 && !isRecording && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <span>ℹ️</span>
          <span>Maximum recording time: {formatTime(maxDuration)}</span>
        </p>
      )}
    </div>
  );
};

export default AudioRecorder;
