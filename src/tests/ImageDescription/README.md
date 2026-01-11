# Image Description Test

This test presents a randomly selected image from a pool of 5 images and asks the participant to describe it verbally for 1 minute.

## Features

- **Random Image Selection**: One image is randomly selected from 5 available images
- **Voice Recording**: Records participant's voice for up to 60 seconds
- **Audio Playback**: Allows review of the recording before submission
- **Bilingual Support**: English and Marathi (मराठी)
- **Responsive Design**: Works on desktop and mobile devices

## Setup Instructions

### 1. Add Images

Place 5 images in the `Images/` directory with these exact names:
- `image1.jpg`
- `image2.jpg`
- `image3.jpg`
- `image4.jpg`
- `image5.jpg`

**Recommended image types:**
- Complex scenes with multiple objects
- Everyday scenarios (park, kitchen, street scene, etc.)
- Images with people performing activities
- Nature scenes with various elements
- Indoor/outdoor settings with details

**Image requirements:**
- Format: JPG or PNG
- Resolution: At least 800x600 pixels
- Clear and well-lit
- Appropriate content for cognitive assessment

### 2. Backend Setup

Run the creation script:
```bash
ADMIN_TOKEN=your_jwt_token ./createTest.sh
```

Or manually create the test through the admin dashboard with:
- **Title**: Image Description Test
- **Slug**: image-description
- **Type**: file_upload (for audio recordings)
- **Duration**: 120 seconds (2 minutes total, 1 for recording)

### 3. Access the Test

Once created in the backend, the test will be available at:
```
/test/image-description
```

## How It Works

1. User navigates to the test
2. A random image is selected from the pool of 5
3. User views the image and instructions
4. User clicks "Start Recording" to begin
5. Recording automatically stops at 60 seconds (or user can stop earlier)
6. User can preview the recording
7. User submits the test, sending:
   - Audio file (WebM format)
   - Selected image filename
   - Recording duration

## Technical Details

### Frontend Components

- **Main Component**: `ImageDescriptionTest.jsx`
- **Data Config**: `data.json`
- **Images**: Stored in `Images/` directory

### Recording Features

- Uses Web Audio API (`MediaRecorder`)
- Records in WebM format
- Maximum duration: 60 seconds
- Auto-stop at time limit
- Visual timer display
- Microphone permission handling

### State Management

```javascript
- selectedImage: Randomly chosen image
- isRecording: Current recording status
- recordingTime: Elapsed time in seconds
- audioBlob: Recorded audio data
- hasStarted: Whether recording has begun
```

## API Integration

The test submits data to the backend with:
```javascript
FormData {
  audio: Blob (audio/webm),
  image: string (filename),
  duration: number (seconds)
}
```

## Cognitive Assessment Value

This test evaluates:
- **Language fluency**: Ability to describe verbally
- **Attention to detail**: Noticing elements in the image
- **Narrative coherence**: Organizing thoughts clearly
- **Vocabulary**: Range of words used
- **Processing speed**: How quickly they identify elements

## Troubleshooting

### Microphone Access Issues
- Ensure browser has microphone permissions
- Check system microphone settings
- Try in a different browser (Chrome/Edge recommended)

### Images Not Loading
- Verify image files are in `Images/` directory
- Check file names match exactly (case-sensitive)
- Ensure images are valid JPG/PNG files

### Recording Not Working
- Check browser compatibility (modern browsers only)
- Ensure HTTPS connection (required for microphone access)
- Test with different microphone input sources
