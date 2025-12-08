# Clinical Dementia Rating (CDR) - Patient Self-Assessment

## Overview

The CDR is a patient-facing self-assessment tool designed to evaluate cognitive and functional abilities across six key domains:

1. **Memory** (6 questions)
2. **Orientation** (6 questions)
3. **Judgment & Problem-Solving** (5 questions)
4. **Community Affairs** (5 questions)
5. **Home & Hobbies** (4 questions)
6. **Personal Care** (5 questions)

**Total Questions:** 30

## Important Notes

⚠️ **This is a patient self-report tool, NOT a replacement for clinical CDR scoring.**

- The CDR was originally designed as a clinician-interview tool
- This digital version collects structured patient responses
- A clinician should review all responses before assigning final CDR scores
- Final CDR scoring requires integration of patient data + caregiver input + clinical judgment

## Installation

### 1. Upload Test to Backend

First, make sure you're authenticated as an admin user, then run:

```bash
cd src/tests/CDR
./createTest.sh
```

**Environment Variables** (optional):
```bash
export API_URL="http://localhost:3000/v1"
export ADMIN_EMAIL="admin@example.com"
export ADMIN_PASSWORD="admin123"
```

### 2. Access the Test

Once uploaded, the test will automatically appear on the homepage (fetched from backend).

Direct URLs:
- `/test/cdr`
- `/test/clinical-dementia-rating`

## Features

### Special Question Types

#### 1. Memory Words Display
- Shows three words for 10 seconds
- Patient must remember them
- Recalled later in the test (question 2)

#### 2. Multiple Choice Questions
- Single selection (most questions)
- Multiple selection (for word recall)
- Score-weighted options

#### 3. Text Input
- Short answers (date, year, location)
- Long answers (problem-solving scenarios)

#### 4. Numerical Input
- Basic math questions (e.g., calculating change)

## Technical Architecture

### File Structure

```
src/tests/CDR/
├── data.json           # Test structure and questions
├── createTest.sh       # Script to upload to backend
├── CDRTest.jsx         # React component
└── README.md           # This file
```

### Data Flow

1. **Test Creation**: `createTest.sh` → Backend API → Database
2. **Test Loading**: Frontend → `/tests` API → Fetch CDR test → Load sections/questions
3. **Response Saving**: Each answer → `/responses` API → Saved immediately
4. **Progress Resume**: On reload → Fetch `/attempts` → Load previous responses
5. **Submission**: Final submit → `/attempts/{id}` → Mark as completed

### Backend Schema Mapping

| Frontend Type | Backend Type | Notes |
|--------------|-------------|-------|
| `memory_words_display` | `text` | Config stored in `ans` field |
| `mcq` | `scmcq` | Single/multi-choice via config |
| `text` | `text` | Short answers |
| `text_multiline` | `text` | Long answers |
| `numerical` | `numerical` | Numeric validation |

## Configuration Options

### Question Config Structure

```json
{
  "frontend_type": "mcq",
  "title": "Question Title",
  "options": [
    { "label": "Option 1", "value": "opt1", "score": 0 },
    { "label": "Option 2", "value": "opt2", "score": 1 }
  ],
  "multiselect": false,
  "placeholder": "Enter text...",
  "instruction": "Additional instructions"
}
```

### Test-Specific Info

```json
{
  "scoring_note": "Clinician review required",
  "domains": {
    "memory": { "questions": [1,2,3,4,5], "weight": 2 },
    "orientation": { "questions": [6,7,8,9,10,11], "weight": 1 }
  }
}
```

## Scoring Guide (For Clinicians)

### CDR Scale

| Score | Severity |
|-------|----------|
| 0 | No impairment |
| 0.5 | Questionable/Very mild |
| 1 | Mild dementia |
| 2 | Moderate dementia |
| 3 | Severe dementia |

### Domain Weights

- **Memory**: 2x weight (most important)
- **Orientation**: 1x weight
- **Judgment**: 1x weight
- **Community Affairs**: 1x weight
- **Home & Hobbies**: 1x weight
- **Personal Care**: 1x weight

### Standard CDR Algorithm

1. Memory is primary domain
2. If ≥3 secondary domains score same as memory → that's the Global CDR
3. If memory and majority of other domains differ by 1 point → use memory score
4. Complex cases require clinical judgment

## Customization

### Adding Translations

Update `data.json` with `test_specific_info.translations`:

```json
{
  "test_specific_info": {
    "translations": {
      "hi": {
        "title": "नैदानिक ​​​​मनोभ्रंश रेटिंग",
        "sections": [
          {
            "title": "स्मृति",
            "questions": [...]
          }
        ]
      }
    }
  }
}
```

### Adding New Questions

1. Update `data.json`
2. Re-run `createTest.sh` OR manually add via Admin Dashboard
3. Ensure `orderIndex` is correct

### Modifying UI

Edit `CDRTest.jsx`:
- Custom styling in `className` attributes
- Add/modify question renderers in `renderQuestion()`
- Customize navigation in button sections

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/tests` | GET | Fetch all tests |
| `/tests/{id}/sections` | GET | Get test sections |
| `/sections/{id}/questions` | GET | Get section questions |
| `/attempts` | POST | Start new attempt |
| `/attempts` | GET | Check for in-progress attempts |
| `/responses` | POST | Save individual responses |
| `/responses?attempt_id={id}` | GET | Load previous responses |
| `/attempts/{id}` | POST | Submit/finalize attempt |

## Troubleshooting

### Test Not Showing on Homepage

1. Check if test was created: Look for success message in `createTest.sh` output
2. Verify test is active: `isActive: true` in database
3. Check browser console for API errors

### Responses Not Saving

1. Check browser console for `/responses` API errors
2. Verify `attemptId` is set (check console logs)
3. Ensure backend validation passes (check `answerText` format)

### "Test not found" Error

1. Run `./createTest.sh` to upload test data
2. Check API_URL environment variable
3. Verify backend is running and accessible

## Future Enhancements

- [ ] Caregiver questionnaire module
- [ ] Clinician scoring dashboard
- [ ] Automatic CDR calculation (with override)
- [ ] Multi-language support
- [ ] PDF report generation
- [ ] Comparison with previous assessments
- [ ] Visual progress indicators per domain

## License

This implementation is for educational and clinical use. The CDR scale is a copyrighted instrument; ensure proper licensing for commercial use.

## References

- Morris, J. C. (1993). The Clinical Dementia Rating (CDR): current version and scoring rules. *Neurology*, 43(11), 2412-2414.
- Hughes, C. P., et al. (1982). A new clinical scale for the staging of dementia. *British Journal of Psychiatry*, 140(6), 566-572.

---

**Created:** December 2024  
**Last Updated:** December 2024  
**Version:** 1.0.0

