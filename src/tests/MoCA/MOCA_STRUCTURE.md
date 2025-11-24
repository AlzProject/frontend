# Montreal Cognitive Assessment (MoCA) Implementation Plan

## Overview
The MoCA is a rapid screening instrument for mild cognitive dysfunction. It assesses different cognitive domains: attention and concentration, executive functions, memory, language, visuoconstructional skills, conceptual thinking, calculations, and orientation.

**Total Score:** 30 points
**Cutoff:** 26 or above is considered normal.
**Education Adjustment:** +1 point if formal education is ≤ 12 years (if total < 30).

## Data Structure (JSON Model)

```json
{
  "testId": "moca_v1",
  "userId": "user_123",
  "timestamp": "2023-10-27T10:00:00Z",
  "educationYears": 14,
  "sections": {
    "visuospatial": {
      "trailMaking": { "score": 0, "max": 1, "response": "..." },
      "copyCube": { "score": 0, "max": 1, "response": "data:image/..." },
      "drawClock": { "score": 0, "max": 3, "response": "data:image/..." }
    },
    "naming": {
      "lion": { "score": 0, "max": 1, "response": "lion" },
      "rhino": { "score": 0, "max": 1, "response": "rhino" },
      "camel": { "score": 0, "max": 1, "response": "camel" }
    },
    "attention": {
      "digitSpanForward": { "score": 0, "max": 1, "response": "2 1 8 5 4" },
      "digitSpanBackward": { "score": 0, "max": 1, "response": "7 4 2" },
      "vigilance": { "score": 0, "max": 1, "response": "..." },
      "serial7s": { "score": 0, "max": 3, "response": "..." }
    },
    "language": {
      "repetition1": { "score": 0, "max": 1, "response": "..." },
      "repetition2": { "score": 0, "max": 1, "response": "..." },
      "fluency": { "score": 0, "max": 1, "response": "..." }
    },
    "abstraction": {
      "trainBicycle": { "score": 0, "max": 1, "response": "..." },
      "watchRuler": { "score": 0, "max": 1, "response": "..." }
    },
    "delayedRecall": {
      "words": { "score": 0, "max": 5, "response": ["face", "velvet", "church", "daisy", "red"] }
    },
    "orientation": {
      "date": { "score": 0, "max": 1, "response": "..." },
      "month": { "score": 0, "max": 1, "response": "..." },
      "year": { "score": 0, "max": 1, "response": "..." },
      "day": { "score": 0, "max": 1, "response": "..." },
      "place": { "score": 0, "max": 1, "response": "..." },
      "city": { "score": 0, "max": 1, "response": "..." }
    }
  },
  "totalScore": 28
}
```

## Section Breakdown

### 1. Visuospatial / Executive (5 points)
- **Trail Making:** Connect numbers and letters in alternating order (1-A-2-B-3-C-4-D-5-E).
- **Copy Cube:** Copy a drawing of a cube.
- **Draw Clock:** Draw a clock, put in all numbers, set time to 10 past 11. (Contour, Numbers, Hands).

### 2. Naming (3 points)
- Identify three animals shown in images (Lion, Rhinoceros, Camel).

### 3. Attention (6 points)
- **Digit Span Forward:** Read list of 5 digits (2, 1, 8, 5, 4). Subject repeats.
- **Digit Span Backward:** Read list of 3 digits (7, 4, 2). Subject repeats backwards.
- **Vigilance:** Read list of letters. Subject taps hand at every letter A.
- **Serial 7s:** Subtract 7 from 100 five times (93, 86, 79, 72, 65).
  - 4-5 correct: 3 pts
  - 2-3 correct: 2 pts
  - 1 correct: 1 pt
  - 0 correct: 0 pts

### 4. Language (3 points)
- **Sentence Repetition:**
  1. "I only know that John is the one to help today."
  2. "The cat always hid under the couch when dogs were in the room."
- **Verbal Fluency:** Name as many words as possible starting with letter F in 1 minute (>= 11 words).

### 5. Abstraction (2 points)
- Explain similarity between pairs:
  - Train - Bicycle (Transport)
  - Watch - Ruler (Measuring instruments)

### 6. Delayed Recall (5 points)
- **Memory Registration (No points):** Read 5 words (Face, Velvet, Church, Daisy, Red). Subject repeats. Do 2 trials.
- **Delayed Recall (5 points):** Ask for the 5 words after the other sections (approx 5 mins later).

### 7. Orientation (6 points)
- Date, Month, Year, Day, Place, City.

## Implementation Details
- **Timer:** Needed for Verbal Fluency (60s).
- **Canvas:** Needed for Trail Making, Copy Cube, Clock Drawing.
- **Audio/Text:** For digit span and letter lists.
