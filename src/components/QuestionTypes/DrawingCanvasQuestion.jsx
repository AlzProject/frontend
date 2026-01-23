import React, { useRef, useEffect, useState } from 'react';
import QuestionWrapper from './QuestionWrapper';

const DrawingCanvasQuestion = ({ 
  title, 
  description, 
  onSave, // Callback with Blob
  width = 500,
  height = 400,
  backgroundImage = null,
  referenceImage = null,
  savedImage = null // URL (blob:, http(s):, etc.)
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    setContext(ctx);

    // Load background image (same-origin recommended; external images can taint the canvas)
    if (backgroundImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = backgroundImage;
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      };
    } else {
      ctx.clearRect(0, 0, width, height);
    }
  }, [backgroundImage, width, height]);

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clientX = e.nativeEvent.clientX ?? (e.touches && e.touches[0]?.clientX);
    const clientY = e.nativeEvent.clientY ?? (e.touches && e.touches[0]?.clientY);
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    if (!isDrawing) return;
    context.closePath();
    setIsDrawing(false);
    if (!onSave) return;

    const canvas = canvasRef.current;
    canvas.toBlob(
      (blob) => {
        if (blob) onSave(blob);
      },
      'image/png'
    );
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clientX = e.nativeEvent.clientX ?? (e.touches && e.touches[0]?.clientX);
    const clientY = e.nativeEvent.clientY ?? (e.touches && e.touches[0]?.clientY);
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    context.lineTo(x, y);
    context.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundImage) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = backgroundImage;
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
        };
    }
    if (onSave) onSave(null);
  };

  return (
    <QuestionWrapper title={title} description={description}>
      <div className={`flex ${referenceImage ? 'flex-wrap gap-8 items-start justify-center' : 'flex-col items-center'}`}>
        
        {referenceImage && (
          <div className="flex flex-col items-center p-4 border rounded-lg bg-white shadow-sm max-w-full">
            <img 
              src={referenceImage} 
              alt="Reference" 
              className="max-w-full h-auto object-contain mb-2"
              style={{ maxHeight: height, maxWidth: width }} 
            />
            <p className="text-sm text-gray-500 font-medium">Copy this drawing</p>
          </div>
        )}

        <div className="flex flex-col items-center max-w-full">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="border-2 border-gray-300 rounded-lg cursor-crosshair touch-none bg-white max-w-full h-auto"
            onPointerDown={startDrawing}
            onPointerUp={finishDrawing}
            onPointerMove={draw}
            onPointerLeave={finishDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={finishDrawing}
          />

          {savedImage && (
            <div className="mt-4 w-full">
              <div className="text-sm text-gray-600 mb-2">Previously saved drawing</div>
              <img
                src={savedImage}
                alt="Saved drawing"
                className="max-h-64 rounded border bg-white"
              />
            </div>
          )}

          <div className="mt-4 flex space-x-4">
            <button
              type="button"
              onClick={clearCanvas}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Clear Drawing
            </button>
          </div>
        </div>
      </div>
    </QuestionWrapper>
  );
};

export default DrawingCanvasQuestion;
