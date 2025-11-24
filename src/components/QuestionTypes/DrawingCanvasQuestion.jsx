import React, { useRef, useEffect, useState } from 'react';
import QuestionWrapper from './QuestionWrapper';

const DrawingCanvasQuestion = ({ 
  title, 
  description, 
  onSave, // Callback with dataURL
  width = 500,
  height = 400,
  backgroundImage = null
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

    if (backgroundImage) {
      const img = new Image();
      img.src = backgroundImage;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
      };
    }
  }, [backgroundImage, width, height]);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    context.closePath();
    setIsDrawing(false);
    if (onSave) {
      onSave(canvasRef.current.toDataURL());
    }
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundImage) {
        const img = new Image();
        img.src = backgroundImage;
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
        };
    }
    if (onSave) onSave(null);
  };

  return (
    <QuestionWrapper title={title} description={description}>
      <div className="flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="border-2 border-gray-300 rounded-lg cursor-crosshair touch-none bg-white"
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
          onMouseLeave={finishDrawing}
          // Add touch support if needed, but mouse events often work for basic touch in some browsers or need mapping
        />
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
    </QuestionWrapper>
  );
};

export default DrawingCanvasQuestion;
