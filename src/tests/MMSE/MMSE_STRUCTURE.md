# 🚀 **Full MMSE Implementation Plan (Digital Version)**

---

# **SECTION 1: ORIENTATION (10 points)**

Total questions: **10** (5 time + 5 place)

---

## **1. Time Orientation (5 questions → 5 points)**

Questions:

1. Year
2. Season
3. Date
4. Day
5. Month

### **Implementation**

* Show 5 separate text boxes OR one grouped input form.
* For usability, MCQ dropdowns can be used.

**Component:** `TextResponseQuestion` OR `MultipleChoiceQuestion`
**Input type:** text or dropdown
**Scoring:**

* 1 point per correct answer.

**Data saved:**

```json
{
  "year": "2025",
  "season": "Winter",
  "date": "24",
  "day": "Monday",
  "month": "November"
}
```

---

## **2. Place Orientation (5 questions → 5 points)**

Questions:

1. State
2. County/District
3. Town/City
4. Hospital/Building
5. Floor/Room Level

### **Implementation**

* 5 separate fields
* Pre-fill user geolocation? (No — avoid bias)

**Component:** `TextResponseQuestion`
**Scoring:**

* Exact match or acceptable synonyms ("First Floor" = "1st Floor")

**Data saved example:**

```json
{
  "state": "Maharashtra",
  "district": "Pune",
  "city": "Pune",
  "building": "Ruby Hall",
  "floor": "Second"
}
```

---

# **SECTION 2: REGISTRATION (3 points)**

Total: **1 question → 3 answers → 3 points**

---

## **3. Immediate Registration of 3 Words (3 points)**

Words: **Apple**, **Penny**, **Table** (or any 3 chosen words)

### **Implementation**

**Step A:** Display 3 words for **5 seconds**

* Disable copying/selection
* After 5 sec → auto-hide

**Step B:** Ask user to repeat them

* Text field for each word
  OR
* Audio recording

**Component:**

* `MemoryDisplayComponent` (shows → hides)
* `TextResponseQuestion` OR `AudioRecordingQuestion`

**Scoring:**

* 1 point for each exactly recalled word (case-insensitive)
* Normalize spacing, spelling variants allowed if close (Levenshtein distance <= 1)

**Data Example:**

```json
{
  "shown_words": ["Apple", "Penny", "Table"],
  "user_response": ["apple", "pany", "table"],
  "score": 2
}
```

---

# **SECTION 3: ATTENTION & CALCULATION (5 points)**

Total: **1 question group → 5 answers → 5 points**

---

## **4. Serial 7s Subtraction OR WORLD Backwards (5 points)**

### Option A: Serial 7s from 100

Expected answers:
93, 86, 79, 72, 65

### **Implementation Options**

#### **Option A (One line input):**

User enters:
`93 86 79 72 65`

#### **Option B (Recommended, 5 fields):**

Input boxes:

* Step 1
* Step 2
* Step 3
* Step 4
* Step 5

### **Component:**

`TextResponseQuestion` (multiple fields)

### **Scoring:**

* 1 point per correct number
* Accept answers in sequence only

---

### Option B: WORLD → DLROW

User types the reversed word.

### **Scoring:**

* 5 letters correct = 5 points
* Strict or partial scoring allowed (industry standard → strict)

---

# **SECTION 4: RECALL (3 points)**

Total: **1 question → 3 answers → 3 points**

---

## **5. Delayed Recall of the 3 Words (3 points)**

Ask:
“What were the three words I asked you to remember earlier?”

### **Implementation**

* 3 input boxes
* Should appear only after 1–2 sections have passed (natural delay)

**Component:** `TextResponseQuestion`
**Scoring:** Same as Registration.

**Data stored:** identical structure.

---

# **SECTION 5: LANGUAGE & PRAXIS (9 points)**

Total: **6 question blocks → 9 points**

---

# **6. Naming Objects (2 questions → 2 points)**

Objects:

* Pencil
* Watch

### **Implementation**

* Show image 1 → “What is this?”
* Show image 2 → “What is this?”

**Component:**
`ImageQuestion` + `TextResponseQuestion`

**Scoring:**

* “Watch”, “Wristwatch” both accepted
* “Pencil” accepted (color pencil vs pencil okay)

---

# **7. Repetition (1 question → 1 point)**

Phrase:
“No ifs, ands, or buts.”

### **Implementation:**

* Show text OR play audio
* Ask user to repeat by **typing** OR recording audio.

**Component:** `TextResponseQuestion` or `AudioRecordingQuestion`

**Scoring:**

* Must be **exact phrase**
* Accept punctuation variations
* Reject if missing any of "ifs", "ands", "buts"

---

# **8. 3-Stage Command (3 questions → 3 points)**

Steps:

1. Take paper in right hand
2. Fold it in half
3. Put it on the floor

### **Digital Implementation Options:**

### Option A – MCQ

“Select the actions in the correct order:”

* Take paper
* Fold it
* Put it down

### Option B – Drag & Drop (Preferred)

3 icons that user must arrange in order.

**Component:**
`DragAndDropSequenceQuestion`

**Scoring:**
3 correct = 3
2 correct = 2
1 correct = 1
0 correct = 0

---

# **9. Reading (1 question → 1 point)**

Text shown:
**CLOSE YOUR EYES**

### **Implementation:**

* Show large text
* Ask user: “Perform the instruction shown.”

### **Digital Alternative:**

MCQ:
“Did you close your eyes?” → Yes/No

OR
Webcam detection (advanced)

**Component:** `InstructionQuestion`

**Scoring:**
Yes = 1
No = 0

---

# **10. Writing (1 question → 1 point)**

Prompt:
“Write a complete sentence.”

### Requirement:

* Must contain subject & verb
* Must be meaningful
* Grammar not strict

### Implementation

* Multiline input box
* Autosave

**Component:** `TextResponseQuestion` (multiline)

**Scoring:**
Manual review OR NLP validation (semantic check)

---

# **11. Copying (1 question → 1 point)**

Task:
Copy intersecting pentagons.

### Implementation

* Show reference image
* Provide drawing canvas
* Optional background faint image

**Component:** `DrawingCanvasQuestion`

**Scoring:**
Binary

* Recognizable, intersecting → 1
* Otherwise → 0

---

# 📊 **MMSE Structure Summary**

| Section         | #Questions    | Points | Component(s)                  |
| --------------- | ------------- | ------ | ----------------------------- |
| Orientation     | 10            | 10     | Text / MCQ                    |
| Registration    | 1 (3 answers) | 3      | Memory display + Text / Audio |
| Attention       | 1 group       | 5      | Text fields                   |
| Recall          | 1 (3 answers) | 3      | Text                          |
| Naming          | 2             | 2      | Image + Text                  |
| Repetition      | 1             | 1      | Text / Audio                  |
| 3-Stage Command | 3 steps       | 3      | MCQ / Drag-Drop               |
| Reading         | 1             | 1      | MCQ / Instruction             |
| Writing         | 1             | 1      | Text (multiline)              |
| Copying         | 1             | 1      | Drawing canvas                |

**Total:** 30 points

---

# 🧠 **SCORING SYSTEM**

* Autoscoring for all text/MCQ except:

  * Writing (manual or NLP)
  * Drawing (manual or AI evaluation option)

---

# 🗂️ **DATABASE MODEL (recommended)**

```json
{
  "userId": "uuid",
  "testType": "MMSE",
  "timestamp": "2025-11-25T18:30:00Z",
  "responses": {
    "orientation": {...},
    "registration": {...},
    "attention": {...},
    "recall": {...},
    "naming": {...},
    "repetition": {...},
    "three_stage": {...},
    "reading": {...},
    "writing": { "sentence": "..." },
    "copying": { "drawingUrl": "..." }
  },
  "score": 23,
  "interpretation": "Mild cognitive impairment"
}
```

---

# 🏗️ **Frontend Implementation Checklist**

### Components Needed

* TextResponseQuestion
* MultipleChoiceQuestion
* MemoryDisplayQuestion
* AudioRecordingQuestion
* DragAndDropSequenceQuestion
* DrawingCanvasQuestion
* ImageQuestion
* InstructionQuestion

### Extra behaviors

* Timer for memory display
* Delayed recall sequencing
* Case-insensitive scoring
* Semantic validation for writing
* File uploads for drawing
