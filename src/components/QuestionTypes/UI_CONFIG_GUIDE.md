# UI Configuration Guide for Test Questions

## Overview

The TestRunner component now supports advanced UI configuration options for responsive layouts, better user experience, and customizable presentation. You can control how questions are displayed using the `config.ui` property in your data.json files.

## UI Config Schema

Add a `ui` object to any question's `config` to customize its appearance:

```json
{
  "text": "Your question text",
  "type": "text",
  "maxScore": 1,
  "config": {
    "ui": {
      "columnSpan": 2,
      "size": "large",
      "variant": "detailed",
      "imageSize": "large"
    }
  }
}
```

## Configuration Options

### `columnSpan` (number)
Controls how many grid columns the question should span on larger screens.

- **`1`** (default): Single column - question takes 1/3 width on desktop
- **`2`**: Double column - question takes 2/3 width on desktop  
- **`3`**: Full width - question spans all 3 columns on desktop

**Use cases:**
- `1`: Short answers, MCQs, simple questions
- `2`: Text inputs requiring more space, questions with multiple images
- `3`: Drawing canvases, audio recorders, complex multi-part questions

**Example:**
```json
{
  "text": "Draw the shape shown below",
  "type": "drawing",
  "config": {
    "ui": {
      "columnSpan": 3
    }
  }
}
```

### `size` (string)
Controls the text size for the question.

- **`small`**: Compact text (text-sm) - for less important questions
- **`medium`** (default): Normal text (text-base) - standard questions
- **`large`**: Larger text (text-lg) - for emphasis or important questions

**Example:**
```json
{
  "text": "CRITICAL: Read all instructions carefully",
  "type": "text",
  "config": {
    "ui": {
      "size": "large"
    }
  }
}
```

### `variant` (string)
Controls the padding and spacing of the question container.

- **`compact`**: Minimal padding (p-3) - tight spacing
- **`default`** (default): Normal padding (p-4) - balanced spacing
- **`detailed`**: Extra padding (p-6) - spacious layout

**Use cases:**
- `compact`: Quick fire questions, simple inputs
- `default`: Most questions
- `detailed`: Complex questions requiring more focus, instructions

**Example:**
```json
{
  "text": "Please read the following story carefully and answer the questions below...",
  "type": "text",
  "config": {
    "description": "Take your time to understand the context",
    "ui": {
      "variant": "detailed"
    }
  }
}
```

### `imageSize` (string)
Controls the maximum height of question images.

- **`small`**: max-h-32 (128px) - thumbnail size
- **`medium`** (default): max-h-64 (256px) - standard size
- **`large`**: max-h-96 (384px) - large display

**Example:**
```json
{
  "text": "Identify the object in the image",
  "type": "scmcq",
  "config": {
    "imageFiles": ["spoon.jpg"],
    "ui": {
      "imageSize": "large",
      "columnSpan": 2
    }
  }
}
```

## Complete Examples

### Example 1: Full-width drawing question
```json
{
  "text": "Copy the interlocking pentagons shown below",
  "type": "drawing",
  "maxScore": 1,
  "config": {
    "referenceImageFile": "infinity.jpg",
    "description": "Draw the shape as accurately as possible",
    "ui": {
      "columnSpan": 3,
      "variant": "detailed",
      "imageSize": "large"
    }
  }
}
```

### Example 2: Audio question with timer
```json
{
  "text": "Describe what you see in the image for 30 seconds",
  "type": "audio",
  "maxScore": 5,
  "config": {
    "maxDuration": 30,
    "imageFiles": ["scene.jpg"],
    "description": "Speak clearly and describe as many details as possible",
    "ui": {
      "columnSpan": 2,
      "variant": "detailed",
      "imageSize": "large"
    }
  }
}
```

### Example 3: Image-based MCQ
```json
{
  "text": "Which object is shown in the image?",
  "type": "scmcq",
  "maxScore": 1,
  "config": {
    "imageFiles": ["object1.jpg", "object2.jpg", "object3.jpg"],
    "options": ["Spoon", "Fork", "Knife", "Pencil"],
    "ui": {
      "columnSpan": 2,
      "imageSize": "medium"
    }
  }
}
```

### Example 4: Compact quick questions
```json
{
  "text": "What year is it?",
  "type": "text",
  "maxScore": 1,
  "config": {
    "placeholder": "YYYY",
    "ui": {
      "size": "small",
      "variant": "compact"
    }
  }
}
```

## Audio Recording Features

### Recording Timer
All audio questions now show:
- Live recording timer (MM:SS format)
- Maximum duration countdown
- Auto-stop when max duration reached

### Playback Controls
After recording, users can:
- **Play** their recording to review before submitting
- **Pause** playback at any time
- **Re-record** if not satisfied
- Visual playback indicator (animated sound waves)

### Configuration
```json
{
  "text": "Name as many animals as you can in 60 seconds",
  "type": "audio",
  "maxScore": 7,
  "config": {
    "maxDuration": 60,
    "description": "You will have 60 seconds to name animals",
    "ui": {
      "columnSpan": 2
    }
  }
}
```

## Image Display Features

### Presigned URLs
Images are now loaded using presigned URLs from the backend API:
- Automatic URL fetching from `/media/{mediaId}/download`
- Fallback to placeholder on load errors
- Hover effects for better interactivity

### Multiple Images
Questions can display multiple images in a flex layout:
```json
{
  "config": {
    "imageFiles": ["image1.jpg", "image2.jpg", "image3.jpg"],
    "ui": {
      "imageSize": "medium"
    }
  }
}
```

### Reference Images (Drawing)
Drawing questions can show a reference image:
```json
{
  "type": "drawing",
  "config": {
    "referenceImageFile": "template.jpg"
  }
}
```

## Responsive Behavior

The UI automatically adapts to screen sizes:

- **Mobile (< 768px)**: All questions stack in single column, full width
- **Tablet (768px - 1024px)**: 2-column grid, columnSpan applies
- **Desktop (> 1024px)**: 3-column grid, full columnSpan control

## Best Practices

1. **Use full-width for interactive elements**: Drawing canvases, audio recorders
2. **Group related questions**: Use columnSpan: 1 for quick sequential questions
3. **Emphasize important questions**: Combine size: "large" with variant: "detailed"
4. **Optimize image sizes**: Use imageSize based on detail needed - don't default to "large"
5. **Audio duration limits**: Set appropriate maxDuration based on task complexity
6. **Descriptions for complex tasks**: Always add descriptions for audio/drawing questions

## Migration from Old Format

If you have existing questions without UI config, they will use defaults:
- columnSpan: 1
- size: "medium"
- variant: "default"
- imageSize: "medium"

Simply add the `ui` object to customize!

## Common Patterns

### Pattern 1: Image Identification Grid
```json
{
  "questions": [
    {
      "text": "Name this object",
      "type": "text",
      "config": {
        "imageFiles": ["obj1.jpg"],
        "ui": {"columnSpan": 1, "imageSize": "small"}
      }
    },
    {
      "text": "Name this object",
      "type": "text",
      "config": {
        "imageFiles": ["obj2.jpg"],
        "ui": {"columnSpan": 1, "imageSize": "small"}
      }
    },
    {
      "text": "Name this object",
      "type": "text",
      "config": {
        "imageFiles": ["obj3.jpg"],
        "ui": {"columnSpan": 1, "imageSize": "small"}
      }
    }
  ]
}
```

### Pattern 2: Story with Questions
```json
{
  "questions": [
    {
      "text": "Read the following story carefully:\n\n[Story text here...]",
      "type": "text",
      "config": {
        "ui": {"columnSpan": 3, "variant": "detailed", "size": "large"}
      }
    },
    {
      "text": "What was the character's name?",
      "type": "text",
      "config": {"ui": {"columnSpan": 1}}
    },
    {
      "text": "Where did the story take place?",
      "type": "text",
      "config": {"ui": {"columnSpan": 1}}
    }
  ]
}
```

### Pattern 3: Audio Fluency Test
```json
{
  "text": "Say as many words starting with 'P' as you can",
  "type": "audio",
  "maxScore": 5,
  "config": {
    "maxDuration": 60,
    "description": "Press Record when ready. You have 60 seconds. After recording, you can play it back to review.",
    "ui": {
      "columnSpan": 3,
      "variant": "detailed"
    }
  }
}
```

---

For more information, see the TestRunner component source code and example tests.
