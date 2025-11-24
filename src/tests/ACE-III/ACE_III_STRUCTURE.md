# ACE-III (Addenbrooke’s Cognitive Examination-III) Implementation Plan

## Overview
The ACE-III is a comprehensive cognitive screening tool that assesses five domains: Attention, Memory, Fluency, Language, and Visuospatial abilities.

**Total Score:** 100 points
**Domains:**
- **Attention:** 18 points
- **Memory:** 26 points
- **Fluency:** 14 points
- **Language:** 26 points
- **Visuospatial:** 16 points

## Data Structure (JSON Model)

```json
{
  "testId": "ace_iii_v1",
  "userId": "user_123",
  "timestamp": "2023-10-27T10:00:00Z",
  "sections": {
    "attention": {
      "orientationTime": { "score": 0, "max": 5, "response": "..." },
      "orientationPlace": { "score": 0, "max": 5, "response": "..." },
      "registration": { "score": 0, "max": 3, "response": ["Lemon", "Key", "Ball"] },
      "serialSubtraction": { "score": 0, "max": 5, "response": [93, 86, 79, 72, 65] }
    },
    "memory": {
      "recallRegistration": { "score": 0, "max": 3, "response": "..." },
      "anterogradeNameAddress": { "score": 0, "max": 7, "response": "..." },
      "retrograde": { "score": 0, "max": 4, "response": "..." },
      "delayedRecall": { "score": 0, "max": 7, "response": "..." },
      "recognition": { "score": 0, "max": 5, "response": "..." }
    },
    "fluency": {
      "letterP": { "score": 0, "max": 7, "response": "..." },
      "animals": { "score": 0, "max": 7, "response": "..." }
    },
    "language": {
      "comprehension": { "score": 0, "max": 3, "response": "..." },
      "writing": { "score": 0, "max": 2, "response": "..." },
      "repetition": { "score": 0, "max": 4, "response": "..." },
      "naming": { "score": 0, "max": 12, "response": "..." },
      "reading": { "score": 0, "max": 1, "response": "..." },
      "comprehensionAssoc": { "score": 0, "max": 4, "response": "..." }
    },
    "visuospatial": {
      "infinityDiagram": { "score": 0, "max": 1, "response": "data:image/..." },
      "wireCube": { "score": 0, "max": 2, "response": "data:image/..." },
      "clock": { "score": 0, "max": 5, "response": "data:image/..." },
      "dotCounting": { "score": 0, "max": 4, "response": "..." },
      "identifyingLetters": { "score": 0, "max": 4, "response": "..." }
    }
  },
  "totalScore": 85
}
```

## Section Breakdown

### 1. Attention (18 points)
- **Orientation (10):** Day, Date, Month, Year, Season (5); Building, Floor, Town, County, Country (5).
- **Registration (3):** Repeat 3 words (Lemon, Key, Ball).
- **Concentration (5):** Serial subtraction of 7 from 100 (5 steps).

### 2. Memory (26 points)
- **Recall of 3 Words (3):** Recall the 3 words from Attention (Lemon, Key, Ball).
- **Anterograde Memory (7):** Learn a Name and Address (Harry Barnes, 73 Orchard Close, Kingsbridge, Devon).
- **Retrograde Memory (4):** Name current PM/President, Woman who was PM/President, US President, President assassinated in 60s.
- **Delayed Recall (7):** Recall the Name and Address after other tasks.
- **Recognition (5):** If delayed recall failed, test recognition.

### 3. Fluency (14 points)
- **Letter Fluency (7):** Words starting with 'P' in 1 minute. (>17 = 7, 14-17 = 6, etc.)
- **Category Fluency (7):** Animals in 1 minute. (>21 = 7, 17-21 = 6, etc.)

### 4. Language (26 points)
- **Comprehension (3):** "Point to the..." (requires physical interaction or click).
- **Writing (2):** Write two sentences about a topic.
- **Repetition (4):** Repeat words/phrases.
- **Naming (12):** Name 12 objects (pictures).
- **Reading (1):** Read words.
- **Comprehension Association (4):** Match words to pictures/concepts.

### 5. Visuospatial (16 points)
- **Infinity Diagram (1):** Copy loop.
- **Wire Cube (2):** Copy cube.
- **Clock (5):** Draw clock.
- **Dot Counting (4):** Count dots in squares.
- **Identifying Letters (4):** Identify fragmented letters.

## Implementation Notes
- **Name & Address:** "Harry Barnes, 73 Orchard Close, Kingsbridge, Devon".
- **Images:** Need placeholders for Naming (12 items) and Visuospatial tasks.
