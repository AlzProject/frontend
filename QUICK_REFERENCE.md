# Quick Reference: Enhanced Test UI

## 🎙️ Audio Recording Features

### User-Facing
- **Record Button**: Red button to start recording
- **Live Timer**: Shows MM:SS elapsed / max duration
- **Stop Button**: Gray pulsing button to stop
- **Playback**: Green "Play Recording" button after recording
- **Re-record**: Option to record again if not satisfied
- **Visual Indicators**:
  - 🔴 Red = Recording in progress
  - 🔵 Blue = Uploading to server
  - ✅ Green = Successfully saved

### Configuration
```json
{
  "text": "Question text here",
  "type": "audio",
  "maxScore": 5,
  "config": {
    "maxDuration": 60,
    "description": "Optional instructions"
  }
}
```

## 🖼️ Image Display

### Current Implementation
- Static paths from `imagesBasePath` prop
- Responsive sizing with `max-h-64`
- Border and shadow styling

### In data.json
```json
{
  "config": {
    "imageFiles": ["image1.jpg", "image2.jpg"],
    "referenceImageFile": "template.jpg"
  }
}
```

## 📱 Responsive Layout

### Mobile (<768px)
- Single column
- Full-width questions
- Stacked images

### Tablet (768px-1024px)
- 2-column grid possible
- Optimized spacing

### Desktop (>1024px)
- 3-column grid ready
- Maximum screen utilization

## 🎨 UI Customization (Future)

### Column Spans
```json
{
  "config": {
    "ui": {
      "columnSpan": 3  // 1, 2, or 3
    }
  }
}
```

### Sizing
```json
{
  "config": {
    "ui": {
      "size": "large",  // small, medium, large
      "variant": "detailed",  // compact, default, detailed
      "imageSize": "large"  // small, medium, large
    }
  }
}
```

## 🔧 For Developers

### Test Wrapper Pattern
```jsx
import TestRunner from '../../components/TestRunner';
import testData from './data.json';

function MyTest() {
  return (
    <TestRunner 
      testData={testData}
      testName="MyTest"
      imagesBasePath="/tests/MyTest/Images"
    />
  );
}
```

### Question Types
- `text`: Text input
- `audio`: Audio recording
- `drawing`: Canvas drawing
- `scmcq`: Single-choice MCQ
- `mcmcq`: Multi-choice MCQ
- `numerical`: Number input

### State Management
- Answers stored as `{s<sectionIdx>_q<questionIdx>: value}`
- Language toggle: 'en' ↔ 'mh'
- Section navigation with progress tracking

## 📚 Documentation

- **Full UI Guide**: `/src/components/QuestionTypes/UI_CONFIG_GUIDE.md`
- **Component README**: `/src/components/QuestionTypes/README.md`
- **Summary**: `/UI_ENHANCEMENT_SUMMARY.md`

## ⚡ Quick Test

1. Run dev server: `npm run dev`
2. Navigate to any test (ACE-III, MMSE, MoCA, CDR)
3. Try audio recording:
   - Click "Start Recording"
   - Speak for a few seconds
   - Click "Stop Recording"
   - Click "Play Recording" to hear it back
   - Navigate through sections

## 🐛 Troubleshooting

### Audio not recording
- Check browser permissions for microphone
- Ensure HTTPS (required for mediaDevices API)

### Images not loading
- Verify image paths in data.json
- Check imagesBasePath prop
- Ensure images exist in public folder

### Layout issues
- Check responsive breakpoints
- Verify Tailwind classes
- Inspect browser console

---

✨ **Key Achievement**: Professional, user-friendly audio recording with playback functionality!
